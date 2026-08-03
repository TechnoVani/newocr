import express from "express";
import {
  getReconciliationReport,
  importReconciliationRows,
} from "../../controllers/accounts/reconciliationController.js";
import { requireMinimumRole } from "../../middleware/departmentAccess.middleware.js";
import { ACCESS_ROLES } from "../../utils/roleAccess.js";

const router = express.Router();

router.get("/", getReconciliationReport);
router.post("/import", requireMinimumRole(ACCESS_ROLES.MANAGER), importReconciliationRows);

export default router;
