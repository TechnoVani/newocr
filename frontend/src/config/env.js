const readRequiredEnv = (key) => {
  const value = String(import.meta.env[key] || "").trim();
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

const stripTrailingSlashes = (value) => value.replace(/\/+$/, "");

const readUrls = (key) => readRequiredEnv(key)
  .split(",")
  .map((value) => stripTrailingSlashes(value.trim()))
  .filter(Boolean)
  .map((value) => {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      return { value, url };
    } catch {
      throw new Error(`${key} contains an invalid absolute URL: ${value}`);
    }
  });

const isLocalHostname = (hostname) => ["localhost", "127.0.0.1", "::1"].includes(hostname);
const browserHostname = typeof window === "undefined" ? "" : window.location.hostname;

const apiUrls = readUrls("VITE_API_BASE_URL");
const preferredApi = isLocalHostname(browserHostname)
  ? apiUrls.find(({ url }) => isLocalHostname(url.hostname))
  : apiUrls.find(({ url }) => !isLocalHostname(url.hostname));

export const API_BASE_URL = (preferredApi || apiUrls[0]).value;

const configuredLoginUrls = readUrls("VITE_REDIRECT_URL");
const currentFrontendOrigin = typeof window === "undefined" ? "" : window.location.origin;
const sameOriginLogin = configuredLoginUrls.find(({ url }) => (
  url.origin === currentFrontendOrigin && !url.pathname.startsWith("/api")
));

export const LOGIN_URL = sameOriginLogin?.value
  || (currentFrontendOrigin ? `${currentFrontendOrigin}/login` : configuredLoginUrls[0].value);
