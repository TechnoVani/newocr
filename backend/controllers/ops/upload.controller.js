import FileService from "../../services/ops/file.service.js";



class UploadController {



    // Upload Policy PDF

    static async uploadPDF(req,res,next){

        try{


            if(!req.file){

                return res.status(400).json({

                    success:false,

                    message:"PDF file is required"

                });

            }



            res.status(200).json({

                success:true,

                message:"Policy PDF uploaded successfully",

                file:{

                    originalName:req.file.originalname,

                    tempPath:req.file.path.replaceAll("\\","/"),

                    mimeType:req.file.mimetype

                }

            });



        }
        catch(error){

            next(error);

        }

    }







    // Upload Aadhaar Front

    static async uploadAadhaarFront(req,res,next){

        try{


            if(!req.file){

                return res.status(400).json({

                    success:false,

                    message:"Aadhaar front image required"

                });

            }




            res.status(200).json({

                success:true,

                message:"Aadhaar front uploaded successfully",

                filePath:
                req.file.path.replaceAll("\\","/")

            });



        }
        catch(error){

            next(error);

        }


    }









    // Upload Aadhaar Back

    static async uploadAadhaarBack(req,res,next){

        try{


            if(!req.file){

                return res.status(400).json({

                    success:false,

                    message:"Aadhaar back image required"

                });

            }




            res.status(200).json({

                success:true,

                message:"Aadhaar back uploaded successfully",

                filePath:
                req.file.path.replaceAll("\\","/")

            });



        }
        catch(error){

            next(error);

        }


    }









    // Upload PAN Card


    static async uploadPAN(req,res,next){

        try{


            if(!req.file){


                return res.status(400).json({

                    success:false,

                    message:"PAN card image required"

                });


            }




            res.status(200).json({

                success:true,

                message:"PAN card uploaded successfully",

                filePath:
                req.file.path.replaceAll("\\","/")

            });



        }
        catch(error){

            next(error);

        }


    }





}



export default UploadController;