import db from "../config/database.js";
import { ensureDepartmentWorkflowSchema } from "../models/departments/departmentWorkflowSchema.model.js";

try {
  await ensureDepartmentWorkflowSchema();
  const [[table]] = await db.query(
    `SELECT COUNT(*) AS table_count
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN ('department_work_items', 'department_work_item_history', 'policy_followup')`,
  );
  if (Number(table.table_count) !== 3) throw new Error("Department workflow tables were not created");
  console.log("Department workflow, history and policy follow-up schemas are ready.");
} finally {
  await db.end();
}
