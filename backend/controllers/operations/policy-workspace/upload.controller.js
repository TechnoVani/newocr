import { errorResponse } from "../../../utils/response.js";

const uploadedPath = file => file.path.replaceAll("\\", "/");

class UploadController {
    static async uploadPDF(req, res, next) {
        try {
            if (!req.file) return errorResponse(res, "PDF file is required", null, 400);

            const file = {
                originalName: req.file.originalname,
                tempPath: uploadedPath(req.file),
                mimeType: req.file.mimetype
            };
            return res.status(200).json({
                success: true,
                message: "Policy PDF uploaded successfully",
                file,
                data: { file }
            });
        } catch (error) {
            next(error);
        }
    }

    static async uploadAadhaarFront(req, res, next) {
        try {
            if (!req.file) return errorResponse(res, "Aadhaar front image required", null, 400);
            const filePath = uploadedPath(req.file);
            return res.status(200).json({
                success: true,
                message: "Aadhaar front uploaded successfully",
                filePath,
                data: { filePath }
            });
        } catch (error) {
            next(error);
        }
    }

    static async uploadAadhaarBack(req, res, next) {
        try {
            if (!req.file) return errorResponse(res, "Aadhaar back image required", null, 400);
            const filePath = uploadedPath(req.file);
            return res.status(200).json({
                success: true,
                message: "Aadhaar back uploaded successfully",
                filePath,
                data: { filePath }
            });
        } catch (error) {
            next(error);
        }
    }

    static async uploadPAN(req, res, next) {
        try {
            if (!req.file) return errorResponse(res, "PAN card image required", null, 400);
            const filePath = uploadedPath(req.file);
            return res.status(200).json({
                success: true,
                message: "PAN card uploaded successfully",
                filePath,
                data: { filePath }
            });
        } catch (error) {
            next(error);
        }
    }
}

export default UploadController;
