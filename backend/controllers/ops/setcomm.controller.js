import SetCommService from "../../services/ops/setcomm.service.js";
import { successResponse } from "../../utils/response.js";
import { getPolicyReadScope } from "../../utils/dataScope.js";

class SetCommController {
    /**
     * Create a new set commission record.
     */
    static async create(req, res, next) {
        try {
            const data = { ...req.body };

            const result = await SetCommService.createSetComm(data);
            return successResponse(res, "Set commission record created successfully", result, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get the monthly policy commission report.
     */
    static async getAll(req, res, next) {
        try {
            const { search, sortBy, sortOrder, limit, page, month, year, business_type, pos_id, insurance_company } = req.query;
            
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const offset = (pageNum - 1) * limitNum;
            const now = new Date();
            const numericYear = Number(year ?? now.getFullYear());
            const numericMonth = Number(month ?? now.getMonth() + 1);
            if (!Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2100) {
                const error = new Error("Year must be between 2000 and 2100");
                error.statusCode = 400;
                throw error;
            }
            if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
                const error = new Error("Month must be between 1 and 12");
                error.statusCode = 400;
                throw error;
            }
            const reportMonth = `${numericYear}-${String(numericMonth).padStart(2, "0")}`;

            const readScope = getPolicyReadScope(req.user);
            const options = {
                readScope,
                search: search || "",
                month: reportMonth,
                business_type: business_type || "",
                pos_id: pos_id || "",
                insurance_company: insurance_company || "",
                sortBy: sortBy || "created_at",
                sortOrder: sortOrder || "DESC",
                limit: limitNum,
                offset: offset
            };

            const { rows, total } = await SetCommService.getAllSetCommissions(options);

            const { posOptions, insurers } = await SetCommService.getFilterOptions(readScope);

            return successResponse(res, "Policy commission records retrieved successfully", {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
                rows,
                visibility: readScope.all ? "all" : "self",
                period: { year: numericYear, month: numericMonth },
                posOptions,
                posIds: posOptions.map(option => option.value),
                insurers
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific set commission row by ID.
     */
    static async getById(req, res, next) {
        try {
            const record = await SetCommService.getSetCommById(req.params.id, getPolicyReadScope(req.user));
            return successResponse(res, "Set commission record retrieved successfully", record);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an existing set commission row.
     */
    static async update(req, res, next) {
        try {
            const data = { ...req.body };

            const result = await SetCommService.updateSetComm(req.params.id, data, getPolicyReadScope(req.user));
            return successResponse(res, "Policy commission updated successfully", result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a set commission row.
     */
    static async remove(req, res, next) {
        try {
            const result = await SetCommService.deleteSetComm(req.params.id, getPolicyReadScope(req.user));
            return successResponse(res, "Set commission record deleted successfully", result);
        } catch (error) {
            next(error);
        }
    }
}

export default SetCommController;
export { SetCommController };
