const commonFields = [
    { name: "customerName", label: "Customer Name", type: "text", required: true },
    { name: "policyNumber", label: "Policy Number", type: "text", required: true },
    { name: "insuranceProduct", label: "Insurance Product", type: "select", required: true, options: ["Motor", "Health", "Life", "Fire", "Marine"] }
];

const departmentFields = {
    sales: [
        { name: "leadSource", label: "Lead Source", type: "select", options: ["Direct", "POSP", "Referral"] },
        { name: "salesStage", label: "Sales Stage", type: "select", dependsOn: "leadSource", optionMap: { Direct: ["New Lead", "Quoted", "Converted"], POSP: ["Assigned", "Follow-up", "Converted"], Referral: ["Verified", "Quoted", "Converted"] } }
    ],
    "pos-management": [
        { name: "partnerType", label: "Partner Type", type: "select", options: ["POSP", "BQP", "Reference"] },
        { name: "onboardingStatus", label: "Onboarding Status", type: "select", dependsOn: "partnerType", optionMap: { POSP: ["KYC Pending", "Training", "Active"], BQP: ["Verification", "Approved"], Reference: ["New", "Verified"] } }
    ],
    underwriting: [
        { name: "riskCategory", label: "Risk Category", type: "select", options: ["Motor", "Health", "Commercial"] },
        { name: "decision", label: "Underwriting Decision", type: "select", dependsOn: "riskCategory", optionMap: { Motor: ["Inspect", "Approve", "Decline"], Health: ["Medical Review", "Approve", "Load Premium"], Commercial: ["Survey", "Refer", "Approve"] } }
    ],
    claims: [
        { name: "claimType", label: "Claim Type", type: "select", options: ["Cashless", "Reimbursement", "Total Loss"] },
        { name: "claimStage", label: "Claim Stage", type: "select", dependsOn: "claimType", optionMap: { Cashless: ["Pre-Authorisation", "Approved", "Settled"], Reimbursement: ["Documents Pending", "Assessment", "Settled"], "Total Loss": ["Survey", "Investigation", "Settled"] } }
    ],
    "customer-support": [
        { name: "requestType", label: "Request Type", type: "select", options: ["Policy", "Claim", "Endorsement"] },
        { name: "priority", label: "Priority", type: "select", dependsOn: "requestType", optionMap: { Policy: ["Normal", "Urgent"], Claim: ["High", "Critical"], Endorsement: ["Normal", "High"] } }
    ],
    renewal: [
        { name: "renewalType", label: "Renewal Type", type: "select", options: ["Motor", "Health", "Commercial"] },
        { name: "followUpStatus", label: "Follow-up Status", type: "select", dependsOn: "renewalType", optionMap: { Motor: ["Due", "Quoted", "Renewed"], Health: ["Due", "Medical Review", "Renewed"], Commercial: ["Survey Pending", "Quoted", "Renewed"] } }
    ],
    finance: [
        { name: "transactionType", label: "Transaction Type", type: "select", options: ["Premium", "Commission", "Refund"] },
        { name: "reconciliationStatus", label: "Reconciliation Status", type: "select", dependsOn: "transactionType", optionMap: { Premium: ["Received", "Matched", "Posted"], Commission: ["Calculated", "Approved", "Paid"], Refund: ["Requested", "Approved", "Processed"] } }
    ],
    accounts: [],
    "human-resources": [
        { name: "employeeRequest", label: "Employee Request", type: "select", options: ["Joining", "Leave", "Exit"] },
        { name: "employeeStatus", label: "Employee Status", type: "select", dependsOn: "employeeRequest", optionMap: { Joining: ["Documents Pending", "Verified", "Active"], Leave: ["Requested", "Approved", "Rejected"], Exit: ["Notice", "Clearance", "Relieved"] } }
    ],
    administration: [
        { name: "selectedDepartment", label: "Department", type: "select", options: ["Sales", "POS Management", "Operations", "Underwriting", "Claims", "Customer Support", "Renewal", "Finance", "Accounts", "Human Resources (HR)", "Information Technology (IT)", "Marketing"] },
        { name: "dataScope", label: "Data Scope", type: "select", dependsOn: "selectedDepartment", defaultOptions: ["Dashboard", "Policies", "Renewals", "Reports", "Master"] }
    ],
    "information-technology": [
        { name: "ticketType", label: "Ticket Type", type: "select", options: ["Access", "Application", "Infrastructure"] },
        { name: "severity", label: "Severity", type: "select", dependsOn: "ticketType", optionMap: { Access: ["Low", "Medium"], Application: ["Medium", "High", "Critical"], Infrastructure: ["High", "Critical"] } }
    ],
    marketing: [
        { name: "campaignType", label: "Campaign Type", type: "select", options: ["Motor", "Health", "Corporate"] },
        { name: "channel", label: "Channel", type: "select", dependsOn: "campaignType", optionMap: { Motor: ["Dealer", "Digital", "POSP"], Health: ["Digital", "Branch", "Corporate"], Corporate: ["Email", "Events", "Direct"] } }
    ],
    operations: []
};

class DepartmentSchemaModel {
    static get(department) {
        return {
            department,
            reportFilters: [
                { name: "search", label: "Search", type: "search" },
                { name: "status", label: "Status", type: "select", options: ["All", "Ready", "Processing", "Active", "Pending", "Due", "Contacted", "Quoted"] },
                { name: "product", label: "Product", type: "select", options: ["All", "Motor", "Health", "Life", "Fire", "Marine"] },
                ...(department === "administration" ? [{ name: "department", label: "Department", type: "select", options: ["All", "Sales", "POS Management", "Operations", "Underwriting", "Claims", "Customer Support", "Renewal", "Finance", "Accounts", "Human Resources (HR)", "Information Technology (IT)", "Marketing"] }] : [])
            ],
            formFields: [...commonFields, ...(departmentFields[department] || [])]
        };
    }
}

export default DepartmentSchemaModel;
