// src/components/TATAAIGPolicyCard.jsx

import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

// ============================================================
// TEXT NORMALIZATION
// ============================================================
const normalizeText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ");
};

// ============================================================
// SHARED FORMATTING HELPERS
// ============================================================
const removeHyphens = (val) => (val && val !== "-" ? String(val).replace(/-/g, "") : "-");

const formatEngineNumber = (engine) => {
  if (!engine) return "-";

  return String(engine)
    .replace(/\r|\n/g, " ")
    .replace(/\s+/g, "")
    .replace(/MAKE|MODEL|VARIANT$/gi, "")
    .replace(/[^A-Z0-9./-]/gi, "") // Keep . / -
    .toUpperCase()
    .trim() || "-";
};

const formatChassisNumber = (chassis) => {
  if (!chassis) return "-";
  return String(chassis).replace(/[^A-Z0-9~]/gi, "").toUpperCase().trim() || "-";
};

const formatGenericField = (value, stopWords = []) => {
  if (!value) return "-";
  let formatted = String(value);
  for (const word of stopWords) {
    const regex = new RegExp(`\\s*${word.source || word}\\s*.*$`, "i");
    formatted = formatted.replace(regex, "");
  }
  return formatted.trim() || "-";
};

const formatModelName = (model) => {
  const cleaned = formatGenericField(model, [
    /Registration\s*no\.?/i,
    /Variant/i,
    /Colour/i,
    /Year/i,
    /Type of body/i,
    /Gross Vehicle Weight/i,
    /GVW/i,
    /Fuel\s*Type/i,
    /Engine\s*Number/i,
    /Engine/i,
    /Fuel/i,
    /Make/i,
    /Model/i,
  ]);
  return removeHyphens(cleaned);
};

const formatVariantName = (variant) =>
  formatGenericField(variant, [
    /Gvw/i,
    /GVW/i,
    /Year of manufacture/i,
    /Type of body/i,
    /Colour/i,
    /Registration/i,
    /Fuel\s*Type/i,
    /Engine\s*Number/i,
    /Engine/i,
    /Fuel/i,
    /Make/i,
    /Model/i,
    /Variant/i,
  ]);

const formatFuelType = (fuel) => formatGenericField(fuel, [/Cubic/i, /cc/i]);

const formatFinancierName = (financier) => {
  if (!financier) return "-";
  let name = String(financier)
    .replace(/Cover Note No.*$/i, "")
    .replace(/[\/:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (name.length > 50) {
    const shortMatch = name.match(/([A-Z]{3,}\s+(?:FINANCE|BANK)\s+[A-Z]{3,})/i);
    if (shortMatch) return shortMatch[1].toUpperCase();
  }
  return name.toUpperCase() || "-";
};

// ============================================================
// EXTRACTION FUNCTIONS (UNIVERSAL FOR TATA AIG)
// ============================================================

// ---- Insured Details ----
const extractInsuredDetails = (fullText = "") => {
  const result = {
    insuredName: "-",
    insuredAddress: "-",
    panNumber: "-",
    contactNumber: "-",
    email: "-",
    gstin: "-",
  };
  if (!fullText) return result;
  const txt = normalizeText(fullText);

  const nameMatch = txt.match(/Name\s+(.+?)(?=\s+Address|$)/i);
  if (nameMatch) result.insuredName = nameMatch[1].trim();

  const addressMatch = txt.match(/Address\s+([\s\S]*?)\s+Contact\s*No\./i);
  if (addressMatch) {
    result.insuredAddress = addressMatch[1].replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  }

  const contactMatch = txt.match(/Contact\s*No\.?\s*([0-9*+\-\s]{8,20})/i);
  if (contactMatch) result.contactNumber = contactMatch[1].replace(/\s+/g, "").trim();

  const emailMatch = txt.match(/Email\s*ID\s*([^\s]+@[^\s]+)/i);
  if (emailMatch) result.email = emailMatch[1].trim();

  const gstinMatch = txt.match(/Insured\/Lessor\s*GSTIN\s*([A-Z0-9]+)/i) || txt.match(/GSTIN\s*([A-Z0-9]+)/i);
  if (gstinMatch) result.gstin = gstinMatch[1].trim();

  const panMatch = txt.match(/PAN\s*No\.?\s*[:]?\s*([A-Z0-9]+)/i);
  if (panMatch) result.panNumber = panMatch[1].trim();

  return result;
};

// ---- Policy Dates ----
const extractPolicyDates = (text = "") => {
  const result = { startDate: "-", odExpireDate: "-", tpStartDate: "-", tpExpireDate: "-" };
  if (!text) return result;
  const txt = normalizeText(text);

  // General Policy Period
  const generalPeriod = txt.match(
    /Period\s*of\s*Insurance\s*(\d{2}\/\d{2}\/\d{4})\s*[\d:]+?\s*(?:Hours)?\s*To\s*(\d{2}\/\d{2}\/\d{4})\s*(?:Midnight|Hours)?/i
  );
  if (generalPeriod) {
    result.startDate = generalPeriod[1];
    result.odExpireDate = generalPeriod[2];
    result.tpStartDate = generalPeriod[1];
    result.tpExpireDate = generalPeriod[2];
    return result;
  }

  // Segmented (Private / Package)
  const odMatch = txt.match(/Own\s*Damage\s*Cover\s*(\d{2}\/\d{2}\/\d{4}).*?(\d{2}\/\d{2}\/\d{4})/is);
  if (odMatch) {
    result.startDate = odMatch[1];
    result.odExpireDate = odMatch[2];
  }

  const tpCoverMatch = txt.match(/Third[- ]?Party\s*Cover\s*(\d{2}\/\d{2}\/\d{4}).*?(\d{2}\/\d{2}\/\d{4})/is);
  if (tpCoverMatch) {
    result.tpStartDate = tpCoverMatch[1];
    result.tpExpireDate = tpCoverMatch[2];
  } else {
    const tpSection = txt.match(
      /Motor\s*Third[- ]?Party\s*\(TP\)\s*Policy\s*Details[\s\S]*?(?=Drivers\s*Clause|Limitations\s*as\s*to\s*use|$)/i
    );
    if (tpSection) {
      const dates = tpSection[0].match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})/);
      if (dates) {
        result.tpStartDate = dates[1];
        result.tpExpireDate = dates[2];
      }
    }
  }

  // Fallbacks
  if (result.startDate === "-" || result.odExpireDate === "-") {
    const fallback = txt.match(/OD\s*Cover\s*Period\s*:\s*(\d{2}\/\d{2}\/\d{4}).*?to\s*(\d{2}\/\d{2}\/\d{4})/is);
    if (fallback) {
      result.startDate = fallback[1];
      result.odExpireDate = fallback[2];
    }
  }
  if (result.tpStartDate === "-" || result.tpExpireDate === "-") {
    const fallback = txt.match(/TP\s*Cover\s*Period\s*:\s*(\d{2}\/\d{2}\/\d{4}).*?to\s*(\d{2}\/\d{2}\/\d{4})/is);
    if (fallback) {
      result.tpStartDate = fallback[1];
      result.tpExpireDate = fallback[2];
    }
  }
  return result;
};

// ---- Date of Issue ----
const extractDateOfIssue = (text = "") => {
  let match = text.match(/Receipt\s*Date\s*([\d\/]+)/i);
  if (match) return match[1].trim();
  match = text.match(/Date\s*of\s*Issue\s*[:]?\s*([\d\/]+)/i);
  return match ? match[1].trim() : "-";
};

// ---- IDV ----
const extractIDV = (text = "") => {
  if (!text) return "-";
  const txt = normalizeText(text);
  const rowMatch = txt.match(/1(?:\s+[\d,]+){5,}\s+([\d,]+)/);
  if (rowMatch) return rowMatch[1].replace(/,/g, "");
  const totalMatch = txt.match(/Total\s*IDV[^0-9]*([\d,]+)/i);
  return totalMatch ? totalMatch[1].replace(/,/g, "") : "-";
};

// ---- Previous Policy Number ----
const extractPreviousPolicyNumber = (text = "") => {
  if (!text) return "-";

  const txt = String(text)
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ");

  const unavailableValues = new Set([
    "NA",
    "N/A",
    "N.A",
    "N.A.",
    "NIL",
    "NONE",
    "NOTAVAILABLE",
    "NOT-AVAILABLE",
  ]);

  const cleanPolicyNumber = (value) => {
    if (!value) return "-";

    const cleaned = String(value)
      .trim()
      .replace(/[.,;:]+$/, "")
      .toUpperCase();

    const normalized = cleaned.replace(/\s+/g, "");

    if (!normalized || unavailableValues.has(normalized)) {
      return "-";
    }

    return cleaned;
  };

  // ============================================================
  // 1. ISOLATE PREVIOUS INSURANCE DETAILS SECTION
  // ============================================================
  const previousInsuranceSectionMatch = txt.match(
    /Previous\s*Insurance\s*(?:Details|Particulars)\s*:?\s*([\s\S]*?)(?=Restriction\s*of\s*Cover|Discounts|Concessions|Extended\s*Covers|Add[- ]?On\s*Covers|$)/i
  );

  const previousInsuranceSection = previousInsuranceSectionMatch?.[1] || "";

  // ============================================================
  // 2. FIRST NUMBERED POLICY INSIDE PREVIOUS INSURANCE SECTION
  // Example: 1. Policy Number: 3001/O/388443013/00/000
  // ============================================================
  if (previousInsuranceSection) {
    const numberedPolicyMatch = previousInsuranceSection.match(
      /\b1\s*[.)]?\s*Policy\s*Number\s*\*?\s*[:：]?\s*([A-Z0-9][A-Z0-9./-]*)/i
    );

    if (numberedPolicyMatch?.[1]) {
      return cleanPolicyNumber(numberedPolicyMatch[1]);
    }

    // Fallback inside only the previous insurance section
    const sectionPolicyMatch = previousInsuranceSection.match(
      /Policy\s*Number\s*\*?\s*[:：]?\s*([A-Z0-9][A-Z0-9./-]*)/i
    );

    if (sectionPolicyMatch?.[1]) {
      return cleanPolicyNumber(sectionPolicyMatch[1]);
    }
  }

  // ============================================================
  // 3. OTHER PREVIOUS POLICY FORMATS
  // ============================================================
  const patterns = [
    // Previous Insurance Particulars*: Policy Number*: ...
    /Previous\s*Insurance\s*Particulars\s*\*?\s*[:：]?\s*Policy\s*Number\s*\*?\s*[:：]?\s*([A-Z0-9][A-Z0-9./-]*)/i,

    // Previous Policy Number: ...
    /Previous\s*Policy\s*Number\s*\*?\s*[:：]?\s*([A-Z0-9][A-Z0-9./-]*)/i,

    // Previous Policy: NA Accident
    /Previous\s*Policy\s*\*?\s*[:：]?\s*([A-Z0-9][A-Z0-9./-]*)/i,

    // 1. Policy Number: ...
    /\b1\s*[.)]?\s*Policy\s*Number\s*\*?\s*[:：]?\s*([A-Z0-9][A-Z0-9./-]*)/i,
  ];

  for (const pattern of patterns) {
    const match = txt.match(pattern);
    if (!match?.[1]) continue;
    return cleanPolicyNumber(match[1]);
  }

  return "-";
};

// ---- Previous Insurer ----
const extractPreviousInsurer = (text = "") => {
  if (!text) return "-";
  const txt = normalizeText(text);
  
  // Cleaned up stop pattern using a lookahead
  const stopPattern = /^(.*?)(?=\s+(?:NCB|Policy\s*Number|Date\s*of\s*Expiry|Type\s*of\s*Cover|Address\s*of\s*the\s*Insurer|Claim|Accident|Period\s*of\s*Insurance|Restriction\s*of\s*Cover|Add\s*on\s*Covers)|$)/i;

  // Extract section if it exists, otherwise default to empty string
  const section = txt.match(/(?:Previous\s*Insurance\s*(?:Details|Particulars)|Transcript\s*Of\s*Proposal)\s*([\s\S]*?)(?=Restriction\s*of\s*Cover|Add\s*on\s*Covers|$)/i)?.[1] || "";

  // Chain the matches in the exact priority order
  const match = section.match(/Name\s*of\s*the\s*Insurer\s*\*?\s*[:：]?\s*([^\n]+)/i) ||
                section.match(/Previous\s*Insurer\s*[:]?\s*(.*?)(?=\s*\d+\.\s*Policy\s*Number|\n|$)/i) ||
                txt.match(/Previous\s*Insurer\s*[:]?\s*(.*?)(?=\s*Policy\s*Number|$)/i) ||
                txt.match(/Name\s*of\s*the\s*Insurer\s*\*?\s*[:：]?\s*([^\n]+)/i);

  // If a match is found in any of the above, clean it up
  if (match?.[1]) {
    const raw = match[1].trim();
    const cleanMatch = raw.match(stopPattern);
    const name = cleanMatch ? cleanMatch[1].trim() : raw;
    
    return name.replace(/\s+\d+\..*$/, "").trim() || "-";
  }

  return "-";
};

// ---- Premium Data ----
const extractPremiumData = (text = "") => {
  const defaultResult = {
    calculatedOdPremium: "0",
    calculatedTpPremium: "0",
    totalOdPremium: "0",
    totalTpPremium: "0",
    netPremium: "0",
    gst: "0",
    totalPayable: "0",
  };
  if (!text) return defaultResult;
  const txt = normalizeText(text);
  const premiumSection = txt.match(
    /Schedule\s*of\s*Premium\s*([\s\S]*?)(?=Drivers Clause|Limitations as to Use|Limitation as to use|Grievance Redressal|Receipt|$)/i
  );
  if (!premiumSection) return defaultResult;
  const pText = premiumSection[1];

  // OD Net Own damage Premium
  const baseODMatch =
    pText.match(/Basic\s*Own\s*Damage\s*Premium[^0-9]*([\d,.]+)/i) ||
    pText.match(/Own\s*Damage\s*Premium\s*on\s*Vehicle\s*and\s*Accessories[\s\S]{0,50}?([\d,.]+)/i);

  // ---------- TOTAL OD PREMIUM (Summation Logic) ----------
  let totalOdPremium = "0";
  const netOdMatch = pText.match(/Net\s*Own\s*Damage\s*Premium\s*\(A\+C\)[^0-9]*([\d,.]+)/i);

  if (netOdMatch) {
    totalOdPremium = netOdMatch[1].replace(/,/g, "");
  } else {
    // Look for A, C (or B), and D individually
    const matchA = pText.match(/Total\s*Own\s*Damage\s*Premium\s*\(A\)[^0-9]*([\d,.]+)/i);
    
    if (matchA) {
      let sum = parseFloat(matchA[1].replace(/,/g, ""));
      
      // Matches "Total Add on Premium (C)" or "(B)"
      const matchC = pText.match(/Total\s*Add\s*on\s*Premium\s*(?:\(C\)|\(B\))?[^0-9]*([\d,.]+)/i);
      if (matchC) {
        sum += parseFloat(matchC[1].replace(/,/g, ""));
      }

      // Matches "Total Others (D)"
      const matchD = pText.match(/Total\s*Others\s*\(D\)[^0-9]*([\d,.]+)/i);     
      
      if (matchD) {
        sum += parseFloat(matchD[1].replace(/,/g, ""));
      }

       const matchE = pText.match(/Total\s*Others\s*\(C\)[^0-9]*([\d,.]+)/i);     
      
      if (matchE) {
        sum += parseFloat(matchE[1].replace(/,/g, ""));
      }

      // Keep 2 decimal places if it's a float, otherwise return standard number
      totalOdPremium = Number.isInteger(sum) ? String(sum) : sum.toFixed(2);
    }
  }

  // TP
  let totalTpPremium = "0";
  const totalLiabilityMatch =
    pText.match(/TOTAL\s*LIABILITY\s*PREMIUM[^0-9]*([\d,.]+)/i) ||
    pText.match(/Total\s*Liability\s*Premium\s*\(B\)[^0-9]*([\d,.]+)/i);
  if (totalLiabilityMatch) {
    totalTpPremium = totalLiabilityMatch[1].replace(/,/g, "");
  } else {
    const basicTPMatch =
      pText.match(/Basic\s*TP\s*Premium[^0-9]*([\d,.]+)/i) ||
      pText.match(/Third[- ]Party\s*Premium[^0-9]*([\d,.]+)/i);
    if (basicTPMatch) totalTpPremium = basicTPMatch[1].replace(/,/g, "");
  }

  // Net Premium
  let netPremium = "0";
  const netMatch =
    pText.match(/Net\s*Premium\s*\(A\+B\+C\+D\+E\)[^0-9]*([\d,.]+)/i) ||
    pText.match(/Net\s*Premium\s*\(A\+B\+C\+D\)[^0-9]*([\d,.]+)/i) ||
    pText.match(/Net\s*Premium\s*\(A\+B\+C\)[^0-9]*([\d,.]+)/i) ||
    pText.match(/Net\s*Premium[^0-9]*([\d,.]+)/i);
  if (netMatch) netPremium = netMatch[1].replace(/,/g, "");

  // Total Payable
  const totalPayableMatch =
    pText.match(/Total\s*Policy\s*Premium[^0-9]*([\d,.]+)/i) ||
    pText.match(/Total\s*Premium[^0-9]*([\d,.]+)/i);
  const totalPayable = totalPayableMatch ? totalPayableMatch[1].replace(/,/g, "") : "0";

  // GST (multiple methods)
  let gst = "0";
  if (netPremium !== "0" && totalPayable !== "0") {
    const net = parseFloat(netPremium);
    const total = parseFloat(totalPayable);
    if (total > net) gst = String(Math.round(total - net));
  }
  if (gst === "0") {
    const sgstMatch = pText.match(/SGST\s*₹?\s*([\d,.]+)\s*CGST\s*₹?\s*([\d,.]+)/is);
    if (sgstMatch) {
      const sgst = parseFloat(sgstMatch[1].replace(/,/g, ""));
      const cgst = parseFloat(sgstMatch[2].replace(/,/g, ""));
      gst = String(Math.round(sgst + cgst));
    }
  }
  if (gst === "0") {
    const igstMatch = pText.match(/IGST\s*@?\s*\d+%?[^0-9]*([\d,.]+)/i);
    if (igstMatch) gst = String(Math.round(parseFloat(igstMatch[1].replace(/,/g, ""))));
  }

  // Calculated TP
  let calculatedTpPremium = totalTpPremium;
  const basicTPMatch = pText.match(/Basic\s*TP\s*Premium[^0-9]*([\d,.]+)/i);
  if (basicTPMatch) calculatedTpPremium = basicTPMatch[1].replace(/,/g, "");

  return {
    calculatedOdPremium: baseODMatch ? baseODMatch[1].replace(/,/g, "") : "0",
    calculatedTpPremium,
    totalOdPremium, 
    totalTpPremium,
    netPremium,
    gst,
    totalPayable,
  };
};

// ---- Vehicle Details ----
const extractVehicleDetailsFromText = (text = "") => {
  const result = {
    registrationNumber: "-",
    chassisNumber: "-",
    engineNumber: "-",
    make: "-",
    model: "-",
    variant: "-",
    gvw: "-",
    manufacturingYear: "-",
    fuelType: "-",
    cubicCapacity: "-",
    seatingCapacity: "-",
    financierName: "-",
    ncb: "-",
  };
  if (!text) return result;
  const txt = normalizeText(text);

  // General block isolation
  // FIX: Added capture group ([\s\S]*?) to the first regex so sectionMatch[1] is always valid
  const sectionMatch = 
    txt.match(/Vehicle\s*Details\s*[-–]?\s*Accurate\s*Vehicle\s*Details([\s\S]*?)(?=Zone\s*Details|Battery\s*Details|Agent|Insured\s*Declared\s*Value|Schedule\s*of\s*Premium|$)/i) ||
    txt.match(/Vehicle\s*Details\s*:?\s*([\s\S]*?)(?=Public\s*Carrier|Private\s*Carrier|RTO\s*Location|Zone|Geographical\s*Area|Battery\s*Details|Agent|Insured\s*Declared\s*Value|Schedule\s*of\s*Premium|$)/i);
  
  // FIX: Safe assignment to guarantee `section` is a string, never undefined
  const section = sectionMatch?.[1] || sectionMatch?.[0] || "";
  const searchText = section || txt;

  // ---------- REGISTRATION NUMBER ----------
  let regMatch = searchText.match(/Registration\s*No\.?\s*([A-Z0-9\s\-]+?)(?=\s+(?:MAKE|MODEL|ENGINE|CHASSIS|FUEL|CC|YEAR|MFG|BODY|SEATING|HIRE|ZONE|RTO|$))/i);
  if (regMatch) {
    result.registrationNumber = regMatch[1].replace(/\s+/g, "").toUpperCase();
  }

  // ---------- FUEL TYPE ----------
  // FIX: Because section is safely a string now, section.match() will not crash
  let fuelMatch = section.match(/Fuel\s*Type\s*[:：]?\s*([A-Za-z0-9\-]+)/i) || 
                  txt.match(/Fuel\s*Type\s*[:：]?\s*([A-Za-z0-9\-]+)/i) ||
                  txt.match(/Fuel\s*[:：]?\s*([A-Za-z0-9\-]+)/i);

  if (fuelMatch && fuelMatch[1]) {
    result.fuelType = formatFuelType(fuelMatch[1]).toUpperCase();
  }

  // ---------- MAKE / MODEL / VARIANT ----------
  const mmvMatch = searchText.match(/Make\s*\/\s*Model\s*\/\s*(?:Variant|Body\s*Type\s*\/\s*Segment)\s*:?\s*([^\n]+)/i);
  if (mmvMatch) {
    const cleanMmv = mmvMatch[1]
      .replace(/C\s+AMPER/gi, "CAMPER")
      .replace(/\s{2,}/g, " ");
        
    const parts = cleanMmv.split("/").map(v => v.trim()).filter(Boolean);
    
    result.make = parts[0] || "-";
    if (parts[1]) result.model = formatModelName(parts[1]);
    if (parts[2]) result.variant = formatVariantName(parts[2]);
  }

  // ---------- ENGINE & CHASSIS ----------
  const engineRegex = /Engine\s*(?:No\.?|Number)?\s*\/?\s*Motor\s*No\.?\s*(?:\(for\s*EV\))?\s*[:\-]?\s*([A-Z0-9][A-Z0-9./-]*)/i;

  const engineMatch = searchText.match(engineRegex) || txt.match(engineRegex);

  if (engineMatch) {
    result.engineNumber = formatEngineNumber(engineMatch[1]);
  }

  const chassisMatch = searchText.match(/Chassis\s*No\.?\s*([A-Z0-9]+)/i) || txt.match(/Chassis\s*No\.?\s*([A-Z0-9]+)/i);
  if (chassisMatch) result.chassisNumber = formatChassisNumber(chassisMatch[1]);

  // ---------- OTHER FIELDS ----------
  const ccMatch = searchText.match(/CC\/KW\s*(\d+)/i) || txt.match(/CC\/KW\s*(\d+)/i);
  if (ccMatch) result.cubicCapacity = `${ccMatch[1]} cc`;

  const yearMatch = searchText.match(/Mfg\.\s*Year\s*(\d{4})/i) || txt.match(/Mfg\.\s*Year\s*(\d{4})/i);
  if (yearMatch) result.manufacturingYear = yearMatch[1];

  const seatMatch = searchText.match(/Seating\s*Capacity\s*\(Including\s*Driver\)\s*(\d+)/i) ||
                    searchText.match(/Licensed\s*Carrying\s*Capacity\s*Including\s*Driver\s*(\d+)/i) ||
                    txt.match(/Licensed\s*Carrying\s*Capacity\s*Including\s*Driver\s*(\d+)/i);
  if (seatMatch) result.seatingCapacity = seatMatch[1];

  const gvwMatch = searchText.match(/GVW\s*(\d+)/i) || txt.match(/GVW\s*(\d+)/i);
  if (gvwMatch) result.gvw = gvwMatch[1].trim();

  // ---------- FINANCIER ----------
  const finMatch = searchText.match(
    /(?:Hire\s*Purchase\s*\/\s*)?Hypothecation\s*\/\s*Lease\s*with\s*:?\s*([\s\S]{1,100}?)(?=\n|Seating|Licensed|Zone|RTO|CC|Fuel|Engine|Chassis|Contract|Loan|$)/i
  );

  if (finMatch) {
    let rawFinancier = finMatch[1]
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const isNullValue = /^(NA|N\/A|N\.A\.|NIL|NONE|-)$/i.test(rawFinancier);

    if (rawFinancier && !isNullValue) {
      result.financierName = formatFinancierName(rawFinancier);
    } else {
      result.financierName = "-";
    }
  }

  // ---------- NCB ----------
  const ncbMatch = text.match(/No\s+Claim\s+Bonus[\s:\-(]*(\d+%)/i);
  
  if (ncbMatch) {
    result.ncb = ncbMatch[1];
  }
  
  return result;
};

// ---- Insurance Company ----
const extractInsuranceCompanyName = (fullText = "") => {
  if (!fullText) return "-";
  const match = fullText.match(/Thank you for choosing\s*([A-Z\s]+)\s+as your Insurer!/i);
  if (match) return match[1].trim();
  return fullText.match(/TATA AIG General Insurance Company Limited/i) ? "TATA AIG General Insurance Company Limited" : "-";
};

// ---- Branch Address ----
const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "-";
  const match = fullText.match(/Policy\s*Servicing\s*O.*?ce\s*:\s*(.+?\b\d{6}\b|[^\n]*)/i);
  return match ? match[1].trim().replace(/\s+/g, " ") || "-" : "-";
};

// ============================================================
// MAIN COMPONENT
// ============================================================
function TATAAIGPolicyCard({ item }) {
  const fullText = item?.fullText || item?.text || item?.content || "";
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};

  const autoInsured = extractInsuredDetails(fullText);
  const policyDates = extractPolicyDates(fullText);
  const extractedVehicle = extractVehicleDetailsFromText(fullText);
  const autoPremium = extractPremiumData(fullText);

  const vehicleCategory = getVehicleCategory(policy?.policyType, fullText);
  const productType = getProductType(policy?.policyType, fullText);

  const finalPremium = {
    calculatedOdPremium: premium?.calculatedOdPremium || autoPremium.calculatedOdPremium,
    calculatedTpPremium: premium?.calculatedTpPremium || autoPremium.calculatedTpPremium,
    totalOdPremium: premium?.totalOdPremium || autoPremium.totalOdPremium,
    totalTpPremium: premium?.totalTpPremium || autoPremium.totalTpPremium,
    netPremium: premium?.netPremium || autoPremium.netPremium,
    gst: premium?.gst || autoPremium.gst,
    totalPayable: premium?.totalPayable || autoPremium.totalPayable,
  };

  const policyNumber =
    policy?.policyNumber ||
    fullText.match(/Policy\s*No\.\s*([\d\s]+)/i)?.[1]?.replace(/\s+/g, "") ||
    "-";

  return (
    <PolicyCardView
      item={item}
      policyNumber={policyNumber}
      insuranceCompany={extractInsuranceCompanyName(fullText)}
      branchAddress={extractBranchAddress(fullText)}
      productType={productType}
      vehicleCategory={vehicleCategory}
      insuredName={insured?.insuredName || autoInsured.insuredName}
      panNumber={insured?.panNumber || autoInsured.panNumber}
      gstin={autoInsured.gstin}
      contactNumber={insured?.contactNumber || autoInsured.contactNumber}
      email={insured?.email || autoInsured.email}
      insuredAddress={insured?.insuredAddress || autoInsured.insuredAddress}
      policyDates={{
        startDate: policyDates.startDate,
        odExpireDate: policyDates.odExpireDate,
        tpStartDate: policyDates.tpStartDate,
        tpExpireDate: policyDates.tpExpireDate,
      }}
      dateOfIssue={extractDateOfIssue(fullText)}
      totalValue={extractIDV(fullText)}
      previousInsurer={extractPreviousInsurer(fullText)}
      previousPolicyNumber={extractPreviousPolicyNumber(fullText)}
      finalPremium={finalPremium}
      vehicle={vehicle}
      extractedVehicle={extractedVehicle}
    />
  );
}

export default TATAAIGPolicyCard;