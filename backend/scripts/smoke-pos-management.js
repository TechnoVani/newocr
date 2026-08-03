import "../config/env.js";
import jwt from "jsonwebtoken";
import db from "../config/database.js";
import { getApiOrigin } from "../config/env.js";

const [rows] = await db.query(
    `SELECT e.id, d.department_name
     FROM employees e
     JOIN departments d ON e.department = d.id
     WHERE (
         LOWER(d.department_name) = ?
         OR LOWER(d.department_name) = ?
         OR LOWER(REPLACE(e.user_type, ' ', '')) = ?
     )
       AND LOWER(e.status) = ?
     ORDER BY CASE WHEN LOWER(d.department_name) = 'pos management' THEN 0 ELSE 1 END
     LIMIT 1`,
    ["pos management", "administration", "superadmin", "active"]
);

if (!rows.length) throw new Error("No active POS Management or super-admin employee available for smoke test");

const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: "2m" });
console.log("test-department", rows[0].department_name);
const paths = [
    "dashboard",
    "analytics",
    "policies",
    "renewals?year=2026&month=7",
    "reports?year=2026&month=7",
    "payout?year=2026&month=7",
    "masters",
    "profile",
    "bqp",
    "references",
    "policies/all-refs"
];
const baseUrl = getApiOrigin();

for (const path of paths) {
    const response = await fetch(`${baseUrl}/api/pos-management/${path}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const responseText = await response.text();
    let body;
    try {
        body = JSON.parse(responseText);
    } catch {
        body = { success: false, message: responseText.slice(0, 120) };
    }
    console.log(path, response.status, body.success, body.message);
    if (!response.ok || !body.success) process.exitCode = 1;
}

const policiesResponse = await fetch(`${baseUrl}/api/pos-management/policies`, {
    headers: { Authorization: `Bearer ${token}` }
});
const policiesBody = await policiesResponse.json();
const [[policyCountRow]] = await db.query("SELECT COUNT(*) AS count FROM policies_motor");
if (String(rows[0].department_name).toLowerCase() === "pos management") {
    const apiPolicyCount = Number(policiesBody.data?.count);
    const databasePolicyCount = Number(policyCountRow.count);
    console.log("complete-policy-count", apiPolicyCount, databasePolicyCount);
    if (apiPolicyCount !== databasePolicyCount) process.exitCode = 1;
}
const firstPolicy = policiesBody.data?.policies?.[0];
if (firstPolicy?.id) {
    const detailResponse = await fetch(
        `${baseUrl}/api/pos-management/policies/${firstPolicy.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const detailBody = await detailResponse.json();
    console.log("policies/:id", detailResponse.status, detailBody.success, detailBody.message);
    if (!detailResponse.ok || !detailBody.success) process.exitCode = 1;
}

if (String(rows[0].department_name).toLowerCase() === "pos management") {
    const operationsResponse = await fetch(`${baseUrl}/api/operations/policies`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("operations-isolation", operationsResponse.status);
    if (operationsResponse.status !== 403) process.exitCode = 1;
}

process.exit();
