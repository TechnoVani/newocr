import express from "express";
// Operations department route entry point.
import policyWorkspaceRoutes from "./policy-workspace/index.routes.js";
import setCommRoutes from "../accounts/setcomm.routes.js";

const router = express.Router();

router.use("/setcomm", setCommRoutes);
router.use("/", policyWorkspaceRoutes);

export default router;
