import PoliciesMotorModel from "../models/policiesMotor.model.js";
import path from "path";
import fs from "fs/promises";
import { resolvePolicyFolderPath, sanitizePolicyNumber } from "./folder.service.js";

const DOCUMENT_BASENAMES = Object.freeze({
    pdf: policy => sanitizePolicyNumber(policy.policy_number),
    aadhaar_front: () => "aadhaar_front",
    aadhaar_back: () => "aadhaar_back",
    pan_card: () => "pan_card",
    rc: () => "rc",
    rc_front: () => "rc_front",
    rc_back: () => "rc_back",
    previous_policy: () => "previous_policy",
    invoice: () => "invoice",
    survey_report: () => "survey_report",
    gst_certificate: () => "gst_certificate"
});

class DocumentService {
    /**
     * Resolves the absolute physical file path for a policy document
     * @param {string|number} policyId 
     * @param {string} documentType - One of the private motor document types
     * @returns {Promise<string>} Absolute path to the file
     */
    async getDocumentPath(policyId, documentType, readScope) {
        const policy = await PoliciesMotorModel.findById(policyId, readScope);
        if (!policy) {
            const error = new Error("Policy not found");
            error.statusCode = 404;
            throw error;
        }
        
        const getBaseName = DOCUMENT_BASENAMES[documentType];
        if (!getBaseName) {
            const error = new Error("Unsupported policy document type");
            error.statusCode = 404;
            throw error;
        }

        const folderPath = resolvePolicyFolderPath(policy.issue_date, policy.policy_number);
        const baseName = getBaseName(policy);
        let fileName;
        try {
            const files = await fs.readdir(folderPath);
            fileName = files.find(candidate => path.parse(candidate).name === baseName);
        } catch {
            fileName = null;
        }

        if (!fileName) {
            const error = new Error("Policy document not found");
            error.statusCode = 404;
            throw error;
        }

        const absolutePath = path.join(folderPath, fileName);
        try {
            await fs.access(absolutePath);
        } catch {
            const error = new Error("Physical file not found on server");
            error.statusCode = 404;
            throw error;
        }
        
        return absolutePath;
    }
}

export default new DocumentService();
