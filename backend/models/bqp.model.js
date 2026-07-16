import db from '../config/database.js';

const referenceSelect = `
    SELECT er.id, er.bqp_id, er.reporting_id, er.relationship_id, er.pos_id,
        er.ref_name, er.ref_mobile, er.created_by, er.created_at,
        ebqp.name AS bqp_name, ebqp.employee_code AS bqp_code,
        erep.name AS manager_name, erep.employee_code AS manager_code,
        erel.name AS relationship_name, erel.employee_code AS relationship_code,
        epos.name AS posp_name, epos.pos_code AS posp_code
    FROM employee_references er
    LEFT JOIN employees ebqp ON er.bqp_id = ebqp.id
    LEFT JOIN employees erep ON er.reporting_id = erep.id
    LEFT JOIN employees erel ON er.relationship_id = erel.id
    LEFT JOIN employee_pos epos ON er.pos_id = epos.id
`;

class BqpModel {
    static async getBqp({ status, isBqp }) {
        const [rows] = await db.query(
            `SELECT id, name, employee_code, status, is_bqp
             FROM employees
             WHERE status = ? AND is_bqp = ?
             ORDER BY name ASC`,
            [status, isBqp]
        );
        return rows;
    }

    static async getEmployeesByBqp(bqpId, status) {
        const [rows] = await db.query(
            `SELECT id, name, employee_code, status, reporting_manager
             FROM employees
             WHERE status = ? AND reporting_manager = ?
             ORDER BY name ASC`,
            [status, Number(bqpId)]
        );
        return rows;
    }

    // ***** FIXED: Correct JOIN condition *****
    static async getRelationshipManagersByManager(managerId, status) {
        const [rows] = await db.query(
            `SELECT DISTINCT relationship.id, relationship.name,
                    relationship.employee_code, relationship.status
             FROM employees employee
             INNER JOIN employees relationship ON relationship.id = employee.relationship_manager   -- fixed
             WHERE employee.relationship_manager = ?
               AND employee.status = ?
               AND relationship.status = ?
             ORDER BY relationship.name ASC`,
            [Number(managerId), status, status]
        );
        return rows;
    }

    // ***** Added optional veri filter *****
    static async getPospByRelationshipManager(relationshipId, status, veri = null) {
        let query = `
            SELECT id, name, pos_code, status
            FROM employee_pos
            WHERE relationship_manager = ? AND status = ?
        `;
        const params = [Number(relationshipId), status];

        if (veri) {
            query += ` AND veri = ?`;
            params.push(veri);
        }

        query += ` ORDER BY name ASC`;
        const [rows] = await db.query(query, params);
        return rows;
    }

    static async getReferencesByPospId(pospId) {
        const [rows] = await db.query(
            `${referenceSelect} WHERE er.pos_id = ? ORDER BY er.created_at DESC`,
            [Number(pospId)]
        );
        return rows;
    }
}

export default BqpModel;