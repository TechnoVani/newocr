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
import ComplianceDepartmentApp from "./compliance/DepartmentApp";
import LegalDepartmentApp from "./legal/DepartmentApp";
import TrainingDepartmentApp from "./training/DepartmentApp";
import BusinessDevelopmentDepartmentApp from "./business-development/DepartmentApp";
import AuditDepartmentApp from "./audit/DepartmentApp";
import RiskManagementDepartmentApp from "./risk-management/DepartmentApp";
import CrmDepartmentApp from "./crm/DepartmentApp";
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
  compliance: ComplianceDepartmentApp,
  legal: LegalDepartmentApp,
  training: TrainingDepartmentApp,
  "business-development": BusinessDevelopmentDepartmentApp,
  audit: AuditDepartmentApp,
  "risk-management": RiskManagementDepartmentApp,
  crm: CrmDepartmentApp,
};

export const GENERIC_DEPARTMENTS = Object.freeze(
  DEPARTMENT_DEFINITIONS
    .filter(({ specialized }) => !specialized)
    .map((department) => ({
      ...department,
      Component: components[department.slug],
    }))
);
