import { httpStatusTitle } from "./AppError.js";

export const successResponse = (res, message = "Success", data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const safeStatusCode = statusCode => {
    const numericStatus = Number(statusCode);
    if ([400, 401, 403, 404, 409, 422, 500, 503].includes(numericStatus)) return numericStatus;
    if (numericStatus >= 400 && numericStatus <= 599) return numericStatus;
    return 500;
};

export const errorResponse = (res, message = "An error occurred", details = null, statusCode = 500) => {
    const status = safeStatusCode(statusCode);
    const response = {
        success: false,
        message: message || httpStatusTitle(status)
    };

    if (details && status < 500) {
        response.details = details;
    }

    return res.status(status).json(response);
};

export default {
    success: successResponse,
    error: errorResponse
};
