import { PosWiseReportModel } from "../../models/accounts/posWiseReport.model.js";
import { getPolicyReadScope } from "../../utils/dataScope.js";
import { successResponse } from "../../utils/response.js";

const periodRange = value => {
  const month = String(value || "").trim();
  const match = month.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!match) {
    const error = new Error("Month must use YYYY-MM format");
    error.statusCode = 400;
    throw error;
  }
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (year < 2000 || year > 2100) {
    const error = new Error("Year must be between 2000 and 2100");
    error.statusCode = 400;
    throw error;
  }
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  return {
    month,
    startDate: `${year}-${String(monthNumber).padStart(2, "0")}-01`,
    endDate: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
};

const optionalId = (value, label) => {
  if (value === undefined || value === null || value === "") return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`${label} must be a positive integer`);
    error.statusCode = 400;
    throw error;
  }
  return id;
};

export const getPosWiseReport = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const period = periodRange(req.query.month || currentMonth);
    const result = await PosWiseReportModel.get({
      readScope: getPolicyReadScope(req.user),
      startDate: period.startDate,
      endDate: period.endDate,
      search: String(req.query.search || "").trim().slice(0, 100),
      posId: optionalId(req.query.posId, "POS"),
      referenceId: optionalId(req.query.referenceId, "Reference"),
    });
    return successResponse(res, "POS-wise Accounts report retrieved successfully", {
      ...result,
      period,
    });
  } catch (error) {
    next(error);
  }
};
