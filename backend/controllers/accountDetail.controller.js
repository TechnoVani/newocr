import AccountDetailModel from "../models/accountDetail.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

const normalizeAccountData = body => ({
    account_holder_name: String(body.account_holder_name || "").trim(),
    bank_name: String(body.bank_name || "").trim(),
    account_number: String(body.account_number || "").trim(),
    ifsc_code: String(body.ifsc_code || "").trim().toUpperCase(),
    branch_name: String(body.branch_name || "").trim(),
    account_type: String(body.account_type || "").trim()
});

const validateAccountData = data => {
    const required = ["account_holder_name", "bank_name", "account_number", "ifsc_code"];
    const missing = required.find(field => !data[field]);
    if (missing) return `${missing.replace(/_/g, " ")} is required`;
    if (data.account_holder_name.length > 255) return "Account holder name is too long";
    if (data.bank_name.length > 255) return "Bank name is too long";
    if (!/^[A-Za-z0-9-]{6,50}$/.test(data.account_number)) {
        return "Account number must contain 6 to 50 letters, numbers, or hyphens";
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifsc_code)) {
        return "IFSC code must be in a valid format, for example SBIN0001234";
    }
    if (data.branch_name.length > 255) return "Branch name is too long";
    if (data.account_type.length > 50) return "Account type is too long";
    return null;
};

class AccountDetailController {
    static async list(req, res, next) {
        try {
            const accounts = await AccountDetailModel.findByEmployeeId(req.user.id);
            return successResponse(res, "Account details retrieved successfully", { accounts });
        } catch (error) {
            next(error);
        }
    }

    static async create(req, res, next) {
        try {
            const data = normalizeAccountData(req.body);
            const validationError = validateAccountData(data);
            if (validationError) return errorResponse(res, validationError, null, 400);

            const account = await AccountDetailModel.create(req.user.id, data);
            return successResponse(res, "Account details added successfully", { account }, 201);
        } catch (error) {
            next(error);
        }
    }

}

export default AccountDetailController;
