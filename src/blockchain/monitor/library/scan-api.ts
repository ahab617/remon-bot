import axios from "axios";
import Moralis from "moralis";
const solanaWeb3 = require("@solana/web3.js");
const splToken = require("@solana/spl-token");

export const getTokenPairs = async (address: string) => {
  try {
    const res = await axios.get(
      `https://api.dexscreener.io/latest/dex/tokens/${address}`
    );
    return res.data.pairs;
  } catch (err) {
    return null;
  }
};

export const getBaseTokenMetadata = async (address: string) => {
  const response = await Moralis.EvmApi.token.getTokenMetadata({
    chain: "0x2105",
    addresses: [address],
  });
  const raw = response.raw[0] as any;
  const totalSupply = Number(raw?.total_supply || 0);
  const decimals = Number(raw?.decimals || 0);

  return { decimals, totalSupply };
};

export const getBaseTokenPrice = async (
  address: string,
  pairAddress: string
) => {
  try {
    const res = await axios.get(
      `https://api.dexscreener.io/latest/dex/tokens/${address}`
    );
    const pairs = res.data.pairs;
    const pair = pairs.filter((pair: any) => {
      return pair.pairAddress === pairAddress;
    });
    return pair[0].priceUsd;
  } catch (err) {
    return null;
  }
};

export const getBaseTokenBalance = async (
  address: string,
  tokenAddress: string
) => {
  const response = await Moralis.EvmApi.token.getWalletTokenBalances({
    chain: "0x2105",
    address: address,
    tokenAddresses: [tokenAddress],
  });

  const raw = response.raw[0] as any;
  const balance = Number(raw?.balance || 0);
  return balance;
};

export const getSolanaTokenMetadata = async (address: string) => {
  if (!address) return null;
  const connection = new solanaWeb3.Connection(
    "https://api.mainnet-beta.solana.com"
  );

  const publicKey = new solanaWeb3.PublicKey(address);
  const mintInfo = await splToken.getMint(connection, publicKey);
  return { decimals: mintInfo.decimals, totalSupply: mintInfo.supply };
};

export const getSolanaTokenBalance = async (
  address: string,
  tokenAddress: string
) => {
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
          address,
          {
            mint: tokenAddress,
          },
          {
            encoding: "jsonParsed",
          },
        ],
      },
    ],
  });

  const amount =
    response.data[0].result.value[0].account.data.parsed.info.tokenAmount
      .uiAmount;

  return amount;
};

export const getPairInformation = async (chain: string, address: string) => {
  const response = await axios.get(
    `https://api.dexscreener.io/latest/dex/pairs/${chain}/${address}`
  );
  return response.data;
};
