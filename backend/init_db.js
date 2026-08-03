import mysql from "mysql2/promise";
import fs from "fs/promises";
import { readEnv } from "./config/env.js";

const runInit = async () => {
    try {
        const required = ["DB_USER", "DB_NAME"];
        const missing = required.filter(key => !readEnv(key));
        const databaseHost = readEnv("DB_HOST");
        if (!databaseHost) missing.unshift("DB_HOST");
        if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);
        console.log("Connecting to MySQL database server...");
        // Connect to mysql server
        const connection = await mysql.createConnection({
            host: databaseHost,
            user: readEnv("DB_USER"),
            password: readEnv("DB_PASSWORD"),
            port: Number(readEnv("DB_PORT", "3306"))
        });

        const databaseName = String(process.env.DB_NAME).replace(/`/g, "``");
        console.log(`Creating database ${process.env.DB_NAME} (if not exists)...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
        await connection.query(`USE \`${databaseName}\`;`);

        console.log("Dropping outdated policies_motor table to clear structural conflicts...");
        await connection.query("DROP TABLE IF EXISTS policies_motor;");

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

        console.log("\nDatabase and policies_motor table initialized successfully with correct column fields!");
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error("\nDatabase initialization failed:", err.message);
        process.exit(1);
    }
};

runInit();
