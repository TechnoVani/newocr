import {
  appendUrlPath,
  normalizeAbsoluteUrl,
  toApiBaseUrl,
} from "../../config/urlConfig.js";

export const APP_BASE_URL = normalizeAbsoluteUrl("APP_URL", import.meta.env.VITE_APP_URL);
export const API_ORIGIN = normalizeAbsoluteUrl("VITE_API_URL", import.meta.env.VITE_API_URL);
export const API_BASE_URL = toApiBaseUrl(API_ORIGIN);
export const LOGIN_URL = appendUrlPath(APP_BASE_URL, "login");
export const resolveApiUrl = (path = "") => appendUrlPath(API_BASE_URL, path);
