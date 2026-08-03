import express from "express";
import {
  createCancelledPolicy,
  getCancelledPolicyReport
} from "../../controllers/accounts/cancelledPolicy.controller.js";

const router = express.Router();

router.get("/", getCancelledPolicyReport);
router.post("/", createCancelledPolicy);

export default router;
