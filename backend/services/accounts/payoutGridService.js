import { PayoutGridModel } from "../../models/accounts/payoutGrid.model.js";
import { CompanyModel } from "../../models/accounts/company.model.js";

const MAX_ROWS = 10000;
const WILDCARDS = new Set(["", "-", "--", "all", "any", "na", "n/a", "not applicable"]);

const text = (value, maxLength = 1000) => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
};

const number = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(/,/g, "").replace(/%/g, "").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const read = (row, ...keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return "";
};

const normalizeMonth = (value) => {
  const input = String(value || "").trim();
  let match = input.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (match) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (input < "2000-01" || input > currentMonth) {
      const error = new Error(`Month must be between 2000-01 and ${currentMonth}`);
      error.statusCode = 400;
      throw error;
    }
    return input;
  }
  match = input.match(/^(0[1-9]|1[0-2])-(\d{4})$/);
  if (match) return normalizeMonth(`${match[2]}-${match[1]}`);
  const error = new Error("Month must use YYYY-MM format");
  error.statusCode = 400;
  throw error;
};

const normalizeRow = (row, index, userId, fileName) => ({
  business_type: text(read(row, "business_type", "Business_Type"), 100),
  category: text(read(row, "category", "vehicle_category", "Motor_Category"), 100),
  classification: text(read(row, "classification", "vehicle_classification", "vehicle_Classification"), 150),
  product_type: text(read(row, "product_type", "Product_Type"), 150),
  rto: text(read(row, "rto", "RTO"), 255),
  od_comm: number(read(row, "od_comm", "OD_Comm", "OD Commission")),
  tp_comm: number(read(row, "tp_comm", "TP_Comm", "TP Commission")),
  net_comm: number(read(row, "net_comm", "NET_Comm", "Net Commission")),
  cc: text(read(row, "cc", "CC", "CC_HP"), 255),
  fuel_type: text(read(row, "fuel_type", "Fuel_Type"), 255),
  make: text(read(row, "make", "Make")),
  decline_make: text(read(row, "decline_make", "Decline_Make")),
  model: text(read(row, "model", "Model")),
  decline_model: text(read(row, "decline_model", "Decline_Model")),
  ncb: text(read(row, "ncb", "NCB", "Ncb"), 255),
  seat: text(read(row, "seat", "Seat"), 255),
  gvw: text(read(row, "gvw", "GVW"), 255),
  source_file_name: text(fileName, 255),
  source_row_number: index + 2,
  created_by: userId,
});

const normalizeComparable = (value) => String(value || "").trim().toLowerCase();
const compactComparable = (value) => normalizeComparable(value).replace(/[^a-z0-9]/g, "");
const listTokens = (value) => normalizeComparable(value)
  .split(/[,;|/\n]+/)
  .map((item) => item.trim())
  .filter(Boolean);

const matchesTextRule = (rule, requested) => {
  if (!requested) return true;
  const normalizedRule = normalizeComparable(rule);
  if (WILDCARDS.has(normalizedRule) || ["pan india", "all india"].includes(normalizedRule)) return true;
  const normalizedRequested = normalizeComparable(requested);
  const tokens = normalizedRule.split(/[,;|\n]+/).map((item) => item.trim()).filter(Boolean);
  return tokens.some((token) => compactComparable(token) === compactComparable(normalizedRequested));
};

const matchesNumericRule = (rule, requested) => {
  if (requested === null || requested === undefined || requested === "") return true;
  const normalizedRule = normalizeComparable(rule);
  if (WILDCARDS.has(normalizedRule)) return true;
  const actual = Number.parseFloat(String(requested).replace(/,/g, ""));
  if (!Number.isFinite(actual)) return true;

  const values = normalizedRule.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (!values.length) return true;
  if (/\b(up\s*to|upto|max(?:imum)?)\b|<=|≤/.test(normalizedRule)) return actual <= values[0];
  if (/\b(above|over|more\s+than|greater\s+than)\b|>=|≥/.test(normalizedRule)) {
    return normalizedRule.includes(">=") || normalizedRule.includes("≥") ? actual >= values[0] : actual > values[0];
  }
  if (/\b(below|under|less\s+than)\b|</.test(normalizedRule)) return actual < values[0];
  if (values.length >= 2 && (/\bto\b/.test(normalizedRule) || /\d\s*-\s*\d/.test(normalizedRule))) {
    return actual >= Math.min(values[0], values[1]) && actual <= Math.max(values[0], values[1]);
  }
  return actual === values[0];
};

const matchesAllowedRule = (rule, requested) => {
  if (!requested) return true;
  const normalizedRule = normalizeComparable(rule);
  if (WILDCARDS.has(normalizedRule) || normalizedRule === "*") return true;
  const requestedValue = compactComparable(requested);
  return listTokens(rule).some((token) => {
    const normalizedToken = compactComparable(token);
    return normalizedToken === requestedValue ||
      (normalizedToken.length >= 4 && requestedValue.includes(normalizedToken)) ||
      (requestedValue.length >= 3 && normalizedToken.includes(requestedValue));
  });
};

const passesDeclineRule = (rule, requested) => {
  if (!requested) return true;
  const normalizedRule = normalizeComparable(rule);
  if (WILDCARDS.has(normalizedRule)) return true;
  const requestedValue = compactComparable(requested);
  return !listTokens(rule).some((token) => {
    const normalizedToken = compactComparable(token);
    return normalizedToken === requestedValue ||
      (normalizedToken.length >= 4 && requestedValue.includes(normalizedToken)) ||
      (requestedValue.length >= 3 && normalizedToken.includes(requestedValue));
  });
};

export const payoutGridRuleMatchers = Object.freeze({
  text: matchesTextRule,
  numeric: matchesNumericRule,
  allowed: matchesAllowedRule,
  declined: passesDeclineRule,
});

const commissionValueIsInvalid = (value) => {
  const normalized = normalizeComparable(value);
  return !WILDCARDS.has(normalized) && number(value) === null;
};

const rowIdentity = (row) => JSON.stringify([
  row.business_type, row.category, row.classification, row.product_type, row.rto,
  row.od_comm, row.tp_comm, row.net_comm, row.cc, row.fuel_type, row.make,
  row.decline_make, row.model, row.decline_model, row.ncb, row.seat, row.gvw,
]);

const presentRow = (row) => ({
  id: row.id,
  company: row.company,
  month: row.payout_month,
  business_type: row.business_type || "—",
  category: row.category || "All",
  classification: row.classification || "All",
  product_type: row.product_type || "—",
  OD_Comm: row.od_comm,
  TP_Comm: row.tp_comm,
  NET_Comm: row.net_comm,
  rto: row.rto,
  remarks: {
    cc: row.cc,
    fuel_type: row.fuel_type,
    make: row.make,
    decline_make: row.decline_make,
    model: row.model,
    decline_model: row.decline_model,
    ncb: row.ncb,
    seat: row.seat,
    gvw: row.gvw,
  },
  source_file_name: row.source_file_name,
  source_row_number: row.source_row_number,
  updated_at: row.updated_at,
});

export const PayoutGridService = {
  async importRows({ company, month, rows, fileName, userId }) {
    const normalizedCompany = text(company, 255);
    if (!normalizedCompany) {
      const error = new Error("Insurance company is required");
      error.statusCode = 400;
      throw error;
    }
    const companyRecord = await CompanyModel.findByName(normalizedCompany);
    if (!companyRecord) {
      const error = new Error("Selected insurance company does not exist");
      error.statusCode = 400;
      throw error;
    }
    if (companyRecord.status === "Inactive") {
      const error = new Error("Payout grids cannot be uploaded for an inactive insurance company");
      error.statusCode = 400;
      throw error;
    }
    const normalizedMonth = normalizeMonth(month);
    if (!Array.isArray(rows) || !rows.length) {
      const error = new Error("The Excel file does not contain any payout rows");
      error.statusCode = 400;
      throw error;
    }
    if (rows.length > MAX_ROWS) {
      const error = new Error(`A payout grid can contain at most ${MAX_ROWS} rows`);
      error.statusCode = 400;
      throw error;
    }

    const normalizedRows = rows.map((row, index) => normalizeRow(row || {}, index, userId, fileName));
    const invalidCommissionRows = rows.flatMap((row, index) => {
      const invalidFields = [
        ["OD Commission", read(row, "od_comm", "OD_Comm", "OD Commission")],
        ["TP Commission", read(row, "tp_comm", "TP_Comm", "TP Commission")],
        ["Net Commission", read(row, "net_comm", "NET_Comm", "Net Commission")],
      ].filter(([, value]) => commissionValueIsInvalid(value)).map(([label]) => label);
      return invalidFields.length ? [`Excel row ${index + 2}: ${invalidFields.join(", ")}`] : [];
    });
    if (invalidCommissionRows.length) {
      const error = new Error(`Invalid commission value in ${invalidCommissionRows.slice(0, 8).join("; ")}`);
      error.statusCode = 400;
      throw error;
    }
    const usableRows = normalizedRows.filter((row) =>
      row.category || row.classification || row.product_type ||
      row.od_comm !== null || row.tp_comm !== null || row.net_comm !== null
    );
    if (!usableRows.length) {
      const error = new Error("No usable payout rows were found. Check the Excel column headings.");
      error.statusCode = 400;
      throw error;
    }
    const uniqueRows = [...new Map(usableRows.map((row) => [rowIdentity(row), row])).values()];

    const result = await PayoutGridModel.replaceBatch({
      company: normalizedCompany,
      month: normalizedMonth,
      rows: uniqueRows,
    });
    return {
      total_rows: rows.length,
      rows_inserted: result.inserted,
      rows_replaced: result.replaced,
      rows_skipped: rows.length - usableRows.length,
      duplicates_skipped: usableRows.length - uniqueRows.length,
      month: normalizedMonth,
      company: normalizedCompany,
      source_file_name: text(fileName, 255),
    };
  },

  async getReport(filters = {}) {
    const month = filters.month ? normalizeMonth(filters.month) : "";
    const rows = await PayoutGridModel.findRows({
      company: text(filters.company, 255),
      month,
      businessType: text(filters.businessType, 100),
      category: text(filters.category, 100),
      classification: text(filters.classification, 150),
    });
    const filteredRows = rows.filter((row) =>
      matchesTextRule(row.rto, filters.rto) &&
      matchesNumericRule(row.seat, filters.seat) &&
      matchesNumericRule(row.gvw, filters.gvw) &&
      matchesNumericRule(row.cc, filters.cc) &&
      matchesNumericRule(row.ncb, filters.ncb) &&
      matchesAllowedRule(row.fuel_type, filters.fuelType) &&
      matchesAllowedRule(row.make, filters.make) &&
      passesDeclineRule(row.decline_make, filters.make) &&
      matchesAllowedRule(row.model, filters.model) &&
      passesDeclineRule(row.decline_model, filters.model)
    );
    return {
      rows: filteredRows.map((row) => ({
        ...presentRow(row),
        matched_filters: {
          rto: filters.rto || null,
          seat: filters.seat || null,
          gvw: filters.gvw || null,
          cc: filters.cc || null,
          ncb: filters.ncb || null,
          fuel_type: filters.fuelType || null,
          make: filters.make || null,
          model: filters.model || null,
        },
      })),
      total: filteredRows.length,
      options: await PayoutGridModel.getOptions(),
    };
  },

  async getBatches() {
    return PayoutGridModel.getBatches();
  },
};
