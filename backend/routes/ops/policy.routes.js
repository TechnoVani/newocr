import express from "express";
import PolicyController from "../../controllers/ops/policy.controller.js";
import { policyUpload } from "../../middleware/upload.middleware.js";

const router = express.Router();

// Route to create a policy (supports JSON or Multipart)
router.post(
    "/",
    policyUpload.fields([
        { name: "pdfFile", maxCount: 1 },
        { name: "pdf", maxCount: 1 },
        { name: "aadhaar_front", maxCount: 1 },
        { name: "aadhaar_back", maxCount: 1 },
        { name: "pan", maxCount: 1 },
        { name: "rc", maxCount: 1 },
        { name: "previous_policy", maxCount: 1 },
        { name: "survey_report", maxCount: 1 }
    ]),
    PolicyController.create
);

// Route to get all policies
router.get(
    "/",
    PolicyController.getAll
);

// Route to search policies (must be placed before GET /:id)
router.get(
    "/search",
    PolicyController.search
);

// Route to get all unique Reference IDs from database
router.get(
    "/all-refs",
    PolicyController.getAllRefs
);

// Dashboard entry totals (must be placed before GET /:id)
router.get(
    "/dashboard/summary",
    PolicyController.getDashboardSummary
);

// Monthly report (must be placed before GET /:id)
router.get(
    "/report/monthly",
    PolicyController.getMonthlyReport
);

router.get(
    "/report/renewals",
    PolicyController.getRenewalReport
);

// Route to get a policy by Reference ID or Policy Number
router.get(
    "/ref/:refId",
    PolicyController.getByRefId
);

// Route to get a policy by ID
router.get(
    "/:id",
    PolicyController.getById
);

// Route to update a policy (supports JSON or Multipart)
router.put(
    "/:id",
    policyUpload.fields([
        { name: "pdfFile", maxCount: 1 },
        { name: "pdf", maxCount: 1 },
        { name: "aadhaar_front", maxCount: 1 },
        { name: "aadhaar_back", maxCount: 1 },
        { name: "pan", maxCount: 1 },
        { name: "rc", maxCount: 1 },
        { name: "previous_policy", maxCount: 1 },
        { name: "survey_report", maxCount: 1 }
    ]),
    PolicyController.update
);

// Route to delete a policy
router.delete(
    "/:id",
    PolicyController.remove
);

export default router;
                    




