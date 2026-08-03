import { errorResponse } from "../utils/response.js";

/**
 * Global Express Error Handling Middleware
 */
const errorMiddleware = (err, req, res, next) => {
    console.error("Global Error Handler Log:", err);

    const databaseErrorCodes = new Set([
        "ECONNREFUSED",
        "ENOTFOUND",
        "ETIMEDOUT",
        "EHOSTUNREACH",
        "ER_ACCESS_DENIED_ERROR",
        "ER_DBACCESS_DENIED_ERROR",
        "ER_BAD_DB_ERROR",
        "ER_CON_COUNT_ERROR",
        "PROTOCOL_CONNECTION_LOST",
        "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
    ]);

    if (databaseErrorCodes.has(err.code)) {
        res.setHeader("Retry-After", "3");
        return errorResponse(res, "Database service is unavailable", null, 503);
    }

    if (err.code === "ER_DUP_ENTRY") {
        return errorResponse(res, "Policy number already exists", null, 409);
    }

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return errorResponse(
            res,
            "A selected policy hierarchy value no longer exists. Refresh the dropdowns and try again.",
            null,
            400
        );
    }

    if (err.code === "ER_BAD_NULL_ERROR") {
        return errorResponse(
            res,
            "A required policy field is missing. Refresh the page and submit the Motor Entry again.",
            null,
            400
        );
    }

    if ([
        "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD",
        "ER_WARN_DATA_OUT_OF_RANGE",
        "ER_DATA_TOO_LONG"
    ].includes(err.code)) {
        return errorResponse(res, "One or more policy fields contain an invalid value", null, 400);
    }
    
    // Multer file upload errors
    if (err.code === "LIMIT_FILE_SIZE") {
        const maxSize = req.path.endsWith("/profile/picture") ? "5MB" : "10MB";
        return errorResponse(res, `File size limit exceeded. Max limit is ${maxSize}.`, null, 400);
    }
    if (err.name === "MulterError") {
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return errorResponse(
                res,
                `Unsupported policy document field "${err.field}". Deploy/restart the matching backend version and try again.`,
                null,
                400
            );
        }
        return errorResponse(res, err.message || "Invalid file upload request.", null, 400);
    }
    
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    return errorResponse(res, message, process.env.NODE_ENV === "development" ? err : null, statusCode);
};

export default errorMiddleware;
