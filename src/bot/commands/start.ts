import { sendMessage } from "bot/library";
import { editInfo, showList } from "bot/library/token";
import { chartInfo, editChartInfo, showChartList } from "bot/library/chart";
import { bot } from "bot";
import { advertiseInfo, showAdvertise } from "bot/library/advertise";
import {
  setupAdvertisementSettings,
  showPackages,
} from "bot/library/setupadvertisement";
import { AdSettingController } from "controller";

const { Commands } = require("../index.ts");

export default new Commands(
  new RegExp(/^\/start/),
  "Start Bot",
  "start",
  true,
  async (msg: any) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const params = text.replace("/start", "").trim();
    const fromGroup = params.indexOf("groupId") > -1;
    const setChart = params.indexOf("groupIdForChart") > -1;
    const setAd = params.indexOf("groupIdForAdvertise") > -1;
    const setupAdvertisement = params.indexOf("groupIdsetupAdvertisement") > -1;
    const setupWhaleAlert = params.indexOf("groupIdWhaleSetup") > -1;
    console.log(msg.from.username);
    console.log(msg.from.id);

    if (!fromGroup) {
      await sendMessage({
        id: chatId,
        message: `👋 <b>Welcome to Solana & Base Chain Buy Bot.</b>
<b>All commands are avialable from group. To add token in your group, please use /setupbuybot command in group.</b>`,
      });
    }

    if (fromGroup) {
      const groupId = setChart
        ? params.replace("groupIdForChart=", "")
        : setAd
        ? params.replace("groupIdForAdvertise=", "")
        : setupAdvertisement
        ? params.replace("groupIdsetupAdvertisement=", "")
        : setupWhaleAlert
        ? params.replace("groupIdWhaleSetup=", "")
        : params.replace("groupId=", "");
      const admins = await bot.getChatAdministrators(groupId);
      const hasPermission = admins.some((admin) => admin.user.id === chatId);

      editInfo[chatId] = {
        groupId: groupId.toString(),
      };

      if (setAd) {
        advertiseInfo[chatId] = {
          groupId: groupId.toString(),
        };
        await showAdvertise(msg);
      }

      if (hasPermission) {
        if (setChart) {
          editChartInfo[chatId] = {
            ...editChartInfo[chatId],
            groupId: groupId.toString(),
          };

          chartInfo[chatId] = {
            ...chartInfo[chatId],
            groupId: groupId.toString(),
          };
          await showChartList(msg);
        } else if (setupAdvertisement) {
          setupAdvertisementSettings[chatId] = {
            ...setupAdvertisementSettings[chatId],
            groupId: groupId,
          };
          const adsetting = await AdSettingController.findOne({
            filter: { groupId: groupId.toString() },
          });

          if (adsetting) {
            setupAdvertisementSettings[chatId] = {
              ...setupAdvertisementSettings[chatId],
              address: adsetting?.address,
              package1: adsetting?.package1,
              package2: adsetting?.package2,
              package3: adsetting?.package3,
              package4: adsetting?.package4,
            };
          }
          await showPackages(msg);
        } else if (setupWhaleAlert) {
        } else if (!setAd) {
          await showList(msg);
        }
      } else {
        await sendMessage({
          id: chatId,
          message: "<b>You don't have permission.</>",
        });
      }
    }
  }
);
