import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const test = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "notion",
            port: Number(process.env.DB_PORT || 3306)
        });
        console.log("Connected! DB Name:", process.env.DB_NAME);
        const [rows] = await connection.query("SHOW TABLES;");
        console.log("Tables:", rows);
        await connection.end();
    } catch (err) {
        console.error("Error:", err.message);
    }
};
test();
