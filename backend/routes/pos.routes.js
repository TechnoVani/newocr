import express from "express";
import PosController from "../controllers/pos.controller.js";

const router = express.Router();

// GET /api/posp/:relationshipId
router.get("/:relationshipId", PosController.getPospByRelationshipManager);

export default router;