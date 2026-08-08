import { canAccessPortal, hasAllDepartmentAccess, PORTALS } from "../config/departmentAccess.js";
import { unauthorized } from "./AppError.js";

const FULL_POLICY_ACCESS_PORTALS = Object.freeze([
    PORTALS.ACCOUNTS,
    PORTALS.RENEWAL
]);

export const getPolicyReadScope = user => ({
    // Accounts and Renewal need the full policy book for department workflows.
    // Other departments, including Operations, read policies created by the
    // logged-in employee only.
    all: hasAllDepartmentAccess(user) ||
        FULL_POLICY_ACCESS_PORTALS.some(portal => canAccessPortal(user, portal)),
    userId: Number(user?.id),
    user
});

export const normalizePolicyReadScope = scope => {
    const all = Boolean(scope && typeof scope === "object" && scope.all);
    const userId = Number(scope && typeof scope === "object" ? scope.userId : scope);
    if (!all && (!Number.isInteger(userId) || userId <= 0)) {
        throw unauthorized("A valid authenticated user is required for policy access");
    }
    return { all, userId, user: scope?.user || null };
};

export const policyOwnershipFilter = (scope, column = "created_by") => {
    const normalized = normalizePolicyReadScope(scope);
    if (normalized.all) {
        return { sql: "1 = 1", params: [], scope: normalized };
    }
    return { sql: `${column} = ?`, params: [normalized.userId], scope: normalized };
};
