import mysql from "mysql2/promise";
import "./env.js";

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
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export const connectDB = async () => {
    const connection = await pool.getConnection();
    try {
        await connection.query("SELECT 1");
        console.log("MySQL Database Connected Successfully");
        return true;
    } catch (error) {
        console.error("Database Connection Failed:", error.message);
        throw error;
    } finally {
        connection.release();
    }
};

export const checkDB = async () => {
    await pool.query("SELECT 1");
    return true;
};

export default pool;
