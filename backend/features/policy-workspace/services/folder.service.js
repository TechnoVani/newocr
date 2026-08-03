import fs from "fs-extra";
// Shared policy-workspace folder service.
import path from "path";
import os from "os";
import { constants as fsConstants } from "fs";
import { fileURLToPath } from "url";
import "../../../config/env.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "..", "..", "..");
// Keep motor-policy documents in the backend's main storage root, beside
// employee profile documents: backend/storage/{employee-documents,motorpolicy}
const configuredStorageRoot = String(process.env.MOTOR_POLICY_STORAGE_ROOT || "").trim();
const defaultStorageRoot = process.env.NODE_ENV === "production"
    // cPanel/Passenger application folders under public_html are commonly
    // read-only. The account home is the stable writable location.
    ? path.resolve(os.homedir(), "notioninsurance-storage", "motorpolicy")
    : path.resolve(backendRoot, "storage", "motorpolicy");
const relativeStorageBase = process.env.NODE_ENV === "production"
    ? os.homedir()
    : backendRoot;
const motorStorageRoot = configuredStorageRoot
    ? path.isAbsolute(configuredStorageRoot)
        ? path.resolve(configuredStorageRoot)
        : path.resolve(relativeStorageBase, configuredStorageRoot)
    : defaultStorageRoot;
const DIRECTORY_MODE = 0o775;
const FILE_MODE = 0o640;
const PERMISSION_ERROR_CODES = new Set(["EACCES", "EPERM", "EROFS"]);

const createStoragePermissionError = (error, targetPath) => {
    const storageError = new Error(
        `Motor policy storage is not writable: ${targetPath}. ` +
        "Grant the backend user write permission or set MOTOR_POLICY_STORAGE_ROOT to a writable directory."
    );
    storageError.name = "MotorStoragePermissionError";
    storageError.code = "MOTOR_STORAGE_PERMISSION_DENIED";
    storageError.statusCode = 503;
    storageError.cause = error;
    return storageError;
};

const ensureWritableDirectory = async directory => {
    try {
        // Apply the mode only when a folder is created. Existing shared-hosting
        // folders may be writable even when the Node user cannot chmod them.
        await fs.ensureDir(directory, DIRECTORY_MODE);
        await fs.access(directory, fsConstants.W_OK | fsConstants.X_OK);
    } catch (error) {
        if (PERMISSION_ERROR_CODES.has(error.code)) {
            throw createStoragePermissionError(error, directory);
        }
        throw error;
    }
};

const applyFileMode = async filePath => {
    try {
        await fs.chmod(filePath, FILE_MODE);
    } catch (error) {
        // A server umask still protects files when shared hosting permits
        // writes but does not permit chmod.
        if (!PERMISSION_ERROR_CODES.has(error.code)) throw error;
    }
};

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

/**
 * Convert a policy number into its filesystem-safe representation.
 *
 * Keep the policy number itself unchanged for database writes, but preserve
 * its slash-separated structure in folder and file names by mapping path
 * separators to "@". For example:
 * 152801/31/2027/1112 -> 152801@31@2027@1112
 */
export const sanitizePolicyNumber = (policyNumber) =>
    String(policyNumber || "")
        .replace(/[\/\\]/g, "@")
        .replace(/[^a-zA-Z0-9.@_-]/g, "");

export const resolvePolicyFolderPath = (issueDate, policyNumber) => {
    const date = new Date(issueDate);
    if (isNaN(date.getTime())) throw new Error("Invalid issue date format");

    const cleanPolicyNumber = sanitizePolicyNumber(policyNumber);
    if (!cleanPolicyNumber) {
        throw new Error("Policy number does not contain any valid folder characters");
    }

    return path.join(
        motorStorageRoot,
        getFinancialYear(date),
        MONTHS[date.getMonth()],
        cleanPolicyNumber
    );
};

class FolderService {
    async ensureStorageReady() {
        await ensureWritableDirectory(motorStorageRoot);
        return motorStorageRoot;
    }

    /**
     * Resolves and creates the final policy directory structure:
     * storage/motorpolicy/FinancialYear/Month/PolicyNumber/
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

        const folderPath = resolvePolicyFolderPath(issueDate, policyNumber);
        const monthPath = path.dirname(folderPath);
        const financialYearPath = path.dirname(monthPath);

        // Create the complete hierarchy and verify that each level remains
        // writable by the backend process.
        const directories = [
            motorStorageRoot,
            financialYearPath,
            monthPath,
            folderPath
        ];
        for (const directory of directories) {
            await ensureWritableDirectory(directory);
        }

        return folderPath;
    }

    async policyFolderExists(issueDate, policyNumber) {
        return fs.pathExists(resolvePolicyFolderPath(issueDate, policyNumber));
    }

    async removeNewPolicyFolder(folderPath) {
        const resolvedFolder = path.resolve(folderPath);
        const relativeFolder = path.relative(motorStorageRoot, resolvedFolder);
        if (
            !relativeFolder ||
            relativeFolder.startsWith("..") ||
            path.isAbsolute(relativeFolder)
        ) {
            throw new Error("Refusing to remove a folder outside motor policy storage");
        }
        await fs.remove(resolvedFolder);
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
            if (PERMISSION_ERROR_CODES.has(error.code)) {
                throw createStoragePermissionError(error, finalFolder);
            }
            throw error;
        }

        await applyFileMode(destinationPath);

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
        try {
            await fs.outputFile(destinationPath, file.buffer);
        } catch (error) {
            if (PERMISSION_ERROR_CODES.has(error.code)) {
                throw createStoragePermissionError(error, finalFolder);
            }
            throw error;
        }
        await applyFileMode(destinationPath);
        return toStoredPath(destinationPath);
    }

    async cleanupTempFiles(filePaths = []) {
        const tempRoot = path.join(backendRoot, "public", "uploads", "temp");

        await Promise.all(filePaths.filter(Boolean).map(async filePath => {
            const resolvedPath = path.resolve(filePath);
            if (path.dirname(resolvedPath) !== tempRoot) return;
            await fs.remove(resolvedPath);
        }));
    }

}

export default new FolderService();
