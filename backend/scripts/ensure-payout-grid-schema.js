import db from "../config/database.js";
import { ensurePayoutGridSchema } from "../models/accounts/accountSchema.model.js";

try {
  await ensurePayoutGridSchema();

  const [tables] = await db.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    ["payout_grid_rows"],
  );
  const [columns] = await db.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`,
    ["payout_grid_rows"],
  );

  if (!tables.length) {
    throw new Error("payout_grid_rows was not created");
  }

  console.log(`Payout-grid schema is ready: ${columns.length} columns.`);
  console.table(columns);
} finally {
  await db.end();
}
