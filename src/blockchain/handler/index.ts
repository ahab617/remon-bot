import colors from "colors";
import { BigNumber } from "ethers";
import { BlockNumController } from "../controller/blocknum";
import { getPairContract, provider } from "blockchain/contracts/providers";
import { baseHandleEvent, solanaHandleEvent } from "blockchain/util";
import { formatUnits } from "ethers/lib/utils";
import {
  getBaseTokenBalance,
  getBaseTokenPrice,
} from "blockchain/monitor/library/scan-api";
import { postMessageWithMedia } from "bot/library";

const swapHandler = async (tx: any, token: TokenInterface) => {
  try {
    const txReceipt = await provider.getTransactionReceipt(tx.transactionHash);
    const creator = txReceipt.from;
    const hash = txReceipt.transactionHash;
    const decimal1 = token.baseTokenDecimals,
      decimal2 = token.quoteTokenDecimals;
    const argsvalue: any = tx.args;
    let amount0In = argsvalue[1]._hex as BigNumber;
    let amount1In = argsvalue[2]._hex as BigNumber;
    let amount0Out = argsvalue[3]._hex as BigNumber;
    let amount1Out = argsvalue[4]._hex as BigNumber;
    let type = Number(formatUnits(amount0In, 18)) == 0 ? "Sell" : "Buy";
    const inAmount =
      type == "Sell"
        ? formatUnits(amount1In, decimal1)
        : formatUnits(amount0In, decimal2);
    const outAmount =
      type == "Sell"
        ? formatUnits(amount0Out, decimal2)
        : formatUnits(amount1Out, decimal1);

    const tokenPrice = await getBaseTokenPrice(
      token.baseTokenAddress,
      token.pairAddress
    );
    const marketcap =
      (Number(token.totalSupply) * Number(tokenPrice)) /
      10 ** token.baseTokenDecimals;

    const usd =
      Number(tokenPrice) *
      (type == "Sell" ? Number(inAmount) : Number(outAmount));
    if (type == "Buy" && usd > token.min) {
      const balance = await getBaseTokenBalance(
        creator,
        token.baseTokenAddress
      );
      const repeatNumber = Math.floor(usd / token.step);
      const isNewHolder = Number(balance) - Number(outAmount) == 0;
      console.log(
        "*****",
        type,
        inAmount + token.quoteTokenName,
        outAmount + token.baseTokenName,
        usd,
        hash,
        creator
      );

      const groupMessage: GroupMessageInterface = {
        chain: "base",
        groupId: Number(token.groupId),
        type: token.mediaType,
        mediaId: token.mediaId,
        emoji: token.emoji,
        repeatNumber: repeatNumber,
        usdAmount: usd,
        tokenSymbol: token.baseTokenSymbol,
        tokenAddress: token.baseTokenAddress,
        tokenAmount: Math.floor(Number(outAmount)),
        buyer: creator,
        hash: hash,
        marketcap: marketcap,
        chartLink: token.dexUrl,
        buyLink: "https://app.uniswap.org",
        isNewHolder: isNewHolder,
      };

      await postMessageWithMedia(groupMessage);
    }
  } catch (err) {
    if (err.reason === "missing response") {
      console.log(colors.red("you seem offline"));
    } else if (err.reason === "could not detect network") {
      console.log(colors.red("could not detect network"));
    } else {
      console.log("handleTransation/swapHandler error:", err.message);
    }
  }
};

const baseEventHandler = async (token: TokenInterface, times: number = 15) => {
  baseHandleEvent({
    token: token,
    provider: provider,
    contract: getPairContract(token.pairAddress),
    event: "Swap",
    times: times,
    handler: swapHandler,
    BlockNumController: BlockNumController,
  });
};

const solanaEventHandler = async (token: TokenInterface) => {
  await solanaHandleEvent({
    token: token,
    times: 10,
  });
};

export { baseEventHandler, solanaEventHandler };
