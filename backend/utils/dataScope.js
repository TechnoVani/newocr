export const getPolicyReadScope = user => ({
    // Policy records are owned by policies_motor.created_by.
    // Every logged-in user reads only their own created policy records.
    all: false,
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
    return { sql: `${column} = ?`, params: [normalized.userId], scope: normalized };
};
