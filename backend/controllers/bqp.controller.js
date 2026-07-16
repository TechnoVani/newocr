import BqpModel from "../models/bqp.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

const ALLOWED_STATUSES = { active: 'Active', inactive: 'Inactive' };
const ALLOWED_BQP_FLAGS = { yes: 'Yes', no: 'No' };
const ALLOWED_VERI = { yes: 'Yes', no: 'No' };

const getChoice = (value, choices, fallback) =>
    choices[String(value || fallback).trim().toLowerCase()];

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

class BqpController {
    static async getBqp(req, res, next) {
        try {
            const status = getChoice(req.query.status, ALLOWED_STATUSES, 'Active');
            const isBqp = getChoice(req.query.is_bqp, ALLOWED_BQP_FLAGS, 'Yes');
            if (!status || !isBqp) {
                return errorResponse(res, 'status must be Active or Inactive and is_bqp must be Yes or No', null, 400);
            }
            const bqps = await BqpModel.getBqp({ status, isBqp });
            return successResponse(res, "BQP list fetched successfully", bqps);
        } catch (error) { next(error); }
    }

    static async getReportingManagers(req, res, next) {
        try {
            const status = getChoice(req.query.status, ALLOWED_STATUSES, 'Active');
            if (!isPositiveId(req.params.bqpId) || !status) {
                return errorResponse(res, 'A valid bqpId and status are required', null, 400);
            }
            const rows = await BqpModel.getEmployeesByBqp(req.params.bqpId, status);
            return successResponse(res, 'Employees reporting to BQP fetched successfully', rows);
        } catch (error) { next(error); }
    }

    static async getRelationshipManagers(req, res, next) {
        try {
            const status = getChoice(req.query.status, ALLOWED_STATUSES, 'Active');
            if (!isPositiveId(req.params.managerId) || !status) {
                return errorResponse(res, 'A valid managerId and status are required', null, 400);
            }
            const rows = await BqpModel.getRelationshipManagersByManager(req.params.managerId, status);
            return successResponse(res, 'Relationship managers fetched successfully', rows);
        } catch (error) { next(error); }
    }

    // ***** Added veri filter *****
    static async getPosps(req, res, next) {
        try {
            const status = getChoice(req.query.status, ALLOWED_STATUSES, 'Active');
            const veri = getChoice(req.query.veri, ALLOWED_VERI, null); // optional

            if (!isPositiveId(req.params.relationshipId) || !status) {
                return errorResponse(res, 'A valid relationshipId and status are required', null, 400);
            }
            const rows = await BqpModel.getPospByRelationshipManager(
                req.params.relationshipId,
                status,
                veri
            );
            return successResponse(res, 'POSPs fetched successfully', rows);
        } catch (error) { next(error); }
    }

    static async getReferencesByPospId(req, res, next) {
        try {
            if (!isPositiveId(req.params.pospId)) {
                return errorResponse(res, 'A valid pospId is required', null, 400);
            }
            const rows = await BqpModel.getReferencesByPospId(req.params.pospId);
            return successResponse(res, 'References retrieved successfully', rows.map(formatReference));
        } catch (error) { next(error); }
    }
}

export default BqpController;