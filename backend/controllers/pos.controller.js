import PosModel from "../models/bqp.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

class PosController {
  static async getPospByRelationshipManager(req, res, next) {
    try {
      const { relationshipId } = req.params;
      if (!relationshipId) {
        return errorResponse(res, "relationshipId is required", null, 400);
      }
      const posps = await PosModel.getPospByRelationshipManager(relationshipId);
      return successResponse(res, "POSPs fetched successfully", posps);
    } catch (error) {
      next(error);
    }
  }
}

export default PosController;
