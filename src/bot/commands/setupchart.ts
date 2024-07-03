import { sendMessage } from "bot/library";
import config from "config.json";

const { Commands } = require("../index.ts");

export default new Commands(
  new RegExp(/^\/setupchart/),
  "Setup chart bot",
  "setupchart",
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
        message: `🛠 <b>Click button below to setup your chart bot.</b>`,
        keyboards: [
          [
            {
              text: "➡️ Setup Chart Bot",
              url: config.botUrl + "?start=groupIdForChart=" + chatId,
            },
          ],
        ],
      };
    }
    await sendMessage(message);
  }
);
