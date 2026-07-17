import PolicyModel from "../models/policy.model.js";
import path from "path";
import fs from "fs/promises";

class DocumentService {
    /**
     * Resolves the absolute physical file path for a policy document
     * @param {string|number} policyId 
     * @param {string} field - Database field name (e.g. 'pdf_path', 'aadhaar_front_path')
     * @returns {Promise<string>} Absolute path to the file
     */
    async getDocumentPath(policyId, field, userId) {
        const policy = await PolicyModel.findById(policyId, userId);
        if (!policy) {
            const error = new Error("Policy not found");
            error.statusCode = 404;
            throw error;
        }
        
        const filePath = policy[field];
        if (!filePath) {
            const error = new Error("Document path not found in policy record");
            error.statusCode = 404;
            throw error;
        }
        
        const absolutePath = path.resolve(filePath);
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
