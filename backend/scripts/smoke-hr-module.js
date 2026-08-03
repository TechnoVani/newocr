import { connectDB } from "../config/database.js";
import { HrModel } from "../models/human-resources/hr.model.js";
import { ensureHrSchema } from "../models/human-resources/hrSchema.model.js";

await connectDB();
await ensureHrSchema();

const [options, organization, overview, employees, documents, payroll, payouts, attendance, reports, workforceSetup, performanceReviews, increments, leaves, leaveBalances, events] =
  await Promise.all([
    HrModel.getOptions(),
    HrModel.getOrganization(),
    HrModel.overview({ id: 1 }, true),
    HrModel.getEmployees(),
    HrModel.getDocuments({ id: 1 }, true),
    HrModel.getPayroll({ id: 1 }, true),
    HrModel.getPayouts({ id: 1 }, true),
    HrModel.getAttendance({ id: 1 }, true),
    HrModel.getReports(),
    HrModel.getWorkforceSetup(),
    HrModel.getPerformanceReviews({ id: 1 }, true),
    HrModel.getIncrements({ id: 1 }, true),
    HrModel.getLeaves({ id: 1 }, true),
    HrModel.getLeaveBalances({ id: 1 }, true),
    HrModel.getEvents({ id: 1 }, true),
  ]);

console.log(JSON.stringify({
  departments: options.departments.length,
  designations: organization.designations.length,
  employees: employees.length,
  leaveTypes: options.leaveTypes.length,
  documents: documents.length,
  payroll: payroll.length,
  payouts: payouts.length,
  attendance: attendance.rows.length,
  reportDepartments: reports.departments.length,
  shifts: workforceSetup.shifts.length,
  shiftAssignments: workforceSetup.assignments.length,
  holidays: workforceSetup.holidays.length,
  performanceReviews: performanceReviews.length,
  reportingManagers: options.reportingManagers.length,
  relationshipManagers: options.relationshipManagers.length,
  nextEmployeeCode: options.nextEmployeeCode,
  increments: increments.length,
  leaves: leaves.length,
  leaveBalanceRows: leaveBalances.rows.length,
  events: events.length,
  overviewReady: Boolean(overview.employees),
}, null, 2));
process.exit(0);
