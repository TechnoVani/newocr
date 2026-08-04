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

const authenticatedEmployeeId = user => {
    const userId = Number(user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
        const error = new Error("A valid authenticated employee is required");
        error.statusCode = 401;
        throw error;
    }
    return userId;
};

const sameDepartmentClause = user => {
    const departmentId = Number(user?.department_id);
    return Number.isInteger(departmentId) && departmentId > 0
        ? { sql: " AND department = ?", params: [departmentId] }
        : { sql: "", params: [] };
};

export const employeeVisibilityFilter = (user, column = "id") => {
    const role = getAccessRole(user);
    if (ROLE_LEVEL[role] >= ROLE_LEVEL[ACCESS_ROLES.ADMIN]) {
        return { sql: "1 = 1", params: [], role, visibility: "all" };
    }

    const userId = authenticatedEmployeeId(user);
    if (ROLE_LEVEL[role] >= ROLE_LEVEL[ACCESS_ROLES.MANAGER]) {
        const department = sameDepartmentClause(user);
        return {
            sql: `(${column} = ? OR ${column} IN (
                SELECT id FROM employees
                WHERE (reporting_manager = ? OR relationship_manager = ?)${department.sql}
            ))`,
            params: [userId, userId, userId, ...department.params],
            role,
            visibility: "team"
        };
    }

    return { sql: `${column} = ?`, params: [userId], role, visibility: "self" };
};

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
    const createdBy = employeeVisibilityFilter(user, `${alias}.created_by`);
    if (createdBy.visibility === "all") return createdBy;

    const assignedTo = employeeVisibilityFilter(user, `${alias}.assigned_to`);
    return {
        sql: `(${createdBy.sql} OR ${assignedTo.sql})`,
        params: [...createdBy.params, ...assignedTo.params],
        role: createdBy.role,
        visibility: createdBy.visibility
    };
};
