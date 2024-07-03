// import { sendMessage } from "bot/library";
// import config from "config.json";

// const { Commands } = require("../index.ts");

// export default new Commands(
//   new RegExp(/^\/setupwhalealertbot/),
//   "Track whales trade",
//   "setupwhalealertbot",
//   true,
//   async (msg: any) => {
//     const chatId = msg.chat.id;
//     const fromGroup = chatId !== msg.from.id;
//     let message: SendMessageInterface;
//     if (!fromGroup) {
//       message = {
//         id: chatId,
//         message: "<b>This command can only be used in groups.</b>",
//       };
//     } else {
//       message = {
//         id: chatId,
//         message: `🛠 <b>Click button below to add your token for buy bot.</b>`,
//         keyboards: [
//           [
//             {
//               text: "➡️ Setup Whale Alert Bot",
//               url: config.botUrl + "?start=groupIdWhaleSetup=" + chatId,
//             },
//           ],
//         ],
//       };
//     }
//     await sendMessage(message);
//   }
// );
