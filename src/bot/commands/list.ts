import { sendMessage } from "bot/library";
import { editInfo, showList } from "bot/library/token";
import config from "config.json";
const { Commands } = require("../index.ts");

export default new Commands(
  new RegExp(/^\/list/),
  "Get Token List",
  "list",
  true,
  async (msg: any) => {
    const chatId = msg.chat.id;
    const fromGroup = chatId !== msg.from.id;
    let message: SendMessageInterface;
    const groupId = editInfo[chatId]?.groupId;
    if (groupId) {
      await showList(msg);
    } else {
      if (!fromGroup) {
        message = {
          id: chatId,
          message: "<b>This command can only be used from groups</b>",
        };
      } else {
        message = {
          id: chatId,
          message: `🛠 <b>Click button below to see your token list</b>`,
          keyboards: [
            [
              {
                text: "➡️ Token List",
                url: config.botUrl + "?start=groupId=" + chatId,
              },
            ],
          ],
        };
      }
      await sendMessage(message);
    }
  }
);
