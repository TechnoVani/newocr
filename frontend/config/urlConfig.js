export const normalizeAbsoluteUrl = (name, value) => {
  const normalized = String(value || "").trim().replace(/\/+$/, "");
  if (!normalized || normalized.includes(",")) {
    throw new Error(`${name} must contain exactly one absolute URL`);
  }

  let url;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${name} must use http or https`);
  }
  return url.toString().replace(/\/+$/, "");
};

export const appendUrlPath = (baseUrl, path) =>
  new URL(String(path || "").replace(/^\/+/, ""), `${baseUrl}/`).toString().replace(/\/+$/, "");

export const toApiBaseUrl = apiUrl => {
  const normalized = normalizeAbsoluteUrl("API_URL", apiUrl);
  return new URL(normalized).pathname.replace(/\/+$/, "").endsWith("/api")
    ? normalized
    : appendUrlPath(normalized, "api");
};

export const selectModeUrls = (env, production) => {
  const vitePrefix = production ? "VITE_PROD_" : "VITE_DEV_";
  const plainPrefix = production ? "PROD_" : "DEV_";
  const appUrlName = `${plainPrefix}APP_URL`;
  const apiUrlName = `${plainPrefix}API_URL`;
  const viteAppUrlName = `${vitePrefix}APP_URL`;
  const viteApiUrlName = `${vitePrefix}API_URL`;

  return {
    appUrl: normalizeAbsoluteUrl(appUrlName, env[appUrlName] || env[viteAppUrlName]),
    apiUrl: normalizeAbsoluteUrl(apiUrlName, env[apiUrlName] || env[viteApiUrlName]),
  };
};
