import {
    getApiBaseUrl,
    getAppUrl,
    getConfiguredAppUrls,
    isProduction,
    readModeEnv,
} from "./env.js";

const normalizeOrigin = (value) => {
    const normalizedValue = String(value || "").trim().replace(/\/+$/, "");
    if (!normalizedValue) return "";

    try {
        const url = new URL(normalizedValue);
        if (!["http:", "https:"].includes(url.protocol)) return "";
        return url.origin;
    } catch {
        return "";
    }
};

const originAliases = (value) => {
    const origin = normalizeOrigin(value);
    if (!origin) return [];

    const aliases = [origin];
    const url = new URL(origin);
    if (
        url.protocol === "https:" &&
        url.hostname !== "localhost" &&
        !isPrivateIpv4(url.hostname)
    ) {
        url.hostname = url.hostname.startsWith("www.")
            ? url.hostname.slice(4)
            : `www.${url.hostname}`;
        aliases.push(url.origin);
    }
    return aliases;
};

const isPrivateIpv4 = (hostname) => {
    const parts = hostname.split(".").map(Number);
    if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
        return false;
    }
    return parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168);
};

const isDevelopmentPrivateOrigin = (origin) => {
    if (isProduction || readModeEnv("ALLOW_PRIVATE_NETWORK_ORIGINS").toLowerCase() !== "true") {
        return false;
    }
    try {
        const url = new URL(origin);
        const allowedPorts = new Set(
            originAliases(getAppUrl()).map(frontendOrigin => new URL(frontendOrigin).port)
        );
        return url.protocol === "http:" &&
            allowedPorts.has(url.port) &&
            (url.hostname.toLowerCase() === "localhost" || isPrivateIpv4(url.hostname));
    } catch {
        return false;
    }
};

export const getAllowedOrigins = () => [
    ...new Set(getConfiguredAppUrls().flatMap(originAliases)),
];

export const isAllowedOrigin = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    return Boolean(normalizedOrigin) &&
        (getAllowedOrigins().includes(normalizedOrigin) || isDevelopmentPrivateOrigin(normalizedOrigin));
};

export const getFrontendUrl = (requestOrigin) => {
    if (!isProduction && isAllowedOrigin(requestOrigin)) {
        return normalizeOrigin(requestOrigin);
    }
    return normalizeOrigin(getAppUrl());
};

export const getPublicApiUrl = getApiBaseUrl;

export { normalizeOrigin };
