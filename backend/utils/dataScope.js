import { hasAllDepartmentAccess } from "../config/departmentAccess.js";

export const getPolicyReadScope = user => ({
    all: hasAllDepartmentAccess(user),
    userId: Number(user?.id)
});

export const normalizePolicyReadScope = scope => {
    const all = Boolean(scope && typeof scope === "object" && scope.all);
    const userId = Number(scope && typeof scope === "object" ? scope.userId : scope);
    if (!all && (!Number.isInteger(userId) || userId <= 0)) {
        const error = new Error("A valid authenticated user is required for policy access");
        error.statusCode = 401;
        throw error;
    }
    return { all, userId };
};

export const policyOwnershipFilter = (scope, column = "created_by") => {
    const normalized = normalizePolicyReadScope(scope);
    return normalized.all
        ? { sql: "1 = 1", params: [], scope: normalized }
        : { sql: `${column} = ?`, params: [normalized.userId], scope: normalized };
};
