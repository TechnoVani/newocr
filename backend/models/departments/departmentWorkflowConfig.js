export const WORKFLOW_STATUSES = Object.freeze([
  "Open", "In Progress", "Pending", "Approved", "Completed", "Rejected",
]);

export const STATUS_TRANSITIONS = Object.freeze({
  Open: ["In Progress", "Rejected"],
  "In Progress": ["Pending", "Approved", "Completed", "Rejected"],
  Pending: ["In Progress", "Approved", "Rejected"],
  Approved: ["In Progress", "Completed"],
  Completed: [],
  Rejected: ["Open"],
});

const select = (name, label, options, extra = {}) => ({
  name, label, type: "select", options, required: true, ...extra,
});

export const DEPARTMENT_WORKFLOWS = Object.freeze({
  sales: {
    workTypeField: "leadSource",
    fields: [
      select("leadSource", "Lead Source", ["Direct", "POSP", "Referral"]),
      select("salesStage", "Sales Stage", ["New Lead", "Quoted", "Follow-up", "Converted", "Lost"]),
      { name: "expectedPremium", label: "Expected Premium", type: "number" },
    ],
  },
  "pos-management": {
    policyRequired: false,
    workTypeField: "partnerType",
    fields: [
      select("partnerType", "Partner Type", ["POSP", "BQP", "Reference"]),
      select("onboardingStatus", "Onboarding Stage", ["KYC Pending", "Verification", "Training", "Approved", "Active"]),
      { name: "partnerCode", label: "Partner Code", type: "text" },
    ],
  },
  underwriting: {
    workTypeField: "riskCategory",
    fields: [
      select("riskCategory", "Risk Category", ["Motor", "Health", "Commercial"]),
      select("decision", "Underwriting Decision", ["Inspect", "Medical Review", "Survey", "Refer", "Approve", "Decline"]),
      { name: "riskNotes", label: "Risk Notes", type: "textarea" },
    ],
  },
  claims: {
    workTypeField: "claimType",
    fields: [
      select("claimType", "Claim Type", ["Cashless", "Reimbursement", "Total Loss"]),
      select("claimStage", "Claim Stage", ["Intimation", "Documents Pending", "Survey", "Assessment", "Approved", "Settled"]),
      { name: "claimNumber", label: "Claim Number", type: "text", required: true },
      { name: "claimAmount", label: "Claim Amount", type: "number" },
    ],
  },
  "customer-support": {
    workTypeField: "requestType",
    fields: [
      select("requestType", "Request Type", ["Policy", "Claim", "Endorsement", "Complaint"]),
      select("serviceLevel", "Service Level", ["Standard", "Urgent", "Escalated"]),
      { name: "requestReference", label: "Request Reference", type: "text" },
    ],
  },
  renewal: {
    workTypeField: "renewalType",
    fields: [
      select("renewalType", "Renewal Type", ["Motor", "Health", "Commercial"]),
      select("followUpStatus", "Follow-up Stage", ["Due", "Contacted", "Quoted", "Negotiation", "Renewed", "Lost"]),
      { name: "quotedPremium", label: "Quoted Premium", type: "number" },
    ],
  },
  finance: {
    workTypeField: "transactionType",
    fields: [
      select("transactionType", "Transaction Type", ["Premium", "Commission", "Refund"]),
      select("reconciliationStatus", "Reconciliation Stage", ["Received", "Matched", "Approved", "Posted", "Paid", "Processed"]),
      { name: "transactionReference", label: "Transaction Reference", type: "text", required: true },
      { name: "transactionAmount", label: "Transaction Amount", type: "number" },
    ],
  },
  "human-resources": {
    policyRequired: false,
    workTypeField: "employeeRequest",
    fields: [
      select("employeeRequest", "HR Process", ["Joining", "Leave", "Exit"]),
      select("employeeStatus", "Process Stage", ["Documents Pending", "Verified", "Requested", "Approved", "Notice", "Clearance", "Relieved"]),
      { name: "personalEmail", label: "Personal Email", type: "email" },
      { name: "mobile", label: "Mobile Number", type: "text" },
      { name: "joiningDate", label: "Joining Date", type: "date" },
      { name: "leaveFrom", label: "Leave From", type: "date" },
      { name: "leaveTo", label: "Leave To", type: "date" },
      { name: "exitDate", label: "Exit Date", type: "date" },
    ],
  },
  administration: {
    policyRequired: false,
    workTypeField: "adminTask",
    fields: [
      select("adminTask", "Administration Task", ["Department Review", "Access Review", "Branch Support", "Vendor Management"]),
      select("selectedDepartment", "Department", [
        "Sales", "POS Management", "Operations", "Underwriting", "Claims",
        "Customer Support", "Renewal", "Finance", "Accounts", "Human Resources (HR)",
        "Information Technology (IT)", "Marketing", "Compliance", "Legal", "Training",
        "Business Development", "Audit", "Risk Management", "CRM (Customer Relationship Management)",
      ]),
      select("dataScope", "Data Scope", ["Dashboard", "Policies", "Renewals", "Reports", "Master"]),
    ],
  },
  "information-technology": {
    policyRequired: false,
    workTypeField: "ticketType",
    fields: [
      select("ticketType", "Ticket Type", ["Access", "Application", "Infrastructure", "Security"]),
      select("severity", "Severity", ["Low", "Medium", "High", "Critical"]),
      { name: "assetReference", label: "Asset / Application", type: "text" },
    ],
  },
  marketing: {
    workTypeField: "campaignType",
    fields: [
      select("campaignType", "Campaign Type", ["Motor", "Health", "Corporate", "Renewal"]),
      select("channel", "Channel", ["Dealer", "Digital", "POSP", "Branch", "Email", "Events"]),
      { name: "campaignName", label: "Campaign Name", type: "text", required: true },
    ],
  },
  compliance: {
    workTypeField: "reviewType",
    fields: [
      select("reviewType", "Review Type", ["KYC", "AML", "Regulatory", "Policy Audit"]),
      select("finding", "Compliance Finding", ["Compliant", "Observation", "Non-compliant", "Escalated"]),
      { name: "regulationReference", label: "Regulation Reference", type: "text" },
    ],
  },
  legal: {
    workTypeField: "legalMatter",
    fields: [
      select("legalMatter", "Legal Matter", ["Claim Dispute", "Contract", "Notice", "Litigation"]),
      select("legalStage", "Legal Stage", ["Review", "Response Due", "Negotiation", "Filed", "Closed"]),
      { name: "caseReference", label: "Case / Notice Reference", type: "text" },
    ],
  },
  training: {
    policyRequired: false,
    workTypeField: "trainingType",
    fields: [
      select("trainingType", "Training Type", ["Product", "Compliance", "Sales", "System"]),
      select("audience", "Audience", ["Employee", "POSP", "Manager", "Branch"]),
      { name: "sessionDate", label: "Session Date", type: "date", required: true },
      { name: "trainerName", label: "Trainer Name", type: "text" },
    ],
  },
  "business-development": {
    workTypeField: "opportunityType",
    fields: [
      select("opportunityType", "Opportunity Type", ["Corporate", "Channel", "Partnership", "Cross-sell"]),
      select("opportunityStage", "Opportunity Stage", ["Identified", "Meeting", "Proposal", "Negotiation", "Won", "Lost"]),
      { name: "opportunityValue", label: "Opportunity Value", type: "number" },
    ],
  },
  audit: {
    workTypeField: "auditType",
    fields: [
      select("auditType", "Audit Type", ["Process", "Financial", "Policy", "Branch"]),
      select("findingSeverity", "Finding Severity", ["Low", "Medium", "High", "Critical"]),
      { name: "auditReference", label: "Audit Reference", type: "text" },
    ],
  },
  "risk-management": {
    workTypeField: "riskType",
    fields: [
      select("riskType", "Risk Type", ["Operational", "Underwriting", "Fraud", "Financial"]),
      select("riskRating", "Risk Rating", ["Low", "Medium", "High", "Critical"]),
      { name: "mitigationPlan", label: "Mitigation Plan", type: "textarea", required: true },
    ],
  },
  crm: {
    workTypeField: "interactionType",
    fields: [
      select("interactionType", "Interaction Type", ["Follow-up", "Retention", "Complaint", "Cross-sell"]),
      select("outcome", "Outcome", ["Scheduled", "Contacted", "Resolved", "Converted", "Escalated"]),
      { name: "nextActionDate", label: "Next Action Date", type: "date" },
    ],
  },
});

export const getDepartmentWorkflow = (department) => DEPARTMENT_WORKFLOWS[department] || {
  workTypeField: "workType",
  fields: [select("workType", "Work Type", ["General"])],
};
