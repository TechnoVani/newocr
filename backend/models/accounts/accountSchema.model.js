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

export const ensureAccountSchema = async () => {
  await ensureColumn('insurance_company', 'status', "ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER `type`");
  await ensureColumn('insurance_branch', 'status', "ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER `email`");
};
