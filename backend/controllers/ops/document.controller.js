import DocumentService from "../../services/ops/document.service.js";
import { getPolicyReadScope } from "../../utils/dataScope.js";

class DocumentController {
    /**
     * Helper to send requested file or return clean 404
     */
    static async sendFile(req, res, next, documentType) {
        try {
            const absolutePath = await DocumentService.getDocumentPath(
                req.params.id,
                documentType,
                getPolicyReadScope(req.user)
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
        await DocumentController.sendFile(req, res, next, "pdf");
    }

    // Serve Aadhaar Front Image
    static async aadhaarFront(req, res, next) {
        await DocumentController.sendFile(req, res, next, "aadhaar_front");
    }

    // Serve Aadhaar Back Image
    static async aadhaarBack(req, res, next) {
        await DocumentController.sendFile(req, res, next, "aadhaar_back");
    }

    // Serve PAN Card Image
    static async pan(req, res, next) {
        await DocumentController.sendFile(req, res, next, "pan_card");
    }

    static async rc(req, res, next) {
        await DocumentController.sendFile(req, res, next, "rc");
    }

    static async previousPolicy(req, res, next) {
        await DocumentController.sendFile(req, res, next, "previous_policy");
    }

    static async surveyReport(req, res, next) {
        await DocumentController.sendFile(req, res, next, "survey_report");
    }
}

export default DocumentController;
