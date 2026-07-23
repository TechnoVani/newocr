import SalesDepartmentApp from "./sales/DepartmentApp";
import PosManagementDepartmentApp from "./pos-management/DepartmentApp";
import UnderwritingDepartmentApp from "./underwriting/DepartmentApp";
import ClaimsDepartmentApp from "./claims/DepartmentApp";
import CustomerSupportDepartmentApp from "./customer-support/DepartmentApp";
import RenewalDepartmentApp from "./renewal/DepartmentApp";
import FinanceDepartmentApp from "./finance/DepartmentApp";
import HumanResourcesDepartmentApp from "./human-resources/DepartmentApp";
import AdministrationDepartmentApp from "./administration/DepartmentApp";
import InformationTechnologyDepartmentApp from "./information-technology/DepartmentApp";
import MarketingDepartmentApp from "./marketing/DepartmentApp";
import { DEPARTMENT_DEFINITIONS } from "../config/departmentDefinitions";

const components = {
  sales: SalesDepartmentApp,
  "pos-management": PosManagementDepartmentApp,
  underwriting: UnderwritingDepartmentApp,
  claims: ClaimsDepartmentApp,
  "customer-support": CustomerSupportDepartmentApp,
  renewal: RenewalDepartmentApp,
  finance: FinanceDepartmentApp,
  "human-resources": HumanResourcesDepartmentApp,
  administration: AdministrationDepartmentApp,
  "information-technology": InformationTechnologyDepartmentApp,
  marketing: MarketingDepartmentApp,
};

export const GENERIC_DEPARTMENTS = Object.freeze(
  DEPARTMENT_DEFINITIONS
    .filter(({ specialized }) => !specialized)
    .map((department) => ({ ...department, Component: components[department.slug] }))
);
