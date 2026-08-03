import db from "../../config/database.js";

const INSERT_QUERY = `
  INSERT INTO payout_grid_rows (
    company, payout_month, business_type, category, classification,
    product_type, rto, od_comm, tp_comm, net_comm, cc, fuel_type,
    make, decline_make, model, decline_model, ncb, seat, gvw,
    source_file_name, source_row_number, created_by
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`;

export const PayoutGridModel = {
  async replaceBatch({ company, month, rows }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [removed] = await connection.query(
        "DELETE FROM payout_grid_rows WHERE company = ? AND payout_month = ?",
        [company, month],
      );

      for (const row of rows) {
        await connection.query(INSERT_QUERY, [
          company,
          month,
          row.business_type,
          row.category,
          row.classification,
          row.product_type,
          row.rto,
          row.od_comm,
          row.tp_comm,
          row.net_comm,
          row.cc,
          row.fuel_type,
          row.make,
          row.decline_make,
          row.model,
          row.decline_model,
          row.ncb,
          row.seat,
          row.gvw,
          row.source_file_name,
          row.source_row_number,
          row.created_by,
        ]);
      }

      await connection.commit();
      return { inserted: rows.length, replaced: removed.affectedRows };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async findRows({ company, month, businessType, category, classification }) {
    const conditions = [];
    const params = [];
    const addExact = (column, value) => {
      if (!value) return;
      conditions.push(`LOWER(TRIM(${column})) = LOWER(TRIM(?))`);
      params.push(value);
    };

    addExact("company", company);
    addExact("payout_month", month);
    if (businessType) {
      conditions.push("(business_type IS NULL OR TRIM(business_type) = '' OR LOWER(TRIM(business_type)) IN ('all', 'any') OR LOWER(TRIM(business_type)) = LOWER(TRIM(?)))");
      params.push(businessType);
    }

    if (category) {
      conditions.push("(category IS NULL OR TRIM(category) = '' OR LOWER(TRIM(category)) IN ('all', 'any') OR LOWER(TRIM(category)) = LOWER(TRIM(?)))");
      params.push(category);
    }
    if (classification) {
      conditions.push("(classification IS NULL OR TRIM(classification) = '' OR LOWER(TRIM(classification)) IN ('all', 'any') OR LOWER(TRIM(classification)) = LOWER(TRIM(?)))");
      params.push(classification);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db.query(
      `SELECT *
       FROM payout_grid_rows
       ${where}
       ORDER BY payout_month DESC, company ASC, business_type ASC, id ASC
       LIMIT 10000`,
      params,
    );
    return rows;
  },

  async getOptions() {
    const [rows] = await db.query(`
      SELECT company, payout_month, business_type, category, classification
      FROM payout_grid_rows
      ORDER BY payout_month DESC, company ASC
    `);
    const unique = (key) => [...new Set(rows.map((row) => row[key]).filter(Boolean))];
    return {
      companies: unique("company"),
      months: unique("payout_month"),
      businessTypes: unique("business_type"),
      categories: unique("category"),
      classifications: unique("classification"),
    };
  },

  async getBatches() {
    const [rows] = await db.query(`
      SELECT
        company,
        payout_month AS month,
        COUNT(*) AS row_count,
        MAX(source_file_name) AS source_file_name,
        MAX(updated_at) AS uploaded_at,
        MAX(created_by) AS created_by
      FROM payout_grid_rows
      GROUP BY company, payout_month
      ORDER BY payout_month DESC, uploaded_at DESC, company ASC
      LIMIT 250
    `);
    return rows;
  },
};
