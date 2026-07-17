import express from "express";
import SetCountController from "../controllers/setcount.controller.js";
import { validateCommissionUpdate } from "../validation/setcount.validation.js";

const router = express.Router();

// GET /api/setcount - Get all records (with pagination, search, sort)
router.get("/", SetCountController.getAll);

// GET /api/setcount/:id - Get a single record by ID
router.get("/:id", SetCountController.getById);

// PUT /api/setcount/:id - Update the six commission fields on a policy
router.put("/:id", validateCommissionUpdate, SetCountController.update);

export default router;
