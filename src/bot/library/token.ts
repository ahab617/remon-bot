import { sendMessage } from "./index";
import { answerCallbacks, bot } from "../index";
import { TokenController } from "controller";
import {
  getBaseTokenMetadata,
  getSolanaTokenMetadata,
  getTokenPairs,
} from "blockchain/monitor/library/scan-api";
import { startBuyHandler } from "blockchain/monitor/library";
import { BlockNumController } from "blockchain/controller";
import SolController from "controller/solcontroller";
import { formatAddress } from "utils/helper";

export let tokenInfo = {} as any;
export let editInfo = {} as any;

export const showList = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editInfo[chatId]?.groupId;

  if (groupId) {
    tokenInfo[chatId] = {
      ...tokenInfo[chatId],
      groupId: groupId.toString(),
    };
    const tokens = await TokenController.find({
      filter: { creator: chatId.toString(), groupId: groupId.toString() },
    });

    let message;
    if (tokens.length > 0) {
      message = `<b>🛠 Please click each token below to edit token information.</b>`;
      const keyboards = tokens.map((token: any, index: number) => [
        {
          text: token.pairName + " (" + formatAddress(token.pairAddress) + ")",
          callback_data: `editToken_${token.pairAddress}`,
        },
      ]);
      await sendMessage({
        id: chatId,
        message: message,
        keyboards: [
          ...keyboards,
          [{ text: "Buy Bot Setup", callback_data: "buybotsetup" }],
        ],
      });
    } else {
      message = `<b>🛠 You didn't add any token in this group. Please click the below button to add token.</b>`;
      await sendMessage({
        id: chatId,
        message: message,
        keyboards: [[{ text: "Buy Bot Setup", callback_data: "buybotsetup" }]],
      });
    }
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
  }
};

export const botSetup = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editInfo[chatId]?.groupId;

  if (groupId) {
    tokenInfo[chatId] = {
      ...tokenInfo[chatId],
      groupId: groupId.toString(),
    };
    await sendMessage({
      id: chatId,
      message: `<b>🛠 Bot Setup</b>

<b>Please select the chain of your token below.</b>`,
      keyboards: [
        [
          { text: "Solana", callback_data: "solana" },
          { text: "Base Chain", callback_data: "base" },
        ],
      ],
    });
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
  }
};

// Add Token Information
export const addToken = async (msg: any, groupId: string, chainId: string) => {
  const chatId = msg.chat.id;
  answerCallbacks[chatId] = async function (answer: any) {
    var address = answer.text;
    const pairs = await getTokenPairs(address);
    if (!pairs) {
      await sendMessage({
        id: chatId,
        message: `⚙️ <b>Invalid token address. Please input again.</b>`,
      });
      addToken(msg, groupId, chainId);
    } else if (pairs[0].chainId !== chainId) {
      await sendMessage({
        id: chatId,
        message: `⚙️ <b>The provided token address is not on Base Chain. Please input the correct token address again.</b>`,
      });
      addToken(msg, groupId, chainId);
    } else {
      tokenInfo[chatId] = {
        ...tokenInfo[chatId],
        groupid: groupId,
      };
      await selectPair(msg, address);
    }
  };
};

// Add Token Information
export const selectPair = async (msg: any, address: string) => {
  const chatId = msg.chat.id;
  const pairs = await getTokenPairs(address);

  tokenInfo[chatId] = {
    ...tokenInfo[chatId],
    tokenAddr: address,
    pairs: pairs,
  };
  const keyboards = pairs.map((pair: any, index: number) => [
    {
      text: `${pair.baseToken.symbol} - ${
        pair.quoteToken.symbol
      } (${formatAddress(pair.pairAddress)})`,
      callback_data: `selectPair_${index}`,
    },
  ]);

  await sendMessage({
    id: chatId,
    message: `🔎 <b>Token Found: ${pairs[0].baseToken.symbol}</b>

<b>Select the correct pair from the options below.</b>`,
    keyboards: keyboards,
  });
};

export const confirmPair = async (msg: any, index: string) => {
  const chatId = msg.chat.id;
  const data = tokenInfo[chatId];
  const pairAddress = data?.pairs[index]?.pairAddress || "";
  if (!data || !pairAddress) {
    return await sendMessage({ id: chatId, message: "<b>Invalid Input.</b>" });
  }

  const isExistPair = ((
    await TokenController.find({
      filter: { groupId: data?.groupId, pairAddress: pairAddress },
    })
  )?.length > 0) as boolean;

  if (isExistPair) {
    await sendMessage({
      id: chatId,
      message: "<b>Selected Pair already exists in this group.</b>",
    });
    await selectPair(msg, data.tokenAddr);
  } else {
    const pairs = data?.pairs || [];
    const selectedPair = pairs?.find(
      (_p: any) => _p.pairAddress == pairAddress
    );
    const pairName = `${selectedPair.baseToken.symbol} - ${selectedPair.quoteToken.symbol}`;
    let baseTokenDecimals;
    let quoteTokenDecimals;
    let totalSupply;
    if (selectedPair?.chainId === "base") {
      const baseTokenMetadata = await getBaseTokenMetadata(
        selectedPair?.baseToken.address!
      );
      baseTokenDecimals = Number(baseTokenMetadata.decimals);
      totalSupply = Number(baseTokenMetadata.totalSupply);
      const quoteTokenMetadata = await getBaseTokenMetadata(
        selectedPair?.quoteToken.address!
      );
      quoteTokenDecimals = Number(quoteTokenMetadata.decimals);
    } else if (selectedPair?.chainId === "solana") {
      const baseTokenMetadata = await getSolanaTokenMetadata(
        selectedPair?.baseToken.address!
      );
      baseTokenDecimals = Number(baseTokenMetadata.decimals);
      totalSupply = Number(baseTokenMetadata.totalSupply);

      const quoteTokenMetadata = await getSolanaTokenMetadata(
        selectedPair?.quoteToken.address!
      );
      quoteTokenDecimals = Number(quoteTokenMetadata.decimals);
    }

    tokenInfo[chatId] = {
      ...tokenInfo[chatId],
      pairName: pairName,
      chainId: selectedPair?.chainId,
      pairAddress: selectedPair?.pairAddress,
      dexUrl: selectedPair?.url,
      baseTokenAddress: selectedPair?.baseToken.address,
      baseTokenName: selectedPair?.baseToken.name,
      baseTokenSymbol: selectedPair?.baseToken.symbol,
      baseTokenDecimals: baseTokenDecimals,
      quoteTokenAddress: selectedPair?.quoteToken.address,
      quoteTokenName: selectedPair?.quoteToken.name,
      quoteTokenSymbol: selectedPair?.quoteToken.symbol,
      quoteTokenDecimals: quoteTokenDecimals,
      totalSupply: totalSupply,
    };
    await bot.deleteMessage(chatId, msg.message_id);
    await sendMessage({ id: chatId, message: `<b>Selected ${pairName}</b>` });
    addMedia(msg);
  }
};

const addMedia = async (msg: any) => {
  const chatId = msg.chat.id;
  await sendMessage({
    id: chatId,
    message: "📷 <b>Please attach your image/video.</b>",
  });
  answerCallbacks[chatId] = async function (answer: any) {
    const isPhoto = answer.photo?.length > 0;
    const isVideo = answer.video || answer.document || answer.animation;
    if (isPhoto || isVideo) {
      if (isPhoto) {
        tokenInfo[chatId] = {
          ...tokenInfo[chatId],
          mediaType: "image",
          mediaId: answer.photo[0]?.file_id,
        };
      } else {
        tokenInfo[chatId] = {
          ...tokenInfo[chatId],
          mediaType: "video",
          mediaId:
            answer.video?.file_id ||
            answer.document?.file_id ||
            answer.animation?.file_id,
        };
      }
      await addEmoji(msg);
    } else {
      await addMedia(msg);
    }
  };
};

const addEmoji = async (msg: any) => {
  const chatId = msg.chat.id;
  await sendMessage({
    id: chatId,
    message: "🟢 <b>Please enter your emoji.</b>",
  });
  answerCallbacks[chatId] = async function (answer: any) {
    var emoji = answer.text;
    tokenInfo[chatId] = {
      ...tokenInfo[chatId],
      emoji: emoji,
    };
    await sendMessage({
      id: chatId,
      message: `<b>To filter minimum purchase, enter the minimum USD ($) value. </b>
<b>For example 5.</b>`,
    });
    await addMinAmount(msg);
  };
};

const addMinAmount = async (msg: any) => {
  const chatId = msg.chat.id;
  answerCallbacks[chatId] = async function (answer: any) {
    var amount = answer.text;
    let repeat = false;
    if (!Number(amount) || Number(amount) < 1) repeat = true;
    if (repeat) {
      await sendMessage({
        id: chatId,
        message: "<b>Invalid amount. Min: 1</b>",
      });
      addMinAmount(msg);
      return;
    } else {
      tokenInfo[chatId] = {
        ...tokenInfo[chatId],
        min: amount,
      };
      await sendMessage({
        id: chatId,
        message: "<b>Enter the step USD ($) value.</b>",
      });
      addStepAmount(msg);
    }
  };
};

const addStepAmount = async (msg: any) => {
  const chatId = msg.chat.id;
  answerCallbacks[chatId] = async function (answer: any) {
    var amount = answer.text;
    let repeat = false;
    if (!Number(amount) || Number(amount) < 1) repeat = true;
    if (repeat) {
      await sendMessage({
        id: chatId,
        message: "<b>Invalid amount. Min: 1</b>",
      });
      addStepAmount(msg);
      return;
    } else {
      tokenInfo[chatId] = {
        ...tokenInfo[chatId],
        step: amount,
      };
      confirmAddToken(msg);
    }
  };
};

const confirmAddToken = async (msg: any) => {
  try {
    const chatId = msg.chat.id;
    const data = tokenInfo[chatId];

    await TokenController.create({
      creator: chatId,
      groupId: data.groupId.toString(),
      pairName: data.pairName,
      chainId: data.chainId,
      pairAddress: data.pairAddress,
      dexUrl: data.dexUrl,
      baseTokenAddress: data.baseTokenAddress,
      baseTokenName: data.baseTokenName,
      baseTokenSymbol: data.baseTokenSymbol,
      baseTokenDecimals: data.baseTokenDecimals,
      quoteTokenAddress: data.quoteTokenAddress,
      quoteTokenName: data.quoteTokenName,
      quoteTokenSymbol: data.quoteTokenSymbol,
      quoteTokenDecimals: data.quoteTokenDecimals,
      totalSupply: data.totalSupply,
      mediaType: data.mediaType,
      mediaId: data.mediaId,
      emoji: data.emoji,
      min: data.min,
      step: data.step,
    });
    await sendMessage({
      id: chatId,
      message: `<b>Token added successfully. Please check your token using /list command.</b>`,
    });
    await startBuyHandler();
    delete answerCallbacks[chatId];
  } catch (Err) {
    console.log(Err);
  }
};

// Edit Token Information
export const editToken = async (msg: any) => {
  const chatId = msg.chat.id;
  await sendMessage({
    id: chatId,
    message: `<b>Please edit token information.</b>`,
    keyboards: [
      [
        {
          text: "📷 Media",
          callback_data: "editMedia",
        },
        {
          text: "🟢 Emoji",
          callback_data: "editEmoji",
        },
      ],
      [
        {
          text: "Min (usd)",
          callback_data: "editMin",
        },
        {
          text: "Step (usd)",
          callback_data: "editStep",
        },
      ],
      [
        {
          text: "❌ Delete Token",
          callback_data: "deleteToken",
        },
      ],
    ],
  });
};

export const editMedia = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editInfo[chatId]?.groupId;
  if (!editInfo[chatId] || !groupId) return;
  const pairAddress = editInfo[chatId].addr;
  const token = await TokenController.findOne({
    filter: { chatId: msg.from.id, groupId: groupId, pairAddress: pairAddress },
  });
  if (!token) {
    await sendMessage({ id: chatId, message: "<b>Invalid parameter.</b>" });
  }
  await sendMessage({
    id: chatId,
    message: "📷 <b>Please attach your image/video.</b>",
  });
  answerCallbacks[chatId] = async function (answer: any) {
    const isPhoto = answer.photo?.length > 0;
    const isVideo = answer.video || answer.document || answer.animation;
    if (isPhoto || isVideo) {
      if (isPhoto) {
        answerCallbacks[chatId] = {
          ...editInfo[chatId],
          mediaType: "image",
          mediaId: answer.photo[0]?.file_id,
        };
      } else if (isVideo) {
        answerCallbacks[chatId] = {
          ...editInfo[chatId],
          mediaType: "video",
          mediaId:
            answer.video?.file_id ||
            answer.document?.file_id ||
            answer.animation?.file_id,
        };
      }
      const mediaType = answerCallbacks[chatId].mediaType;
      const mediaId = answerCallbacks[chatId].mediaId;
      await TokenController.update({
        filter: {
          creator: chatId,
          groupId: groupId.toString(),
          pairAddress: token.pairAddress,
        },
        update: { mediaType, mediaId },
      })
        .then(async () => {
          await sendMessage({
            id: chatId,
            message: "👍 <b>Update Media Success.</b>",
          });
          await showList(msg);
          await startBuyHandler();
          delete answerCallbacks[chatId];
        })
        .catch(async (err) => {
          await sendMessage({
            id: chatId,
            message: "🚫 <b>Update Media Failed.</b>",
          });
          delete answerCallbacks[chatId];
          delete editInfo[chatId];
          console.log(err);
        });
    } else {
      await editMedia(msg);
    }
  };
};

export const editEmoji = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editInfo[chatId]?.groupId;
  if (!editInfo[chatId] || !groupId) return;
  const pairAddress = editInfo[chatId].addr;
  const token = await TokenController.findOne({
    filter: {
      chatId: msg.from.id,
      groupId: groupId.toString(),
      pairAddress: pairAddress,
    },
  });
  if (!token) {
    await sendMessage({ id: chatId, message: "<b>Invalid parameter.</b>" });
  }
  await sendMessage({
    id: chatId,
    message: "🟢 <b>Please enter your emoji.</b>",
  });
  answerCallbacks[chatId] = async function (answer: any) {
    var emoji = answer.text;
    await TokenController.update({
      filter: {
        creator: chatId,
        groupId: groupId.toString(),
        pairAddress: pairAddress,
      },
      update: { emoji },
    })
      .then(async () => {
        await sendMessage({
          id: chatId,
          message: "👍 <b>Update Emoji Success.</b>",
        });
        await showList(msg);
        await startBuyHandler();
        delete answerCallbacks[chatId];
      })
      .catch(async (err) => {
        await sendMessage({
          id: chatId,
          message: "🚫 <b>Update Emoji Failed.</b>",
        });
        delete answerCallbacks[chatId];
        delete editInfo[chatId];
        console.log(err);
      });
  };
};

export const editMin = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editInfo[chatId]?.groupId;
  if (!editInfo[chatId] || !groupId) return;
  const pairAddress = editInfo[chatId].addr;
  const token = await TokenController.findOne({
    filter: {
      chatId: msg.from.id,
      groupId: groupId,
      pairAddress: pairAddress,
    },
  });
  if (!token) {
    await sendMessage({ id: chatId, message: "<b>Invalid parameter.</b>" });
  }
  await sendMessage({
    id: chatId,
    message:
      "<b>To filter minimum purchase, enter the minimum USD ($) value.</b>",
  });
  answerCallbacks[chatId] = async function (answer: any) {
    var amount = answer.text;
    let repeat = false;
    if (!Number(amount) || Number(amount) < 1) repeat = true;
    if (repeat) {
      await sendMessage({
        id: chatId,
        message: "<b>Invalid amount. Min: 1</b>",
      });
      repeat = false;
      addMinAmount(msg);
      return;
    }
    await TokenController.update({
      filter: {
        creator: chatId,
        groupId: groupId.toString(),
        pairAddress: pairAddress,
      },
      update: { min: amount || 0 },
    })
      .then(async () => {
        await sendMessage({
          id: chatId,
          message: "👍 <b>Update Min Usd Amount Success.</b>",
        });
        await showList(msg);
        await startBuyHandler();
        delete answerCallbacks[chatId];
      })
      .catch(async (err) => {
        await sendMessage({
          id: chatId,
          message: "🚫 <b>Update Min Usd Amount Failed.</b>",
        });
        delete answerCallbacks[chatId];
        delete editInfo[chatId];
        console.log(err);
      });
  };
};

export const editStep = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editInfo[chatId]?.groupId;
  if (!editInfo[chatId] || !groupId) return;
  const pairAddress = editInfo[chatId].addr;
  const token = await TokenController.findOne({
    filter: {
      chatId: msg.from.id,
      groupId: groupId.toString(),
      pairAddress: pairAddress,
    },
  });
  if (!token) {
    await sendMessage({ id: chatId, message: "<b>Invalid parameter.</b>" });
  }
  await sendMessage({
    id: chatId,
    message: "<b>Enter the step USD ($) value.</b>",
  });
  answerCallbacks[chatId] = async function (answer: any) {
    var amount = answer.text;
    let repeat = false;
    if (!Number(amount) || Number(amount) < 1) repeat = true;
    if (repeat) {
      await sendMessage({
        id: chatId,
        message: "<b>Invalid amount. Min: 1</b>",
      });
      repeat = false;
      addMinAmount(msg);
      return;
    }
    await TokenController.update({
      filter: {
        creator: chatId,
        groupId: groupId.toString(),
        pairAddress: pairAddress,
      },
      update: { step: amount || 0 },
    })
      .then(async () => {
        await sendMessage({
          id: chatId,
          message: "👍 <b>Update Step Usd Amount Success.</b>",
        });
        await showList(msg);
        await startBuyHandler();
        delete answerCallbacks[chatId];
      })
      .catch(async (err) => {
        await sendMessage({
          id: chatId,
          message: "🚫 <b>Update Step Usd Amount Failed.</b>",
        });
        delete answerCallbacks[chatId];
        delete editInfo[chatId];
        console.log(err);
      });
  };
};

export const deleteToken = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = editInfo[chatId]?.groupId;
  if (!editInfo[chatId] || !groupId) return;
  const pairAddress = editInfo[chatId].addr;
  const token = await TokenController.findOne({
    filter: {
      chatId: msg.from.id,
      groupId: groupId.toString(),
      pairAddress: pairAddress,
    },
  });
  if (!token) {
    await sendMessage({ id: chatId, message: "<b>Could not find token.</b>" });
    return;
  }
  const pairName = token.pairName;

  await TokenController.deleteOne({
    filter: {
      creator: chatId,
      groupId: groupId.toString(),
      pairAddress: pairAddress,
    },
  })
    .then(async () => {
      await BlockNumController.deleteOne({
        filter: {
          pairName: pairName + " " + groupId,
        },
      })
        .then(async () => {
          await SolController.deleteMany({
            filter: { groupId: groupId, pairAddress: pairAddress },
          });
          await sendMessage({
            id: chatId,
            message: "👍 <b>Remove Token Success.</b>",
          });
          await showList(msg);
          await startBuyHandler();
          delete answerCallbacks[chatId];
        })
        .catch(async (err) => {
          await sendMessage({
            id: chatId,
            message: "🚫 <b>Remove Token Failed.</b>",
          });
          delete answerCallbacks[chatId];
          delete editInfo[chatId];
          console.log(err);
        });
    })
    .catch(async (err) => {
      await sendMessage({
        id: chatId,
        message: "🚫 <b>Remove Token Failed.</b>",
      });
      delete editInfo[chatId];
      console.log(err);
    });
};
