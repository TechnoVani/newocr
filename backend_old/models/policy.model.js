import db from "../config/database.js";
import { POLICY_REPORT_JOINS, POLICY_REPORT_SELECT } from "../utils/policyReportQuery.js";

class PolicyModel {

    // Create New Policy
    static async create(policyData) {
        const query = `
        INSERT INTO policies (
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
            office_name,
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
            manufacturing_year,
            commercial_vehicle_type,
            chassis_number,
            body_type,
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
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
            policyData.office_name,
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
            policyData.manufacturing_year,
            policyData.commercial_vehicle_type,
            policyData.chassis_number,
            policyData.body_type,
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

        const [result] = await db.query(query, values);
        return result.insertId;
    }

    // Get All Policies
    static async findAll(userId) {
        const query = `
        SELECT *
        FROM policies
        WHERE created_by = ?
        ORDER BY created_at DESC
        `;
        const [rows] = await db.query(query, [userId]);
        return rows;
    }

    // Get Single Policy
    static async findById(id, userId) {
        const query = `
        SELECT *
        FROM policies
        WHERE id = ? AND created_by = ?
        `;
        const [rows] = await db.query(query, [id, userId]);
        return rows[0];
    }

    // Update Policy
    static async update(id, data, userId) {
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

        const query = `
        UPDATE policies
        SET ${updateQuery}
        WHERE id=? AND created_by=?
        `;
        values.push(id, userId);

        const [result] = await db.query(query, values);
        return result.affectedRows;
    }

    // Delete Policy
    static async delete(id, userId) {
        const query = `
        DELETE FROM policies
        WHERE id=? AND created_by=?
        `;
        const [result] = await db.query(query, [id, userId]);
        return result.affectedRows;
    }

    // Search Policy
    static async search(keyword, userId) {
        const query = `
        SELECT *
        FROM policies
        WHERE created_by = ? AND (
            policy_number LIKE ?
            OR insured_name LIKE ?
            OR registration_number LIKE ?
            OR contact LIKE ?
        )
        ORDER BY created_at DESC
        `;
        const value = `%${keyword}%`;
        const [rows] = await db.query(query, [userId, value, value, value, value]);
        return rows;
    }

    static async findByRefId(refId, userId) {
        const query = "SELECT * FROM policies WHERE created_by = ? AND (ref_id = ? OR policy_number = ?) LIMIT 1";
        const [rows] = await db.query(query, [userId, refId, refId]);
        return rows[0] || null;
    }

    static async getAllReferenceIds(userId) {
        const query = "SELECT DISTINCT ref_id, policy_number, insured_name FROM policies WHERE created_by = ? AND ref_id IS NOT NULL AND ref_id != '' ORDER BY ref_id ASC";
        const [rows] = await db.query(query, [userId]);
        return rows;
    }

    static async getDashboardSummary(userId) {
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
            FROM policies
            WHERE created_by = ?
        `;
        const recentQuery = `
            SELECT
                id,
                policy_number,
                insured_name,
                insurance_company,
                business_type,
                created_at
            FROM policies
            WHERE created_by = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 5
        `;

        const [[summaryRows], [recentEntries]] = await Promise.all([
            db.query(summaryQuery, [userId]),
            db.query(recentQuery, [userId])
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
            recentEntries
        };
    }

    static async findMonthlyReport(startDate, endDate, userId) {
        const query = `
            SELECT ${POLICY_REPORT_SELECT}
            FROM policies p
            ${POLICY_REPORT_JOINS}
            WHERE p.created_by = ? AND p.issue_date >= ? AND p.issue_date < ?
            ORDER BY p.issue_date DESC, p.id DESC
        `;
        const [rows] = await db.query(query, [userId, startDate, endDate]);
        return rows;
    }

    static async findRenewalsByExpiryMonth(startDate, endDate, userId) {
        const query = `
            SELECT ${POLICY_REPORT_SELECT}
            FROM policies p
            ${POLICY_REPORT_JOINS}
            WHERE p.created_by = ? AND (
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
        const [rows] = await db.query(query, [userId, startDate, endDate, startDate, endDate]);
        return rows;
    }

    static async userOwnsPolicyFolder(userId, folderName) {
        const query = "SELECT policy_number FROM policies WHERE created_by = ?";
        const [rows] = await db.query(query, [userId]);
        return rows.some(row =>
            String(row.policy_number || "").replace(/[^a-zA-Z0-9._-]/g, "") === folderName
        );
    }
}

export default PolicyModel;