const normalize = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

export const ACCESS_ROLES = Object.freeze({
  EMPLOYEE: "employee",
  MANAGER: "manager",
  ADMIN: "admin",
  SUPER_ADMIN: "super-admin",
});

const LEVEL = Object.freeze({
  [ACCESS_ROLES.EMPLOYEE]: 1,
  [ACCESS_ROLES.MANAGER]: 2,
  [ACCESS_ROLES.ADMIN]: 3,
  [ACCESS_ROLES.SUPER_ADMIN]: 4,
});

export const getAccessRole = (user) => {
  if (user?.access_role && LEVEL[user.access_role]) return user.access_role;
  const userType = normalize(user?.user_type);
  if (user?.is_super_admin || ["super admin", "superadmin"].includes(userType)) return ACCESS_ROLES.SUPER_ADMIN;
  if (["admin", "administrator"].includes(userType) || normalize(user?.department) === "administration") return ACCESS_ROLES.ADMIN;
  const designation = normalize(user?.designation);
  if (userType.includes("manager") || designation.includes("manager") || designation.includes("department head") || designation.includes("team lead")) {
    return ACCESS_ROLES.MANAGER;
  }
  return ACCESS_ROLES.EMPLOYEE;
};

export const hasMinimumRole = (user, role) => LEVEL[getAccessRole(user)] >= LEVEL[role];
export const roleLabel = (user) => ({
  [ACCESS_ROLES.EMPLOYEE]: "Employee",
  [ACCESS_ROLES.MANAGER]: "Manager",
  [ACCESS_ROLES.ADMIN]: "Admin",
  [ACCESS_ROLES.SUPER_ADMIN]: "Super Admin",
})[getAccessRole(user)];
