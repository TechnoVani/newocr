import dotenv from "dotenv";


dotenv.config();



const OCR_PROVIDER =
process.env.OCR_PROVIDER || "tesseract";



const OCR_CONFIG={


    provider:OCR_PROVIDER,


    google:{

        credentials:
        process.env.GOOGLE_APPLICATION_CREDENTIALS

    },


    gemini:{

        apiKey:
        process.env.GEMINI_API_KEY

    },


    tesseract:{


        language:"eng"


    }


};



export default OCR_CONFIG;