import express from "express";
import ReportingController from "../controllers/reporting.controller.js";

const router = express.Router();

// Change from router.get("/") to router.get("/:bqpId")
router.get("/:bqpId", ReportingController.getReportingManagers);

export default router;