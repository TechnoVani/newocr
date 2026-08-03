import mysql from "mysql2/promise";
import { readEnv } from "./env.js";

const databaseHost = readEnv("DB_HOST");
const requiredDatabaseVariables = ["DB_USER", "DB_NAME"];
const missingDatabaseVariables = requiredDatabaseVariables.filter(
    variableName => !readEnv(variableName)
);
if (!databaseHost) missingDatabaseVariables.unshift("DB_HOST");

if (missingDatabaseVariables.length > 0) {
    throw new Error(
        `Missing required database environment variables: ${missingDatabaseVariables.join(", ")}`
    );
}

const pool = mysql.createPool({
    host: databaseHost,
    user: readEnv("DB_USER"),
    password: readEnv("DB_PASSWORD"),
    database: readEnv("DB_NAME"),
    port: Number(readEnv("DB_PORT", "3306")),
    connectTimeout: Number(readEnv("DB_CONNECT_TIMEOUT_MS", "10000")),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    waitForConnections: true,
    connectionLimit: Number(readEnv("DB_CONNECTION_LIMIT", "5")),
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
