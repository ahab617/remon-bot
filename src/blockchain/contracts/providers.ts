import { toChecksumAddress } from "blockchain/util";
import { ethers } from "ethers";

export const RPCS = {
  8453: "https://mainnet.base.org",
};

export const providers: any = {
  8453: new ethers.providers.JsonRpcProvider(RPCS[8453]),
};

export const provider = providers[8453];

import Abis from "./api.json";
export const getPairContract = (address: string) => {
  return new ethers.Contract(toChecksumAddress(address), Abis.pair, provider);
};
