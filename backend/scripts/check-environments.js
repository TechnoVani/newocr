import {
    getApiBaseUrl,
    getAppUrl,
    getConfiguredAppUrls,
} from "../config/env.js";
import { getAllowedOrigins, isAllowedOrigin } from "../config/origins.js";

const environments = ["development", "production"];
for (const environment of environments) {
    const appUrl = getAppUrl(environment);
    const apiUrl = getApiBaseUrl(environment);
    if (!isAllowedOrigin(appUrl)) {
        throw new Error(`${environment} APP URL is missing from CORS origins`);
    }
    console.log(`${environment}: app=${appUrl} api=${apiUrl}`);
}

const configuredApps = getConfiguredAppUrls();
const allowedOrigins = getAllowedOrigins();
if (!configuredApps.every(appUrl => allowedOrigins.includes(new URL(appUrl).origin))) {
    throw new Error("Not all configured application URLs are allowed by CORS");
}
console.log(`CORS origins: ${allowedOrigins.join(", ")}`);
