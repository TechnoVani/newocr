import PoliciesMotorModel from "../models/policiesMotor.model.js";
import FolderService, { sanitizePolicyNumber } from "./folder.service.js";
import { formatToMySQLDate } from "../../../utils/dateFormatter.js";
import db from "../../../config/database.js";

const DOCUMENT_FIELDS = [
    "pdfDocument",
    "aadhaarFrontDocument",
    "aadhaarBackDocument",
    "panCardDocument",
    "rcFrontDocument",
    "rcBackDocument",
    "previousPolicyDocument",
    "surveyReportDocument",
    "gstCertificateDocument"
];

const RC_REQUIRED_BUSINESS_TYPES = new Set(["Rollover", "BreakIN", "NIB Renewal", "Renewal"]);
const PREVIOUS_POLICY_REQUIRED_BUSINESS_TYPES = new Set(["Rollover", "NIB Renewal", "Renewal"]);

export const validateDocuments = (data) => {
    if (!data.pdfDocument?.buffer) {
        const error = new Error("Policy PDF is required");
        error.statusCode = 400;
        throw error;
    }

    const hasAadhaarFront = Boolean(data.aadhaarFrontDocument?.buffer);
    const hasAadhaarBack = Boolean(data.aadhaarBackDocument?.buffer);
    const hasCompleteAadhaar = hasAadhaarFront && hasAadhaarBack;
    const hasPanCard = Boolean(data.panCardDocument?.buffer);
    const hasGstCertificate = Boolean(data.gstCertificateDocument?.buffer);

    if ((hasAadhaarFront || hasAadhaarBack) && !hasCompleteAadhaar) {
        const error = new Error("Upload both Aadhaar front and Aadhaar back, or use PAN card/GST certificate instead");
        error.statusCode = 400;
        throw error;
    }

    if (!hasCompleteAadhaar && !hasPanCard && !hasGstCertificate) {
        const error = new Error("Upload at least one KYC document: Aadhaar front & back, PAN card, or GST certificate");
        error.statusCode = 400;
        throw error;
    }

    const businessType = String(data.business_type || "").trim();
    if (
        RC_REQUIRED_BUSINESS_TYPES.has(businessType) &&
        (!data.rcFrontDocument?.buffer || !data.rcBackDocument?.buffer)
    ) {
        const error = new Error(`RC front and RC back documents are required for ${businessType}`);
        error.statusCode = 400;
        throw error;
    }

    if (
        PREVIOUS_POLICY_REQUIRED_BUSINESS_TYPES.has(businessType) &&
        !data.previousPolicyDocument?.buffer
    ) {
        const error = new Error(`Previous Policy document is required for ${businessType}`);
        error.statusCode = 400;
        throw error;
    }
};

const isPositiveInteger = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;

const validatePolicyData = async data => {
    if (!String(data.policy_number || "").trim()) {
        const error = new Error("Policy number is required");
        error.statusCode = 400;
        throw error;
    }

    if (!String(data.rto || "").trim()) {
        const error = new Error("Registration Authority / RTO is required");
        error.statusCode = 400;
        throw error;
    }

    if (!isPositiveInteger(data.created_by)) {
        const error = new Error("Authenticated employee is required to save a policy");
        error.statusCode = 401;
        throw error;
    }

    const hierarchyFields = ["bqp_id", "reporting_id", "rm_id", "pos_id", "ref_id"];
    if (!hierarchyFields.every(field => isPositiveInteger(data[field]))) {
        const error = new Error("Please select a valid BQP, reporting manager, relationship manager, POSP and reference");
        error.statusCode = 400;
        throw error;
    }

    if (!(await PoliciesMotorModel.isValidHierarchy(data))) {
        const error = new Error("The selected Motor Entry hierarchy no longer matches. Refresh the dropdowns and select it again.");
        error.statusCode = 400;
        throw error;
    }
};

const formatPolicyDates = data => {
    const dateFields = ["start_date", "od_expiry", "tp_expiry", "issue_date"];
    dateFields.forEach(field => {
        if (data[field]) data[field] = formatToMySQLDate(data[field]);
    });

    if (!data.issue_date) {
        const error = new Error("A valid policy issue date is required");
        error.statusCode = 400;
        throw error;
    }
};

const getDatabasePayload = data => {
    const cleanPayload = { ...data };
    DOCUMENT_FIELDS.forEach(field => delete cleanPayload[field]);
    delete cleanPayload.ocr_text;
    delete cleanPayload.extracted_json;
    delete cleanPayload.pdf_path;
    delete cleanPayload.aadhaar_front_path;
    delete cleanPayload.aadhaar_back_path;
    delete cleanPayload.pan_card_path;
    return cleanPayload;
};

const storePolicyDocuments = async (data, folderPath, policyNumber) => {
    const stored = {};
    if (data.pdfDocument) {
        stored.policy = await FolderService.storeBuffer(
            data.pdfDocument,
            folderPath,
            sanitizePolicyNumber(policyNumber) + ".pdf"
        );
    }
    if (data.aadhaarFrontDocument) {
        stored.aadhaarFront = await FolderService.storeBuffer(data.aadhaarFrontDocument, folderPath, "aadhaar_front");
    }
    if (data.aadhaarBackDocument) {
        stored.aadhaarBack = await FolderService.storeBuffer(data.aadhaarBackDocument, folderPath, "aadhaar_back");
    }
    if (data.panCardDocument) {
        stored.panCard = await FolderService.storeBuffer(data.panCardDocument, folderPath, "pan_card");
    }
    if (data.rcFrontDocument) {
        stored.rcFront = await FolderService.storeBuffer(data.rcFrontDocument, folderPath, "rc_front");
    }
    if (data.rcBackDocument) {
        stored.rcBack = await FolderService.storeBuffer(data.rcBackDocument, folderPath, "rc_back");
    }
    if (data.previousPolicyDocument) {
        stored.previousPolicy = await FolderService.storeBuffer(data.previousPolicyDocument, folderPath, "previous_policy");
    }
    if (data.surveyReportDocument) {
        stored.surveyReport = await FolderService.storeBuffer(data.surveyReportDocument, folderPath, "survey_report");
    }
    if (data.gstCertificateDocument) {
        stored.gstCertificate = await FolderService.storeBuffer(data.gstCertificateDocument, folderPath, "gst_certificate");
    }
    return stored;
};

class PoliciesMotorService {
    /**
     * Create a new policy record and organize its documents in the file system
     * @param {object} data - Policy data including in-memory uploaded documents
     * @returns {Promise<object>} Result metadata containing insertion ID
     */
    async createPolicy(data) {
        await validatePolicyData(data);
        validateDocuments(data);
        formatPolicyDates(data);

        // Check for duplicates
        const duplicate = await PoliciesMotorModel.findByPolicyNumber(data.policy_number);
        if (duplicate) {
            const error = new Error("Policy number already exists");
            error.statusCode = 409;
            throw error;
        }

        const folderExisted = await FolderService.policyFolderExists(
            data.issue_date,
            data.policy_number
        );
        const folderPath = await FolderService.createPolicyFolder(
            data.issue_date,
            data.policy_number
        );
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            const policyId = await PoliciesMotorModel.create(getDatabasePayload(data), connection);
            const documents = await storePolicyDocuments(data, folderPath, data.policy_number);
            await connection.commit();

            return {
                id: policyId,
                message: "Policy and documents created successfully",
                folderPath,
                documents,
                action: "created"
            };
        } catch (error) {
            if (connection) {
                await connection.rollback().catch(rollbackError => {
                    console.error("Failed to roll back policy insert:", rollbackError.message);
                });
            }
            if (!folderExisted) {
                await FolderService.removeNewPolicyFolder(folderPath).catch(cleanupError => {
                    console.error("Failed to clean incomplete policy folder:", cleanupError.message);
                });
            }
            throw error;
        } finally {
            connection?.release();
        }
    }

    /**
     * Get all policies in the system
     */
    async getAllPolicies(readScope) {
        return await PoliciesMotorModel.findAll(readScope);
    }

    /**
     * Get a specific policy details by ID
     */
    async getPolicyById(id, readScope) {
        const policy = await PoliciesMotorModel.findById(id, readScope);
        if (!policy) {
            throw new Error("Policy not found");
        }
        return policy;
    }

    /**
     * Update an existing policy and move files if new uploads are provided
     */
    async updatePolicy(id, data, readScope) {
        // Check if policy exists
        const existingPolicy = await PoliciesMotorModel.findById(id, readScope);
        if (!existingPolicy) {
            throw new Error("Policy not found");
        }

        const dateFields = ["start_date", "od_expiry", "tp_expiry", "issue_date"];
        dateFields.forEach(field => {
            if (data[field]) data[field] = formatToMySQLDate(data[field]);
        });

        // Determine final folder path
        const issueDate = data.issue_date || existingPolicy.issue_date;
        const policyNumber = data.policy_number || existingPolicy.policy_number;
        const folderPath = await FolderService.createPolicyFolder(issueDate, policyNumber);

        // Write newly uploaded files directly into the final policy folder.
        if (data.pdfDocument) {
            await FolderService.storeBuffer(
                data.pdfDocument,
                folderPath,
                sanitizePolicyNumber(policyNumber) + ".pdf"
            );
        }
        
        if (data.aadhaarFrontDocument) {
            await FolderService.storeBuffer(
                data.aadhaarFrontDocument,
                folderPath,
                "aadhaar_front"
            );
        }

        if (data.aadhaarBackDocument) {
            await FolderService.storeBuffer(
                data.aadhaarBackDocument,
                folderPath,
                "aadhaar_back"
            );
        }

        if (data.panCardDocument) {
            await FolderService.storeBuffer(
                data.panCardDocument,
                folderPath,
                "pan_card"
            );
        }

        if (data.rcFrontDocument) {
            await FolderService.storeBuffer(data.rcFrontDocument, folderPath, "rc_front");
        }

        if (data.rcBackDocument) {
            await FolderService.storeBuffer(data.rcBackDocument, folderPath, "rc_back");
        }

        if (data.previousPolicyDocument) {
            await FolderService.storeBuffer(data.previousPolicyDocument, folderPath, "previous_policy");
        }

        if (data.surveyReportDocument) {
            await FolderService.storeBuffer(data.surveyReportDocument, folderPath, "survey_report");
        }

        if (data.gstCertificateDocument) {
            await FolderService.storeBuffer(data.gstCertificateDocument, folderPath, "gst_certificate");
        }

        // Clean payload for updates
        const cleanPayload = getDatabasePayload(data);

        // Save to Database
        const affectedRows = await PoliciesMotorModel.update(id, cleanPayload, readScope);
        if (affectedRows === 0) {
            throw new Error("No changes made or policy update failed");
        }

        return {
            message: "Policy updated successfully",
            folderPath
        };
    }

    /**
     * Delete a policy by ID
     */
    async deletePolicy(id, readScope) {
        const affectedRows = await PoliciesMotorModel.delete(id, readScope);
        if (affectedRows === 0) {
            throw new Error("Policy not found or already deleted");
        }
        return {
            message: "Policy deleted successfully"
        };
    }

    /**
     * Search policy records
     */
    async searchPolicy(keyword, readScope) {
        if (!keyword) {
            throw new Error("Search keyword required");
        }
        return await PoliciesMotorModel.search(keyword, readScope);
    }

    async getMonthlyReport(year, month, readScope) {
        const numericYear = Number(year);
        const numericMonth = Number(month);

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

        const pad = value => String(value).padStart(2, "0");
        const startDate = `${numericYear}-${pad(numericMonth)}-01`;
        const nextYear = numericMonth === 12 ? numericYear + 1 : numericYear;
        const nextMonth = numericMonth === 12 ? 1 : numericMonth + 1;
        const endDate = `${nextYear}-${pad(nextMonth)}-01`;
        const policies = await PoliciesMotorModel.findMonthlyReport(startDate, endDate, readScope);

        const toAmount = value => Number(value) || 0;
        const cancellationEntries = policies.filter(policy => Number(policy.is_cancelled) === 1);
        const summary = policies.reduce(
            (totals, policy) => {
                if (Number(policy.is_cancelled) !== 1) totals.policyCount += 1;
                totals.netPremium += toAmount(policy.net_premium);
                totals.gst += toAmount(policy.gst);
                totals.totalPayable += toAmount(policy.total_payable);
                return totals;
            },
            { policyCount: 0, netPremium: 0, gst: 0, totalPayable: 0 }
        );
        summary.cancellationCount = cancellationEntries.length;
        summary.rowCount = policies.length;
        summary.netPremium = Number(summary.netPremium.toFixed(2));
        summary.gst = Number(summary.gst.toFixed(2));
        summary.totalPayable = Number(summary.totalPayable.toFixed(2));

        return {
            period: { year: numericYear, month: numericMonth, startDate, endDate },
            visibility: readScope.all ? "all" : "self",
            summary,
            policies
        };
    }

    async getRenewalReport(year, month, readScope, options = {}) {
        if (String(options.type || "").trim().toLowerCase() === "upcoming") {
            const today = new Date();
            const startDate = today.toISOString().slice(0, 10);
            const end = new Date(today);
            end.setDate(end.getDate() + 46);
            const endDate = end.toISOString().slice(0, 10);
            const policies = await PoliciesMotorModel.findRenewalsByExpiryMonth(startDate, endDate, readScope);

            return {
                period: { type: "upcoming", startDate, endDate, days: 45 },
                visibility: readScope.all ? "all" : "self",
                count: policies.length,
                policies
            };
        }

        const numericYear = Number(year);
        const numericMonth = Number(month);

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

        const pad = value => String(value).padStart(2, "0");
        const startDate = `${numericYear}-${pad(numericMonth)}-01`;
        const nextYear = numericMonth === 12 ? numericYear + 1 : numericYear;
        const nextMonth = numericMonth === 12 ? 1 : numericMonth + 1;
        const endDate = `${nextYear}-${pad(nextMonth)}-01`;
        const policies = await PoliciesMotorModel.findRenewalsByExpiryMonth(startDate, endDate, readScope);

        return {
            period: { year: numericYear, month: numericMonth, startDate, endDate },
            visibility: readScope.all ? "all" : "self",
            count: policies.length,
            policies
        };
    }
}

export default new PoliciesMotorService();
