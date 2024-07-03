import axios from "axios";
import http from "http";
import https from "https";
import setlog from "./setlog";

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

/**
 * set delay for delayTimes
 * @param {Number} delayTimes - timePeriod for delay
 */
export const delay = (delayTimes: number) => {
  return new Promise((resolve: any) => {
    setTimeout(() => {
      resolve(2);
    }, delayTimes);
  });
};

export const hex = (arrayBuffer: Buffer) => {
  return Array.from(new Uint8Array(arrayBuffer))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
};

export const Now = () => Math.round(new Date().getTime() / 1000);

export const randomCode = () => {
  var minm = 100000;
  var maxm = 999999;
  return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
};

export const numberWithCommas = (x: number, dic?: number) => {
  x = Number(Number(x).toFixed(dic || 2));
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

export const callRpc = async (rpc: string, params?: any) => {
  for (let i = 0; i < 100; i++) {
    const response = await axios.get(rpc, {
      ...params,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      httpAgent,
      httpsAgent,
    });
    if (response && response.data) {
      return response.data;
    } else {
      setlog("callRpc failed");
    }
  }
  return null;
};

export const ellipsis = (address: string, start: number = 6) => {
  if (!address || address === null) return "";
  const len = start + 7;
  return address.length > len
    ? `${address?.slice(0, start)}...${address?.slice(-4)}`
    : address;
};

export function formatBytes(bytes: any, decimals = 2): string {
  if (!+bytes) return "0";
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["", "K", "M", "B", "T", "P", "E", "Z", "Y"];
  if (Number(bytes) < 1) return Number(bytes).toFixed(6);
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`;
}
