import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Always resolve the backend-owned environment file from this module. Hosting
// variables retain precedence because dotenv override is disabled.
const envPath = fileURLToPath(new URL("../.env", import.meta.url));
const result = dotenv.config({ path: envPath, override: false });

if (result.error && result.error.code !== "ENOENT") {
    throw result.error;
}

export const readEnv = (name, fallback = "") =>
    String(process.env[name] || fallback).trim();

const readAbsoluteUrl = (name) => {
    const value = readEnv(name).replace(/\/+$/, "");
    if (!value || value.includes(",")) {
        throw new Error(`${name} must contain exactly one absolute URL`);
    }

    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error(`${name} must be a valid absolute URL`);
    }
    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error(`${name} must use http or https`);
    }
    return url.toString().replace(/\/+$/, "");
};

export const mode = readEnv("NODE_ENV", readEnv("APP_ENV", "development"))
    .toLowerCase() === "production" ? "production" : "development";
export const isProduction = mode === "production";
const normalizeMode = (value) =>
    String(value || "").trim().toLowerCase() === "production"
        ? "production"
        : "development";
const prefixForMode = (runtimeMode) =>
    normalizeMode(runtimeMode) === "production" ? "PROD_" : "DEV_";

export const readModeEnv = (name, fallback = "", runtimeMode = mode) =>
    readEnv(`${prefixForMode(runtimeMode)}${name}`, fallback);

export const readBooleanEnv = (name, fallback = false) => {
    const value = readEnv(name);
    return value ? value.toLowerCase() === "true" : fallback;
};

const readModeAbsoluteUrl = (name, runtimeMode = mode) => {
    const environmentName = `${prefixForMode(runtimeMode)}${name}`;
    return readAbsoluteUrl(environmentName);
};

export const getAppUrl = (runtimeMode = mode) =>
    readModeAbsoluteUrl("APP_URL", runtimeMode);
export const getConfiguredAppUrls = () => [
    getAppUrl("development"),
    getAppUrl("production"),
];
export const getApiOrigin = (runtimeMode = mode) =>
    readModeAbsoluteUrl("API_URL", runtimeMode);
export const getApiPort = (runtimeMode = mode) => {
    const url = new URL(getApiOrigin(runtimeMode));
    if (url.port) return url.port;
    return url.protocol === "https:" ? "443" : "80";
};
export const getApiBaseUrl = (runtimeMode = mode) => {
    const apiOrigin = getApiOrigin(runtimeMode);
    return new URL(apiOrigin).pathname.replace(/\/+$/, "").endsWith("/api")
        ? apiOrigin
        : `${apiOrigin}/api`;
};

process.env.NODE_ENV = mode;

export { envPath };
