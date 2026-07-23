import { DEPARTMENT_DEFINITIONS as DEPARTMENTS } from "./departmentDefinitions";

export const PORTALS = Object.freeze(Object.fromEntries(
  DEPARTMENTS.map(({ slug }) => [slug.replace(/-/g, "_").toUpperCase(), slug])
));

const BY_NAME = new Map([
  ["sales", "sales"], ["pos management", "pos-management"], ["operations", "operations"],
  ["underwriting", "underwriting"], ["claims", "claims"], ["customer support", "customer-support"],
  ["renewal", "renewal"], ["finance", "finance"], ["accounts", "accounts"],
  ["human resources (hr)", "human-resources"], ["human resources", "human-resources"], ["hr", "human-resources"],
  ["administration", "administration"], ["information technology (it)", "information-technology"],
  ["information technology", "information-technology"], ["it", "information-technology"], ["marketing", "marketing"],
]);

const normalize = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
export const isSuperAdmin = (user) => Boolean(user?.is_super_admin) || ["super admin", "superadmin"].includes(normalize(user?.user_type));
export const isAdministration = (user) => BY_NAME.get(normalize(user?.department)) === "administration";
export const hasAllDepartmentAccess = (user) => isSuperAdmin(user) || isAdministration(user);

export const getPortalAccess = (user) => {
  if (Array.isArray(user?.portal_access) && user.portal_access.length) return user.portal_access;
  if (hasAllDepartmentAccess(user)) return DEPARTMENTS.map(({ slug }) => slug);
  const portal = BY_NAME.get(normalize(user?.department));
  return portal ? [portal] : [];
};

export const canAccessPortal = (user, portal) => getPortalAccess(user).includes(portal);
export const getDefaultPortalPath = (user) => {
  if (hasAllDepartmentAccess(user)) return "/administration";
  const [portal] = getPortalAccess(user);
  return portal ? `/${portal}` : "/no-access";
};
