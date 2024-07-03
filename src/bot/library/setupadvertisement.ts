import AdsettingController from "controller/adsettingcontroller";
import { sendMessage } from ".";
import { answerCallbacks } from "bot";
import { isSolanaAddress } from "utils/blockchain";

export let setupAdvertisementSettings = {} as any;

export const showPackages = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = setupAdvertisementSettings[chatId]?.groupId;

  if (groupId) {
    await sendMessage({
      id: chatId,
      message: `<b>If users pay using PEKE, you will receive 70% and if users pay using SOL, you will receive 60% from bot owner.
Please change package settings below:</b>`,
      keyboards: [
        [
          {
            text: "1 sponsored post",
            callback_data: "package1setting",
          },
        ],
        [
          {
            text: "10 sponsored posts",
            callback_data: "package2setting",
          },
        ],
        [
          {
            text: "25 sponsored posts",
            callback_data: "package3setting",
          },
        ],
        [
          {
            text: "50 sponsored posts",
            callback_data: "package4setting",
          },
        ],
        [
          {
            text: `${
              setupAdvertisementSettings[chatId]?.address || "Wallet Address"
            }`,
            callback_data: "adminwallet",
          },
        ],
        [
          {
            text: "Save settings",
            callback_data: "saveadsetting",
          },
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

export const inputWalletAddress = async (msg: any) => {
  const chatId = msg.chat.id;
  const groupId = setupAdvertisementSettings[chatId]?.groupId;

  if (groupId) {
    setupAdvertisementSettings[chatId] = {
      ...setupAdvertisementSettings[chatId],
      creator: chatId.toString(),
      groupId: groupId.toString(),
    };

    await sendMessage({
      id: chatId,
      message: "<b>Please input your Solana wallet address to receive pay:</b>",
    });
    answerCallbacks[chatId] = async function (answer: any) {
      let address = answer.text;
      const isWallet = await isSolanaAddress(address);
      if (isWallet) {
        const isExist = await AdsettingController.findOne({
          filter: { address: address, groupId: { $ne: groupId.toString() } },
        });
        if (isExist) {
          await sendMessage({
            id: chatId,
            message: "<b>This wallet already used.</b>",
          });
          await inputWalletAddress(msg);
        } else {
          setupAdvertisementSettings[chatId] = {
            ...setupAdvertisementSettings[chatId],
            address: address,
          };
          await showPackages(msg);
        }
      } else {
        await sendMessage({
          id: chatId,
          message: "<b>Invalid wallet address.</b>",
        });
        await inputWalletAddress(msg);
      }
    };
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
  }
};

export const showPackageSetting = async (msg: any, type: string) => {
  const chatId = msg.chat.id;
  const groupId = setupAdvertisementSettings[chatId]?.groupId;

  if (groupId) {
    await sendMessage({
      id: chatId,
      message: `Please input PEKE and SOL amount for package setting.
For example: 50000 0.009`,
    });
    answerCallbacks[chatId] = async function (answer: any) {
      let text = answer.text;
      const amounts = text.split(" ");
      if (amounts.length > 1) {
        const peke = Number(amounts[0]);
        const sol = Number(amounts[1]);
        if (peke > 0 && sol > 0) {
          switch (type) {
            case "package1setting":
              setupAdvertisementSettings[chatId] = {
                ...setupAdvertisementSettings[chatId],
                package1: {
                  peke,
                  sol,
                },
              };
              break;
            case "package2setting":
              setupAdvertisementSettings[chatId] = {
                ...setupAdvertisementSettings[chatId],
                package2: {
                  peke,
                  sol,
                },
              };
              break;
            case "package3setting":
              setupAdvertisementSettings[chatId] = {
                ...setupAdvertisementSettings[chatId],
                package3: {
                  peke,
                  sol,
                },
              };
              break;
            case "package4setting":
              setupAdvertisementSettings[chatId] = {
                ...setupAdvertisementSettings[chatId],
                package4: {
                  peke,
                  sol,
                },
              };
              break;
            default:
              break;
          }
          await showPackages(msg);
        } else {
          await sendMessage({
            id: chatId,
            message: "<b>Invalid parameter.</b>",
          });
          await showPackageSetting(msg, type);
        }
      } else {
        await sendMessage({ id: chatId, message: "<b>Invalid parameter.</b>" });
        await showPackageSetting(msg, type);
      }
    };
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
  }
};

export const saveAdSetting = async (msg: any) => {
  const chatId = msg.chat.id;
  setupAdvertisementSettings[chatId] = {
    ...setupAdvertisementSettings[chatId],
    creator: chatId.toString(),
  };
  const settingInfo = setupAdvertisementSettings[chatId];
  const groupId = settingInfo?.groupId;

  if (groupId) {
    if (
      settingInfo?.address &&
      settingInfo?.package1 &&
      settingInfo?.package2 &&
      settingInfo?.package3 &&
      settingInfo?.package4
    ) {
      const isExist = await AdsettingController.findOne({
        filter: { groupId: groupId.toString() },
      });
      if (isExist) {
        try {
          await AdsettingController.update({
            filter: {
              groupId: groupId.toString(),
            },
            update: {
              creator: chatId.toString(),
              groupId: groupId.toString(),
              address: settingInfo?.address,
              package1: settingInfo?.package1,
              package2: settingInfo?.package2,
              package3: settingInfo?.package3,
              package4: settingInfo?.package4,
            },
          });
          await sendMessage({
            id: chatId,
            message:
              "<b>Advertise setting information was update successfully.</b>",
          });
          delete setupAdvertisementSettings[chatId];
        } catch (err) {
          console.log(err);
        }
      } else {
        try {
          await AdsettingController.create({
            creator: chatId.toString(),
            groupId: groupId.toString(),
            address: settingInfo?.address,
            package1: settingInfo?.package1,
            package2: settingInfo?.package2,
            package3: settingInfo?.package3,
            package4: settingInfo?.package4,
          });
          await sendMessage({
            id: chatId,
            message:
              "<b>Advertise setting information was created successfully.</b>",
          });
        } catch (err) {
          console.log(err);
        }
      }
    } else {
      await sendMessage({
        id: chatId,
        message: "<b>You didn't provide all package settings.</b>",
      });
      await showPackages(msg);
    }
  } else {
    await sendMessage({
      id: chatId,
      message: "<b>This command can only be used from groups.</b>",
    });
  }
};
