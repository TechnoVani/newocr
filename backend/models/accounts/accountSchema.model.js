import db from '../../config/database.js';

const ensureColumn = async (tableName, columnName, definition) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  if (Number(rows[0].count) === 0) {
    await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  }
};

const dropColumnIfExists = async (tableName, columnName) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  if (Number(rows[0].count) > 0) {
    await db.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${columnName}\``);
  }
};

const dropIndexIfExists = async (tableName, indexName) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  if (Number(rows[0].count) > 0) {
    await db.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``);
  }
};

const ensureUniqueIndex = async (tableName, indexName, columnName) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  if (Number(rows[0].count) === 0) {
    await db.query(
      `ALTER TABLE \`${tableName}\` ADD UNIQUE KEY \`${indexName}\` (\`${columnName}\`)`
    );
  }
};

const tableExists = async (tableName) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return Number(rows[0].count) > 0;
};

const columnExists = async (tableName, columnName) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Number(rows[0].count) > 0;
};

const renameColumnIfNeeded = async (tableName, oldName, newName, definition) => {
  const hasOld = await columnExists(tableName, oldName);
  const hasNew = await columnExists(tableName, newName);
  if (hasOld && !hasNew) {
    await db.query(`ALTER TABLE \`${tableName}\` CHANGE COLUMN \`${oldName}\` \`${newName}\` ${definition}`);
    return;
  }
  if (hasOld && hasNew) {
    await db.query(
      `UPDATE \`${tableName}\`
          SET \`${newName}\` = COALESCE(NULLIF(\`${newName}\`, ''), \`${oldName}\`)
        WHERE \`${oldName}\` IS NOT NULL`
    );
    await db.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${oldName}\``);
  }
};

const ensureUniqueIndexIfClean = async (tableName, indexName, columnName) => {
  const [duplicateRows] = await db.query(
    `SELECT \`${columnName}\`, COUNT(*) AS count
       FROM \`${tableName}\`
      WHERE \`${columnName}\` IS NOT NULL AND TRIM(\`${columnName}\`) != ''
      GROUP BY LOWER(TRIM(\`${columnName}\`))
     HAVING COUNT(*) > 1
      LIMIT 1`
  );
  if (duplicateRows.length) {
    console.warn(`Skipped unique index ${indexName}; clean duplicate ${tableName}.${columnName} values first.`);
    return;
  }
  await ensureUniqueIndex(tableName, indexName, columnName);
};

const ensureForeignKeyForColumn = async (
  tableName,
  columnName,
  constraintName,
  definition
) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [tableName, columnName]
  );
  if (Number(rows[0].count) === 0) {
    await db.query(
      `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` ${definition}`
    );
  }
};

export const ensurePayoutGridSchema = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS payout_grid_rows (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      company VARCHAR(255) NOT NULL,
      payout_month CHAR(7) NOT NULL,
      business_type VARCHAR(100) DEFAULT NULL,
      category VARCHAR(100) DEFAULT NULL,
      classification VARCHAR(150) DEFAULT NULL,
      product_type VARCHAR(150) DEFAULT NULL,
      rto VARCHAR(255) DEFAULT NULL,
      od_comm DECIMAL(10,4) DEFAULT NULL,
      tp_comm DECIMAL(10,4) DEFAULT NULL,
      net_comm DECIMAL(10,4) DEFAULT NULL,
      cc VARCHAR(255) DEFAULT NULL,
      fuel_type VARCHAR(255) DEFAULT NULL,
      make TEXT DEFAULT NULL,
      decline_make TEXT DEFAULT NULL,
      model TEXT DEFAULT NULL,
      decline_model TEXT DEFAULT NULL,
      ncb VARCHAR(255) DEFAULT NULL,
      seat VARCHAR(255) DEFAULT NULL,
      gvw VARCHAR(255) DEFAULT NULL,
      source_file_name VARCHAR(255) DEFAULT NULL,
      source_row_number INT UNSIGNED DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY payout_grid_company_month (company, payout_month),
      KEY payout_grid_category_classification (category, classification),
      KEY payout_grid_created_by (created_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

const ensureSetCountSchema = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS set_count (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      pos_id INT UNSIGNED DEFAULT NULL,
      ref_id INT UNSIGNED DEFAULT NULL,
      business_type VARCHAR(100) DEFAULT NULL,
      insurance_company VARCHAR(255) DEFAULT NULL,
      categories VARCHAR(100) DEFAULT NULL,
      insured_name VARCHAR(255) DEFAULT NULL,
      contact VARCHAR(30) DEFAULT NULL,
      email VARCHAR(150) DEFAULT NULL,
      first_year_od DECIMAL(15,2) DEFAULT 0.00,
      first_year_tp DECIMAL(15,2) DEFAULT 0.00,
      total_od DECIMAL(15,2) DEFAULT 0.00,
      total_tp DECIMAL(15,2) DEFAULT 0.00,
      irda_od DECIMAL(10,2) DEFAULT 0.00,
      irda_tp DECIMAL(10,2) DEFAULT 0.00,
      irda_net DECIMAL(10,2) DEFAULT 0.00,
      pos_od DECIMAL(10,2) DEFAULT 0.00,
      pos_tp DECIMAL(10,2) DEFAULT 0.00,
      pos_net DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY set_count_pos_id (pos_id),
      KEY set_count_ref_id (ref_id),
      KEY set_count_categories (categories)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (await tableExists("set_count")) {
    await renameColumnIfNeeded("set_count", "vehicle_category", "categories", "VARCHAR(100) DEFAULT NULL");
  }
};

export const ensureCancelledPolicySchema = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS policies_cancelled (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      policy_id INT(11) NOT NULL,
      policy_number VARCHAR(100) NOT NULL,
      cancellation_date DATE NOT NULL,
      cancellation_reason TEXT DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY policies_cancelled_policy_id (policy_id),
      KEY policies_cancelled_policy_number (policy_number),
      KEY policies_cancelled_date (cancellation_date),
      KEY policies_cancelled_created_by (created_by),
      CONSTRAINT policies_cancelled_policy_fk
        FOREIGN KEY (policy_id) REFERENCES policies_motor (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT policies_cancelled_created_by_fk
        FOREIGN KEY (created_by) REFERENCES employees (id)
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const ensureAccountSchema = async () => {
  await ensureSetCountSchema();

  await ensureColumn(
    'account_details',
    'updated_by',
    'INT UNSIGNED DEFAULT NULL AFTER `account_type`'
  );
  await db.query(`
    UPDATE account_details
       SET updated_by = COALESCE(
         employee_id,
         (SELECT id FROM employees ORDER BY id LIMIT 1)
       )
     WHERE updated_by IS NULL
  `);
  const [missingAccountUpdaterRows] = await db.query(
    'SELECT COUNT(*) AS count FROM account_details WHERE updated_by IS NULL'
  );
  if (Number(missingAccountUpdaterRows[0].count) === 0) {
    await db.query(
      'ALTER TABLE account_details MODIFY COLUMN updated_by INT UNSIGNED NOT NULL'
    );
  }
  await ensureForeignKeyForColumn(
    'account_details',
    'updated_by',
    'fk_account_updated_by',
    'FOREIGN KEY (`updated_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE'
  );

  await ensureColumn('insurance_company', 'status', "ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER `type`");
  await ensureColumn('insurance_branch', 'status', "ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER `email`");
  await ensureUniqueIndexIfClean('insurance_company', 'insurance_company_insurer_unique', 'insurer');
  await db.query(`
    CREATE TABLE IF NOT EXISTS insurer_statement_rows (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      policy_number VARCHAR(150) NOT NULL,
      insurance_company VARCHAR(255) DEFAULT NULL,
      insured_name VARCHAR(150) DEFAULT NULL,
      issue_date DATE DEFAULT NULL,
      total_od DECIMAL(15,2) DEFAULT NULL,
      total_tp DECIMAL(15,2) DEFAULT NULL,
      net_premium DECIMAL(15,2) DEFAULT NULL,
      irda_od DECIMAL(10,2) DEFAULT NULL,
      irda_tp DECIMAL(10,2) DEFAULT NULL,
      irda_net DECIMAL(10,2) DEFAULT NULL,
      remark TEXT DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY insurer_statement_policy_number (policy_number),
      KEY insurer_statement_issue_date (issue_date),
      KEY insurer_statement_created_by (created_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await dropIndexIfExists('insurer_statement_rows', 'insurer_statement_period_policy');
  await dropIndexIfExists('insurer_statement_rows', 'insurer_statement_period');
  await dropIndexIfExists('insurer_statement_rows', 'insurer_statement_policy');
  await dropColumnIfExists('insurer_statement_rows', 'insurer_branch');
  await dropColumnIfExists('insurer_statement_rows', 'gst');
  await dropColumnIfExists('insurer_statement_rows', 'total_payable');
  await ensureColumn(
    'insurer_statement_rows',
    'insurance_company',
    "VARCHAR(255) DEFAULT NULL AFTER `policy_number`"
  );
  await db.query(`
    UPDATE insurer_statement_rows statement_row
    INNER JOIN policies_motor policy
      ON statement_row.policy_number = policy.policy_number
    SET statement_row.insurance_company = policy.insurance_company
    WHERE policy.insurance_company IS NOT NULL
      AND policy.insurance_company != ''
  `);
  await ensureColumn('insurer_statement_rows', 'remark', "TEXT DEFAULT NULL AFTER `irda_net`");
  await dropColumnIfExists('insurer_statement_rows', 'statement_year');
  await dropColumnIfExists('insurer_statement_rows', 'statement_month');
  await dropColumnIfExists('insurer_statement_rows', 'import_batch_id');
  await dropColumnIfExists('insurer_statement_rows', 'source_file_name');
  await dropColumnIfExists('insurer_statement_rows', 'source_row_number');
  await dropColumnIfExists('insurer_statement_rows', 'row_number');
  await dropColumnIfExists('insurer_statement_rows', 'normalized_policy_number');
  await dropColumnIfExists('insurer_statement_rows', 'raw_data');
  await db.query(`
    ALTER TABLE insurer_statement_rows
      MODIFY COLUMN irda_od DECIMAL(10,2) DEFAULT NULL,
      MODIFY COLUMN irda_tp DECIMAL(10,2) DEFAULT NULL,
      MODIFY COLUMN irda_net DECIMAL(10,2) DEFAULT NULL
  `);
  await db.query(
    `DELETE older
     FROM insurer_statement_rows older
     INNER JOIN insurer_statement_rows newer
       ON older.policy_number = newer.policy_number
      AND older.id < newer.id`
  );
  await ensureUniqueIndex(
    'insurer_statement_rows',
    'insurer_statement_policy_number',
    'policy_number'
  );
  await ensurePayoutGridSchema();
  await ensureCancelledPolicySchema();
};
