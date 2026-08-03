import express from "express";
import SetCommController from "../../controllers/operations/setcomm.controller.js";
import { validateCommissionUpdate } from "../../validation/setcomm.validation.js";
import { requireMinimumRole } from "../../middleware/departmentAccess.middleware.js";
import { ACCESS_ROLES } from "../../utils/roleAccess.js";

const router = express.Router();

// GET /api/setcomm - Get policy commission report data.
router.get("/", SetCommController.getAll);

// GET /api/setcomm/:id - Get a single policy commission record.
router.get("/:id", SetCommController.getById);

// PUT /api/setcomm/:id - Update the six commission fields on a policy.
router.put("/:id", requireMinimumRole(ACCESS_ROLES.MANAGER), validateCommissionUpdate, SetCommController.update);

export default router;
