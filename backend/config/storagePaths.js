import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const resolveBackendPath = (value, fallback) => {
    const configured = String(value || fallback).trim();
    return path.isAbsolute(configured)
        ? path.normalize(configured)
        : path.resolve(backendRoot, configured);
};

export const uploadStoragePath = resolveBackendPath(
    process.env.BASE_UPLOAD_PATH,
    "public/uploads"
);

export const temporaryUploadPath = path.join(uploadStoragePath, "temp");
