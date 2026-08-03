import { CancelledPolicyModel } from "../../models/accounts/cancelledPolicy.model.js";
import { formatToMySQLDate } from "../../utils/dateFormatter.js";
import { getPolicyReadScope } from "../../utils/dataScope.js";
import { successResponse } from "../../utils/response.js";

export const createCancelledPolicy = async (req, res, next) => {
  try {
    const policyNumber = String(req.body?.policy_number || req.body?.policyNumber || "").trim();
    if (!policyNumber) {
      const error = new Error("Policy number is required");
      error.statusCode = 400;
      throw error;
    }

    const readScope = getPolicyReadScope(req.user);
    const policy = await CancelledPolicyModel.findPolicyByNumber(policyNumber, readScope);
    if (!policy) {
      const error = new Error("Policy entry not found for this policy number");
      error.statusCode = 404;
      throw error;
    }

    const cancellationDate = formatToMySQLDate(req.body?.cancellation_date || req.body?.cancellationDate);
    if (!cancellationDate) {
      const error = new Error("A valid cancellation date is required");
      error.statusCode = 400;
      throw error;
    }

    const id = await CancelledPolicyModel.upsert({
      policy_id: policy.id,
      policy_number: policy.policy_number,
      cancellation_date: cancellationDate,
      cancellation_reason: req.body?.cancellation_reason || req.body?.cancellationReason || null,
      created_by: req.user?.id
    });

    return successResponse(res, "Cancelled policy record saved successfully", {
      id,
      policyId: policy.id,
      policyNumber: policy.policy_number,
      cancellationDate
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const getCancelledPolicyReport = async (req, res, next) => {
  try {
    const now = new Date();
    const result = await CancelledPolicyModel.getReport({
      year: req.query.year ?? now.getFullYear(),
      month: req.query.month ?? now.getMonth() + 1,
      readScope: getPolicyReadScope(req.user)
    });
    return successResponse(res, "Cancelled policy report retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};
