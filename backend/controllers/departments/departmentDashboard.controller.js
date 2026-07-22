import DepartmentDashboardModel from "../../models/departments/departmentDashboard.model.js";
import DepartmentSchemaModel from "../../models/departments/departmentSchema.model.js";
import DepartmentEntryModel from "../../models/departments/departmentEntry.model.js";
import { successResponse } from "../../utils/response.js";

class DepartmentDashboardController {
    static dashboard(req, res, next) {
        try {
            return successResponse(res, "Department dashboard retrieved successfully", DepartmentDashboardModel.getDashboard(req.departmentPortal));
        } catch (error) { next(error); }
    }

    static reports(req, res, next) {
        try {
            return successResponse(res, "Department reports retrieved successfully", DepartmentDashboardModel.getReports(req.departmentPortal, req.query));
        } catch (error) { next(error); }
    }

    static schema(req, res, next) {
        try {
            return successResponse(res, "Department schema retrieved successfully", DepartmentSchemaModel.get(req.departmentPortal));
        } catch (error) { next(error); }
    }

    static createEntry(req, res, next) {
        try {
            const entry = DepartmentEntryModel.create(req.departmentPortal, req.body || {}, req.user);
            return successResponse(res, "Department insurance entry created successfully", entry, 201);
        } catch (error) { next(error); }
    }

    static policies(req, res, next) {
        try {
            return successResponse(res, "Department policies retrieved successfully", DepartmentDashboardModel.getPolicies(req.departmentPortal));
        } catch (error) { next(error); }
    }

    static renewals(req, res, next) {
        try {
            return successResponse(res, "Department renewals retrieved successfully", DepartmentDashboardModel.getRenewals(req.departmentPortal));
        } catch (error) { next(error); }
    }

    static masters(req, res, next) {
        try {
            return successResponse(res, "Department masters retrieved successfully", DepartmentDashboardModel.getMasters(req.departmentPortal));
        } catch (error) { next(error); }
    }
}

export default DepartmentDashboardController;
