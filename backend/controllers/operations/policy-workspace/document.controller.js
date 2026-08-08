import DocumentService from "../../../services/operations/policy-workspace/document.service.js";
import { getPolicyReadScope } from "../../../utils/dataScope.js";
import { errorResponse } from "../../../utils/response.js";

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
                return errorResponse(res, error.message, null, 404);
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

    static async rcFront(req, res, next) {
        await DocumentController.sendFile(req, res, next, "rc_front");
    }

    static async rcBack(req, res, next) {
        await DocumentController.sendFile(req, res, next, "rc_back");
    }

    static async previousPolicy(req, res, next) {
        await DocumentController.sendFile(req, res, next, "previous_policy");
    }

    static async invoice(req, res, next) {
        await DocumentController.sendFile(req, res, next, "invoice");
    }

    static async surveyReport(req, res, next) {
        await DocumentController.sendFile(req, res, next, "survey_report");
    }

    static async gstCertificate(req, res, next) {
        await DocumentController.sendFile(req, res, next, "gst_certificate");
    }
}

export default DocumentController;
