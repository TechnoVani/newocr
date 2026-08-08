import PosManagementModel from "../../models/pos-management/posManagement.model.js";
import PoliciesMotorModel from "../../models/operations/policy-workspace/policiesMotor.model.js";
import PoliciesMotorService from "../../services/operations/policy-workspace/policiesMotor.service.js";
import SetCommService from "../../services/accounts/setcomm.service.js";
import { getPolicyReadScope } from "../../utils/dataScope.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { buildPosAnalytics } from "../../utils/posAnalytics.js";

const clean = value => String(value ?? "").trim();

class PosManagementController {
    static async profile(req, res, next) {
        try {
            return successResponse(res, "POS profile retrieved successfully", {
                id: req.user.id,
                name: req.user.name,
                employee_code: req.user.employee_code,
                email: req.user.email,
                mobile: req.user.mobile,
                department: req.user.department,
                designation: req.user.designation,
                user_type: req.user.user_type
            });
        } catch (error) { next(error); }
    }

    static async dashboard(req, res, next) {
        try {
            const scope = getPolicyReadScope(req.user);
            const [summary, policies] = await Promise.all([
                PoliciesMotorModel.getDashboardSummary(scope),
                PoliciesMotorService.getAllPolicies(scope)
            ]);
            const amount = value => Number(value) || 0;
            const totals = policies.reduce((result, policy) => {
                result.policyCount += 1;
                result.odPremium += amount(policy.total_od);
                result.tpPremium += amount(policy.total_tp);
                result.netPremium += amount(policy.net_premium);
                return result;
            }, { policyCount: 0, odPremium: 0, tpPremium: 0, netPremium: 0 });
            Object.keys(totals).forEach(key => {
                if (key !== "policyCount") totals[key] = Number(totals[key].toFixed(2));
            });
            return successResponse(res, "POS dashboard retrieved successfully", {
                ...summary,
                totals
            });
        } catch (error) { next(error); }
    }

    static async policies(req, res, next) {
        try {
            const policies = await PoliciesMotorService.getAllPolicies(getPolicyReadScope(req.user));
            return successResponse(res, "POS policies retrieved successfully", {
                count: policies.length,
                policies
            });
        } catch (error) { next(error); }
    }

    static async analytics(req, res, next) {
        try {
            const policies = await PoliciesMotorService.getAllPolicies(getPolicyReadScope(req.user));
            return successResponse(
                res,
                "POS analytics retrieved successfully",
                buildPosAnalytics(policies)
            );
        } catch (error) { next(error); }
    }

    static async monthlyReport(req, res, next) {
        try {
            const now = new Date();
            const report = await PoliciesMotorService.getMonthlyReport(
                req.query.year ?? now.getFullYear(),
                req.query.month ?? now.getMonth() + 1,
                getPolicyReadScope(req.user)
            );
            return successResponse(res, "POS business report retrieved successfully", report);
        } catch (error) { next(error); }
    }

    static async renewals(req, res, next) {
        try {
            const now = new Date();
            const report = await PoliciesMotorService.getRenewalReport(
                req.query.year ?? now.getFullYear(),
                req.query.month ?? now.getMonth() + 1,
                getPolicyReadScope(req.user),
                { type: req.query.type }
            );
            return successResponse(res, "POS renewals retrieved successfully", report);
        } catch (error) { next(error); }
    }

    static async payout(req, res, next) {
        try {
            const now = new Date();
            const year = Number(req.query.year ?? now.getFullYear());
            const month = Number(req.query.month ?? now.getMonth() + 1);
            if (!Number.isInteger(year) || year < 2000 || year > 2100 ||
                !Number.isInteger(month) || month < 1 || month > 12) {
                return errorResponse(res, "A valid report month and year are required", null, 400);
            }
            const reportMonth = `${year}-${String(month).padStart(2, "0")}`;
            const readScope = getPolicyReadScope(req.user);
            const result = await SetCommService.getAllSetCommissions({
                readScope,
                search: clean(req.query.search),
                month: reportMonth,
                business_type: clean(req.query.business_type),
                pos_id: clean(req.query.pos_id),
                insurance_company: clean(req.query.insurance_company),
                sortBy: "issue_date",
                sortOrder: "DESC",
                limit: Math.min(Math.max(Number(req.query.limit) || 1000, 1), 5000),
                offset: 0
            });
            return successResponse(res, "POS payout report retrieved successfully", {
                ...result,
                period: { year, month }
            });
        } catch (error) { next(error); }
    }

    static async masters(req, res, next) {
        try {
            return successResponse(
                res,
                "POS masters retrieved successfully",
                await PosManagementModel.getMasters(clean(req.query.insurer))
            );
        } catch (error) { next(error); }
    }
}

export default PosManagementController;
