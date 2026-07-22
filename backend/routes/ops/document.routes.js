import express from "express";

import DocumentController from "../../controllers/ops/document.controller.js";



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
router.get("/previous-policy/:id", DocumentController.previousPolicy);
router.get("/survey-report/:id", DocumentController.surveyReport);





export default router;
