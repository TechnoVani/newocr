import { PayoutGridService } from "../../services/accounts/payoutGridService.js";
import { successResponse } from "../../utils/response.js";

export const importPayoutGrid = async (req, res, next) => {
  try {
    const result = await PayoutGridService.importRows({
      company: req.body.company,
      month: req.body.month,
      rows: req.body.rows,
      fileName: req.body.fileName,
      userId: Number(req.user.id),
    });
    return successResponse(res, "Payout grid imported successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

export const getPayoutGridReport = async (req, res, next) => {
  try {
    const result = await PayoutGridService.getReport({
      company: req.query.company,
      month: req.query.month,
      businessType: req.query.business_type,
      category: req.query.category,
      classification: req.query.classification,
      rto: req.query.rto,
      seat: req.query.seat,
      gvw: req.query.gvw,
      cc: req.query.cc,
      fuelType: req.query.fuel_type,
      make: req.query.make,
      model: req.query.model,
      ncb: req.query.ncb,
    });
    return successResponse(res, "Payout grid report retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

export const getPayoutGridBatches = async (req, res, next) => {
  try {
    const batches = await PayoutGridService.getBatches();
    return successResponse(res, "Payout-grid batches retrieved successfully", batches);
  } catch (error) {
    next(error);
  }
};
