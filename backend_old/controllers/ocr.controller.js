import OCRService from "../services/ocr.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

class OCRController {
    /**
     * Run OCR on a document and return structured text and parsed policy keys
     */
    static async processOCR(req, res, next) {
        try {
            let filePath = req.body.filePath || req.body.path;
            
            // If file was directly uploaded in this request
            if (req.file) {
                filePath = req.file.path;
            }

            if (!filePath) {
                return errorResponse(res, "File path or uploaded file is required", null, 400);
            }

            // Run OCR service
            const normalizedPath = filePath.replaceAll("\\", "/");
            const result = await OCRService.process(normalizedPath);

            return successResponse(res, "OCR completed successfully", result);
        } catch (error) {
            next(error);
        }
    }
}

export default OCRController;