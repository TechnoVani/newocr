import express from "express";
import { getPosWisePolicies, getPosWiseReport } from "../../controllers/accounts/posWiseReport.controller.js";

const router = express.Router();

router.get("/:posId/policies", getPosWisePolicies);
router.get("/", getPosWiseReport);

export default router;
