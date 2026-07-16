import BqpModel from "../models/bqp.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

class ReportingController {
  static async getReportingManagers(req, res, next) {
    try {
      const { bqpId } = req.params; // now from URL parameter, not query
      if (!bqpId) {
        return errorResponse(res, "bqpId is required", null, 400);
      }
      const managers = await BqpModel.getReportingManagersByBqp(bqpId);
      return successResponse(res, "Reporting managers fetched successfully", managers);
    } catch (error) {
      next(error);
    }
  }
}

export default ReportingController;
