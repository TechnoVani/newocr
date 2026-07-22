import db from "../../config/database.js";

const referenceSelect = `
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

    LEFT JOIN employees ebqp
        ON er.bqp_id = ebqp.id

    LEFT JOIN employees erep
        ON er.reporting_id = erep.id

    LEFT JOIN employees erel
        ON er.relationship_id = erel.id

    LEFT JOIN employee_pos epos
        ON er.pos_id = epos.id
`;

class BqpModel {
    /**
     * BQP list comes from employees.
     */
    static async getBqp({ status, isBqp }) {
        const [rows] = await db.query(
            `
            SELECT
                id,
                name,
                employee_code,
                status,
                is_bqp
            FROM employees
            WHERE status = ?
              AND is_bqp = ?
            ORDER BY name ASC
            `,
            [status, isBqp]
        );

        return rows;
    }

    /**
     * Selected BQP ID:
     * 1. Match employee_pos.bqp
     * 2. Read employee_pos.reporting_manager
     * 3. Match reporting_manager with employees.id
     * 4. Return manager details from employees
     */
    static async getReportingManagersByBqp(bqpId, status) {
        const [rows] = await db.query(
            `
            SELECT DISTINCT
                manager.id,
                manager.name,
                manager.employee_code,
                manager.status
            FROM employee_pos pos

            INNER JOIN employees bqp
                ON bqp.id = pos.bqp

            INNER JOIN employees manager
                ON manager.id = pos.reporting_manager

            WHERE pos.bqp = ?
              AND pos.status = ?
              AND bqp.status = ?
              AND bqp.is_bqp = 'Yes'
              AND manager.status = ?

            ORDER BY manager.name ASC
            `,
            [
                Number(bqpId),
                status,
                status,
                status
            ]
        );

        return rows;
    }

    /**
     * Selected BQP ID and reporting manager ID:
     * 1. Match employee_pos.bqp
     * 2. Match employee_pos.reporting_manager
     * 3. Read employee_pos.relationship_manager
     * 4. Match relationship_manager with employees.id
     * 5. Return relationship manager details from employees
     */
    static async getRelationshipManagersByManager(
        bqpId,
        managerId,
        status
    ) {
        const [rows] = await db.query(
            `
            SELECT DISTINCT
                relationship.id,
                relationship.name,
                relationship.employee_code,
                relationship.status
            FROM employee_pos pos

            INNER JOIN employees bqp
                ON bqp.id = pos.bqp

            INNER JOIN employees reporting
                ON reporting.id = pos.reporting_manager

            INNER JOIN employees relationship
                ON relationship.id = pos.relationship_manager

            WHERE pos.bqp = ?
              AND pos.reporting_manager = ?
              AND pos.status = ?
              AND bqp.status = ?
              AND bqp.is_bqp = 'Yes'
              AND reporting.status = ?
              AND relationship.status = ?

            ORDER BY relationship.name ASC
            `,
            [
                Number(bqpId),
                Number(managerId),
                status,
                status,
                status,
                status
            ]
        );

        return rows;
    }

    /**
     * Get POSPs by selected hierarchy.
     */
    static async getPospByRelationshipManager(
        bqpId,
        managerId,
        relationshipId,
        status,
        veri = null
    ) {
        let query = `
            SELECT
                id,
                name,
                pos_code,
                status,
                veri
            FROM employee_pos
            WHERE bqp = ?
              AND reporting_manager = ?
              AND relationship_manager = ?
              AND status = ?
        `;

        const params = [
            Number(bqpId),
            Number(managerId),
            Number(relationshipId),
            status
        ];

        if (veri !== null) {
            query += ` AND veri = ?`;
            params.push(veri);
        }

        query += ` ORDER BY name ASC`;

        const [rows] = await db.query(query, params);

        return rows;
    }

    /**
     * Get references by POSP ID.
     */
    static async getReferencesByPospId(pospId) {
        const [rows] = await db.query(
            `
            ${referenceSelect}
            WHERE er.pos_id = ?
            ORDER BY er.created_at DESC
            `,
            [Number(pospId)]
        );

        return rows;
    }
}

export default BqpModel;