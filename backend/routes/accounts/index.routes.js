import express from "express";
import statusRoutes from "./statusRoutes.js";
import companyRoutes from "./companyRoutes.js";
import branchRoutes from "./branchRoutes.js";
import reconciliationRoutes from "./reconciliationRoutes.js";
import payoutGridRoutes from "./payoutGridRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import posWiseReportRoutes from "./posWiseReportRoutes.js";
import cancelledPolicyRoutes from "./cancelledPolicyRoutes.js";
import setCommRoutes from "./setcomm.routes.js";

const router = express.Router();

router.use("/dashboard", dashboardRoutes);
router.use("/reports/pos-wise", posWiseReportRoutes);
router.use("/reports/cancelled-policies", cancelledPolicyRoutes);
router.use("/setcomm", setCommRoutes);
router.use("/status", statusRoutes);
router.use("/companies", companyRoutes);
router.use("/branches", branchRoutes);
router.use("/reconciliation", reconciliationRoutes);
router.use("/payout-grid", payoutGridRoutes);

export default router;
