import db from "../../config/database.js";
import DepartmentSchemaModel from "./departmentSchema.model.js";
import { getDepartmentWorkflow, STATUS_TRANSITIONS, WORKFLOW_STATUSES } from "./departmentWorkflowConfig.js";
import { departmentWorkScope } from "../../utils/roleAccess.js";

const clean = (value, max = 255) => String(value ?? "").trim().slice(0, max);
const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

class DepartmentEntryModel {
  static async create(department, payload, user) {
    const schema = DepartmentSchemaModel.get(department);
    const missing = schema.formFields.filter(
      (field) => field.required && !clean(payload[field.name]),
    );
    if (missing.length) {
      throw badRequest(`Required fields missing: ${missing.map((field) => field.label).join(", ")}`);
    }

    const workflow = getDepartmentWorkflow(department);
    for (const field of schema.formFields) {
      const value = clean(payload[field.name]);
      if (value && field.options?.length && !field.options.includes(value)) {
        throw badRequest(`${field.label} contains an invalid value`);
      }
    }
    const workType = clean(payload[workflow.workTypeField], 100);
    if (!workType) throw badRequest("Work type is required");
    const policyNumber = clean(payload.policyNumber, 150);
    let policyId = null;
    let insuredName = "";
    if (department === "human-resources" && policyNumber) {
      const [employees] = await db.query(
        "SELECT id FROM employees WHERE employee_code = ? LIMIT 1",
        [policyNumber],
      );
      if (!employees[0] && ["Leave", "Exit"].includes(workType)) {
        throw badRequest("A valid employee code is required for leave or exit processing");
      }
    } else if (policyNumber) {
      const [policies] = await db.query(
        "SELECT id, insured_name FROM policies_motor WHERE policy_number = ? LIMIT 1",
        [policyNumber],
      );
      policyId = policies[0]?.id || null;
      insuredName = clean(policies[0]?.insured_name, 255);
      if (!policyId) {
        throw badRequest("The selected policy number does not exist");
      }
    } else if (workflow.policyRequired !== false) {
      throw badRequest("Policy number is required");
    }

    const subjectName = department === "human-resources"
      ? clean(payload.employeeName, 255)
      : insuredName;
    const dueDate = clean(
      payload.dueDate || payload.leaveTo || payload.exitDate || payload.joiningDate ||
      payload.sessionDate || payload.nextActionDate,
      10,
    ) || null;
    const priority = ["Low", "Normal", "High", "Critical"].includes(payload.priority)
      ? payload.priority
      : "Normal";

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO department_work_items (
          department_slug, policy_id, policy_number, customer_name, work_type,
          title, description, priority, status, due_date, payload, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?, ?)`,
        [
          department,
          policyId,
          policyNumber || null,
          subjectName || null,
          workType,
          clean(payload.title || `${workType} - ${subjectName || policyNumber || department}`, 255),
          clean(payload.description || payload.notes, 4000) || null,
          priority,
          dueDate,
          JSON.stringify(payload),
          Number(user.id),
        ],
      );
      await connection.query(
        `INSERT INTO department_work_item_history
         (work_item_id, from_status, to_status, note, changed_by)
         VALUES (?, NULL, 'Open', 'Workflow created', ?)`,
        [result.insertId, Number(user.id)],
      );
      const [rows] = await connection.query(
        "SELECT * FROM department_work_items WHERE id = ?",
        [result.insertId],
      );
      await connection.commit();
      return rows[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateStatus(department, id, status, user, note = "") {
    if (!WORKFLOW_STATUSES.includes(status)) throw badRequest("Invalid workflow status");
    const scope = departmentWorkScope(user, "department_work_items");
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [items] = await connection.query(
        `SELECT * FROM department_work_items
         WHERE id = ? AND department_slug = ? AND ${scope.sql} FOR UPDATE`,
        [Number(id), department, ...scope.params],
      );
      if (!items.length) {
        const error = new Error("Department work item not found");
        error.statusCode = 404;
        throw error;
      }
      const item = items[0];
      if (item.status === status) {
        await connection.commit();
        return item;
      }
      if (!(STATUS_TRANSITIONS[item.status] || []).includes(status)) {
        throw badRequest(`Status cannot move from ${item.status} to ${status}`);
      }
      await connection.query(
        `UPDATE department_work_items
         SET status = ?, assigned_to = COALESCE(assigned_to, ?)
         WHERE id = ?`,
        [status, Number(user.id), Number(id)],
      );
      await connection.query(
        `INSERT INTO department_work_item_history
         (work_item_id, from_status, to_status, note, changed_by)
         VALUES (?, ?, ?, ?, ?)`,
        [Number(id), item.status, status, clean(note, 1000) || null, Number(user.id)],
      );
      if (department === "human-resources" && item.work_type === "Exit" &&
          status === "Completed" && item.policy_number) {
        await connection.query(
          `UPDATE employees SET status = 'Inactive',
           relieving_date = COALESCE(?, CURRENT_DATE())
           WHERE employee_code = ?`,
          [item.due_date, item.policy_number],
        );
      }
      const [rows] = await connection.query(
        "SELECT * FROM department_work_items WHERE id = ?",
        [Number(id)],
      );
      await connection.commit();
      return rows[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getHistory(department, id, user) {
    const scope = departmentWorkScope(user, "department_work_items");
    const [items] = await db.query(
      `SELECT id FROM department_work_items
       WHERE id = ? AND department_slug = ? AND ${scope.sql} LIMIT 1`,
      [Number(id), department, ...scope.params],
    );
    if (!items.length) {
      const error = new Error("Department work item not found");
      error.statusCode = 404;
      throw error;
    }
    const [rows] = await db.query(
      `SELECT h.id, h.from_status fromStatus, h.to_status toStatus, h.note,
        e.name changedBy, h.created_at createdAt
       FROM department_work_item_history h
       LEFT JOIN employees e ON h.changed_by = e.id
       WHERE h.work_item_id = ? ORDER BY h.created_at DESC, h.id DESC`,
      [Number(id)],
    );
    return rows;
  }
}

export default DepartmentEntryModel;
