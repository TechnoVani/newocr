// Shared policy-workspace model.
import db from "../../../config/database.js";
import { POLICY_REPORT_JOINS, POLICY_REPORT_SELECT } from "../../../utils/policyReportQuery.js";
import { policyOwnershipFilter } from "../../../utils/dataScope.js";
import { sanitizePolicyNumber } from "../services/folder.service.js";

class PoliciesMotorModel {
    static asCancellationRecoveryRow(row) {
        const negativeAmountFields = [
            "first_year_od",
            "first_year_tp",
            "total_od",
            "total_tp",
            "net_premium",
            "gst",
            "total_payable"
        ];
        const recoveryRow = {
            ...row,
            report_row_id: `cancelled-${row.cancellation_id}`,
            report_date: row.cancellation_record_created_at || row.cancellation_date,
            policy_status: "Cancelled",
            is_cancelled: 1
        };
        negativeAmountFields.forEach(field => {
            recoveryRow[field] = -Math.abs(Number(row[field]) || 0);
        });
        return recoveryRow;
    }


    // Create New Policy
    static async create(policyData, executor = db) {
        const query = `
        INSERT INTO policies_motor (
            bqp,
            reporting_manager,
            relationship_manager,
            pos_id,
            ref_id,
            business_type,
            insurance_company,
            policy_number,
            policy_type,
            vehicle_category,
            insurer_branch,
            insured_name,
            pan,
            gstin,
            contact,
            email,
            address,
            start_date,
            od_expiry,
            tp_expiry,
            issue_date,
            idv,
            previous_insurer,
            previous_policy,
            first_year_od,
            first_year_tp,
            total_od,
            total_tp,
            net_premium,
            gst,
            total_payable,
            registration_number,
            rto,
            manufacturing_year,
            commercial_vehicle_type,
            ncb,
            chassis_number,
            sub_type,
            engine_number,
            fuel,
            gvw,
            make_name,
            cc,
            model_name,
            seating_capacity,
            variant_name,
            financier,
            irda_od,
            irda_tp,
            irda_net,
            pos_od,
            pos_tp,
            pos_net,
            verify_remark,
            account_remark,
            payment_status,
            created_by
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        const values = [
            policyData.bqp_id,
            policyData.reporting_id,
            policyData.rm_id,
            policyData.pos_id,
            policyData.ref_id,
            policyData.business_type,
            policyData.insurance_company,
            policyData.policy_number,
            policyData.policy_type,
            policyData.vehicle_category,
            policyData.insurer_branch,
            policyData.insured_name,
            policyData.pan,
            policyData.gstin,
            policyData.contact,
            policyData.email,
            policyData.address,
            policyData.start_date,
            policyData.od_expiry,
            policyData.tp_expiry,
            policyData.issue_date,
            policyData.idv,
            policyData.previous_insurer,
            policyData.previous_policy,
            policyData.first_year_od,
            policyData.first_year_tp,
            policyData.total_od,
            policyData.total_tp,
            policyData.net_premium,
            policyData.gst,
            policyData.total_payable,
            policyData.registration_number,
            policyData.rto,
            policyData.manufacturing_year,
            policyData.commercial_vehicle_type,
            policyData.ncb,
            policyData.chassis_number,
            policyData.sub_type,
            policyData.engine_number,
            policyData.fuel,
            policyData.gvw,
            policyData.make_name,
            policyData.cc,
            policyData.model_name,
            policyData.seating_capacity,
            policyData.variant_name,
            policyData.financier,
            policyData.irda_od,
            policyData.irda_tp,
            policyData.irda_net,
            policyData.pos_od,
            policyData.pos_tp,
            policyData.pos_net,
            policyData.verify_remark,
            policyData.account_remark,
            policyData.payment_status,
            policyData.created_by
        ].map(value => value === undefined ? null : value);

        const [result] = await executor.query(query, values);
        return result.insertId;
    }

    static async isValidHierarchy(policyData, executor = db) {
        const [rows] = await executor.query(
            `
            SELECT 1
            FROM employee_references reference
            INNER JOIN employee_pos pos
                ON pos.id = reference.pos_id
            WHERE reference.id = ?
              AND reference.pos_id = ?
              AND pos.bqp = ?
              AND pos.reporting_manager = ?
              AND pos.relationship_manager = ?
            LIMIT 1
            `,
            [
                policyData.ref_id,
                policyData.pos_id,
                policyData.bqp_id,
                policyData.reporting_id,
                policyData.rm_id
            ]
        );
        return rows.length > 0;
    }

    // Get All Policies
    static async findAll(readScope) {
        const ownership = policyOwnershipFilter(readScope, "p.created_by");
        const query = `
        SELECT ${POLICY_REPORT_SELECT}
        FROM policies_motor p
        ${POLICY_REPORT_JOINS}
        WHERE ${ownership.sql}
        ORDER BY p.created_at DESC, p.id DESC
        `;
        const [rows] = await db.query(query, ownership.params);
        return rows;
    }

    // Get Single Policy
    static async findById(id, readScope) {
        const ownership = policyOwnershipFilter(readScope, "created_by");
        const query = `
        SELECT *
        FROM policies_motor
        WHERE id = ? AND ${ownership.sql}
        `;
        const [rows] = await db.query(query, [id, ...ownership.params]);
        return rows[0];
    }

    // Update Policy
    static async update(id, data, readScope) {
        const columnMap = {
            bqp_id: "bqp",
            reporting_id: "reporting_manager",
            rm_id: "relationship_manager"
        };
        const fileOnlyFields = new Set([
            "ocr_text",
            "extracted_json",
            "pdf_path",
            "aadhaar_front_path",
            "aadhaar_back_path",
            "pan_card_path"
        ]);
        const entries = Object.entries(data).filter(
            ([field, value]) => !fileOnlyFields.has(field) && value !== undefined
        );
        if (entries.length === 0) return 0;

        const fields = entries.map(([field]) => columnMap[field] || field);
        const values = entries.map(([, value]) => value);

        const updateQuery = fields.map(field => `${field}=?`).join(",");

        const ownership = policyOwnershipFilter(readScope, "created_by");
        const query = `
        UPDATE policies_motor
        SET ${updateQuery}
        WHERE id=? AND ${ownership.sql}
        `;
        values.push(id, ...ownership.params);

        const [result] = await db.query(query, values);
        return result.affectedRows;
    }

    // Delete Policy
    static async delete(id, readScope) {
        const ownership = policyOwnershipFilter(readScope, "created_by");
        const query = `
        DELETE FROM policies_motor
        WHERE id=? AND ${ownership.sql}
        `;
        const [result] = await db.query(query, [id, ...ownership.params]);
        return result.affectedRows;
    }

    // Search Policy
    static async search(keyword, readScope) {
        const ownership = policyOwnershipFilter(readScope, "created_by");
        const query = `
        SELECT *
        FROM policies_motor
        WHERE ${ownership.sql} AND (
            policy_number LIKE ?
            OR insured_name LIKE ?
            OR registration_number LIKE ?
            OR contact LIKE ?
        )
        ORDER BY created_at DESC
        `;
        const value = `%${keyword}%`;
        const [rows] = await db.query(query, [...ownership.params, value, value, value, value]);
        return rows;
    }

    static async findByRefId(refId, readScope) {
        const ownership = policyOwnershipFilter(readScope, "created_by");
        const query = `SELECT * FROM policies_motor WHERE ${ownership.sql} AND (ref_id = ? OR policy_number = ?) LIMIT 1`;
        const [rows] = await db.query(query, [...ownership.params, refId, refId]);
        return rows[0] || null;
    }

    static async findByPolicyNumber(policyNumber, readScope = null) {
        const ownership = readScope
            ? policyOwnershipFilter(readScope, "created_by")
            : { sql: "1 = 1", params: [] };
        const query = `
            SELECT *
            FROM policies_motor
            WHERE ${ownership.sql}
              AND UPPER(TRIM(policy_number)) = UPPER(TRIM(?))
            LIMIT 1
        `;
        const [rows] = await db.query(query, [...ownership.params, policyNumber]);
        return rows[0] || null;
    }

    static async getAllReferenceIds(readScope) {
        const ownership = policyOwnershipFilter(readScope, "created_by");
        const query = `SELECT DISTINCT ref_id, policy_number, insured_name, created_by FROM policies_motor WHERE ${ownership.sql} AND ref_id IS NOT NULL AND ref_id != '' ORDER BY ref_id ASC`;
        const [rows] = await db.query(query, ownership.params);
        return rows;
    }

    static async getDashboardSummary(readScope) {
        const ownership = policyOwnershipFilter(readScope, "p.created_by");
        const summaryQuery = `
            SELECT
                COUNT(*) AS totalEntries,
                COALESCE(SUM(
                    created_at >= CURRENT_DATE()
                    AND created_at < CURRENT_DATE() + INTERVAL 1 DAY
                ), 0) AS todayEntries,
                COALESCE(SUM(
                    created_at >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
                    AND created_at < DATE_FORMAT(CURRENT_DATE() + INTERVAL 1 MONTH, '%Y-%m-01')
                ), 0) AS currentMonthEntries,
                COALESCE(SUM(
                    created_at >= DATE_FORMAT(CURRENT_DATE() - INTERVAL 1 MONTH, '%Y-%m-01')
                    AND created_at < DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
                ), 0) AS lastMonthEntries,
                DATE_FORMAT(CURRENT_DATE(), '%d %b %Y') AS todayLabel,
                DATE_FORMAT(CURRENT_DATE(), '%M %Y') AS currentMonthLabel,
                DATE_FORMAT(CURRENT_DATE() - INTERVAL 1 MONTH, '%M %Y') AS lastMonthLabel
            FROM policies_motor p
            WHERE ${ownership.sql}
        `;
        const recentQuery = `
            SELECT
                p.id,
                p.policy_number,
                p.insured_name,
                p.insurance_company,
                p.business_type,
                p.created_at,
                COALESCE(NULLIF(CONCAT_WS(' - ', e.name, e.employee_code), ''), CAST(p.created_by AS CHAR)) AS created_by_display
            FROM policies_motor p
            LEFT JOIN employees e ON p.created_by = e.id
            WHERE ${ownership.sql}
            ORDER BY p.created_at DESC, p.id DESC
            LIMIT 5
        `;

        const [[summaryRows], [recentEntries]] = await Promise.all([
            db.query(summaryQuery, ownership.params),
            db.query(recentQuery, ownership.params)
        ]);

        const summary = summaryRows[0] || {};
        return {
            counts: {
                total: Number(summary.totalEntries) || 0,
                today: Number(summary.todayEntries) || 0,
                currentMonth: Number(summary.currentMonthEntries) || 0,
                lastMonth: Number(summary.lastMonthEntries) || 0
            },
            periods: {
                today: summary.todayLabel,
                currentMonth: summary.currentMonthLabel,
                lastMonth: summary.lastMonthLabel
            },
            recentEntries,
            visibility: ownership.scope.all ? "all" : "self"
        };
    }

    static async findMonthlyReport(startDate, endDate, readScope) {
        const ownership = policyOwnershipFilter(readScope, "p.created_by");
        const policyQuery = `
            SELECT ${POLICY_REPORT_SELECT}
            FROM policies_motor p
            ${POLICY_REPORT_JOINS}
            WHERE ${ownership.sql} AND p.issue_date >= ? AND p.issue_date < ?
            ORDER BY p.issue_date DESC, p.id DESC
        `;
        const cancellationQuery = `
            SELECT ${POLICY_REPORT_SELECT}
            FROM policies_cancelled pc
            INNER JOIN policies_motor p ON pc.policy_id = p.id
            ${POLICY_REPORT_JOINS}
            WHERE ${ownership.sql} AND pc.created_at >= ? AND pc.created_at < ?
            ORDER BY pc.created_at DESC, pc.id DESC
        `;
        const [[policyRows], [cancellationRows]] = await Promise.all([
            db.query(policyQuery, [...ownership.params, startDate, endDate]),
            db.query(cancellationQuery, [...ownership.params, startDate, endDate])
        ]);
        return [
            ...policyRows.map(row => ({
                ...row,
                report_row_id: `policy-${row.id}`,
                report_date: row.issue_date,
                policy_status: "Active",
                is_cancelled: 0
            })),
            ...cancellationRows.map(row => ({
                ...PoliciesMotorModel.asCancellationRecoveryRow(row)
            }))
        ].sort((left, right) => {
            const leftDate = new Date(left.report_date || left.issue_date || 0).getTime();
            const rightDate = new Date(right.report_date || right.issue_date || 0).getTime();
            return rightDate - leftDate || String(right.report_row_id).localeCompare(String(left.report_row_id));
        });
    }

    static async findRenewalsByExpiryMonth(startDate, endDate, readScope) {
        const ownership = policyOwnershipFilter(readScope, "p.created_by");
        const query = `
            SELECT ${POLICY_REPORT_SELECT}
            FROM policies_motor p
            ${POLICY_REPORT_JOINS}
            WHERE ${ownership.sql} AND (
                (p.od_expiry >= ? AND p.od_expiry < ?)
                OR
                (p.tp_expiry >= ? AND p.tp_expiry < ?)
            )
            ORDER BY
                LEAST(
                    COALESCE(p.od_expiry, '9999-12-31'),
                    COALESCE(p.tp_expiry, '9999-12-31')
                ) ASC,
                p.id DESC
        `;
        const [rows] = await db.query(query, [...ownership.params, startDate, endDate, startDate, endDate]);
        return rows;
    }

    static async userOwnsPolicyFolder(readScope, folderName) {
        const ownership = policyOwnershipFilter(readScope, "created_by");
        const query = `SELECT policy_number FROM policies_motor WHERE ${ownership.sql}`;
        const [rows] = await db.query(query, ownership.params);
        return rows.some(row =>
            sanitizePolicyNumber(row.policy_number) === folderName
        );
    }
}

export default PoliciesMotorModel;
