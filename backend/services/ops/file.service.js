import fs from "fs/promises";
import path from "path";



class FileService {



static async createPolicyFolder(
    policyNumber
){


    const date = new Date();


    const year =
        date.getFullYear();



    const month =
        date.toLocaleString(
            "default",
            {
                month:"long"
            }
        );



    const folderPath =
        path.join(

            "public",
            "uploads",

            String(year),

            month,

            policyNumber

        );



    await fs.mkdir(
        folderPath,
        {
            recursive:true
        }
    );



    return folderPath;


}







static async moveFile(

    tempFile,

    folderPath,

    fileName

){


    const destination =
        path.join(
            folderPath,
            fileName
        );



    await fs.rename(
        tempFile,
        destination
    );



    return destination.replaceAll("\\","/");


}







static async saveOCRText(

    folderPath,

    text

){


    const filePath =
        path.join(
            folderPath,
            "ocr.txt"
        );



    await fs.writeFile(
        filePath,
        text,
        "utf-8"
    );



    return filePath.replaceAll("\\","/");


}







static async saveJSON(

    folderPath,

    data

){


    const filePath =
        path.join(
            folderPath,
            "policy.json"
        );



    await fs.writeFile(

        filePath,

        JSON.stringify(
            data,
            null,
            2
        )

    );



    return filePath.replaceAll("\\","/");


}




}



export default FileService;