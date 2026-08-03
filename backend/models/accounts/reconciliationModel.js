import db from "../../config/database.js";

export const INSURER_STATEMENT_UPSERT_QUERY = `
  INSERT INTO insurer_statement_rows (
    policy_number,
    insurance_company,
    insured_name,
    issue_date,
    total_od,
    total_tp,
    net_premium,
    irda_od,
    irda_tp,
    irda_net,
    remark,
    created_by
  )
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  ON DUPLICATE KEY UPDATE
    insurance_company = COALESCE(
      NULLIF(VALUES(insurance_company), ''),
      insurance_company
    ),
    insured_name = VALUES(insured_name),
    issue_date = VALUES(issue_date),
    total_od = VALUES(total_od),
    total_tp = VALUES(total_tp),
    net_premium = VALUES(net_premium),
    irda_od = VALUES(irda_od),
    irda_tp = VALUES(irda_tp),
    irda_net = VALUES(irda_net),
    remark = VALUES(remark),
    created_by = VALUES(created_by),
    updated_at = CURRENT_TIMESTAMP
`;

export const ReconciliationModel = {
  async upsertRows(rows) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      for (const row of rows) {
        await connection.query(INSURER_STATEMENT_UPSERT_QUERY, [
          row.policy_number,
          row.insurance_company,
          row.insured_name,
          row.issue_date,
          row.total_od,
          row.total_tp,
          row.net_premium,
          row.irda_od,
          row.irda_tp,
          row.irda_net,
          row.remark,
          row.created_by,
        ]);
      }

      await connection.commit();
      return rows.length;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async findAllStatementRows() {
    const [rows] = await db.query(
      `SELECT *
       FROM insurer_statement_rows
       ORDER BY updated_at DESC, id DESC`,
    );
    return rows;
  },

  async findPoliciesForMonth(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT p.*,
         CASE WHEN pc.id IS NULL THEN 0 ELSE 1 END AS is_cancelled,
         'Active' AS policy_status,
         pc.cancellation_date,
         pc.cancellation_reason
       FROM policies_motor p
       LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
       WHERE p.issue_date >= ? AND p.issue_date < ?
       ORDER BY p.issue_date ASC, p.id ASC`,
      [startDate, endDate],
    );
    return rows;
  },

  async findAllPolicies() {
    const [rows] = await db.query(
      `SELECT p.*,
         CASE WHEN pc.id IS NULL THEN 0 ELSE 1 END AS is_cancelled,
         'Active' AS policy_status,
         pc.cancellation_date,
         pc.cancellation_reason
       FROM policies_motor p
       LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
       ORDER BY p.issue_date ASC, p.id ASC`,
    );
    return rows;
  },

  async findAllPolicyNumbers() {
    const [rows] = await db.query(
      "SELECT policy_number FROM policies_motor WHERE policy_number IS NOT NULL AND policy_number != ''",
    );
    return rows.map((row) => row.policy_number);
  },

  async findAllInsuranceCompanies() {
    const [rows] = await db.query(
      `SELECT insurance_company
       FROM policies_motor
       WHERE insurance_company IS NOT NULL AND insurance_company != ''
       GROUP BY insurance_company
       ORDER BY insurance_company`,
    );
    return rows.map((row) => row.insurance_company);
  },

  async findPolicyCompanies(policyNumbers) {
    if (!policyNumbers.length) return [];
    const [rows] = await db.query(
      `SELECT policy_number, insurance_company
       FROM policies_motor
       WHERE policy_number IN (?)
         AND insurance_company IS NOT NULL
         AND insurance_company != ''`,
      [policyNumbers],
    );
    return rows;
  },
};
