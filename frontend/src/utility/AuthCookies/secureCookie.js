import CryptoJS from "crypto-js";

const secretKey = import.meta.env.VITE_SECRET_KEY;
const configuredCookieDomain = String(import.meta.env.VITE_COOKIE_DOMAIN || "").trim();

// 🔑 Centralized cookie domain config
const getCookieDomain = () =>
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? undefined
    : configuredCookieDomain || undefined;

export const setEncryptedCookie = (
  key,
  data,
  options = {
    expiryInMinutes: 240, // 4 hours default
    secure: true,
    httpOnly: false, // cannot be true for client-side cookies
    domain: getCookieDomain(),
  }
) => {
  if (!secretKey) {
    //console.warn("VITE_SECRET_KEY missing, storing unencrypted cookie");
    document.cookie = `${key}=${encodeURIComponent(
      JSON.stringify(data)
    )}; path=/;`;
    return;
  }

  try {
    const serialized = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(serialized, secretKey).toString();

    let cookie = `${key}=${encodeURIComponent(encrypted)};`;
    cookie += ` expires=${new Date(
      Date.now() + options.expiryInMinutes * 60 * 1000
    ).toUTCString()};`;
    cookie += ` path=/;`;
    cookie += ` SameSite=None;`;
    cookie += options.secure ? ` Secure;` : "";
    cookie += options.domain ? ` domain=${options.domain};` : "";

    document.cookie = cookie;
  } catch (e) {
    //console.error("Error encrypting cookie:", e);
  }
};

export const getDecryptedCookie = (key) => {
  if (!secretKey) return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${key}=`));

  if (!cookie) return null;

  try {
    const encrypted = decodeURIComponent(cookie.split("=")[1]);
    const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) return null;

    return JSON.parse(decrypted);
  } catch (e) {
    //console.error("Cookie decryption error:", e);
    removeCookie(key);
    return null;
  }
};

export const removeCookie = (key) => {
  let cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=None; Secure;`;
  const domain = getCookieDomain();
  if (domain) cookie += ` domain=${domain};`;

  document.cookie = cookie;
};
