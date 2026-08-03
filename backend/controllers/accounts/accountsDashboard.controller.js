import { AccountsDashboardModel } from "../../models/accounts/accountsDashboard.model.js";
import { getPolicyReadScope } from "../../utils/dataScope.js";
import { successResponse } from "../../utils/response.js";

export const getAccountsDashboard = async (req, res, next) => {
  try {
    const dashboard = await AccountsDashboardModel.get(getPolicyReadScope(req.user));
    return successResponse(res, "Accounts dashboard retrieved successfully", dashboard);
  } catch (error) {
    next(error);
  }
};
