import { sendMessage } from "bot/library";
import { setRevenueSplitPercentage } from "bot/library/revenuesplit";
import config from "config.json";
import { RevenueSplitController } from "controller";

const { Commands } = require("../index.ts");

export default new Commands(
  new RegExp(/^\/setuprevenuesplit/),
  "Set revenue split percentage in advertisement.",
  "setuprevenuesplit",
  true,
  async (msg: any) => {
    const chatId = msg.chat.id;
    const fromGroup = chatId !== msg.from.id;
    let message: SendMessageInterface;
    if (fromGroup) {
      message = {
        id: chatId,
        message: "<b>This command can only be used in DM.</b>",
      };
      await sendMessage(message);
    } else if (chatId !== config.ownerId) {
      message = {
        id: chatId,
        message: "<b>You are not bot owner.</b>",
      };
      await sendMessage(message);
    } else {
      const revenuesplits = await RevenueSplitController.findOne({
        filter: {
          creator: chatId.toString(),
        },
      });
      if (revenuesplits) {
        const PEKE = revenuesplits.peke;
        const SOL = revenuesplits.sol;
        await sendMessage({
          id: chatId,
          message: `<b>Current revenue split percentage: ${PEKE}% PEKE, ${SOL}% SOL</b>`,
        });
      }
      await setRevenueSplitPercentage(msg);
    }
  }
);
