import express from "express";

import upload from "../middleware/upload.middleware.js";

import UploadController from "../controllers/upload.controller.js";

const router = express.Router();
// Policy PDF Upload

router.post(

    "/pdf",

    upload.single("pdf"),

    UploadController.uploadPDF
);


// Aadhaar Front

router.post(

    "/aadhaar-front",

    upload.single("aadhaar_front"),

    UploadController.uploadAadhaarFront

);


// Aadhaar Back

router.post(

    "/aadhaar-back",

    upload.single("aadhaar_back"),

    UploadController.uploadAadhaarBack

);

// PAN Card

router.post(

    "/pan",

    upload.single("pan"),

    UploadController.uploadPAN

);

export default router;