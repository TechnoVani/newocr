import express from "express";
import PoliciesMotorController from "../controllers/policiesMotor.controller.js";
import { policyUpload } from "../../../middleware/upload.middleware.js";

const router = express.Router();

export const POLICY_UPLOAD_FIELDS = Object.freeze([
    { name: "pdfFile", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
    { name: "aadhaar_front", maxCount: 1 },
    { name: "aadhaar_back", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "rc", maxCount: 1 },
    { name: "rc_front", maxCount: 1 },
    { name: "rc_back", maxCount: 1 },
    { name: "previous_policy", maxCount: 1 },
    { name: "invoice", maxCount: 1 },
    { name: "survey_report", maxCount: 1 },
    { name: "gst_certificate", maxCount: 1 }
]);

// Route to create a policy (supports JSON or Multipart)
router.post(
    "/",
    policyUpload.fields(POLICY_UPLOAD_FIELDS),
    PoliciesMotorController.create
);

// Route to get all policies
router.get(
    "/",
    PoliciesMotorController.getAll
);

// Route to search policies (must be placed before GET /:id)
router.get(
    "/search",
    PoliciesMotorController.search
);

// Route to get all unique Reference IDs from database
router.get(
    "/all-refs",
    PoliciesMotorController.getAllRefs
);

// Dashboard entry totals (must be placed before GET /:id)
router.get(
    "/dashboard/summary",
    PoliciesMotorController.getDashboardSummary
);

// Monthly report (must be placed before GET /:id)
router.get(
    "/report/monthly",
    PoliciesMotorController.getMonthlyReport
);

router.get(
    "/report/renewals",
    PoliciesMotorController.getRenewalReport
);

// Check if a policy number already exists (must be placed before GET /:id)
router.get(
    "/exists",
    PoliciesMotorController.checkPolicyNumber
);

// Route to get a policy by Reference ID or Policy Number
router.get(
    "/ref/:refId",
    PoliciesMotorController.getByRefId
);

// Route to get a policy by ID
router.get(
    "/:id",
    PoliciesMotorController.getById
);

// Route to update a policy (supports JSON or Multipart)
router.put(
    "/:id",
    policyUpload.fields(POLICY_UPLOAD_FIELDS),
    PoliciesMotorController.update
);

// Route to delete a policy
router.delete(
    "/:id",
    PoliciesMotorController.remove
);

export default router;
                    




