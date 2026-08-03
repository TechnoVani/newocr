import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { readEnv } from "./config/env.js";

const seedAuth = async () => {
    try {
        const required = ["DB_USER", "DB_NAME"];
        const missing = required.filter(key => !readEnv(key));
        const databaseHost = readEnv("DB_HOST");
        if (!databaseHost) missing.unshift("DB_HOST");
        if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);
        console.log("Connecting to MySQL server for seeding auth...");
        const connection = await mysql.createConnection({
            host: databaseHost,
            user: readEnv("DB_USER"),
            password: readEnv("DB_PASSWORD"),
            port: Number(readEnv("DB_PORT", "3306"))
        });

        const databaseName = String(process.env.DB_NAME).replace(/`/g, "``");
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
        await connection.query(`USE \`${databaseName}\`;`);

        // Create users table if not exists (in case init_db.js hasn't been run)
        console.log("Ensuring users table exists...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE,
                contact VARCHAR(20) UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'Employee',
                permissions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);

        // Check if the default employee user already exists
        const [rows] = await connection.query(
            "SELECT * FROM users WHERE email = ? OR contact = ?",
            ["employee@gmail.com", "9876543210"]
        );

        if (rows.length > 0) {
            console.log("Default employee user already seeded.");
            await connection.end();
            process.exit(0);
        }

        console.log("Hashing password for default user...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123456", salt);

        console.log("Inserting default employee user...");
        const query = `
            INSERT INTO users (name, email, contact, password, role, permissions)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [
            "Employee Name",
            "employee@gmail.com",
            "9876543210",
            hashedPassword,
            "Employee",
            JSON.stringify(["read_policies", "create_policies", "update_policies"]) // default permissions
        ];

        await connection.query(query, values);
        console.log("\nSuccess! Default Employee user has been seeded into database.");
        console.log("Email: employee@gmail.com");
        console.log("Contact: 9876543210");
        console.log("Password: 123456");

        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error("\nSeeding failed:", err.message);
        process.exit(1);
    }
};

seedAuth();
