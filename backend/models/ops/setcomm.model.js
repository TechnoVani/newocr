import db from "../../config/database.js";
import { POLICY_REPORT_JOINS, POLICY_REPORT_SELECT } from "../../utils/policyReportQuery.js";
import { policyOwnershipFilter } from "../../utils/dataScope.js";

class SetCommModel {
    /**
     * Create a new set commission record.
     * @param {object} data - Set commission fields
     * @returns {Promise<number>} Inserted row ID
     */
    static async create(data) {
        const query = `
            INSERT INTO set_count (
                pos_id,
                ref_id,
                business_type,
                insurance_company,
                vehicle_category,
                insured_name,
                contact,
                email,
                first_year_od,
                first_year_tp,
                total_od,
                total_tp,
                irda_od,
                irda_tp,
                irda_net,
                pos_od,
                pos_tp,
                pos_net
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.pos_id,
            data.ref_id,
            data.business_type || "",
            data.insurance_company || "",
            data.vehicle_category || "",
            data.insured_name,
            data.contact || "",
            data.email || "",
            data.first_year_od || 0.00,
            data.first_year_tp || 0.00,
            data.total_od || 0.00,
            data.total_tp || 0.00,
            data.irda_od || 0.00,
            data.irda_tp || 0.00,
            data.irda_net || 0.00,
            data.pos_od || 0.00,
            data.pos_tp || 0.00,
            data.pos_net || 0.00
        ];

        const [result] = await db.query(query, values);
        return result.insertId;
    }

    /**
     * Find a set commission row by policy ID.
     * @param {number} id - Record ID
     * @returns {Promise<object|null>} Record or null
     */
    static async findById(id, readScope) {
        const ownership = policyOwnershipFilter(readScope, "created_by");
        const query = `SELECT * FROM policies WHERE id = ? AND ${ownership.sql}`;
        const [rows] = await db.query(query, [id, ...ownership.params]);
        return rows[0] || null;
    }

    /**
     * Find policy commission rows with optional filtering and pagination.
     * @param {object} options - Search options
     * @returns {Promise<{rows: object[], total: number}>} Paginated results and count
     */
    static async findAll(options = {}) {
        const search = options.search || "";
        const month = options.month || "";
        const businessType = options.business_type || "";
        const posId = options.pos_id || "";
        const insuranceCompany = options.insurance_company || "";
        const sortBy = options.sortBy || "created_at";
        const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
        const limit = parseInt(options.limit) || 10;
        const offset = parseInt(options.offset) || 0;

        // Allowed columns to prevent SQL injection in sorting
        const allowedSortColumns = [
            "id", "pos_id", "ref_id", "business_type", "insurance_company",
            "vehicle_category", "insured_name", "contact", "email", "created_at",
            "issue_date", "policy_number", "registration_number",
            "first_year_od", "first_year_tp", "total_od", "total_tp",
            "irda_od", "irda_tp", "irda_net", "pos_od", "pos_tp", "pos_net"
        ];
        const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "created_at";

        let query = `SELECT ${POLICY_REPORT_SELECT} FROM policies p ${POLICY_REPORT_JOINS}`;
        let countQuery = `SELECT COUNT(*) as count FROM policies p ${POLICY_REPORT_JOINS}`;
        const ownership = policyOwnershipFilter(options.readScope, "p.created_by");
        let queryParams = [...ownership.params];
        let whereClauses = [ownership.sql];

        if (search.trim()) {
            const searchColumns = [
                "p.pos_id", "p.ref_id", "p.policy_number", "p.insured_name",
                "p.email", "p.contact", "p.insurance_company", "p.business_type",
                "p.registration_number", "p.make_name", "p.model_name", "p.pan",
                "p.gstin", "p.chassis_number", "p.engine_number",
                "bqp_employee.name", "bqp_employee.employee_code",
                "reporting_employee.name", "reporting_employee.employee_code",
                "relationship_employee.name", "relationship_employee.employee_code",
                "pos_employee.name", "pos_employee.pos_code",
                "reference_employee.ref_name", "reference_employee.ref_mobile",
                "creator_employee.name", "creator_employee.employee_code"
            ];
            whereClauses.push(`(${searchColumns.map(column => `${column} LIKE ?`).join(" OR ")})`);
            const searchVal = `%${search}%`;
            queryParams.push(...searchColumns.map(() => searchVal));
        }

        if (month) {
            if (month.length === 7) {
                const [year, monthNumber] = month.split("-").map(Number);
                const nextYear = monthNumber === 12 ? year + 1 : year;
                const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
                const startDate = `${year}-${String(monthNumber).padStart(2, "0")}-01`;
                const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
                whereClauses.push("p.issue_date >= ? AND p.issue_date < ?");
                queryParams.push(startDate, endDate);
            } else {
                whereClauses.push("DATE(p.issue_date) = ?");
                queryParams.push(month);
            }
        }

        if (businessType) {
            whereClauses.push("p.business_type = ?");
            queryParams.push(businessType);
        }

        if (posId) {
            whereClauses.push("p.pos_id = ?");
            queryParams.push(posId);
        }

        if (insuranceCompany) {
            whereClauses.push("p.insurance_company = ?");
            queryParams.push(insuranceCompany);
        }

        if (whereClauses.length > 0) {
            const whereStr = " WHERE " + whereClauses.join(" AND ");
            query += whereStr;
            countQuery += whereStr;
        }

        // Add sorting
        query += ` ORDER BY p.${safeSortBy} ${sortOrder}`;

        // Add limit / offset for pagination
        query += " LIMIT ? OFFSET ?";
        
        // Execute count first
        const [countRows] = await db.query(countQuery, queryParams);
        const total = countRows[0]?.count || 0;

        // Execute select
        const selectParams = [...queryParams, limit, offset];
        const [rows] = await db.query(query, selectParams);

        return { rows, total };
    }

    /**
     * Update an existing policy commission row.
     * @param {number} id - Record ID
     * @param {object} data - Fields to update
     * @returns {Promise<number>} Affected rows count
     */
    static async update(id, data, readScope) {
        const allowedFields = new Set([
            "irda_od", "irda_tp", "irda_net",
            "pos_od", "pos_tp", "pos_net"
        ]);
        const cleanedData = Object.fromEntries(
            Object.entries(data).filter(([field]) => allowedFields.has(field))
        );

        const fields = Object.keys(cleanedData);
        if (fields.length === 0) return 0;

        const values = Object.values(cleanedData);
        const updateQuery = fields.map(field => `${field} = ?`).join(", ");

        const ownership = policyOwnershipFilter(readScope, "created_by");
        const query = `UPDATE policies SET ${updateQuery} WHERE id = ? AND ${ownership.sql}`;
        values.push(id, ...ownership.params);

        const [result] = await db.query(query, values);
        return result.affectedRows;
    }

    /**
     * Delete a policy commission row by ID.
     * @param {number} id - Record ID
     * @returns {Promise<number>} Affected rows count
     */
    static async delete(id, readScope) {
        const ownership = policyOwnershipFilter(readScope, "created_by");
        const query = `DELETE FROM policies WHERE id = ? AND ${ownership.sql}`;
        const [result] = await db.query(query, [id, ...ownership.params]);
        return result.affectedRows;
    }

    /**
     * Get distinct POS IDs logged in set_count
     */
    static async getDistinctPosOptions(readScope) {
        const ownership = policyOwnershipFilter(readScope, "p.created_by");
        const query = `
            SELECT DISTINCT
                p.pos_id AS value,
                COALESCE(
                    NULLIF(CONCAT_WS(' - ', NULLIF(pos_employee.name, ''), NULLIF(pos_employee.pos_code, '')), ''),
                    CAST(p.pos_id AS CHAR)
                ) AS label
            FROM policies p
            LEFT JOIN employee_pos pos_employee ON p.pos_id = pos_employee.id
            WHERE ${ownership.sql} AND p.pos_id IS NOT NULL AND p.pos_id != ''
            ORDER BY label ASC
        `;
        const [rows] = await db.query(query, ownership.params);
        return rows;
    }

    /**
     * Get distinct Insurance Companies logged in set_count
     */
    static async getDistinctInsurers(readScope) {
        const ownership = policyOwnershipFilter(readScope, "p.created_by");
        const query = `
            SELECT DISTINCT p.insurance_company
            FROM policies p
            WHERE ${ownership.sql} AND p.insurance_company IS NOT NULL AND p.insurance_company != ''
            ORDER BY p.insurance_company ASC
        `;
        const [rows] = await db.query(query, ownership.params);
        return rows.map(r => r.insurance_company);
    }
}

export default SetCommModel;
