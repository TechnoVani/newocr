// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import morgan from "morgan";

// import { isProduction, mode, readEnv, readModeEnv } from "./config/env.js";
// import { connectDB, checkDB } from "./config/database.js";
// import { ensureAccountSchema } from "./models/accounts/accountSchema.model.js";
// import { ensurePoliciesMotorSchema } from "./features/policy-workspace/models/policiesMotorSchema.model.js";
// import { ensureDepartmentWorkflowSchema } from "./models/departments/departmentWorkflowSchema.model.js";
// import { ensureHrSchema } from "./models/human-resources/hrSchema.model.js";

// import authRoutes from "./routes/auth.routes.js";
// import operationsRoutes from "./routes/operations/index.routes.js";
// import accountsRoutes from "./routes/accounts/index.routes.js";
// import departmentDashboardRoutes from "./routes/departments/departmentDashboard.routes.js";
// import posManagementRoutes from "./routes/pos-management/index.routes.js";
// import humanResourcesRoutes from "./routes/human-resources/index.routes.js";

// import authMiddleware from "./middleware/auth.middleware.js";
// import requireDepartmentAccess, { requireAnyDepartmentAccess } from "./middleware/departmentAccess.middleware.js";
// import policyFileAccessMiddleware from "./middleware/policyFileAccess.middleware.js";
// import errorMiddleware from "./middleware/error.middleware.js";
// import { getAllowedOrigins, getPublicApiUrl, isAllowedOrigin } from "./config/origins.js";
// import { uploadStoragePath } from "./config/storagePaths.js";

// const app = express();
// let databaseReady = false;

// const configuredOrigins = getAllowedOrigins();
// if (!configuredOrigins.length) {
//     throw new Error("APP_URL must be configured");
// }

// const corsOptions = {
//     origin(origin, callback) {
//         // Requests without Origin are server-to-server, health checks, or CLI clients.
//         if (!origin || isAllowedOrigin(origin)) {
//             return callback(null, true);
//         }
//         const error = new Error(`CORS origin is not allowed: ${origin}`);
//         error.statusCode = 403;
//         return callback(error);
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
//     optionsSuccessStatus: 204,
//     maxAge: 86400
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

// app.use(express.json({ limit: "10mb" }));
// app.use(helmet());
// app.use(morgan("dev"));

// app.use(
//     "/uploads",
//     authMiddleware,
//     requireAnyDepartmentAccess("operations", "pos-management"),
//     policyFileAccessMiddleware,
//     express.static(uploadStoragePath)
// );

// // Public Routes
// app.get("/api/health", async (req, res) => {
//     try {
//         await checkDB();
//         databaseReady = true;
//     } catch (error) {
//         databaseReady = false;
//         console.error("Database health check failed:", error.code || error.message);
//     }

//     return res.status(databaseReady ? 200 : 503).json({
//         success: databaseReady,
//         service: "operation-api",
//         database: databaseReady ? "connected" : "unavailable",
//         policyUploadContract: "rc-sides-gst-v1"
//     });
// });

// app.use("/api/auth", authRoutes);

// // Hierarchy and reference dropdowns must always reflect the latest database rows.
// app.use(
//     [
//         "/api/operations/bqp",
//         "/api/operations/reporting",
//         "/api/operations/relationships",
//         "/api/operations/posp",
//         "/api/operations/references"
//     ],
//     (req, res, next) => {
//         res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
//         res.setHeader("Pragma", "no-cache");
//         res.setHeader("Expires", "0");
//         next();
//     }
// );

// app.use(
//     "/api/operations",
//     authMiddleware,
//     requireDepartmentAccess("operations"),
//     operationsRoutes
// );

// app.use(
//     "/api/pos-management",
//     authMiddleware,
//     requireDepartmentAccess("pos-management"),
//     posManagementRoutes
// );

// app.use(
//     "/api/accounts",
//     authMiddleware,
//     requireDepartmentAccess("accounts"),
//     accountsRoutes
// );

// app.use(
//     "/api/departments/human-resources",
//     authMiddleware,
//     requireDepartmentAccess("human-resources"),
//     humanResourcesRoutes
// );

// app.use("/api/departments", authMiddleware, departmentDashboardRoutes);



// // Error handling middleware
// app.use(errorMiddleware);

// const PORT = Number(readEnv("PORT", "5000"));
// if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
//     throw new Error("PORT must be an integer between 1 and 65535");
// }
// const publicApiUrl = getPublicApiUrl();

// const startServer = () => {
//     const server = app.listen(PORT, async () => {
//         console.log("✅ Server listening");
//         console.log(`⚙️ Environment: ${mode}`);
//         console.log(`📡 API: ${publicApiUrl}`);
//         console.log(`🌐 Allowed frontend origins: ${configuredOrigins.join(", ")}`);
//         if (!isProduction && readModeEnv("ALLOW_PRIVATE_NETWORK_ORIGINS").toLowerCase() === "true") {
//             console.log("🧪 LAN testing enabled for private IPv4 origins matching the configured frontend URL");
//         }

//         try {
//             await connectDB();
//             await ensurePoliciesMotorSchema();
//             await ensureAccountSchema();
//             await ensureDepartmentWorkflowSchema();
//             await ensureHrSchema();
//             databaseReady = true;
//         } catch (error) {
//             databaseReady = false;
//             console.error("❌ API started, but the database is unavailable:", error.message);
//         }
//     });

//     server.on("error", error => {
//         console.error("❌ Failed to start HTTP server:", error.message);
//         process.exitCode = 1;
//     });

//     return server;
// };

// startServer();


import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { isProduction, mode, readEnv, readModeEnv } from "./config/env.js";
import { connectDB, checkDB } from "./config/database.js";
import { ensureAccountSchema } from "./models/accounts/accountSchema.model.js";
import { ensurePoliciesMotorSchema } from "./features/policy-workspace/models/policiesMotorSchema.model.js";
import { ensureDepartmentWorkflowSchema } from "./models/departments/departmentWorkflowSchema.model.js";
import { ensureHrSchema } from "./models/human-resources/hrSchema.model.js";

import authRoutes from "./routes/auth.routes.js";
import operationsRoutes from "./routes/operations/index.routes.js";
import accountsRoutes from "./routes/accounts/index.routes.js";
import departmentDashboardRoutes from "./routes/departments/departmentDashboard.routes.js";
import posManagementRoutes from "./routes/pos-management/index.routes.js";
import humanResourcesRoutes from "./routes/human-resources/index.routes.js";
import setCommRoutes from "./routes/operations/setcomm.routes.js";

import authMiddleware from "./middleware/auth.middleware.js";
import requireDepartmentAccess, { requireAnyDepartmentAccess } from "./middleware/departmentAccess.middleware.js";
import policyFileAccessMiddleware from "./middleware/policyFileAccess.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";
import { getAllowedOrigins, getPublicApiUrl, isAllowedOrigin } from "./config/origins.js";
import { uploadStoragePath } from "./config/storagePaths.js";

const app = express();
let databaseReady = false;

const configuredOrigins = getAllowedOrigins();
if (!configuredOrigins.length) {
    throw new Error("APP_URL must be configured");
}

const corsOptions = {
    origin(origin, callback) {
        // Requests without Origin are server-to-server, health checks, or CLI clients.
        if (!origin || isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        const error = new Error(`CORS origin is not allowed: ${origin}`);
        error.statusCode = 403;
        return callback(error);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    optionsSuccessStatus: 204,
    maxAge: 86400
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(helmet());
app.use(morgan("dev"));

app.use(
    "/uploads",
    authMiddleware,
    requireAnyDepartmentAccess("operations", "pos-management"),
    policyFileAccessMiddleware,
    express.static(uploadStoragePath)
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
        database: databaseReady ? "connected" : "unavailable",
        policyUploadContract: "rc-sides-gst-v1"
    });
});

app.use("/api/auth", authRoutes);

app.use(
    "/api/setcomm",
    authMiddleware,
    setCommRoutes
);

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
    "/api/pos-management",
    authMiddleware,
    requireDepartmentAccess("pos-management"),
    posManagementRoutes
);

app.use(
    "/api/accounts",
    authMiddleware,
    requireDepartmentAccess("accounts"),
    accountsRoutes
);

app.use(
    "/api/departments/human-resources",
    authMiddleware,
    requireDepartmentAccess("human-resources"),
    humanResourcesRoutes
);

app.use("/api/departments", authMiddleware, departmentDashboardRoutes);



// Error handling middleware
app.use(errorMiddleware);

const PORT = Number(readEnv("PORT", "5000"));
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
}
const publicApiUrl = getPublicApiUrl();

const startServer = () => {
    const server = app.listen(PORT, async () => {
        console.log("✅ Server listening");
        console.log(`⚙️ Environment: ${mode}`);
        console.log(`📡 API: ${publicApiUrl}`);
        console.log(`🌐 Allowed frontend origins: ${configuredOrigins.join(", ")}`);
        if (!isProduction && readModeEnv("ALLOW_PRIVATE_NETWORK_ORIGINS").toLowerCase() === "true") {
            console.log("🧪 LAN testing enabled for private IPv4 origins matching the configured frontend URL");
        }

        try {
            await connectDB();
            await ensurePoliciesMotorSchema();
            await ensureAccountSchema();
            await ensureDepartmentWorkflowSchema();
            await ensureHrSchema();
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
