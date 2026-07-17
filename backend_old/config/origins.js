const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");

const splitOrigins = (value) => String(value || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

export const getAllowedOrigins = () => [
    ...new Set([
        ...splitOrigins(process.env.CORS_ORIGINS),
        ...splitOrigins(process.env.FRONTEND_URL)
    ])
];

export const isAllowedOrigin = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    return Boolean(normalizedOrigin) && getAllowedOrigins().includes(normalizedOrigin);
};

export const getFrontendUrl = (requestOrigin) => {
    const configuredPublicUrl = normalizeOrigin(process.env.PUBLIC_FRONTEND_URL);
    if (configuredPublicUrl) return configuredPublicUrl;

    if (isAllowedOrigin(requestOrigin)) return normalizeOrigin(requestOrigin);

    const [firstAllowedOrigin] = getAllowedOrigins();
    return firstAllowedOrigin || "";
};

export { normalizeOrigin };
