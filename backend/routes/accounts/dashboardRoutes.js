import express from "express";
import { getAccountsDashboard } from "../../controllers/accounts/accountsDashboard.controller.js";

const router = express.Router();

router.get("/", getAccountsDashboard);

export default router;
