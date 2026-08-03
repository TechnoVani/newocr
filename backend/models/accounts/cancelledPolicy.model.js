import db from "../../config/database.js";
import { POLICY_REPORT_JOINS, POLICY_REPORT_SELECT } from "../../utils/policyReportQuery.js";
import { policyOwnershipFilter } from "../../utils/dataScope.js";

const getMonthRange = (year, month) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  if (!Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2100) {
    const error = new Error("Year must be between 2000 and 2100");
    error.statusCode = 400;
    throw error;
  }
  if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
    const error = new Error("Month must be between 1 and 12");
    error.statusCode = 400;
    throw error;
  }

  const pad = value => String(value).padStart(2, "0");
  const startDate = `${numericYear}-${pad(numericMonth)}-01`;
  const nextYear = numericMonth === 12 ? numericYear + 1 : numericYear;
  const nextMonth = numericMonth === 12 ? 1 : numericMonth + 1;
  const endDate = `${nextYear}-${pad(nextMonth)}-01`;

  return { numericYear, numericMonth, startDate, endDate };
};

export const CancelledPolicyModel = {
  async findPolicyByNumber(policyNumber, readScope) {
    const ownership = policyOwnershipFilter(readScope, "created_by");
    const [rows] = await db.query(
      `
      SELECT *
      FROM policies_motor
      WHERE UPPER(TRIM(policy_number)) = UPPER(TRIM(?))
        AND ${ownership.sql}
      LIMIT 1
      `,
      [policyNumber, ...ownership.params]
    );
    return rows[0] || null;
  },

  async upsert(data) {
    const [result] = await db.query(
      `
      INSERT INTO policies_cancelled (
        policy_id,
        policy_number,
        cancellation_date,
        cancellation_reason,
        created_by
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        policy_number = VALUES(policy_number),
        cancellation_date = VALUES(cancellation_date),
        cancellation_reason = VALUES(cancellation_reason),
        created_by = VALUES(created_by)
      `,
      [
        data.policy_id,
        data.policy_number,
        data.cancellation_date,
        data.cancellation_reason,
        data.created_by
      ]
    );
    return result.insertId || data.policy_id;
  },

  async getReport({ year, month, readScope }) {
    const range = getMonthRange(year, month);
    const ownership = policyOwnershipFilter(readScope, "p.created_by");
    const [rows] = await db.query(
      `
      SELECT
        pc.id AS cancellation_id,
        pc.cancellation_date,
        pc.cancellation_reason,
        pc.created_at AS cancellation_created_at,
        COALESCE(
          NULLIF(CONCAT_WS(' - ', NULLIF(cancel_creator.name, ''), NULLIF(cancel_creator.employee_code, '')), ''),
          CAST(pc.created_by AS CHAR)
        ) AS cancellation_created_by_display,
        ${POLICY_REPORT_SELECT}
      FROM policies_cancelled pc
      INNER JOIN policies_motor p ON pc.policy_id = p.id
      ${POLICY_REPORT_JOINS}
      LEFT JOIN employees cancel_creator ON pc.created_by = cancel_creator.id
      WHERE pc.created_at >= ? AND pc.created_at < ?
        AND ${ownership.sql}
      ORDER BY pc.created_at DESC, pc.id DESC
      `,
      [range.startDate, range.endDate, ...ownership.params]
    );

    return {
      period: {
        year: range.numericYear,
        month: range.numericMonth,
        startDate: range.startDate,
        endDate: range.endDate
      },
      count: rows.length,
      policies: rows.map(row => ({
        ...row,
        policy_status: "Cancelled",
        is_cancelled: 1
      }))
    };
  }
};
