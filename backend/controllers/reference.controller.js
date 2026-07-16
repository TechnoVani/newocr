import ReferenceModel from "../models/reference.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

const formatLabel = (name, code) => {
    if (!name) return "-";
    return code ? `${name} (${code})` : name;
};

const getValidatedReference = async (body) => {
    const { bqp_id, reporting_id, relationship_id, pos_id } = body;
    const name = String(body.name || "").trim();
    const mobile = String(body.mobile || "").trim();

    if (![bqp_id, reporting_id, relationship_id, pos_id].every(value => /^\d+$/.test(String(value)))) {
        return { error: "Please select a valid BQP, manager, relationship manager and POSP" };
    }
    if (!name) return { error: "Reference name is required" };
    if (!/^\d{10}$/.test(mobile)) return { error: "A valid 10-digit mobile number is required" };

    const validHierarchy = await ReferenceModel.isValidHierarchy({
        bqp_id, reporting_id, relationship_id, pos_id
    });
    if (!validHierarchy) {
        return { error: "The selected BQP, manager, relationship manager and POSP do not match" };
    }

    return { bqp_id, reporting_id, relationship_id, pos_id, name, mobile };
};

class ReferenceController {
    /**
     * Create a new reference
     */
    static async create(req, res, next) {
        try {
            const validated = await getValidatedReference(req.body);
            if (validated.error) return errorResponse(res, validated.error, null, 400);
            const { bqp_id, reporting_id, relationship_id, pos_id, name, mobile } = validated;

            const createdBy = req.user?.id;
            if (!createdBy) {
                return errorResponse(res, "Unauthorized request", null, 401);
            }

            const insertId = await ReferenceModel.create({
                bqp_id,
                reporting_id,
                relationship_id,
                pos_id,
                ref_name: name,
                ref_mobile: mobile,
                created_by: createdBy
            });

            return successResponse(res, "Reference created successfully", { id: insertId }, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all references
     */
    static async getAll(req, res, next) {
        try {
            const rows = await ReferenceModel.findAll();
            
            const references = rows.map(row => ({
                id: row.id,
                bqp_id: row.bqp_id,
                reporting_id: row.reporting_id,
                relationship_id: row.relationship_id,
                pos_id: row.pos_id,
                bqp: formatLabel(row.bqp_name, row.bqp_code),
                manager: formatLabel(row.manager_name, row.manager_code),
                relationship: formatLabel(row.relationship_name, row.relationship_code),
                posp: formatLabel(row.posp_name, row.posp_code),
                name: row.ref_name,
                mobile: row.ref_mobile || ""
            }));

            return successResponse(res, "References retrieved successfully", references);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an existing reference
     */
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            if (!/^\d+$/.test(String(id)) || !(await ReferenceModel.exists(id))) {
                return errorResponse(res, "Reference not found", null, 404);
            }
            const validated = await getValidatedReference(req.body);
            if (validated.error) return errorResponse(res, validated.error, null, 400);
            const { bqp_id, reporting_id, relationship_id, pos_id, name, mobile } = validated;

            await ReferenceModel.update(id, {
                bqp_id,
                reporting_id,
                relationship_id,
                pos_id,
                ref_name: name,
                ref_mobile: mobile
            });

            return successResponse(res, "Reference updated successfully");
        } catch (error) {
            next(error);
        }
    }

    static async getByPospId(req, res, next) {
        try {
            const { pospId } = req.params;
            if (!/^\d+$/.test(String(pospId))) {
                return errorResponse(res, "pospId is required", null, 400);
            }

            const rows = await ReferenceModel.getByPospId(pospId);
            
            const references = rows.map(row => ({
                id: row.id,
                bqp_id: row.bqp_id,
                reporting_id: row.reporting_id,
                relationship_id: row.relationship_id,
                pos_id: row.pos_id,
                bqp: formatLabel(row.bqp_name, row.bqp_code),
                manager: formatLabel(row.manager_name, row.manager_code),
                relationship: formatLabel(row.relationship_name, row.relationship_code),
                posp: formatLabel(row.posp_name, row.posp_code),
                name: row.ref_name,
                mobile: row.ref_mobile || ""
            }));

            return successResponse(res, "References retrieved successfully", references);
        } catch (error) {
            next(error);
        }
    }
    
}

export default ReferenceController;
