import db from "../../config/database.js";
// Human Resources department schema model.

const ensureColumn = async (table, column, definition) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  if (!Number(rows[0]?.count)) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
};

const ensureForeignKey = async (table, name, definition) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) count FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [table, name],
  );
  if (!Number(rows[0]?.count)) {
    await db.query(`ALTER TABLE \`${table}\` ADD CONSTRAINT \`${name}\` ${definition}`);
  }
};

const ensureUniqueIndex = async (table, name, columns) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) count FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, name],
  );
  if (!Number(rows[0]?.count)) {
    await db.query(
      `ALTER TABLE \`${table}\` ADD UNIQUE KEY \`${name}\` (${columns})`,
    );
  }
};

export const ensureHrSchema = async () => {
  await ensureColumn("designations", "parent_designation_id", "INT UNSIGNED DEFAULT NULL AFTER `designation_name`");
  await ensureColumn("designations", "hierarchy_level", "INT UNSIGNED NOT NULL DEFAULT 1 AFTER `parent_designation_id`");
  await ensureColumn("designations", "status", "ENUM('Active','Inactive') NOT NULL DEFAULT 'Active' AFTER `hierarchy_level`");

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_leave_types (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(20) NOT NULL,
      annual_quota DECIMAL(6,2) NOT NULL DEFAULT 0,
      paid TINYINT(1) NOT NULL DEFAULT 1,
      carry_forward TINYINT(1) NOT NULL DEFAULT 0,
      status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY hr_leave_type_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    INSERT IGNORE INTO hr_leave_types (name, code, annual_quota, paid, carry_forward, created_by)
    SELECT 'Casual Leave','CL',12,1,0,id FROM employees ORDER BY id LIMIT 1
  `);
  await db.query(`
    INSERT IGNORE INTO hr_leave_types (name, code, annual_quota, paid, carry_forward, created_by)
    SELECT 'Sick Leave','SL',12,1,0,id FROM employees ORDER BY id LIMIT 1
  `);
  await db.query(`
    INSERT IGNORE INTO hr_leave_types (name, code, annual_quota, paid, carry_forward, created_by)
    SELECT 'Earned Leave','EL',18,1,1,id FROM employees ORDER BY id LIMIT 1
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_leave_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employee_id INT UNSIGNED NOT NULL,
      leave_type_id INT UNSIGNED NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      days DECIMAL(6,2) NOT NULL,
      reason VARCHAR(1000) NOT NULL,
      status ENUM('Pending','Approved','Rejected','Cancelled') NOT NULL DEFAULT 'Pending',
      approver_id INT UNSIGNED DEFAULT NULL,
      approver_note VARCHAR(1000) DEFAULT NULL,
      decided_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY hr_leave_employee (employee_id, status),
      KEY hr_leave_dates (from_date, to_date),
      KEY hr_leave_approver (approver_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_payroll (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employee_id INT UNSIGNED NOT NULL,
      payroll_month CHAR(7) NOT NULL,
      basic DECIMAL(15,2) NOT NULL DEFAULT 0,
      hra DECIMAL(15,2) NOT NULL DEFAULT 0,
      allowances DECIMAL(15,2) NOT NULL DEFAULT 0,
      bonus DECIMAL(15,2) NOT NULL DEFAULT 0,
      deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
      tax DECIMAL(15,2) NOT NULL DEFAULT 0,
      net_pay DECIMAL(15,2) NOT NULL DEFAULT 0,
      payment_status ENUM('Draft','Processed','Paid','On Hold') NOT NULL DEFAULT 'Draft',
      payment_date DATE DEFAULT NULL,
      notes VARCHAR(1000) DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY hr_payroll_employee_month (employee_id, payroll_month),
      KEY hr_payroll_month (payroll_month, payment_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_increments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employee_id INT UNSIGNED NOT NULL,
      effective_date DATE NOT NULL,
      previous_ctc DECIMAL(15,2) NOT NULL DEFAULT 0,
      revised_ctc DECIMAL(15,2) NOT NULL DEFAULT 0,
      increment_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
      reason VARCHAR(500) DEFAULT NULL,
      status ENUM('Proposed','Approved','Effective','Rejected') NOT NULL DEFAULT 'Proposed',
      approved_by INT UNSIGNED DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY hr_increment_employee (employee_id, effective_date),
      KEY hr_increment_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_documents (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employee_id INT UNSIGNED NOT NULL,
      document_type ENUM(
        'Offer Letter','Appointment Letter','Confirmation Letter','Increment Letter',
        'Experience Certificate','Relieving Letter','Termination Letter',
        'Salary Certificate','Employment Certificate','Warning Letter','NOC','Other'
      ) NOT NULL,
      document_number VARCHAR(80) NOT NULL,
      issue_date DATE NOT NULL,
      effective_date DATE DEFAULT NULL,
      subject VARCHAR(255) NOT NULL,
      body LONGTEXT NOT NULL,
      status ENUM('Draft','Issued','Acknowledged','Revoked') NOT NULL DEFAULT 'Draft',
      issued_by INT UNSIGNED NOT NULL,
      issued_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY hr_document_number (document_number),
      KEY hr_document_employee (employee_id, document_type),
      KEY hr_document_status (status, issue_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn(
    "hr_documents",
    "document_number",
    "VARCHAR(80) DEFAULT NULL AFTER `document_type`",
  );
  await db.query(`
    UPDATE hr_documents
       SET document_number = CONCAT('HRDOC-', id)
     WHERE document_number IS NULL OR TRIM(document_number) = ''
  `);
  await db.query(
    "ALTER TABLE hr_documents MODIFY COLUMN document_number VARCHAR(80) NOT NULL",
  );
  await ensureUniqueIndex(
    "hr_documents",
    "hr_document_number",
    "`document_number`",
  );

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_employee_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employee_id INT UNSIGNED NOT NULL,
      event_type ENUM('Onboarding','Probation','Confirmation','Transfer','Promotion','Resignation','Termination','Relieving','Retirement','Other') NOT NULL,
      event_date DATE NOT NULL,
      status ENUM('Planned','In Progress','Completed','Cancelled') NOT NULL DEFAULT 'Planned',
      notes VARCHAR(1000) DEFAULT NULL,
      document_id BIGINT UNSIGNED DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY hr_event_employee (employee_id, event_date),
      KEY hr_event_status (event_type, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_attendance (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employee_id INT UNSIGNED NOT NULL,
      attendance_date DATE NOT NULL,
      attendance_status ENUM(
        'Present','Absent','Half Day','Leave','Week Off','Holiday','Work From Home'
      ) NOT NULL DEFAULT 'Present',
      check_in TIME DEFAULT NULL,
      check_out TIME DEFAULT NULL,
      work_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
      notes VARCHAR(500) DEFAULT NULL,
      marked_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY hr_attendance_employee_date (employee_id, attendance_date),
      KEY hr_attendance_date_status (attendance_date, attendance_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_employee_payouts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employee_id INT UNSIGNED NOT NULL,
      payout_month CHAR(7) NOT NULL,
      payout_type ENUM(
        'Salary','Incentive','Bonus','Reimbursement','Settlement','Other'
      ) NOT NULL,
      amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      payout_status ENUM('Draft','Approved','Paid','On Hold','Cancelled') NOT NULL DEFAULT 'Draft',
      payout_date DATE DEFAULT NULL,
      reference_number VARCHAR(100) DEFAULT NULL,
      notes VARCHAR(1000) DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY hr_payout_employee_month (employee_id, payout_month),
      KEY hr_payout_status (payout_status, payout_month)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_shifts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      shift_name VARCHAR(100) NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      grace_minutes INT UNSIGNED NOT NULL DEFAULT 0,
      minimum_hours DECIMAL(5,2) NOT NULL DEFAULT 8,
      working_days VARCHAR(100) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
      status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY hr_shift_name (shift_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_employee_shift_assignments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employee_id INT UNSIGNED NOT NULL,
      shift_id INT UNSIGNED NOT NULL,
      effective_from DATE NOT NULL,
      effective_to DATE DEFAULT NULL,
      status ENUM('Active','Completed','Cancelled') NOT NULL DEFAULT 'Active',
      assigned_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY hr_employee_shift_effective (employee_id, effective_from),
      KEY hr_shift_assignment_status (shift_id, status, effective_from)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_holidays (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      holiday_date DATE NOT NULL,
      holiday_name VARCHAR(150) NOT NULL,
      holiday_type ENUM('National','Company','Optional') NOT NULL DEFAULT 'Company',
      status ENUM('Active','Cancelled') NOT NULL DEFAULT 'Active',
      notes VARCHAR(500) DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY hr_holiday_date_name (holiday_date, holiday_name),
      KEY hr_holiday_status_date (status, holiday_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_performance_reviews (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employee_id INT UNSIGNED NOT NULL,
      reviewer_id INT UNSIGNED NOT NULL,
      review_period CHAR(7) NOT NULL,
      rating DECIMAL(3,2) NOT NULL,
      goals LONGTEXT DEFAULT NULL,
      achievements LONGTEXT DEFAULT NULL,
      strengths LONGTEXT DEFAULT NULL,
      improvement_areas LONGTEXT DEFAULT NULL,
      reviewer_feedback LONGTEXT DEFAULT NULL,
      employee_comments LONGTEXT DEFAULT NULL,
      status ENUM('Draft','Submitted','Acknowledged','Closed') NOT NULL DEFAULT 'Draft',
      reviewed_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY hr_performance_employee_period (employee_id, review_period),
      KEY hr_performance_reviewer_status (reviewer_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    ALTER TABLE hr_documents MODIFY COLUMN document_type ENUM(
      'Offer Letter','Appointment Letter','Confirmation Letter','Increment Letter',
      'Promotion Letter','Transfer Letter','Probation Extension Letter',
      'Experience Certificate','Relieving Letter','Termination Letter',
      'Salary Certificate','Employment Certificate','Warning Letter',
      'Show Cause Notice','Appreciation Letter','Internship Offer',
      'Internship Completion Certificate','Full and Final Settlement','NOC','Other'
    ) NOT NULL
  `);

  await ensureForeignKey(
    "designations",
    "fk_designation_parent",
    "FOREIGN KEY (`parent_designation_id`) REFERENCES `designations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_leave_types",
    "fk_hr_leave_type_creator",
    "FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_leave_requests",
    "fk_hr_leave_employee",
    "FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_leave_requests",
    "fk_hr_leave_type",
    "FOREIGN KEY (`leave_type_id`) REFERENCES `hr_leave_types` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_leave_requests",
    "fk_hr_leave_approver",
    "FOREIGN KEY (`approver_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_payroll",
    "fk_hr_payroll_employee",
    "FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_payroll",
    "fk_hr_payroll_creator",
    "FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_increments",
    "fk_hr_increment_employee",
    "FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_increments",
    "fk_hr_increment_approver",
    "FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_increments",
    "fk_hr_increment_creator",
    "FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_documents",
    "fk_hr_document_employee",
    "FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_documents",
    "fk_hr_document_issuer",
    "FOREIGN KEY (`issued_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_employee_events",
    "fk_hr_event_employee",
    "FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_employee_events",
    "fk_hr_event_document",
    "FOREIGN KEY (`document_id`) REFERENCES `hr_documents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_employee_events",
    "fk_hr_event_creator",
    "FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_attendance",
    "fk_hr_attendance_employee",
    "FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_attendance",
    "fk_hr_attendance_marker",
    "FOREIGN KEY (`marked_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_employee_payouts",
    "fk_hr_payout_employee",
    "FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_employee_payouts",
    "fk_hr_payout_creator",
    "FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_shifts",
    "fk_hr_shift_creator",
    "FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_employee_shift_assignments",
    "fk_hr_shift_assignment_employee",
    "FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_employee_shift_assignments",
    "fk_hr_shift_assignment_shift",
    "FOREIGN KEY (`shift_id`) REFERENCES `hr_shifts` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_employee_shift_assignments",
    "fk_hr_shift_assignment_creator",
    "FOREIGN KEY (`assigned_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_holidays",
    "fk_hr_holiday_creator",
    "FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_performance_reviews",
    "fk_hr_performance_employee",
    "FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE",
  );
  await ensureForeignKey(
    "hr_performance_reviews",
    "fk_hr_performance_reviewer",
    "FOREIGN KEY (`reviewer_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE",
  );
};

export default ensureHrSchema;
