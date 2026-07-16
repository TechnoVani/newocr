import express from "express";
import RelationshipController from "../controllers/relationship.controller.js";

const router = express.Router();

// Use path parameter: /:managerId
router.get("/:managerId", RelationshipController.getRelationshipManagers);

export default router;