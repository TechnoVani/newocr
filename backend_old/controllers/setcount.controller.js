import SetCountService from "../services/setcount.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

class SetCountController {
    /**
     * Create a new Set Count record
     */
    static async create(req, res, next) {
        try {
            const data = { ...req.body };

            const result = await SetCountService.createSetCount(data);
            return successResponse(res, "Set Count record created successfully", result, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all Set Count records with pagination, searching, and sorting
     */
    static async getAll(req, res, next) {
        try {
            const { search, sortBy, sortOrder, limit, page, month, business_type, pos_id, insurance_company } = req.query;
            
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const offset = (pageNum - 1) * limitNum;

            const options = {
                userId: req.user.id,
                search: search || "",
                month: month || "",
                business_type: business_type || "",
                pos_id: pos_id || "",
                insurance_company: insurance_company || "",
                sortBy: sortBy || "created_at",
                sortOrder: sortOrder || "DESC",
                limit: limitNum,
                offset: offset
            };

            const { rows, total } = await SetCountService.getAllSetCounts(options);

            // Fetch distinct filter values
            const posIds = await SetCountService.getAllSetCounts({ userId: req.user.id, limit: 1000 }).then(res => [...new Set(res.rows.map(r => r.pos_id))].filter(Boolean).sort());
            const insurers = await SetCountService.getAllSetCounts({ userId: req.user.id, limit: 1000 }).then(res => [...new Set(res.rows.map(r => r.insurance_company))].filter(Boolean).sort());

            return successResponse(res, "Policy commission records retrieved successfully", {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
                rows,
                posIds,
                insurers
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific Set Count record by ID
     */
    static async getById(req, res, next) {
        try {
            const record = await SetCountService.getSetCountById(req.params.id, req.user.id);
            return successResponse(res, "Set Count record retrieved successfully", record);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an existing Set Count record
     */
    static async update(req, res, next) {
        try {
            const data = { ...req.body };

            const result = await SetCountService.updateSetCount(req.params.id, data, req.user.id);
            return successResponse(res, "Policy commission updated successfully", result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a Set Count record
     */
    static async remove(req, res, next) {
        try {
            const result = await SetCountService.deleteSetCount(req.params.id, req.user.id);
            return successResponse(res, "Set Count record deleted successfully", result);
        } catch (error) {
            next(error);
        }
    }
}

export default SetCountController;
export { SetCountController };
