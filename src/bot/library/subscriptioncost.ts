import { answerCallbacks } from "bot";
import { sendMessage } from ".";
import { TokenCostController } from "controller";

export const setSubscriptionCost = async (msg: any) => {
  try {
    const chatId = msg.chat.id;
    await sendMessage({
      id: chatId,
      message: `<b>Please input PEKE and SOL amount like this 5000000 0.1:</b>`,
    });
    answerCallbacks[chatId] = async function (answer: any) {
      const value = answer.text;
      const amounts = value.split(" ");
      if (amounts.length > 1) {
        const peke = Number(amounts[0]);
        const sol = Number(amounts[1]);
        if (peke > 0 && sol > 0) {
          const tokenCost = await TokenCostController.findOne({
            filter: { creator: chatId.toString() },
          });
          if (tokenCost) {
            await TokenCostController.update({
              filter: { creator: chatId.toString() },
              update: { peke: peke, sol: sol },
            });
            await sendMessage({
              id: chatId,
              message: "<b>You updated token costs for subscription.</b>",
            });
          } else {
            await TokenCostController.create({
              creator: chatId.toString(),
              peke: peke,
              sol: sol,
            });
            await sendMessage({
              id: chatId,
              message: "<b>You created token costs for subscription.</b>",
            });
          }
        } else {
          await sendMessage({
            id: chatId,
            message: "<b>Invalid parameter.</b>",
          });
          await setSubscriptionCost(msg);
        }
      } else {
        await sendMessage({ id: chatId, message: "<b>Invalid parameter.</b>" });
        await setSubscriptionCost(msg);
      }
    };
  } catch (err) {
    console.log("Error :", err);
  }
};
