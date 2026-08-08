import { errorResponse } from "../utils/response.js";
import { AppError, httpStatusTitle } from "../utils/AppError.js";

const duplicateMessageFor = err => {
    const source = `${err.sqlMessage || ""} ${err.message || ""}`.toLowerCase();
    const keyMatch = source.match(/for key ['"`]?(?:[^.'"`]+[.])?([^'"`\s]+)['"`]?/i);
    const key = String(keyMatch?.[1] || "").toLowerCase();
    const combined = `${key} ${source}`;

    if (combined.includes("personal_email") || combined.includes("email")) return "This email already exists.";
    if (combined.includes("mobile") || combined.includes("contact")) return "This mobile number already exists.";
    if (combined.includes("aadhaar")) return "This Aadhaar number already exists.";
    if (combined.includes("pan")) return "This PAN number already exists.";
    if (combined.includes("employee_code")) return "This employee code already exists.";
    if (combined.includes("policy")) return "Policy Number already exists.";
    if (combined.includes("insurer") || combined.includes("company")) return "This insurer already exists.";
    if (combined.includes("branch")) return "This branch already exists.";
    if (combined.includes("reference") || combined.includes("ref_mobile")) return "This reference already exists.";
    if (combined.includes("document_number")) return "This document number already exists.";
    if (combined.includes("shift")) return "This shift already exists.";
    if (combined.includes("holiday")) return "This holiday already exists.";
    if (combined.includes("attendance")) return "Attendance for this employee and date already exists.";
    if (combined.includes("payroll")) return "Payroll for this employee and month already exists.";
    if (combined.includes("leave_type")) return "This leave type already exists.";
    if (combined.includes("performance")) return "Performance review for this employee and period already exists.";
    if (combined.includes("employee")) return "This employee record already exists.";

    return "This record already exists.";
};

const publicMessageFor = err => {
    if (err instanceof AppError) return err.message;
    if (err.expose || (Number(err.statusCode) >= 400 && Number(err.statusCode) < 500)) {
        return err.message || httpStatusTitle(err.statusCode);
    }
    return "Something went wrong. Please try again or contact support.";
};

const errorMiddleware = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    console.error("API error:", {
        method: req.method,
        path: req.originalUrl,
        statusCode: err.statusCode,
        code: err.code,
        message: err.message
    });

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
        return errorResponse(res, duplicateMessageFor(err), null, 409);
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
    
    const statusCode = Number(err.statusCode) || 500;
    return errorResponse(res, publicMessageFor(err), err.details || null, statusCode);
};

export default errorMiddleware;
