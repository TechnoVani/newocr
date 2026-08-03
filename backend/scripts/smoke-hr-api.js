import jwt from "jsonwebtoken";
import { getApiBaseUrl } from "../config/env.js";
import db from "../config/database.js";

const apiBase = getApiBaseUrl();
const [employees] = await db.query(`
  SELECT e.id
  FROM employees e
  LEFT JOIN departments d ON d.id = e.department
  WHERE e.status = 'Active'
    AND (
      LOWER(COALESCE(e.user_type, '')) IN ('super admin','superadmin','admin','administrator')
      OR LOWER(COALESCE(d.department_name, '')) = 'administration'
    )
  ORDER BY e.id
  LIMIT 1
`);
if (!employees.length) throw new Error("No active administration employee is available for the HR API smoke test");

const token = jwt.sign({ id: employees[0].id }, process.env.JWT_SECRET, { expiresIn: "5m" });
const routes = [
  "/departments/human-resources/hr/overview",
  "/departments/human-resources/hr/options",
  "/departments/human-resources/hr/organization",
  "/departments/human-resources/hr/employees",
  `/departments/human-resources/hr/employees/${employees[0].id}/profile`,
  "/departments/human-resources/hr/documents",
  "/departments/human-resources/hr/payroll",
  "/departments/human-resources/hr/payouts",
  "/departments/human-resources/hr/attendance",
  "/departments/human-resources/hr/reports",
  "/departments/human-resources/hr/workforce-setup",
  "/departments/human-resources/hr/performance-reviews",
  "/departments/human-resources/hr/increments",
  "/departments/human-resources/hr/leaves",
  "/departments/human-resources/hr/leave-balances",
  "/departments/human-resources/hr/events",
];

const results = [];
for (const route of routes) {
  const response = await fetch(`${apiBase}${route}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  results.push({ route, status: response.status, success: body.success === true });
  if (!response.ok || body.success !== true) {
    throw new Error(`${route} failed with HTTP ${response.status}: ${body.message || "Unknown error"}`);
  }
}

const invalidRequests = [
  ["/departments/human-resources/hr/employees", "POST"],
  ["/departments/human-resources/hr/attendance", "POST"],
  ["/departments/human-resources/hr/payouts", "POST"],
  ["/departments/human-resources/hr/shifts", "POST"],
  ["/departments/human-resources/hr/performance-reviews", "POST"],
];
const validations = [];
for (const [route, method] of invalidRequests) {
  const response = await fetch(`${apiBase}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  validations.push({ route, method, status: response.status });
  if (response.status !== 400) {
    throw new Error(`${method} ${route} should reject an empty payload with HTTP 400, received ${response.status}`);
  }
}

console.log(JSON.stringify({
  employee_id: employees[0].id,
  routes: results,
  validation_requests: validations,
}, null, 2));
process.exit(0);
