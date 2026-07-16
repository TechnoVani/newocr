import db from "../config/database.js";

class ReferenceModel {
    static async isValidHierarchy({ bqp_id, reporting_id, relationship_id, pos_id }) {
        const [rows] = await db.query(
            `SELECT id
             FROM employee_pos
             WHERE id = ? AND bqp = ? AND reporting_manager = ?
               AND relationship_manager = ? AND status = 'Active'
             LIMIT 1`,
            [Number(pos_id), Number(bqp_id), Number(reporting_id), Number(relationship_id)]
        );
        return rows.length > 0;
    }

    /**
     * Create a new reference in employee_references table
     */
    static async create(data) {
        const query = `
            INSERT INTO employee_references (
                bqp_id,
                reporting_id,
                relationship_id,
                pos_id,
                ref_name,
                ref_mobile,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            Number(data.bqp_id),
            Number(data.reporting_id),
            Number(data.relationship_id),
            Number(data.pos_id),
            data.ref_name,
            data.ref_mobile || null,
            Number(data.created_by)
        ];

        const [result] = await db.query(query, values);
        return result.insertId;
    }

    /**
     * Get all references from database with names resolved
     */
    static async findAll() {
        const query = `
            SELECT 
                er.id,
                er.bqp_id,
                er.reporting_id,
                er.relationship_id,
                er.pos_id,
                er.ref_name,
                er.ref_mobile,
                er.created_by,
                er.created_at,
                ebqp.name AS bqp_name,
                ebqp.employee_code AS bqp_code,
                erep.name AS manager_name,
                erep.employee_code AS manager_code,
                erel.name AS relationship_name,
                erel.employee_code AS relationship_code,
                epos.name AS posp_name,
                epos.pos_code AS posp_code
            FROM employee_references er
            LEFT JOIN employees ebqp ON er.bqp_id = ebqp.id
            LEFT JOIN employees erep ON er.reporting_id = erep.id
            LEFT JOIN employees erel ON er.relationship_id = erel.id
            LEFT JOIN employee_pos epos ON er.pos_id = epos.id
            ORDER BY er.created_at DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    /**
     * Update an existing reference in employee_references table
     */
    static async update(id, data) {
        const query = `
            UPDATE employee_references
            SET bqp_id = ?, reporting_id = ?, relationship_id = ?, pos_id = ?, ref_name = ?, ref_mobile = ?
            WHERE id = ?
        `;
        const values = [
            Number(data.bqp_id),
            Number(data.reporting_id),
            Number(data.relationship_id),
            Number(data.pos_id),
            data.ref_name,
            data.ref_mobile || null,
            Number(id)
        ];
        const [result] = await db.query(query, values);
        return result.affectedRows;
    }

    static async exists(id) {
        const [rows] = await db.query(
            "SELECT id FROM employee_references WHERE id = ? LIMIT 1",
            [Number(id)]
        );
        return rows.length > 0;
    }

    // Add this static method inside ReferenceModel class
    static async getByPospId(pospId) {
        const query = `
            SELECT 
                er.id,
                er.bqp_id,
                er.reporting_id,
                er.relationship_id,
                er.pos_id,
                er.ref_name,
                er.ref_mobile,
                er.created_by,
                er.created_at,
                ebqp.name AS bqp_name,
                ebqp.employee_code AS bqp_code,
                erep.name AS manager_name,
                erep.employee_code AS manager_code,
                erel.name AS relationship_name,
                erel.employee_code AS relationship_code,
                epos.name AS posp_name,
                epos.pos_code AS posp_code
            FROM employee_references er
            LEFT JOIN employees ebqp ON er.bqp_id = ebqp.id
            LEFT JOIN employees erep ON er.reporting_id = erep.id
            LEFT JOIN employees erel ON er.relationship_id = erel.id
            LEFT JOIN employee_pos epos ON er.pos_id = epos.id
            WHERE er.pos_id = ?
            ORDER BY er.created_at DESC
        `;
        const [rows] = await db.query(query, [pospId]);
        return rows;
    }
    
}

export default ReferenceModel;
