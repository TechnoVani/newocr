import { errorResponse } from "../utils/response.js";

/**
 * Global Express Error Handling Middleware
 */
const errorMiddleware = (err, req, res, next) => {
    console.error("Global Error Handler Log:", err);

    const databaseErrorCodes = new Set([
        "ECONNREFUSED",
        "ER_ACCESS_DENIED_ERROR",
        "PROTOCOL_CONNECTION_LOST",
        "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
    ]);

    if (databaseErrorCodes.has(err.code)) {
        return errorResponse(res, "Database service is unavailable", null, 503);
    }
    
    // Multer file upload errors
    if (err.code === "LIMIT_FILE_SIZE") {
        const maxSize = req.path.endsWith("/profile/picture") ? "5MB" : "10MB";
        return errorResponse(res, `File size limit exceeded. Max limit is ${maxSize}.`, null, 400);
    }
    if (err.name === "MulterError") {
        return errorResponse(res, err.message || "Invalid file upload request.", null, 400);
    }
    
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    return errorResponse(res, message, process.env.NODE_ENV === "development" ? err : null, statusCode);
};

export default errorMiddleware;
