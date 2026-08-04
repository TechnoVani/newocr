import bcrypt from "bcryptjs";
// Human Resources department model.
import db from "../../config/database.js";
import { employeeVisibilityFilter } from "../../utils/roleAccess.js";

export const HrModel = {
  async getOptions(user, managerView = true) {
    const employeeScope = employeeVisibilityFilter(user, "e.id");
    const [[departments], [designations], [employees], [leaveTypes], [managerRows], [nextCodeRows], [shifts]] = await Promise.all([
      db.query("SELECT id, department_name name FROM departments ORDER BY department_name"),
      db.query(`SELECT id, department department_id, designation_name name,
        parent_designation_id, COALESCE(hierarchy_level, 1) hierarchy_level, COALESCE(status, 'Active') status
        FROM designations ORDER BY department, hierarchy_level, designation_name`),
      db.query(`SELECT e.id, e.employee_code, e.name, e.department department_id, e.designation designation_id,
        e.joining_date, d.department_name department, g.designation_name designation,
        reporting.name reporting_manager_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department
        LEFT JOIN designations g ON g.id = e.designation
        LEFT JOIN employees reporting ON reporting.id = e.reporting_manager
        WHERE ${employeeScope.sql}
        ORDER BY e.name`, employeeScope.params),
      db.query("SELECT id, name, code, annual_quota, paid, carry_forward FROM hr_leave_types WHERE status = 'Active' ORDER BY name"),
      db.query(`SELECT e.id, e.employee_code, e.name, e.department department_id,
        d.department_name department, g.designation_name designation
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department
        LEFT JOIN designations g ON g.id = e.designation
        WHERE e.status = 'Active' AND ${employeeScope.sql}
        ORDER BY e.name`, employeeScope.params),
      db.query(`SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code, 4) AS UNSIGNED)), 0) latest_number
        FROM employees WHERE employee_code REGEXP '^NIB[0-9]+$'`),
      db.query(`SELECT id, shift_name name, start_time, end_time, grace_minutes,
        minimum_hours, working_days, status
        FROM hr_shifts WHERE status = 'Active' ORDER BY shift_name`),
    ]);
    const nextEmployeeCode = `NIB${String(Number(nextCodeRows[0]?.latest_number || 0) + 1).padStart(5, "0")}`;
    return {
      departments,
      designations,
      employees,
      leaveTypes,
      reportingManagers: managerRows,
      relationshipManagers: managerRows,
      nextEmployeeCode,
      shifts,
    };
  },

  async overview(user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "e.id");
    const recordScope = employeeVisibilityFilter(user, "employee_id");
    const eventScope = employeeVisibilityFilter(user, "ev.employee_id");
    const [[employeeRows], [leaveRows], [payrollRows], [documentRows], [attendanceRows], [payoutRows], [performanceRows], [recentEvents]] = await Promise.all([
      db.query(`SELECT COUNT(*) total,
        SUM(status = 'Active') active,
        SUM(status = 'Inactive') inactive
        FROM employees e WHERE ${employeeScope.sql}`, employeeScope.params),
      db.query(`SELECT COUNT(*) total, SUM(status = 'Pending') pending,
        SUM(status = 'Approved') approved FROM hr_leave_requests WHERE ${recordScope.sql}`, recordScope.params),
      db.query(`SELECT COUNT(*) records, COALESCE(SUM(net_pay),0) net_pay,
        SUM(payment_status = 'Paid') paid FROM hr_payroll WHERE ${recordScope.sql}`, recordScope.params),
      db.query(`SELECT COUNT(*) total, SUM(status = 'Draft') drafts,
        SUM(status = 'Issued') issued FROM hr_documents WHERE ${recordScope.sql}`, recordScope.params),
      db.query(`SELECT COUNT(*) records, SUM(attendance_status = 'Present') present,
        SUM(attendance_status = 'Absent') absent
        FROM hr_attendance WHERE ${recordScope.sql} AND DATE_FORMAT(attendance_date, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')`, recordScope.params),
      db.query(`SELECT COUNT(*) records, COALESCE(SUM(amount),0) amount,
        SUM(payout_status = 'Paid') paid
        FROM hr_employee_payouts WHERE ${recordScope.sql} AND payout_month = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')`, recordScope.params),
      db.query(`SELECT COUNT(*) records, COALESCE(AVG(rating),0) average_rating,
        SUM(status = 'Submitted') pending_acknowledgement
        FROM hr_performance_reviews WHERE ${recordScope.sql} AND review_period = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')`, recordScope.params),
      db.query(`SELECT ev.id, ev.event_type, ev.event_date, ev.status, ev.notes,
        e.employee_code, e.name employee_name
        FROM hr_employee_events ev JOIN employees e ON e.id = ev.employee_id
        WHERE ${eventScope.sql}
        ORDER BY ev.event_date DESC, ev.id DESC LIMIT 8`, eventScope.params),
    ]);
    return {
      employees: employeeRows[0] || {},
      leave: leaveRows[0] || {},
      payroll: payrollRows[0] || {},
      documents: documentRows[0] || {},
      attendance: attendanceRows[0] || {},
      payouts: payoutRows[0] || {},
      performance: performanceRows[0] || {},
      recentEvents,
    };
  },

  async getOrganization() {
    const [[departments], [designations]] = await Promise.all([
      db.query(`SELECT d.id, d.department_name name, COUNT(e.id) employee_count
        FROM departments d LEFT JOIN employees e ON e.department = d.id
        GROUP BY d.id, d.department_name ORDER BY d.department_name`),
      db.query(`SELECT g.id, g.designation_name name, g.department department_id,
        d.department_name department, g.parent_designation_id,
        parent.designation_name parent_designation,
        COALESCE(g.hierarchy_level,1) hierarchy_level, COALESCE(g.status,'Active') status,
        COUNT(e.id) employee_count
        FROM designations g
        JOIN departments d ON d.id = g.department
        LEFT JOIN designations parent ON parent.id = g.parent_designation_id
        LEFT JOIN employees e ON e.designation = g.id
        GROUP BY g.id, g.designation_name, g.department, d.department_name,
          g.parent_designation_id, parent.designation_name, g.hierarchy_level, g.status
        ORDER BY d.department_name, hierarchy_level, g.designation_name`),
    ]);
    return { departments, designations };
  },

  async createDepartment(name, createdBy) {
    const [existing] = await db.query(
      "SELECT id FROM departments WHERE LOWER(department_name) = LOWER(?) LIMIT 1",
      [name],
    );
    if (existing.length) {
      const duplicate = new Error("Department already exists");
      duplicate.statusCode = 409;
      throw duplicate;
    }
    try {
      const [result] = await db.query(
        "INSERT INTO departments (department_name, created_by) VALUES (?, ?)",
        [name, createdBy],
      );
      return { id: result.insertId, name };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        const duplicate = new Error("Department already exists");
        duplicate.statusCode = 409;
        throw duplicate;
      }
      throw error;
    }
  },

  async createDesignation(data, createdBy) {
    const [existing] = await db.query(
      "SELECT id FROM designations WHERE department = ? AND LOWER(designation_name) = LOWER(?) LIMIT 1",
      [data.department_id, data.name],
    );
    if (existing.length) {
      const duplicate = new Error("Designation already exists in this department");
      duplicate.statusCode = 409;
      throw duplicate;
    }
    let level = 1;
    if (data.parent_designation_id) {
      const [parents] = await db.query(
        "SELECT department, COALESCE(hierarchy_level,1) hierarchy_level FROM designations WHERE id = ?",
        [data.parent_designation_id],
      );
      if (!parents.length || Number(parents[0].department) !== Number(data.department_id)) {
        const error = new Error("Parent designation must belong to the same department");
        error.statusCode = 400;
        throw error;
      }
      level = Number(parents[0].hierarchy_level) + 1;
    }
    const [result] = await db.query(
      `INSERT INTO designations
       (department, designation_name, parent_designation_id, hierarchy_level, status, created_by)
       VALUES (?, ?, ?, ?, 'Active', ?)`,
      [data.department_id, data.name, data.parent_designation_id || null, level, createdBy],
    );
    return { id: result.insertId, hierarchy_level: level };
  },

  async getEmployees(user, managerView = true) {
    const employeeScope = employeeVisibilityFilter(user, "e.id");
    const [rows] = await db.query(`SELECT e.id, e.employee_code, e.name, e.personal_email, e.mobile,
      e.gender, e.date_of_birth, e.emergency_contact, e.current_address,
      e.state, e.city, e.pin_code, e.joining_date, e.relieving_date, e.status, e.user_type,
      e.department department_id, e.designation designation_id,
      e.reporting_manager reporting_manager_id, e.relationship_manager relationship_manager_id,
      d.department_name department, g.designation_name designation,
      manager.name reporting_manager_name, relationship.name relationship_manager_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department
      LEFT JOIN designations g ON g.id = e.designation
      LEFT JOIN employees manager ON manager.id = e.reporting_manager
      LEFT JOIN employees relationship ON relationship.id = e.relationship_manager
      WHERE ${employeeScope.sql}
      ORDER BY e.status = 'Active' DESC, e.name`, employeeScope.params);
    return rows;
  },

  async createEmployee(data, createdBy) {
    const [designationRows] = await db.query(
      "SELECT id FROM designations WHERE id = ? AND department = ? LIMIT 1",
      [data.designation, data.department],
    );
    if (!designationRows.length) {
      const error = new Error("Selected designation does not belong to the selected department");
      error.statusCode = 400;
      throw error;
    }
    if (data.reporting_manager) {
      const [managerRows] = await db.query(
        "SELECT id FROM employees WHERE id = ? AND status = 'Active' LIMIT 1",
        [data.reporting_manager],
      );
      if (!managerRows.length) {
        const error = new Error("Selected reporting manager is not an active employee");
        error.statusCode = 400;
        throw error;
      }
    }
    if (data.relationship_manager) {
      const [managerRows] = await db.query(
        "SELECT id FROM employees WHERE id = ? AND status = 'Active' LIMIT 1",
        [data.relationship_manager],
      );
      if (!managerRows.length) {
        const error = new Error("Selected relationship manager is not an active employee");
        error.statusCode = 400;
        throw error;
      }
    }
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const connection = await db.getConnection();
    let codeLock = false;
    try {
      const [[lockRow]] = await connection.query(
        "SELECT GET_LOCK('hr_employee_code_sequence', 10) acquired",
      );
      if (Number(lockRow?.acquired) !== 1) {
        const error = new Error("Employee code generation is busy. Please retry");
        error.statusCode = 503;
        throw error;
      }
      codeLock = true;
      await connection.beginTransaction();
      const [duplicateRows] = await connection.query(
        `SELECT id FROM employees
         WHERE LOWER(TRIM(personal_email)) = LOWER(?) OR TRIM(mobile) = ?
         LIMIT 1 FOR UPDATE`,
        [data.personal_email, data.mobile],
      );
      if (duplicateRows.length) {
        const duplicate = new Error("Employee email or mobile number already exists");
        duplicate.statusCode = 409;
        throw duplicate;
      }
      const [[latestCode]] = await connection.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code, 4) AS UNSIGNED)), 0) latest_number
         FROM employees
         WHERE employee_code REGEXP '^NIB[0-9]+$'`,
      );
      const employeeCode = `NIB${String(Number(latestCode?.latest_number || 0) + 1).padStart(5, "0")}`;
      const [result] = await connection.query(
        `INSERT INTO employees (
          employee_code, name, personal_email, mobile, password, user_type,
          status, department, designation, joining_date, reporting_manager,
          relationship_manager, gender, date_of_birth, emergency_contact,
          current_address, state, city, pin_code, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeCode, data.name, data.personal_email, data.mobile, hashedPassword,
          data.user_type, data.status, data.department, data.designation,
          data.joining_date, data.reporting_manager || null,
          data.relationship_manager || null, data.gender || null,
          data.date_of_birth || null, data.emergency_contact || null,
          data.current_address || null, data.state || null, data.city || null,
          data.pin_code || null, createdBy,
        ],
      );
      await connection.commit();
      return { id: result.insertId, employee_code: employeeCode };
    } catch (error) {
      await connection.rollback().catch(() => {});
      if (error.code === "ER_DUP_ENTRY") {
        const duplicate = new Error("Employee email or mobile number already exists");
        duplicate.statusCode = 409;
        throw duplicate;
      }
      throw error;
    } finally {
      if (codeLock) {
        await connection.query("SELECT RELEASE_LOCK('hr_employee_code_sequence')").catch(() => {});
      }
      connection.release();
    }
  },

  async updateStatus(id, status, user) {
    const employeeScope = employeeVisibilityFilter(user, "id");
    const [allowedRows] = await db.query(
      `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} LIMIT 1`,
      [id, ...employeeScope.params],
    );
    if (!allowedRows.length) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }
    const [result] = await db.query(
      `UPDATE employees SET status = ?,
       relieving_date = CASE WHEN ? = 'Inactive' THEN COALESCE(relieving_date, CURRENT_DATE()) ELSE NULL END
       WHERE id = ?`,
      [status, status, id],
    );
    if (!result.affectedRows) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }
    return { id: Number(id), status };
  },

  async getDocuments(user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "doc.employee_id");
    const [rows] = await db.query(`SELECT doc.*, e.employee_code, e.name employee_name,
      issuer.name issued_by_name
      FROM hr_documents doc
      JOIN employees e ON e.id = doc.employee_id
      LEFT JOIN employees issuer ON issuer.id = doc.issued_by
      WHERE ${employeeScope.sql}
      ORDER BY doc.issue_date DESC, doc.id DESC`, employeeScope.params);
    return rows;
  },

  async createDocument(data, issuedBy, user) {
    const employeeScope = employeeVisibilityFilter(user, "id");
    const [employees] = await db.query(
      `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} LIMIT 1`,
      [data.employee_id, ...employeeScope.params],
    );
    if (!employees.length) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }
    const documentNumber = data.document_number ||
      `HR-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`;
    try {
      const [result] = await db.query(
        `INSERT INTO hr_documents
         (employee_id, document_type, document_number, issue_date, effective_date,
          subject, body, status, issued_by, issued_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'Issued' THEN NOW() ELSE NULL END)`,
        [data.employee_id, data.document_type, documentNumber, data.issue_date,
          data.effective_date || null, data.subject, data.body, data.status,
          issuedBy, data.status],
      );
      return { id: result.insertId, document_number: documentNumber };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        const duplicate = new Error("HR document number already exists");
        duplicate.statusCode = 409;
        throw duplicate;
      }
      throw error;
    }
  },

  async updateDocumentStatus(id, status, user) {
    const employeeScope = employeeVisibilityFilter(user, "employee_id");
    const [result] = await db.query(
      `UPDATE hr_documents SET status = ?,
       issued_at = CASE WHEN ? = 'Issued' THEN COALESCE(issued_at, NOW()) ELSE issued_at END
       WHERE id = ? AND ${employeeScope.sql}`,
      [status, status, id, ...employeeScope.params],
    );
    if (!result.affectedRows) {
      const error = new Error("HR document not found");
      error.statusCode = 404;
      throw error;
    }
    return { id, status };
  },

  async getPayroll(user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "p.employee_id");
    const [rows] = await db.query(`SELECT p.*, e.employee_code, e.name employee_name,
      d.department_name department
      FROM hr_payroll p JOIN employees e ON e.id = p.employee_id
      LEFT JOIN departments d ON d.id = e.department
      WHERE ${employeeScope.sql}
      ORDER BY p.payroll_month DESC, e.name`, employeeScope.params);
    return rows;
  },

  async savePayroll(data, createdBy, user) {
    const gross = data.basic + data.hra + data.allowances + data.bonus;
    const netPay = gross - data.deductions - data.tax;
    if (netPay < 0) {
      const error = new Error("Payroll deductions and tax cannot exceed gross pay");
      error.statusCode = 400;
      throw error;
    }
    const employeeScope = employeeVisibilityFilter(user, "id");
    const [employees] = await db.query(
      `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} AND status = 'Active' LIMIT 1`,
      [data.employee_id, ...employeeScope.params],
    );
    if (!employees.length) {
      const error = new Error("Active employee not found");
      error.statusCode = 404;
      throw error;
    }
    await db.query(
      `INSERT INTO hr_payroll
       (employee_id, payroll_month, basic, hra, allowances, bonus, deductions,
        tax, net_pay, payment_status, payment_date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE basic=VALUES(basic), hra=VALUES(hra),
        allowances=VALUES(allowances), bonus=VALUES(bonus),
        deductions=VALUES(deductions), tax=VALUES(tax), net_pay=VALUES(net_pay),
        payment_status=VALUES(payment_status), payment_date=VALUES(payment_date),
        notes=VALUES(notes), updated_at=CURRENT_TIMESTAMP`,
      [data.employee_id, data.payroll_month, data.basic, data.hra, data.allowances,
        data.bonus, data.deductions, data.tax, netPay, data.payment_status,
        data.payment_date || null, data.notes || null, createdBy],
    );
    return { employee_id: data.employee_id, payroll_month: data.payroll_month, net_pay: netPay };
  },

  async getIncrements(user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "i.employee_id");
    const [rows] = await db.query(`SELECT i.*, e.employee_code, e.name employee_name
      FROM hr_increments i JOIN employees e ON e.id = i.employee_id
      WHERE ${employeeScope.sql}
      ORDER BY i.effective_date DESC, i.id DESC`, employeeScope.params);
    return rows;
  },

  async createIncrement(data, createdBy, user) {
    const employeeScope = employeeVisibilityFilter(user, "id");
    const [employees] = await db.query(
      `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} LIMIT 1`,
      [data.employee_id, ...employeeScope.params],
    );
    if (!employees.length) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }
    const percent = data.previous_ctc > 0
      ? ((data.revised_ctc - data.previous_ctc) / data.previous_ctc) * 100
      : 0;
    const [result] = await db.query(
      `INSERT INTO hr_increments
       (employee_id, effective_date, previous_ctc, revised_ctc, increment_percent,
        reason, status, approved_by, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.employee_id, data.effective_date, data.previous_ctc, data.revised_ctc,
        percent, data.reason || null, data.status,
        ["Approved", "Effective"].includes(data.status) ? createdBy : null, createdBy],
    );
    return { id: result.insertId, increment_percent: percent };
  },

  async getLeaves(user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "r.employee_id");
    const [rows] = await db.query(`SELECT r.*, e.employee_code, e.name employee_name,
      t.name leave_type, t.code leave_code, approver.name approver_name
      FROM hr_leave_requests r
      JOIN employees e ON e.id = r.employee_id
      JOIN hr_leave_types t ON t.id = r.leave_type_id
      LEFT JOIN employees approver ON approver.id = r.approver_id
      WHERE ${employeeScope.sql}
      ORDER BY r.from_date DESC, r.id DESC`, employeeScope.params);
    return rows;
  },

  async getLeaveBalances(user, managerView, requestedYear) {
    const year = /^\d{4}$/.test(String(requestedYear || "")) ? Number(requestedYear) : new Date().getFullYear();
    const employeeScope = employeeVisibilityFilter(user, "e.id");
    const [rows] = await db.query(`SELECT e.id employee_id, e.employee_code, e.name employee_name,
      t.id leave_type_id, t.name leave_type, t.code leave_code, t.annual_quota,
      COALESCE(SUM(CASE WHEN r.status = 'Approved' THEN r.days ELSE 0 END), 0) approved_days,
      COALESCE(SUM(CASE WHEN r.status = 'Pending' THEN r.days ELSE 0 END), 0) pending_days,
      GREATEST(t.annual_quota - COALESCE(SUM(CASE WHEN r.status IN ('Approved','Pending') THEN r.days ELSE 0 END), 0), 0) available_days
      FROM employees e CROSS JOIN hr_leave_types t
      LEFT JOIN hr_leave_requests r ON r.employee_id = e.id AND r.leave_type_id = t.id
        AND YEAR(r.from_date) = ? AND r.status IN ('Approved','Pending')
      WHERE ${employeeScope.sql} AND e.status = 'Active' AND t.status = 'Active'
      GROUP BY e.id, e.employee_code, e.name, t.id, t.name, t.code, t.annual_quota
      ORDER BY e.name, t.name`, [year, ...employeeScope.params]);
    return { year, rows };
  },

  async createLeave(data, user, managerView) {
    const employeeId = managerView && data.employee_id ? data.employee_id : Number(user.id);
    const employeeScope = employeeVisibilityFilter(user, "id");
    if (data.from_date.slice(0, 4) !== data.to_date.slice(0, 4)) {
      const error = new Error("A leave request must be within one calendar year");
      error.statusCode = 400;
      throw error;
    }
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[employee], [leaveType], [overlaps], [usage]] = await Promise.all([
        connection.query(
          `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} AND status = 'Active' LIMIT 1 FOR UPDATE`,
          [employeeId, ...employeeScope.params],
        ),
        connection.query("SELECT id, annual_quota FROM hr_leave_types WHERE id = ? AND status = 'Active' LIMIT 1 FOR UPDATE", [data.leave_type_id]),
        connection.query(`SELECT id FROM hr_leave_requests
          WHERE employee_id = ? AND status IN ('Pending','Approved')
          AND from_date <= ? AND to_date >= ? LIMIT 1`, [employeeId, data.to_date, data.from_date]),
        connection.query(`SELECT COALESCE(SUM(days),0) used
          FROM hr_leave_requests WHERE employee_id = ? AND leave_type_id = ?
          AND YEAR(from_date) = YEAR(?) AND status IN ('Pending','Approved')`,
          [employeeId, data.leave_type_id, data.from_date]),
      ]);
      if (!employee.length) {
        const error = new Error("Active employee not found");
        error.statusCode = 404;
        throw error;
      }
      if (!leaveType.length) {
        const error = new Error("Active leave type not found");
        error.statusCode = 404;
        throw error;
      }
      if (overlaps.length) {
        const error = new Error("Leave dates overlap an existing pending or approved request");
        error.statusCode = 409;
        throw error;
      }
      const days = Math.floor((new Date(`${data.to_date}T00:00:00Z`) - new Date(`${data.from_date}T00:00:00Z`)) / 86400000) + 1;
      if (Number(usage[0]?.used || 0) + days > Number(leaveType[0].annual_quota)) {
        const error = new Error("Leave request exceeds the available annual balance");
        error.statusCode = 409;
        throw error;
      }
      const [result] = await connection.query(
        `INSERT INTO hr_leave_requests
         (employee_id, leave_type_id, from_date, to_date, days, reason)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [employeeId, data.leave_type_id, data.from_date, data.to_date, days, data.reason],
      );
      await connection.commit();
      return { id: result.insertId, days };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async decideLeave(id, data, approverId, user) {
    const employeeScope = employeeVisibilityFilter(user, "employee_id");
    const [result] = await db.query(
      `UPDATE hr_leave_requests SET status = ?, approver_id = ?,
       approver_note = ?, decided_at = NOW() WHERE id = ? AND ${employeeScope.sql} AND status = 'Pending'`,
      [data.status, approverId, data.note || null, id, ...employeeScope.params],
    );
    if (!result.affectedRows) {
      const error = new Error("Pending leave request not found");
      error.statusCode = 404;
      throw error;
    }
    return { id, status: data.status };
  },

  async cancelLeave(id, user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "employee_id");
    const [result] = await db.query(
      `UPDATE hr_leave_requests SET status = 'Cancelled'
       WHERE id = ? AND ${employeeScope.sql} AND status = 'Pending'`,
      [id, ...employeeScope.params],
    );
    if (!result.affectedRows) {
      const error = new Error("Pending leave request not found");
      error.statusCode = 404;
      throw error;
    }
    return { id, status: "Cancelled" };
  },

  async getEvents(user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "ev.employee_id");
    const [rows] = await db.query(`SELECT ev.*, e.employee_code, e.name employee_name,
      doc.document_number
      FROM hr_employee_events ev JOIN employees e ON e.id = ev.employee_id
      LEFT JOIN hr_documents doc ON doc.id = ev.document_id
      WHERE ${employeeScope.sql}
      ORDER BY ev.event_date DESC, ev.id DESC`, employeeScope.params);
    return rows;
  },

  async createEvent(data, createdBy, user) {
    const employeeScope = employeeVisibilityFilter(user, "id");
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [employees] = await connection.query(
        `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} LIMIT 1 FOR UPDATE`,
        [data.employee_id, ...employeeScope.params],
      );
      if (!employees.length) {
        const error = new Error("Employee not found");
        error.statusCode = 404;
        throw error;
      }
      if (data.document_id) {
        const [documents] = await connection.query(
          "SELECT id FROM hr_documents WHERE id = ? AND employee_id = ? LIMIT 1",
          [data.document_id, data.employee_id],
        );
        if (!documents.length) {
          const error = new Error("Linked HR document must belong to the selected employee");
          error.statusCode = 400;
          throw error;
        }
      }
      const [result] = await connection.query(
        `INSERT INTO hr_employee_events
         (employee_id, event_type, event_date, status, notes, document_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.employee_id, data.event_type, data.event_date, data.status,
          data.notes || null, data.document_id || null, createdBy],
      );
      if (["Termination", "Relieving", "Retirement"].includes(data.event_type) && data.status === "Completed") {
        await connection.query(
          `UPDATE employees SET status = 'Inactive',
           relieving_date = COALESCE(relieving_date, ?) WHERE id = ?`,
          [data.event_date, data.employee_id],
        );
      }
      await connection.commit();
      return { id: result.insertId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getEmployeeProfile(id, user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "e.id");
    const [rows] = await db.query(`SELECT e.id, e.employee_code, e.name, e.personal_email,
      e.mobile, e.gender, e.date_of_birth, e.emergency_contact, e.current_address,
      e.state, e.city, e.pin_code, e.joining_date, e.relieving_date, e.status,
      e.user_type, e.department department_id, e.designation designation_id,
      e.reporting_manager reporting_manager_id, e.relationship_manager relationship_manager_id,
      d.department_name department, g.designation_name designation,
      reporting.name reporting_manager_name, relationship.name relationship_manager_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department
      LEFT JOIN designations g ON g.id = e.designation
      LEFT JOIN employees reporting ON reporting.id = e.reporting_manager
      LEFT JOIN employees relationship ON relationship.id = e.relationship_manager
      WHERE e.id = ? AND ${employeeScope.sql} LIMIT 1`, [id, ...employeeScope.params]);
    if (!rows.length) {
      const error = new Error("Employee profile not found");
      error.statusCode = 404;
      throw error;
    }
    return rows[0];
  },

  async updateEmployeeProfile(id, data, user) {
    const employeeScope = employeeVisibilityFilter(user, "id");
    const [allowedRows] = await db.query(
      `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} LIMIT 1`,
      [id, ...employeeScope.params],
    );
    if (!allowedRows.length) {
      const error = new Error("Employee profile not found");
      error.statusCode = 404;
      throw error;
    }
    const [duplicateRows] = await db.query(
      `SELECT id FROM employees
       WHERE id != ? AND (LOWER(TRIM(personal_email)) = LOWER(?) OR TRIM(mobile) = ?)
       LIMIT 1`,
      [id, data.personal_email, data.mobile],
    );
    if (duplicateRows.length) {
      const duplicate = new Error("Employee email or mobile number already belongs to another employee");
      duplicate.statusCode = 409;
      throw duplicate;
    }
    const [designationRows] = await db.query(
      "SELECT id FROM designations WHERE id = ? AND department = ? LIMIT 1",
      [data.designation, data.department],
    );
    if (!designationRows.length) {
      const error = new Error("Selected designation does not belong to the selected department");
      error.statusCode = 400;
      throw error;
    }
    for (const managerId of [data.reporting_manager, data.relationship_manager].filter(Boolean)) {
      if (Number(managerId) === Number(id)) {
        const error = new Error("An employee cannot be their own manager");
        error.statusCode = 400;
        throw error;
      }
      const [managers] = await db.query(
        "SELECT id FROM employees WHERE id = ? AND status = 'Active' LIMIT 1",
        [managerId],
      );
      if (!managers.length) {
        const error = new Error("Selected manager is not active");
        error.statusCode = 400;
        throw error;
      }
    }
    const [result] = await db.query(`UPDATE employees SET
      name = ?, personal_email = ?, mobile = ?, gender = ?, date_of_birth = ?,
      emergency_contact = ?, current_address = ?, state = ?, city = ?, pin_code = ?,
      department = ?, designation = ?, joining_date = ?, reporting_manager = ?,
      relationship_manager = ?
      WHERE id = ?`, [
      data.name, data.personal_email, data.mobile, data.gender || null,
      data.date_of_birth || null, data.emergency_contact || null,
      data.current_address || null, data.state || null, data.city || null,
      data.pin_code || null, data.department, data.designation, data.joining_date,
      data.reporting_manager || null, data.relationship_manager || null, id,
    ]);
    if (!result.affectedRows) {
      const error = new Error("Employee profile not found");
      error.statusCode = 404;
      throw error;
    }
    return this.getEmployeeProfile(id, user, true);
  },

  async getAttendance(user, managerView, month) {
    const attendanceMonth = /^\d{4}-\d{2}$/.test(String(month || ""))
      ? String(month)
      : new Date().toISOString().slice(0, 7);
    const employeeScope = employeeVisibilityFilter(user, "a.employee_id");
    const [rows] = await db.query(`SELECT a.*, e.employee_code, e.name employee_name,
      d.department_name department, marker.name marked_by_name,
      shift.shift_name, shift.start_time shift_start_time, shift.end_time shift_end_time
      FROM hr_attendance a
      JOIN employees e ON e.id = a.employee_id
      LEFT JOIN departments d ON d.id = e.department
      LEFT JOIN employees marker ON marker.id = a.marked_by
      LEFT JOIN hr_employee_shift_assignments assignment ON assignment.id = (
        SELECT current_assignment.id FROM hr_employee_shift_assignments current_assignment
        WHERE current_assignment.employee_id = a.employee_id
          AND current_assignment.effective_from <= a.attendance_date
          AND (current_assignment.effective_to IS NULL OR current_assignment.effective_to >= a.attendance_date)
          AND current_assignment.status != 'Cancelled'
        ORDER BY current_assignment.effective_from DESC, current_assignment.id DESC LIMIT 1
      )
      LEFT JOIN hr_shifts shift ON shift.id = assignment.shift_id
      WHERE DATE_FORMAT(a.attendance_date, '%Y-%m') = ? AND ${employeeScope.sql}
      ORDER BY a.attendance_date DESC, e.name`, [attendanceMonth, ...employeeScope.params]);
    return { month: attendanceMonth, rows };
  },

  async saveAttendance(data, markedBy, user) {
    const employeeScope = employeeVisibilityFilter(user, "id");
    const [employees] = await db.query(
      `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} AND status = 'Active' LIMIT 1`,
      [data.employee_id, ...employeeScope.params],
    );
    if (!employees.length) {
      const error = new Error("Active employee not found");
      error.statusCode = 404;
      throw error;
    }
    let workHours = 0;
    if (data.check_in && data.check_out) {
      const [startHour, startMinute] = data.check_in.split(":").map(Number);
      const [endHour, endMinute] = data.check_out.split(":").map(Number);
      workHours = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60;
      if (workHours < 0 || workHours > 24) {
        const error = new Error("Check-out time must be after check-in time");
        error.statusCode = 400;
        throw error;
      }
    }
    await db.query(`INSERT INTO hr_attendance
      (employee_id, attendance_date, attendance_status, check_in, check_out,
       work_hours, notes, marked_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE attendance_status = VALUES(attendance_status),
       check_in = VALUES(check_in), check_out = VALUES(check_out),
       work_hours = VALUES(work_hours), notes = VALUES(notes),
       marked_by = VALUES(marked_by), updated_at = CURRENT_TIMESTAMP`, [
      data.employee_id, data.attendance_date, data.attendance_status,
      data.check_in || null, data.check_out || null, workHours,
      data.notes || null, markedBy,
    ]);
    return { employee_id: data.employee_id, attendance_date: data.attendance_date, work_hours: workHours };
  },

  async getPayouts(user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "payout.employee_id");
    const [rows] = await db.query(`SELECT payout.*, e.employee_code, e.name employee_name,
      d.department_name department
      FROM hr_employee_payouts payout
      JOIN employees e ON e.id = payout.employee_id
      LEFT JOIN departments d ON d.id = e.department
      WHERE ${employeeScope.sql}
      ORDER BY payout.payout_month DESC, payout.id DESC`,
    employeeScope.params);
    return rows;
  },

  async createPayout(data, createdBy, user) {
    const employeeScope = employeeVisibilityFilter(user, "id");
    const [employees] = await db.query(
      `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} LIMIT 1`,
      [data.employee_id, ...employeeScope.params],
    );
    if (!employees.length) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }
    const [result] = await db.query(`INSERT INTO hr_employee_payouts
      (employee_id, payout_month, payout_type, amount, payout_status,
       payout_date, reference_number, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      data.employee_id, data.payout_month, data.payout_type, data.amount,
      data.payout_status, data.payout_date || null,
      data.reference_number || null, data.notes || null, createdBy,
    ]);
    return { id: result.insertId };
  },

  async updatePayoutStatus(id, data, user) {
    const employeeScope = employeeVisibilityFilter(user, "employee_id");
    const [result] = await db.query(`UPDATE hr_employee_payouts
      SET payout_status = ?, payout_date = CASE
        WHEN ? = 'Paid' THEN ?
        WHEN ? IN ('Draft','Approved','On Hold') THEN NULL
        ELSE payout_date END,
        reference_number = COALESCE(NULLIF(?, ''), reference_number),
        notes = COALESCE(NULLIF(?, ''), notes)
      WHERE id = ? AND ${employeeScope.sql}`, [
      data.payout_status, data.payout_status, data.payout_date || null,
      data.payout_status, data.reference_number || "",
      data.notes || "", id, ...employeeScope.params,
    ]);
    if (!result.affectedRows) {
      const error = new Error("Employee payout not found");
      error.statusCode = 404;
      throw error;
    }
    return { id, payout_status: data.payout_status };
  },

  async getWorkforceSetup(user) {
    const employeeScope = employeeVisibilityFilter(user, "assignment.employee_id");
    const [[shifts], [assignments], [holidays]] = await Promise.all([
      db.query(`SELECT shift.*, creator.name created_by_name
        FROM hr_shifts shift
        LEFT JOIN employees creator ON creator.id = shift.created_by
        ORDER BY shift.status = 'Active' DESC, shift.shift_name`),
      db.query(`SELECT assignment.*, e.employee_code, e.name employee_name,
        shift.shift_name, shift.start_time, shift.end_time,
        assigner.name assigned_by_name
        FROM hr_employee_shift_assignments assignment
        JOIN employees e ON e.id = assignment.employee_id
        JOIN hr_shifts shift ON shift.id = assignment.shift_id
        LEFT JOIN employees assigner ON assigner.id = assignment.assigned_by
        WHERE ${employeeScope.sql}
        ORDER BY assignment.effective_from DESC, assignment.id DESC`, employeeScope.params),
      db.query(`SELECT holiday.*, creator.name created_by_name
        FROM hr_holidays holiday
        LEFT JOIN employees creator ON creator.id = holiday.created_by
        ORDER BY holiday.holiday_date DESC, holiday.holiday_name`),
    ]);
    return { shifts, assignments, holidays };
  },

  async createShift(data, createdBy) {
    try {
      const [result] = await db.query(`INSERT INTO hr_shifts
        (shift_name, start_time, end_time, grace_minutes, minimum_hours,
         working_days, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        data.shift_name, data.start_time, data.end_time, data.grace_minutes,
        data.minimum_hours, data.working_days, data.status, createdBy,
      ]);
      return { id: result.insertId };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        const duplicate = new Error("Shift name already exists");
        duplicate.statusCode = 409;
        throw duplicate;
      }
      throw error;
    }
  },

  async assignShift(data, assignedBy, user) {
    const employeeScope = employeeVisibilityFilter(user, "id");
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[employees], [shifts]] = await Promise.all([
        connection.query(
          `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} AND status = 'Active' LIMIT 1 FOR UPDATE`,
          [data.employee_id, ...employeeScope.params],
        ),
        connection.query("SELECT id FROM hr_shifts WHERE id = ? AND status = 'Active' LIMIT 1", [data.shift_id]),
      ]);
      if (!employees.length || !shifts.length) {
        const error = new Error("Active employee and active shift are required");
        error.statusCode = 404;
        throw error;
      }
      await connection.query(`UPDATE hr_employee_shift_assignments
        SET effective_to = DATE_SUB(?, INTERVAL 1 DAY), status = 'Completed'
        WHERE employee_id = ? AND status = 'Active' AND effective_from < ?`,
      [data.effective_from, data.employee_id, data.effective_from]);
      const [result] = await connection.query(`INSERT INTO hr_employee_shift_assignments
        (employee_id, shift_id, effective_from, effective_to, status, assigned_by)
        VALUES (?, ?, ?, ?, 'Active', ?)
        ON DUPLICATE KEY UPDATE shift_id = VALUES(shift_id),
          effective_to = VALUES(effective_to), status = 'Active',
          assigned_by = VALUES(assigned_by), updated_at = CURRENT_TIMESTAMP`, [
        data.employee_id, data.shift_id, data.effective_from,
        data.effective_to || null, assignedBy,
      ]);
      await connection.commit();
      return { id: result.insertId, employee_id: data.employee_id, shift_id: data.shift_id };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async createHoliday(data, createdBy) {
    try {
      const [result] = await db.query(`INSERT INTO hr_holidays
        (holiday_date, holiday_name, holiday_type, status, notes, created_by)
        VALUES (?, ?, ?, 'Active', ?, ?)`, [
        data.holiday_date, data.holiday_name, data.holiday_type,
        data.notes || null, createdBy,
      ]);
      return { id: result.insertId };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        const duplicate = new Error("This holiday already exists");
        duplicate.statusCode = 409;
        throw duplicate;
      }
      throw error;
    }
  },

  async getPerformanceReviews(user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "review.employee_id");
    const [rows] = await db.query(`SELECT review.*, e.employee_code,
      e.name employee_name, d.department_name department,
      reviewer.name reviewer_name
      FROM hr_performance_reviews review
      JOIN employees e ON e.id = review.employee_id
      LEFT JOIN departments d ON d.id = e.department
      JOIN employees reviewer ON reviewer.id = review.reviewer_id
      WHERE ${employeeScope.sql}
      ORDER BY review.review_period DESC, e.name`,
    employeeScope.params);
    return rows;
  },

  async savePerformanceReview(data, reviewerId, user) {
    const employeeScope = employeeVisibilityFilter(user, "id");
    const [employees] = await db.query(
      `SELECT id FROM employees WHERE id = ? AND ${employeeScope.sql} LIMIT 1`,
      [data.employee_id, ...employeeScope.params],
    );
    if (!employees.length) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }
    await db.query(`INSERT INTO hr_performance_reviews
      (employee_id, reviewer_id, review_period, rating, goals, achievements,
       strengths, improvement_areas, reviewer_feedback, status, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'Submitted' THEN NOW() ELSE NULL END)
      ON DUPLICATE KEY UPDATE reviewer_id = VALUES(reviewer_id),
       rating = VALUES(rating), goals = VALUES(goals),
       achievements = VALUES(achievements), strengths = VALUES(strengths),
       improvement_areas = VALUES(improvement_areas),
       reviewer_feedback = VALUES(reviewer_feedback), status = VALUES(status),
       reviewed_at = CASE WHEN VALUES(status) = 'Submitted'
         THEN COALESCE(reviewed_at, NOW()) ELSE reviewed_at END,
       updated_at = CURRENT_TIMESTAMP`, [
      data.employee_id, reviewerId, data.review_period, data.rating,
      data.goals || null, data.achievements || null, data.strengths || null,
      data.improvement_areas || null, data.reviewer_feedback || null,
      data.status, data.status,
    ]);
    return { employee_id: data.employee_id, review_period: data.review_period };
  },

  async updatePerformanceStatus(id, status, user, managerView) {
    const employeeScope = employeeVisibilityFilter(user, "employee_id");
    const [result] = await db.query(`UPDATE hr_performance_reviews
      SET status = ?, reviewed_at = CASE WHEN ? IN ('Submitted','Closed')
        THEN COALESCE(reviewed_at, NOW()) ELSE reviewed_at END
      WHERE id = ? AND ${employeeScope.sql}`,
      [status, status, id, ...employeeScope.params]);
    if (!result.affectedRows) {
      const error = new Error("Performance review not found");
      error.statusCode = 404;
      throw error;
    }
    return { id, status };
  },

  async getReports(user, month) {
    const reportMonth = /^\d{4}-\d{2}$/.test(String(month || ""))
      ? String(month)
      : new Date().toISOString().slice(0, 7);
    const employeeScope = employeeVisibilityFilter(user, "e.id");
    const attendanceScope = employeeVisibilityFilter(user, "employee_id");
    const payrollScope = employeeVisibilityFilter(user, "employee_id");
    const payoutScope = employeeVisibilityFilter(user, "employee_id");
    const performanceScope = employeeVisibilityFilter(user, "employee_id");
    const [[workforce], [attendance], [payroll], [payouts], [performance], [holidays], [departmentRows]] = await Promise.all([
      db.query(`SELECT COUNT(*) total_employees,
        SUM(status = 'Active') active_employees,
        SUM(status = 'Inactive') inactive_employees FROM employees e WHERE ${employeeScope.sql}`, employeeScope.params),
      db.query(`SELECT COUNT(*) attendance_records,
        SUM(attendance_status = 'Present') present,
        SUM(attendance_status = 'Absent') absent,
        SUM(attendance_status = 'Half Day') half_day,
        SUM(attendance_status = 'Leave') on_leave,
        COALESCE(SUM(work_hours),0) work_hours
        FROM hr_attendance
        WHERE DATE_FORMAT(attendance_date, '%Y-%m') = ? AND ${attendanceScope.sql}`, [reportMonth, ...attendanceScope.params]),
      db.query(`SELECT COUNT(*) payroll_records, COALESCE(SUM(net_pay),0) net_pay,
        SUM(payment_status = 'Paid') paid_records
        FROM hr_payroll WHERE payroll_month = ? AND ${payrollScope.sql}`, [reportMonth, ...payrollScope.params]),
      db.query(`SELECT COUNT(*) payout_records, COALESCE(SUM(amount),0) payout_amount,
        SUM(payout_status = 'Paid') paid_payouts
        FROM hr_employee_payouts WHERE payout_month = ? AND ${payoutScope.sql}`, [reportMonth, ...payoutScope.params]),
      db.query(`SELECT COUNT(*) review_records, COALESCE(AVG(rating),0) average_rating,
        SUM(status = 'Submitted') submitted_reviews,
        SUM(status = 'Closed') closed_reviews
        FROM hr_performance_reviews WHERE review_period = ? AND ${performanceScope.sql}`, [reportMonth, ...performanceScope.params]),
      db.query(`SELECT COUNT(*) holiday_count FROM hr_holidays
        WHERE status = 'Active' AND DATE_FORMAT(holiday_date, '%Y-%m') = ?`, [reportMonth]),
      db.query(`SELECT d.department_name department, COUNT(e.id) total_employees,
        SUM(e.status = 'Active') active_employees,
        SUM(e.status = 'Inactive') inactive_employees
        FROM departments d LEFT JOIN employees e ON e.department = d.id AND ${employeeScope.sql}
        GROUP BY d.id, d.department_name ORDER BY d.department_name`, employeeScope.params),
    ]);
    return {
      month: reportMonth,
      workforce: workforce[0] || {},
      attendance: attendance[0] || {},
      payroll: payroll[0] || {},
      payouts: payouts[0] || {},
      performance: performance[0] || {},
      holidays: holidays[0] || {},
      departments: departmentRows,
    };
  },
};
