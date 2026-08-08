import { ReconciliationService } from "../../services/accounts/reconciliationService.js";
import { successResponse } from "../../utils/response.js";

export const importReconciliationRows = async (req, res, next) => {
  try {
    const result = await ReconciliationService.importRows({
      rows: req.body.rows,
      userId: Number(req.user.id),
      user: req.user,
    });
    return successResponse(res, "Insurer statement imported successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

export const getReconciliationReport = async (req, res, next) => {
  try {
    const result = await ReconciliationService.getReport({
      year: req.query.year,
      month: req.query.month,
      createdYear: req.query.createdYear,
      createdMonth: req.query.createdMonth,
      insuranceCompany: req.query.insurance_company,
      user: req.user,
    });
    return successResponse(res, "Verification reconciliation retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};
