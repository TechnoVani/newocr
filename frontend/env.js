const hostname = window.location.hostname;

const urls = import.meta.env.VITE_API_BASE_URL
  .split(",")
  .map(url => url.trim());

export const API_BASE_URL =
  hostname === "localhost"
    ? urls.find(url => url.includes("localhost"))
    : urls.find(url => url.includes(hostname)) || urls[0];