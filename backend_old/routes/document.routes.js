import express from "express";

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





export default router;