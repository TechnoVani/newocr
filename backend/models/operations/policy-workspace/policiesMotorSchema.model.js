import db from "../../../config/database.js";

const tableExists = async tableName => {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        [tableName]
    );
    return Number(rows[0]?.count) > 0;
};

const ensurePolicyTableName = async () => {
    const hasMotorTable = await tableExists("policies_motor");
    const hasOldTable = await tableExists("policies");

    if (hasMotorTable) return;

    if (hasOldTable) {
        await db.query("RENAME TABLE `policies` TO `policies_motor`");
    }
};

const getPolicyColumns = async () => {
    const [columns] = await db.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'policies_motor'`
    );
    return new Map(columns.map((column) => [column.COLUMN_NAME, column]));
};

const renamePolicyColumn = async (columnsByName, oldName, newName, definition) => {
    const hasOld = columnsByName.has(oldName);
    const hasNew = columnsByName.has(newName);

    if (hasOld && !hasNew) {
        await db.query(`ALTER TABLE policies_motor CHANGE COLUMN \`${oldName}\` \`${newName}\` ${definition}`);
        columnsByName.delete(oldName);
        columnsByName.set(newName, { COLUMN_NAME: newName });
        return;
    }

    if (hasOld && hasNew) {
        await db.query(
            `UPDATE policies_motor
             SET \`${newName}\` = COALESCE(NULLIF(\`${newName}\`, ''), \`${oldName}\`)
             WHERE \`${oldName}\` IS NOT NULL`
        );
        await db.query(`ALTER TABLE policies_motor DROP COLUMN \`${oldName}\``);
        columnsByName.delete(oldName);
    }
};

export const ensurePoliciesMotorSchema = async () => {
    await ensurePolicyTableName();

    const columnsByName = await getPolicyColumns();

    await renamePolicyColumn(columnsByName, "policy_type", "product_type", "VARCHAR(100) DEFAULT NULL");
    await renamePolicyColumn(columnsByName, "vehicle_category", "categories", "VARCHAR(100) DEFAULT NULL");
    await renamePolicyColumn(columnsByName, "commercial_vehicle_type", "classification", "VARCHAR(100) DEFAULT NULL");

    if (columnsByName.has("sub_type")) {
        await db.query("ALTER TABLE policies_motor DROP COLUMN `sub_type`");
        columnsByName.delete("sub_type");
    }

    const seatingCapacity = columnsByName.get("seating_capacity");
    const rto = columnsByName.get("rto");
    const ncb = columnsByName.get("ncb");
    const premiumColumns = ["first_year_od", "first_year_tp"];

    for (const columnName of ["product_type", "categories", "classification"]) {
        if (!columnsByName.has(columnName)) {
            throw new Error(`policies_motor.${columnName} column is missing`);
        }
    }

    if (!seatingCapacity) {
        throw new Error("policies_motor.seating_capacity column is missing");
    }

    if (
        String(seatingCapacity.DATA_TYPE).toLowerCase() !== "varchar" ||
        Number(seatingCapacity.CHARACTER_MAXIMUM_LENGTH) < 30
    ) {
        await db.query(
            "ALTER TABLE policies_motor MODIFY COLUMN seating_capacity VARCHAR(30) DEFAULT NULL"
        );
    }

    if (!columnsByName.has("insurer_branch")) {
        await db.query(
            "ALTER TABLE policies_motor ADD COLUMN insurer_branch VARCHAR(255) DEFAULT NULL AFTER categories"
        );
    }

    if (!rto) {
        await db.query(
            "ALTER TABLE policies_motor ADD COLUMN rto VARCHAR(10) DEFAULT NULL AFTER registration_number"
        );
    } else if (
        String(rto.DATA_TYPE).toLowerCase() !== "varchar" ||
        Number(rto.CHARACTER_MAXIMUM_LENGTH) < 10
    ) {
        await db.query(
            "ALTER TABLE policies_motor MODIFY COLUMN rto VARCHAR(10) DEFAULT NULL"
        );
    }

    if (!ncb) {
        await db.query(
            "ALTER TABLE policies_motor ADD COLUMN ncb VARCHAR(30) DEFAULT NULL AFTER classification"
        );
    } else if (
        String(ncb.DATA_TYPE).toLowerCase() !== "varchar" ||
        Number(ncb.CHARACTER_MAXIMUM_LENGTH) < 30
    ) {
        await db.query(
            "ALTER TABLE policies_motor MODIFY COLUMN ncb VARCHAR(30) DEFAULT NULL"
        );
    }

    for (const columnName of premiumColumns) {
        const column = columnsByName.get(columnName);
        if (!column) {
            throw new Error(`policies_motor.${columnName} column is missing`);
        }
        if (String(column.DATA_TYPE).toLowerCase() !== "decimal") {
            await db.query(
                `UPDATE policies_motor
                 SET ${columnName} = NULL
                 WHERE ${columnName} IS NOT NULL
                   AND TRIM(${columnName}) NOT REGEXP '^-?[0-9]+([.][0-9]+)?$'`
            );
            await db.query(
                `ALTER TABLE policies_motor MODIFY COLUMN ${columnName} DECIMAL(15,2) DEFAULT NULL`
            );
        }
    }
};
