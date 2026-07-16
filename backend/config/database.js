import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const requiredDatabaseVariables = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingDatabaseVariables = requiredDatabaseVariables.filter(
    variableName => !String(process.env[variableName] || "").trim()
);

if (missingDatabaseVariables.length > 0) {
    throw new Error(
        `Missing required database environment variables: ${missingDatabaseVariables.join(", ")}`
    );
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("MySQL Database Connected Successfully");
        
        // Auto-create set_count table if it doesn't exist
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS set_count (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pos_id VARCHAR(50) NOT NULL,
                ref_id VARCHAR(50) NOT NULL,
                business_type VARCHAR(50),
                insurance_company VARCHAR(150),
                vehicle_category VARCHAR(100),
                insured_name VARCHAR(150) NOT NULL,
                contact VARCHAR(20),
                email VARCHAR(100),
                first_year_od DECIMAL(15,2) DEFAULT 0.00,
                first_year_tp DECIMAL(15,2) DEFAULT 0.00,
                total_od DECIMAL(15,2) DEFAULT 0.00,
                total_tp DECIMAL(15,2) DEFAULT 0.00,
                irda_od DECIMAL(15,2) DEFAULT 0.00,
                irda_tp DECIMAL(15,2) DEFAULT 0.00,
                irda_net DECIMAL(15,2) DEFAULT 0.00,
                pos_od DECIMAL(15,2) DEFAULT 0.00,
                pos_tp DECIMAL(15,2) DEFAULT 0.00,
                pos_net DECIMAL(15,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `;
        await connection.query(createTableQuery);
        console.log("MySQL set_count table verified/created successfully");
        
        connection.release();
    } catch (error) {
        console.error("Database Connection Failed:", error.message);
        throw error;
    }
};

export default pool;
