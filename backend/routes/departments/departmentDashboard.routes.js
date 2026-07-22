import express from "express";
import DepartmentDashboardController from "../../controllers/departments/departmentDashboard.controller.js";
import { requireRequestedDepartmentAccess } from "../../middleware/departmentAccess.middleware.js";

const router = express.Router();

router.use("/:department", requireRequestedDepartmentAccess);
router.get("/:department/dashboard", DepartmentDashboardController.dashboard);
router.get("/:department/schema", DepartmentDashboardController.schema);
router.post("/:department/entries", DepartmentDashboardController.createEntry);
router.get("/:department/policies", DepartmentDashboardController.policies);
router.get("/:department/renewals", DepartmentDashboardController.renewals);
router.get("/:department/reports", DepartmentDashboardController.reports);
router.get("/:department/masters", DepartmentDashboardController.masters);

export default router;
