import db from "../config/database.js";

const STATUS = {
    ACTIVE: "Active"
};

const BQP_FLAG = {
    YES: "Yes"
};

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
        ON ebqp.id = er.bqp_id

    LEFT JOIN employees erep
        ON erep.id = er.reporting_id

    LEFT JOIN employees erel
        ON erel.id = er.relationship_id

    LEFT JOIN employee_pos epos
        ON epos.id = er.pos_id
`;

class ReferenceModel {
    /**
     * Validate hierarchy:
     *
     * bqp_id           -> employee_pos.bqp
     * reporting_id     -> employee_pos.reporting_manager
     * relationship_id  -> employee_pos.relationship_manager
     * pos_id            -> employee_pos.id
     *
     * BQP, reporting manager and relationship manager details
     * are validated from the employees table.
     */
    static async isValidHierarchy({
        bqp_id,
        reporting_id,
        relationship_id,
        pos_id
    }) {
        const [rows] = await db.query(
            `
            SELECT pos.id
            FROM employee_pos pos

            INNER JOIN employees bqp
                ON bqp.id = pos.bqp
                AND bqp.status = ?
                AND bqp.is_bqp = ?

            INNER JOIN employees reporting
                ON reporting.id = pos.reporting_manager
                AND reporting.status = ?

            INNER JOIN employees relationship
                ON relationship.id = pos.relationship_manager
                AND relationship.status = ?

            WHERE pos.id = ?
              AND pos.bqp = ?
              AND pos.reporting_manager = ?
              AND pos.relationship_manager = ?
              AND pos.status = ?

            LIMIT 1
            `,
            [
                STATUS.ACTIVE,
                BQP_FLAG.YES,
                STATUS.ACTIVE,
                STATUS.ACTIVE,

                Number(pos_id),
                Number(bqp_id),
                Number(reporting_id),
                Number(relationship_id),
                STATUS.ACTIVE
            ]
        );

        return rows.length > 0;
    }

    /**
     * Check duplicate reference while creating.
     */
    static async duplicateExists(
        posId,
        refName,
        refMobile
    ) {
        const name = String(refName || "").trim();
        const mobile = String(refMobile || "").trim() || null;

        const [rows] = await db.query(
            `
            SELECT id
            FROM employee_references

            WHERE pos_id = ?
              AND LOWER(TRIM(ref_name)) = LOWER(?)
              AND (
                    ref_mobile = ?
                    OR (
                        ref_mobile IS NULL
                        AND ? IS NULL
                    )
                  )

            LIMIT 1
            `,
            [
                Number(posId),
                name,
                mobile,
                mobile
            ]
        );

        return rows.length > 0;
    }

    /**
     * Check duplicate reference while updating.
     * Current record ID is excluded.
     */
    static async duplicateExistsForUpdate(
        id,
        posId,
        refName,
        refMobile
    ) {
        const name = String(refName || "").trim();
        const mobile = String(refMobile || "").trim() || null;

        const [rows] = await db.query(
            `
            SELECT id
            FROM employee_references

            WHERE pos_id = ?
              AND LOWER(TRIM(ref_name)) = LOWER(?)
              AND (
                    ref_mobile = ?
                    OR (
                        ref_mobile IS NULL
                        AND ? IS NULL
                    )
                  )
              AND id <> ?

            LIMIT 1
            `,
            [
                Number(posId),
                name,
                mobile,
                mobile,
                Number(id)
            ]
        );

        return rows.length > 0;
    }

    /**
     * Get all references.
     */
    static async findAll() {
        const [rows] = await db.query(
            `
            ${referenceSelect}
            ORDER BY er.created_at DESC
            `
        );

        return rows;
    }

    /**
     * Get references by POSP ID.
     */
    static async findByPospId(posId) {
        const [rows] = await db.query(
            `
            ${referenceSelect}

            WHERE er.pos_id = ?

            ORDER BY er.created_at DESC
            `,
            [Number(posId)]
        );

        return rows;
    }

    /**
     * Get a single reference by reference ID.
     */
    static async findById(id) {
        const [rows] = await db.query(
            `
            ${referenceSelect}

            WHERE er.id = ?

            LIMIT 1
            `,
            [Number(id)]
        );

        return rows[0] || null;
    }

    /**
     * Create a new reference.
     *
     * The insert will only happen when the selected hierarchy
     * exists in employee_pos.
     */
    static async create(data) {
        const validHierarchy = await this.isValidHierarchy({
            bqp_id: data.bqp_id,
            reporting_id: data.reporting_id,
            relationship_id: data.relationship_id,
            pos_id: data.pos_id
        });

        if (!validHierarchy) {
            return 0;
        }

        const refName = String(data.ref_name || "").trim();
        const refMobile =
            String(data.ref_mobile || "").trim() || null;

        const [result] = await db.query(
            `
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
            `,
            [
                Number(data.bqp_id),
                Number(data.reporting_id),
                Number(data.relationship_id),
                Number(data.pos_id),
                refName,
                refMobile,
                Number(data.created_by)
            ]
        );

        return result.insertId;
    }

    /**
     * Update reference with hierarchy validation.
     *
     * First:
     * Validate selected BQP, reporting manager,
     * relationship manager and POSP from employee_pos.
     *
     * Then:
     * Update employee_references.
     */
    static async update(id, data) {
        const validHierarchy = await this.isValidHierarchy({
            bqp_id: data.bqp_id,
            reporting_id: data.reporting_id,
            relationship_id: data.relationship_id,
            pos_id: data.pos_id
        });

        if (!validHierarchy) {
            return 0;
        }

        const refName = String(data.ref_name || "").trim();
        const refMobile =
            String(data.ref_mobile || "").trim() || null;

        const [result] = await db.query(
            `
            UPDATE employee_references

            SET
                bqp_id = ?,
                reporting_id = ?,
                relationship_id = ?,
                pos_id = ?,
                ref_name = ?,
                ref_mobile = ?

            WHERE id = ?
            `,
            [
                Number(data.bqp_id),
                Number(data.reporting_id),
                Number(data.relationship_id),
                Number(data.pos_id),
                refName,
                refMobile,
                Number(id)
            ]
        );

        return result.affectedRows;
    }

    /**
     * Update reference directly using employee_pos hierarchy.
     *
     * This method performs hierarchy validation and update
     * in a single SQL query.
     */
    static async updateWithHierarchy(id, data) {
        const refName = String(data.ref_name || "").trim();
        const refMobile =
            String(data.ref_mobile || "").trim() || null;

        const [result] = await db.query(
            `
            UPDATE employee_references er

            INNER JOIN employee_pos pos
                ON pos.id = ?
                AND pos.bqp = ?
                AND pos.reporting_manager = ?
                AND pos.relationship_manager = ?
                AND pos.status = ?

            INNER JOIN employees bqp
                ON bqp.id = pos.bqp
                AND bqp.status = ?
                AND bqp.is_bqp = ?

            INNER JOIN employees reporting
                ON reporting.id = pos.reporting_manager
                AND reporting.status = ?

            INNER JOIN employees relationship
                ON relationship.id = pos.relationship_manager
                AND relationship.status = ?

            SET
                er.bqp_id = pos.bqp,
                er.reporting_id = pos.reporting_manager,
                er.relationship_id = pos.relationship_manager,
                er.pos_id = pos.id,
                er.ref_name = ?,
                er.ref_mobile = ?

            WHERE er.id = ?
            `,
            [
                Number(data.pos_id),
                Number(data.bqp_id),
                Number(data.reporting_id),
                Number(data.relationship_id),

                STATUS.ACTIVE,
                STATUS.ACTIVE,
                BQP_FLAG.YES,
                STATUS.ACTIVE,
                STATUS.ACTIVE,

                refName,
                refMobile,
                Number(id)
            ]
        );

        return result.affectedRows;
    }

    /**
     * Check whether a reference exists.
     */
    static async exists(id) {
        const [rows] = await db.query(
            `
            SELECT id
            FROM employee_references

            WHERE id = ?

            LIMIT 1
            `,
            [Number(id)]
        );

        return rows.length > 0;
    }
}

export default ReferenceModel;