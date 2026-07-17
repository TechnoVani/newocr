// src/controllers/auth.controller.js
import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { successResponse, errorResponse } from "../utils/response.js";
import { sendPasswordResetEmail } from "../services/mail.service.js";
import EmployeeDocumentService from "../services/employeeDocument.service.js";
import { getFrontendUrl } from "../config/origins.js";

const getJwtConfig = () => {
    const secret = String(process.env.JWT_SECRET || "").trim();
    if (!secret) {
        const error = new Error("JWT_SECRET is not configured");
        error.statusCode = 500;
        throw error;
    }

    return {
        secret,
        expiresIn: String(process.env.JWT_EXPIRY || "4h").trim()
    };
};

class AuthController {
    /**
     * Register a new user
     * POST /api/auth/register
     */
    static async register(req, res, next) {
        try {
            const { name, personal_email, mobile, password } = req.body;

            // Validate required fields
            if (!name || !personal_email || !mobile || !password) {
                return errorResponse(res, "All fields (name, personal_email, mobile, password) are required", null, 400);
            }

            // Check if user already exists
            const existingUser = await UserModel.findByEmailOrContact(personal_email);
            if (existingUser) {
                return errorResponse(res, "A user with this email already exists", null, 409);
            }

            // Create the user (password will be hashed inside the model)
            const newUser = await UserModel.create({ name, personal_email, mobile, password });

            // Generate JWT token
            const { secret: jwtSecret, expiresIn: jwtExpiry } = getJwtConfig();

            const token = jwt.sign(
                { id: newUser.id },
                jwtSecret,
                { expiresIn: jwtExpiry }
            );

            return successResponse(res, "User registered successfully", {
                token,
                user: newUser,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user with email/contact and password
     * POST /api/auth/login
     */
    static async login(req, res, next) {
        try {
            const { personal_email, mobile, password } = req.body;
            const identifier = personal_email || mobile;

            if (!identifier) {
                return errorResponse(res, "Email or Contact Number is required", null, 400);
            }
            if (!password) {
                return errorResponse(res, "Password is required", null, 400);
            }

            // Find user
            const user = await UserModel.findByEmailOrContact(identifier);
            if (!user) {
                return errorResponse(res, "Invalid credentials", null, 401);
            }

            // Compare hashed password
            if (typeof user.password !== "string" || !user.password.trim()) {
                return errorResponse(res, "Invalid credentials", null, 401);
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return errorResponse(res, "Invalid credentials", null, 401);
            }

            // Sign JWT
            const { secret: jwtSecret, expiresIn: jwtExpiry } = getJwtConfig();

            const token = jwt.sign(
                { id: user.id },
                jwtSecret,
                { expiresIn: jwtExpiry }
            );

            // Remove password from response
            delete user.password;

            return successResponse(res, "Login successful", {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.personal_email,
                    contact: user.mobile,
                    employee_code: user.employee_code,
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get authenticated user profile details
     * GET /api/auth/me
     */
    static async getMe(req, res, next) {
        try {
            return successResponse(res, "Profile retrieved successfully", {
                user: req.user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update employee profile (if document_status = '0')
     * PUT /api/auth/profile
     */
    static async updateProfile(req, res, next) {
        try {
            const userId = req.user.id;
            
            // Check if document_status is '1' (profile is locked)
            if (req.user.document_status === '1') {
                return res.status(403).json({
                    success: false,
                    message: "Profile is locked and cannot be updated."
                });
            }

            // Backend validation: Ensure all fields are filled
            const requiredFields = [
                "gender", "date_of_birth", "personal_email", "mobile", 
                "emergency_contact", "marital_status", "category", 
                "father_name", "father_occupation", "mother_name", 
                "current_address", "city", "state", "pin_code", 
                "aadhaar_number", "pan_number", "qualification", 
                "year_of_passing"
            ];

            for (const field of requiredFields) {
                if (!req.body[field] || req.body[field].toString().trim() === "") {
                    const formattedField = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    return res.status(400).json({
                        success: false,
                        message: `All fields are required. Please fill out: ${formattedField}`
                    });
                }
            }

            // Formatting & validations
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(req.body.personal_email)) {
                return res.status(400).json({ success: false, message: "Please provide a valid personal email address." });
            }

            if (!/^\d{10}$/.test(req.body.mobile)) {
                return res.status(400).json({ success: false, message: "Mobile number must be a valid 10-digit number." });
            }

            if (!/^\d{10}$/.test(req.body.emergency_contact)) {
                return res.status(400).json({ success: false, message: "Emergency contact number must be a valid 10-digit number." });
            }

            if (!/^\d{6}$/.test(req.body.pin_code)) {
                return res.status(400).json({ success: false, message: "Pin code must be a valid 6-digit number." });
            }

            if (!/^\d{12}$/.test(req.body.aadhaar_number)) {
                return res.status(400).json({ success: false, message: "Aadhaar number must be a valid 12-digit number." });
            }

            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(req.body.pan_number.toUpperCase())) {
                return res.status(400).json({ success: false, message: "PAN number must be in a valid format (e.g. ABCDE1234F)." });
            }

            const currentYear = new Date().getFullYear();
            const yop = parseInt(req.body.year_of_passing, 10);
            if (isNaN(yop) || yop < 1950 || yop > currentYear + 5) {
                return res.status(400).json({ success: false, message: "Please provide a valid Year of Passing." });
            }

            // Normalise PAN number to uppercase
            req.body.pan_number = req.body.pan_number.toUpperCase();

            // Update the profile using UserModel
            const updatedUser = await UserModel.updateProfile(userId, req.body);

            return successResponse(res, "Profile updated successfully", {
                user: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }

    static async listProfileDocuments(req, res, next) {
        try {
            const result = await EmployeeDocumentService.list(req.user.employee_code);
            return successResponse(res, "Employee documents retrieved successfully", result);
        } catch (error) {
            next(error);
        }
    }

    static async uploadProfileDocuments(req, res, next) {
        try {
            if (!req.files || Object.keys(req.files).length === 0) {
                return errorResponse(res, "Select at least one document to upload", null, 400);
            }
            const result = await EmployeeDocumentService.save(
                req.user.employee_code,
                req.files
            );
            return successResponse(res, "Employee documents uploaded successfully", result);
        } catch (error) {
            next(error);
        }
    }

    static async uploadProfilePicture(req, res, next) {
        try {
            const profilePicture = await EmployeeDocumentService.saveProfilePicture(
                req.user.employee_code,
                req.file
            );
            return successResponse(res, "Profile picture updated successfully", { profilePicture });
        } catch (error) {
            next(error);
        }
    }

    static async getProfilePicture(req, res, next) {
        try {
            const picture = await EmployeeDocumentService.getProfilePicturePath(req.user.employee_code);
            res.setHeader("Cache-Control", "private, no-store");
            res.setHeader("Content-Disposition", `inline; filename="${picture.fileName}"`);
            return res.sendFile(picture.absolutePath);
        } catch (error) {
            next(error);
        }
    }

    static async getProfileDocument(req, res, next) {
        try {
            const document = await EmployeeDocumentService.getPath(
                req.user.employee_code,
                req.params.type
            );
            res.setHeader("Content-Disposition", `inline; filename="${document.fileName}"`);
            return res.sendFile(document.absolutePath);
        } catch (error) {
            next(error);
        }
    }

    static async forgotPassword(req, res, next) {
        try {
            const email = String(req.body.email || "").trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return errorResponse(res, "Please enter a valid registered email address", null, 400);
            }

            const user = await UserModel.findByEmailOrContact(email);
            if (!user || !user.personal_email) {
                return errorResponse(res, "User not found", null, 404);
            }

            const rawToken = crypto.randomBytes(32).toString("hex");
            const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
            await UserModel.createPasswordResetToken(user.id, tokenHash, expiresAt);

            const frontendUrl = getFrontendUrl(req.get("origin"));
            if (!frontendUrl) {
                const error = new Error("PUBLIC_FRONTEND_URL or an allowed frontend origin must be configured");
                error.statusCode = 500;
                throw error;
            }
            const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
            try {
                await sendPasswordResetEmail({
                    to: user.personal_email,
                    name: user.name,
                    resetUrl
                });
            } catch (error) {
                await UserModel.deletePasswordResetToken(tokenHash);
                throw error;
            }

            return successResponse(res, "Password reset link has been sent successfully to your email.");
        } catch (error) {
            next(error);
        }
    }

    static async validateResetToken(req, res, next) {
        try {
            const token = String(req.query.token || "");
            if (!/^[a-f0-9]{64}$/i.test(token)) {
                return errorResponse(res, "Reset link is invalid or expired", null, 400);
            }
            const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
            const valid = await UserModel.hasValidPasswordResetToken(tokenHash);
            if (!valid) {
                return errorResponse(res, "Reset link is invalid or expired", null, 400);
            }
            return successResponse(res, "Reset link is valid");
        } catch (error) {
            next(error);
        }
    }

    static async resetPassword(req, res, next) {
        try {
            const token = String(req.body.token || "");
            const password = String(req.body.password || "");
            const confirmPassword = String(req.body.confirmPassword || "");

            if (!/^[a-f0-9]{64}$/i.test(token)) {
                return errorResponse(res, "Reset link is invalid or expired", null, 400);
            }
            if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
                return errorResponse(res, "Password must be at least 8 characters and include a letter and number", null, 400);
            }
            if (password !== confirmPassword) {
                return errorResponse(res, "Password and confirmation do not match", null, 400);
            }

            const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
            const hashedPassword = await bcrypt.hash(password, 12);
            const updated = await UserModel.resetPasswordWithToken(tokenHash, hashedPassword);
            if (!updated) {
                return errorResponse(res, "Reset link is invalid or expired", null, 400);
            }

            return successResponse(res, "Password reset successfully. You can now log in.");
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;
