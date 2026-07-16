import db from '../config/database.js';

const STATUS = { ACTIVE: 'Active' };
const BQP_FLAG = { YES: 'Yes' };

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

class ReferenceModel {
    static async isValidHierarchy({ bqp_id, reporting_id, relationship_id, pos_id }) {
        const [rows] = await db.query(
            `SELECT 1
             FROM employee_pos pos
             JOIN employees bqp ON bqp.id = ? AND bqp.status = ? AND bqp.is_bqp = ?
             JOIN employees reporting ON reporting.id = ? AND reporting.status = ?
             JOIN employees relationship ON relationship.id = ? AND relationship.status = ?
             WHERE pos.id = ? AND pos.relationship_manager = ? AND pos.status = ?
             LIMIT 1`,
            [
                Number(bqp_id), STATUS.ACTIVE, BQP_FLAG.YES,
                Number(reporting_id), STATUS.ACTIVE,
                Number(relationship_id), STATUS.ACTIVE,
                Number(pos_id), Number(relationship_id), STATUS.ACTIVE
            ]
        );
        return rows.length > 0;
    }

    static async duplicateExists(posId, refName, refMobile) {
        const [rows] = await db.query(
            `SELECT id FROM employee_references
             WHERE pos_id = ? AND ref_name = ? AND ref_mobile = ? LIMIT 1`,
            [Number(posId), refName, refMobile || null]
        );
        return rows.length > 0;
    }

    static async findAll() {
        const [rows] = await db.query(`${referenceSelect} ORDER BY er.created_at DESC`);
        return rows;
    }

    static async create(data) {
        const [result] = await db.query(
            `INSERT INTO employee_references (
                bqp_id, reporting_id, relationship_id, pos_id,
                ref_name, ref_mobile, created_by
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(data.bqp_id), Number(data.reporting_id),
                Number(data.relationship_id), Number(data.pos_id),
                data.ref_name, data.ref_mobile || null,
                Number(data.created_by)
            ]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const [result] = await db.query(
            `UPDATE employee_references
             SET bqp_id = ?, reporting_id = ?, relationship_id = ?,
                 pos_id = ?, ref_name = ?, ref_mobile = ?
             WHERE id = ?`,
            [
                Number(data.bqp_id), Number(data.reporting_id),
                Number(data.relationship_id), Number(data.pos_id),
                data.ref_name, data.ref_mobile || null, Number(id)
            ]
        );
        return result.affectedRows;
    }

    static async exists(id) {
        const [rows] = await db.query(
            `SELECT id FROM employee_references WHERE id = ? LIMIT 1`,
            [Number(id)]
        );
        return rows.length > 0;
    }
}

export default ReferenceModel;
