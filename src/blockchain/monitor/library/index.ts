import setlog from "utils/setlog";
import {
  ChartController,
  TokenController,
  TwitterController,
} from "controller";
import { baseEventHandler, solanaEventHandler } from "blockchain/handler";
import { chartHandleEvent } from "blockchain/util";
import { currentTime } from "utils/helper";
import { sendMessage } from "bot/library";
import moment from "moment";
import cron from "node-cron";

let tokens: TokenInterface[] = [];
let charts: ChartInterface[] = [];
export let cronjobs: any[] = [];

const updatePairAddresses = async () => {
  try {
    const _tokens = (await TokenController.find({
      filter: {
        groupId: { $ne: "" },
        pairAddress: { $ne: "" },
      },
    })) as TokenInterface[];
    tokens = _tokens;
  } catch (err) {
    console.log(err);
    setlog("updatePairAddresses", err.message);
  }
};

const updateChartInfos = async () => {
  try {
    const _charts = (await ChartController.find({
      filter: {
        groupId: { $ne: "" },
        pairAddress: { $ne: "" },
      },
    })) as ChartInterface[];
    charts = _charts;
  } catch (err) {
    console.log(err);
    setlog("updatePairAddresses", err.message);
  }
};

const buyEventHandler = async () => {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token && token.pairName && token.groupId) {
      if (token.chainId === "base") {
        baseEventHandler(token);
      } else {
        solanaEventHandler(token);
      }
    }
  }
};

const chartEventHandler = async () => {
  for (let i = 0; i < charts.length; i++) {
    chartHandleEvent({ chartInfo: charts[i] as ChartInterface, times: 10 });
  }
};

const startBuyHandler = async () => {
  tokens = [];
  charts = [];

  if (cronjobs.length > 0) {
    for (let i = 0; i < cronjobs.length; i++) {
      await cronjobs[i].stop();
    }
  }

  await updatePairAddresses();
  await updateChartInfos();
  buyEventHandler();
  chartEventHandler();
};

const subscriptionHandler = async () => {
  const handleSubscription = async () => {
    const twitters = await TwitterController.find({
      filter: { groupId: { $ne: "" } },
    });

    if (twitters.length > 0) {
      for (let i = 0; i < twitters.length; i++) {
        const twitter = twitters[i];
        if (twitter.expiredTime < currentTime()) {
          await sendMessage({
            id: Number(twitter.creator),
            message: "<b>Your twitter subscription was just expired.</b>",
          });
          await TwitterController.deleteOne({
            filter: { groupId: twitter.groupId },
          });
        } else {
          if (currentTime() > twitter.expiredTime - 24 * 60 * 60 * 3) {
            await sendMessage({
              id: Number(twitter.creator),
              message: `<b>Your twitter subscription will be expired at ${moment(
                twitter.expiredTime * 1000
              ).format("MMM Do YYYY - HH:mm:ss")}</b>`,
            });
          }
        }
      }
    }
  };

  const handleEvent = async () => {
    try {
      cronjobs.push(
        cron.schedule("0 0 * * *", async () => {
          await handleSubscription();
        })
      );
    } catch (err) {
      console.log(err);
    }
  };

  await handleEvent();
};

export { startBuyHandler, subscriptionHandler };
