import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import config from "config.json";
import { callBackHandler } from "./callback";
import Tokencontroller from "controller/tokencontroller";

export const bot = new TelegramBot(config.botToken, { polling: true });

export let answerCallbacks = {} as any;

bot.on("message", function (message: any) {
  var callback = answerCallbacks[message.chat.id];
  const msgStr = message.text;

  if (message?.new_chat_member) {
    console.log(message?.new_chat_member?.username, "new member");
    if (message?.new_chat_member?.username == config.botname) {
      bot.sendMessage(
        message.chat.id,
        `<b>Hello 👋</b>
<b>I am Solana, Base buy track bot.</b>

<b>To start me as a Bot for this group, please first set your token pair using /add command!</b>
`,
        { parse_mode: "HTML", disable_web_page_preview: true }
      );
    }
  } else if (message?.left_chat_member) {
    Tokencontroller.deleteMany({
      filter: {
        groupId: message?.chat?.id,
      },
    });
  }

  if (msgStr == "/cancel" && callback) {
    delete answerCallbacks[message.chat.id];
    return;
  }

  if (callback) {
    delete answerCallbacks[message.chat.id];
    return callback(message);
  }
});

bot.on("polling_error", console.log);

async function loadCommands() {
  let commands = [] as any;
  for (const vo of fs.readdirSync(__dirname + "/commands")) {
    if (path.extname(vo) === ".ts") {
      if (!fs.lstatSync(__dirname + "/commands/" + vo).isDirectory()) {
        await import("./commands/" + vo).then((module) => {
          const command = module.default;
          bot.onText(command.reg, command.fn);
          if (command.isCommands) {
            commands.push({
              description: command.description,
              command: command.cmd,
            });
          }
          if (command.cb) {
            bot.on("callback_query", command.cb);
          }
        });
      }
    }
  }
  bot
    .setMyCommands(commands)
    .then((res) => {
      console.log(
        `Register bot menu commands${res ? "success" : "fail"} ${
          commands.length
        }个`
      );
    })
    .catch((err) => {
      console.log("The menu command for registering bot is wrong", err.message);
    });
}

async function loadEvents() {
  bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    callBackHandler(msg, action!);
  });
}

export class Commands {
  constructor(
    reg: RegExp,
    description: string,
    cmd: string,
    isCommands: boolean,
    fn: Function,
    cb: Function
  ) {
    this.reg = reg;
    this.description = description;
    this.cmd = cmd;
    this.isCommands = isCommands;
    this.fn = fn;
    this.cb = cb;
  }
  reg: any;
  description: string;
  cmd: string;
  isCommands: boolean;
  fn: Function;
  cb: Function;
}

export const initBot = async () => {
  loadCommands();
  loadEvents();
};
