import express from "express";
// Operations department route entry point.
import policyWorkspaceRoutes from "../../features/policy-workspace/routes/index.routes.js";
import setCommRoutes from "./setcomm.routes.js";

const router = express.Router();

router.use("/setcomm", setCommRoutes);
router.use("/", policyWorkspaceRoutes);

export default router;
