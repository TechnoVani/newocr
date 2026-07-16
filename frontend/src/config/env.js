const readRequiredEnv = (key) => {
  const value = String(import.meta.env[key] || "").trim();
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

const stripTrailingSlashes = (value) => value.replace(/\/+$/, "");

const readSingleUrl = (key) => {
  const value = stripTrailingSlashes(readRequiredEnv(key));
  if (value.includes(",")) {
    throw new Error(`${key} must contain exactly one URL, not a comma-separated list`);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${key} must be a valid absolute URL`);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(`${key} must use http or https`);
  }
  return value;
};

export const API_BASE_URL = readSingleUrl("VITE_API_BASE_URL");

export const LOGIN_URL = readSingleUrl("VITE_REDIRECT_URL");
