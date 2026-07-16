import path from "path";
import fs from "fs/promises";

/**
 * Get safe file extension including dot, defaulting to a fallback
 * @param {string} filePath 
 * @param {string} fallback 
 * @returns {string} Extension (e.g. '.jpg')
 */
export const getFileExtension = (filePath, fallback = ".jpg") => {
    if (!filePath) return fallback;
    const ext = path.extname(filePath);
    return ext ? ext.toLowerCase() : fallback;
};

/**
 * Checks if a file exists
 * @param {string} filePath 
 * @returns {Promise<boolean>}
 */
export const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

/**
 * Standardize backward and forward slashes to forward slashes
 * @param {string} filePath 
 * @returns {string} Clean path
 */
export const cleanPath = (filePath) => {
    if (!filePath) return "";
    return filePath.replaceAll("\\", "/");
};

export default {
    getFileExtension,
    fileExists,
    cleanPath
};
