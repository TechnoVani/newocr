import express from "express";
import { getPosWiseReport } from "../../controllers/accounts/posWiseReport.controller.js";

const router = express.Router();

router.get("/", getPosWiseReport);

export default router;
