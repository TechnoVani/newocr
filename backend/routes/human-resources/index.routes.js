import express from "express";
import HrController from "../../controllers/human-resources/hr.controller.js";
import { requireMinimumRole } from "../../middleware/departmentAccess.middleware.js";
import { ACCESS_ROLES } from "../../utils/roleAccess.js";

const router = express.Router();
const requireHrManager = requireMinimumRole(ACCESS_ROLES.MANAGER);

router.get("/hr/overview", HrController.overview);
router.get("/hr/options", HrController.options);
router.get("/hr/organization", HrController.organization);
router.get("/hr/employees", HrController.employees);
router.get("/hr/employees/:id/profile", HrController.employeeProfile);
router.get("/hr/documents", HrController.documents);
router.get("/hr/payroll", HrController.payroll);
router.get("/hr/payouts", HrController.payouts);
router.get("/hr/attendance", HrController.attendance);
router.get("/hr/reports", requireHrManager, HrController.reports);
router.get("/hr/workforce-setup", requireHrManager, HrController.workforceSetup);
router.get("/hr/performance-reviews", HrController.performanceReviews);
router.get("/hr/increments", HrController.increments);
router.get("/hr/leaves", HrController.leaves);
router.get("/hr/leave-balances", HrController.leaveBalances);
router.get("/hr/events", HrController.events);
router.post("/hr/leaves", HrController.createLeave);
router.patch("/hr/leaves/:id/cancel", HrController.cancelLeave);
router.post("/hr/departments", requireHrManager, HrController.createDepartment);
router.post("/hr/designations", requireHrManager, HrController.createDesignation);
router.post("/hr/employees", requireHrManager, HrController.createEmployee);
router.patch("/hr/employees/:id/status", requireHrManager, HrController.employeeStatus);
router.patch("/hr/employees/:id/profile", requireHrManager, HrController.updateEmployeeProfile);
router.post("/hr/documents", requireHrManager, HrController.createDocument);
router.patch("/hr/documents/:id/status", requireHrManager, HrController.documentStatus);
router.post("/hr/payroll", requireHrManager, HrController.savePayroll);
router.post("/hr/payouts", requireHrManager, HrController.createPayout);
router.patch("/hr/payouts/:id/status", requireHrManager, HrController.payoutStatus);
router.post("/hr/attendance", requireHrManager, HrController.saveAttendance);
router.post("/hr/shifts", requireHrManager, HrController.createShift);
router.post("/hr/shift-assignments", requireHrManager, HrController.assignShift);
router.post("/hr/holidays", requireHrManager, HrController.createHoliday);
router.post("/hr/performance-reviews", requireHrManager, HrController.savePerformanceReview);
router.patch("/hr/performance-reviews/:id/status", HrController.performanceStatus);
router.post("/hr/increments", requireHrManager, HrController.createIncrement);
router.patch("/hr/leaves/:id/decision", requireHrManager, HrController.decideLeave);
router.post("/hr/events", requireHrManager, HrController.createEvent);

// Legacy HR URLs remain available while their implementation is department-owned.
router.get("/hr-options", requireHrManager, HrController.options);
router.post("/employees", requireHrManager, HrController.createEmployee);
router.patch("/employees/:id/status", requireHrManager, HrController.employeeStatus);

export default router;
