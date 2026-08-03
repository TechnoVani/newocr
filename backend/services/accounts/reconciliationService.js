import { ReconciliationModel } from "../../models/accounts/reconciliationModel.js";

export const RECONCILIATION_FIELDS = [
  { key: "issue_date", label: "Issue Date", type: "date" },
  { key: "total_od", label: "Total OD", type: "number" },
  { key: "total_tp", label: "Total TP", type: "number" },
  { key: "net_premium", label: "Net Premium", type: "number" },
  { key: "irda_od", label: "IRDA OD %", type: "number" },
  { key: "irda_tp", label: "IRDA TP %", type: "number" },
  { key: "irda_net", label: "IRDA Net %", type: "number" },
];

export const normalizePolicyNumber = (value) =>
  String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const normalizeText = (value) =>
  String(value ?? "").trim().replace(/\s+/g, " ").toUpperCase();

const normalizeDate = (value) => {
  if (!value) return "";
  const formatLocalDate = (date) => {
    const pad = (part) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : formatLocalDate(value);
  }
  const text = String(value).trim();
  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return formatLocalDate(parsed);
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (/^[-–—]+$/.test(text)) return 0;
  const parsed = Number.parseFloat(text.replace(/,/g, "").replace(/[^\d.+-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const toCurrencyNumber = (value) => {
  const parsed = toNumber(value);
  return parsed === null ? null : Math.round((parsed + Number.EPSILON) * 100) / 100;
};

const toPercentageNumber = (value) => toCurrencyNumber(value);

const normalizeImportDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  const dayFirstMatch = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const parsedDayFirst = new Date(`${normalized}T00:00:00Z`);
    if (
      !Number.isNaN(parsedDayFirst.getTime()) &&
      parsedDayFirst.toISOString().slice(0, 10) === normalized
    ) {
      return normalized;
    }
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const validatePeriod = (year, month) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  if (!Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2100) {
    const error = new Error("Year must be between 2000 and 2100");
    error.statusCode = 400;
    throw error;
  }
  if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
    const error = new Error("Month must be between 1 and 12");
    error.statusCode = 400;
    throw error;
  }
  return { year: numericYear, month: numericMonth };
};

const getPeriodDates = (year, month) => {
  const pad = (value) => String(value).padStart(2, "0");
  const startDate = `${year}-${pad(month)}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    startDate,
    endDate: `${nextYear}-${pad(nextMonth)}-01`,
  };
};

export const comparePolicyFields = (policy, statement) => {
  const mismatches = [];
  RECONCILIATION_FIELDS.forEach((field) => {
    const ourValue = policy[field.key];
    const insurerValue = statement[field.key];
    let matches;
    if (field.type === "number") {
      const ourNumber = toNumber(ourValue) ?? 0;
      const insurerNumber = toNumber(insurerValue) ?? 0;
      matches = Math.abs(ourNumber - insurerNumber) <= 0.01;
    } else if (field.type === "date") {
      matches = normalizeDate(ourValue) === normalizeDate(insurerValue);
    } else {
      matches = normalizeText(ourValue) === normalizeText(insurerValue);
    }
    if (!matches) {
      mismatches.push({
        field: field.key,
        label: field.label,
        our_value: field.type === "number" ? toNumber(ourValue) : ourValue ?? "",
        insurer_value: field.type === "number" ? toNumber(insurerValue) : insurerValue ?? "",
      });
    }
  });
  return mismatches;
};

const createResultRow = (policy, statement, status, mismatches = []) => ({
  id: `${status}-${policy?.id || "none"}-${statement?.id || "none"}`,
  status,
  policy_number: statement?.policy_number || policy?.policy_number || "",
  policy_issue_date: policy?.issue_date || null,
  insurer_issue_date: statement?.issue_date || null,
  statement_period: normalizeDate(statement?.issue_date).slice(0, 7),
  match_date: statement?.created_at || null,
  insurance_company: statement?.insurance_company || policy?.insurance_company || "",
  our_insurance_company: policy?.insurance_company || "",
  excel_insurance_company: statement?.insurance_company || "",
  insured_name: statement?.insured_name || policy?.insured_name || "",
  our_insured_name: policy?.insured_name || "",
  insurer_insured_name: statement?.insured_name || "",
  remark: statement?.remark || "",
  mismatch_fields: mismatches.map((item) => item.label).join(", "),
  mismatch_details: mismatches,
  our_total_od: policy?.total_od ?? null,
  insurer_total_od: statement?.total_od ?? null,
  our_total_tp: policy?.total_tp ?? null,
  insurer_total_tp: statement?.total_tp ?? null,
  our_net_premium: policy?.net_premium ?? null,
  insurer_net_premium: statement?.net_premium ?? null,
  our_irda_od: toNumber(policy?.irda_od),
  insurer_irda_od: toNumber(statement?.irda_od),
  our_irda_tp: toNumber(policy?.irda_tp),
  insurer_irda_tp: toNumber(statement?.irda_tp),
  our_irda_net: toNumber(policy?.irda_net),
  insurer_irda_net: toNumber(statement?.irda_net),
  our_policy: policy || null,
  insurer_statement: statement || null,
});

export const ReconciliationService = {
  async importRows({ rows, userId }) {
    if (!Array.isArray(rows) || rows.length === 0) {
      const error = new Error("The Excel file does not contain any policy rows");
      error.statusCode = 400;
      throw error;
    }
    if (rows.length > 10000) {
      const error = new Error("A maximum of 10,000 rows can be imported at once");
      error.statusCode = 400;
      throw error;
    }

    const seenPolicyNumbers = new Set();
    const normalizedRows = rows.map((row, index) => {
      const policyNumber = String(row.policy_number || "").trim();
      const normalizedPolicy = normalizePolicyNumber(policyNumber);
      if (!normalizedPolicy) {
        const error = new Error(`Policy Number is required at Excel row ${index + 2}`);
        error.statusCode = 400;
        throw error;
      }
      if (seenPolicyNumbers.has(normalizedPolicy)) {
        const error = new Error(
          `Duplicate Policy Number "${policyNumber}" in imported Excel file`
        );
        error.statusCode = 400;
        throw error;
      }
      seenPolicyNumbers.add(normalizedPolicy);
      return {
        policy_number: policyNumber,
        insurance_company: String(row.insurance_company || "").trim() || null,
        insured_name: String(row.insured_name || "").trim() || null,
        issue_date: normalizeImportDate(row.issue_date),
        total_od: toCurrencyNumber(row.total_od),
        total_tp: toCurrencyNumber(row.total_tp),
        net_premium: toCurrencyNumber(row.net_premium),
        irda_od: toPercentageNumber(row.irda_od),
        irda_tp: toPercentageNumber(row.irda_tp),
        irda_net: toPercentageNumber(row.irda_net),
        remark: String(row.remark || "").trim() || null,
        created_by: userId,
      };
    });

    const policyCompanies = await ReconciliationModel.findPolicyCompanies(
      normalizedRows.map((row) => row.policy_number),
    );
    const policyCompanyByNumber = new Map(
      policyCompanies.map((policy) => [
        normalizePolicyNumber(policy.policy_number),
        policy.insurance_company,
      ]),
    );
    normalizedRows.forEach((row) => {
      row.insurance_company =
        policyCompanyByNumber.get(normalizePolicyNumber(row.policy_number)) ||
        row.insurance_company;
    });

    const imported = await ReconciliationModel.upsertRows(normalizedRows);
    return { imported };
  },

  async getReport({ year, month, createdYear, createdMonth, insuranceCompany }) {
    const hasIssueFilter = year !== null && year !== undefined && year !== "" &&
      month !== null && month !== undefined && month !== "";
    const hasCreatedFilter =
      createdYear !== null && createdYear !== undefined && createdYear !== "" &&
      createdMonth !== null && createdMonth !== undefined && createdMonth !== "";
    const hasPeriodFilter = hasIssueFilter || hasCreatedFilter;
    const period = hasIssueFilter ? validatePeriod(year, month) : null;
    const createdPeriod = hasCreatedFilter
      ? validatePeriod(createdYear, createdMonth)
      : null;
    const issueDates = period
      ? getPeriodDates(period.year, period.month)
      : null;
    const createdDates = createdPeriod
      ? getPeriodDates(createdPeriod.year, createdPeriod.month)
      : null;
    const [allStatementRows, sourcePolicies, insuranceCompanyOptions] = await Promise.all([
      ReconciliationModel.findAllStatementRows(),
      hasIssueFilter
        ? ReconciliationModel.findPoliciesForMonth(
            issueDates.startDate,
            issueDates.endDate,
          )
        : hasCreatedFilter
          ? ReconciliationModel.findAllPolicies()
          : Promise.resolve([]),
      ReconciliationModel.findAllInsuranceCompanies(),
    ]);
    const selectedInsuranceCompany = String(insuranceCompany || "").trim();
    const hasInsuranceCompanyFilter = selectedInsuranceCompany &&
      normalizeText(selectedInsuranceCompany) !== normalizeText("All Companies");
    const matchesInsuranceCompany = (value) =>
      !hasInsuranceCompanyFilter ||
      normalizeText(value) === normalizeText(selectedInsuranceCompany);

    const statementRowsForMonth = hasPeriodFilter
      ? allStatementRows.filter((statement) => {
      const createdDate = normalizeDate(statement.created_at);
      const matchesCreatedPeriod = !createdDates ||
        (createdDate >= createdDates.startDate && createdDate < createdDates.endDate);
      return matchesCreatedPeriod &&
        matchesInsuranceCompany(statement.insurance_company);
        })
      : [];
    const policies = sourcePolicies.filter((policy) =>
      matchesInsuranceCompany(policy.insurance_company));

    const latestStatementByNumber = new Map();
    statementRowsForMonth.forEach((statement) => {
      const normalizedPolicy = normalizePolicyNumber(statement.policy_number);
      if (!latestStatementByNumber.has(normalizedPolicy)) {
        latestStatementByNumber.set(normalizedPolicy, statement);
      }
    });

    const completeMatches = [];
    const fieldMismatches = [];
    const ourExtras = [];
    policies.forEach((policy) => {
      const statement = latestStatementByNumber.get(normalizePolicyNumber(policy.policy_number));
      if (!statement) {
        ourExtras.push(createResultRow(policy, null, "our_extra"));
        return;
      }
      const mismatches = comparePolicyFields(policy, statement);
      if (mismatches.length) {
        fieldMismatches.push(createResultRow(policy, statement, "field_mismatch", mismatches));
      } else {
        completeMatches.push(createResultRow(policy, statement, "complete_match"));
      }
    });

    const selectedPolicyNumberSet = new Set(
      policies.map((policy) => normalizePolicyNumber(policy.policy_number)),
    );
    const insurerExtras = statementRowsForMonth
      .filter((statement) =>
        !selectedPolicyNumberSet.has(normalizePolicyNumber(statement.policy_number)))
      .map((statement) => createResultRow(null, statement, "insurer_extra"));

    return {
      period: period ? { ...period, ...issueDates } : null,
      createdPeriod: createdPeriod ? { ...createdPeriod, ...createdDates } : null,
      filters_applied: hasPeriodFilter,
      insurance_company: hasInsuranceCompanyFilter
        ? selectedInsuranceCompany
        : "All Companies",
      insurance_company_options: insuranceCompanyOptions,
      summary: {
        complete_match: completeMatches.length,
        field_mismatch: fieldMismatches.length,
        insurer_extra: insurerExtras.length,
        our_extra: ourExtras.length,
        imported_rows: statementRowsForMonth.length,
        has_import_data: allStatementRows.length > 0,
      },
      completeMatches,
      fieldMismatches,
      insurerExtras,
      ourExtras,
    };
  },
};
