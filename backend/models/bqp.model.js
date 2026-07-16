import db from "../config/database.js";

class BqpModel {
    /**
     * Get distinct BQPs from employees table (self-join on bqp field)
     */
    static async getAll() {
        const query = `
            SELECT DISTINCT bqp.id, bqp.name, bqp.employee_code
            FROM employee_pos pos
            INNER JOIN employees bqp ON bqp.id = pos.bqp
            WHERE pos.status = 'Active'
            ORDER BY bqp.name ASC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    /**
     * Get reporting managers for a given BQP ID
     * (employees whose 'reporting_manager' = bqpId)
     */
    static async getReportingManagersByBqp(bqpId) {
        const query = `
            SELECT DISTINCT manager.id, manager.name, manager.employee_code
            FROM employee_pos pos
            INNER JOIN employees manager ON manager.id = pos.reporting_manager
            WHERE pos.bqp = ? AND pos.status = 'Active'
            ORDER BY manager.name ASC
        `;
        const [rows] = await db.query(query, [bqpId]);
        return rows;
    }

    /**
     * Get relationship managers for a given reporting manager ID
     * (employees whose 'relationship_manager' = reportingId)
     */
    static async getRelationshipManagersByManager(reportingId) {
        const query = `
            SELECT DISTINCT relationship.id, relationship.name, relationship.employee_code
            FROM employee_pos pos
            INNER JOIN employees relationship ON relationship.id = pos.relationship_manager
            WHERE pos.reporting_manager = ? AND pos.status = 'Active'
            ORDER BY relationship.name ASC
        `;
        const [rows] = await db.query(query, [reportingId]);
        return rows;
    }

    static async getPospByRelationshipManager(relationshipId) {
        const query = `
        SELECT DISTINCT id, name, pos_code
        FROM employee_pos
        WHERE relationship_manager = ? AND status = 'Active'
        ORDER BY name ASC
        `;
        const [rows] = await db.query(query, [relationshipId]);
        return rows;
    }
}

export default BqpModel;
