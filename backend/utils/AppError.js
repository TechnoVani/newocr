const STATUS_MESSAGES = Object.freeze({
    400: "Bad Request",
    401: "Unauthorized",
    403: "Access Denied",
    404: "Record Not Found",
    409: "Duplicate Record",
    422: "Validation Failed",
    500: "Internal Server Error",
    503: "Service Unavailable"
});

export class AppError extends Error {
    constructor(message, statusCode = 500, details = null, code = "") {
        super(message || STATUS_MESSAGES[statusCode] || STATUS_MESSAGES[500]);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.details = details;
        this.code = code;
        this.expose = statusCode < 500;
    }
}

export const badRequest = (message, details = null) => new AppError(message, 400, details);
export const unauthorized = (message = "Authentication is required") => new AppError(message, 401);
export const forbidden = (message = "You do not have permission to perform this action") => new AppError(message, 403);
export const notFound = (message = "The requested record could not be found") => new AppError(message, 404);
export const conflict = (message, details = null) => new AppError(message, 409, details);
export const validationFailed = (message = "Validation failed", details = null) => new AppError(message, 422, details);

export const httpStatusTitle = statusCode => STATUS_MESSAGES[statusCode] || STATUS_MESSAGES[500];

export default AppError;
