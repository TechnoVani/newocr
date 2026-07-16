import multer from "multer";
import path from "path";


const storage = multer.diskStorage({

    destination:(req,file,cb)=>{


        cb(
            null,
            "public/uploads/temp"
        );


    },


    filename:(req,file,cb)=>{


        const uniqueName =
        Date.now()
        +
        "-"
        +
        Math.round(
            Math.random()*999999
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


    const allowedTypes=[

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

        cb(
            new Error(
                "Only PDF and Image files allowed"
            ),
            false
        );

    }

};



const upload = multer({

    storage,

    fileFilter,


    limits:{

        fileSize:
        Number(process.env.MAX_FILE_SIZE || 10)
        *
        1024
        *
        1024

    }

});



export default upload;