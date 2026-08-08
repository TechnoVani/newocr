import express from "express";
// Operations policy-workspace route entry point.
import uploadRoutes from "./upload.routes.js";
import ocrRoutes from "./ocr.routes.js";
import policiesMotorRoutes from "./policiesMotor.routes.js";
import documentRoutes from "./document.routes.js";
import bqpRoutes from "./bqp.routes.js";
import referenceRoutes from "./reference.routes.js";

const router = express.Router();

router.use("/upload", uploadRoutes);
router.use("/ocr", ocrRoutes);
router.use("/policy", policiesMotorRoutes);
router.use("/policies", policiesMotorRoutes);
router.use("/document", documentRoutes);
router.use("/references", referenceRoutes);
router.use("/", bqpRoutes);

export default router;
