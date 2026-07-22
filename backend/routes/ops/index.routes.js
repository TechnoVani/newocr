import express from "express";
import uploadRoutes from "./upload.routes.js";
import ocrRoutes from "./ocr.routes.js";
import policyRoutes from "./policy.routes.js";
import documentRoutes from "./document.routes.js";
import bqpRoutes from "./bqp.routes.js";
import referenceRoutes from "./reference.routes.js";
import setCommRoutes from "./setcomm.routes.js";

const router = express.Router();

router.use("/upload", uploadRoutes);
router.use("/ocr", ocrRoutes);
router.use("/policy", policyRoutes);
router.use("/policies", policyRoutes);
router.use("/document", documentRoutes);
router.use("/setcomm", setCommRoutes);
router.use("/references", referenceRoutes);
router.use("/", bqpRoutes);

export default router;
