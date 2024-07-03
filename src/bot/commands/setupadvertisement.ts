import { sendMessage } from "bot/library";
import config from "config.json";

const { Commands } = require("../index.ts");

export default new Commands(
  new RegExp(/^\/setupadvertisement/),
  "Setup advertise settings",
  "setupadvertisement",
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
        message: `🛠 <b>Click button below to change advertise.</b>`,
        keyboards: [
          [
            {
              text: "➡️ Setup Advertisement",
              url: config.botUrl + "?start=groupIdsetupAdvertisement=" + chatId,
            },
          ],
        ],
      };
    }
    await sendMessage(message);
  }
);
