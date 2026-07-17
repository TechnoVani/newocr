import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2/promise";
import fs from "fs/promises";

const runInit = async () => {
    try {
        console.log("Connecting to MySQL database server...");
        // Connect to mysql server
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            port: Number(process.env.DB_PORT || 3306)
        });

        console.log("Creating database policy_db (if not exists)...");
        await connection.query("CREATE DATABASE IF NOT EXISTS policy_db;");
        await connection.query("USE policy_db;");

        console.log("Dropping outdated policies table to clear structural conflicts...");
        await connection.query("DROP TABLE IF EXISTS policies;");

        console.log("Reading updated schema.sql configurations...");
        const schemaSql = await fs.readFile("schema.sql", "utf-8");

        console.log("Executing schema queries...");
        // Split by semicolon to run queries individually
        const queries = schemaSql
            .split(";")
            .map(q => q.trim())
            .filter(q => q.length > 0);

        for (const query of queries) {
            if (query.toUpperCase().includes("CREATE TABLE") || query.toUpperCase().includes("CREATE DATABASE") || query.toUpperCase().includes("USE")) {
                await connection.query(query);
            }
        }

        console.log("\nDatabase and Policies table initialized successfully with correct column fields!");
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error("\nDatabase initialization failed:", err.message);
        process.exit(1);
    }
};

runInit();
