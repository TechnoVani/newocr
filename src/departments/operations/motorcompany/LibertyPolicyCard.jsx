import { useState } from "react";
import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

// ============================================================
// UTILITIES
// ============================================================

const normalizeText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
};

const cleanValue = (value) => {
  if (!value) return "-";
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/[\n\r]+/g, " ")
    .trim();
};

const removeHyphens = (value) => {
  if (!value || value === "-") return "-";
  return String(value).replace(/-/g, "");
};

const cleanAlphaNumeric = (value, keepSpaces = false) => {
  if (!value) return "-";
  let cleaned = String(value)
    .replace(/\r|\n/g, "")
    .replace(/\s+/g, keepSpaces ? " " : "");
  if (!keepSpaces) {
    cleaned = cleaned.replace(/[^A-Z0-9]/gi, "");
  }
  return cleaned.toUpperCase().trim();
};

// ============================================================
// EXTRACTION FUNCTIONS
// ============================================================

const extractPolicyNumber = (text) => {
  if (!text) return "-";
  const normalized = normalizeText(text);
  const patterns = [
    /PolicyRef\s+No\.?\s*:?\s*([0-9A-Z]{15,30})/i,
    /Policy\s+Ref\s+No\.?\s*:?\s*([0-9A-Z]{15,30})/i,
    /Policy Number\s*:\s*([0-9A-Z]{15,30})/i,
    /Policy No\.\s*:\s*([0-9A-Z]{15,30})/i,
    /(191100[0-9A-Z]{10,20})/i,
    /\b([0-9A-Z]{20,30})\b/,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/[^0-9A-Z]/gi, '');
      if (cleaned.length >= 15 && cleaned.length <= 30) return cleaned;
    }
  }
  return "-";
};

const extractInsuranceCompany = (text) => {
  if (!text) return "-";
  if (text.includes("LIBERTY GENERAL INSURANCE LIMITED")) {
    return "LIBERTY GENERAL INSURANCE LIMITED";
  }
  return "-";
};

const extractBranchAddress = (fullText) => {
  if (!fullText) return "-";
  let raw = "";
  // Try United India pattern
  let match = fullText.match(/Issuing Office Address\s+Code\s+\d+\s+(.*?\d{6})/i);
  if (match) raw = match[1].trim();
  else {
    // Try other patterns: "Policy issuing office", "Policy Servicing office", or any line with "Address" and pincode
    match = fullText.match(/(?:Policy (?:Servicing|issuing) office|Office Address)\s*:\s*([^\n]+(?:[\n][^\n]+)*?)(?=\s*(?:PH:|$|\n\s*\n))/i);
    if (match) raw = match[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    else {
      // Fallback: find any line containing a 6-digit pincode and preceded by "Address" or "Office"
      match = fullText.match(/(?:Address|Office).*?([^,]+(?:,[^,]+)*?,\s*\d{6})/i);
      if (match) raw = match[1].trim();
    }
  }
  if (!raw || raw === "-") return "-";
  // Clean the raw address
  return cleanAddress(raw);
};

const cleanAddress = (addr) => {
  if (!addr) return "-";
  // Split by comma
  let parts = addr.split(',').map(s => s.trim());
  // Check if first part contains insurance company keywords
  const companyKeywords = ['Insurance', 'Limited', 'Ltd', 'Corp', 'Company'];
  if (parts.length > 1 && companyKeywords.some(kw => parts[0].toUpperCase().includes(kw.toUpperCase()))) {
    parts.shift(); // remove first part
  }
  // Find part containing 6-digit pincode
  let pincodeIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    if (/\d{6}/.test(parts[i])) {
      pincodeIndex = i;
      break;
    }
  }
  if (pincodeIndex >= 0) {
    // Keep parts from start up to and including pincode part
    parts = parts.slice(0, pincodeIndex + 1);
  }
  // Remove any trailing "PH:" from the last part if present
  let last = parts[parts.length - 1];
  if (last) {
    last = last.replace(/\s*PH:.*$/i, '').trim();
    parts[parts.length - 1] = last;
  }
  // Join and clean up extra spaces
  let result = parts.join(', ').replace(/\s+/g, ' ').trim();
  // Remove trailing commas
  result = result.replace(/,\s*$/, '');
  return result || "-";
};

// ============================================================
// IMPROVED INSURED DETAILS EXTRACTION
// ============================================================
const extractInsuredDetails = (text) => {
  if (!text) return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };

  const normalized = normalizeText(text);
  let insuredName = "-";
  let insuredAddress = "-";

  // ----- NAME extraction -----
  const nameMatch = normalized.match(/\bInsured\s+([A-Z][A-Z\s]+[A-Z])(?=\s+(?:Policy Issued on|Address|$))/i);
  if (nameMatch && nameMatch[1]) {
    insuredName = nameMatch[1].trim();
  }

  // ----- ADDRESS extraction (robust) -----
  const addressIndex = normalized.search(/\bAddress\s+/i);
  if (addressIndex !== -1) {
    let afterAddress = normalized.slice(addressIndex);
    afterAddress = afterAddress.replace(/^Address\s+/i, '');
    const stopPattern = /\s*(?:Covernote No|Contact Number|Policy Issued on|$)/i;
    const endMatch = afterAddress.match(new RegExp(`^(.*?)${stopPattern.source}`, 'is'));
    let rawAddress = endMatch ? endMatch[1] : afterAddress;
    rawAddress = rawAddress.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const firstComma = rawAddress.indexOf(',');
    insuredAddress = firstComma !== -1 ? rawAddress.substring(firstComma + 1).trim() : rawAddress;
  }

  // ----- Fallback: Communication Address or Registration Address -----
  if (!insuredAddress || insuredAddress === "-") {
    const fallbackMatch = normalized.match(/\bCommunication Address\s*:\s*([^\n]+)/i) ||
                          normalized.match(/\bRegistration Address\s*:\s*([^\n]+)/i);
    if (fallbackMatch && fallbackMatch[1]) {
      let raw = fallbackMatch[1].trim();
      const firstComma = raw.indexOf(',');
      insuredAddress = firstComma !== -1 ? raw.substring(firstComma + 1).trim() : raw;
    }
  }

  if (!insuredAddress || insuredAddress === "") insuredAddress = "-";

  // ----- Contact Number (improved) -----
  // Matches: "Contact Number   (M) +91 9981650908" -> captures "+91 9981650908"
  const contactMatch = normalized.match(/Contact Number\s*\(M\)\s*([\+\d\s]+)/i) ||
                       normalized.match(/Mobile:\s*([\+\d\s]+)/i) ||
                       normalized.match(/Mobile No\.\s*[:\-]?\s*([\+\d\s]+)/i);
  const contactNumber = contactMatch?.[1]?.trim() || "-";

  // ----- Email (improved) -----
  // Matches "Email ID:   renewal@notioninsurance.com" or "Email: ..."
  const emailMatch = normalized.match(/Email ID:\s*([A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,})/i) ||
                     normalized.match(/Email:\s*([A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,})/i) ||
                     normalized.match(/\b([A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,})\b/i);
  const email = emailMatch?.[1]?.trim() || "-";

  // ----- PAN -----
  const panMatch = normalized.match(/PAN No\.\s*([A-Z0-9]+)/i) ||
                   normalized.match(/PAN\/FORM\s*60:\s*([A-Z0-9]+)/i);
  const panNumber = panMatch?.[1]?.trim() || "-";

  // ----- GSTIN -----
  const gstMatch = normalized.match(/Customer GSTIN\s*([A-Z0-9]+)/i) ||
                   normalized.match(/Customer GST\/UN No\.:\s*([A-Z0-9]+)/i) ||
                   normalized.match(/GST\s*No\.?\s*:\s*([A-Z0-9]+)/i);
  const gstin = gstMatch?.[1]?.trim() || "-";

  return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin };
};

// ============================================================
// UPDATED extractPolicyDates with logs and new pattern
// ============================================================
const extractPolicyDates = (fullText = "") => {

  if (!fullText) {
    return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  }

  const normalized = normalizeText(fullText);

  // ----- 1. NEW: Period of Insurance pattern -----
  // Matches: "Period of Insurance   From 00:00 Hrs of 05/06/2026 To Midnight of 04/06/2027"
  // Also handles variations like "From 00:00 Hrs of 05/06/2026 To 24:00 Hrs of 04/06/2027"
  const periodInsuranceMatch = normalized.match(
    /Period\s+of\s+Insurance\s+From\s+\d{2}:\d{2}\s+Hrs\s+of\s+(\d{2}\/\d{2}\/\d{4})\s+To\s+(?:Midnight|24:00 Hrs)\s+of\s+(\d{2}\/\d{2}\/\d{4})/i
  ) || normalized.match(
    /From\s+\d{2}:\d{2}\s+Hrs\s+of\s+(\d{2}\/\d{2}\/\d{4})\s+To\s+(?:Midnight|24:00 Hrs)\s+of\s+(\d{2}\/\d{2}\/\d{4})/i
  );

  if (periodInsuranceMatch) {
    const startDate = periodInsuranceMatch[1];
    const endDate = periodInsuranceMatch[2];
    const result = {
      startDate,
      odExpireDate: endDate,
      tpExpireDate: endDate  // same end date for both
    };
    return result;
  }

  // ----- 2. Existing: Bundled OD/TP Cover patterns -----
  const bundledODMatch = fullText.match(/OD Cover\s*(\d{2}\/\d{2}\/\d{4})\s*\d{2}:\d{2}:\d{2}\s*(?:AM|PM)\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  const bundledTPMatch = fullText.match(/TP Cover\s*(\d{2}\/\d{2}\/\d{4})\s*\d{2}:\d{2}:\d{2}\s*(?:AM|PM)\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (bundledODMatch) {
    const result = {
      startDate: bundledODMatch[1] || "-",
      odExpireDate: bundledODMatch[2] || "-",
      tpExpireDate: bundledTPMatch?.[2] || bundledODMatch[2] || "-"
    };
    return result;
  }

  // ----- 3. Fallback: Generic "Period of cover" or "period:" patterns -----
  const periodMatch = fullText.match(/Period of cover\s*(\d{2}\/\d{2}\/\d{4})(?:.*?)to\s*(\d{2}\/\d{2}\/\d{4})/i);
  let tpExpiryDate = periodMatch?.[2] || "-";
  const bundledLiabilityMatch = fullText.match(/Bundled\/Liability Policy\s*period:\s*\d{2}\/\d{2}\/\d{4}\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (bundledLiabilityMatch?.[1]) {
    tpExpiryDate = bundledLiabilityMatch[1];
  }
  const periodOnlyMatch = fullText.match(/period:\s*\d{2}\/\d{2}\/\d{4}\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (periodOnlyMatch?.[1]) {
    tpExpiryDate = periodOnlyMatch[1];
  }

  const result = {
    startDate: periodMatch?.[1] || "-",
    odExpireDate: periodMatch?.[2] || "-",
    tpExpireDate: tpExpiryDate
  };
  return result;
};

// ============================================================
// OTHER EXTRACTION FUNCTIONS (unchanged)
// ============================================================

const extractDateOfIssue = (text) => {
  if (!text) return "-";
  const normalized = normalizeText(text);
  const match = normalized.match(/Policy Issued on\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                normalized.match(/Date of Issue\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  return match?.[1] || "-";
};

const extractIDV = (text) => {
  if (!text) return "-";
  const normalized = normalizeText(text);
  const match = normalized.match(/IDV\s*\(INSURED\s*’?\s*S\s*DECLARED\s*VALUE\)[\s\S]*?Total Value\s*`?\s*([\d,]+)/i) ||
                normalized.match(/IDV Of Vehicle\s*`?\s*([\d,]+)/i) ||
                normalized.match(/Total Value\s*`?\s*([\d,]+)/i);
  if (match && match[1]) {
    return match[1].replace(/,/g, "");
  }
  return "-";
};

const extractPreviousPolicyNumber = (text) => {
  if (!text) return "-";
  const normalized = normalizeText(text);
  // Match "Policy/Covernote no." or similar patterns
  const match = normalized.match(/Policy\/Covernote no\.?\s*([0-9A-Z]+)/i) ||
                normalized.match(/Previous Policy No\.?\s*:?\s*([0-9A-Z]+)/i);
  return match?.[1]?.trim() || "-";
};

const extractPreviousInsurer = (text) => {
  if (!text) return "-";
  const normalized = normalizeText(text);
  // Match "Name and Address of Previous Insurer" and capture the following text until next label
  const match = normalized.match(/Name and Address of Previous Insurer\s*([^\n]+)/i);
  if (match && match[1]) {
    // Clean: remove any trailing info that might appear (like "Policy/Covernote no." etc.)
    let insurer = match[1].trim();
    // If there is a newline or another label, cut it off
    insurer = insurer.replace(/\s+Policy\/Covernote.*$/i, '').trim();
    return insurer || "-";
  }
  return "-";
};

const extractCurrentNCB = (text) => {
  if (!text) return "-";
  const normalized = normalizeText(text);
  const match = normalized.match(/No Claim Bonus\s*([\d.]+)%/i) ||
                normalized.match(/NCB\s*:\s*([\d.]+)%/i);
  return match?.[1]?.trim() || "-";
};

const extractPremiumData = (text) => {
  const result = {
    totalOdPremium: "-",
    totalTpPremium: "-",
    netPremium: "-",
    gst: "-",
    totalPayable: "-",
    calculatedOdPremium: "-",
    calculatedTpPremium: "-"
  };
  if (!text) return result;
  const normalized = normalizeText(text);

  const odMatch = normalized.match(/TOTAL OWNDAMAGE PREMIUM\s*\(A\)\s*`?\s*([\d,]+\.?\d*)/i) ||
                  normalized.match(/Basic OD\s*`?\s*([\d,]+\.?\d*)/i);
  if (odMatch) result.totalOdPremium = odMatch[1].replace(/,/g, "");

  const tpMatch = normalized.match(/TOTAL LIABILITY PREMIUM\s*\(B\)\s*`?\s*([\d,]+\.?\d*)/i) ||
                  normalized.match(/Basic TP\s*`?\s*([\d,]+\.?\d*)/i);
  if (tpMatch) result.totalTpPremium = tpMatch[1].replace(/,/g, "");

  const netMatch = normalized.match(/Net Premium\s*\(A\+B\+C\+D\)Taxable Value\s*`?\s*([\d,]+\.?\d*)/i) ||
                   normalized.match(/Net Premium\s*:\s*([\d,]+\.?\d*)/i);
  if (netMatch) result.netPremium = netMatch[1].replace(/,/g, "");

  const gstMatch = normalized.match(/GST\(18%\)\s*`?\s*([\d,]+\.?\d*)/i) ||
                   normalized.match(/GST\s*:\s*([\d,]+\.?\d*)/i);
  if (gstMatch) result.gst = gstMatch[1].replace(/,/g, "");

  const totalMatch = normalized.match(/TOTAL POLICY PREMIUM\s*`?\s*([\d,]+\.?\d*)/i) ||
                     normalized.match(/Total Payable\s*:\s*([\d,]+\.?\d*)/i);
  if (totalMatch) result.totalPayable = totalMatch[1].replace(/,/g, "");

  result.calculatedOdPremium = result.totalOdPremium;
  result.calculatedTpPremium = result.totalTpPremium;

  return result;
};

const extractVehicleDetails = (text) => {
  const result = {
    registrationNumber: "-",
    chassisNumber: "-",
    engineNumber: "-",
    make: "-",
    model: "-",
    variant: "-",
    manufacturingYear: "-",
    colour: "-",
    cubicCapacity: "-",
    seatingCapacity: "-",
    geographicalArea: "-",
    financierName: "-",
    gvw: "-"
  };
  if (!text) return result;

  const normalized = normalizeText(text);

  // ----- Registration Number (unchanged, works) -----
  let regMatch = normalized.match(/Vehicle Registration No\.\s*([A-Z0-9]+)/i);
  if (!regMatch) {
    regMatch = normalized.match(/Trailer Chassis No\.\s*([A-Z0-9]+)/i);
  }
  if (!regMatch) {
    regMatch = normalized.match(/Registration No\.\s*([A-Z0-9]+)/i);
  }
  if (regMatch && regMatch[1]) {
    result.registrationNumber = removeHyphens(regMatch[1].trim());
  }

  // ----- Chassis Number (improved) -----
  let chassisMatch = normalized.match(/Chassis\s+No\s+([A-Z0-9]+)/i);                  // Page 2: "Chassis No   MAKGK773KG4100103"
  if (!chassisMatch) {
    chassisMatch = normalized.match(/Chassis\s+No\.?\s+([A-Z0-9]+\s+[A-Z0-9]+)/i);    // Page 1: "Chassis No.   MAKGK773K G4100103"
  }
  if (!chassisMatch) {
    chassisMatch = normalized.match(/Chassis\s+No\.?\s*([A-Z0-9]+)/i);               // fallback
  }
  if (chassisMatch && chassisMatch[1]) {
    result.chassisNumber = chassisMatch[1].replace(/\s+/g, '').toUpperCase();
  }

// ----- Engine Number -----
let engineMatch = null;

// Liberty Proposal Form
engineMatch = normalized.match(
  /Engine\s*No\.?\s*[:\-]?\s*([A-Z0-9]{8,25})\s*Chassis\s*No/i
);

// Generic fallback
if (!engineMatch) {
  engineMatch = normalized.match(
    /Engine\s*No\.?\s*[:\-]?\s*([A-Z0-9]{8,25})/i
  );
}

// Engine Number fallback
if (!engineMatch) {
  engineMatch = normalized.match(
    /Engine\s*Number\s*[:\-]?\s*([A-Z0-9]{8,25})/i
  );
}

// Vehicle table fallback
if (!engineMatch) {
  engineMatch = normalized.match(
    /Registration[\s\S]{0,500}?Engine\s*No\.?\s*([A-Z0-9]{8,25})/i
  );
}

if (engineMatch?.[1]) {
  result.engineNumber = engineMatch[1]
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .trim();
}

// ============================================================
// MAKE / MODEL / VARIANT
// ============================================================

// First Priority: Vehicle Details Table (Page 2)

const vehicleBlock = normalized.match(
  /Vehicle Details([\s\S]{0,1500})Add On Covers/i
);

if (vehicleBlock) {
  const block = vehicleBlock[1];

  const vehicleLine = block.match(
    /\b([A-Z]{3,})\s+([A-Z0-9\-]{2,})\s+([0-9.]+\s+[A-Z0-9\-\s]+?Hatch\s+Back)/i
  );

  if (vehicleLine) {
    result.make = cleanValue(vehicleLine[1]);
    result.model = cleanValue(vehicleLine[2]);
    result.variant = cleanValue(vehicleLine[3]);
  }
}
 // ----- Manufacturing Year (improved) -----
let yearValue = null;

// Primary: find the label and capture the year in format "2016/06-07-2017/-"
const yearMatch = normalized.match(/Year\s+of\s+Manufacture\s*\/\s*Date\s+of\s+Registration\s*\/\s*Invoice\s+Date.*?(\d{4})\/\d{2}-\d{2}-\d{4}\/-/i);
if (yearMatch && yearMatch[1]) {
  yearValue = yearMatch[1];
}

// Fallback: simpler patterns
if (!yearValue) {
  const fallback = normalized.match(/Year\s+of\s+Manufacture\s*\/\s*Invoice\s+Date\s*([^\s]+)/i) ||
                   normalized.match(/Year\s+of\s+Manufacture\s*[:\-]?\s*(\d{4})/i);
  if (fallback) {
    let raw = fallback[1]?.trim() || fallback[0]?.trim();
    const match = raw.match(/(\d{4})/);
    if (match) yearValue = match[1];
  }
}

if (yearValue) {
  result.manufacturingYear = yearValue;
}

  // ----- Cubic Capacity (unchanged) -----
  const ccMatch = normalized.match(/CC\/HP\/GVW\s*\/KW\s*([\d]+)/i) ||
                  normalized.match(/Cubic\s+Capacity\s*:\s*([\d]+)/i);
  if (ccMatch && ccMatch[1]) {
    result.cubicCapacity = ccMatch[1];
  }

  // ----- Seating Capacity (Dynamic) -----
let seatingCapacity = "-";

// Pattern 1:
// Seating Capacity/LCC (Including Driver/Cleaner )   5
let seatMatch =
  normalized.match(
    /Seating\s+Capacity\/LCC\s*\(Including\s+Driver\/Cleaner\s*\)\s*([0-9]{1,3})/i
  );

// Pattern 2:
// Seating Capacity (Including Driver) : 5
if (!seatMatch) {
  seatMatch = normalized.match(
    /Seating\s+Capacity\s*\(Including\s+Driver\)\s*:?\s*([0-9]{1,3})/i
  );
}

// Pattern 3:
// Licensed Carrying capacity including Driver 5
if (!seatMatch) {
  seatMatch = normalized.match(
    /Licensed\s+Carrying\s+capacity\s+including\s+Driver\s*:?[\s]*([0-9]{1,3})/i
  );
}

// Pattern 4 (Liberty Proposal Form Table)
if (!seatMatch) {
  seatMatch = normalized.match(
    /Gross\s+Vehicle\s+Weight.*?Seating\s+Capacity\/LCC.*?Body\s+Type[\s\S]{0,300}?([0-9]{1,3})\s+Hatch\s+Back/i
  );
}

if (seatMatch?.[1]) {
  seatingCapacity = seatMatch[1];
}

result.seatingCapacity = seatingCapacity;

  // ----- Geographical Area (unchanged) -----
  const geoMatch = normalized.match(/Geographical\s+Area\s*([A-Za-z\s]+)/i);
  if (geoMatch && geoMatch[1]) {
    result.geographicalArea = geoMatch[1].trim();
  }

  // ----- Financier (unchanged) -----
  const finMatch = normalized.match(/Hire\s+Purchase\/Lease\/Hypothecated\s+with\s*:\s*([^\n]+)/i) ||
                   normalized.match(/Name\s+of\s+Financier\s*&\s*Address\s*:\s*([^\n]+)/i);
  if (finMatch && finMatch[1] && !/NA/i.test(finMatch[1])) {
    result.financierName = finMatch[1].trim();
  }

  // ----- GVW (unchanged) -----
  const gvwMatch = normalized.match(/CC\/HP\/GVW\s*\/KW\s*[\d]+\s*([\d]+)/i) ||
                   normalized.match(/Gross\s+Vehicle\s+Weight\s*\(GVW\)\s*:\s*([\d]+)/i);
  if (gvwMatch && gvwMatch[1]) {
    result.gvw = gvwMatch[1];
  }

  return result;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

function LibertyPolicyCard({ item }) {
  const fullText = item?.fullText || "";
  const sourceVehicle = item?.vehicleDetails || {};

  // Extract all data
  const policyNumber = extractPolicyNumber(fullText);
  const insuranceCompany = extractInsuranceCompany(fullText);
  const branchAddress = extractBranchAddress(fullText);
  const insuredDetails = extractInsuredDetails(fullText);
  const policyDates = extractPolicyDates(fullText);
  const dateOfIssue = extractDateOfIssue(fullText);
  const totalValue = extractIDV(fullText);
  const previousPolicyNumber = extractPreviousPolicyNumber(fullText);
  const previousInsurer = extractPreviousInsurer(fullText);
  const currentNCB = extractCurrentNCB(fullText);
  const premiumData = extractPremiumData(fullText);
  const extractedVehicle = extractVehicleDetails(fullText);

  const productType = getProductType("", fullText);
  const vehicleCategory = getVehicleCategory("", fullText);

  const vehicle = {
    registrationNumber: extractedVehicle.registrationNumber !== "-" ? extractedVehicle.registrationNumber : sourceVehicle.registrationNumber,
    chassisNumber: extractedVehicle.chassisNumber !== "-" ? extractedVehicle.chassisNumber : sourceVehicle.chassisNumber,
    engineNumber: extractedVehicle.engineNumber !== "-" ? extractedVehicle.engineNumber : sourceVehicle.engineNumber,
    make: extractedVehicle.make !== "-" ? extractedVehicle.make : sourceVehicle.make,
    model: extractedVehicle.model !== "-" ? extractedVehicle.model : sourceVehicle.model,
    variant: extractedVehicle.variant !== "-" ? extractedVehicle.variant : sourceVehicle.variant,
    manufacturingYear: extractedVehicle.manufacturingYear !== "-" ? extractedVehicle.manufacturingYear : sourceVehicle.manufacturingYear,
    colour: extractedVehicle.colour !== "-" ? extractedVehicle.colour : sourceVehicle.colour,
    cubicCapacity: extractedVehicle.cubicCapacity !== "-" ? extractedVehicle.cubicCapacity : sourceVehicle.cubicCapacity,
    seatingCapacity: extractedVehicle.seatingCapacity !== "-" ? extractedVehicle.seatingCapacity : sourceVehicle.seatingCapacity,
    geographicalArea: extractedVehicle.geographicalArea !== "-" ? extractedVehicle.geographicalArea : sourceVehicle.geographicalArea,
    financierName: extractedVehicle.financierName !== "-" ? extractedVehicle.financierName : sourceVehicle.financierName,
    gvw: extractedVehicle.gvw !== "-" ? extractedVehicle.gvw : sourceVehicle.gvw,
  };

  return (
    <PolicyCardView
      item={item}
      policyNumber={policyNumber}
      insuranceCompany={insuranceCompany}
      branchAddress={branchAddress}
      productType={productType}
      vehicleCategory={vehicleCategory}
      insuredName={insuredDetails.insuredName}
      insuredAddress={insuredDetails.insuredAddress}
      panNumber={insuredDetails.panNumber}
      contactNumber={insuredDetails.contactNumber}
      email={insuredDetails.email}
      gstin={insuredDetails.gstin}
      policyDates={policyDates}          // ✅ FIXED: pass the whole object
      dateOfIssue={dateOfIssue}
      totalValue={totalValue}
      previousInsurer={previousInsurer}
      previousPolicyNumber={previousPolicyNumber}
      currentNCB={currentNCB}
      finalPremium={premiumData}
      vehicle={vehicle}
      extractedVehicle={extractedVehicle}
    />
  );
}

export default LibertyPolicyCard;
