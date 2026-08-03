import "../config/env.js";
import jwt from "jsonwebtoken";
import db from "../config/database.js";
import UserModel from "../models/user.model.js";
import { getPortalAccess } from "../config/departmentAccess.js";
import { getAccessRole } from "../utils/roleAccess.js";
import { getApiOrigin } from "../config/env.js";

const [employees] = await db.query(
    "SELECT id FROM employees WHERE LOWER(status) = 'active' ORDER BY id LIMIT 500"
);
const candidates = new Map();
for (const employee of employees) {
    const profile = await UserModel.findById(employee.id);
    const role = getAccessRole(profile);
    if (!candidates.has(role) && getPortalAccess(profile).length) candidates.set(role, profile);
}

const baseUrl = getApiOrigin();
for (const [role, profile] of candidates) {
    const token = jwt.sign({ id: profile.id }, process.env.JWT_SECRET, { expiresIn: "2m" });
    const headers = { Authorization: `Bearer ${token}` };
    const meResponse = await fetch(`${baseUrl}/api/auth/me`, { headers });
    const meBody = await meResponse.json();
    const responseRole = meBody.data?.user?.access_role;
    console.log("auth-role", role, meResponse.status, responseRole);
    if (!meResponse.ok || responseRole !== role) process.exitCode = 1;

    const portal = getPortalAccess(profile)[0];
    const dashboardResponse = await fetch(
        `${baseUrl}/api/departments/${portal}/dashboard`,
        { headers }
    );
    const dashboardBody = await dashboardResponse.json();
    console.log("department-dashboard", role, portal, dashboardResponse.status, dashboardBody.success);
    if (!dashboardResponse.ok || !dashboardBody.success) process.exitCode = 1;

    if (role === "admin") {
        const administrationResponse = await fetch(
            `${baseUrl}/api/departments/administration/dashboard`,
            { headers }
        );
        const administrationBody = await administrationResponse.json();
        const businessReports = administrationBody.data?.businessReports;
        const [[posCountRow]] = await db.query("SELECT COUNT(*) count FROM employee_pos");
        const allPosRows = businessReports?.all_pos || [];
        console.log(
            "administration-business-dashboard",
            administrationResponse.status,
            Boolean(businessReports),
            businessReports?.pos?.length ?? 0,
            businessReports?.employees?.length ?? 0,
            allPosRows.length,
            Number(posCountRow.count),
            allPosRows.filter((row) => Number(row.policy_count) === 0).length,
        );
        if (
            !administrationResponse.ok ||
            !administrationBody.success ||
            !businessReports ||
            !Array.isArray(businessReports.pos) ||
            !Array.isArray(businessReports.employees) ||
            !Array.isArray(businessReports.all_pos) ||
            businessReports.all_pos.length !== Number(posCountRow.count)
        ) process.exitCode = 1;

        const now = new Date();
        const selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const monthlyResponse = await fetch(
            `${baseUrl}/api/departments/administration/dashboard?month=${selectedMonth}`,
            { headers }
        );
        const monthlyBody = await monthlyResponse.json();
        console.log(
            "administration-pos-month-report",
            monthlyResponse.status,
            monthlyBody.data?.businessReports?.period?.key,
        );
        if (
            !monthlyResponse.ok ||
            monthlyBody.data?.businessReports?.period?.key !== selectedMonth
        ) process.exitCode = 1;

        const invalidMonthResponse = await fetch(
            `${baseUrl}/api/departments/administration/dashboard?month=2026-13`,
            { headers }
        );
        console.log("administration-invalid-month", invalidMonthResponse.status);
        if (invalidMonthResponse.status !== 400) process.exitCode = 1;

        const taskMonthResponse = await fetch(
            `${baseUrl}/api/departments/administration/reports?month=${selectedMonth}`,
            { headers }
        );
        const taskMonthBody = await taskMonthResponse.json();
        console.log(
            "administration-task-month-report",
            taskMonthResponse.status,
            Array.isArray(taskMonthBody.data),
        );
        if (!taskMonthResponse.ok || !Array.isArray(taskMonthBody.data)) process.exitCode = 1;

        const invalidTaskMonthResponse = await fetch(
            `${baseUrl}/api/departments/administration/reports?month=invalid`,
            { headers }
        );
        console.log("administration-task-invalid-month", invalidTaskMonthResponse.status);
        if (invalidTaskMonthResponse.status !== 400) process.exitCode = 1;
    }

    if (role === "employee" && portal === "operations") {
        const sensitiveResponse = await fetch(
            `${baseUrl}/api/operations/setcomm/1`,
            {
                method: "PUT",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({})
            }
        );
        console.log("employee-sensitive-action", sensitiveResponse.status);
        if (sensitiveResponse.status !== 403) process.exitCode = 1;
    }
}

if (!candidates.size) {
    throw new Error("No active employee with department portal access was found");
}

process.exit();
