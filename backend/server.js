import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB } from "./config/database.js";

import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import ocrRoutes from "./routes/ocr.routes.js";
import policyRoutes from "./routes/policy.routes.js";
import documentRoutes from "./routes/document.routes.js";

import bqpRoutes from "./routes/bqp.routes.js";
import referenceRoutes from "./routes/reference.routes.js";
import setCountRoutes from "./routes/setcount.routes.js";

import authMiddleware from "./middleware/auth.middleware.js";
import policyFileAccessMiddleware from "./middleware/policyFileAccess.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";
import { getAllowedOrigins, normalizeOrigin } from "./config/origins.js";

dotenv.config();

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
    policyFileAccessMiddleware,
    express.static("public/uploads")
);

// Public Routes
app.get("/api/health", (req, res) => {
    res.status(databaseReady ? 200 : 503).json({
        success: databaseReady,
        service: "operation-api",
        database: databaseReady ? "connected" : "unavailable"
    });
});

app.use("/api/auth", authRoutes);

// Everything mounted under /api after this line requires a valid JWT.
// Keep intentionally public routes (login/register/password reset) above it.
app.use("/api", authMiddleware);

// Hierarchy and reference dropdowns must always reflect the latest database rows.
app.use(
    ["/api/bqp", "/api/reporting", "/api/relationships", "/api/posp", "/api/references"],
    (req, res, next) => {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        next();
    }
);

app.use("/api/upload", uploadRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/setcount", setCountRoutes);

// Protected cascade dropdown endpoints
app.use("/api", bqpRoutes);
app.use("/api/references", referenceRoutes);



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
