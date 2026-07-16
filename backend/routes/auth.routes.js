// src/routes/auth.routes.js
import express from "express";
import AuthController from "../controllers/auth.controller.js";
import AccountDetailController from "../controllers/accountDetail.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { employeeDocumentUpload, employeeProfilePictureUpload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);
router.get("/reset-password/validate", AuthController.validateResetToken);
router.post("/reset-password", AuthController.resetPassword);
router.get("/me", authMiddleware, AuthController.getMe);
router.put("/profile", authMiddleware, AuthController.updateProfile);
router.get("/profile/account-details", authMiddleware, AccountDetailController.list);
router.post("/profile/account-details", authMiddleware, AccountDetailController.create);
router.post(
    "/profile/picture",
    authMiddleware,
    employeeProfilePictureUpload.single("profile_picture"),
    AuthController.uploadProfilePicture
);
router.get("/profile/picture", authMiddleware, AuthController.getProfilePicture);
router.get("/profile/documents", authMiddleware, AuthController.listProfileDocuments);
router.post(
    "/profile/documents",
    authMiddleware,
    employeeDocumentUpload.fields([
        { name: "aadhaar_front", maxCount: 1 },
        { name: "aadhaar_back", maxCount: 1 },
        { name: "pan_card", maxCount: 1 },
        { name: "marksheet", maxCount: 1 },
        { name: "bank_passbook", maxCount: 1 }
    ]),
    AuthController.uploadProfileDocuments
);
router.get("/profile/documents/:type", authMiddleware, AuthController.getProfileDocument);

export default router;
