import { DEPARTMENT_PORTALS } from "../../config/departmentAccess.js";

const LABELS = Object.freeze({
    sales: "Sales",
    "pos-management": "POS Management",
    operations: "Operations",
    underwriting: "Underwriting",
    claims: "Claims",
    "customer-support": "Customer Support",
    renewal: "Renewal",
    finance: "Finance",
    accounts: "Accounts",
    "human-resources": "Human Resources (HR)",
    administration: "Administration",
    "information-technology": "Information Technology (IT)",
    marketing: "Marketing"
});

const titleCase = value => value.replace(/(^|\s)\S/g, letter => letter.toUpperCase());

class DepartmentDashboardModel {
    static getLabel(department) {
        return LABELS[department] || titleCase(String(department).replace(/-/g, " "));
    }

    static getDashboard(department) {
        const label = this.getLabel(department);
        if (department === "administration") {
            const departments = DEPARTMENT_PORTALS.filter(item => item !== "administration");
            return {
                department,
                label,
                summary: [
                    { label: "Departments", value: departments.length, trend: "All Access" },
                    { label: "Active Policies", value: 3864, trend: "+9%" },
                    { label: "Pending Renewals", value: 147, trend: "This Month" },
                    { label: "Open Claims", value: 38, trend: "Action Required" }
                ],
                recentActivity: departments.slice(0, 6).map((item, index) => ({
                    id: index + 1,
                    title: `${this.getLabel(item)} insurance report updated`,
                    owner: `${this.getLabel(item)} Team`,
                    status: index % 2 ? "In Review" : "Completed"
                }))
            };
        }
        return {
            department,
            label,
            summary: [
                { label: "Open Items", value: 24, trend: "+8%" },
                { label: "Completed Today", value: 18, trend: "+12%" },
                { label: "Pending Approval", value: 7, trend: "-3%" },
                { label: "Team Members", value: 12, trend: "Active" }
            ],
            recentActivity: [
                { id: 1, title: `${label} daily review completed`, owner: "Department Admin", status: "Completed" },
                { id: 2, title: `${label} monthly report prepared`, owner: "Team Lead", status: "In Review" },
                { id: 3, title: `New ${label} work item assigned`, owner: "Operations Desk", status: "Open" }
            ]
        };
    }

    static getReports(department, filters = {}) {
        const label = this.getLabel(department);
        let rows;
        if (department === "administration") {
            rows = DEPARTMENT_PORTALS.filter(item => item !== "administration").map((item, index) => ({
                id: index + 1,
                department: this.getLabel(item),
                name: `${this.getLabel(item)} Insurance Summary`,
                period: "July 2026",
                records: 120 + (index * 17),
                status: index % 4 === 0 ? "Processing" : "Ready",
                product: ["Motor", "Health", "Life", "Fire", "Marine"][index % 5]
            }));
        } else {
            rows = [
                { id: 1, name: `${label} Daily Report`, period: "Today", records: 42, status: "Ready", product: "Motor", department: label },
                { id: 2, name: `${label} Monthly Summary`, period: "July 2026", records: 318, status: "Ready", product: "Health", department: label },
                { id: 3, name: `${label} Pending Report`, period: "Current", records: 17, status: "Processing", product: "Fire", department: label }
            ];
        }

        const search = String(filters.search || "").trim().toLowerCase();
        const status = String(filters.status || "All");
        const product = String(filters.product || "All");
        const selectedDepartment = String(filters.department || "All");
        return rows.filter(row =>
            (!search || Object.values(row).some(value => String(value).toLowerCase().includes(search))) &&
            (status === "All" || row.status === status) &&
            (product === "All" || row.product === product) &&
            (selectedDepartment === "All" || row.department === selectedDepartment)
        );
    }

    static getPolicies(department) {
        const label = this.getLabel(department);
        if (department === "administration") {
            return DEPARTMENT_PORTALS.filter(item => item !== "administration").flatMap((item, index) => ([
                { id: (index * 2) + 1, policyNumber: `NIB-${String(index + 1).padStart(2, "0")}-260701`, customer: `${this.getLabel(item)} Customer A`, product: "Motor Package", premium: `₹${(18450 + (index * 750)).toLocaleString("en-IN")}`, status: "Active", department: this.getLabel(item) },
                { id: (index * 2) + 2, policyNumber: `NIB-${String(index + 1).padStart(2, "0")}-260702`, customer: `${this.getLabel(item)} Customer B`, product: "Health Insurance", premium: `₹${(24800 + (index * 650)).toLocaleString("en-IN")}`, status: index % 3 ? "Active" : "Pending", department: this.getLabel(item) }
            ]));
        }
        return [
            { id: 1, policyNumber: "NIB-MOT-260701", customer: "Aarav Sharma", product: "Motor Package", premium: "₹18,450", status: "Active", department: label },
            { id: 2, policyNumber: "NIB-HLT-260702", customer: "Diya Verma", product: "Health Insurance", premium: "₹24,800", status: "Active", department: label },
            { id: 3, policyNumber: "NIB-FIR-260703", customer: "Acme Industries", product: "Fire Insurance", premium: "₹42,600", status: "Pending", department: label }
        ];
    }

    static getRenewals(department) {
        const label = this.getLabel(department);
        if (department === "administration") {
            return DEPARTMENT_PORTALS.filter(item => item !== "administration").map((item, index) => ({
                id: index + 1,
                policyNumber: `NIB-REN-${String(index + 1).padStart(2, "0")}`,
                customer: `${this.getLabel(item)} Renewal Customer`,
                renewalDate: `2026-07-${String(21 + (index % 10)).padStart(2, "0")}`,
                premium: `₹${(16900 + (index * 500)).toLocaleString("en-IN")}`,
                status: index % 3 === 0 ? "Due" : index % 3 === 1 ? "Contacted" : "Quoted",
                department: this.getLabel(item)
            }));
        }
        return [
            { id: 1, policyNumber: "NIB-MOT-250721", customer: "Vivaan Patel", renewalDate: "2026-07-24", premium: "₹16,900", status: "Due", department: label },
            { id: 2, policyNumber: "NIB-HLT-250722", customer: "Ananya Singh", renewalDate: "2026-07-27", premium: "₹22,300", status: "Contacted", department: label },
            { id: 3, policyNumber: "NIB-MAR-250723", customer: "Blue Ocean Traders", renewalDate: "2026-07-30", premium: "₹31,750", status: "Quoted", department: label }
        ];
    }

    static getMasters(department) {
        const label = this.getLabel(department);
        if (department === "administration") {
            return DEPARTMENT_PORTALS.filter(item => item !== "administration").map((item, index) => ({
                id: index + 1,
                department: this.getLabel(item),
                name: `${this.getLabel(item)} Insurance Master`,
                count: 6 + index,
                updatedAt: "2026-07-20"
            }));
        }
        return [
            { id: 1, name: `${label} Categories`, count: 8, updatedAt: "2026-07-20" },
            { id: 2, name: `${label} Status Types`, count: 6, updatedAt: "2026-07-20" },
            { id: 3, name: `${label} Assignment Rules`, count: 12, updatedAt: "2026-07-19" }
        ];
    }
}

export default DepartmentDashboardModel;
