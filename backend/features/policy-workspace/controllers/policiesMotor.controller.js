// Shared policy-workspace controller.
import PoliciesMotorService from "../services/policiesMotor.service.js";
import PoliciesMotorModel from "../models/policiesMotor.model.js";
import { successResponse, errorResponse } from "../../../utils/response.js";
import { getPolicyReadScope } from "../../../utils/dataScope.js";

const deriveRtoFromRegistration = registrationNumber => {
    const normalized = String(registrationNumber || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    if (!normalized || normalized.includes("NEW") || normalized.length < 4) return undefined;
    return normalized.slice(0, 4);
};

const EMPTY_VALUE_MARKERS = new Set(["", "-", "NA", "N/A", "NULL", "UNDEFINED"]);
const NUMERIC_FIELDS = new Set([
    "bqp_id",
    "reporting_id",
    "rm_id",
    "pos_id",
    "ref_id",
    "idv",
    "first_year_od",
    "first_year_tp",
    "total_od",
    "total_tp",
    "net_premium",
    "gst",
    "total_payable",
    "manufacturing_year"
]);
const INTEGER_FIELDS = new Set([
    "bqp_id",
    "reporting_id",
    "rm_id",
    "pos_id",
    "ref_id",
    "manufacturing_year"
]);
const REQUIRED_HIERARCHY_ID_FIELDS = new Set([
    "bqp_id",
    "reporting_id",
    "rm_id",
    "pos_id",
    "ref_id"
]);

const normalizeEmptyValue = value => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    return EMPTY_VALUE_MARKERS.has(trimmed.toUpperCase()) ? null : trimmed;
};

const normalizeNumericValue = (field, value) => {
    const normalized = normalizeEmptyValue(value);
    if (normalized === undefined || normalized === null) return normalized;

    const cleaned = typeof normalized === "string"
        ? normalized.replace(/,/g, "").replace(/[₹\s]/g, "")
        : normalized;
    const numericValue = Number(cleaned);
    const isValid = Number.isFinite(numericValue) &&
        (!INTEGER_FIELDS.has(field) || Number.isInteger(numericValue));

    if (!isValid && REQUIRED_HIERARCHY_ID_FIELDS.has(field)) {
        const error = new Error(`Invalid ${field.replaceAll("_", " ")} value`);
        error.statusCode = 400;
        throw error;
    }

    // OCR-derived amounts and manufacturing year are nullable database fields.
    // Unrecognized OCR text must not prevent an otherwise valid policy save.
    return isValid ? numericValue : null;
};

const normalizeMappedData = data => Object.fromEntries(
    Object.entries(data)
        .map(([field, value]) => [
            field,
            NUMERIC_FIELDS.has(field)
                ? normalizeNumericValue(field, value)
                : normalizeEmptyValue(value)
        ])
        .filter(([, value]) => value !== undefined)
);

/**
 * Maps the React frontend nested/camelCase object structure to a flat snake_case SQL schema structure.
 * Supports both raw flat fields (e.g. from Postman) and nested structured fields (from the React UI).
 */
function mapFrontendToBackend(frontendData) {
    if (!frontendData) return {};

    const data = {};

    // 1. Direct top-level mapping
    data.policy_number = frontendData.policy_number || frontendData.policyNumber;
    data.insurance_company = frontendData.insurance_company || frontendData.insuranceCompany;
    data.insurer_branch =
        frontendData.insurer_branch ||
        frontendData.insurerBranch ||
        frontendData.branchAddress;
    data.policy_type = frontendData.policy_type || frontendData.productType;
    data.vehicle_category = frontendData.vehicle_category || frontendData.vehicleCategory;
    data.insured_name = frontendData.insured_name || frontendData.insuredName;
    data.pan = frontendData.pan || frontendData.panNumber;
    data.gstin = frontendData.gstin;
    data.contact = frontendData.contact || frontendData.contactNumber;
    data.email = frontendData.email;
    data.address = frontendData.address || frontendData.insuredAddress;
    data.issue_date = frontendData.issue_date || frontendData.dateOfIssue;
    data.idv = frontendData.idv || frontendData.totalValue;
    data.previous_insurer = frontendData.previous_insurer || frontendData.previousInsurer;
    data.previous_policy = frontendData.previous_policy || frontendData.previousPolicyNumber;

    // 2. Nested policyDates mapping
    const dates = frontendData.policyDates || {};
    data.start_date = frontendData.start_date || dates.startDate;
    data.od_expiry = frontendData.od_expiry || dates.odExpireDate;
    data.tp_expiry = frontendData.tp_expiry || dates.tpExpireDate;

    // 3. Nested finalPremium mapping
    const premium = frontendData.finalPremium || {};
    data.first_year_od = frontendData.first_year_od || premium.firstYearOd || premium.calculatedOdPremium;
    data.first_year_tp = frontendData.first_year_tp || premium.firstYearTp || premium.calculatedTpPremium;
    data.total_od = frontendData.total_od || premium.totalOd || premium.totalOdPremium;
    data.total_tp = frontendData.total_tp || premium.totalTp || premium.totalTpPremium;
    data.net_premium = frontendData.net_premium || premium.netPremium;
    data.gst = frontendData.gst || premium.gst;
    data.total_payable = frontendData.total_payable || premium.totalPayable;

    // 4. Nested vehicle details mapping
    const v = frontendData.vehicle || {};
    data.registration_number = frontendData.registration_number || v.registrationNumber;
    data.rto =
        frontendData.rto ||
        v.rto ||
        deriveRtoFromRegistration(data.registration_number);
    data.make_name = frontendData.make_name || v.make;
    data.model_name = frontendData.model_name || v.model;
    data.variant_name = frontendData.variant_name || v.variant;
    data.manufacturing_year = frontendData.manufacturing_year || v.manufacturingYear;
    data.fuel = frontendData.fuel || v.fuelType;
    data.cc = frontendData.cc || v.cubicCapacity;
    const seatingCapacity = frontendData.seating_capacity ?? v.seatingCapacity;
    data.seating_capacity = seatingCapacity === undefined || seatingCapacity === null
        ? undefined
        : String(seatingCapacity).trim();
    data.chassis_number = frontendData.chassis_number || v.chassisNumber;
    data.engine_number = frontendData.engine_number || v.engineNumber;
    data.sub_type = frontendData.sub_type || v.subType;
    data.commercial_vehicle_type =
        frontendData.commercial_vehicle_type ||
        v.commercialVehicleType ||
        v.miscVehicleType;
    data.ncb = frontendData.ncb ?? v.ncb;
    data.financier = frontendData.financier || v.financierName;
    data.gvw = frontendData.gvw || v.gvw;

    // 5. Nested / Flat IRDA Section
    data.irda_od = frontendData.irda_od || v.irdaOd || frontendData.irdaOd;
    data.irda_tp = frontendData.irda_tp || v.irdaTp || frontendData.irdaTp;
    data.irda_net = frontendData.irda_net || v.irdaNet || frontendData.irdaNet;

    // 6. Nested / Flat POS Section
    data.pos_od = frontendData.pos_od || v.posOd || frontendData.posOd;
    data.pos_tp = frontendData.pos_tp || v.posTp || frontendData.posTp;
    data.pos_net = frontendData.pos_net || v.posNet || frontendData.posNet;

    // 7. Remarks, verification and payment
    data.verify_remark = frontendData.verify_remark || v.verifyRemark || frontendData.verifyRemark;
    data.account_remark = frontendData.account_remark || v.accountRemark || frontendData.accountRemark;
    data.payment_status = frontendData.payment_status || v.paymentStatus || frontendData.paymentStatus;

    // 8. General IDs / Business Type
    const motor = frontendData.motorEntry || {};
    data.bqp_id = frontendData.bqp_id || frontendData.bqpId || motor.bqp;
    data.reporting_id = frontendData.reporting_id || frontendData.reportingId || motor.manager;
    data.rm_id = frontendData.rm_id || frontendData.rmId || motor.relationship;
    data.pos_id = frontendData.pos_id || frontendData.posId || motor.posp;
    data.ref_id = frontendData.ref_id || frontendData.refId || motor.reference;
    data.business_type = frontendData.business_type || frontendData.businessType || motor.businessType;

    // OCR adapters use placeholders such as "-", "N/A" and comma-formatted
    // amounts. Convert them to SQL-safe nullable/typed values before binding.
    return normalizeMappedData(data);
}

function attachUploadedDocuments(data, files = {}) {
    const pdf = files.pdfFile?.[0] || files.pdf?.[0];
    if (pdf) data.pdfDocument = pdf;

    const aadhaarFront = files.aadhaar_front?.[0];
    if (aadhaarFront) data.aadhaarFrontDocument = aadhaarFront;

    const aadhaarBack = files.aadhaar_back?.[0];
    if (aadhaarBack) data.aadhaarBackDocument = aadhaarBack;

    const pan = files.pan?.[0];
    if (pan) data.panCardDocument = pan;

    const legacyRc = files.rc?.[0];
    const rcFront = files.rc_front?.[0] || legacyRc;
    const rcBack = files.rc_back?.[0] || legacyRc;
    if (rcFront) data.rcFrontDocument = rcFront;
    if (rcBack) data.rcBackDocument = rcBack;

    const previousPolicy = files.previous_policy?.[0];
    if (previousPolicy) data.previousPolicyDocument = previousPolicy;

    const surveyReport = files.survey_report?.[0];
    if (surveyReport) data.surveyReportDocument = surveyReport;

    const gstCertificate = files.gst_certificate?.[0];
    if (gstCertificate) data.gstCertificateDocument = gstCertificate;
}

class PoliciesMotorController {
    /**
     * Create a new policy record
     */
    static async create(req, res, next) {
        try {
            let rawData = {};
            
            // Handle multipart JSON payload if present
            if (req.body.policyData) {
                try {
                    rawData = JSON.parse(req.body.policyData);
                } catch (err) {
                    return errorResponse(res, "Invalid policyData JSON format", null, 400);
                }
            } else {
                rawData = { ...req.body };
            }

            // Map frontend object keys to backend schema
            const mappedData = mapFrontendToBackend(rawData);
            mappedData.created_by = req.user?.id;

            attachUploadedDocuments(mappedData, req.files);

            const result = await PoliciesMotorService.createPolicy(mappedData);
            return successResponse(
                res,
                "Policy created successfully",
                result,
                201
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all policies
     */
    static async getAll(req, res, next) {
        try {
            const policies = await PoliciesMotorService.getAllPolicies(getPolicyReadScope(req.user));
            return successResponse(res, "Policies retrieved successfully", {
                count: policies.length,
                policies
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific policy details by ID
     */
    static async getById(req, res, next) {
        try {
            const policy = await PoliciesMotorService.getPolicyById(req.params.id, getPolicyReadScope(req.user));
            return successResponse(res, "Policy retrieved successfully", policy);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific policy details by Reference ID or Policy Number
     */
    static async getByRefId(req, res, next) {
        try {
            const policy = await PoliciesMotorModel.findByRefId(req.params.refId, getPolicyReadScope(req.user));
            if (!policy) {
                return errorResponse(res, "Policy not found with matching reference ID", null, 404);
            }
            return successResponse(res, "Policy retrieved successfully by reference ID", policy);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Check whether a policy number already exists.
     */
    static async checkPolicyNumber(req, res, next) {
        try {
            const policyNumber = String(req.query.policyNumber || req.query.policy_number || "").trim();
            if (!policyNumber) {
                return errorResponse(res, "Policy number is required", null, 400);
            }

            const policy = await PoliciesMotorModel.findByPolicyNumber(policyNumber);
            return successResponse(res, "Policy number checked successfully", {
                exists: Boolean(policy),
                policy: policy ? {
                    id: policy.id,
                    policy_number: policy.policy_number,
                    insured_name: policy.insured_name,
                    registration_number: policy.registration_number,
                    issue_date: policy.issue_date
                } : null
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an existing policy
     */
    static async update(req, res, next) {
        try {
            let rawData = {};
            
            // Handle multipart JSON payload if present
            if (req.body.policyData) {
                try {
                    rawData = JSON.parse(req.body.policyData);
                } catch (err) {
                    return errorResponse(res, "Invalid policyData JSON format", null, 400);
                }
            } else {
                rawData = { ...req.body };
            }

            // Map frontend object keys to backend schema
            const mappedData = mapFrontendToBackend(rawData);

            attachUploadedDocuments(mappedData, req.files);

            const result = await PoliciesMotorService.updatePolicy(
                req.params.id,
                mappedData,
                getPolicyReadScope(req.user)
            );
            return successResponse(res, "Policy updated successfully", result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a policy record
     */
    static async remove(req, res, next) {
        try {
            const result = await PoliciesMotorService.deletePolicy(
                req.params.id,
                getPolicyReadScope(req.user)
            );
            return successResponse(res, "Policy deleted successfully", result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Search policy records
     */
    static async search(req, res, next) {
        try {
            const query = req.query.q || req.query.query;
            if (!query) {
                return errorResponse(res, "Search query parameter 'q' is required", null, 400);
            }
            const result = await PoliciesMotorService.searchPolicy(query, getPolicyReadScope(req.user));
            return successResponse(res, "Search results retrieved successfully", result);
        } catch (error) {
            next(error);
        }
    }

    static async getAllRefs(req, res, next) {
        try {
            const result = await PoliciesMotorModel.getAllReferenceIds(getPolicyReadScope(req.user));
            return successResponse(res, "Reference IDs retrieved successfully", result);
        } catch (error) {
            next(error);
        }
    }

    static async getDashboardSummary(req, res, next) {
        try {
            const result = await PoliciesMotorModel.getDashboardSummary(getPolicyReadScope(req.user));
            return successResponse(res, "Dashboard summary retrieved successfully", result);
        } catch (error) {
            next(error);
        }
    }

    static async getMonthlyReport(req, res, next) {
        try {
            const now = new Date();
            const year = req.query.year ?? now.getFullYear();
            const month = req.query.month ?? now.getMonth() + 1;
            const result = await PoliciesMotorService.getMonthlyReport(year, month, getPolicyReadScope(req.user));
            return successResponse(res, "Monthly policy report retrieved successfully", result);
        } catch (error) {
            next(error);
        }
    }

    static async getRenewalReport(req, res, next) {
        try {
            const now = new Date();
            const year = req.query.year ?? now.getFullYear();
            const month = req.query.month ?? now.getMonth() + 1;
            const result = await PoliciesMotorService.getRenewalReport(year, month, getPolicyReadScope(req.user), { type: req.query.type });
            return successResponse(res, "Policy renewal report retrieved successfully", result);
        } catch (error) {
            next(error);
        }
    }
}

export default PoliciesMotorController;
export { attachUploadedDocuments, mapFrontendToBackend };
