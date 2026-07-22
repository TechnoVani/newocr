import PolicyModel from "../../models/ops/policy.model.js";
import FolderService, { sanitizePolicyNumber } from "./folder.service.js";
import { formatToMySQLDate } from "../../utils/dateFormatter.js";

const DOCUMENT_FIELDS = [
    "pdfDocument",
    "aadhaarFrontDocument",
    "aadhaarBackDocument",
    "panCardDocument",
    "rcDocument",
    "previousPolicyDocument",
    "surveyReportDocument"
];

export const validateDocuments = (data) => {
    if (!data.pdfDocument?.buffer) {
        const error = new Error("Policy PDF is required");
        error.statusCode = 400;
        throw error;
    }

    const hasAadhaarFront = Boolean(data.aadhaarFrontDocument?.buffer);
    const hasAadhaarBack = Boolean(data.aadhaarBackDocument?.buffer);
    const hasPanCard = Boolean(data.panCardDocument?.buffer);
    if (!hasAadhaarFront || !hasAadhaarBack || !hasPanCard) {
        const error = new Error(
            "Aadhaar front, Aadhaar back and PAN card are required for every business type"
        );
        error.statusCode = 400;
        throw error;
    }

    const businessType = String(data.business_type || "").trim();
    if (["Rollover", "BreakIN"].includes(businessType) && !data.rcDocument?.buffer) {
        const error = new Error(`RC document is required for ${businessType}`);
        error.statusCode = 400;
        throw error;
    }

    if (businessType === "Rollover" && !data.previousPolicyDocument?.buffer) {
        const error = new Error("Previous Policy document is required for Rollover");
        error.statusCode = 400;
        throw error;
    }
};

class PolicyService {
    /**
     * Create a new policy record and organize its documents in the file system
     * @param {object} data - Policy data including in-memory uploaded documents
     * @returns {Promise<object>} Result metadata containing insertion ID
     */
    async createPolicy(data) {
        if (!data.policy_number) {
            throw new Error("Policy number is required");
        }
        if (!data.issue_date) {
            throw new Error("Policy issue date is required");
        }

        // Check for duplicates
        const userId = data.created_by;
        const existingPolicies = await PolicyModel.search(data.policy_number, userId);
        const duplicate = existingPolicies.find(
            item => item.policy_number === data.policy_number
        );
        if (duplicate) {
            // A second save for the same policy number is an attachment/data
            // update, not a duplicate create. Preserve the original creator.
            delete data.created_by;
            const updated = await this.updatePolicy(duplicate.id, data, userId);
            return {
                id: duplicate.id,
                ...updated,
                action: "updated"
            };
        }

        validateDocuments(data);

        // Format dates for MySQL compatibility
        const dateFields = ["start_date", "od_expiry", "tp_expiry", "issue_date"];
        dateFields.forEach(field => {
            if (data[field]) {
                data[field] = formatToMySQLDate(data[field]);
            }
        });

        // 1. Create FinancialYear/Month/PolicyNumber from the issue date.
        const folderPath = await FolderService.createPolicyFolder(
            data.issue_date,
            data.policy_number
        );

        // 2. Write files directly into the policy folder. The policy is always named
        // <policy-number>.pdf; KYC documents retain their uploaded extension.
        if (data.pdfDocument) {
            await FolderService.storeBuffer(
                data.pdfDocument,
                folderPath,
                sanitizePolicyNumber(data.policy_number) + ".pdf"
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

        if (data.rcDocument) {
            await FolderService.storeBuffer(data.rcDocument, folderPath, "rc");
        }

        if (data.previousPolicyDocument) {
            await FolderService.storeBuffer(data.previousPolicyDocument, folderPath, "previous_policy");
        }

        if (data.surveyReportDocument) {
            await FolderService.storeBuffer(data.surveyReportDocument, folderPath, "survey_report");
        }

        // 3. Exclude temporary and parser-only values from the DB payload.
        const cleanPayload = { ...data };
        DOCUMENT_FIELDS.forEach(field => delete cleanPayload[field]);
        delete cleanPayload.ocr_text;
        delete cleanPayload.extracted_json;
        delete cleanPayload.pdf_path;
        delete cleanPayload.aadhaar_front_path;
        delete cleanPayload.aadhaar_back_path;
        delete cleanPayload.pan_card_path;

        // 4. Save policy data only; document paths are not database columns.
        const policyId = await PolicyModel.create(cleanPayload);

        return {
            id: policyId,
            message: "Policy created successfully",
            folderPath,
            action: "created"
        };
    }

    /**
     * Get all policies in the system
     */
    async getAllPolicies(readScope) {
        return await PolicyModel.findAll(readScope);
    }

    /**
     * Get a specific policy details by ID
     */
    async getPolicyById(id, readScope) {
        const policy = await PolicyModel.findById(id, readScope);
        if (!policy) {
            throw new Error("Policy not found");
        }
        return policy;
    }

    /**
     * Update an existing policy and move files if new uploads are provided
     */
    async updatePolicy(id, data, userId) {
        // Check if policy exists
        const existingPolicy = await PolicyModel.findById(id, userId);
        if (!existingPolicy) {
            throw new Error("Policy not found");
        }

        validateDocuments(data);

        // Format dates for MySQL compatibility
        const dateFields = ["start_date", "od_expiry", "tp_expiry", "issue_date"];
        dateFields.forEach(field => {
            if (data[field]) {
                data[field] = formatToMySQLDate(data[field]);
            }
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

        if (data.rcDocument) {
            await FolderService.storeBuffer(data.rcDocument, folderPath, "rc");
        }

        if (data.previousPolicyDocument) {
            await FolderService.storeBuffer(data.previousPolicyDocument, folderPath, "previous_policy");
        }

        if (data.surveyReportDocument) {
            await FolderService.storeBuffer(data.surveyReportDocument, folderPath, "survey_report");
        }

        // Clean payload for updates
        const cleanPayload = { ...data };
        DOCUMENT_FIELDS.forEach(field => delete cleanPayload[field]);
        delete cleanPayload.ocr_text;
        delete cleanPayload.extracted_json;
        delete cleanPayload.pdf_path;
        delete cleanPayload.aadhaar_front_path;
        delete cleanPayload.aadhaar_back_path;
        delete cleanPayload.pan_card_path;

        // Save to Database
        const affectedRows = await PolicyModel.update(id, cleanPayload, userId);
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
    async deletePolicy(id, userId) {
        const affectedRows = await PolicyModel.delete(id, userId);
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
        return await PolicyModel.search(keyword, readScope);
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
        const policies = await PolicyModel.findMonthlyReport(startDate, endDate, readScope);

        const toAmount = value => Number(value) || 0;
        const summary = policies.reduce(
            (totals, policy) => {
                totals.policyCount += 1;
                totals.netPremium += toAmount(policy.net_premium);
                totals.gst += toAmount(policy.gst);
                totals.totalPayable += toAmount(policy.total_payable);
                return totals;
            },
            { policyCount: 0, netPremium: 0, gst: 0, totalPayable: 0 }
        );
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

    async getRenewalReport(year, month, readScope) {
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
        const policies = await PolicyModel.findRenewalsByExpiryMonth(startDate, endDate, readScope);

        return {
            period: { year: numericYear, month: numericMonth, startDate, endDate },
            visibility: readScope.all ? "all" : "self",
            count: policies.length,
            policies
        };
    }
}

export default new PolicyService();
