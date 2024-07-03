declare interface TokenInterface {
  creator: string;
  groupId: string;
  pairName: string;
  chainId: string;
  pairAddress: string;
  dexUrl: string;
  baseTokenAddress: string;
  baseTokenName: string;
  baseTokenSymbol: string;
  baseTokenDecimals: number;
  quoteTokenAddress: string;
  quoteTokenName: string;
  quoteTokenSymbol: string;
  quoteTokenDecimals: number;
  totalSupply: number;
  mediaType: string;
  mediaId: string;
  emoji: string;
  min: number;
  step: number;
}

declare interface WhaleInterface {
  creator: string;
  groupId: string;
  pairName: string;
  chainId: string;
  pairAddress: string;
  dexUrl: string;
  baseTokenAddress: string;
  baseTokenName: string;
  baseTokenSymbol: string;
  baseTokenDecimals: number;
  quoteTokenAddress: string;
  quoteTokenName: string;
  quoteTokenSymbol: string;
  quoteTokenDecimals: number;
  totalSupply: number;
  mediaType: string;
  mediaId: string;
  buymin: number;
  sellmin: number;
}

declare interface SolInterface {
  groupId: string;
  pairAddress: string;
  hash: string;
}

declare interface BlockNumInterface {
  latestTime: number;
  id: string;
}

declare interface GroupMessageInterface {
  chain: "solana" | "base";
  groupId: number;
  type: string;
  mediaId: string;
  emoji: string;
  repeatNumber: number;
  usdAmount: number;
  tokenSymbol: string;
  tokenAddress: string;
  tokenAmount: number;
  buyer: string;
  hash: string;
  marketcap: number;
  chartLink: string;
  buyLink: string;
  isNewHolder: boolean;
}

declare interface SendMessageInterface {
  id: string | number;
  message: string;
  preview?: boolean;
  keyboards?: any;
}

declare interface AdInterface {
  creator: string;
  groupId: string;
  chain: string;
  pairAddress: string;
  mediaType: string;
  mediaId: string;
  description: string;
  link: string;
  website: string;
  package: string;
  count: number;
  hash: string;
}

declare interface ChartInterface {
  creator: string;
  groupId: string;
  chain: string;
  pairAddress: string;
  priceUpSpike: number;
  priceUpTime: string;
  priceDownSpike: number;
  priceDownTime: string;
  buySpike: number;
  buyTime: string;
  sellSpike: number;
  sellTime: string;
}

declare interface SpikeInterface {
  chain: string;
  groupId: string;
  url: string;
  symbol: string;
  spikeType: string;
  spike: number;
  time: string;
  marketcap: number;
}

declare interface TokenCostInterface {
  creator: string;
  peke: number;
  sol: number;
}

declare interface RevenueSplitInterface {
  creator: string;
  peke: number;
  sol: number;
}

declare interface TwitterInterface {
  creator: string;
  groupId: string;
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
  option: "apikey" | "ifttt";
  hash: string;
  expiredTime: number;
}
