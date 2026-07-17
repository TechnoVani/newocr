import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import { errorResponse } from "../utils/response.js";

/**
 * JWT Authentication Verification Middleware
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return errorResponse(res, "Access denied. No token provided.", null, 401);
        }

        const token = authHeader.split(" ")[1];
        const jwtSecret = String(process.env.JWT_SECRET || "").trim();
        if (!jwtSecret) {
            return errorResponse(res, "Authentication service is not configured", null, 500);
        }

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return errorResponse(res, "Token expired. Please login again.", null, 401);
            }
            return errorResponse(res, "Invalid authentication token.", null, 401);
        }

        // Fetch user from DB to confirm they still exist
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return errorResponse(res, "User no longer exists.", null, 401);
        }

        // Attach authenticated user payload to request
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

export default authMiddleware;
export { authMiddleware };
