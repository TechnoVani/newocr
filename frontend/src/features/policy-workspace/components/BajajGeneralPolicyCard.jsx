// src/components/BajajGeneralPolicyCard.jsx

import { useState } from "react";
import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

// =======================================
// UTILITY FUNCTIONS
// =======================================

const cleanValue = (value) => {
  if (!value) return "-";
  return String(value)
    .replace(/([A-Za-z])-\s+([A-Za-z])/g, "$1$2")
    .replace(/\s+/g, " ")
    .replace(/[\n\r]+/g, " ")
    .trim();
};

const cleanBajajInsuredName = (value) => {
  const cleaned = cleanValue(value)
    .replace(/\s+Insured\s*$/i, "")
    .replace(/\s*Zone\s*[A-Z]\s*$/i, "")
    .trim();
  return cleaned || "-";
};

const formatFinancierName = (financier) => {
  if (!financier || financier === "-") return "NA";
  return String(financier).replace(/\s+/g, " ").toUpperCase().trim();
};

const cleanAlphaNumeric = (val) => {
  if (!val || val === "-") return "-";
  return String(val).replace(/[^a-zA-Z0-9]/g, "").toUpperCase().trim();
};

const cleanPolicyCode = (val) => {
  if (!val || val === "-") return "-";
  return String(val).replace(/[^a-zA-Z0-9/-]/g, "").toUpperCase().trim();
};

const cleanAmount = (value) => {
  if (!value || value === "-") return "-";
  const cleaned = String(value).replace(/[,\s]/g, "");
  return cleaned || "-";
};

const cleanBajajCommercialVariant = (value) => {
  const cleaned = cleanValue(value)
    .replace(/\(\s*/g, "(")
    .replace(/\s*\)/g, ")")
    .replace(/\)+$/g, ")")
    .toUpperCase();
  if (!cleaned || cleaned === "-") return "-";
  if (/^SCHOOL\s*BUS\b/i.test(cleaned)) return "SCHOOL BUS";
  return cleaned.replace(/\s*SCHOOL\s*BUS\s*\(\d+\+\d+\)\s*$/i, "").trim() || cleaned;
};

const normalizeBajajModel = (value) => {
  const cleaned = cleanValue(value).toUpperCase();
  if (cleaned === "TRAVEER") return "TRAVELLER";
  return cleaned || "-";
};

const splitCompactBajajModelVariant = (modelVariant = "") => {
  const cleaned = cleanValue(modelVariant).toUpperCase();
  if (!cleaned || cleaned === "-") return { model: "-", variant: "-" };

  const knownModelMatch = cleaned.match(/^(SHINE|ACTIVA|PULSAR|PLATINA|SPLENDOR|HF\s*DELUXE|JUPITER|ACCESS|FZ|R15|CLASSIC|BULLET|DUKE|CT)(.*)$/i);
  if (knownModelMatch) {
    return {
      model: cleanValue(knownModelMatch[1]).toUpperCase(),
      variant: cleanValue(knownModelMatch[2]) === "-" ? "-" : cleanValue(knownModelMatch[2]).toUpperCase(),
    };
  }

  const parts = cleaned.split(/\s+/);
  return {
    model: parts[0] || "-",
    variant: parts.length > 1 ? parts.slice(1).join(" ") : "-",
  };
};

const extractBajajVehicleIdv = (text = "") => {
  const commercialPackageIdvMatch = text.match(/(?:DIESEL|PETROL|CNG|EV|ELECTRIC|LPG|BATTERY)\s*(\d{1,3}(?:,\d{2})*,\d{3}|\d{4,8})(?=0{2,}[\d,]+\b|[\s\S]{0,80}?Current\s+Policy\s+Period)/i);
  if (commercialPackageIdvMatch) return cleanAmount(commercialPackageIdvMatch[1]);

  const vehicleBlockMatch = text.match(/Engine\s+Number\s*Chassis\s+Number\s*Vehicle\s+IDV[\s\S]{0,260}?[A-Z0-9]{8,15}\s+\d?\s+[A-Z0-9]{8,15}\s+[A-Z0-9]{5,10}\s+([\d,]+(?:\.\d{2})?)/i);
  if (vehicleBlockMatch) return cleanAmount(vehicleBlockMatch[1]);

  const totalValueMatch = text.match(/Vehicle\s+IDV[\s\S]{0,180}?Total\s+Value\s+([\d,]+(?:\.\d{2})?)/i) ||
                          text.match(/Vehicle\s+IDV[\s\S]{0,120}?([\d,]+(?:\.\d{2}))0+([\d,]+(?:\.\d{2}))/i);
  if (totalValueMatch) return cleanAmount(totalValueMatch[2] || totalValueMatch[1]);

  return "-";
};

const extractBajajCommercialPackageVehicle = (text = "") => {
  const result = {
    registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-",
    model: "-", variant: "-", manufacturingYear: "-",
    cubicCapacity: "-", seatingCapacity: "-", financierName: "NA", fuelType: "-", idv: "-",
    commercialVehicleType: "-", ncb: "0%"
  };

  const normalizedText = cleanValue(text).replace(/\u00a0/g, " ");
  if (!/Commercial\s+Vehicle\s+Package\s+Policy/i.test(normalizedText)) return result;

  const vehicleTypeMatch = normalizedText.match(/Vehicle\s+Type\s*([A-Za-z0-9\s:>&/-]+?)\s+Period\s+Of\s+Insurance/i);
  if (vehicleTypeMatch?.[1]) result.commercialVehicleType = cleanValue(vehicleTypeMatch[1]);

  const scheduleMatch = normalizedText.match(
    /(?:Registration\s+Number\s+Vehicle\s+Make\s+Vehicle\s+SubType\s+Vehicle\s+Model[\s\S]*?Vehicle\s+Engine\s+Number|Registration\s+No\.\s+MakeSubTypeModelCC\/KWMfg\s+year\s+Seat\s+CapVehicle\/\s+Trailer\s+Chassis\s+No\s+Engine\s+Number)\s+([\s\S]{0,420}?)\s+Fuel\s+Type/i
  );
  const row = cleanValue(scheduleMatch?.[1] || "");
  const compactRow = row.replace(/\s+/g, "").toUpperCase();
  if (!compactRow) return result;

  const spacedScheduleMatch = row.match(
    /^(NEW|[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s+(FORCE\s+MOTORS|SML\s+ISUZU|EICHER|TATA|MAHINDRA|ASHOK\s+LEYLAND|MARUTI|HYUNDAI|BAJAJ)\s+(.+?)\s+(TRAVELLER|TRAVEER|SUPREME|STARLINE)\s+(\d+)\s+(20\d{2})\s+(\d{1,3})\s+([A-Z0-9]{4,})\s+([A-Z0-9]{4,})$/i
  ) || row.match(
    /^(NEW|[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s+(FORCE\s+MOTORS|SML\s+ISUZU|EICHER|TATA|MAHINDRA|ASHOK\s+LEYLAND|MARUTI|HYUNDAI|BAJAJ)\s+(SCHOOL\s*BUS\s*\(\s*\d+\s*\+\s*\d+\s*\)+)\s+([A-Z0-9.]+(?:\s+[A-Z])?)\s+(\d+)\s+(20\d{2})\s+(\d{1,3})\s+([A-Z0-9]{4,})\s+([A-Z0-9]{4,})$/i
  );
  if (spacedScheduleMatch) {
    result.registrationNumber = spacedScheduleMatch[1].toUpperCase() === "NEW"
      ? "NEW"
      : cleanAlphaNumeric(spacedScheduleMatch[1]);
    result.make = cleanValue(spacedScheduleMatch[2]).toUpperCase();
    result.variant = cleanBajajCommercialVariant(spacedScheduleMatch[3]);
    result.model = normalizeBajajModel(spacedScheduleMatch[4]);
    result.cubicCapacity = spacedScheduleMatch[5];
    result.manufacturingYear = spacedScheduleMatch[6];
    result.seatingCapacity = spacedScheduleMatch[7];
    result.chassisNumber = cleanAlphaNumeric(spacedScheduleMatch[8]);
    result.engineNumber = cleanAlphaNumeric(spacedScheduleMatch[9]);

    const fuelMatch = normalizedText.match(/Fuel\s+Type[\s\S]{0,80}?\b(DIESEL|PETROL|CNG|EV|ELECTRIC|LPG|BATTERY)\b/i);
    if (fuelMatch) result.fuelType = fuelMatch[1].toUpperCase() === "BATTERY" ? "Electric" : fuelMatch[1].toUpperCase();

    const idv = extractBajajVehicleIdv(normalizedText);
    if (idv !== "-") result.idv = idv;

    const vehicleTypeMatch = normalizedText.match(/Vehicle\s+Type\s*([A-Za-z0-9\s:>&/-]+?)\s+Period\s+Of\s+Insurance/i);
    if (vehicleTypeMatch?.[1]) result.commercialVehicleType = cleanValue(vehicleTypeMatch[1]);

    const ncbMatch = normalizedText.match(/No\s+Claim\s+Bonus\s*:?\s*(-?\d+%|NA)/i);
    if (ncbMatch) result.ncb = ncbMatch[1].toUpperCase() === "NA" ? "0%" : ncbMatch[1];

    const hypMatch = normalizedText.match(/HYPOTHECATED\s+WITH\s*:\s*([A-Z0-9 .&-]+?)(?=\s+Policy\s+Status|\s+\d+\.\s*Add\s+on|$)/i);
    if (hypMatch) result.financierName = formatFinancierName(hypMatch[1]);

    return result;
  }

  const regMatch = compactRow.match(/^(NEW|[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})/);
  if (regMatch) result.registrationNumber = regMatch[1] === "NEW" ? "NEW" : cleanAlphaNumeric(regMatch[1]);

  const knownMakes = [
    { compact: "FORCEMOTORS", display: "FORCE MOTORS" },
    { compact: "SMLISUZU", display: "SML ISUZU" },
    { compact: "EICHER", display: "EICHER" },
    { compact: "TATA", display: "TATA" },
    { compact: "MAHINDRA", display: "MAHINDRA" },
    { compact: "ASHOKLEYLAND", display: "ASHOK LEYLAND" },
    { compact: "MARUTI", display: "MARUTI" },
    { compact: "HYUNDAI", display: "HYUNDAI" },
    { compact: "BAJAJ", display: "BAJAJ" }
  ];
  const afterRegistration = compactRow.slice(result.registrationNumber === "NEW" ? 3 : cleanAlphaNumeric(result.registrationNumber).length);
  const make = knownMakes.find(item => afterRegistration.startsWith(item.compact));
  if (make) result.make = make.display;

  const seatMatch = row.match(/\((\d+\+\d+)\)/);
  if (seatMatch) result.seatingCapacity = seatMatch[1];

  const yearMatches = compactRow.match(/20\d{2}/g) || [];
  const manufacturingYear = yearMatches.length ? yearMatches[yearMatches.length - 1] : "";
  if (manufacturingYear) result.manufacturingYear = manufacturingYear;

  const fuelMatch = normalizedText.match(/Fuel\s+Type[\s\S]{0,80}?\b(DIESEL|PETROL|CNG|EV|ELECTRIC|LPG|BATTERY)\b/i);
  if (fuelMatch) result.fuelType = fuelMatch[1].toUpperCase() === "BATTERY" ? "Electric" : fuelMatch[1].toUpperCase();

  const idv = extractBajajVehicleIdv(normalizedText);
  if (idv !== "-") result.idv = idv;

  const knownModels = ["TRAVELLER", "SUPREME", "STARLINE"];
  const model = knownModels.find(item => compactRow.includes(item));
  if (model) result.model = model;

  const subtypeMatch = row.match(/(?:FORCE\s*MOTORS|SML\s*ISUZU|EICHER|TATA|MAHINDRA|ASHOK\s*LEYLAND|MARUTI|HYUNDAI|BAJAJ)\s*([A-Z0-9]+(?:\s+[A-Z0-9]+)?)\s*SCHOOL\s*BUS/i);
  if (subtypeMatch?.[1]) {
    result.variant = cleanBajajCommercialVariant(subtypeMatch[1]);
  }

  const ccKwMatch = model ? compactRow.match(new RegExp(`${model}(\\d+)(20\\d{2})`)) : null;
  if (ccKwMatch?.[1]) result.cubicCapacity = ccKwMatch[1];

  const possibleEngine = row.match(/\b([A-Z]{2,}\d[A-Z0-9]{6,})\s*$/i)?.[1] || "";
  const engineNumber = possibleEngine && !knownModels.some(item => possibleEngine.toUpperCase().startsWith(item))
    ? cleanAlphaNumeric(possibleEngine)
    : "";
  if (engineNumber) result.engineNumber = engineNumber;

  const yearIndex = manufacturingYear ? compactRow.lastIndexOf(manufacturingYear) : -1;
  let tailAfterYear = yearIndex >= 0 ? compactRow.slice(yearIndex + 4) : "";
  const seatDigits = result.seatingCapacity !== "-" ? result.seatingCapacity.split("+")[0] : "";
  if (seatDigits && tailAfterYear.startsWith(seatDigits)) tailAfterYear = tailAfterYear.slice(seatDigits.length);
  if (engineNumber && tailAfterYear.endsWith(engineNumber)) tailAfterYear = tailAfterYear.slice(0, -engineNumber.length);
  if (tailAfterYear.length >= 10) result.chassisNumber = cleanAlphaNumeric(tailAfterYear);

  const ncbMatch = normalizedText.match(/No\s+Claim\s+Bonus\s*:?\s*(-?\d+%|NA)/i);
  if (ncbMatch) result.ncb = ncbMatch[1].toUpperCase() === "NA" ? "0%" : ncbMatch[1];

  const hypMatch = normalizedText.match(/HYPOTHECATED\s+WITH\s*:\s*([A-Z0-9 .&-]+?)(?=\s+Policy\s+Status|\s+\d+\.\s*Add\s+on|$)/i);
  if (hypMatch) result.financierName = formatFinancierName(hypMatch[1]);

  return result;
};

// =======================================
// EXTRACTION FUNCTIONS
// =======================================

const extractInsuranceCompany = (text = "") => "Bajaj General Insurance Limited";

const extractPolicyNumber = (text = "") => {
  let m = text.match(/Policy\s*Number\s*[']?\s*([A-Z0-9-]+)/i);
  if (!m) m = text.match(/Policy\s*Number\s*([A-Z]{2}-\d{2}-\d{4}-\d{4}-\d{8})\s*Product/i);
  if (!m) m = text.match(/Policy\s+No\s*\.?\s*[:\-]?\s*([A-Z0-9-]+)/i);
  if (!m) m = text.match(/OG-\d{2}-\d{4}-\d{4}-\d+/i);
  return m ? (m[1] || m[0]).replace(/[']/g, '') : "-";
};

const extractBranchAddress = (text = "") => {
  const bajajBranch = text.match(/\bJABALPUR[-–]\s*([A-Z0-9\s,.-]+?482001,\s*\d{10})/i);
  if (bajajBranch) return `JABALPUR-${cleanValue(bajajBranch[1])}`;

  const match = text.match(/Contact our policy servicing branch at\s*[:]?\s*([\s\S]+?Phone\s*No\s*[:]\s*[\d-]+)/i) ||
                text.match(/Policy issuing office and Correspondence address.*?\n([\s\S]+?Phone\s*No\s*[:]\s*[\d-]+)/i) ||
                text.match(/Contact our policy servicing branch at\s*[:]?\s*([\s\S]+?PH\s*:\s*[\d-]+)/i) ||
                text.match(/Policy issuing office and Correspondence address[\s\S]*?:\s*([\s\S]+?PH\s*:\s*[\d-]+)/i);
  return match ? match[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim() : "-";
};

const extractInsuredDetails = (text = "") => {
  const result = { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
  const policyDetailsMatches = [...text.matchAll(/POLICY\s+DETAILS\s+INSURED\s+DETAILS\s+Insured\s+Name\s+(.+?)\s+(Run\s+By[\s\S]+?Madhya\s+Pradesh-?\d{6})\s+Insured\s+Address/ig)];
  const policyDetailsMatch = policyDetailsMatches[policyDetailsMatches.length - 1];
  if (policyDetailsMatch) {
    result.insuredName = cleanBajajInsuredName(policyDetailsMatch[1]);
    result.insuredAddress = cleanValue(policyDetailsMatch[2]).replace(/\s*,\s*,/g, ",");
  }

  const bajajScheduleDetails = text.match(/Insured\s+Name\s+(.+?)\s+(Run\s+By[\s\S]+?Madhya\s+Pradesh-?\d{6})\s+Insured\s+Address/i);
  if (result.insuredName === "-" && bajajScheduleDetails && !/Policy\s+Number/i.test(bajajScheduleDetails[1])) {
    result.insuredName = cleanBajajInsuredName(bajajScheduleDetails[1]);
    result.insuredAddress = cleanValue(bajajScheduleDetails[2]).replace(/\s*,\s*,/g, ",");
  }

  const scheduleNameMatch = text.match(/Insured\s+Name\s*[:\-]?\s*(.+?)(?=\s*Address|Application\s+No|Policy\s+Number)/is);
  if (result.insuredName === "-" && scheduleNameMatch) result.insuredName = cleanBajajInsuredName(scheduleNameMatch[1]);

  const compactScheduleNameMatch = text.match(/Insured\s+Name\s*([A-Za-z][A-Za-z\s.]+?)\s*Zone[A-Z]\b/i);
  if (result.insuredName === "-" && compactScheduleNameMatch) {
    result.insuredName = cleanBajajInsuredName(compactScheduleNameMatch[1]);
  }

  const nameMatch = text.match(/1\.\s*Proposer\s*Name\s*[:]\s*(.+?)(?=\s*2\.\s*Proposer\s*Address)/is);
  if (result.insuredName === "-" && nameMatch) result.insuredName = cleanBajajInsuredName(nameMatch[1]);

  const scheduleAddrMatch = text.match(/Insured\s+Name\s*[:\-]?.+?Address\s*[:\-]?\s*([\s\S]+?)(?=Application\s+No|Policy\s+Number|Policy\s+Issued|Geographical\s+Area)/i);
  if (result.insuredAddress === "-" && scheduleAddrMatch) result.insuredAddress = cleanValue(scheduleAddrMatch[1]).replace(/\s*,\s*,/g, ",");

  const compactScheduleAddressMatch = text.match(/Insured\s+Address\s*([\s\S]+?)\s*Customer\s+ID/i);
  if (result.insuredAddress === "-" && compactScheduleAddressMatch) {
    result.insuredAddress = cleanValue(compactScheduleAddressMatch[1]).replace(/\s*,\s*,/g, ",");
  }

  const addrMatch = text.match(/2\.\s*Proposer\s*Address\s*[:]\s*(.+?)(?=\s*3\.\s*Proposer\s*Mobile\s*Number)/is);
  if (result.insuredAddress === "-" && addrMatch) result.insuredAddress = addrMatch[1].replace(/\s+/g, " ").trim();

  const mobMatch = text.match(/3\.\s*Proposer\s*Mobile\s*Number\s*[:]\s*([\d*Xx-]+)/i);
  if (mobMatch) result.contactNumber = mobMatch[1].replace(/^[0-9]-/, '').replace(/-/g, '').trim();

  const mobileFallback = text.match(/Mobile\s+Number\s*[:\-]?\s*(\d{10})/i);
  if (result.contactNumber === "-" && mobileFallback) result.contactNumber = mobileFallback[1];

  const emailMatch = text.match(/5\.\s*Proposer\s*e-mail\s*id\s*[:]\s*([^\s]+)/i) ||
                     text.match(/Email\s+ID\s*[:\-]?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  if (emailMatch) result.email = emailMatch[1].trim();

  return result;
};

const extractPolicyDates = (text = "") => {
  const result = { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  const bundledPeriodMatch = text.match(/For\s+Own\s+Damage\s+Section[\s\S]*?For\s+Third\s+Party\s+Liability\s+Section[\s\S]*?From\s+(\d{2}-[A-Za-z]{3}-\d{4})[\s\S]*?From\s+\d{2}-[A-Za-z]{3}-\d{4}[\s\S]*?To\s*:?\s*(\d{2}-[A-Za-z]{3}-\d{4})[\s\S]*?To\s*:?\s*(\d{2}-[A-Za-z]{3}-\d{4})/i);
  if (bundledPeriodMatch) {
    result.startDate = bundledPeriodMatch[1];
    result.odExpireDate = bundledPeriodMatch[2];
    result.tpExpireDate = bundledPeriodMatch[3];
    return result;
  }

  const dateMatch = text.match(/From[:\s]*(\d{2}-[A-Za-z]{3}-\d{4})[\s\S]*?To[:\s]*(\d{2}-[A-Za-z]{3}-\d{4})/i) ||
                    text.match(/Policy\s+Period\s+From\s*:\s*(\d{2}-\d{2}-\d{4})[\s\S]*?To\s*:\s*(\d{2}-\d{2}-\d{4})/i) ||
                    text.match(/Commencement\s+Date\s+Expiry\s+Date[\s\S]*?(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}:\d{2}\s+to\s+(\d{2}-\d{2}-\d{4})/i);
  if (dateMatch) {
    result.startDate = dateMatch[1];
    result.odExpireDate = dateMatch[2];
    result.tpExpireDate = dateMatch[2];
  }
  return result;
};

const extractDateOfIssue = (text = "") => {
  const match = text.match(/Policy issued on\s*(\d{2}-[A-Za-z]{3}-\d{4})/i) ||
                text.match(/Policy\s+Issued\s+on\s*[:\-]?\s*(\d{2}-\d{2}-\d{4})/i) ||
                text.match(/Receipt Date\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                text.match(/Date\s*of\s*issue\s*:?\s*(\d{2}-[A-Za-z]{3}-\d{4})/i);
  return match ? match[1] : "-";
};

const extractPreviousPolicyData = (text = "") => {
  const result = { previousInsurer: "-", previousPolicyNumber: "-" };
  const insMatch = text.match(/Previous Insurer\s*-\s*([A-Za-z\s]+(?:Limited|Ltd\.?))/i) ||
                   text.match(/Insurance\s+Provider\s*[:\-]?\s*([A-Za-z\s]+(?:Limited|Ltd\.?))/i);
  if (insMatch) result.previousInsurer = insMatch[1].trim();
  const polMatch = text.match(/Previous Policy No\s*-\s*([0-9A-Z\/\-]+)/i) ||
                   text.match(/Previous\s+Policy\s+No\s*[:\-]?\s*([0-9A-Z\/\-\s]+?)(?=\s*Previous\s+Policy\s+Expiry|$)/i) ||
                   text.match(/Previous\s+Policy\s+Expiry\s+Date\s+Previous\s+Policy\s+No\s+Insurance\s+Provider\s+\d{2}\/\d{2}\/\d{4}\s+([0-9A-Z\s]+?)\s+[A-Z][a-z]+/i);
  if (polMatch) result.previousPolicyNumber = cleanPolicyCode(polMatch[1]);

  const previousRowMatch = text.match(/Previous\s+Policy\s+Expiry\s+Date\s+Previous\s+Policy\s+No\s+Insurance\s+Provider\s+\d{2}\/\d{2}\/\d{4}\s+[0-9A-Z\s]+?\s+([A-Z][A-Za-z\s]+?Limited)/i);
  if (previousRowMatch) result.previousInsurer = cleanValue(previousRowMatch[1]);

  const transcriptPreviousMatch = text.match(/Insurance\s+Provider\s+ii\.\s+Previous\s+Policy\s+No\s+iii\.\s+Previous\s+Policy\s+Expiry\s+Date\s+([A-Z][A-Za-z\s]+?Limited)\s+([0-9\s]+)\s+\d{2}\/\d{2}\/\d{4}/i);
  if (transcriptPreviousMatch) {
    result.previousInsurer = cleanValue(transcriptPreviousMatch[1]);
    result.previousPolicyNumber = cleanPolicyCode(transcriptPreviousMatch[2]);
  }
  return result;
};

// ============================================================
// PREMIUM EXTRACTION LOGIC
// ============================================================
const extractPremiumData = (text = "") => {
  const defaultResult = { 
    calculatedOdPremium: "-", 
    calculatedTpPremium: "-", 
    totalOdPremium: "0", 
    totalTpPremium: "0", 
    netPremium: "0", 
    gst: "0", 
    totalPayable: "0"
  };
  
  if (!text) return defaultResult;
  const result = { ...defaultResult };

  const cleanAmt = (val) => {
    if (!val) return null;
    const cleaned = val.replace(/[,\s]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num.toFixed(2);
  };

  const tpMatch = text.match(/Total\s+Act\s+Premium\s*-\s*B\s*([\d,\s]+\.\s*\d\s*\d?|[\d,]+)/i);
  if (tpMatch) result.totalTpPremium = cleanAmt(tpMatch[1]) || result.totalTpPremium;

  const bajajLiabilityQuote = text.match(/Premium\s+for\s+Liability\s+Coverage\s+quoted\s+is\s+Rs\.?\s*([\d,]+)/i);
  if (bajajLiabilityQuote) result.totalTpPremium = cleanAmt(bajajLiabilityQuote[1]) || result.totalTpPremium;

  const netMatch = text.match(/Total\s+Premium\s*\(Net\s+Premium\)\s*\(A\+B\)\s*([\d,\s]+\.\s*\d\s*\d?|[\d,]+)/i);
  if (netMatch) result.netPremium = cleanAmt(netMatch[1]) || result.netPremium;

  if (result.netPremium !== "0" && result.totalTpPremium !== "0") {
    const netAmt = parseFloat(result.netPremium);
    const tpAmt = parseFloat(result.totalTpPremium);
    if (!isNaN(netAmt) && !isNaN(tpAmt)) {
      result.totalOdPremium = (netAmt - tpAmt).toFixed(2);
    }
  } else {
    const odMatch = text.match(/Total\s+OD\s+Premium\s*-\s*A\s*([\d,\s]+\.\s*\d\s*\d?|[\d,]+)/i);
    if (odMatch) result.totalOdPremium = cleanAmt(odMatch[1]) || result.totalOdPremium;
  }

  const sgstMatch = text.match(/State\s+GST\s*\(\d+%\)\s*([\d,\s]+\.\s*\d\s*\d?|[\d,]+)/i);
  const cgstMatch = text.match(/Central\s+GST\s*\(\d+%\)\s*([\d,\s]+\.\s*\d\s*\d?|[\d,]+)/i);
  if (sgstMatch && cgstMatch) {
    const sgst = parseFloat(cleanAmt(sgstMatch[1]));
    const cgst = parseFloat(cleanAmt(cgstMatch[1]));
    if (!isNaN(sgst) && !isNaN(cgst)) {
      result.gst = (sgst + cgst).toFixed(2);
    }
  }

  const finalMatch = text.match(/Final\s+Premium\s*\([\s\S]*?\)\s*([\d,\s]+\.\s*\d\s*\d?|[\d,]+)/i);
  if (finalMatch) result.totalPayable = cleanAmt(finalMatch[1]) || result.totalPayable;

  const bajajBundledFinalMatch = text.match(/Final\s+Premium\s*\([\s\S]*?\)\s*([\d,]+(?:\.\d\s*\d)?)/i) ||
                                 text.match(/Seating\s+CapacityFinal\s+Premium[\s\S]{0,80}?\d{4}\s*\d\s*\d{2,5}\s*(\d{3,6})\b/i);
  if (bajajBundledFinalMatch) result.totalPayable = cleanAmt(bajajBundledFinalMatch[1]) || result.totalPayable;

  const directFinalMatch = text.match(/Final\s+Premium\s+([\d,]+)\b/i);
  if (directFinalMatch) result.totalPayable = cleanAmt(directFinalMatch[1]) || result.totalPayable;

  const sgstShort = text.match(/([\d,]+)\s+SGST\s*\(\s*9%\s*\)/i) || text.match(/\bSGST\s*\(\s*9%\s*\)\s*([\d,]+)/i);
  const cgstShort = text.match(/([\d,]+)\s+CGST\s*\(\s*9%\s*\)/i) || text.match(/\bCGST\s*\(\s*9%\s*\)\s*([\d,]+)/i);
  if (sgstShort && cgstShort) {
    const sgst = parseFloat(cleanAmt(sgstShort[1]));
    const cgst = parseFloat(cleanAmt(cgstShort[1]));
    if (!isNaN(sgst) && !isNaN(cgst)) result.gst = (sgst + cgst).toFixed(2);
  }

  const premiumSection = text.match(/SCHEDULE OF PREMIUM([\s\S]*?)(?=Total Payable|Limitation as to use|$)/i);
  if (premiumSection) {
    const premiumText = premiumSection[1];
    
    if (result.totalOdPremium === "0") {
      const totalOd = premiumText.match(/Total OD Premium\s*([\d.]+)/i) || text.match(/Total OD Premium in Rs\s*([\d.]+)/i);
      if (totalOd) result.totalOdPremium = cleanAmt(totalOd[1]); 
    }
    
    if (result.totalTpPremium === "0") {
      const totalTp = premiumText.match(/Total TP Premium\s*([\d.]+)/i) || text.match(/Total TP Premium\s*\(Rs\)\s*([\d.]+)/i);
      if (totalTp) result.totalTpPremium = cleanAmt(totalTp[1]);
    }
  }
  
  if (result.totalOdPremium === "0") {
    let firstYearOdMatch = text.match(/Total\s+Own\s+Damage\s+Premium:\s*([\d,]+)/i);
    if (firstYearOdMatch) result.totalOdPremium = cleanAmt(firstYearOdMatch[1]);
  }
  
  if (result.totalTpPremium === "0") {
    let firstYearTpMatch = text.match(/Total\s+Liability\s+Premium:\s*([\d,]+)/i);
    if (firstYearTpMatch) result.totalTpPremium = cleanAmt(firstYearTpMatch[1]);
  }

  const bajajBundledTpMatch = text.match(/Total\s+Act\s+Premium\s*-\s*B\s*([\d,]+(?:\.\d\s*\d)?)/i) ||
                              text.match(/Basic\s+Third\s+Party\s+Liability\s*([\d,]+(?:\.\d\s*\d)?)/i);
  if (bajajBundledTpMatch) result.totalTpPremium = cleanAmt(bajajBundledTpMatch[1]) || result.totalTpPremium;
  
  if (result.netPremium === "0") {
    let fallbackNet = text.match(/Special\s+Discount\s+Net\s+Premium\s*([\d,]+)/i) ||
                      text.match(/Total\s+premium\s*([\d,]+)/i) ||
                      text.match(/Net\s+Premium\s*\(Rs\)\s*([\d,]+)/i) ||
                      text.match(/Net Premium in Rs\s*[\s:]*([\d,]+)/i);
    if (fallbackNet) result.netPremium = cleanAmt(fallbackNet[1]);
  }
  
  if (result.gst === "0") {
    let fallbackGst = text.match(/Integrated\s+GST\s*\([\d.]+%\)\s*([\d,]+)/i) ||
                      text.match(/GST\s*\(Rs\)\s*([\d,]+)/i) ||
                      text.match(/GST in Rs\s*[\s:]*([\d,]+)/i);
    if (fallbackGst) result.gst = cleanAmt(fallbackGst[1]);
  }
  
  if (result.totalPayable === "0") {
    let fallbackTotal = text.match(/Final\s+Premium\s+Rs\.?\s*([\d,]+)/i) ||
                        text.match(/Final\s+Premium\s*([\d,]+)/i) ||
                        text.match(/Total\s+Payable\s*\(Rs\)\s*([\d,]+)/i) ||
                        text.match(/Total Payable in Rs\s*[\s:]*([\d,]+)/i);
    if (fallbackTotal) result.totalPayable = cleanAmt(fallbackTotal[1]);
  }

  if (result.netPremium === "0") {
    const total = parseFloat(result.totalPayable);
    const gst = parseFloat(result.gst);
    if (!isNaN(total) && !isNaN(gst) && total > gst) result.netPremium = (total - gst).toFixed(2);
  }

  if (result.totalTpPremium === "0" && result.netPremium !== "0" && result.totalOdPremium === "0") {
    result.totalTpPremium = result.netPremium;
  }
  
  return result;
};

const extractVehicleDetailsFromText = (text = "") => {
  const result = {
    registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-",
    model: "-", variant: "-", manufacturingYear: "-",
    cubicCapacity: "-", seatingCapacity: "-", financierName: "NA", fuelType: "-", idv: "-",
    commercialVehicleType: "-", ncb: "0%"
  };

  const normalizedText = String(text || "")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  // =======================================================
  // BAJAJ COMMERCIAL VEHICLE PACKAGE SCHEDULE FORMAT
  // =======================================================
  if (/Commercial\s+Vehicle\s+Package\s+Policy/i.test(normalizedText)) {
    const vehicleTypeMatch = normalizedText.match(/Vehicle\s+Type\s*([A-Za-z0-9\s:>&/-]+?)\s+Period\s+Of\s+Insurance/i);
    if (vehicleTypeMatch?.[1]) {
      result.commercialVehicleType = cleanValue(vehicleTypeMatch[1]);
    }

    const commercialPackageVehicleMatch = normalizedText.match(
      /(?:Registration\s+Number\s+Vehicle\s+Make\s+Vehicle\s+SubType\s+Vehicle\s+Model[\s\S]{0,260}|Registration\s+No\.\s+MakeSubTypeModel[\s\S]{0,260})\s+([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s*(\d?)\s*(TATA|MAHINDRA|EICHER|ASHOK\s+LEYLAND|MARUTI|HYUNDAI|BAJAJ)\s*(STARBUS\s+STAFF\s+BUS\s*\(\s*\d{1,3}\s*\+\s*1\s*\)|SCHOOL\s+BUS\s*\(\s*\d{1,3}\s*\+\s*1\s*\))\s+([A-Z0-9.]+(?:\s+[A-Z0-9.]+)?)\s*(0?)\s*(20\d{2})\s*(\d{1,3})\s*(\d{5})\s*(\d{5})\s+Fuel\s+Type/i
    );

    if (commercialPackageVehicleMatch) {
      result.registrationNumber = cleanAlphaNumeric(`${commercialPackageVehicleMatch[1]}${commercialPackageVehicleMatch[2]}`);
      result.make = cleanValue(commercialPackageVehicleMatch[3]).toUpperCase();
      result.variant = cleanValue(commercialPackageVehicleMatch[4]).toUpperCase();
      const rawModel = cleanValue(commercialPackageVehicleMatch[5]).toUpperCase();
      const gluedCcMatch = rawModel.match(/^(.+?)0$/);
      result.model = gluedCcMatch && !commercialPackageVehicleMatch[6]
        ? cleanValue(gluedCcMatch[1]).toUpperCase()
        : rawModel;
      result.cubicCapacity = commercialPackageVehicleMatch[6] || (gluedCcMatch ? "0" : "-");
      result.manufacturingYear = commercialPackageVehicleMatch[7];
      result.seatingCapacity = commercialPackageVehicleMatch[8];
      result.chassisNumber = cleanAlphaNumeric(commercialPackageVehicleMatch[9]);
      result.engineNumber = cleanAlphaNumeric(commercialPackageVehicleMatch[10]);
    }
  }

  // =======================================================
  // BAJAJ COMMERCIAL LIABILITY ONLY FORMAT
  // =======================================================
  if (/Commercial\s+Vehicle\s+Liability\s+Only\s+Policy|Third\s+Liability\s+Cover/i.test(text)) {
    const regMatch = text.match(/\b([A-Z]{2})[-\s]?(\d{2})[-\s]?([A-Z]{1,3})[-\s]?(\d{4})\b/i);
    if (regMatch) result.registrationNumber = `${regMatch[1]}${regMatch[2]}${regMatch[3]}${regMatch[4]}`.toUpperCase();

    const placeMatch = text.match(/Place\s+of\s+Registration[\s\S]*?\b([A-Z]{2}\d{2})[-\s]?[A-Z][A-Z\s]+/i);
    if (placeMatch && result.registrationNumber === "-") result.registrationNumber = placeMatch[1].toUpperCase();

    const makeModelMatch = text.match(/\b(TATA|MAHINDRA|EICHER|ASHOK\s+LEYLAND|MARUTI|HYUNDAI)\s+([A-Z0-9]+)\s+\d+\s+(\d{4})\s+([A-Z0-9\s()+-]+?)\s+0\s+Place\s+of\s+Registration/i);
    if (makeModelMatch) {
      result.make = cleanValue(makeModelMatch[1]).toUpperCase();
      result.model = cleanValue(makeModelMatch[2]).toUpperCase();
      result.manufacturingYear = makeModelMatch[3];
      result.variant = cleanValue(makeModelMatch[4]).toUpperCase();
      const expressVariant = result.variant.match(/(EXPRESS\s*\(9\+1\))/i);
      if (expressVariant) result.variant = expressVariant[1].toUpperCase();
    }

    const carryingMatch = text.match(/Carrying\s+Capacity\s+Engine\s+Number\s+Chassis\s+No[\s\S]*?\b(\d{1,2})\s+([A-Z0-9]{12,25})\s+(DIESEL|PETROL|CNG|CNG\/LPG|LPG|DIESEL\(D\)|PETROL\(P\))\s+\d+\s+([A-Z0-9]{12,25})/i);
    if (carryingMatch) {
      result.seatingCapacity = carryingMatch[1];
      result.chassisNumber = cleanAlphaNumeric(carryingMatch[2]);
      result.fuelType = carryingMatch[3].replace(/\(.+?\)/g, "").replace(/\/LPG/i, "").toUpperCase();
      result.engineNumber = cleanAlphaNumeric(carryingMatch[4]);
    }

    const proposalVehicleMatch = text.match(/\b(TATA)\s+(MAGIC)\s+\d+\s+(\d{4})\s+([A-Z0-9\s()+-]+?)\s+9\s+([A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,3}[-\s]?\d{4})[\s\S]*?DIESEL\(D\)\s+0\s+0\s+([A-Z0-9]{10,20})\s+(\d{2})\s+0/i);
    if (proposalVehicleMatch) {
      result.make = proposalVehicleMatch[1];
      result.model = proposalVehicleMatch[2];
      result.manufacturingYear = proposalVehicleMatch[3];
      result.variant = cleanValue(proposalVehicleMatch[4]).toUpperCase();
      const expressVariant = result.variant.match(/(EXPRESS\s*\(9\+1\))/i);
      if (expressVariant) result.variant = expressVariant[1].toUpperCase();
      result.seatingCapacity = "9";
      result.registrationNumber = cleanAlphaNumeric(proposalVehicleMatch[5]);
      if (result.engineNumber === "-") result.engineNumber = cleanAlphaNumeric(`${proposalVehicleMatch[6]}${proposalVehicleMatch[7]}`);
      if (result.fuelType === "-") result.fuelType = "DIESEL";
    }

    const idvMatch = text.match(/Total\s+IDV\s*\(Rs\)[\s\S]*?Vehicle\s+IDV[\s\S]*?\b(\d+)\s+0\s+0\s+DIESEL/i) ||
                     text.match(/Total\s+IDV\s*\(Rs\)[\s\S]*?\b(\d+)\s*$/im);
    if (idvMatch) result.idv = idvMatch[1];
    if (/Liability\s+Only/i.test(text)) result.idv = "0";
  }

  // =======================================================
  // 1. BUNDLED TWO-WHEELER NEW FORMAT EXTRACTION
  // =======================================================
  // Target: NEW or standard reg format cleanly using word boundaries
  const bundledRow1 = text.match(/\b(NEW|[A-Z]{2}[-A-Z0-9\s]{6,11})\b\s+[A-Z]{3}\/\d{4}\s+([A-Z\s]+?)\s+([A-Z0-9]+)\s+(.+?)\s+(\d{1,5}(?:\.\d+[A-Z]*)?|\d+)\s+([A-Za-z]+)\s+(\d{4})\s+(\d{1,2})/i);
  
  if (bundledRow1) {
    let reg = bundledRow1[1].trim();
    result.registrationNumber = reg.toUpperCase().includes("NEW") ? "NEW" : reg;
    result.make = bundledRow1[2].trim();
    result.model = bundledRow1[3].trim();
    result.variant = bundledRow1[4].trim();
    result.cubicCapacity = bundledRow1[5].trim();
    
    let rawFuel = bundledRow1[6].trim();
    result.fuelType = rawFuel.toLowerCase() === "battery" ? "Electric" : rawFuel;
    
    result.manufacturingYear = bundledRow1[7].trim();
    result.seatingCapacity = bundledRow1[8].trim();
  }

  if (result.registrationNumber === "-" || result.make === "-") {
    const compactTwoWheelerMatch = text.match(/\b(NEW|[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4})([A-Z]{3}\/\d{4})(HONDA|HERO|BAJAJ|TVS|YAMAHA|SUZUKI|ROYAL\s*ENFIELD|KTM)([A-Z0-9\s]+?)(\d{2,5})(Petrol|Diesel|CNG|LPG|Electric|Battery)(20\d{2})(\d{1,2})/i);
    if (compactTwoWheelerMatch) {
      const modelVariant = splitCompactBajajModelVariant(compactTwoWheelerMatch[4]);
      result.registrationNumber = compactTwoWheelerMatch[1].toUpperCase().includes("NEW")
        ? "NEW"
        : cleanAlphaNumeric(compactTwoWheelerMatch[1]);
      result.make = cleanValue(compactTwoWheelerMatch[3]).toUpperCase();
      result.model = modelVariant.model;
      result.variant = modelVariant.variant;
      result.cubicCapacity = compactTwoWheelerMatch[5];
      result.fuelType = compactTwoWheelerMatch[6].toLowerCase() === "battery" ? "Electric" : compactTwoWheelerMatch[6];
      result.manufacturingYear = compactTwoWheelerMatch[7];
      result.seatingCapacity = compactTwoWheelerMatch[8];
    }
  }

  // Extract Engine, Chassis, and IDV accurately
  // Target pattern: "E20ATD69953   MD2C59202TA D67137 1,17,949.00"
  const bundledRow2 = text.match(/([A-Z0-9]{8,15})\s+([A-Z0-9]{5,15}\s+[A-Z0-9]{5,10})\s+([\d,]+(?:\.\d{2})?)\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+([\d,]+(?:\.\d{2})?)/i);
  
  if (bundledRow2) {
    result.engineNumber = cleanAlphaNumeric(bundledRow2[1]);
    result.chassisNumber = cleanAlphaNumeric(bundledRow2[2]); // Strips space in "MD2C59202TA D67137" -> "MD2C59202TAD67137"
    result.idv = cleanAmount(bundledRow2[4] || bundledRow2[3]);
  } else {
    // Single-word chassis fallback
    const bundledRow2Alt = text.match(/([A-Z0-9]{8,15})\s+([A-Z0-9]{12,20})\s+([\d,]+(?:\.\d{2})?)/i);
    if (bundledRow2Alt) {
      result.engineNumber = cleanAlphaNumeric(bundledRow2Alt[1]);
      result.chassisNumber = cleanAlphaNumeric(bundledRow2Alt[2]);
      result.idv = cleanAmount(bundledRow2Alt[3]);
    }
  }

  if (result.engineNumber === "-" || result.chassisNumber === "-") {
    const compactVehicleBlock = text.match(/Engine\s+Number\s*Chassis\s+Number\s*Vehicle\s+IDV[\s\S]{0,220}?([A-Z0-9]{8,15})\s+(\d?)\s+([A-Z0-9]{8,15})\s+([A-Z0-9]{5,10})\s+([\d,]+(?:\.\d{2})?)/i);
    if (compactVehicleBlock) {
      result.engineNumber = cleanAlphaNumeric(`${compactVehicleBlock[1]}${compactVehicleBlock[2]}`);
      result.chassisNumber = cleanAlphaNumeric(`${compactVehicleBlock[3]}${compactVehicleBlock[4]}`);
      result.idv = cleanAmount(compactVehicleBlock[5]);
    }
  }

  if (result.chassisNumber === "-" || result.engineNumber === "-") {
    const certificateVehicleMatch = text.match(/\b(NEW|[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4})\s*([A-Z]{2}\d{2})[-\s]?[A-Z]+([A-Z0-9]{8,16})([A-Z0-9]{14,20})\s+([A-Z0-9]{2,6})\s+(HONDA)\s*-\s*([A-Z0-9 ]+)/i);
    if (certificateVehicleMatch) {
      if (result.registrationNumber === "-") result.registrationNumber = certificateVehicleMatch[1].toUpperCase();
      if (result.engineNumber === "-") result.engineNumber = cleanAlphaNumeric(certificateVehicleMatch[3]);
      if (result.chassisNumber === "-") result.chassisNumber = cleanAlphaNumeric(`${certificateVehicleMatch[4]}${certificateVehicleMatch[5]}`);
      if (result.make === "-") result.make = certificateVehicleMatch[6].toUpperCase();
      if (result.model === "-") result.model = cleanValue(certificateVehicleMatch[7]).toUpperCase();
    }
  }

  const bajajVehicleIdv = extractBajajVehicleIdv(text);
  if (bajajVehicleIdv !== "-") result.idv = bajajVehicleIdv;

  // =======================================================
  // 2. OLD FORMAT FALLBACK
  // =======================================================
  if (result.make === "-") {
    const tablePattern = /Registration\s*No\.?[\s\S]*?([A-Z0-9]{8,11}\s?\d?)\s+([A-Za-z]+)\s+(.+?)\s+(\d{1,5})\s+(\d{4})\s+(\d{1,3})\s+([A-Z0-9\s]{15,35})\s+([A-Z0-9\s]+?)\s+Fuel/i;
    const tableMatch = text.match(tablePattern);

    if (tableMatch) {
      let reg = cleanAlphaNumeric(tableMatch[1]);
      result.registrationNumber = reg.toUpperCase().includes("NEW") ? "NEW" : reg;
      result.make = tableMatch[2].trim();
      
      let rawModel = tableMatch[3].trim();
      
      const lpMatch = rawModel.match(/(.*)\s+(LP\s*\d+)$/i);
      if (lpMatch) {
          result.model = lpMatch[2].trim();
          result.variant = lpMatch[1].trim();
      } else {
          const newVariantMatch = rawModel.match(/(.*)\s+(\d{4}\s*[A-Z])$/i);
          if (newVariantMatch) {
              result.model = newVariantMatch[2].trim();
              result.variant = newVariantMatch[1].trim();
          } else {
              result.model = rawModel;
              result.variant = "-";
          }
      }

      result.cubicCapacity = tableMatch[4];
      result.manufacturingYear = tableMatch[5];
      result.seatingCapacity = tableMatch[6];
      
      const rest = (tableMatch[7] + " " + tableMatch[8]).trim();
      const tokens = rest.split(/\s+/);
      
      if (tokens.length >= 2) {
        const engineTokens = tokens.slice(-2);
        const chassisTokens = tokens.slice(0, -2);
        
        result.engineNumber = cleanAlphaNumeric(engineTokens.join(''));
        result.chassisNumber = cleanAlphaNumeric(chassisTokens.join(''));
      } else {
        result.engineNumber = cleanAlphaNumeric(rest);
        result.chassisNumber = "-";
      }
    }
  }

  // Fallback for IDV and Fuel Type if still unpopulated
  if (result.fuelType === "-" || result.idv === "-") {
    const fuelIdvMatch = text.match(/(DIESEL|PETROL|CNG|EV|ELECTRIC|LPG|BATTERY)\s+([\d,]+(?:\.\d{2})?)\s+/i);
    if (fuelIdvMatch) {
      let rawFuel = fuelIdvMatch[1].trim();
      result.fuelType = rawFuel.toLowerCase() === "battery" ? "Electric" : rawFuel;
      if (result.idv === "-") result.idv = cleanAmount(fuelIdvMatch[2]);
    }
  }

  // Financier extraction
  const hypMatch = text.match(/HYPOTHECATED\s*WITH\s*[:]?\s*([^\n\r]+?)(?=\s*\d+\.\s*Add\s+on|\s*Policy\s*Status)/i) || 
                   text.match(/Hypothecated\s+To\s*[:]?\s*([^\n\r]+?)(?=\s*\d+\.\s*Add\s+on)/i) ||
                   text.match(/Name\s+of\s+Pledgee\s*:\s*([A-Z0-9 .&-]+?)(?=\s*\d+\.\s*Add\s+on|\.|$)/i) ||
                   text.match(/Hypothecation\s+Details\s+([A-Z0-9 .&-]+?)(?=\s+Vehicle\s+IDV|$)/i);
  if (hypMatch) {
      let rawFinancier = hypMatch[1].replace(/Policy\s*Status/i, '').trim();
      if (/^NA\b/i.test(rawFinancier)) {
        result.financierName = "NA";
      } else {
        result.financierName = typeof formatFinancierName !== "undefined" ? formatFinancierName(rawFinancier) : rawFinancier.replace(/\s+/g, " ").toUpperCase();
      }
  }

  const ncbMatch = text.match(/No\s+Claim\s+Bonus\s*[:]?\s*[-]?\s*(\d+%)/i);
  if (ncbMatch) {
    result.ncb = ncbMatch[1];
  }

  const pdfScheduleVehicle = extractBajajCommercialPackageVehicle(text);
  Object.entries(pdfScheduleVehicle).forEach(([key, value]) => {
    if (value && value !== "-" && value !== "NA") result[key] = value;
  });
  
  return result;
};

// =======================================
// MAIN COMPONENT
// =======================================

function BajajGeneralPolicyCard({ item }) {
  const fullText = item?.fullText || "";
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};

  const autoInsuredDetails = extractInsuredDetails(fullText);
  const policyDates = extractPolicyDates(fullText);
  const extractedVehicle = extractVehicleDetailsFromText(fullText);
  const autoPremium = extractPremiumData(fullText);

  return (
    <PolicyCardView
      item={item}
      policyNumber={extractPolicyNumber(fullText)}
      insuranceCompany={extractInsuranceCompany(fullText)}
      branchAddress={extractBranchAddress(fullText)}
      productType={getProductType(policy?.policyType, fullText)}
      vehicleCategory={getVehicleCategory(policy?.policyType, fullText)}
      insuredName={autoInsuredDetails.insuredName}
      panNumber={autoInsuredDetails.panNumber}
      gstin={autoInsuredDetails.gstin}
      contactNumber={autoInsuredDetails.contactNumber}
      email={autoInsuredDetails.email}
      insuredAddress={autoInsuredDetails.insuredAddress}
      policyDates={policyDates}
      dateOfIssue={extractDateOfIssue(fullText)}
      totalValue={extractedVehicle.idv || "0"}
      previousInsurer={extractPreviousPolicyData(fullText).previousInsurer}
      previousPolicyNumber={extractPreviousPolicyData(fullText).previousPolicyNumber}
      finalPremium={autoPremium}
      vehicle={{ ...vehicle, ...extractedVehicle }}
      extractedVehicle={extractedVehicle}
    />
  );
}

export default BajajGeneralPolicyCard;
