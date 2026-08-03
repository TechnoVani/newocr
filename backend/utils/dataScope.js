import { canAccessPortal, hasAllDepartmentAccess } from "../config/departmentAccess.js";
import { ACCESS_ROLES, hasMinimumRole } from "./roleAccess.js";

export const getPolicyReadScope = user => ({
    // Super/admin roles can read the whole policy book. Department managers
    // in shared policy portals read their reporting branch. Employees read
    // only their own entries.
    all: hasAllDepartmentAccess(user),
    branch:
        hasMinimumRole(user, ACCESS_ROLES.MANAGER) &&
        (canAccessPortal(user, "accounts") || canAccessPortal(user, "pos-management")),
    userId: Number(user?.id),
    branchId: Number(user?.reporting_branch_id)
});

export const normalizePolicyReadScope = scope => {
    const all = Boolean(scope && typeof scope === "object" && scope.all);
    const branch = Boolean(scope && typeof scope === "object" && scope.branch);
    const userId = Number(scope && typeof scope === "object" ? scope.userId : scope);
    const branchId = Number(scope && typeof scope === "object" ? scope.branchId : null);
    const hasBranchScope = branch && Number.isInteger(branchId) && branchId > 0;
    if (!all && !hasBranchScope && (!Number.isInteger(userId) || userId <= 0)) {
        const error = new Error("A valid authenticated user is required for policy access");
        error.statusCode = 401;
        throw error;
    }
    return { all, branch: hasBranchScope, userId, branchId };
};

export const policyOwnershipFilter = (scope, column = "created_by") => {
    const normalized = normalizePolicyReadScope(scope);
    if (normalized.all) {
        return { sql: "1 = 1", params: [], scope: normalized };
    }
    if (normalized.branch) {
        return {
            sql: `${column} IN (SELECT id FROM employees WHERE reporting_branch = ?)`,
            params: [normalized.branchId],
            scope: normalized
        };
    }
    return { sql: `${column} = ?`, params: [normalized.userId], scope: normalized };
};
