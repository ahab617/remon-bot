import { answerCallbacks } from "bot";
import { sendMessage } from ".";
import {
  startBuyHandler,
  subscriptionHandler,
} from "blockchain/monitor/library";
import {
  ChartController,
  TokenCostController,
  TwitterController,
} from "controller";
import {
  currentTime,
  formatAddress,
  getRoundSolAmount,
  getTimeDiff,
} from "utils/helper";
import { getPairInformation } from "blockchain/monitor/library/scan-api";
import moment from "moment";
import config from "config.json";
import { checkSolTransaction } from "utils/blockchain";

export let chartInfo = {} as any;
export let editChartInfo = {} as any;
export let twitterInfo = {} as any;

export const showChartList = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = chartInfo[chatId]?.groupId;

  if (groupId) {
    chartInfo[chatId] = {
      ...chartInfo[chatId],
      groupId: groupId,
    };
    const charts = await ChartController.find({
      filter: { groupId: groupId.toString() },
    });

    let message;
    if (charts.length > 0) {
      message = `<b>🛠 Please click each pair button below to edit chart information.</b>`;
      const keyboards = charts.map((chart: any, index: number) => [
        {
          text: formatAddress(chart.pairAddress),
          callback_data: `editChart-${chart.pairAddress}`,
        },
      ]);
      await sendMessage({
        id: chatId,
        message: message,
        keyboards: [
          ...keyboards,
          [{ text: "➕ Setup Chart Bot", callback_data: "chartbotsetup" }],
          [
            {
              text: "📱 Premium (Auto post to Twitter)",
              callback_data: "twittersubscription",
            },
          ],
        ],
      });
    } else {
      message = `<b>🛠 You didn't setup any chart in this group. Please click the below button to setup chart.</b>`;
      await sendMessage({
        id: chatId,
        message: message,
        keyboards: [
          [{ text: "Setup Chart Bot", callback_data: "chartbotsetup" }],
          [
            {
              text: "📱 Premium (Auto post to Twitter)",
              callback_data: "twittersubscription",
            },
          ],
        ],
      });
    }
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
  }
};

export const setupChartBot = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = chartInfo[chatId]?.groupId;

  if (groupId) {
    const charts = await ChartController.find({
      filter: { groupId: groupId.toString() },
    });
    const isPremium = TwitterController.findOne({
      filter: { groupId: groupId.toString() },
    });

    if (isPremium && !(charts.length < 24)) {
      await sendMessage({
        id: chatId,
        message: "<b>Maximum number of tracking pairs for premium is 25.</b>",
      });
    } else if (!isPremium && !(charts.length < 5)) {
      await sendMessage({
        id: chatId,
        message: "<b>Maximum number of tracking pairs for premium is 5.</b>",
      });
    } else {
      chartInfo[chatId] = {
        ...chartInfo[chatId],
        creator: chatId.toString(),
        groupId: groupId.toString(),
      };

      await sendMessage({
        id: chatId,
        message: `<b>🛠 Chart Bot Setup</b>

<b>Please select chain:</b>`,
        keyboards: [
          [
            { text: "Base Chain", callback_data: "basechart" },
            { text: "Solana", callback_data: "solanachart" },
          ],
        ],
      });
    }
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
  }
};

export const chartPairAddress = async (msg: any) => {
  try {
    const chatId = msg.chat.id;
    answerCallbacks[chatId] = async function (answer: any) {
      var pairAddress = answer.text;
      const pair = await getPairInformation(
        chartInfo[chatId]?.chain,
        pairAddress
      );
      if (pair && pair?.pair) {
        const isExist = await ChartController.findOne({
          filter: {
            groupId: chartInfo[chatId]?.groupId,
            pairAddress: pairAddress,
          },
        });

        if (isExist) {
          await sendMessage({
            id: chatId,
            message:
              "<b>This pair already exists in this group. Please provide another pair.</b>",
          });
          await chartPairAddress(msg);
        } else {
          chartInfo[chatId] = {
            ...chartInfo[chatId],
            pairAddress: pairAddress,
          };
          chartSettings(msg);
        }
      } else {
        await sendMessage({
          id: chatId,
          message: "<b>Invalid pair address. Please try again.</b>",
        });
        await chartPairAddress(msg);
      }
    };
  } catch (err) {
    console.log("Error: ", err);
  }
};

export const chartSettings = async (msg: any) => {
  const chatId = msg.chat.id;
  const chartInf = chartInfo[chatId];
  const groupId = chartInf?.groupId;

  if (groupId) {
    const keyboards = [
      [
        {
          text: "Show chart when price will increase a certain percentage",
          callback_data: "static",
        },
      ],
      [
        {
          text: `Percentage (${chartInf?.priceUpSpike || "min is 5"}%)`,
          callback_data: "priceuppercent",
        },
        {
          text: `Within ${chartInf?.priceUpTime || "6h"}`,
          callback_data: "priceuptime",
        },
      ],
      [
        {
          text: "Show chart when price will decrease a certain percentage",
          callback_data: "static",
        },
      ],
      [
        {
          text: `Percentage (${chartInf?.priceDownSpike || "min is 5"}%)`,
          callback_data: "pricedownpercent",
        },
        {
          text: `Within ${chartInf?.priceDownTime || "6h"}`,
          callback_data: "pricedowntime",
        },
      ],
      [
        {
          text: "Show chart when buy orders spike a certain percentage",
          callback_data: "static",
        },
      ],
      [
        {
          text: `Amount of buys (${chartInf?.buySpike || "minimum 25"})`,
          callback_data: "buyamount",
        },
        {
          text: `Within ${chartInf?.buyTime || "6h"}`,
          callback_data: "buytime",
        },
      ],
      [
        {
          text: "Show chart when sell orders spike a certain percentage",
          callback_data: "static",
        },
      ],
      [
        {
          text: `Amount of sells (${chartInf?.sellSpike || "minimum 25"})`,
          callback_data: "sellamount",
        },
        {
          text: `Within ${chartInf?.sellTime || "6h"}`,
          callback_data: "selltime",
        },
      ],
      [{ text: "Save settings", callback_data: "savechart" }],
    ];
    await sendMessage({
      id: chatId,
      message: "<b>Change settings for chart:</b>",
      keyboards: keyboards,
    });
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
    delete chartInfo[chatId];
  }
};

export const inputSpikeChange = async (msg: any, type: string) => {
  const chatId = msg.chat.id;
  const chartInf = chartInfo[chatId];
  const groupId = chartInf?.groupId;
  if (groupId) {
    var changeSpike: string;
    var minSpike: number;
    if (type === "priceuppercent" || type === "pricedownpercent") {
      changeSpike = "percentage";
      minSpike = 5;
    } else if (type === "buyamount" || type === "sellamount") {
      changeSpike = "amount";
      minSpike = 25;
    }
    await sendMessage({
      id: chatId,
      message: `<b>Please input the certain ${changeSpike}:</b>`,
    });
    answerCallbacks[chatId] = async function (answer: any) {
      var spike = answer.text;
      if (!Number(spike) || Number(spike) < minSpike) {
        await sendMessage({
          id: chatId,
          message: `<b>Invalid parameter. Minimum value is ${minSpike}.</b>`,
        });
        inputSpikeChange(msg, type);
        return;
      } else {
        switch (type) {
          case "priceuppercent":
            chartInfo[chatId] = {
              ...chartInfo[chatId],
              priceUpSpike: spike,
            };
            break;
          case "pricedownpercent":
            chartInfo[chatId] = {
              ...chartInfo[chatId],
              priceDownSpike: spike,
            };
            break;
          case "buyamount":
            chartInfo[chatId] = {
              ...chartInfo[chatId],
              buySpike: spike,
            };
            break;
          case "sellamount":
            chartInfo[chatId] = {
              ...chartInfo[chatId],
              sellSpike: spike,
            };
            break;
          default:
            break;
        }
        chartSettings(msg);
      }
    };
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
    delete chartInfo[chatId];
  }
};

export const showTime = async (msg: any, type: string) => {
  const chatId = msg.chat.id;
  chartInfo[chatId] = {
    ...chartInfo[chatId],
    spikeType: type,
  };
  await sendMessage({
    id: chatId,
    message: "<b>Please select time:</b>",
    keyboards: [
      [
        { text: "5 minutes", callback_data: "5min" },
        { text: "1 hour", callback_data: "1h" },
        { text: "6 hours", callback_data: "6h" },
      ],
    ],
  });
};

export const selectTime = async (msg: any, time: string) => {
  const chatId = msg.chat.id;
  const spikeType = chartInfo[chatId]?.spikeType;
  try {
    if (spikeType) {
      switch (spikeType) {
        case "priceup":
          chartInfo[chatId] = {
            ...chartInfo[chatId],
            priceUpTime: time,
          };
          break;
        case "pricedown":
          chartInfo[chatId] = {
            ...chartInfo[chatId],
            priceDownTime: time,
          };
          break;
        case "buy":
          chartInfo[chatId] = {
            ...chartInfo[chatId],
            buyTime: time,
          };
          break;
        case "sell":
          chartInfo[chatId] = {
            ...chartInfo[chatId],
            sellTime: time,
          };
          break;
        default:
          break;
      }
      await sendMessage({
        id: chatId,
        message: `<b>You selected ${time}</b>`,
      });
      await chartSettings(msg);
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>You didn't select spike type.</b>",
      });
    }
  } catch (err) {
    console.log(err);
  }
};

export const saveChart = async (msg: any) => {
  const chatId = msg.chat.id;
  const chartInf = chartInfo[chatId];
  if (chartInf?.groupId) {
    if (
      !chartInf?.priceUpSpike ||
      !chartInf?.priceUpTime ||
      !chartInf?.priceDownSpike ||
      !chartInf?.priceDownTime ||
      !chartInf?.buySpike ||
      !chartInf?.buyTime ||
      !chartInf?.sellSpike ||
      !chartInf?.sellTime
    ) {
      await sendMessage({
        id: chatId,
        message: "<b>You didn't provide all settings. Please check again:</b>",
      });
      await chartSettings(msg);
    } else {
      delete chartInfo[chatId].spikeType;
      await ChartController.create(chartInfo[chatId]);
      await sendMessage({
        id: chatId,
        message: "<b>Chart settings saved successfully.</b>",
      });
      await showChartList(msg);
      delete chartInfo[chatId];
      await startBuyHandler();
    }
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
    delete chartInfo[chatId];
  }
};

export const editChart = async (msg: any) => {
  try {
    const chatId = msg.chat.id;
    const groupId = editChartInfo[chatId]?.groupId;

    const editChartInf = editChartInfo[chatId];

    if (groupId) {
      const keyboards = [
        [
          {
            text: "Show chart when price will increase a certain percentage",
            callback_data: "static",
          },
        ],
        [
          {
            text: `Percentage (${editChartInf?.priceUpSpike || "min is 5"}%)`,
            callback_data: "editpriceuppercent",
          },
          {
            text: `Within ${editChartInf?.priceUpTime || "6h"}`,
            callback_data: "editpriceuptime",
          },
        ],
        [
          {
            text: "Show chart when price will decrease a certain percentage",
            callback_data: "static",
          },
        ],
        [
          {
            text: `Percentage (${editChartInf?.priceDownSpike || "min is 5"}%)`,
            callback_data: "editpricedownpercent",
          },
          {
            text: `Within ${editChartInf?.priceDownTime || "6h"}`,
            callback_data: "editpricedowntime",
          },
        ],
        [
          {
            text: "Show chart when buy orders spike a certain percentage",
            callback_data: "static",
          },
        ],
        [
          {
            text: `Amount of buys (${editChartInf?.buySpike || "minimum 25"})`,
            callback_data: "editbuyamount",
          },
          {
            text: `Within ${editChartInf?.buyTime || "6h"}`,
            callback_data: "editbuytime",
          },
        ],
        [
          {
            text: "Show chart when sell orders spike a certain percentage",
            callback_data: "static",
          },
        ],
        [
          {
            text: `Amount of sells (${
              editChartInf?.sellSpike || "minimum 25"
            })`,
            callback_data: "editsellamount",
          },
          {
            text: `Within ${editChartInf?.sellTime || "6h"}`,
            callback_data: "editselltime",
          },
        ],
        [{ text: "Save settings", callback_data: "editsavechart" }],
        [{ text: "Delete chart", callback_data: "deletechart" }],
      ];
      await sendMessage({
        id: chatId,
        message: "<b>Change settings for chart:</b>",
        keyboards: keyboards,
      });
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>This command can only be used from groups.</b>",
      });
      delete editChartInfo[chatId];
    }
  } catch (err) {
    console.log(err);
  }
};

export const editInputSpikeChange = async (msg: any, type: string) => {
  const chatId = msg.chat.id;
  const editChartInf = editChartInfo[chatId];
  const groupId = editChartInf?.groupId;
  if (groupId) {
    var changeSpike: string;
    var minSpike: number;
    if (type === "editpriceuppercent" || type === "editpricedownpercent") {
      changeSpike = "percentage";
      minSpike = 5;
    } else if (type === "editbuyamount" || type === "editsellamount") {
      changeSpike = "amount";
      minSpike = 25;
    }
    await sendMessage({
      id: chatId,
      message: `<b>Please input the certain ${changeSpike}:</b>`,
    });
    answerCallbacks[chatId] = async function (answer: any) {
      var spike = answer.text;
      if (!Number(spike) || Number(spike) < minSpike) {
        await sendMessage({
          id: chatId,
          message: `<b>Invalid parameter. Minimum value is ${minSpike}.</b>`,
        });
        editInputSpikeChange(msg, type);
        return;
      } else {
        switch (type) {
          case "editpriceuppercent":
            editChartInfo[chatId] = {
              ...editChartInfo[chatId],
              priceUpSpike: spike,
            };
            break;
          case "editpricedownpercent":
            editChartInfo[chatId] = {
              ...editChartInfo[chatId],
              priceDownSpike: spike,
            };
            break;
          case "editbuyamount":
            editChartInfo[chatId] = {
              ...editChartInfo[chatId],
              buySpike: spike,
            };
            break;
          case "editsellamount":
            editChartInfo[chatId] = {
              ...editChartInfo[chatId],
              sellSpike: spike,
            };
            break;
          default:
            break;
        }
        editChart(msg);
      }
    };
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
    delete editChartInfo[chatId];
  }
};

export const editShowTime = async (msg: any, type: string) => {
  const chatId = msg.chat.id;
  editChartInfo[chatId] = {
    ...editChartInfo[chatId],
    spikeType: type,
  };
  await sendMessage({
    id: chatId,
    message: "<b>Please select time:</b>",
    keyboards: [
      [
        { text: "5 minutes", callback_data: "edit5min" },
        { text: "1 hour", callback_data: "edit1h" },
        { text: "6 hours", callback_data: "edit6h" },
      ],
    ],
  });
};

export const editSelectTime = async (msg: any, time: string) => {
  const chatId = msg.chat.id;
  const spikeType = editChartInfo[chatId]?.spikeType;
  try {
    if (spikeType) {
      switch (spikeType) {
        case "editpriceup":
          editChartInfo[chatId] = {
            ...editChartInfo[chatId],
            priceUpTime: time,
          };
          break;
        case "editpricedown":
          editChartInfo[chatId] = {
            ...editChartInfo[chatId],
            priceDownTime: time,
          };
          break;
        case "editbuy":
          editChartInfo[chatId] = {
            ...editChartInfo[chatId],
            buyTime: time,
          };
          break;
        case "editsell":
          editChartInfo[chatId] = {
            ...editChartInfo[chatId],
            sellTime: time,
          };
          break;
        default:
          break;
      }
      await sendMessage({
        id: chatId,
        message: `<b>You selected ${time}</b>`,
      });
      await editChart(msg);
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>You didn't select spike type.</b>",
      });
    }
  } catch (err) {
    console.log(err);
  }
};

export const editSaveChart = async (msg: any) => {
  const chatId = msg.chat.id;
  const editChartInf = editChartInfo[chatId];
  if (editChartInf?.groupId) {
    if (
      !editChartInf?.priceUpSpike ||
      !editChartInf?.priceUpTime ||
      !editChartInf?.priceDownSpike ||
      !editChartInf?.priceDownTime ||
      !editChartInf?.buySpike ||
      !editChartInf?.buyTime ||
      !editChartInf?.sellSpike ||
      !editChartInf?.sellTime
    ) {
      await sendMessage({
        id: chatId,
        message: "<b>You didn't provide all settings. Please check again:</b>",
      });
      await editChart(msg);
    } else {
      delete editChartInfo[chatId].spikeType;
      await ChartController.update({
        filter: {
          groupId: editChartInfo[chatId].groupId,
          pairAddress: editChartInfo[chatId].pairAddress,
        },
        update: editChartInfo[chatId],
      });
      await sendMessage({
        id: chatId,
        message: "<b>Chart settings updated successfully.</b>",
      });
      await showChartList(msg);
      await startBuyHandler();
    }
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
    delete editChartInfo[chatId];
  }
};

export const deleteChart = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editChartInfo[chatId]?.groupId;
  const pairAddress = editChartInfo[chatId]?.pairAddress;
  if (groupId) {
    try {
      await ChartController.deleteOne({
        filter: { groupId: groupId.toString(), pairAddress: pairAddress },
      });
      await sendMessage({
        id: chatId,
        message: "<b>Chart settings deleted successfully.</b>",
      });
      await showChartList(msg);
      delete editChartInfo[chatId];
      await startBuyHandler();
    } catch (err) {
      console.log("Error when delete chart setting");
    }
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>Please start from group.</b>",
    });
  }
};

export const showTwitterOptions = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editChartInfo[chatId]?.groupId;
  try {
    if (groupId) {
      const tokenCost = await TokenCostController.findOne({
        filter: { creator: config.ownerId.toString() },
      });
      if (tokenCost && tokenCost?.peke && tokenCost?.sol) {
        twitterInfo[chatId] = {
          ...twitterInfo[chatId],
          creator: chatId.toString(),
          groupId: groupId,
        };
        const T = await TwitterController.findOne({
          filter: { groupId: groupId.toString() },
        });

        if (T) {
          if (T.option === "apikey") {
            await sendMessage({
              id: chatId,
              message: `<b>You already subscribed premium. It will be expired at ${moment(
                T.expiredTime * 1000
              ).format("MMM Do YYYY - HH:mm:ss")}</b>
<b>Please choose option what will you update.</b>`,
              keyboards: [
                [{ text: "Update Key", callback_data: "updatekey" }],
                [
                  {
                    text: "🔄 Update premium period",
                    callback_data: "updatepremium",
                  },
                ],
              ],
            });
          } else {
            await sendMessage({
              id: chatId,
              message: `<b>You already subscribed premium. It will be expired at ${moment(
                T.expiredTime * 1000
              ).format("MMM Do YYYY - HH:mm:ss")}</b>`,
              keyboards: [
                [
                  {
                    text: "🔄 Update premium period",
                    callback_data: "updatepremium",
                  },
                ],
              ],
            });
          }
        } else {
          await sendMessage({
            id: chatId,
            message:
              "<b>Please choose option to post automatically to Twitter.</b>",
            keyboards: [
              [
                {
                  text: "Use Twitter API keys",
                  callback_data: "twitterAPIkey",
                },
              ],
              [{ text: "Use IFTTT", callback_data: "ifttt" }],
            ],
          });
        }
      } else {
        await sendMessage({
          id: chatId,
          message: "<b>Bot owner didn't set price yet.</b>",
        });
      }
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

export const showSubscriptionTwitter = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editChartInfo[chatId]?.groupId;
  try {
    if (groupId) {
      await sendMessage({
        id: chatId,
        message:
          "<b>Please input App Key from your Twitter Developer Portal.</b>",
      });
      await inputAppKey(msg);
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

export const updatePremiumPeriod = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = twitterInfo[chatId]?.groupId;
  try {
    if (groupId) {
      const tokenCost = await TokenCostController.findOne({
        filter: { creator: config.ownerId.toString() },
      });

      const peke = tokenCost.peke;
      const sol = tokenCost.sol;

      const keyboards = [
        [
          {
            text: `${peke} PEKE`,
            callback_data: `updateTwitterPEKE:${peke}`,
          },
          {
            text: `${sol} SOL`,
            callback_data: `updateTwitterSOL:${sol}`,
          },
        ],
      ];
      await sendMessage({
        id: chatId,
        message: "<b>Please choose token what you will pay.</b>",
        keyboards: keyboards,
      });
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

export const showSubscriptionIfttt = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editChartInfo[chatId]?.groupId;
  try {
    if (groupId) {
      await sendMessage({
        id: chatId,
        message: `<b>Please follow steps to use ifttt for your auto twitter post.</b>
<b>First do .....</b>
<b>If you finished all steps, please pay</b>`,
      });
      const tokenCost = await TokenCostController.findOne({
        filter: { creator: config.ownerId.toString() },
      });

      const peke = tokenCost.peke;
      const sol = tokenCost.sol;

      const keyboards = [
        [
          {
            text: `${peke} PEKE`,
            callback_data: `payTwitterPEKE:${peke}`,
          },
          { text: `${sol} SOL`, callback_data: `payTwitterSOL:${sol}` },
        ],
      ];
      await sendMessage({
        id: chatId,
        message: "<b>Please choose token what you will pay.</b>",
        keyboards: keyboards,
      });
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

export const inputAppKey = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = twitterInfo[chatId]?.groupId;
  try {
    if (groupId) {
      answerCallbacks[chatId] = async function (answer: any) {
        const appKey = answer.text;
        twitterInfo[chatId] = {
          ...twitterInfo[chatId],
          appKey: appKey,
        };
        await sendMessage({
          id: chatId,
          message:
            "<b>Please input App Secret from your Twitter Developer Portal.</b>",
        });
        await inputAppSecret(msg);
      };
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

const inputAppSecret = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = twitterInfo[chatId]?.groupId;
  try {
    if (groupId) {
      answerCallbacks[chatId] = async function (answer: any) {
        const appSecret = answer.text;
        twitterInfo[chatId] = {
          ...twitterInfo[chatId],
          appSecret: appSecret,
        };
        await sendMessage({
          id: chatId,
          message:
            "<b>Please input Access Token from your Twitter Developer Portal. Please notice that you have to provided Read/Write available token.</b>",
        });
        await inputAccessToken(msg);
      };
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

const inputAccessToken = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = twitterInfo[chatId]?.groupId;
  try {
    if (groupId) {
      answerCallbacks[chatId] = async function (answer: any) {
        const accessToken = answer.text;
        twitterInfo[chatId] = {
          ...twitterInfo[chatId],
          accessToken: accessToken,
        };
        await sendMessage({
          id: chatId,
          message:
            "<b>Please input Access Token Secret from your Twitter Developer Portal. Please notice that you have to provided Read/Write available token.</b>",
        });
        await inputAccessTokenSecret(msg);
      };
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

const inputAccessTokenSecret = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = twitterInfo[chatId]?.groupId;
  try {
    if (groupId) {
      answerCallbacks[chatId] = async function (answer: any) {
        const accessSecret = answer.text;
        twitterInfo[chatId] = {
          ...twitterInfo[chatId],
          accessSecret: accessSecret,
        };
        const tokenCost = await TokenCostController.findOne({
          filter: { creator: config.ownerId.toString() },
        });

        const peke = tokenCost.peke;
        const sol = tokenCost.sol;

        const keyboards = [
          [
            {
              text: `${peke} PEKE`,
              callback_data: `payTwitterPEKE:${peke}`,
            },
            { text: `${sol} SOL`, callback_data: `payTwitterSOL:${sol}` },
          ],
        ];
        await sendMessage({
          id: chatId,
          message: "<b>Please choose token what you will pay.</b>",
          keyboards: keyboards,
        });
      };
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

export const inputTwitterHash = async (
  msg: any,
  type: string,
  amount: number,
  update: boolean
) => {
  const chatId = msg.chat.id;
  const groupId = twitterInfo[chatId]?.groupId;
  if (groupId) {
    try {
      await sendMessage({
        id: chatId,
        message: `<b>Please send ${amount} ${type} to <code>${config.ownerAddr}</code>
And then please input transaction hash in 5 mins.</b>`,
      });
      answerCallbacks[chatId] = async function (answer: any) {
        const hash = answer.text.replace("https://solscan.io/tx/", "");

        await sendMessage({
          id: chatId,
          message: "<b>Checking transaction hash...</b>",
        });
        const isHash = await TwitterController.findOne({
          filter: { hash: hash },
        });

        if (isHash) {
          await sendMessage({
            id: chatId,
            message:
              "<b>This transaction was already used before. Please use another transaction hash.</b>",
          });
          await inputTwitterHash(msg, type, amount, update);
        } else {
          var result;
          if (type === "PEKE") {
            result = await checkSolTransaction(
              hash,
              config.ownerAddr,
              config.pekeAddress
            );
          } else {
            result = await checkSolTransaction(hash, config.ownerAddr);
          }

          if (result) {
            const camount = getRoundSolAmount(result.amount);
            if (Number(camount) < Number(amount)) {
              await sendMessage({
                id: chatId,
                message: "<b>Received payment is not enough.</b>",
              });
              await inputTwitterHash(msg, type, amount, update);
            } else if (getTimeDiff(result.blockTime) > 5) {
              await sendMessage({
                id: chatId,
                message: "<b>You didn't pay in 5 minutes.</b>",
              });
              await inputTwitterHash(msg, type, amount, update);
            } else {
              const data: TwitterInterface = {
                creator: chatId.toString(),
                groupId: groupId.toString(),
                appKey: twitterInfo[chatId]?.appKey || "",
                appSecret: twitterInfo[chatId]?.appSecret || "",
                accessToken: twitterInfo[chatId]?.accessToken || "",
                accessSecret: twitterInfo[chatId]?.accessSecret || "",
                option: twitterInfo[chatId]?.option,
                hash: hash,
                expiredTime: currentTime() + 24 * 60 * 60 * 30,
              };
              if (update) {
                await TwitterController.update({
                  filter: { groupId: groupId.toString() },
                  update: {
                    creator: chatId.toString(),
                    expiredTime: currentTime() + 24 * 60 * 60 * 30,
                  },
                });
              } else {
                await TwitterController.create(data);
              }

              await sendMessage({
                id: chatId,
                message:
                  "<b>You subscribed premium successfully. You can track 25 token pairs and also can post on Twitter automatically.</b>",
              });

              delete twitterInfo[chatId];
              await subscriptionHandler();
            }
          } else {
            await sendMessage({
              id: chatId,
              message:
                "<b>Invalid hash. Please use another transaction hash</b>",
            });
            await inputTwitterHash(msg, type, amount, update);
          }
        }
      };
    } catch (err) {
      console.log("Advertise Error");
    }
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>You can purchase advertise from only groups.</b>",
    });
  }
};

export const updateAppKey = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = twitterInfo[chatId]?.groupId;
  try {
    if (groupId) {
      await sendMessage({
        id: chatId,
        message:
          "<b>Please input App Key from your Twitter Developer Portal.</b>",
      });
      answerCallbacks[chatId] = async function (answer: any) {
        const appKey = answer.text;
        twitterInfo[chatId] = {
          ...twitterInfo[chatId],
          appKey: appKey,
        };
        await sendMessage({
          id: chatId,
          message:
            "<b>Please input App Secret from your Twitter Developer Portal.</b>",
        });
        await updateAppSecret(msg);
      };
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

const updateAppSecret = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = twitterInfo[chatId]?.groupId;
  try {
    if (groupId) {
      answerCallbacks[chatId] = async function (answer: any) {
        const appSecret = answer.text;
        twitterInfo[chatId] = {
          ...twitterInfo[chatId],
          appSecret: appSecret,
        };
        await sendMessage({
          id: chatId,
          message:
            "<b>Please input Access Token from your Twitter Developer Portal. Please notice that you have to provided Read/Write available token.</b>",
        });
        await updateAccessToken(msg);
      };
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

const updateAccessToken = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = twitterInfo[chatId]?.groupId;
  try {
    if (groupId) {
      answerCallbacks[chatId] = async function (answer: any) {
        const accessToken = answer.text;
        twitterInfo[chatId] = {
          ...twitterInfo[chatId],
          accessToken: accessToken,
        };
        await sendMessage({
          id: chatId,
          message:
            "<b>Please input Access Token Secret from your Twitter Developer Portal. Please notice that you have to provided Read/Write available token.</b>",
        });
        await updateAccessTokenSecret(msg);
      };
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};

const updateAccessTokenSecret = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = twitterInfo[chatId]?.groupId;
  try {
    if (groupId) {
      answerCallbacks[chatId] = async function (answer: any) {
        const accessSecret = answer.text;
        twitterInfo[chatId] = {
          ...twitterInfo[chatId],
          accessSecret: accessSecret,
        };
        const data = {
          creator: chatId.toString(),
          appKey: twitterInfo[chatId]?.appKey || "",
          appSecret: twitterInfo[chatId]?.appSecret || "",
          accessToken: twitterInfo[chatId]?.accessToken || "",
          accessSecret: twitterInfo[chatId]?.accessSecret || "",
        };
        await TwitterController.update({
          filter: { groupId: groupId.toString() },
          update: data,
        });
        await sendMessage({
          id: chatId,
          message: "<b>You updated keys successfully.</b>",
        });
        delete twitterInfo[chatId];
      };
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Please start from group.</b>",
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
};
