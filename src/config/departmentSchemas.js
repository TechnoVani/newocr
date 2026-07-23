import { DEPARTMENT_DEFINITIONS } from "./departmentDefinitions";

const dependent = {
  sales: ["leadSource", "Lead Source", ["Direct", "POSP", "Referral"], "salesStage", "Sales Stage", { Direct: ["New Lead", "Quoted", "Converted"], POSP: ["Assigned", "Follow-up", "Converted"], Referral: ["Verified", "Quoted", "Converted"] }],
  "pos-management": ["partnerType", "Partner Type", ["POSP", "BQP", "Reference"], "onboardingStatus", "Onboarding Status", { POSP: ["KYC Pending", "Training", "Active"], BQP: ["Verification", "Approved"], Reference: ["New", "Verified"] }],
  underwriting: ["riskCategory", "Risk Category", ["Motor", "Health", "Commercial"], "decision", "Underwriting Decision", { Motor: ["Inspect", "Approve", "Decline"], Health: ["Medical Review", "Approve", "Load Premium"], Commercial: ["Survey", "Refer", "Approve"] }],
  claims: ["claimType", "Claim Type", ["Cashless", "Reimbursement", "Total Loss"], "claimStage", "Claim Stage", { Cashless: ["Pre-Authorisation", "Approved", "Settled"], Reimbursement: ["Documents Pending", "Assessment", "Settled"], "Total Loss": ["Survey", "Investigation", "Settled"] }],
  "customer-support": ["requestType", "Request Type", ["Policy", "Claim", "Endorsement"], "priority", "Priority", { Policy: ["Normal", "Urgent"], Claim: ["High", "Critical"], Endorsement: ["Normal", "High"] }],
  renewal: ["renewalType", "Renewal Type", ["Motor", "Health", "Commercial"], "followUpStatus", "Follow-up Status", { Motor: ["Due", "Quoted", "Renewed"], Health: ["Due", "Medical Review", "Renewed"], Commercial: ["Survey Pending", "Quoted", "Renewed"] }],
  finance: ["transactionType", "Transaction Type", ["Premium", "Commission", "Refund"], "reconciliationStatus", "Reconciliation Status", { Premium: ["Received", "Matched", "Posted"], Commission: ["Calculated", "Approved", "Paid"], Refund: ["Requested", "Approved", "Processed"] }],
  "human-resources": ["employeeRequest", "Employee Request", ["Joining", "Leave", "Exit"], "employeeStatus", "Employee Status", { Joining: ["Documents Pending", "Verified", "Active"], Leave: ["Requested", "Approved", "Rejected"], Exit: ["Notice", "Clearance", "Relieved"] }],
  "information-technology": ["ticketType", "Ticket Type", ["Access", "Application", "Infrastructure"], "severity", "Severity", { Access: ["Low", "Medium"], Application: ["Medium", "High", "Critical"], Infrastructure: ["High", "Critical"] }],
  marketing: ["campaignType", "Campaign Type", ["Motor", "Health", "Corporate"], "channel", "Channel", { Motor: ["Dealer", "Digital", "POSP"], Health: ["Digital", "Branch", "Corporate"], Corporate: ["Email", "Events", "Direct"] }],
};

export const getLocalDepartmentSchema = (slug) => {
  const spec = dependent[slug];
  const formFields = [
    { name: "customerName", label: "Customer Name", type: "text", required: true },
    { name: "policyNumber", label: "Policy Number", type: "text", required: true },
    { name: "insuranceProduct", label: "Insurance Product", type: "select", required: true, options: ["Motor", "Health", "Life", "Fire", "Marine"] },
  ];
  if (spec) formFields.push(
    { name: spec[0], label: spec[1], type: "select", options: spec[2] },
    { name: spec[3], label: spec[4], type: "select", dependsOn: spec[0], optionMap: spec[5] },
  );
  if (slug === "administration") formFields.push(
    { name: "selectedDepartment", label: "Department", type: "select", options: DEPARTMENT_DEFINITIONS.filter(({ slug: item }) => item !== "administration").map(({ label }) => label) },
    { name: "dataScope", label: "Data Scope", type: "select", dependsOn: "selectedDepartment", defaultOptions: ["Dashboard", "Policies", "Renewals", "Reports", "Master"] },
  );
  return {
    reportFilters: [
      { name: "search", label: "Search", type: "search" },
      { name: "status", label: "Status", type: "select", options: ["All", "Ready", "Processing", "Active", "Pending", "Due", "Contacted", "Quoted"] },
      { name: "product", label: "Product", type: "select", options: ["All", "Motor", "Health", "Life", "Fire", "Marine"] },
      ...(slug === "administration" ? [{ name: "department", label: "Department", type: "select", options: ["All", ...DEPARTMENT_DEFINITIONS.filter(({ slug: item }) => item !== "administration").map(({ label }) => label)] }] : []),
    ],
    formFields,
  };
};
