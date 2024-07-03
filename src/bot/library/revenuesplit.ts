import { answerCallbacks } from "bot";
import { sendMessage } from ".";
import { RevenueSplitController } from "controller";

export const setRevenueSplitPercentage = async (msg: any) => {
  try {
    const chatId = msg.chat.id;
    await sendMessage({
      id: chatId,
      message: `<b>Please input PEKE and SOL revenue split percentage like this
70 60</b>`,
    });
    answerCallbacks[chatId] = async function (answer: any) {
      const value = answer.text;
      const amounts = value.split(" ");
      if (amounts.length > 1) {
        const peke = Number(amounts[0]);
        const sol = Number(amounts[1]);
        if (peke > 0 && sol > 0) {
          const revenuesplit = await RevenueSplitController.findOne({
            filter: { creator: chatId.toString() },
          });
          if (revenuesplit) {
            await RevenueSplitController.update({
              filter: { creator: chatId.toString() },
              update: { peke: peke, sol: sol },
            });
            await sendMessage({
              id: chatId,
              message:
                "<b>You updated revenue split percentage for advertisement.</b>",
            });
          } else {
            await RevenueSplitController.create({
              creator: chatId.toString(),
              peke: peke,
              sol: sol,
            });
            await sendMessage({
              id: chatId,
              message:
                "<b>You created revenue split percentage for advertisement.</b>",
            });
          }
        } else {
          await sendMessage({
            id: chatId,
            message: "<b>Invalid parameter.</b>",
          });
          await setRevenueSplitPercentage(msg);
        }
      } else {
        await sendMessage({ id: chatId, message: "<b>Invalid parameter.</b>" });
        await setRevenueSplitPercentage(msg);
      }
    };
  } catch (err) {
    console.log("Error :", err);
  }
};
