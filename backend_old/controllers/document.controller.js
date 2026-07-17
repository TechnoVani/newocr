import DocumentService from "../services/document.service.js";

class DocumentController {
    /**
     * Helper to send requested file or return clean 404
     */
    static async sendFile(req, res, next, field) {
        try {
            const absolutePath = await DocumentService.getDocumentPath(
                req.params.id,
                field,
                req.user.id
            );
            return res.sendFile(absolutePath);
        } catch (error) {
            if (error.statusCode === 404) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            next(error);
        }
    }

    // Serve Policy PDF
    static async pdf(req, res, next) {
        await DocumentController.sendFile(req, res, next, "pdf_path");
    }

    // Serve Aadhaar Front Image
    static async aadhaarFront(req, res, next) {
        await DocumentController.sendFile(req, res, next, "aadhaar_front_path");
    }

    // Serve Aadhaar Back Image
    static async aadhaarBack(req, res, next) {
        await DocumentController.sendFile(req, res, next, "aadhaar_back_path");
    }

    // Serve PAN Card Image
    static async pan(req, res, next) {
        await DocumentController.sendFile(req, res, next, "pan_card_path");
    }
}

export default DocumentController;
