import BqpModel from "../models/bqp.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

class RelationshipController {
  static async getRelationshipManagers(req, res, next) {
    try {
      const { managerId } = req.params; // from URL
      if (!managerId) {
        return errorResponse(res, "managerId is required", null, 400);
      }
      const managers = await BqpModel.getRelationshipManagersByManager(managerId);
      return successResponse(res, "Relationship managers fetched successfully", managers);
    } catch (error) {
      next(error);
    }
  }
}

export default RelationshipController;
