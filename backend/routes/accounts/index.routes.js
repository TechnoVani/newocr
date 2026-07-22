import express from "express";
import statusRoutes from "./statusRoutes.js";
import companyRoutes from "./companyRoutes.js";
import branchRoutes from "./branchRoutes.js";

const router = express.Router();

router.use("/status", statusRoutes);
router.use("/companies", companyRoutes);
router.use("/branches", branchRoutes);

export default router;
