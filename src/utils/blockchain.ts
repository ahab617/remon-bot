import * as Web3 from "@solana/web3.js";
import { web3 } from "@project-serum/anchor";

import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

import {
  Connection,
  PublicKey,
  Keypair,
  ParsedAccountData,
} from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";
import { bsub, formatUnit } from "./bigmath";

const connection = new Web3.Connection(Web3.clusterApiUrl("mainnet-beta"), {
  commitment: "confirmed",
}) as any;

export const generateSolanaWallet = async () => {
  const signer = Web3.Keypair.generate();
  return signer;
};

export const sendSol = async (
  amount: number,
  toAddress: string,
  privatekey: string
) => {
  try {
    const sender = await getKeyPairFromPrivatekey(privatekey);
    const to = new PublicKey(toAddress);
    const decimals = 9;
    const transferAmountInDecimals = amount * Math.pow(10, decimals);

    let newNonceTx = new Web3.Transaction();
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    newNonceTx.feePayer = sender.publicKey;
    newNonceTx.recentBlockhash = blockhash;
    newNonceTx.lastValidBlockHeight = lastValidBlockHeight;

    newNonceTx.add(
      Web3.SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: to,
        lamports: transferAmountInDecimals,
      })
    );
    const tx = await Web3.sendAndConfirmTransaction(connection, newNonceTx, [
      sender,
    ]);
    console.log(`Completed: https://explorer.solana.com/tx/${tx}`);
    return tx;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const checkSolBalance = async (addr: string) => {
  const publickey = new PublicKey(addr);
  const balance = await connection.getBalance(publickey);
  return balance;
};

export const checkSplTokenBalance = async (token: string, addr: string) => {
  const response = await axios({
    url: `https://api.mainnet-beta.solana.com`,
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: [
      {
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          addr,
          {
            mint: token,
          },
          {
            encoding: "jsonParsed",
          },
        ],
      },
    ],
  });
  const result = response?.data?.[0]?.result;
  const balance =
    result.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.amount || "0";

  const mintPublicKey = new web3.PublicKey(token);
  const decimals = await getNumberDecimals(mintPublicKey, connection);
  return formatUnit(Number(balance), decimals);
};

export const getKeyPairFromPrivatekey = async (PRIVATE_KEY: any) => {
  const pk = new Uint8Array(bs58.decode(PRIVATE_KEY));
  const keypair = Keypair.fromSecretKey(pk);
  return keypair;
};

export const getLatestBlock = async () => {
  const latestBlockhash = await connection.getLatestBlockhash();
  return latestBlockhash;
};

export const isSolanaAddress = (pubkey: string) => {
  try {
    const address = new PublicKey(pubkey);
    return PublicKey.isOnCurve(address);
  } catch (err) {
    return false;
  }
};

async function getNumberDecimals(
  mintAddress: PublicKey,
  connection: Connection
): Promise<number> {
  const info = await connection.getParsedAccountInfo(mintAddress);
  const decimals = (info.value?.data as ParsedAccountData).parsed.info
    .decimals as number;
  return decimals;
}

export const transferSplToken = async (
  privatekey: string,
  tokenAddr: string,
  dis: string,
  amount: number
) => {
  try {
    const fromWallet = await getKeyPairFromPrivatekey(privatekey);
    const destPublicKey = new PublicKey(dis);
    const mintPublicKey = new web3.PublicKey(tokenAddr);
    const decimals = await getNumberDecimals(mintPublicKey, connection);

    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mintPublicKey,
      fromWallet.publicKey
    );

    const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mintPublicKey,
      destPublicKey
    );

    const tx = await transfer(
      connection,
      fromWallet,
      senderTokenAccount.address,
      receiverTokenAccount.address,
      fromWallet.publicKey,
      amount * 10 ** decimals
    );
    return tx;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const checkSolTransaction = async (
  hash: string,
  toAddress: string,
  tokenAddr?: string
) => {
  console.log(hash, toAddress);
  try {
    if (!hash) return null;
    const response = await axios({
      url: `https://api.mainnet-beta.solana.com`,
      method: "post",
      headers: { "Content-Type": "application/json" },
      data: [
        {
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: [hash, "json"],
        },
      ],
    });
    const result = response?.data?.[0]?.result;
    if (!result) return null;
    console.log("Result:", result);
    const postBalance = result?.meta?.postBalances || [];
    const preBalances = result?.meta?.preBalances || [];
    const postTokenBalances = result?.meta?.postTokenBalances || [];
    const preTokenBalances = result?.meta?.preTokenBalances || [];

    ///token transfer
    if (
      tokenAddr &&
      postTokenBalances?.length > 0 &&
      preTokenBalances?.length > 0
    ) {
      console.log("tokenAddr", tokenAddr);
      // it logs this but the below log doesn't appear
      const decimals = postTokenBalances?.[1]?.uiTokenAmount?.decimals || 9;
      const postAmount = postTokenBalances?.[1]?.uiTokenAmount?.amount || 0;
      const preAmount = preTokenBalances?.[1]?.uiTokenAmount?.amount || 0;
      const mintAddr = postTokenBalances?.[1]?.mint || "";
      const receiver = postTokenBalances?.[0]?.owner || "";

      if (
        receiver.toUpperCase() == toAddress.toUpperCase() &&
        mintAddr.toUpperCase() == tokenAddr.toUpperCase()
      ) {
        const val = bsub(preAmount, postAmount);
        const amount = formatUnit(val, decimals);
        console.log("val, amount", val, amount);

        /// here it doesn't log the ablve log
        return {
          blockTime: result?.blockTime,
          amount: Number(amount),
          decimals: decimals,
          tokenAddress: mintAddr,
        };
      }
    }
    ///sol transfer
    else {
      const decimals = 9;
      const postAmount = postBalance?.[1] || 0;
      const preAmount = preBalances?.[1] || 0;
      const val = Number(postAmount) - Number(preAmount);
      const amount = formatUnit(val, decimals);
      const keys = result?.transaction?.message?.accountKeys || [];
      const to = keys[1];
      if (to.toUpperCase() == toAddress.toUpperCase()) {
        return {
          blockTime: result?.blockTime,
          amount: Number(amount),
          decimals: decimals,
          tokenAddress: "",
        };
      }
    }
  } catch (err) {
    console.log(err);
  }
};
