import { errorResponse } from "../utils/response.js";

/**
 * Validation Middleware for Set Count Requests
 */
export const validateSetCount = (req, res, next) => {
    const {
        pos_id,
        ref_id,
        business_type,
        insurance_company,
        vehicle_category,
        insured_name,
        contact,
        email,
        first_year_od,
        first_year_tp,
        total_od,
        total_tp,
        irda_od,
        irda_tp,
        irda_net,
        pos_od,
        pos_tp,
        pos_net
    } = req.body;

    const errors = {};

    // 1. Required Fields validation
    if (!pos_id || String(pos_id).trim() === "") {
        errors.pos_id = "POS ID is required";
    }
    if (!ref_id || String(ref_id).trim() === "") {
        errors.ref_id = "Reference ID is required";
    }
    if (!insured_name || String(insured_name).trim() === "") {
        errors.insured_name = "Insured Name is required";
    }

    // 2. Email validation if provided
    if (email && String(email).trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.email = "Please provide a valid email address";
        }
    }

    // 3. Contact validation if provided
    if (contact && String(contact).trim() !== "") {
        // Typically a 10-digit number validation for phone numbers
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(String(contact).trim())) {
            errors.contact = "Contact number must be exactly 10 digits";
        }
    }

    // 4. Validate and sanitize numeric premium fields
    const numericFields = {
        first_year_od,
        first_year_tp,
        total_od,
        total_tp,
        irda_od,
        irda_tp,
        irda_net,
        pos_od,
        pos_tp,
        pos_net
    };

    for (const [key, value] of Object.entries(numericFields)) {
        if (value !== undefined && value !== null && value !== "") {
            const num = parseFloat(value);
            if (isNaN(num)) {
                errors[key] = `${key.replace(/_/g, " ")} must be a valid number`;
            } else if (num < 0) {
                errors[key] = `${key.replace(/_/g, " ")} cannot be a negative amount`;
            } else {
                // Sanitize request body value
                req.body[key] = num;
            }
        } else {
            // Default empty/missing fields to 0.00
            req.body[key] = 0.00;
        }
    }

    // 5. Check if there are any errors
    if (Object.keys(errors).length > 0) {
        return errorResponse(res, "Validation failed", errors, 400);
    }

    next();
};

export const validateCommissionUpdate = (req, res, next) => {
    const fields = ["irda_od", "irda_tp", "irda_net", "pos_od", "pos_tp", "pos_net"];
    const errors = {};
    const sanitized = {};

    fields.forEach(field => {
        const value = req.body[field];
        const amount = Number(value);
        if (value === "" || value === null || value === undefined || !Number.isFinite(amount)) {
            errors[field] = `${field.replaceAll("_", " ")} must be a valid number`;
        } else if (amount < 0) {
            errors[field] = `${field.replaceAll("_", " ")} cannot be negative`;
        } else {
            sanitized[field] = Number(amount.toFixed(2));
        }
    });

    if (Object.keys(errors).length > 0) {
        return errorResponse(res, "Validation failed", errors, 400);
    }

    req.body = sanitized;
    next();
};
