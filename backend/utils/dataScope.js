import { hasAllDepartmentAccess } from "../config/departmentAccess.js";
import { employeeVisibilityFilter } from "./roleAccess.js";

export const getPolicyReadScope = user => ({
    // Super/admin roles can read the whole policy book. Managers read only
    // their internal team from employees. Employees read only their own entries.
    all: hasAllDepartmentAccess(user),
    userId: Number(user?.id),
    user
});

export const normalizePolicyReadScope = scope => {
    const all = Boolean(scope && typeof scope === "object" && scope.all);
    const userId = Number(scope && typeof scope === "object" ? scope.userId : scope);
    if (!all && (!Number.isInteger(userId) || userId <= 0)) {
        const error = new Error("A valid authenticated user is required for policy access");
        error.statusCode = 401;
        throw error;
    }
    return { all, userId, user: scope?.user || null };
};

export const policyOwnershipFilter = (scope, column = "created_by") => {
    const normalized = normalizePolicyReadScope(scope);
    if (normalized.all) {
        return { sql: "1 = 1", params: [], scope: normalized };
    }
    const ownership = employeeVisibilityFilter(normalized.user || { id: normalized.userId }, column);
    return { sql: ownership.sql, params: ownership.params, scope: normalized };
};
