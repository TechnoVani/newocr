import * as XLSX from "xlsx";

export const currency = value => Number(value || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const monthValue = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const monthParts = value => {
  const [year, month] = String(value).split("-").map(Number);
  return { year, month };
};

export const exportRows = (rows, fileName, sheetName = "Report") => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  if (rows.length) {
    worksheet["!cols"] = Object.keys(rows[0]).map(key => ({
      wch: Math.min(40, Math.max(key.length + 3, ...rows.map(row => String(row[key] ?? "").length + 2))),
    }));
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const policyColumns = [
  { key: "policy_number", label: "Policy No." },
  { key: "insured_name", label: "Customer Name" },
  { key: "insurance_company", label: "Insurance Company" },
  { key: "insurer_branch", label: "Insurer Branch" },
  { key: "policy_type", label: "Policy Type" },
  { key: "vehicle_category", label: "Category" },
  { key: "registration_number", label: "Registration No." },
  { key: "chassis_number", label: "Chassis No." },
  { key: "engine_number", label: "Engine No." },
  { key: "issue_date", label: "Issue Date" },
  { key: "start_date", label: "Start Date" },
  { key: "od_expiry", label: "OD Expiry" },
  { key: "tp_expiry", label: "TP Expiry" },
  { key: "total_od", label: "OD Premium", render: value => `₹${currency(value)}` },
  { key: "total_tp", label: "TP Premium", render: value => `₹${currency(value)}` },
  { key: "net_premium", label: "Net Premium", render: value => `₹${currency(value)}` },
  { key: "pos_display", label: "POSP" },
  { key: "reference_display", label: "Reference" },
];
