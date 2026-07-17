import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "..");
const uploadsRoot = path.join(backendRoot, "public", "uploads");

const toStoredPath = (absolutePath) =>
    path.relative(backendRoot, absolutePath).replaceAll("\\", "/");

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

/**
 * Return the Indian financial year containing the supplied date.
 * The financial year starts on April 1 and ends on March 31.
 * Example: 2026-03-30 -> 2025-2026, 2026-04-01 -> 2026-2027.
 */
export const getFinancialYear = (date) => {
    const calendarYear = date.getFullYear();
    const startYear = date.getMonth() < 3 ? calendarYear - 1 : calendarYear;
    return `${startYear}-${startYear + 1}`;
};

export const sanitizePolicyNumber = (policyNumber) =>
    String(policyNumber || "").replace(/[^a-zA-Z0-9._-]/g, "");

class FolderService {
    /**
     * Resolves and creates the final policy directory structure:
     * public/uploads/FinancialYear/Month/PolicyNumber/
     * @param {string|Date} issueDate - Policy issue date
     * @param {string} policyNumber - Unique policy number
     * @returns {Promise<string>} Path to the created folder relative to workspace
     */
    async createPolicyFolder(issueDate, policyNumber) {
        if (!issueDate) {
            throw new Error("Issue date is required to create policy folder");
        }
        if (!policyNumber) {
            throw new Error("Policy number is required to create policy folder");
        }

        const date = new Date(issueDate);
        if (isNaN(date.getTime())) {
            throw new Error("Invalid issue date format");
        }

        const financialYear = getFinancialYear(date);
        const month = MONTHS[date.getMonth()];
        
        // Clean policy number for file path safety
        const cleanPolicyNumber = sanitizePolicyNumber(policyNumber);
        if (!cleanPolicyNumber) {
            throw new Error("Policy number does not contain any valid folder characters");
        }

        const folderPath = path.join(
            uploadsRoot,
            financialYear,
            month,
            cleanPolicyNumber
        );

        // Ensure path exists
        await fs.ensureDir(folderPath);

        return folderPath;
    }

    /**
     * Copies an uploaded temp file to its final destination. The source is
     * cleaned only after every document and the database operation succeed.
     * @param {string} tempPath - Current temporary path of the uploaded file
     * @param {string} finalFolder - Final directory path
     * @param {string} destName - The new name of the file
     * @returns {Promise<string|null>} New relative path of the file or null if input was empty
     */
    async storeFile(tempPath, finalFolder, destName) {
        if (!tempPath) return null;

        let finalName = path.basename(destName);
        const originalExt = path.extname(tempPath).toLowerCase();

        // Check if destName already ends with a standard document/image extension.
        // If it doesn't, append the original file extension.
        const lowerDest = finalName.toLowerCase();
        if (
            !lowerDest.endsWith(".pdf") && 
            !lowerDest.endsWith(".jpg") && 
            !lowerDest.endsWith(".jpeg") && 
            !lowerDest.endsWith(".png")
        ) {
            finalName = `${finalName}${originalExt || ".jpg"}`;
        }

        const destinationPath = path.join(finalFolder, finalName);
        try {
            await fs.copy(tempPath, destinationPath, { overwrite: true });
        } catch (error) {
            if (error.code === "ENOENT") {
                const uploadError = new Error(
                    "Uploaded temporary file is no longer available. Please select the documents again and resubmit."
                );
                uploadError.statusCode = 400;
                throw uploadError;
            }
            throw error;
        }

        return toStoredPath(destinationPath);
    }

    async storeBuffer(file, finalFolder, destName) {
        if (!file?.buffer) return null;

        let finalName = path.basename(destName);
        const originalExt = path.extname(file.originalname || "").toLowerCase();
        const lowerDest = finalName.toLowerCase();
        if (
            !lowerDest.endsWith(".pdf") &&
            !lowerDest.endsWith(".jpg") &&
            !lowerDest.endsWith(".jpeg") &&
            !lowerDest.endsWith(".png")
        ) {
            finalName = `${finalName}${originalExt || ".jpg"}`;
        }

        const destinationPath = path.join(finalFolder, finalName);
        await fs.outputFile(destinationPath, file.buffer);
        return toStoredPath(destinationPath);
    }

    async cleanupTempFiles(filePaths = []) {
        const tempRoot = path.join(uploadsRoot, "temp");

        await Promise.all(filePaths.filter(Boolean).map(async filePath => {
            const resolvedPath = path.resolve(filePath);
            if (path.dirname(resolvedPath) !== tempRoot) return;
            await fs.remove(resolvedPath);
        }));
    }

}

export default new FolderService();
