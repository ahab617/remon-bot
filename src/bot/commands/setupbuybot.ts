import { sendMessage } from "bot/library";
import config from "config.json";

const { Commands } = require("../index.ts");

export default new Commands(
  new RegExp(/^\/setupbuybot/),
  "Track buys of a token live",
  "setupbuybot",
  true,
  async (msg: any) => {
    const chatId = msg.chat.id;
    const fromGroup = chatId !== msg.from.id;
    let message: SendMessageInterface;
    if (!fromGroup) {
      message = {
        id: chatId,
        message: "<b>This command can only be used in groups.</b>",
      };
    } else {
      message = {
        id: chatId,
        message: `🛠 <b>Click button below to add your token for buy bot.</b>`,
        keyboards: [
          [
            {
              text: "➡️ Setup Buy Bot",
              url: config.botUrl + "?start=groupId=" + chatId,
            },
          ],
        ],
      };
    }
    await sendMessage(message);
  }
);
