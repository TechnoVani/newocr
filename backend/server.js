import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import "./config/env.js";
import { connectDB, checkDB } from "./config/database.js";
import { ensureAccountSchema } from "./models/accounts/accountSchema.model.js";
import { ensurePolicySchema } from "./models/ops/policySchema.model.js";

import authRoutes from "./routes/auth.routes.js";
import operationsRoutes from "./routes/ops/index.routes.js";
import accountsRoutes from "./routes/accounts/index.routes.js";
import departmentDashboardRoutes from "./routes/departments/departmentDashboard.routes.js";

import authMiddleware from "./middleware/auth.middleware.js";
import requireDepartmentAccess from "./middleware/departmentAccess.middleware.js";
import policyFileAccessMiddleware from "./middleware/policyFileAccess.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";
import { getAllowedOrigins, normalizeOrigin } from "./config/origins.js";

const app = express();
let databaseReady = false;

const configuredOrigins = getAllowedOrigins();

if (configuredOrigins.length === 0) {
    throw new Error("CORS_ORIGINS or FRONTEND_URL must be configured");
}

const allowedOrigins = new Set(configuredOrigins);
const corsOptions = {
    origin(origin, callback) {
        // Requests without Origin are server-to-server, health checks, or CLI clients.
        if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
            return callback(null, true);
        }
        const error = new Error(`CORS origin is not allowed: ${origin}`);
        error.statusCode = 403;
        return callback(error);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.use(
    "/uploads",
    authMiddleware,
    requireDepartmentAccess("operations"),
    policyFileAccessMiddleware,
    express.static("public/uploads")
);

// Public Routes
app.get("/api/health", async (req, res) => {
    try {
        await checkDB();
        databaseReady = true;
    } catch (error) {
        databaseReady = false;
        console.error("Database health check failed:", error.code || error.message);
    }

    return res.status(databaseReady ? 200 : 503).json({
        success: databaseReady,
        service: "operation-api",
        database: databaseReady ? "connected" : "unavailable"
    });
});

app.use("/api/auth", authRoutes);

// Hierarchy and reference dropdowns must always reflect the latest database rows.
app.use(
    [
        "/api/operations/bqp",
        "/api/operations/reporting",
        "/api/operations/relationships",
        "/api/operations/posp",
        "/api/operations/references"
    ],
    (req, res, next) => {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        next();
    }
);

app.use(
    "/api/operations",
    authMiddleware,
    requireDepartmentAccess("operations"),
    operationsRoutes
);

app.use(
    "/api/accounts",
    authMiddleware,
    requireDepartmentAccess("accounts"),
    accountsRoutes
);

app.use("/api/departments", authMiddleware, departmentDashboardRoutes);



// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
const publicApiUrl = `${normalizeOrigin(String(process.env.API_PUBLIC_URL || "").split(",")[0])}/api`;

const startServer = () => {
    const server = app.listen(PORT, async () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📡 API: ${publicApiUrl}`);
        console.log(`🌐 Allowed frontend origins: ${[...allowedOrigins].join(", ")}`);

        try {
            await connectDB();
            await ensureAccountSchema();
            await ensurePolicySchema();
            databaseReady = true;
        } catch (error) {
            databaseReady = false;
            console.error("❌ API started, but the database is unavailable:", error.message);
        }
    });

    server.on("error", error => {
        console.error("❌ Failed to start HTTP server:", error.message);
        process.exitCode = 1;
    });

    return server;
};

startServer();
