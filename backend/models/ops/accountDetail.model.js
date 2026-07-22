import db from "../../config/database.js";

class AccountDetailModel {
    static async findByEmployeeId(employeeId) {
        const [rows] = await db.query(
            `SELECT id, employee_id, account_holder_name, bank_name, account_number,
                    ifsc_code, branch_name, account_type, created_at, updated_at
             FROM account_details
             WHERE employee_id = ?
             ORDER BY created_at DESC, id DESC`,
            [employeeId]
        );
        return rows;
    }

    static async findOwnedById(id, employeeId) {
        const [rows] = await db.query(
            `SELECT id, employee_id, account_holder_name, bank_name, account_number,
                    ifsc_code, branch_name, account_type, created_at, updated_at
             FROM account_details
             WHERE id = ? AND employee_id = ?
             LIMIT 1`,
            [id, employeeId]
        );
        return rows[0];
    }

    static async create(employeeId, data) {
        const [result] = await db.query(
            `INSERT INTO account_details
                (employee_id, pos_id, account_holder_name, bank_name, account_number,
                 ifsc_code, branch_name, account_type)
             VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
            [
                employeeId,
                data.account_holder_name,
                data.bank_name,
                data.account_number,
                data.ifsc_code,
                data.branch_name || null,
                data.account_type || null
            ]
        );
        return this.findOwnedById(result.insertId, employeeId);
    }

}

export default AccountDetailModel;
