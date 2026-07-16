import express from "express";
import ReferenceController from "../controllers/reference.controller.js";

const router = express.Router();

router.get("/", ReferenceController.getAll);
router.post("/", ReferenceController.create);
router.put("/:id", ReferenceController.update);
router.get("/posp/:pospId", ReferenceController.getByPospId);

export default router;
