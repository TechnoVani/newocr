import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";



const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "..");
const tempFolder = path.join(backendRoot, "public", "uploads", "temp");



if(!fs.existsSync(tempFolder)){

    fs.mkdirSync(
        tempFolder,
        {
            recursive:true
        }
    );

}




const storage = multer.diskStorage({


    destination:(req,file,cb)=>{


        cb(
            null,
            tempFolder
        );


    },



    filename:(req,file,cb)=>{


        const uniqueName =
            Date.now()
            +
            "-"
            +
            Math.round(
                Math.random()*100000
            )
            +
            path.extname(file.originalname);



        cb(
            null,
            uniqueName
        );


    }


});







const fileFilter = (req,file,cb)=>{

    const policyFields = ["pdfFile", "pdf"];

    if (policyFields.includes(file.fieldname) && file.mimetype !== "application/pdf") {
        const error = new Error("Policy document must be a PDF file");
        error.statusCode = 400;
        return cb(
            error,
            false
        );
    }


    const allowedTypes = [

        "application/pdf",

        "image/jpeg",

        "image/png",

        "image/jpg"

    ];



    if(
        allowedTypes.includes(
            file.mimetype
        )
    ){

        cb(
            null,
            true
        );


    }
    else{
        const error = new Error("Only PDF and Image files are allowed");
        error.statusCode = 400;
        cb(
            error,
            false
        );


    }


};








const upload = multer({


    storage,


    fileFilter,



    limits:{


        fileSize:
        Number(
            process.env.MAX_FILE_SIZE || 10 * 1024 * 1024
        )


    }


});

// Policy requests keep documents in memory and write them directly to their
// final folder, eliminating temporary-path races.
export const policyUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024)
    }
});

const employeeDocumentFields = new Set([
    "aadhaar_front",
    "aadhaar_back",
    "pan_card",
    "marksheet",
    "bank_passbook"
]);

export const employeeDocumentUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (!employeeDocumentFields.has(file.fieldname)) {
            const error = new Error("Unsupported employee document field");
            error.statusCode = 400;
            return cb(error, false);
        }
        return fileFilter(req, file, cb);
    },
    limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024),
        files: employeeDocumentFields.size
    }
});

export const employeeProfilePictureUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.fieldname !== "profile_picture") {
            const error = new Error("Unsupported profile picture field");
            error.statusCode = 400;
            return cb(error, false);
        }
        if (!["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
            const error = new Error("Profile picture must be a JPG or PNG image");
            error.statusCode = 400;
            return cb(error, false);
        }
        return cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});





export default upload;
