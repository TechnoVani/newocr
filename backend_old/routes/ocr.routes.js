import express from "express";
import OCRController from "../controllers/ocr.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Route to run OCR (supports direct file upload or path references)
router.post(
    "/",
    upload.single("file"),
    OCRController.processOCR
);

export default router;