import db from "../../config/database.js";
import { policyOwnershipFilter } from "../../utils/dataScope.js";

const number = value => Number(value) || 0;

export const AccountsDashboardModel = {
  async get(readScope) {
    const ownership = policyOwnershipFilter(readScope, "p.created_by");
    const currentMonthStart = "DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')";
    const nextMonthStart = "DATE_FORMAT(CURRENT_DATE() + INTERVAL 1 MONTH, '%Y-%m-01')";

    const [
      [masterRows],
      [posRows],
      [policyRows],
      [trendRows],
      [insurerRows],
      [recentPolicies],
      [recentCancellations],
      [payoutRows],
    ] = await Promise.all([
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM insurance_company) AS insurer_total,
          (SELECT COUNT(*) FROM insurance_company WHERE status = 'Active') AS insurer_active,
          (SELECT COUNT(*) FROM insurance_branch) AS branch_total,
          (SELECT COUNT(*) FROM insurance_branch WHERE status = 'Active') AS branch_active,
          (SELECT COUNT(*) FROM employee_pos) AS pos_total,
          (SELECT COUNT(*) FROM employee_pos WHERE status = 'Active') AS pos_active,
          (SELECT COUNT(DISTINCT state) FROM insurance_branch
            WHERE status = 'Active' AND state IS NOT NULL AND state != '') AS states_covered
      `),
      db.query(`
        SELECT
          p.pos_id,
          COALESCE(NULLIF(TRIM(pos.name), ''), 'Unassigned POS') AS pos_name,
          COALESCE(NULLIF(TRIM(pos.pos_code), ''), CAST(p.pos_id AS CHAR), 'Unassigned') AS pos_code,
          COUNT(*) AS policies,
          SUM(CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END) AS cancelled,
          COALESCE(SUM(p.net_premium), 0) AS net_premium,
          SUM(CASE WHEN p.verify_remark IS NOT NULL AND TRIM(p.verify_remark) != '' THEN 1 ELSE 0 END) AS verified
        FROM policies_motor p
        LEFT JOIN employee_pos pos ON pos.id = p.pos_id
        LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
        WHERE ${ownership.sql}
          AND p.issue_date >= ${currentMonthStart}
          AND p.issue_date < ${nextMonthStart}
        GROUP BY p.pos_id, pos.name, pos.pos_code
        ORDER BY net_premium DESC, policies DESC
        LIMIT 5
      `, ownership.params),
      db.query(`
        SELECT
          COUNT(*) AS policy_total,
          COALESCE(SUM(CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END), 0) AS cancelled_total,
          COALESCE(SUM(CASE WHEN pc.id IS NOT NULL
            AND pc.created_at >= ${currentMonthStart}
            AND pc.created_at < ${nextMonthStart}
            THEN 1 ELSE 0 END), 0) AS month_cancelled,
          COALESCE(SUM(p.issue_date >= ${currentMonthStart}
            AND p.issue_date < ${nextMonthStart}), 0) AS month_policies,
          COALESCE(SUM(p.issue_date >= ${currentMonthStart}
            AND p.issue_date < ${nextMonthStart} AND
            (p.verify_remark IS NULL OR TRIM(p.verify_remark) = '')), 0) AS pending_verification,
          COALESCE(SUM(p.issue_date >= ${currentMonthStart}
            AND p.issue_date < ${nextMonthStart} AND
            LOWER(COALESCE(p.payment_status, 'pending')) NOT IN ('paid', 'completed')), 0) AS pending_payment,
          COALESCE(SUM(CASE WHEN p.issue_date >= ${currentMonthStart}
            AND p.issue_date < ${nextMonthStart} THEN p.net_premium ELSE 0 END), 0) AS month_net_premium,
          COALESCE(SUM(CASE WHEN p.issue_date >= ${currentMonthStart}
            AND p.issue_date < ${nextMonthStart} THEN p.total_payable ELSE 0 END), 0) AS month_gross_premium,
          COALESCE(SUM(CASE WHEN pc.id IS NOT NULL
            AND pc.created_at >= ${currentMonthStart}
            AND pc.created_at < ${nextMonthStart}
            THEN p.net_premium ELSE 0 END), 0) AS month_cancelled_net_premium,
          COALESCE(SUM(CASE WHEN pc.id IS NOT NULL
            AND pc.created_at >= ${currentMonthStart}
            AND pc.created_at < ${nextMonthStart}
            THEN p.total_payable ELSE 0 END), 0) AS month_cancelled_gross_premium
        FROM policies_motor p
        LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
        WHERE ${ownership.sql}
      `, ownership.params),
      db.query(`
        SELECT
          DATE_FORMAT(p.issue_date, '%Y-%m') AS period,
          DATE_FORMAT(p.issue_date, '%b') AS label,
          COUNT(*) AS policies,
          SUM(CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END) AS cancelled,
          COALESCE(SUM(p.net_premium), 0) AS net_premium,
          COALESCE(SUM(p.total_payable), 0) AS gross_premium
        FROM policies_motor p
        LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
        WHERE ${ownership.sql}
          AND p.issue_date >= DATE_FORMAT(CURRENT_DATE() - INTERVAL 5 MONTH, '%Y-%m-01')
          AND p.issue_date < ${nextMonthStart}
        GROUP BY DATE_FORMAT(p.issue_date, '%Y-%m'), DATE_FORMAT(p.issue_date, '%b')
        ORDER BY period
      `, ownership.params),
      db.query(`
        SELECT
          COALESCE(NULLIF(TRIM(p.insurance_company), ''), 'Unassigned') AS insurer,
          COUNT(*) AS policies,
          SUM(CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END) AS cancelled,
          COALESCE(SUM(p.net_premium), 0) AS net_premium,
          COALESCE(SUM(p.total_payable), 0) AS gross_premium
        FROM policies_motor p
        LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
        WHERE ${ownership.sql}
          AND p.issue_date >= ${currentMonthStart}
          AND p.issue_date < ${nextMonthStart}
        GROUP BY COALESCE(NULLIF(TRIM(p.insurance_company), ''), 'Unassigned')
        ORDER BY net_premium DESC, policies DESC
        LIMIT 5
      `, ownership.params),
      db.query(`
        SELECT
          p.id, p.policy_number, p.insured_name, p.insurance_company,
          p.product_type, p.issue_date, p.net_premium, p.total_payable,
          'Active' AS policy_status,
          pc.cancellation_date,
          pc.created_at AS cancellation_record_created_at,
          pc.cancellation_reason,
          CASE WHEN p.verify_remark IS NULL OR TRIM(p.verify_remark) = ''
            THEN 'Pending' ELSE 'Verified' END AS verification_status,
          COALESCE(NULLIF(TRIM(p.payment_status), ''), 'Pending') AS payment_status
        FROM policies_motor p
        LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
        WHERE ${ownership.sql}
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT 7
      `, ownership.params),
      db.query(`
        SELECT
          pc.id, p.policy_number, p.insured_name, p.insurance_company,
          p.product_type, p.issue_date, p.net_premium, p.total_payable,
          'Cancelled' AS policy_status,
          pc.cancellation_date,
          pc.created_at AS cancellation_record_created_at,
          pc.cancellation_reason
        FROM policies_cancelled pc
        INNER JOIN policies_motor p ON pc.policy_id = p.id
        WHERE ${ownership.sql}
        ORDER BY pc.created_at DESC, pc.id DESC
        LIMIT 7
      `, ownership.params),
      db.query(`
        SELECT
          COUNT(DISTINCT CONCAT(company, '|', payout_month)) AS batches,
          COUNT(*) AS rules,
          MAX(payout_month) AS latest_month,
          COUNT(DISTINCT company) AS companies
        FROM payout_grid_rows
      `),
    ]);

    const masters = masterRows[0] || {};
    const policies = policyRows[0] || {};
    const payout = payoutRows[0] || {};
    const now = new Date();
    const recentActivity = [
      ...recentPolicies.map(row => ({
        ...row,
        report_row_id: `policy-${row.id}`,
        activity_date: row.issue_date,
      })),
      ...recentCancellations.map(row => ({
        ...row,
        report_row_id: `cancelled-${row.id}`,
        activity_date: row.cancellation_record_created_at,
      })),
    ].sort((left, right) =>
      new Date(right.activity_date || 0).getTime() - new Date(left.activity_date || 0).getTime()
    ).slice(0, 7);

    return {
      period: {
        key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        label: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(now),
      },
      masters: {
        insurers: { total: number(masters.insurer_total), active: number(masters.insurer_active) },
        branches: { total: number(masters.branch_total), active: number(masters.branch_active) },
        pos: { total: number(masters.pos_total), active: number(masters.pos_active) },
        states_covered: number(masters.states_covered),
      },
      policies: {
        total: number(policies.policy_total),
        current_month: number(policies.month_policies),
        pending_verification: number(policies.pending_verification),
        pending_payment: number(policies.pending_payment),
        cancelled: number(policies.cancelled_total),
        cancelled_current_month: number(policies.month_cancelled),
        cancelled_net_premium: -Math.abs(number(policies.month_cancelled_net_premium)),
        cancelled_gross_premium: -Math.abs(number(policies.month_cancelled_gross_premium)),
        net_premium: number(policies.month_net_premium) - number(policies.month_cancelled_net_premium),
        gross_premium: number(policies.month_gross_premium) - number(policies.month_cancelled_gross_premium),
      },
      trend: trendRows.map(row => ({
        period: row.period,
        label: row.label,
        policies: number(row.policies),
        cancelled: number(row.cancelled),
        net_premium: number(row.net_premium),
        gross_premium: number(row.gross_premium),
      })),
      top_insurers: insurerRows.map(row => ({
        insurer: row.insurer,
        policies: number(row.policies),
        cancelled: number(row.cancelled),
        net_premium: number(row.net_premium),
        gross_premium: number(row.gross_premium),
      })),
      top_pos: posRows.map(row => ({
        pos_id: row.pos_id,
        pos_name: row.pos_name,
        pos_code: row.pos_code,
        policies: number(row.policies),
        cancelled: number(row.cancelled),
        net_premium: number(row.net_premium),
        verified: number(row.verified),
      })),
      recent_policies: recentActivity,
      payout_grid: {
        batches: number(payout.batches),
        rules: number(payout.rules),
        companies: number(payout.companies),
        latest_month: payout.latest_month || null,
      },
      visibility: ownership.scope.all ? "all" : "self",
    };
  },
};
