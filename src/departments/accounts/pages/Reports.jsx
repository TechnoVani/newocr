import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import ReusableTable from "../../../components/reusable/ReusableTable";

const columns = [
  { key: "id", label: "Report ID" }, { key: "name", label: "Company / Branch" }, { key: "product", label: "Type" },
  { key: "location", label: "Location" }, { key: "contact", label: "Contact" }, { key: "status", label: "Status" }, { key: "date", label: "Updated" },
];

export default function AccountsReports({ reportType, companies = [], branches = [] }) {
  const [filters, setFilters] = useState({ status: "All", product: "All" });
  const rows = useMemo(() => [
    ...companies.map((item, index) => ({ id: item.id || `COMP-${index + 1}`, name: item.insurer || item.name || "Unnamed Company", product: "Company", location: item.address || "Head Office", contact: item.link || "—", status: "Ready", date: item.created_at || item.createdAt || "—" })),
    ...branches.map((item, index) => ({ id: item.id || `BR-${index + 1}`, name: item.name || item.insurer || "Unnamed Branch", product: "Branch", location: [item.city, item.state].filter(Boolean).join(", ") || item.address || "Branch Office", contact: item.contact || item.mobile || "—", status: index % 3 ? "Ready" : "Pending", date: item.created_at || item.createdAt || "—" })),
  ], [branches, companies]);
  const visible = useMemo(() => rows.filter((row) => (filters.status === "All" || row.status === filters.status) && (filters.product === "All" || row.product === filters.product)), [filters, rows]);
  const exportExcel = (exportRows = visible) => {
    if (!exportRows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(exportRows.map((row) => Object.fromEntries(columns.map((column) => [column.label, row[column.key] ?? "N/A"]))));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts Report");
    XLSX.writeFile(workbook, "Accounts_Department_Report.xlsx");
  };
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <ReusableTable
        title={`Accounts Department Report · ${String(reportType || "report").replace(/-/g, " ")}`}
        rows={visible}
        columns={columns}
        pageSize={10}
        filters={[
          { name: "status", label: "Status", value: filters.status, options: ["All", "Ready", "Pending"], onChange: (event) => setFilters((current) => ({ ...current, status: event.target.value })) },
          { name: "product", label: "Report Type", value: filters.product, options: ["All", "Company", "Branch"], onChange: (event) => setFilters((current) => ({ ...current, product: event.target.value })) },
        ]}
        onResetFilters={() => setFilters({ status: "All", product: "All" })}
        onExport={exportExcel}
      />
    </main>
  );
}
