import express from "express";
import SetCommController from "../../controllers/accounts/setcomm.controller.js";
import { validateCommissionUpdate } from "../../validation/accounts/setcomm.validation.js";

const router = express.Router();

// GET /api/accounts/setcomm - Get policy commission report data.
router.get("/", SetCommController.getAll);

// GET /api/accounts/setcomm/:id - Get a single policy commission record.
router.get("/:id", SetCommController.getById);

// PUT /api/accounts/setcomm/:id - Update the six commission fields on a policy.
router.put("/:id", validateCommissionUpdate, SetCommController.update);

export default router;
