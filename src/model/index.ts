import mongoose from "mongoose";
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
  creator: String,
  groupId: String,
  pairName: String,
  chainId: String,
  pairAddress: String,
  dexUrl: String,
  baseTokenAddress: String,
  baseTokenName: String,
  baseTokenSymbol: String,
  baseTokenDecimals: Number,
  quoteTokenAddress: String,
  quoteTokenName: String,
  quoteTokenSymbol: String,
  quoteTokenDecimals: Number,
  totalSupply: Number,
  mediaType: String,
  mediaId: String,
  emoji: String,
  min: Number,
  step: Number,
});

const WhaleSchema = new Schema({
  creator: String,
  groupId: String,
  pairName: String,
  chainId: String,
  pairAddress: String,
  dexUrl: String,
  baseTokenAddress: String,
  baseTokenName: String,
  baseTokenSymbol: String,
  baseTokenDecimals: Number,
  quoteTokenAddress: String,
  quoteTokenName: String,
  quoteTokenSymbol: String,
  quoteTokenDecimals: Number,
  totalSupply: Number,
  mediaType: String,
  mediaId: String,
  buymin: Number,
  sellmin: Number,
});

const SolTransactionSchema = new Schema({
  groupId: String,
  pairAddress: String,
  hash: String,
});

const ChartSchema = new Schema({
  creator: String,
  groupId: String,
  chain: String,
  pairAddress: String,
  priceUpSpike: Number,
  priceUpTime: String,
  priceDownSpike: Number,
  priceDownTime: String,
  buySpike: Number,
  buyTime: String,
  sellSpike: Number,
  sellTime: String,
});

const AdSchema = new Schema({
  creator: String,
  groupId: String,
  chain: String,
  pairAddress: String,
  mediaType: String,
  mediaId: String,
  description: String,
  link: String,
  website: String,
  package: String,
  count: Number,
  hash: String,
});

const AdSettingSchema = new Schema({
  creator: String,
  groupId: String,
  address: String,
  package1: Object,
  package2: Object,
  package3: Object,
  package4: Object,
});

const TokenCostSchema = new Schema({
  creator: String,
  peke: Number,
  sol: Number,
});

const TwitterSchema = new Schema({
  creator: String,
  groupId: String,
  appKey: String,
  appSecret: String,
  accessToken: String,
  accessSecret: String,
  option: String,
  hash: String,
  expiredTime: Number,
});

const RevenueSplitSchema = new Schema({
  creator: String,
  peke: Number,
  sol: Number,
});

export const Tokens = mongoose.model("tokens", TokenSchema);
export const Ads = mongoose.model("ads", AdSchema);
export const SolTransactions = mongoose.model(
  "soltransactions",
  SolTransactionSchema
);
export const Charts = mongoose.model("charts", ChartSchema);
export const AdSettings = mongoose.model("adsettings", AdSettingSchema);
export const TokenCosts = mongoose.model("tokencosts", TokenCostSchema);
export const Twitters = mongoose.model("twitters", TwitterSchema);
export const RevenueSplits = mongoose.model("revenusplits", RevenueSplitSchema);
export const Whales = mongoose.model("whales", WhaleSchema);
