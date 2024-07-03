import crypto from "crypto";

export const md5 = (plain: string) =>
  crypto.createHash("md5").update(plain).digest("hex");
export const hmac256 = (message: string, secret: string) =>
  crypto.createHmac("SHA256", secret).update(message).digest("hex");
export const generatePassword = () =>
  (Math.random() * 1e10).toString(36).slice(-12);
export const N = (v: number, p: number = 6) =>
  Math.round(v * 10 ** p) / 10 ** p;
export const lower = (s: string) => s.toLowerCase();

export const currentTime = () => Math.round(new Date().getTime() / 1000);

export const validateEmail = (email: string): boolean =>
  email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  ) !== null;
export const validateUsername = (username: string): boolean =>
  /^[a-zA-Z0-9]{6,20}$/.test(username);
export const validateAddress = (address: string) =>
  /^0x[a-f0-9A-F]{40}$/.test(address);
export const validateTxId = (txId: string) => /^0x[a-f0-9A-F]{64}$/.test(txId);
export const isHttpValid = (str: string) => {
  try {
    const newUrl = new URL(str);
    return newUrl.protocol === "http:" || newUrl.protocol === "https:";
  } catch (err) {
    return false;
  }
};

export const generateCode = () => {
  let code = String(Math.round(Math.random() * 8999 + 124));
  if (code.length < 4) code = "0".repeat(4 - code.length) + code;
  return code;
};
export const emailEllipse = (email: string) => {
  if (!email) return "";
  const p = email.lastIndexOf("@");
  return (
    email.slice(0, 3) + "***@" + (p > 8 ? email.slice(p + 1) : email.slice(-8))
  );
};
export const generateID = () =>
  Math.round(new Date().getTime() / 1000 + Math.random() * 5001221051);

export const toDayTime = (time: number) => time - (time % 86400);

export const getRoundSolAmount = (value: number) => {
  const factor = Math.pow(10, 9);
  const amount = Math.round(value * factor) / factor;
  return amount as number;
};

export const getTimeDiff = (_timestamp: number) => {
  const timeDiff = (currentTime() - _timestamp) / 60;
  return timeDiff as number;
};

export const formatAddress = (_address: string) => {
  const pre = _address.slice(0, 5);
  const sub = _address.substring(_address.length - 4);
  return pre + "..." + sub;
};

export const isUrl = (url: string) => {
  const regex =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return regex.test(url) as boolean;
};
