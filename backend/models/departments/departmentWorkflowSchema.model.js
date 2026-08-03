import db from "../../config/database.js";

export const ensureDepartmentWorkflowSchema = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS department_work_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      department_slug VARCHAR(80) NOT NULL,
      policy_id INT DEFAULT NULL,
      policy_number VARCHAR(150) DEFAULT NULL,
      customer_name VARCHAR(255) DEFAULT NULL,
      work_type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      priority ENUM('Low', 'Normal', 'High', 'Critical') NOT NULL DEFAULT 'Normal',
      status ENUM('Open', 'In Progress', 'Pending', 'Approved', 'Completed', 'Rejected') NOT NULL DEFAULT 'Open',
      assigned_to INT UNSIGNED DEFAULT NULL,
      due_date DATE DEFAULT NULL,
      payload JSON DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY department_work_items_department (department_slug, status),
      KEY department_work_items_policy (policy_id),
      KEY department_work_items_assignee (assigned_to),
      KEY department_work_items_due_date (due_date),
      KEY department_work_items_created_by (created_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS department_work_item_history (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      work_item_id BIGINT UNSIGNED NOT NULL,
      from_status VARCHAR(30) DEFAULT NULL,
      to_status VARCHAR(30) NOT NULL,
      note VARCHAR(1000) DEFAULT NULL,
      changed_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY department_work_history_item (work_item_id, created_at),
      KEY department_work_history_user (changed_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS policy_followup (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      policy_id INT DEFAULT NULL,
      policy_number VARCHAR(150) NOT NULL,
      insured_name VARCHAR(255) DEFAULT NULL,
      renewal_date DATE DEFAULT NULL,
      followup_date DATE NOT NULL,
      next_followup_date DATE DEFAULT NULL,
      contact_mode ENUM('Call', 'WhatsApp', 'Email', 'Visit', 'Other') NOT NULL DEFAULT 'Call',
      disposition ENUM('Contacted', 'Not Reachable', 'Quoted', 'Interested', 'Not Interested', 'Renewed', 'Lost') NOT NULL DEFAULT 'Contacted',
      status ENUM('Open', 'Scheduled', 'Closed') NOT NULL DEFAULT 'Open',
      remarks VARCHAR(1000) DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY policy_followup_policy (policy_id),
      KEY policy_followup_number (policy_number),
      KEY policy_followup_status (status, next_followup_date),
      KEY policy_followup_created_by (created_by),
      KEY policy_followup_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};
