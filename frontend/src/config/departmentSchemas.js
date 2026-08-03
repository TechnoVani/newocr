import { DEPARTMENT_DEFINITIONS } from "./departmentDefinitions";

const dependent = {
  sales: ["leadSource", "Lead Source", ["Direct", "POSP", "Referral"], "salesStage", "Sales Stage", { Direct: ["New Lead", "Quoted", "Converted"], POSP: ["Assigned", "Follow-up", "Converted"], Referral: ["Verified", "Quoted", "Converted"] }],
  "pos-management": ["partnerType", "Partner Type", ["POSP", "BQP", "Reference"], "onboardingStatus", "Onboarding Status", { POSP: ["KYC Pending", "Training", "Active"], BQP: ["Verification", "Approved"], Reference: ["New", "Verified"] }],
  underwriting: ["riskCategory", "Risk Category", ["Motor", "Health", "Commercial"], "decision", "Underwriting Decision", { Motor: ["Inspect", "Approve", "Decline"], Health: ["Medical Review", "Approve", "Load Premium"], Commercial: ["Survey", "Refer", "Approve"] }],
  claims: ["claimType", "Claim Type", ["Cashless", "Reimbursement", "Total Loss"], "claimStage", "Claim Stage", { Cashless: ["Pre-Authorisation", "Approved", "Settled"], Reimbursement: ["Documents Pending", "Assessment", "Settled"], "Total Loss": ["Survey", "Investigation", "Settled"] }],
  "customer-support": ["requestType", "Request Type", ["Policy", "Claim", "Endorsement"], "requestPriority", "Request Priority", { Policy: ["Normal", "Urgent"], Claim: ["High", "Critical"], Endorsement: ["Normal", "High"] }],
  renewal: ["renewalType", "Renewal Type", ["Motor", "Health", "Commercial"], "followUpStatus", "Follow-up Status", { Motor: ["Due", "Quoted", "Renewed"], Health: ["Due", "Medical Review", "Renewed"], Commercial: ["Survey Pending", "Quoted", "Renewed"] }],
  finance: ["transactionType", "Transaction Type", ["Premium", "Commission", "Refund"], "reconciliationStatus", "Reconciliation Status", { Premium: ["Received", "Matched", "Posted"], Commission: ["Calculated", "Approved", "Paid"], Refund: ["Requested", "Approved", "Processed"] }],
  "human-resources": ["employeeRequest", "Employee Request", ["Joining", "Leave", "Exit"], "employeeStatus", "Employee Status", { Joining: ["Documents Pending", "Verified", "Active"], Leave: ["Requested", "Approved", "Rejected"], Exit: ["Notice", "Clearance", "Relieved"] }],
  "information-technology": ["ticketType", "Ticket Type", ["Access", "Application", "Infrastructure"], "severity", "Severity", { Access: ["Low", "Medium"], Application: ["Medium", "High", "Critical"], Infrastructure: ["High", "Critical"] }],
  marketing: ["campaignType", "Campaign Type", ["Motor", "Health", "Corporate"], "channel", "Channel", { Motor: ["Dealer", "Digital", "POSP"], Health: ["Digital", "Branch", "Corporate"], Corporate: ["Email", "Events", "Direct"] }],
  administration: ["adminTask", "Administration Task", ["Department Review", "Access Review", "Branch Support", "Vendor Management"], "adminStage", "Task Stage", { "Department Review": ["Review", "Approved"], "Access Review": ["Review", "Approved"], "Branch Support": ["Assigned", "Resolved"], "Vendor Management": ["Review", "Completed"] }],
  compliance: ["reviewType", "Review Type", ["KYC", "AML", "Regulatory", "Policy Audit"], "finding", "Compliance Finding", { KYC: ["Compliant", "Observation", "Non-compliant"], AML: ["Compliant", "Observation", "Escalated"], Regulatory: ["Compliant", "Observation", "Non-compliant"], "Policy Audit": ["Compliant", "Observation", "Non-compliant"] }],
  legal: ["legalMatter", "Legal Matter", ["Claim Dispute", "Contract", "Notice", "Litigation"], "legalStage", "Legal Stage", { "Claim Dispute": ["Review", "Negotiation", "Closed"], Contract: ["Review", "Response Due", "Closed"], Notice: ["Review", "Response Due", "Closed"], Litigation: ["Review", "Filed", "Closed"] }],
  training: ["trainingType", "Training Type", ["Product", "Compliance", "Sales", "System"], "audience", "Audience", { Product: ["Employee", "POSP", "Manager"], Compliance: ["Employee", "POSP", "Manager"], Sales: ["Employee", "POSP", "Branch"], System: ["Employee", "Manager", "Branch"] }],
  "business-development": ["opportunityType", "Opportunity Type", ["Corporate", "Channel", "Partnership", "Cross-sell"], "opportunityStage", "Opportunity Stage", { Corporate: ["Identified", "Meeting", "Proposal", "Negotiation", "Won", "Lost"], Channel: ["Identified", "Meeting", "Proposal", "Won", "Lost"], Partnership: ["Identified", "Meeting", "Negotiation", "Won", "Lost"], "Cross-sell": ["Identified", "Proposal", "Won", "Lost"] }],
  audit: ["auditType", "Audit Type", ["Process", "Financial", "Policy", "Branch"], "findingSeverity", "Finding Severity", { Process: ["Low", "Medium", "High", "Critical"], Financial: ["Low", "Medium", "High", "Critical"], Policy: ["Low", "Medium", "High", "Critical"], Branch: ["Low", "Medium", "High", "Critical"] }],
  "risk-management": ["riskType", "Risk Type", ["Operational", "Underwriting", "Fraud", "Financial"], "riskRating", "Risk Rating", { Operational: ["Low", "Medium", "High", "Critical"], Underwriting: ["Low", "Medium", "High", "Critical"], Fraud: ["Low", "Medium", "High", "Critical"], Financial: ["Low", "Medium", "High", "Critical"] }],
  crm: ["interactionType", "Interaction Type", ["Follow-up", "Retention", "Complaint", "Cross-sell"], "outcome", "Outcome", { "Follow-up": ["Scheduled", "Contacted", "Resolved"], Retention: ["Contacted", "Resolved", "Escalated"], Complaint: ["Contacted", "Resolved", "Escalated"], "Cross-sell": ["Contacted", "Converted", "Resolved"] }],
};

export const getLocalDepartmentSchema = (slug) => {
  const spec = dependent[slug];
  const formFields = slug === "human-resources" ? [
    { name: "employeeName", label: "Employee / Candidate Name", type: "text", required: true },
    { name: "policyNumber", label: "Employee Code (if existing)", type: "text" },
    { name: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High", "Critical"] },
    { name: "description", label: "HR Notes", type: "text" },
  ] : [
    { name: "policyNumber", label: ["pos-management", "administration", "information-technology", "training"].includes(slug) ? "Related Policy Number (optional)" : "Policy Number", type: "text", required: !["pos-management", "administration", "information-technology", "training"].includes(slug) },
    { name: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High", "Critical"], defaultValue: "Normal" },
    { name: "dueDate", label: "Due Date", type: "date" },
    { name: "description", label: "Description / Notes", type: "textarea", required: true },
  ];
  if (spec) formFields.push(
    { name: spec[0], label: spec[1], type: "select", options: spec[2], required: true },
    { name: spec[3], label: spec[4], type: "select", dependsOn: spec[0], optionMap: spec[5] },
  );
  if (slug === "administration") formFields.push(
    { name: "selectedDepartment", label: "Department", type: "select", required: true, options: DEPARTMENT_DEFINITIONS.filter(({ slug: item }) => item !== "administration").map(({ label }) => label) },
    { name: "dataScope", label: "Data Scope", type: "select", required: true, options: ["Dashboard", "Policies", "Renewals", "Reports", "Master"] },
  );
  return {
    reportFilters: [
      { name: "search", label: "Search", type: "search" },
      { name: "status", label: "Status", type: "select", options: ["All", "Open", "In Progress", "Pending", "Approved", "Completed", "Rejected"] },
      { name: "product", label: "Work Type", type: "select", options: ["All", ...(spec?.[2] || [])] },
      { name: "priority", label: "Priority", type: "select", options: ["All", "Low", "Normal", "High", "Critical"] },
      ...(slug === "administration" ? [
        { name: "month", label: "Created Month", type: "month" },
        { name: "department", label: "Department", type: "select", options: ["All", ...DEPARTMENT_DEFINITIONS.filter(({ slug: item }) => item !== "administration").map(({ label }) => label)] },
      ] : []),
    ],
    formFields,
  };
};
