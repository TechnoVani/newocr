// src/models/user.model.js
import db from "../config/database.js";
import bcrypt from "bcryptjs";

class UserModel {
    /**
     * Finds a user by email or mobile
     */
    static async findByEmailOrContact(identifier) {
        const query = `
            SELECT * FROM employees 
            WHERE personal_email = ? OR mobile = ?
        `;
        const [rows] = await db.query(query, [identifier, identifier]);
        return rows[0];
    }

    /**
     * Finds a user by ID (excludes password)
     */
    static async findById(id) {
        const query = `
            SELECT 
                e.id, e.employee_code, e.name, e.user_type, e.gender, e.date_of_birth, e.personal_email,
                e.aadhaar_number, e.pan_number, e.mobile, e.emergency_contact, 
                e.current_address, e.state, e.city, e.pin_code, 
                e.joining_date, e.relieving_date, 
                e.father_name, e.father_occupation, e.mother_name, e.marital_status, 
                e.category, e.qualification, e.year_of_passing,
                e.document_status,
                des.designation_name AS designation,
                dep.department_name AS department,
                bqp.name AS bqp,
                rep.name AS reporting_manager,
                rel.name AS relationship_manager,
                br.branch_name AS reporting_branch
            FROM employees e
            LEFT JOIN designations des ON e.designation = des.id
            LEFT JOIN departments dep ON e.department = dep.id
            LEFT JOIN employees bqp ON e.bqp = bqp.id
            LEFT JOIN employees rep ON e.reporting_manager = rep.id
            LEFT JOIN employees rel ON e.relationship_manager = rel.id
            LEFT JOIN our_branch br ON e.reporting_branch = br.id
            WHERE e.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    /**
     * Creates a new user with a hashed password
     * @param {Object} userData - { name, personal_email, mobile, password }
     * @returns {Promise<Object>} - The newly created user (without password)
     */
    static async create(userData) {
        const { name, personal_email, mobile, password } = userData;

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO employees (name, personal_email, mobile, password)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [name, personal_email, mobile, hashedPassword]);

        // Return the created user (without password)
        const newUser = await this.findById(result.insertId);
        return newUser;
    }

    /**
     * Updates profile fields for an employee and sets document_status = '1'
     * @param {number} id - Employee ID
     * @param {Object} data - Fields to update
     */
    static async updateProfile(id, data) {
        const query = `
            UPDATE employees 
            SET 
                gender = ?, 
                date_of_birth = ?, 
                personal_email = ?, 
                mobile = ?, 
                emergency_contact = ?, 
                marital_status = ?, 
                category = ?, 
                father_name = ?, 
                father_occupation = ?, 
                mother_name = ?, 
                current_address = ?, 
                city = ?, 
                state = ?, 
                pin_code = ?, 
                aadhaar_number = ?, 
                pan_number = ?, 
                qualification = ?, 
                year_of_passing = ?,
                document_status = '1'
            WHERE id = ?
        `;
        const params = [
            data.gender || null,
            data.date_of_birth || null,
            data.personal_email || null,
            data.mobile || null,
            data.emergency_contact || null,
            data.marital_status || null,
            data.category || null,
            data.father_name || null,
            data.father_occupation || null,
            data.mother_name || null,
            data.current_address || null,
            data.city || null,
            data.state || null,
            data.pin_code || null,
            data.aadhaar_number || null,
            data.pan_number || null,
            data.qualification || null,
            data.year_of_passing || null,
            id
        ];
        await db.query(query, params);
        return await this.findById(id);
    }

    static async ensurePasswordResetTable() {
        await db.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                employee_id INT UNSIGNED NOT NULL,
                token_hash CHAR(64) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_password_reset_employee (employee_id),
                INDEX idx_password_reset_expiry (expires_at)
            )
        `);
    }

    static async createPasswordResetToken(employeeId, tokenHash, expiresAt) {
        await this.ensurePasswordResetTable();
        await db.query(
            "DELETE FROM password_reset_tokens WHERE employee_id = ? OR expires_at <= NOW()",
            [employeeId]
        );
        await db.query(
            "INSERT INTO password_reset_tokens (employee_id, token_hash, expires_at) VALUES (?, ?, ?)",
            [employeeId, tokenHash, expiresAt]
        );
    }

    static async deletePasswordResetToken(tokenHash) {
        await this.ensurePasswordResetTable();
        await db.query("DELETE FROM password_reset_tokens WHERE token_hash = ?", [tokenHash]);
    }

    static async hasValidPasswordResetToken(tokenHash) {
        await this.ensurePasswordResetTable();
        const [rows] = await db.query(
            "SELECT id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > NOW() LIMIT 1",
            [tokenHash]
        );
        return rows.length > 0;
    }

    static async resetPasswordWithToken(tokenHash, hashedPassword) {
        await this.ensurePasswordResetTable();
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [tokens] = await connection.query(
                "SELECT employee_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > NOW() LIMIT 1 FOR UPDATE",
                [tokenHash]
            );
            if (!tokens.length) {
                await connection.rollback();
                return false;
            }

            const employeeId = tokens[0].employee_id;
            await connection.query("UPDATE employees SET password = ? WHERE id = ?", [hashedPassword, employeeId]);
            await connection.query("DELETE FROM password_reset_tokens WHERE employee_id = ?", [employeeId]);
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

export default UserModel;
