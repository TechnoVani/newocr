import { canAccessPortal } from "../config/departmentAccess.js";
import { errorResponse } from "../utils/response.js";

const requireDepartmentAccess = portal => (req, res, next) => {
    if (!req.user) return errorResponse(res, "Authentication is required.", null, 401);
    if (!canAccessPortal(req.user, portal)) {
        return errorResponse(res, `You do not have permission to access the ${portal} portal.`, null, 403);
    }
    next();
};

export default requireDepartmentAccess;

export const requireRequestedDepartmentAccess = (req, res, next) => {
    const portal = String(req.params.department || "").trim().toLowerCase();
    if (!req.user) return errorResponse(res, "Authentication is required.", null, 401);
    if (!canAccessPortal(req.user, portal)) {
        return errorResponse(res, `You do not have permission to access the ${portal} portal.`, null, 403);
    }
    req.departmentPortal = portal;
    next();
};
