export const DEPARTMENT_PORTALS = Object.freeze([
    "sales",
    "pos-management",
    "operations",
    "underwriting",
    "claims",
    "customer-support",
    "renewal",
    "finance",
    "accounts",
    "human-resources",
    "administration",
    "information-technology",
    "marketing",
    "compliance",
    "legal",
    "training",
    "business-development",
    "audit",
    "risk-management",
    "crm"
]);

export const PORTALS = Object.freeze({
    SALES: "sales",
    POS_MANAGEMENT: "pos-management",
    OPERATIONS: "operations",
    UNDERWRITING: "underwriting",
    CLAIMS: "claims",
    CUSTOMER_SUPPORT: "customer-support",
    RENEWAL: "renewal",
    FINANCE: "finance",
    ACCOUNTS: "accounts",
    HUMAN_RESOURCES: "human-resources",
    ADMINISTRATION: "administration",
    INFORMATION_TECHNOLOGY: "information-technology",
    MARKETING: "marketing",
    COMPLIANCE: "compliance",
    LEGAL: "legal",
    TRAINING: "training",
    BUSINESS_DEVELOPMENT: "business-development",
    AUDIT: "audit",
    RISK_MANAGEMENT: "risk-management",
    CRM: "crm"
});

const DEPARTMENT_PORTAL = new Map([
    ["sales", PORTALS.SALES],
    ["pos management", PORTALS.POS_MANAGEMENT],
    ["operations", PORTALS.OPERATIONS],
    ["underwriting", PORTALS.UNDERWRITING],
    ["claims", PORTALS.CLAIMS],
    ["customer support", PORTALS.CUSTOMER_SUPPORT],
    ["renewal", PORTALS.RENEWAL],
    ["finance", PORTALS.FINANCE],
    ["accounts", PORTALS.ACCOUNTS],
    ["human resources (hr)", PORTALS.HUMAN_RESOURCES],
    ["human resources", PORTALS.HUMAN_RESOURCES],
    ["hr", PORTALS.HUMAN_RESOURCES],
    ["administration", PORTALS.ADMINISTRATION],
    ["information technology (it)", PORTALS.INFORMATION_TECHNOLOGY],
    ["information technology", PORTALS.INFORMATION_TECHNOLOGY],
    ["it", PORTALS.INFORMATION_TECHNOLOGY],
    ["marketing", PORTALS.MARKETING],
    ["compliance", PORTALS.COMPLIANCE],
    ["legal", PORTALS.LEGAL],
    ["training", PORTALS.TRAINING],
    ["business development", PORTALS.BUSINESS_DEVELOPMENT],
    ["audit", PORTALS.AUDIT],
    ["risk management", PORTALS.RISK_MANAGEMENT],
    ["crm (customer relationship management)", PORTALS.CRM],
    ["crm", PORTALS.CRM]
]);

const normalize = value => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

export const isSuperAdmin = user => ["super admin", "superadmin"].includes(normalize(user?.user_type));
export const isAdministration = user => DEPARTMENT_PORTAL.get(normalize(user?.department)) === PORTALS.ADMINISTRATION;
export const isAdmin = user =>
    isAdministration(user) || ["admin", "administrator"].includes(normalize(user?.user_type));
export const hasAllDepartmentAccess = user => isSuperAdmin(user) || isAdmin(user);

export const getPortalAccess = user => {
    if (hasAllDepartmentAccess(user)) return [...DEPARTMENT_PORTALS];
    const portal = DEPARTMENT_PORTAL.get(normalize(user?.department));
    return portal ? [portal] : [];
};

export const canAccessPortal = (user, portal) =>
    DEPARTMENT_PORTALS.includes(portal) && getPortalAccess(user).includes(portal);
