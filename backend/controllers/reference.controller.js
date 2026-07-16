import ReferenceModel from '../models/reference.model.js';
import { successResponse, errorResponse } from '../utils/response.js';

const isPositiveId = value => {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0;
};

const formatLabel = (name, code) => !name ? '-' : code ? `${name} (${code})` : name;

const formatReference = row => ({
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
    mobile: row.ref_mobile || ''
});

const buildReferenceData = body => ({
    bqp_id: Number(body?.bqp_id),
    reporting_id: Number(body?.reporting_id),
    relationship_id: Number(body?.relationship_id),
    pos_id: Number(body?.pos_id),
    ref_name: String(body?.name || '').trim(),
    ref_mobile: String(body?.mobile || '').trim()
});

const validateReference = async (body, checkDuplicate = false) => {
    const data = buildReferenceData(body);
    const { bqp_id, reporting_id, relationship_id, pos_id, ref_name, ref_mobile } = data;

    if (![bqp_id, reporting_id, relationship_id, pos_id].every(isPositiveId)) {
        return { error: 'Please select valid BQP, manager, relationship manager and POSP' };
    }
    if (!ref_name) return { error: 'Reference name is required' };
    if (!/^\d{10}$/.test(ref_mobile)) {
        return { error: 'A valid 10-digit mobile number is required' };
    }
    if (!(await ReferenceModel.isValidHierarchy(data))) {
        return { error: 'The selected active hierarchy does not match' };
    }
    if (checkDuplicate && await ReferenceModel.duplicateExists(pos_id, ref_name, ref_mobile)) {
        return { error: 'A reference with this name and mobile already exists for the selected POSP' };
    }
    return data;
};

class ReferenceController {
    static async getAll(req, res, next) {
        try {
            const rows = await ReferenceModel.findAll();
            return successResponse(res, 'References retrieved successfully', rows.map(formatReference));
        } catch (error) { next(error); }
    }

    static async create(req, res, next) {
        try {
            const data = await validateReference(req.body, true);
            if (data.error) return errorResponse(res, data.error, null, 400);
            if (!isPositiveId(req.user?.id)) {
                return errorResponse(res, 'Unauthorized request', null, 401);
            }
            const id = await ReferenceModel.create({
                ...data,
                created_by: req.user.id
            });
            return successResponse(res, 'Reference created successfully', { id }, 201);
        } catch (error) { next(error); }
    }

    static async update(req, res, next) {
        try {
            if (!isPositiveId(req.params.id)) {
                return errorResponse(res, 'Invalid reference ID', null, 404);
            }
            if (!(await ReferenceModel.exists(req.params.id))) {
                return errorResponse(res, 'Reference not found', null, 404);
            }
            const data = await validateReference(req.body);
            if (data.error) return errorResponse(res, data.error, null, 400);
            await ReferenceModel.update(req.params.id, data);
            return successResponse(res, 'Reference updated successfully');
        } catch (error) { next(error); }
    }
}

export default ReferenceController;
