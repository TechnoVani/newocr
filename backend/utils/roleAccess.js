import { isAdministration, isSuperAdmin } from "../config/departmentAccess.js";

const normalize = value => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

export const ACCESS_ROLES = Object.freeze({
    EMPLOYEE: "employee",
    MANAGER: "manager",
    ADMIN: "admin",
    SUPER_ADMIN: "super-admin"
});

const ROLE_LEVEL = Object.freeze({
    [ACCESS_ROLES.EMPLOYEE]: 1,
    [ACCESS_ROLES.MANAGER]: 2,
    [ACCESS_ROLES.ADMIN]: 3,
    [ACCESS_ROLES.SUPER_ADMIN]: 4
});

export const getAccessRole = user => {
    if (isSuperAdmin(user)) return ACCESS_ROLES.SUPER_ADMIN;
    const userType = normalize(user?.user_type);
    if (isAdministration(user) || ["admin", "administrator"].includes(userType)) {
        return ACCESS_ROLES.ADMIN;
    }
    const designation = normalize(user?.designation);
    if (
        userType.includes("manager") ||
        designation.includes("manager") ||
        designation.includes("department head") ||
        designation.includes("team lead")
    ) {
        return ACCESS_ROLES.MANAGER;
    }
    return ACCESS_ROLES.EMPLOYEE;
};

export const hasMinimumRole = (user, minimumRole) =>
    ROLE_LEVEL[getAccessRole(user)] >= ROLE_LEVEL[minimumRole];

export const getRoleCapabilities = user => {
    const role = getAccessRole(user);
    return {
        role,
        can_view_department_data: ROLE_LEVEL[role] >= ROLE_LEVEL[ACCESS_ROLES.MANAGER],
        can_manage_workflow: ROLE_LEVEL[role] >= ROLE_LEVEL[ACCESS_ROLES.MANAGER],
        can_manage_employees: ROLE_LEVEL[role] >= ROLE_LEVEL[ACCESS_ROLES.MANAGER],
        can_access_all_departments: ROLE_LEVEL[role] >= ROLE_LEVEL[ACCESS_ROLES.ADMIN]
    };
};

export const departmentWorkScope = (user, alias = "wi") => {
    const role = getAccessRole(user);
    if (ROLE_LEVEL[role] >= ROLE_LEVEL[ACCESS_ROLES.MANAGER]) {
        return { sql: "1 = 1", params: [], role, visibility: "department" };
    }
    const userId = Number(user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
        const error = new Error("A valid authenticated employee is required");
        error.statusCode = 401;
        throw error;
    }
    return {
        sql: `(${alias}.created_by = ? OR ${alias}.assigned_to = ?)`,
        params: [userId, userId],
        role,
        visibility: "self"
    };
};
