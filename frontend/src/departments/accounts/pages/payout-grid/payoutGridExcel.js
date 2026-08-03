import * as XLSX from "xlsx";

export const PAYOUT_COLUMNS = [
  { key: "business_type", header: "Business Type", aliases: ["business", "business type", "business_type"] },
  { key: "category", header: "Vehicle Category", aliases: ["category", "motor category", "vehicle_category", "motor_category"] },
  { key: "classification", header: "Classification", aliases: ["vehicle classification", "vehicle_classification", "vehicle_Classification"] },
  { key: "product_type", header: "Product Type", aliases: ["product", "product_type"] },
  { key: "rto", header: "RTO", aliases: ["rto applicability", "rto code", "rto_codes"] },
  { key: "od_comm", header: "OD Commission", aliases: ["od comm", "od_comm", "od payout", "od %", "od commission %"] },
  { key: "tp_comm", header: "TP Commission", aliases: ["tp comm", "tp_comm", "tp payout", "tp %", "tp commission %"] },
  { key: "net_comm", header: "Net Commission", aliases: ["net comm", "net_comm", "net payout", "net %", "net commission %"] },
  { key: "cc", header: "CC", aliases: ["cc/hp", "cc_hp", "cubic capacity"] },
  { key: "fuel_type", header: "Fuel Type", aliases: ["fuel", "fuel_type"] },
  { key: "make", header: "Make", aliases: ["allowed make", "include make"] },
  { key: "decline_make", header: "Decline Make", aliases: ["declined make", "exclude make", "decline_make"] },
  { key: "model", header: "Model", aliases: ["allowed model", "include model"] },
  { key: "decline_model", header: "Decline Model", aliases: ["declined model", "exclude model", "decline_model"] },
  { key: "ncb", header: "NCB", aliases: ["ncb applicability"] },
  { key: "seat", header: "Seat", aliases: ["seating capacity", "seat capacity"] },
  { key: "gvw", header: "GVW", aliases: ["gross vehicle weight", "weight"] },
];

const normalizeHeader = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const headerMap = new Map(PAYOUT_COLUMNS.flatMap((column) =>
  [column.header, column.key, ...column.aliases].map((label) => [normalizeHeader(label), column.key])));

export const parsePayoutWorkbook = async (file) => {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
    dateNF: "yyyy-mm-dd",
  });
  const sheetName = workbook.SheetNames.find((name) => /payout|grid|commission/i.test(name)) || workbook.SheetNames[0];
  if (!sheetName) throw new Error("The workbook does not contain a worksheet.");

  const sourceRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd",
  });
  if (!sourceRows.length) throw new Error("The payout-grid worksheet is empty.");

  const recognizedHeaders = new Set();
  const rows = sourceRows.map((sourceRow) => {
    const normalized = {};
    Object.entries(sourceRow).forEach(([header, value]) => {
      const key = headerMap.get(normalizeHeader(header));
      if (key) {
        recognizedHeaders.add(key);
        normalized[key] = value;
      }
    });
    return normalized;
  }).filter((row) => Object.values(row).some((value) => String(value || "").trim()));

  if (!recognizedHeaders.has("category") && !recognizedHeaders.has("classification")) {
    throw new Error('The Excel file must contain a "Vehicle Category" or "Classification" column.');
  }
  if (!["od_comm", "tp_comm", "net_comm"].some((key) => recognizedHeaders.has(key))) {
    throw new Error("The Excel file must contain at least one OD, TP, or Net Commission column.");
  }
  if (!rows.length) throw new Error("No usable payout rows were found in the worksheet.");
  return rows;
};

export const downloadPayoutTemplate = () => {
  const workbook = XLSX.utils.book_new();
  const example = [{
    "Business Type": "New",
    "Vehicle Category": "Private Car",
    Classification: "Private Car",
    "Product Type": "Package",
    RTO: "All India",
    "OD Commission": 15,
    "TP Commission": 2.5,
    "Net Commission": 0,
    CC: "Up to 1500",
    "Fuel Type": "Petrol, Diesel",
    Make: "All",
    "Decline Make": "",
    Model: "All",
    "Decline Model": "",
    NCB: "0-50",
    Seat: "Up to 7",
    GVW: "N/A",
  }];
  const sheet = XLSX.utils.json_to_sheet(example);
  sheet["!autofilter"] = { ref: sheet["!ref"] };
  sheet["!cols"] = PAYOUT_COLUMNS.map(({ header }) => ({ wch: Math.max(15, header.length + 3) }));
  XLSX.utils.book_append_sheet(workbook, sheet, "Payout Grid");

  const instructions = XLSX.utils.aoa_to_sheet([
    ["Payout Grid Import Instructions"],
    ["Column", "Rule"],
    ["Vehicle Category / Classification", "At least one is required."],
    ["OD / TP / Net Commission", "At least one commission column is required. Enter 15 or 15%."],
    ["RTO", "Use a code, comma-separated codes, All India, or leave blank."],
    ["Seat / GVW", "Supports exact values, ranges such as 1-7, and rules such as Up to 3500 or Above 3500."],
    ["Upload behavior", "Uploading the same company and month replaces the previous grid for that company/month."],
  ]);
  instructions["!cols"] = [{ wch: 32 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(workbook, instructions, "Instructions");
  XLSX.writeFile(workbook, "Payout_Grid_Import_Template.xlsx");
};

export const exportPayoutReport = (rows) => {
  const exportRows = rows.map((row) => ({
    Company: row.company,
    Month: row.month,
    "Business Type": row.business_type,
    "Vehicle Category": row.category,
    Classification: row.classification,
    "Product Type": row.product_type,
    RTO: row.rto || "",
    "OD Commission": row.OD_Comm ?? "",
    "TP Commission": row.TP_Comm ?? "",
    "Net Commission": row.NET_Comm ?? "",
    CC: row.remarks?.cc || "",
    "Fuel Type": row.remarks?.fuel_type || "",
    Make: row.remarks?.make || "",
    "Decline Make": row.remarks?.decline_make || "",
    Model: row.remarks?.model || "",
    "Decline Model": row.remarks?.decline_model || "",
    NCB: row.remarks?.ncb || "",
    Seat: row.remarks?.seat || "",
    GVW: row.remarks?.gvw || "",
  }));
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(exportRows);
  if (sheet["!ref"]) sheet["!autofilter"] = { ref: sheet["!ref"] };
  XLSX.utils.book_append_sheet(workbook, sheet, "Payout Report");
  XLSX.writeFile(workbook, `Payout_Grid_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
