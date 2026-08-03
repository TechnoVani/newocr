import express from "express";
import {
  getPayoutGridReport,
  getPayoutGridBatches,
  importPayoutGrid,
} from "../../controllers/accounts/payoutGridController.js";
import { requireMinimumRole } from "../../middleware/departmentAccess.middleware.js";
import { ACCESS_ROLES } from "../../utils/roleAccess.js";

const router = express.Router();

router.get("/", getPayoutGridReport);
router.get("/batches", getPayoutGridBatches);
router.post("/import", requireMinimumRole(ACCESS_ROLES.MANAGER), importPayoutGrid);

export default router;
