import express from "express";
// Shared policy-workspace document routes.

import DocumentController from "../controllers/document.controller.js";



const router = express.Router();





router.get(

    "/pdf/:id",

    DocumentController.pdf

);





router.get(

    "/aadhaar-front/:id",

    DocumentController.aadhaarFront

);





router.get(

    "/aadhaar-back/:id",

    DocumentController.aadhaarBack

);





router.get(

    "/pan/:id",

    DocumentController.pan

);

router.get("/rc/:id", DocumentController.rc);
router.get("/rc-front/:id", DocumentController.rcFront);
router.get("/rc-back/:id", DocumentController.rcBack);
router.get("/previous-policy/:id", DocumentController.previousPolicy);
router.get("/survey-report/:id", DocumentController.surveyReport);
router.get("/gst-certificate/:id", DocumentController.gstCertificate);





export default router;
