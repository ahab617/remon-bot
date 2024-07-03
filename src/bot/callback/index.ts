import { sendMessage } from "bot/library";
import {
  advertiseInfo,
  chooseToken,
  deleteAdvertise,
  inputHash,
  inputTokenPairAddress,
} from "bot/library/advertise";
import {
  chartInfo,
  chartPairAddress,
  deleteChart,
  editChart,
  editChartInfo,
  editInputSpikeChange,
  editSaveChart,
  editSelectTime,
  editShowTime,
  inputSpikeChange,
  inputTwitterHash,
  saveChart,
  selectTime,
  setupChartBot,
  showSubscriptionIfttt,
  showSubscriptionTwitter,
  showTime,
  showTwitterOptions,
  twitterInfo,
  updateAppKey,
  updatePremiumPeriod,
} from "bot/library/chart";
import {
  inputWalletAddress,
  saveAdSetting,
  showPackageSetting,
} from "bot/library/setupadvertisement";
import {
  addToken,
  editToken,
  editMedia,
  editEmoji,
  editMin,
  editStep,
  deleteToken,
  tokenInfo,
  editInfo,
  confirmPair,
  botSetup,
} from "bot/library/token";
import { ChartController } from "controller";

export const callBackHandler = async (msg: any, _action: string) => {
  const chatId = msg.chat.id;
  const groupId = tokenInfo[chatId]?.groupId;
  const action = _action.split("_");
  const payAction = _action.split(":");
  const chartAction = _action.split("-");

  let message: SendMessageInterface;

  if (action[1]) {
    editInfo[chatId] = {
      ...editInfo[chatId],
      addr: action[1],
    };
  }

  if (chartAction[1]) {
    editChartInfo[chatId] = {
      ...editChartInfo[chatId],
      addr: chartAction[1],
    };
  }

  switch (action[0]) {
    case "buybotsetup":
      await botSetup(msg);
      break;
    case "base":
      message = {
        id: chatId,
        message: `⚙️ <b>Send the token address to track</b>`,
      };
      await sendMessage(message);
      await addToken(msg, groupId!, "base");
      break;
    case "solana":
      message = {
        id: chatId,
        message: `⚙️ <b>Send the token address to track</b>`,
      };
      await sendMessage(message);
      await addToken(msg, groupId!, "solana");
      break;
    case "editToken":
      await editToken(msg);
      break;
    case "editMedia":
      await editMedia(msg);
      break;
    case "editEmoji":
      await editEmoji(msg);
      break;
    case "editMin":
      await editMin(msg);
      break;
    case "editStep":
      await editStep(msg);
      break;
    case "deleteToken":
      await deleteToken(msg);
      break;
    case "selectPair":
      await confirmPair(msg, action[1]);
      break;
    case "chartbotsetup":
      await setupChartBot(msg);
      break;
    case "basechart":
      chartInfo[chatId] = {
        ...chartInfo[chatId],
        chain: "base",
      };
      await sendMessage({
        id: chatId,
        message:
          "<b>You selected base chain. Please input token pair address:</b>",
      });
      await chartPairAddress(msg);
      break;
    case "solanachart":
      chartInfo[chatId] = {
        ...chartInfo[chatId],
        chain: "solana",
      };
      await sendMessage({
        id: chatId,
        message: "<b>You selected solana. Please input token pair address:</b>",
      });
      await chartPairAddress(msg);
      break;
    case "priceuppercent":
      await inputSpikeChange(msg, "priceuppercent");
      break;
    case "editpriceuppercent":
      await editInputSpikeChange(msg, "editpriceuppercent");
      break;
    case "pricedownpercent":
      await inputSpikeChange(msg, "pricedownpercent");
      break;
    case "editpricedownpercent":
      await editInputSpikeChange(msg, "editpricedownpercent");
      break;
    case "buyamount":
      await inputSpikeChange(msg, "buyamount");
      break;
    case "editbuyamount":
      await editInputSpikeChange(msg, "editbuyamount");
      break;
    case "sellamount":
      await inputSpikeChange(msg, "sellamount");
      break;
    case "editsellamount":
      await editInputSpikeChange(msg, "editsellamount");
      break;
    case "priceuptime":
      await showTime(msg, "priceup");
      break;
    case "editpriceuptime":
      await editShowTime(msg, "editpriceup");
      break;
    case "pricedowntime":
      await showTime(msg, "pricedown");
      break;
    case "editpricedowntime":
      await editShowTime(msg, "editpricedown");
      break;
    case "buytime":
      await showTime(msg, "buy");
      break;
    case "editbuytime":
      await editShowTime(msg, "editbuy");
      break;
    case "selltime":
      await showTime(msg, "sell");
      break;
    case "editselltime":
      await editShowTime(msg, "editsell");
      break;
    case "5min":
      await selectTime(msg, "5min");
      break;
    case "edit5min":
      await editSelectTime(msg, "5min");
      break;
    case "1h":
      await selectTime(msg, "1h");
      break;
    case "edit1h":
      await editSelectTime(msg, "1h");
      break;
    case "6h":
      await selectTime(msg, "6h");
      break;
    case "edit6h":
      await editSelectTime(msg, "6h");
      break;
    case "savechart":
      await saveChart(msg);
      break;
    case "editsavechart":
      await editSaveChart(msg);
      break;
    case "deletechart":
      await deleteChart(msg);
      break;
    case "baseadvertise":
      advertiseInfo[chatId] = {
        ...advertiseInfo[chatId],
        chain: "base",
      };
      await inputTokenPairAddress(msg);
      break;
    case "solanaadvertise":
      advertiseInfo[chatId] = {
        ...advertiseInfo[chatId],
        chain: "solana",
      };
      await inputTokenPairAddress(msg);
      break;
    case "package1setting":
      await showPackageSetting(msg, "package1setting");
      break;
    case "package2setting":
      await showPackageSetting(msg, "package2setting");
      break;
    case "package3setting":
      await showPackageSetting(msg, "package3setting");
      break;
    case "package4setting":
      await showPackageSetting(msg, "package4setting");
      break;
    case "adminwallet":
      await inputWalletAddress(msg);
      break;
    case "saveadsetting":
      await saveAdSetting(msg);
      break;
    case "package1":
      await chooseToken(msg, "package1");
      break;
    case "package2":
      await chooseToken(msg, "package2");
      break;
    case "package3":
      await chooseToken(msg, "package3");
      break;
    case "package4":
      await chooseToken(msg, "package4");
      break;
    case "deleteadvertise":
      await deleteAdvertise(msg);
      break;
    case "twittersubscription":
      await showTwitterOptions(msg);
      break;
    case "twitterAPIkey":
      twitterInfo[chatId] = {
        ...twitterInfo[chatId],
        option: "apikey",
      };
      await showSubscriptionTwitter(msg);
      break;
    case "ifttt":
      twitterInfo[chatId] = {
        ...twitterInfo[chatId],
        option: "ifttt",
      };
      await showSubscriptionIfttt(msg);
      break;
    case "updatekey":
      await updateAppKey(msg);
      break;
    case "updatepremium":
      await updatePremiumPeriod(msg);
      break;
    default:
      break;
  }

  switch (payAction[0]) {
    case "payPEKE":
      await inputHash(msg, "PEKE", Number(payAction[1]));
      break;
    case "paySOL":
      await inputHash(msg, "SOL", Number(payAction[1]));
      break;
    case "payTwitterPEKE":
      await inputTwitterHash(msg, "PEKE", Number(payAction[1]), false);
      break;
    case "payTwitterSOL":
      await inputTwitterHash(msg, "SOL", Number(payAction[1]), false);
      break;
    case "updateTwitterPEKE":
      await inputTwitterHash(msg, "PEKE", Number(payAction[1]), true);
      break;
    case "updateTwitterSOL":
      await inputTwitterHash(msg, "SOL", Number(payAction[1]), true);
      break;
    default:
      break;
  }

  switch (chartAction[0]) {
    case "editChart":
      if (editChartInfo[chatId]?.groupId) {
        const chart = await ChartController.findOne({
          filter: {
            groupId: editChartInfo[chatId]?.groupId.toString(),
            pairAddress: editChartInfo[chatId]?.addr,
          },
        });
        editChartInfo[chatId] = {
          creator: chatId.toString(),
          groupId: chart.groupId,
          chain: chart.chain,
          pairAddress: chart.pairAddress,
          priceUpSpike: chart.priceUpSpike,
          priceUpTime: chart.priceUpTime,
          priceDownSpike: chart.priceDownSpike,
          priceDownTime: chart.priceDownTime,
          buySpike: chart.buySpike,
          buyTime: chart.buyTime,
          sellSpike: chart.sellSpike,
          sellTime: chart.sellTime,
        };
        await editChart(msg);
      } else {
        await sendMessage({
          id: chatId,
          message: "<b>Please start from group again.</b>",
        });
      }
      break;
    default:
      break;
  }
};
