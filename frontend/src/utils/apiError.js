const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

const STATUS_TITLES = Object.freeze({
  400: "Validation Error",
  401: "Authentication Required",
  403: "Access Denied",
  404: "Record Not Found",
  409: "Duplicate Record",
  422: "Validation Failed",
  500: "Server Error",
  503: "Service Unavailable",
});

const INTERNAL_PATTERNS = [
  /\bER_[A-Z0-9_]+\b/i,
  /\bSQL\b/i,
  /\bMySQL\b/i,
  /\bAxiosError\b/i,
  /\bExpress\b/i,
  /\bNode\.js\b/i,
  /\bat\s+.+\(.+:\d+:\d+\)/i,
  /[A-Z]:\\[^ ]+/i,
  /\/(?:home|var|usr|app|project)\//i,
  /\bprocess\.env\b/i,
];

export const looksInternal = (message = "") =>
  INTERNAL_PATTERNS.some((pattern) => pattern.test(String(message)));

export const sanitizeMessage = (message, fallback = FALLBACK_MESSAGE) => {
  const text = String(message || "").trim();
  if (!text || looksInternal(text)) return fallback;
  return text;
};

export const getApiError = (error, fallback = FALLBACK_MESSAGE) => {
  const status = Number(error?.response?.status) || 0;
  const responseData = error?.response?.data || {};
  const message = sanitizeMessage(
    responseData.message || responseData.error || error?.userMessage || error?.message,
    fallback
  );

  return {
    status,
    title: STATUS_TITLES[status] || "Request Failed",
    message,
    details: responseData.details || null,
    isDuplicate: status === 409,
    isValidation: status === 400 || status === 422,
    isAuth: status === 401,
    isAccessDenied: status === 403,
    isNotFound: status === 404,
    original: error,
  };
};

export const getApiErrorMessage = (error, fallback) => getApiError(error, fallback).message;

export default getApiError;
