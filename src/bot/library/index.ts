import config from "../../config.json";
import { numberWithCommas } from "utils";
import { bot } from "../index";
import {
  getBaseTokenMetadata,
  getPairInformation,
  getSolanaTokenMetadata,
} from "blockchain/monitor/library/scan-api";
import { AdController, TwitterController } from "controller";
import { TwitterApi } from "twitter-api-v2";
import request from "request";
import fs from "fs";

export const sendMessage = async ({
  id,
  message,
  preview = true,
  keyboards,
}: SendMessageInterface) => {
  try {
    await bot?.sendMessage(id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: preview,
      reply_markup: {
        inline_keyboard: keyboards,
      },
    });
  } catch (err) {
    console.log(err);
    console.log("send message error", id, message);
  }
};

export const postMessageWithMedia = async (data: GroupMessageInterface) => {
  try {
    let emoji = data.emoji;
    for (let i = 0; i < data.repeatNumber; i++) {
      emoji += data.emoji;
    }
    if (emoji.length > 120) emoji = emoji.substring(0, 120);
    const newHolder = data.isNewHolder ? `\n⬆️ <b>New Holder</b>` : "";

    let message = `<b><a href="${
      data.chain === "base" ? config.baseTokenScanUrl : config.solTokenScanUrl
    }/${data.tokenAddress}">${data.tokenSymbol}</a> Buy!</b>
${emoji}

💲 <b>$${numberWithCommas(data.usdAmount, 3)}</b>
↪️ <b>${numberWithCommas(data.tokenAmount, 3)} ${data.tokenSymbol}</b>
👤 <a href="${
      data.chain === "base" ? config.baseAddressUrl : config.solAddressUrl
    }/${data.buyer}">Buyer</a> / <a href="${
      data.chain === "base" ? config.baseTxScanUrl : config.solTxScanUrl
    }/${data.hash}">TX</a>${newHolder}
💰 <b>Market Cap $${numberWithCommas(Number(data.marketcap), 3)}</b>

📊 <a href="${data.chartLink}">Chart</a> ${
      data.chain === "base" ? "🦄" : "🪙"
    } <a href="${data.buyLink}">Buy</a> 🔥 <b>By ${config.ownerChannel}</b>`;

    if (data.type === "image") {
      await bot.sendPhoto(data.groupId, data.mediaId, {
        caption: message,
        parse_mode: "HTML",
      });
    } else {
      await bot.sendVideo(data.groupId, data.mediaId, {
        caption: message,
        parse_mode: "HTML",
      });
    }

    return true;
  } catch (Err) {
    console.log(Err);
    console.log("postMessageWithMedia sending error");
    return false;
  }
};

export const postMessageForSpike = async (
  data: SpikeInterface,
  ad?: AdInterface
) => {
  try {
    const Twitter = await TwitterController.findOne({
      filter: { groupId: data.groupId.toString() },
    });

    if (Twitter) {
      if (Twitter.option === "ifttt") {
        let spike =
          data.spikeType === "priceuppercent" ||
          data.spikeType === "pricedownpercent"
            ? numberWithCommas(data.spike)
            : numberWithCommas(Math.trunc(data.spike));
        await sendMessage({
          id: Number(data.groupId),
          message: `/ifttt
<b>Charts by: ${config.ownerChannel}</b>

<b>$${
            data.spikeType === "priceuppercent"
              ? "Increase Price"
              : data.spikeType === "pricedownpercent"
              ? "Decrease Price"
              : data.spikeType === "buyamount"
              ? "Buy"
              : "Sell"
          } Spike!$</b>

💲 <b>$${data.symbol}</b>
↪️ <b>${
            data.spikeType === "priceuppercent"
              ? "Price went up"
              : data.spikeType === "pricedownpercent"
              ? "Price went down"
              : data.spikeType === "buyamount"
              ? "Lot of buying"
              : "Lot of selling"
          }</b>
💵 <b>${
            data.spikeType === "priceuppercent" ||
            data.spikeType === "pricedownpercent"
              ? `${data.spike}%`
              : `${spike}+`
          }</b>
🕔 <b>Within ${data.time}</b>
☑️ <b>Market Cap $${numberWithCommas(Number(data.marketcap))}</b>

📊 <a href="${data.url}">Chart</a> | ${
            data.chain === "base"
              ? "🦄 <a href='https://app.uniswap.org'>Buy</a>"
              : "🪙 <a href='https://jup.ag/'>Buy</a>"
          }`,
          keyboards: [
            [
              {
                text: ">>Advertise here",
                url:
                  config.botUrl +
                  "?start=groupIdForAdvertise=" +
                  Number(data.groupId),
              },
            ],
          ],
          preview: false,
        });

        if (ad) {
          try {
            const pair = await getPairInformation(ad.chain, ad.pairAddress);
            let metadata;
            if (ad.chain === "base") {
              metadata = await getBaseTokenMetadata(
                pair?.pair?.baseToken?.address
              );
            } else {
              metadata = await getSolanaTokenMetadata(
                pair?.pair?.baseToken?.address
              );
            }
            const marketcap =
              (Number(pair?.pair?.priceUsd) * Number(metadata?.totalSupply)) /
              10 ** Number(metadata?.decimals);
            const content = `💲 <b>$${pair?.pair?.baseToken?.symbol}</b>
↪️ <b>Price $${pair?.pair?.priceUsd}</b>
⬆️ <b>Volume 24H: $${pair?.pair?.volume?.h24}</b>
💰 <b>Market Cap $${numberWithCommas(Number(marketcap), 3)}</b>

<b>Group: </b>${ad.link}
📊 <a href="${pair?.pair?.url}">Chart</a> ${
              ad.chain === "base"
                ? `🦄 <a href='https://app.uniswap.org/'>Buy</a>`
                : `🪙 <a href='https://jup.ag/'>Buy</a>`
            }`;
            if (ad.mediaType === "image") {
              await bot.sendPhoto(Number(ad.groupId), ad.mediaId, {
                caption: `/ifttt
<b>Sponsored Post</b>

${ad.description}

${content}`,
                parse_mode: "HTML",
              });
            } else {
              await bot.sendVideo(Number(ad.groupId), ad.mediaId, {
                caption: `/ifttt
<b>Sponsored Post</b>
              
${ad.description}

${content}`,
                parse_mode: "HTML",
              });
            }
            console.log("Ad here ******************", ad);
            if (ad.count < 2) {
              console.log("🚀 ~ ad.count < 2:", ad.count);
              await sendMessage({
                id: Number(ad.creator),
                message: "<b>Your advertise was just expired.</b>",
              });
              await AdController.deleteOne({
                filter: { creator: ad.creator, groupId: ad.groupId },
              });
            } else {
              console.log("🚀 ~ ad.count < 2:", ad.count);
              await AdController.update({
                filter: { creator: ad.creator, groupId: ad.groupId },
                update: {
                  count: ad.count - 1,
                },
              });
            }
          } catch (err) {
            console.log(err);
            console.log("postMessageForPriceSpike sending error");
            return false;
          }
        }
      } else {
        let spike =
          data.spikeType === "priceuppercent" ||
          data.spikeType === "pricedownpercent"
            ? numberWithCommas(data.spike)
            : numberWithCommas(Math.trunc(data.spike));
        await sendMessage({
          id: Number(data.groupId),
          message: `<b>Charts by: ${config.ownerChannel}</b>

<b>$${
            data.spikeType === "priceuppercent"
              ? "Increase Price"
              : data.spikeType === "pricedownpercent"
              ? "Decrease Price"
              : data.spikeType === "buyamount"
              ? "Buy"
              : "Sell"
          } Spike!$</b>

💲 <b>$${data.symbol}</b>
↪️ <b>${
            data.spikeType === "priceuppercent"
              ? "Price went up"
              : data.spikeType === "pricedownpercent"
              ? "Price went down"
              : data.spikeType === "buyamount"
              ? "Lot of buying"
              : "Lot of selling"
          }</b>
💵 <b>${
            data.spikeType === "priceuppercent" ||
            data.spikeType === "pricedownpercent"
              ? `${data.spike}%`
              : `${spike}+`
          }</b>
🕔 <b>Within ${data.time}</b>
☑️ <b>Market Cap $${numberWithCommas(Number(data.marketcap))}</b>

📊 <a href="${data.url}">Chart</a> | ${
            data.chain === "base"
              ? "🦄 <a href='https://app.uniswap.org'>Buy</a>"
              : "🪙 <a href='https://jup.ag/'>Buy</a>"
          }`,
          keyboards: [
            [
              {
                text: ">>Advertise here",
                url:
                  config.botUrl +
                  "?start=groupIdForAdvertise=" +
                  Number(data.groupId),
              },
            ],
          ],
          preview: false,
        });

        const appKey = Twitter.appKey as string;
        const appSecret = Twitter.appSecret as string;
        const accessToken = Twitter.accessToken as string;
        const accessSecret = Twitter.accessSecret as string;

        const client = new TwitterApi({
          appKey,
          appSecret,
          accessToken,
          accessSecret,
        });

        const tweetText = `Charts by: ${config.ownerChannel}\n\n$${
          data.spikeType === "priceuppercent"
            ? "Increase Price"
            : data.spikeType === "pricedownpercent"
            ? "Decrease Price"
            : data.spikeType === "buyamount"
            ? "Buy"
            : "Sell"
        } Spike!$\n💲 $${data.symbol}\n↪️ ${
          data.spikeType === "priceuppercent"
            ? "Price went up"
            : data.spikeType === "pricedownpercent"
            ? "Price went down"
            : data.spikeType === "buyamount"
            ? "Lot of buying"
            : "Lot of selling"
        }\n💵 ${
          data.spikeType === "priceuppercent" ||
          data.spikeType === "pricedownpercent"
            ? `${data.spike}%`
            : `${spike}+`
        }\n🕔 Within ${data.time}\n☑️ Market Cap $${numberWithCommas(
          Number(data.marketcap)
        )}\n\n📊 Chart: ${data.url}\n${
          data.chain === "base"
            ? "🦄 Buy: https://app.uniswap.org"
            : "🪙 Buy: https://jup.ag"
        }\n`;

        if (ad) {
          try {
            const pair = await getPairInformation(ad.chain, ad.pairAddress);
            let metadata;
            if (ad.chain === "base") {
              metadata = await getBaseTokenMetadata(
                pair?.pair?.baseToken?.address
              );
            } else {
              metadata = await getSolanaTokenMetadata(
                pair?.pair?.baseToken?.address
              );
            }
            const marketcap =
              (Number(pair?.pair?.priceUsd) * Number(metadata?.totalSupply)) /
              10 ** Number(metadata?.decimals);

            const content = `💲 <b>$${pair?.pair?.baseToken?.symbol}</b>
↪️ <b>Price $${pair?.pair?.priceUsd}</b>
⬆️ <b>Volume 24H: $${pair?.pair?.volume?.h24}</b>
💰 <b>Market Cap $${numberWithCommas(Number(marketcap), 3)}</b>

<b>Website: </b>${ad.website}
<b>Group: </b>${ad.link}
📊 <a href="${pair?.pair?.url}">Chart</a> ${
              ad.chain === "base"
                ? `🦄 <a href='https://app.uniswap.org/'>Buy</a>`
                : `🪙 <a href='https://jup.ag/'>Buy</a>`
            }`;
            console.log("advertise *************", ad);
            if (ad.mediaType === "image") {
              await bot.sendPhoto(Number(ad.groupId), ad.mediaId, {
                caption: `<b>Sponsored Post</b>
              
${ad.description}

${content}`,
                parse_mode: "HTML",
              });
            } else {
              await bot.sendVideo(Number(ad.groupId), ad.mediaId, {
                caption: `<b>Sponsored Post</b>
              
${ad.description}

${content}`,
                parse_mode: "HTML",
              });
            }

            console.log("🚀 ~ ad.count:", ad.count);
            if (ad.count < 2) {
              console.log("🚀 ~ ad.count < 2:", ad.count);
              await sendMessage({
                id: Number(ad.creator),
                message: "<b>Your advertise was just expired.</b>",
              });
              await AdController.deleteOne({
                filter: { creator: ad.creator, groupId: ad.groupId },
              });
            } else {
              console.log("🚀 ~ ad.count > 2:", ad.count);
              await AdController.update({
                filter: { creator: ad.creator, groupId: ad.groupId },
                update: {
                  count: ad.count - 1,
                },
              });
            }

            const mediaId = ad.mediaId;
            const file = await bot.getFile(mediaId);
            const filePath = `https://api.telegram.org/file/bot${config.botToken}/${file.file_path}`;
            const fileName =
              ad.mediaType === "image" ? `${mediaId}.jpg` : `${mediaId}.mp4`;
            try {
              await downloadFile(filePath, fileName);
              const media = await client.v1.uploadMedia(fileName);
              const mediaIds = media ? [media] : [];
              const adText = `${ad.description}\n\n💲 $${
                pair?.pair?.baseToken?.symbol
              }\n↪️ Price $${pair?.pair?.priceUsd}\n⬆️ Volume 24H: $${
                pair?.pair?.volume?.h24
              }\n💰 Market Cap $${numberWithCommas(Number(marketcap), 3)}\n\n

Group: ${ad.link}\n
📊 Chart: ${pair?.pair?.url}\n${
                ad.chain === "base"
                  ? `🦄 Buy: https://app.uniswap.org`
                  : `🪙 Buy: https://jup.ag`
              }`;
              const fText = `${tweetText}\n\n${adText}`;
              const response = await client.v2.tweet({
                text: fText,
                media: { media_ids: mediaIds },
              });
              fs.unlinkSync(`../../../${fileName}`);
              console.log("Tweet Success", response);
            } catch (err) {
              console.log(err);
            }
          } catch (err) {
            console.log(err);
            console.log("postMessageForPriceSpike sending error");
            return false;
          }
        } else {
          try {
            const response = await client.v2.tweet({ text: tweetText });
            console.log("Tweet Success", response);
          } catch (err) {
            console.log("Twitter post error", err);
          }
        }
      }
    } else {
      let spike =
        data.spikeType === "priceuppercent" ||
        data.spikeType === "pricedownpercent"
          ? numberWithCommas(data.spike)
          : numberWithCommas(Math.trunc(data.spike));
      await sendMessage({
        id: Number(data.groupId),
        message: `<b>Charts by: ${config.ownerChannel}</b>

<b>$${
          data.spikeType === "priceuppercent"
            ? "Increase Price"
            : data.spikeType === "pricedownpercent"
            ? "Decrease Price"
            : data.spikeType === "buyamount"
            ? "Buy"
            : "Sell"
        } Spike!$</b>

💲 <b>$${data.symbol}</b>
↪️ <b>${
          data.spikeType === "priceuppercent"
            ? "Price went up"
            : data.spikeType === "pricedownpercent"
            ? "Price went down"
            : data.spikeType === "buyamount"
            ? "Lot of buying"
            : "Lot of selling"
        }</b>
💵 <b>${
          data.spikeType === "priceuppercent" ||
          data.spikeType === "pricedownpercent"
            ? `${data.spike}%`
            : `${spike}+`
        }</b>
🕔 <b>Within ${data.time}</b>
☑️ <b>Market Cap $${numberWithCommas(Number(data.marketcap))}</b>

📊 <a href="${data.url}">Chart</a> | ${
          data.chain === "base"
            ? "🦄 <a href='https://app.uniswap.org'>Buy</a>"
            : "🪙 <a href='https://jup.ag/'>Buy</a>"
        }`,
        keyboards: [
          [
            {
              text: ">>Advertise here",
              url:
                config.botUrl +
                "?start=groupIdForAdvertise=" +
                Number(data.groupId),
            },
          ],
        ],
        preview: false,
      });

      if (ad) {
        try {
          const pair = await getPairInformation(ad.chain, ad.pairAddress);
          let metadata;
          if (ad.chain === "base") {
            metadata = await getBaseTokenMetadata(
              pair?.pair?.baseToken?.address
            );
          } else {
            metadata = await getSolanaTokenMetadata(
              pair?.pair?.baseToken?.address
            );
          }
          const marketcap =
            (Number(pair?.pair?.priceUsd) * Number(metadata?.totalSupply)) /
            10 ** Number(metadata?.decimals);
          const content = `💲 <b>$${pair?.pair?.baseToken?.symbol}</b>
↪️ <b>Price $${pair?.pair?.priceUsd}</b>
⬆️ <b>Volume 24H: $${pair?.pair?.volume?.h24}</b>
💰 <b>Market Cap $${numberWithCommas(Number(marketcap), 3)}</b>

<b>Group: </b>${ad.link}
📊 <a href="${pair?.pair?.url}">Chart</a> ${
            ad.chain === "base"
              ? `🦄 <a href='https://app.uniswap.org/'>Buy</a>`
              : `🪙 <a href='https://jup.ag/'>Buy</a>`
          }`;
          if (ad.mediaType === "image") {
            await bot.sendPhoto(Number(ad.groupId), ad.mediaId, {
              caption: `<b>Sponsored Post</b>

${ad.description}

${content}`,
              parse_mode: "HTML",
            });
          } else {
            await bot.sendVideo(Number(ad.groupId), ad.mediaId, {
              caption: `<b>Sponsored Post</b>
              
${ad.description}

${content}`,
              parse_mode: "HTML",
            });
          }
          console.log("Ad here ******************", ad);
          if (ad.count < 2) {
            console.log("🚀 ~ ad.count < 2:", ad.count);
            await sendMessage({
              id: Number(ad.creator),
              message: "<b>Your advertise was just expired.</b>",
            });
            await AdController.deleteOne({
              filter: { creator: ad.creator, groupId: ad.groupId },
            });
          } else {
            console.log("🚀 ~ ad.count < 2:", ad.count);
            await AdController.update({
              filter: { creator: ad.creator, groupId: ad.groupId },
              update: {
                count: ad.count - 1,
              },
            });
          }
        } catch (err) {
          console.log(err);
          console.log("postMessageForPriceSpike sending error");
          return false;
        }
      }
    }
  } catch (err) {
    console.log(err);
    console.log("postMessageForPriceSpike sending error");
    return false;
  }
};

const downloadFile = async (url: string, filename: string) => {
  return new Promise((resolve, reject) => {
    request.head(url, (err, res, body) => {
      if (err) reject(err);
      request(url).pipe(fs.createWriteStream(filename)).on("close", resolve);
    });
  });
};
