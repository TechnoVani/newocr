import DepartmentDashboardModel from "../../models/departments/departmentDashboard.model.js";
import DepartmentSchemaModel from "../../models/departments/departmentSchema.model.js";
import DepartmentEntryModel from "../../models/departments/departmentEntry.model.js";
import { successResponse } from "../../utils/response.js";

class DepartmentDashboardController {
    static async dashboard(req, res, next) {
        try {
            return successResponse(res, "Department dashboard retrieved successfully", await DepartmentDashboardModel.getDashboard(req.departmentPortal, req.user, req.query));
        } catch (error) { next(error); }
    }

    static async reports(req, res, next) {
        try {
            return successResponse(res, "Department reports retrieved successfully", await DepartmentDashboardModel.getReports(req.departmentPortal, req.query, req.user));
        } catch (error) { next(error); }
    }

    static schema(req, res, next) {
        try {
            return successResponse(res, "Department schema retrieved successfully", DepartmentSchemaModel.get(req.departmentPortal));
        } catch (error) { next(error); }
    }

    static async createEntry(req, res, next) {
        try {
            const entry = await DepartmentEntryModel.create(req.departmentPortal, req.body || {}, req.user);
            return successResponse(res, "Department insurance entry created successfully", entry, 201);
        } catch (error) { next(error); }
    }

    static async updateEntryStatus(req, res, next) {
        try {
            const entry = await DepartmentEntryModel.updateStatus(
                req.departmentPortal, req.params.id, req.body.status, req.user, req.body.note,
            );
            return successResponse(res, "Department workflow status updated successfully", entry);
        } catch (error) { next(error); }
    }

    static async entryHistory(req, res, next) {
        try {
            return successResponse(
                res,
                "Department workflow history retrieved successfully",
                await DepartmentEntryModel.getHistory(req.departmentPortal, req.params.id, req.user),
            );
        } catch (error) { next(error); }
    }

    static async policies(req, res, next) {
        try {
            return successResponse(res, "Department policies retrieved successfully", await DepartmentDashboardModel.getPolicies(req.departmentPortal, req.user));
        } catch (error) { next(error); }
    }

    static async renewals(req, res, next) {
        try {
            return successResponse(res, "Department renewals retrieved successfully", await DepartmentDashboardModel.getRenewals(req.departmentPortal, req.user, req.query));
        } catch (error) { next(error); }
    }

    static async followups(req, res, next) {
        try {
            return successResponse(res, "Policy follow-ups retrieved successfully", await DepartmentDashboardModel.getPolicyFollowups(req.departmentPortal, req.user, req.query));
        } catch (error) { next(error); }
    }

    static async createFollowup(req, res, next) {
        try {
            return successResponse(res, "Policy follow-up saved successfully", await DepartmentDashboardModel.createPolicyFollowup(req.departmentPortal, req.body || {}, req.user), 201);
        } catch (error) { next(error); }
    }

    static async masters(req, res, next) {
        try {
            return successResponse(res, "Department masters retrieved successfully", await DepartmentDashboardModel.getMasters(req.departmentPortal, req.user));
        } catch (error) { next(error); }
    }

}

export default DepartmentDashboardController;
