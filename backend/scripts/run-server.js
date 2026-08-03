const requestedMode = String(process.argv[2] || "").trim().toLowerCase();

if (!["development", "production"].includes(requestedMode)) {
    throw new Error("Server mode must be development or production");
}

// Set this before importing server.js so config/env.js selects the matching
// DEV_* or PROD_* values from the single backend/.env file.
process.env.NODE_ENV = requestedMode;

await import("../server.js");
