import express from "express";
import BqpController from "../controllers/bqp.controller.js";

const router = express.Router();

router.get("/", BqpController.getAll);

export default router;