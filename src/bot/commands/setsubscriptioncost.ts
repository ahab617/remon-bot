import { sendMessage } from "bot/library";
import { setSubscriptionCost } from "bot/library/subscriptioncost";
import config from "config.json";
import { TokenCostController } from "controller";

const { Commands } = require("../index.ts");

export default new Commands(
  new RegExp(/^\/setsubscriptioncost/),
  "Set subscription cost on Twitter for Telegram admins.",
  "setsubscriptioncost",
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
      const tokenCost = await TokenCostController.findOne({
        filter: {
          creator: chatId.toString(),
        },
      });
      if (tokenCost) {
        const PEKE = tokenCost.peke;
        const SOL = tokenCost.sol;
        await sendMessage({
          id: chatId,
          message: `<b>Current subscription cost: ${PEKE} PEKE, ${SOL} SOL</b>`,
        });
      }
      await setSubscriptionCost(msg);
    }
  }
);
