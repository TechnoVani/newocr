import path from "path";

const BASE_UPLOAD_PATH = process.env.BASE_UPLOAD_PATH || "public/uploads";
const TEMP_UPLOAD_PATH = path.join(BASE_UPLOAD_PATH, "temp");

export default {
    basePath: BASE_UPLOAD_PATH,
    tempPath: TEMP_UPLOAD_PATH
};
