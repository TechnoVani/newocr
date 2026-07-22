import db from "../../config/database.js";

export const ensurePolicySchema = async () => {
    const [columns] = await db.query(
        `SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'policies'
           AND COLUMN_NAME = 'seating_capacity'
         LIMIT 1`
    );

    if (!columns.length) {
        throw new Error("policies.seating_capacity column is missing");
    }

    if (
        String(columns[0].DATA_TYPE).toLowerCase() !== "varchar" ||
        Number(columns[0].CHARACTER_MAXIMUM_LENGTH) < 30
    ) {
        await db.query(
            "ALTER TABLE policies MODIFY COLUMN seating_capacity VARCHAR(30) DEFAULT NULL"
        );
    }
};
