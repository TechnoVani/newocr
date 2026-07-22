import express from "express";
import SetCommController from "../../controllers/ops/setcomm.controller.js";
import { validateCommissionUpdate } from "../../validation/setcomm.validation.js";

const router = express.Router();

// GET /api/setcomm - Get policy commission report data.
router.get("/", SetCommController.getAll);

// GET /api/setcomm/:id - Get a single policy commission record.
router.get("/:id", SetCommController.getById);

// PUT /api/setcomm/:id - Update the six commission fields on a policy.
router.put("/:id", validateCommissionUpdate, SetCommController.update);

export default router;
