import { answerCallbacks, bot } from "bot";
import { sendMessage } from ".";
import {
  getBaseTokenMetadata,
  getPairInformation,
  getSolanaTokenMetadata,
} from "blockchain/monitor/library/scan-api";
import { numberWithCommas } from "utils";
import config from "config.json";
import {
  checkSolTransaction,
  sendSol,
  transferSplToken,
} from "utils/blockchain";
import { getRoundSolAmount, getTimeDiff, isUrl } from "utils/helper";
import { startBuyHandler } from "blockchain/monitor/library";
import {
  AdController,
  AdSettingController,
  RevenueSplitController,
} from "controller";

export let advertiseInfo = {} as any;

export const showAdvertise = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = advertiseInfo[chatId]?.groupId;
  if (groupId) {
    try {
      const isExist = await AdController.findOne({
        filter: {
          creator: chatId.toString(),
          groupId: groupId.toString(),
        },
      });
      if (isExist) {
        advertiseInfo[chatId] = {
          ...advertiseInfo[chatId],
          creator: chatId.toString(),
          groupId: groupId.toString(),
        };
        await sendMessage({
          id: chatId,
          message: "<b>You already purchased advertise in this group.</b>",
          keyboards: [
            [{ text: "❌ Delete Ad", callback_data: "deleteadvertise" }],
          ],
        });
      } else {
        await sendMessage({
          id: chatId,
          message: "<b>Please select the correct chain below:</b>",
          keyboards: [
            [
              { text: "Base chain", callback_data: "baseadvertise" },
              { text: "Solana", callback_data: "solanaadvertise" },
            ],
          ],
        });
      }
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

export const inputTokenPairAddress = async (msg: any) => {
  const chatId = msg.chat.id;
  const chain = advertiseInfo[chatId]?.chain;
  if (chain) {
    await sendMessage({
      id: chatId,
      message: `<b>Please input token pair address on ${chain} chain:</b>`,
    });
    answerCallbacks[chatId] = async function (answer: any) {
      const pairAddress = answer.text;
      const pair = await getPairInformation(chain, pairAddress);
      if (pair && pair?.pair) {
        advertiseInfo[chatId] = {
          ...advertiseInfo[chatId],
          pairAddress: pairAddress,
        };
        await sendMessage({
          id: chatId,
          message: "<b>Please input description:</b>",
        });
        await inputDescription(msg);
      } else {
        await sendMessage({
          id: chatId,
          message: "<b>Invalid token pair address.</b>",
        });
        await inputTokenPairAddress(msg);
      }
    };
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>You didn't choose chain.</b>",
    });
    await showAdvertise(msg);
  }
};

export const inputDescription = async (msg: any) => {
  const chatId = msg.chat.id;
  try {
    answerCallbacks[chatId] = async function (answer: any) {
      let description = answer.text;
      if (description.trim().length < 5 || description.trim().length > 200) {
        await sendMessage({
          id: chatId,
          message:
            "<b>Invalid text length. Minimum is 5 and Maximum is 200 characters. Please provide the correct description again:</b>",
        });
        await inputDescription(msg);
      } else {
        advertiseInfo[chatId] = {
          ...advertiseInfo[chatId],
          description: description,
        };
        await sendMessage({
          id: chatId,
          message: "📷 <b>Please attach your image/video.</b>",
        });
        await setMedia(msg);
      }
    };
  } catch (err) {
    console.log(err);
  }
};

export const setMedia = async (msg: any) => {
  const chatId = msg.chat.id;
  answerCallbacks[chatId] = async function (answer: any) {
    const isPhoto = answer.photo?.length > 0;
    const isVideo = answer.video || answer.document || answer.animation;
    if (isPhoto || isVideo) {
      if (isPhoto) {
        advertiseInfo[chatId] = {
          ...advertiseInfo[chatId],
          mediaType: "image",
          mediaId: answer.photo[0]?.file_id,
        };
      } else {
        advertiseInfo[chatId] = {
          ...advertiseInfo[chatId],
          mediaType: "video",
          mediaId:
            answer.video?.file_id ||
            answer.document?.file_id ||
            answer.animation?.file_id,
        };
      }
      await sendMessage({
        id: chatId,
        message: "<b>Please provide website url:</b>",
      });
      await addWebsite(msg);
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Invalid image or video. Please provide media again.</b>",
      });
      await setMedia(msg);
    }
  };
};

export const addWebsite = async (msg: any) => {
  const chatId = msg.chat.id;
  answerCallbacks[chatId] = async function (answer: any) {
    let website = answer.text;
    if (isUrl(website)) {
      advertiseInfo[chatId] = {
        ...advertiseInfo[chatId],
        website: website,
      };
      await sendMessage({
        id: chatId,
        message: "<b>Please provide telegram group link:</b>",
      });
      await addTelegramGroup(msg);
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>Invalid url. Please input the correct url.</b>",
      });
    }
  };
};

export const addTelegramGroup = async (msg: any) => {
  const chatId = msg.chat.id;
  answerCallbacks[chatId] = async function (answer: any) {
    let link = answer.text;
    if (link.startsWith("https://t.me/")) {
      advertiseInfo[chatId] = {
        ...advertiseInfo[chatId],
        link: link,
      };
      const pair = await getPairInformation(
        advertiseInfo[chatId]?.chain,
        advertiseInfo[chatId]?.pairAddress
      );
      let metadata;
      if (advertiseInfo[chatId]?.chain === "base") {
        metadata = await getBaseTokenMetadata(pair?.pair?.baseToken?.address);
      } else {
        metadata = await getSolanaTokenMetadata(pair?.pair?.baseToken?.address);
      }
      const marketcap =
        (Number(pair?.pair?.priceUsd) * Number(metadata?.totalSupply)) /
        10 ** Number(metadata?.decimals);
      if (advertiseInfo[chatId]?.mediaType === "image") {
        await bot.sendPhoto(chatId, advertiseInfo[chatId]?.mediaId, {
          caption: `${advertiseInfo[chatId]?.description}

💲 <b>$${pair?.pair?.baseToken?.symbol}</b>
↪️ <b>Price $${pair?.pair?.priceUsd}</b>
⬆️ <b>Volume 24H: $${pair?.pair?.volume?.h24}</b>
💰 <b>Market Cap $${numberWithCommas(Number(marketcap), 3)}</b>

<b>Group: </b>${advertiseInfo[chatId]?.link}
📊 <a href="${pair?.pair?.url}">Chart</a> ${
            advertiseInfo[chatId]?.chain === "base"
              ? `🦄 <a href='https://app.uniswap.org/'>Buy</a>`
              : `🪙 <a href='https://jup.ag/'>Buy</a>`
          }`,
          parse_mode: "HTML",
        });
      } else {
        await bot.sendVideo(chatId, advertiseInfo[chatId]?.mediaId, {
          caption: `${advertiseInfo[chatId]?.description}

💲 <b>$${pair?.pair?.baseToken?.symbol}</b>
↪️ <b>Price $${pair?.pair?.priceUsd}</b>
⬆️ <b>Volume 24H: $${pair?.pair?.volume?.h24}</b>
💰 <b>Market Cap $${numberWithCommas(Number(marketcap), 3)}</b>

<b>Website: </b>${advertiseInfo[chatId]?.website}
<b>Group: </b>${advertiseInfo[chatId]?.link}
📊 <a href="${pair?.pair?.url}">Chart</a> ${
            advertiseInfo[chatId]?.chain === "base"
              ? `🦄 <a href='https://app.uniswap.org/'>Buy</a>`
              : `🪙 <a href='https://jup.ag/'>Buy</a>`
          }`,
          parse_mode: "HTML",
        });
      }
      await sendMessage({
        id: chatId,
        message: "<b>Please select your plan:</b>",
        keyboards: [
          [{ text: "1 sponsored post", callback_data: "package1" }],
          [
            {
              text: "10 sponsored posts",
              callback_data: "package2",
            },
          ],
          [
            {
              text: "25 sponsored posts",
              callback_data: "package3",
            },
          ],
          [
            {
              text: "50 sponsored posts",
              callback_data: "package4",
            },
          ],
        ],
      });
    } else {
      await sendMessage({
        id: chatId,
        message:
          "<b>Invalid telegram group link. Please provide the correct link:</b>",
      });
      await addTelegramGroup(msg);
    }
  };
};

export const chooseToken = async (msg: any, type: string) => {
  const chatId = msg.chat.id;
  const groupId = advertiseInfo[chatId]?.groupId;
  if (groupId) {
    try {
      const adInfo = (await AdSettingController.findOne({
        filter: { groupId: groupId.toString() },
      })) as any;
      let peke;
      let sol;
      if (adInfo) {
        switch (type) {
          case "package1":
            advertiseInfo[chatId] = {
              ...advertiseInfo[chatId],
              package: "package1",
              count: 1,
            };
            peke = adInfo.package1.peke;
            sol = adInfo.package1.sol;
            break;
          case "package2":
            advertiseInfo[chatId] = {
              ...advertiseInfo[chatId],
              package: "package2",
              count: 10,
            };
            peke = adInfo.package2.peke;
            sol = adInfo.package2.sol;
            break;
          case "package3":
            advertiseInfo[chatId] = {
              ...advertiseInfo[chatId],
              package: "package3",
              count: 25,
            };
            peke = adInfo.package3.peke;
            sol = adInfo.package3.sol;
            break;
          case "package4":
            advertiseInfo[chatId] = {
              ...advertiseInfo[chatId],
              package: "package4",
              count: 50,
            };
            peke = adInfo.package4.peke;
            sol = adInfo.package4.sol;
            break;
          default:
            break;
        }
        await sendMessage({
          id: chatId,
          message: "<b>Please select token to pay.</b>",
          keyboards: [
            [
              { text: `${peke} PEKE`, callback_data: `payPEKE:${peke}` },
              { text: `${sol} SOL`, callback_data: `paySOL:${sol}` },
            ],
          ],
        });
      } else {
        await sendMessage({
          id: chatId,
          message:
            "<b>Group Admin didn't set package settings yet. Please ask to group.</b>",
        });
      }
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

export const inputHash = async (msg: any, type: string, amount: number) => {
  const chatId = msg.chat.id;
  const groupId = advertiseInfo[chatId]?.groupId;
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

        const isHash = await AdController.findOne({ filter: { hash: hash } });

        if (isHash) {
          await sendMessage({
            id: chatId,
            message:
              "<b>This transaction was already used before. Please use another transaction hash.</b>",
          });
          await inputHash(msg, type, amount);
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
            console.log("🚀 ~ camount:", camount);
            console.log("🚀 ~ amount:", amount);

            if (Number(camount) < Number(amount)) {
              await sendMessage({
                id: chatId,
                message: "<b>Received payment is not enough.</b>",
              });
              await inputHash(msg, type, amount);
            } else if (getTimeDiff(result.blockTime) > 5) {
              await sendMessage({
                id: chatId,
                message: "<b>You didn't pay in 5 minutes.</b>",
              });
              await inputHash(msg, type, amount);
            } else {
              const data: AdInterface = {
                creator: chatId.toString(),
                groupId: groupId.toString(),
                chain: advertiseInfo[chatId]?.chain,
                description: advertiseInfo[chatId]?.description,
                count: advertiseInfo[chatId]?.count,
                package: advertiseInfo[chatId]?.package,
                hash: hash,
                website: advertiseInfo[chatId]?.website,
                link: advertiseInfo[chatId]?.link,
                pairAddress: advertiseInfo[chatId]?.pairAddress,
                mediaId: advertiseInfo[chatId]?.mediaId,
                mediaType: advertiseInfo[chatId]?.mediaType,
              };

              await AdController.create(data);
              await sendMessage({
                id: chatId,
                message: "<b>You purchased advertise successfully.</b>",
              });

              const admin = await AdSettingController.findOne({
                filter: { groupId: groupId.toString() },
              });

              if (admin) {
                let peke = 0;
                let sol = 0;
                const revenusplits = await RevenueSplitController.findOne({
                  filter: { creator: config.ownerId.toString() },
                });
                if (revenusplits) {
                  peke = revenusplits.peke;
                  sol = revenusplits.sol;
                }
                let transferAmount = 0;
                if (type === "PEKE") {
                  if (peke > 0) {
                    transferAmount = (Number(result.amount) * peke) / 100;
                  } else {
                    transferAmount = Number(result.amount) * 0.7;
                  }
                } else {
                  if (sol > 0) {
                    transferAmount = (Number(result.amount) * sol) / 100;
                  } else {
                    transferAmount = Number(result.amount) * 0.6;
                  }
                }
                if (type === "PEKE") {
                  const tx = await transferSplToken(
                    config.ownerPrivateKey,
                    config.pekeAddress,
                    admin.address,
                    Number(transferAmount)
                  );
                  if (tx) {
                    await sendMessage({
                      id: Number(admin.creator),
                      message: `<b>Someone purchased advertise in your group. You received reward.
Please click <a href="https://solscan.io/tx/${tx}">here</a> to check transaction.</b>`,
                    });
                  }
                } else {
                  const tx = await sendSol(
                    Number(transferAmount),
                    admin.address,
                    config.ownerPrivateKey
                  );
                  if (tx) {
                    await sendMessage({
                      id: Number(admin.creator),
                      message: `<b>Someone purchased advertise in your group. You received reward.
Please click <a href="https://solscan.io/tx/${tx}">here</a> to check transaction.</b>`,
                    });
                  }
                }
                delete advertiseInfo[chatId];
              } else {
                delete advertiseInfo[chatId];
              }
              await startBuyHandler();
            }
          } else {
            await sendMessage({
              id: chatId,
              message:
                "<b>Invalid hash. Please use another transaction hash</b>",
            });
            await inputHash(msg, type, amount);
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

export const deleteAdvertise = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = advertiseInfo[chatId]?.groupId;
  if (groupId) {
    try {
      await AdController.deleteOne({
        filter: {
          creator: chatId.toString(),
          groupId: groupId.toString(),
        },
      });
      await sendMessage({
        id: chatId,
        message: "<b>You deleted advertise successfully.</b>",
      });
    } catch (err) {
      console.log(err);
    }
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>Please start again from the group.</b>",
    });
  }
};
