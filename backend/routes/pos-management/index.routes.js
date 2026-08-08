import express from "express";
import PosManagementController from "../../controllers/pos-management/posManagement.controller.js";
import policyWorkspaceRoutes from "../operations/policy-workspace/index.routes.js";

const router = express.Router();

router.get("/dashboard", PosManagementController.dashboard);
router.get("/analytics", PosManagementController.analytics);
router.get("/policies", PosManagementController.policies);
router.get("/renewals", PosManagementController.renewals);
router.get("/reports", PosManagementController.monthlyReport);
router.get("/payout", PosManagementController.payout);
router.get("/masters", PosManagementController.masters);
router.get("/profile", PosManagementController.profile);

// Shared policy intake capabilities are mounted as POS-owned endpoints without
// depending on the Operations department router.
router.use("/", policyWorkspaceRoutes);

export default router;
