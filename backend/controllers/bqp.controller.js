import BqpModel from "../models/bqp.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

class BqpController {
    static async getAll(req, res, next) {
        try {
            const bqps = await BqpModel.getAll();
            return successResponse(res, "BQP list fetched successfully", bqps);
        } catch (error) {
            next(error);
        }
    }
}

export default BqpController;