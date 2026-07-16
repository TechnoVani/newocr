const readRequiredEnv = (key) => {
  const value = String(import.meta.env[key] || "").trim();
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

const stripTrailingSlashes = (value) => value.replace(/\/+$/, "");

export const API_BASE_URL = stripTrailingSlashes(
  readRequiredEnv("VITE_API_BASE_URL")
);

export const LOGIN_URL = readRequiredEnv("VITE_REDIRECT_URL");

