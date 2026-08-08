import db from "../../config/database.js";
import { policyOwnershipFilter } from "../../utils/dataScope.js";

const number = value => Number(value) || 0;

export const PosWiseReportModel = {
  async get({ readScope, startDate, endDate, search = "", posId = null, referenceId = null }) {
    const ownership = policyOwnershipFilter(readScope, "p.created_by");
    const baseWhere = [
      ownership.sql,
      "p.issue_date >= ?",
      "p.issue_date < ?",
    ];
    const baseParams = [...ownership.params, startDate, endDate];
    const where = [...baseWhere];
    const params = [...baseParams];

    if (posId) {
      where.push("p.pos_id = ?");
      params.push(posId);
    }

    if (referenceId) {
      where.push("p.ref_id = ?");
      params.push(referenceId);
    }

    if (search) {
      where.push(`(
        CAST(p.pos_id AS CHAR) LIKE ? OR
        pos.name LIKE ? OR
        pos.pos_code LIKE ? OR
        pos.mobile LIKE ? OR
        pos.email LIKE ?
      )`);
      params.push(...Array(5).fill(`%${search}%`));
    }

    const [rows] = await db.query(`
      SELECT
        p.pos_id,
        COALESCE(NULLIF(TRIM(pos.name), ''), 'Unassigned POS') AS pos_name,
        COALESCE(NULLIF(TRIM(pos.pos_code), ''), CAST(p.pos_id AS CHAR), 'Unassigned') AS pos_code,
        COALESCE(NULLIF(TRIM(pos.mobile), ''), '—') AS mobile,
        COALESCE(NULLIF(TRIM(pos.email), ''), '—') AS email,
        COALESCE(pos.status, 'Unassigned') AS pos_status,
        COUNT(*) AS active_count,
        COUNT(*) AS policy_count,
        0 AS cancelled_count,
        COALESCE(SUM(p.total_od), 0) AS total_od,
        COALESCE(SUM(p.total_tp), 0) AS total_tp,
        COALESCE(SUM(p.net_premium), 0) AS net_premium,
        COALESCE(SUM(p.total_payable), 0) AS gross_premium,
        0 AS cancelled_net_premium,
        0 AS cancelled_gross_premium,
        COALESCE(SUM(
          COALESCE(p.total_od, 0) *
          COALESCE(CAST(NULLIF(REPLACE(p.pos_od, '%', ''), '') AS DECIMAL(10,4)), 0) / 100
        ), 0) AS od_income,
        COALESCE(SUM(
          COALESCE(p.total_tp, 0) *
          COALESCE(CAST(NULLIF(REPLACE(p.pos_tp, '%', ''), '') AS DECIMAL(10,4)), 0) / 100
        ), 0) AS tp_income,
        COALESCE(SUM(
          COALESCE(p.net_premium, 0) *
          COALESCE(CAST(NULLIF(REPLACE(p.pos_net, '%', ''), '') AS DECIMAL(10,4)), 0) / 100
        ), 0) AS net_income,
        SUM(CASE WHEN p.verify_remark IS NOT NULL AND TRIM(p.verify_remark) != '' THEN 1 ELSE 0 END) AS verified_count,
        SUM(CASE WHEN LOWER(COALESCE(p.payment_status, '')) IN ('paid', 'completed') THEN 1 ELSE 0 END) AS paid_count
      FROM policies_motor p
      LEFT JOIN employee_pos pos ON pos.id = p.pos_id
      WHERE ${where.join(" AND ")}
      GROUP BY
        p.pos_id, pos.name, pos.pos_code, pos.mobile, pos.email, pos.status
      ORDER BY net_premium DESC, policy_count DESC, pos_name ASC
    `, params);

    const cancellationWhere = [
      ownership.sql,
      "pc.created_at >= ?",
      "pc.created_at < ?",
    ];
    const cancellationParams = [...ownership.params, startDate, endDate];

    if (posId) {
      cancellationWhere.push("p.pos_id = ?");
      cancellationParams.push(posId);
    }

    if (referenceId) {
      cancellationWhere.push("p.ref_id = ?");
      cancellationParams.push(referenceId);
    }

    if (search) {
      cancellationWhere.push(`(
        CAST(p.pos_id AS CHAR) LIKE ? OR
        pos.name LIKE ? OR
        pos.pos_code LIKE ? OR
        pos.mobile LIKE ? OR
        pos.email LIKE ?
      )`);
      cancellationParams.push(...Array(5).fill(`%${search}%`));
    }

    const [cancellationRows] = await db.query(`
      SELECT
        p.pos_id,
        COALESCE(NULLIF(TRIM(pos.name), ''), 'Unassigned POS') AS pos_name,
        COALESCE(NULLIF(TRIM(pos.pos_code), ''), CAST(p.pos_id AS CHAR), 'Unassigned') AS pos_code,
        COALESCE(NULLIF(TRIM(pos.mobile), ''), '—') AS mobile,
        COALESCE(NULLIF(TRIM(pos.email), ''), '—') AS email,
        COALESCE(pos.status, 'Unassigned') AS pos_status,
        COUNT(*) AS cancelled_count,
        COALESCE(SUM(p.total_od), 0) AS cancelled_total_od,
        COALESCE(SUM(p.total_tp), 0) AS cancelled_total_tp,
        COALESCE(SUM(p.net_premium), 0) AS cancelled_net_premium,
        COALESCE(SUM(p.total_payable), 0) AS cancelled_gross_premium,
        COALESCE(SUM(
          COALESCE(p.total_od, 0) *
          COALESCE(CAST(NULLIF(REPLACE(p.pos_od, '%', ''), '') AS DECIMAL(10,4)), 0) / 100
        ), 0) AS cancelled_od_income,
        COALESCE(SUM(
          COALESCE(p.total_tp, 0) *
          COALESCE(CAST(NULLIF(REPLACE(p.pos_tp, '%', ''), '') AS DECIMAL(10,4)), 0) / 100
        ), 0) AS cancelled_tp_income,
        COALESCE(SUM(
          COALESCE(p.net_premium, 0) *
          COALESCE(CAST(NULLIF(REPLACE(p.pos_net, '%', ''), '') AS DECIMAL(10,4)), 0) / 100
        ), 0) AS cancelled_net_income
      FROM policies_cancelled pc
      INNER JOIN policies_motor p ON pc.policy_id = p.id
      LEFT JOIN employee_pos pos ON pos.id = p.pos_id
      WHERE ${cancellationWhere.join(" AND ")}
      GROUP BY
        p.pos_id, pos.name, pos.pos_code, pos.mobile, pos.email, pos.status
      ORDER BY cancelled_count DESC, pos_name ASC
    `, cancellationParams);

    const [optionRows] = await db.query(`
      SELECT DISTINCT
        p.pos_id,
        COALESCE(NULLIF(TRIM(pos.name), ''), 'Unassigned POS') AS pos_name,
        COALESCE(NULLIF(TRIM(pos.pos_code), ''), CAST(p.pos_id AS CHAR), 'Unassigned') AS pos_code,
        p.ref_id,
        COALESCE(NULLIF(TRIM(reference.ref_name), ''), CAST(p.ref_id AS CHAR)) AS reference_name,
        COALESCE(NULLIF(TRIM(reference.ref_mobile), ''), '') AS reference_mobile
      FROM policies_motor p
      LEFT JOIN employee_pos pos ON pos.id = p.pos_id
      LEFT JOIN employee_references reference ON reference.id = p.ref_id
      WHERE ${baseWhere.join(" AND ")}
      ORDER BY pos_name ASC, reference_name ASC
    `, baseParams);

    const [policyDetailRows] = await db.query(`
      SELECT
        CONCAT('active-', p.id) AS report_row_id,
        p.id,
        p.pos_id,
        p.ref_id,
        p.policy_number,
        p.business_type,
        p.insured_name,
        p.insurance_company,
        p.insurer_branch,
        p.product_type,
        p.categories,
        p.classification,
        p.idv,
        p.make_name,
        p.model_name,
        p.variant_name,
        p.registration_number,
        p.rto,
        p.manufacturing_year,
        p.chassis_number,
        p.engine_number,
        p.fuel,
        p.gvw,
        p.cc,
        p.seating_capacity,
        p.issue_date,
        p.start_date,
        p.od_expiry,
        p.tp_expiry,
        p.first_year_od,
        p.first_year_tp,
        p.total_od,
        p.total_tp,
        p.net_premium,
        p.gst,
        p.total_payable,
        p.pos_od,
        p.pos_tp,
        p.pos_net,
        p.verify_remark,
        p.payment_status,
        p.issue_date AS report_date,
        'motor' AS policy_source,
        'Active' AS policy_status,
        NULL AS cancellation_date,
        NULL AS cancellation_record_created_at,
        NULL AS cancellation_reason,
        COALESCE(
          NULLIF(CONCAT_WS(' - ', NULLIF(reference.ref_name, ''), NULLIF(reference.ref_mobile, '')), ''),
          CAST(p.ref_id AS CHAR),
          '—'
        ) AS reference_display
      FROM policies_motor p
      LEFT JOIN employee_pos pos ON pos.id = p.pos_id
      LEFT JOIN employee_references reference ON reference.id = p.ref_id
      WHERE ${where.join(" AND ")}
      ORDER BY p.issue_date DESC, p.policy_number ASC
    `, params);

    const [cancelledPolicyDetailRows] = await db.query(`
      SELECT
        CONCAT('cancelled-', pc.id) AS report_row_id,
        p.id,
        p.pos_id,
        p.ref_id,
        p.policy_number,
        p.business_type,
        p.insured_name,
        p.insurance_company,
        p.insurer_branch,
        p.product_type,
        p.categories,
        p.classification,
        p.idv,
        p.make_name,
        p.model_name,
        p.variant_name,
        p.registration_number,
        p.rto,
        p.manufacturing_year,
        p.chassis_number,
        p.engine_number,
        p.fuel,
        p.gvw,
        p.cc,
        p.seating_capacity,
        p.issue_date,
        p.start_date,
        p.od_expiry,
        p.tp_expiry,
        -ABS(COALESCE(p.first_year_od, 0)) AS first_year_od,
        -ABS(COALESCE(p.first_year_tp, 0)) AS first_year_tp,
        -ABS(COALESCE(p.total_od, 0)) AS total_od,
        -ABS(COALESCE(p.total_tp, 0)) AS total_tp,
        -ABS(COALESCE(p.net_premium, 0)) AS net_premium,
        -ABS(COALESCE(p.gst, 0)) AS gst,
        -ABS(COALESCE(p.total_payable, 0)) AS total_payable,
        p.pos_od,
        p.pos_tp,
        p.pos_net,
        p.verify_remark,
        p.payment_status,
        pc.created_at AS report_date,
        'cancelled' AS policy_source,
        'Cancelled' AS policy_status,
        pc.cancellation_date,
        pc.created_at AS cancellation_record_created_at,
        pc.cancellation_reason,
        COALESCE(
          NULLIF(CONCAT_WS(' - ', NULLIF(reference.ref_name, ''), NULLIF(reference.ref_mobile, '')), ''),
          CAST(p.ref_id AS CHAR),
          '—'
        ) AS reference_display
      FROM policies_cancelled pc
      INNER JOIN policies_motor p ON pc.policy_id = p.id
      LEFT JOIN employee_pos pos ON pos.id = p.pos_id
      LEFT JOIN employee_references reference ON reference.id = p.ref_id
      WHERE ${cancellationWhere.join(" AND ")}
      ORDER BY pc.created_at DESC, p.policy_number ASC
    `, cancellationParams);

    const policyDetailsByPos = new Map();
    [...policyDetailRows, ...cancelledPolicyDetailRows].forEach(policy => {
      const key = String(policy.pos_id ?? "unassigned");
      const current = policyDetailsByPos.get(key) || [];
      current.push({
        ...policy,
        first_year_od: number(policy.first_year_od),
        first_year_tp: number(policy.first_year_tp),
        total_od: number(policy.total_od),
        total_tp: number(policy.total_tp),
        net_premium: number(policy.net_premium),
        gst: number(policy.gst),
        total_payable: number(policy.total_payable),
      });
      policyDetailsByPos.set(key, current);
    });

    const posOptions = [...new Map(
      optionRows
        .filter(row => row.pos_id)
        .map(row => [String(row.pos_id), {
          value: String(row.pos_id),
          label: `${row.pos_name} (${row.pos_code})`,
        }])
    ).values()];
    const referenceOptions = [...new Map(
      optionRows
        .filter(row => row.ref_id)
        .map(row => [String(row.ref_id), {
          value: String(row.ref_id),
          pos_id: String(row.pos_id),
          name: row.reference_name,
          mobile: row.reference_mobile,
          label: row.reference_mobile
            ? `${row.reference_name} (${row.reference_mobile})`
            : row.reference_name,
        }])
    ).values()];

    const rowMap = new Map(rows.map(row => [String(row.pos_id ?? "unassigned"), { ...row }]));
    cancellationRows.forEach(row => {
      const key = String(row.pos_id ?? "unassigned");
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          ...row,
          active_count: 0,
          policy_count: number(row.cancelled_count),
          total_od: -Math.abs(Number(row.cancelled_total_od) || 0),
          total_tp: -Math.abs(Number(row.cancelled_total_tp) || 0),
          net_premium: 0,
          gross_premium: 0,
          cancelled_net_premium: -Math.abs(Number(row.cancelled_net_premium) || 0),
          cancelled_gross_premium: -Math.abs(Number(row.cancelled_gross_premium) || 0),
          od_income: -Math.abs(Number(row.cancelled_od_income) || 0),
          tp_income: -Math.abs(Number(row.cancelled_tp_income) || 0),
          net_income: -Math.abs(Number(row.cancelled_net_income) || 0),
          verified_count: 0,
          paid_count: 0,
        });
        return;
      }
      const current = rowMap.get(key);
      current.policy_count = number(current.policy_count) + number(row.cancelled_count);
      current.cancelled_count = row.cancelled_count;
      current.total_od = number(current.total_od) - Math.abs(Number(row.cancelled_total_od) || 0);
      current.total_tp = number(current.total_tp) - Math.abs(Number(row.cancelled_total_tp) || 0);
      current.od_income = number(current.od_income) - Math.abs(Number(row.cancelled_od_income) || 0);
      current.tp_income = number(current.tp_income) - Math.abs(Number(row.cancelled_tp_income) || 0);
      current.net_income = number(current.net_income) - Math.abs(Number(row.cancelled_net_income) || 0);
      current.cancelled_net_premium = -Math.abs(Number(row.cancelled_net_premium) || 0);
      current.cancelled_gross_premium = -Math.abs(Number(row.cancelled_gross_premium) || 0);
    });

    const presentedRows = [...rowMap.values()].map(row => {
      const odIncome = number(row.od_income);
      const tpIncome = number(row.tp_income);
      const netIncome = number(row.net_income);
      const totalIncome = odIncome + tpIncome + netIncome;
      return {
        ...row,
        policy_details: policyDetailsByPos.get(String(row.pos_id ?? "unassigned")) || [],
        active_count: number(row.active_count),
        policy_count: number(row.policy_count),
        cancelled_count: number(row.cancelled_count),
        total_od: number(row.total_od),
        total_tp: number(row.total_tp),
        net_premium: number(row.net_premium) + number(row.cancelled_net_premium),
        gross_premium: number(row.gross_premium) + number(row.cancelled_gross_premium),
        cancelled_net_premium: number(row.cancelled_net_premium),
        cancelled_gross_premium: number(row.cancelled_gross_premium),
        od_income: odIncome,
        tp_income: tpIncome,
        net_income: netIncome,
        total_income: totalIncome,
        verified_count: number(row.verified_count),
        paid_count: number(row.paid_count),
      };
    }).sort((left, right) =>
      right.net_premium - left.net_premium ||
      right.cancelled_count - left.cancelled_count ||
      String(left.pos_name || "").localeCompare(String(right.pos_name || ""))
    );

    return {
      rows: presentedRows,
      filter_options: {
        pos: posOptions,
        references: referenceOptions,
      },
      summary: presentedRows.reduce((summary, row) => {
        summary.pos_count += 1;
        summary.policy_count += row.policy_count;
        summary.cancelled_count += row.cancelled_count;
        summary.total_od += row.total_od;
        summary.total_tp += row.total_tp;
        summary.net_premium += row.net_premium;
        summary.gross_premium += row.gross_premium;
        summary.cancelled_net_premium += row.cancelled_net_premium;
        summary.cancelled_gross_premium += row.cancelled_gross_premium;
        summary.od_income += row.od_income;
        summary.tp_income += row.tp_income;
        summary.net_income += row.net_income;
        summary.total_income += row.total_income;
        summary.verified_count += row.verified_count;
        summary.paid_count += row.paid_count;
        return summary;
      }, {
        pos_count: 0,
        policy_count: 0,
        cancelled_count: 0,
        total_od: 0,
        total_tp: 0,
        net_premium: 0,
        gross_premium: 0,
        cancelled_net_premium: 0,
        cancelled_gross_premium: 0,
        od_income: 0,
        tp_income: 0,
        net_income: 0,
        total_income: 0,
        verified_count: 0,
        paid_count: 0,
      }),
    };
  },

  async getPolicies({ readScope, startDate, endDate, posId }) {
    const ownership = policyOwnershipFilter(readScope, "p.created_by");
    const detailSelect = `
      p.id,
      p.pos_id,
      p.ref_id,
      p.policy_number,
      p.business_type,
      p.insured_name,
      p.insurance_company,
      p.insurer_branch,
      p.product_type,
      p.categories,
      p.classification,
      p.idv,
      p.make_name,
      p.model_name,
      p.variant_name,
      p.registration_number,
      p.rto,
      p.manufacturing_year,
      p.chassis_number,
      p.engine_number,
      p.fuel,
      p.gvw,
      p.cc,
      p.seating_capacity,
      p.issue_date,
      p.start_date,
      p.od_expiry,
      p.tp_expiry,
      p.first_year_od,
      p.first_year_tp,
      p.total_od,
      p.total_tp,
      p.net_premium,
      p.gst,
      p.total_payable,
      p.pos_od,
      p.pos_tp,
      p.pos_net,
      p.verify_remark,
      p.payment_status,
      COALESCE(
        NULLIF(CONCAT_WS(' - ', NULLIF(reference.ref_name, ''), NULLIF(reference.ref_mobile, '')), ''),
        CAST(p.ref_id AS CHAR),
        '—'
      ) AS reference_display
    `;

    const [posRows] = await db.query(`
      SELECT
        pos.id AS pos_id,
        COALESCE(NULLIF(TRIM(pos.name), ''), 'Unassigned POS') AS pos_name,
        COALESCE(NULLIF(TRIM(pos.pos_code), ''), CAST(pos.id AS CHAR)) AS pos_code,
        COALESCE(NULLIF(TRIM(pos.mobile), ''), '—') AS mobile,
        COALESCE(NULLIF(TRIM(pos.email), ''), '—') AS email,
        COALESCE(pos.status, 'Unassigned') AS pos_status
      FROM employee_pos pos
      WHERE pos.id = ?
      LIMIT 1
    `, [posId]);

    const [activeRows] = await db.query(`
      SELECT
        CONCAT('active-', p.id) AS report_row_id,
        ${detailSelect},
        p.issue_date AS report_date,
        'motor' AS policy_source,
        'Active' AS policy_status,
        NULL AS cancellation_date,
        NULL AS cancellation_record_created_at,
        NULL AS cancellation_reason
      FROM policies_motor p
      LEFT JOIN employee_references reference ON reference.id = p.ref_id
      WHERE ${ownership.sql}
        AND p.pos_id = ?
        AND p.issue_date >= ?
        AND p.issue_date < ?
      ORDER BY p.issue_date DESC, p.policy_number ASC
    `, [...ownership.params, posId, startDate, endDate]);

    const [cancelledRows] = await db.query(`
      SELECT
        CONCAT('cancelled-', pc.id) AS report_row_id,
        ${detailSelect},
        pc.created_at AS report_date,
        'cancelled' AS policy_source,
        'Cancelled' AS policy_status,
        pc.cancellation_date,
        pc.created_at AS cancellation_record_created_at,
        pc.cancellation_reason
      FROM policies_cancelled pc
      INNER JOIN policies_motor p ON p.id = pc.policy_id
      LEFT JOIN employee_references reference ON reference.id = p.ref_id
      WHERE ${ownership.sql}
        AND p.pos_id = ?
        AND pc.created_at >= ?
        AND pc.created_at < ?
      ORDER BY pc.created_at DESC, p.policy_number ASC
    `, [...ownership.params, posId, startDate, endDate]);

    const normalizePolicy = policy => {
      const isCancelled = String(policy.policy_status || "").toLowerCase() === "cancelled";
      const sign = isCancelled ? -1 : 1;
      return {
        ...policy,
        first_year_od: sign * Math.abs(number(policy.first_year_od)),
        first_year_tp: sign * Math.abs(number(policy.first_year_tp)),
        total_od: sign * Math.abs(number(policy.total_od)),
        total_tp: sign * Math.abs(number(policy.total_tp)),
        net_premium: sign * Math.abs(number(policy.net_premium)),
        gst: sign * Math.abs(number(policy.gst)),
        total_payable: sign * Math.abs(number(policy.total_payable)),
      };
    };

    const motorPolicies = activeRows.map(normalizePolicy);
    const cancelledPolicies = cancelledRows.map(normalizePolicy);
    const policies = [...motorPolicies, ...cancelledPolicies].sort((left, right) =>
      new Date(right.report_date || 0).getTime() - new Date(left.report_date || 0).getTime()
    );

    const summary = policies.reduce((result, policy) => {
      result.policy_count += 1;
      if (String(policy.policy_status || "").toLowerCase() === "cancelled") {
        result.cancelled_count += 1;
      } else {
        result.active_count += 1;
      }
      result.total_od += number(policy.total_od);
      result.total_tp += number(policy.total_tp);
      result.net_premium += number(policy.net_premium);
      result.gross_premium += number(policy.total_payable);
      result.od_income += number(policy.total_od) *
        number(String(policy.pos_od ?? "").replace("%", "")) / 100;
      result.tp_income += number(policy.total_tp) *
        number(String(policy.pos_tp ?? "").replace("%", "")) / 100;
      result.net_income += number(policy.net_premium) *
        number(String(policy.pos_net ?? "").replace("%", "")) / 100;
      if (policy.verify_remark && String(policy.verify_remark).trim()) result.verified_count += 1;
      if (["paid", "completed"].includes(String(policy.payment_status || "").toLowerCase())) result.paid_count += 1;
      return result;
    }, {
      policy_count: 0,
      active_count: 0,
      cancelled_count: 0,
      total_od: 0,
      total_tp: 0,
      net_premium: 0,
      gross_premium: 0,
      od_income: 0,
      tp_income: 0,
      net_income: 0,
      total_income: 0,
      verified_count: 0,
      paid_count: 0,
    });
    summary.total_income = summary.od_income + summary.tp_income + summary.net_income;

    const pos = posRows[0]
      ? { ...posRows[0], policy_details: policies, ...summary }
      : null;

    return {
      pos,
      policies,
      motor_policies: motorPolicies,
      cancelled_policies: cancelledPolicies,
      summary,
    };
  },
};
