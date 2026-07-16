import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const documentRoot = path.resolve(currentDir, "..", "storage", "employee-documents");

export const EMPLOYEE_DOCUMENTS = {
    aadhaar_front: { baseName: "aadhaar_front", label: "Aadhaar Front" },
    aadhaar_back: { baseName: "aadhaar_back", label: "Aadhaar Back" },
    pan_card: { baseName: "pan_card", label: "PAN Card" },
    marksheet: { baseName: "marksheet", label: "Marksheet" },
    bank_passbook: { baseName: "bank_passbook", label: "Bank Passbook" }
};

const PROFILE_PICTURE = { baseName: "profile_picture", label: "Profile Picture" };

const extensionByMimeType = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png"
};

const safeEmployeeCode = employeeCode => {
    const safeCode = String(employeeCode || "").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!safeCode) {
        const error = new Error("Employee code is required before documents can be uploaded");
        error.statusCode = 400;
        throw error;
    }
    return safeCode;
};

const getEmployeeFolder = employeeCode => path.join(documentRoot, safeEmployeeCode(employeeCode));

const isDocumentFile = (fileName, baseName) =>
    fileName.startsWith(`${baseName}.`) || fileName.startsWith(`${baseName}--`);

const originalNameFromStoredFile = (fileName) => {
    const separatorIndex = fileName.indexOf("--");
    return separatorIndex >= 0 ? fileName.slice(separatorIndex + 2) : fileName;
};

const getStoredFileInfo = async (folder, config, files = null) => {
    let folderFiles = files;
    if (!folderFiles) {
        try {
            folderFiles = await fs.readdir(folder);
        } catch (error) {
            if (error.code === "ENOENT") return null;
            throw error;
        }
    }
    const fileName = folderFiles.find(file => isDocumentFile(file, config.baseName));
    if (!fileName) return null;
    const stats = await fs.stat(path.join(folder, fileName));
    return {
        uploaded: true,
        fileName,
        originalName: originalNameFromStoredFile(fileName),
        uploadedAt: stats.mtime
    };
};

const safeOriginalBaseName = originalName => {
    const extension = path.extname(originalName || "");
    const baseName = path.basename(originalName || "document", extension)
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, "_")
        .replace(/^[_\.]+|[_\.]+$/g, "")
        .slice(0, 80);
    return baseName || "document";
};

class EmployeeDocumentService {
    async list(employeeCode) {
        const folder = getEmployeeFolder(employeeCode);
        let files = [];
        try {
            files = await fs.readdir(folder);
        } catch (error) {
            if (error.code !== "ENOENT") throw error;
        }

        const documents = await Promise.all(Object.entries(EMPLOYEE_DOCUMENTS).map(async ([type, config]) => {
            const fileName = files.find(file => isDocumentFile(file, config.baseName));
            if (!fileName) return { type, label: config.label, uploaded: false };
            const stats = await fs.stat(path.join(folder, fileName));
            return {
                type,
                label: config.label,
                uploaded: true,
                fileName,
                originalName: originalNameFromStoredFile(fileName),
                uploadedAt: stats.mtime
            };
        }));

        const profilePicture = await getStoredFileInfo(folder, PROFILE_PICTURE, files);

        return {
            employeeCode: safeEmployeeCode(employeeCode),
            documents,
            profilePicture: profilePicture || { uploaded: false }
        };
    }

    async save(employeeCode, files = {}) {
        const folder = getEmployeeFolder(employeeCode);
        await fs.mkdir(folder, { recursive: true });

        for (const [type, uploadedFiles] of Object.entries(files)) {
            const config = EMPLOYEE_DOCUMENTS[type];
            const file = uploadedFiles?.[0];
            if (!config || !file) continue;

            const extension = extensionByMimeType[file.mimetype];
            if (!extension) {
                const error = new Error(`${config.label} must be a PDF, JPG, or PNG file`);
                error.statusCode = 400;
                throw error;
            }

            const existingFiles = await fs.readdir(folder);
            await Promise.all(
                existingFiles
                    .filter(name => isDocumentFile(name, config.baseName))
                    .map(name => fs.unlink(path.join(folder, name)))
            );
            const storedName = `${config.baseName}--${safeOriginalBaseName(file.originalname)}${extension}`;
            await fs.writeFile(path.join(folder, storedName), file.buffer);
        }

        return this.list(employeeCode);
    }

    async getPath(employeeCode, type) {
        const config = EMPLOYEE_DOCUMENTS[type];
        if (!config) {
            const error = new Error("Invalid employee document type");
            error.statusCode = 400;
            throw error;
        }

        const folder = getEmployeeFolder(employeeCode);
        let files;
        try {
            files = await fs.readdir(folder);
        } catch (error) {
            if (error.code === "ENOENT") {
                const notFound = new Error(`${config.label} has not been uploaded`);
                notFound.statusCode = 404;
                throw notFound;
            }
            throw error;
        }

        const fileName = files.find(file => isDocumentFile(file, config.baseName));
        if (!fileName) {
            const error = new Error(`${config.label} has not been uploaded`);
            error.statusCode = 404;
            throw error;
        }
        return { absolutePath: path.join(folder, fileName), fileName, label: config.label };
    }

    async saveProfilePicture(employeeCode, file) {
        if (!file) {
            const error = new Error("Select a profile picture to upload");
            error.statusCode = 400;
            throw error;
        }
        const extension = extensionByMimeType[file.mimetype];
        if (!extension || file.mimetype === "application/pdf") {
            const error = new Error("Profile picture must be a JPG or PNG image");
            error.statusCode = 400;
            throw error;
        }

        const folder = getEmployeeFolder(employeeCode);
        await fs.mkdir(folder, { recursive: true });
        const existingFiles = await fs.readdir(folder);
        await Promise.all(
            existingFiles
                .filter(name => isDocumentFile(name, PROFILE_PICTURE.baseName))
                .map(name => fs.unlink(path.join(folder, name)))
        );
        const storedName = `${PROFILE_PICTURE.baseName}--${safeOriginalBaseName(file.originalname)}${extension}`;
        await fs.writeFile(path.join(folder, storedName), file.buffer);
        return getStoredFileInfo(folder, PROFILE_PICTURE);
    }

    async getProfilePicturePath(employeeCode) {
        const folder = getEmployeeFolder(employeeCode);
        const picture = await getStoredFileInfo(folder, PROFILE_PICTURE);
        if (!picture) {
            const error = new Error("Profile picture has not been uploaded");
            error.statusCode = 404;
            throw error;
        }
        return {
            ...picture,
            absolutePath: path.join(folder, picture.fileName),
            label: PROFILE_PICTURE.label
        };
    }
}

export default new EmployeeDocumentService();
