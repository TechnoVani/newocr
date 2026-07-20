// src/components/TATAAIGPolicyCard.jsx

import { useState } from "react";
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
    .replace(/\s+/g, "")
    .replace(/MAKE|MODEL|VARIANT$/gi, "")
    .replace(/[^A-Z0-9]/gi, "")
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

const formatBodyType = (body) =>
  formatGenericField(body, [
    /Gross Vehicle Weight/i,
    /GVW/i,
    /Type of fuel/i,
    /Year/i,
    /Colour/i,
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
// EXTRACTION FUNCTIONS (TAILORED FOR TATA AIG)
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

  // Commercial policy: single period
  const commercialPeriod = txt.match(
    /Period\s*of\s*Insurance\s*(\d{2}\/\d{2}\/\d{4})\s*[\d:]+?\s*(?:Hours)?\s*To\s*(\d{2}\/\d{2}\/\d{4})\s*(?:Midnight|Hours)?/i
  );
  if (commercialPeriod) {
    result.startDate = commercialPeriod[1];
    result.odExpireDate = commercialPeriod[2];
    result.tpStartDate = commercialPeriod[1];
    result.tpExpireDate = commercialPeriod[2];
    return result;
  }

  // Private / Package
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

  // Fallback
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
  const txt = normalizeText(text);
  const isCommercial = /Commercial\s*Vehicle|Goods\s*Carrying|Public\s*Carrier|Private\s*Carrier|CV\s*Policy|Goods\s*Carriage|Tipper|Pick\s*Up|Van/i.test(
    txt
  );
  if (isCommercial) {
    const match = txt.match(/Policy\s*Number\s*\*?\s*[:：]\s*([A-Z0-9/]+)/i);
    return match ? match[1].trim() : "-";
  }
  const prevSection = txt.match(/Previous Insurance Details\s*([\s\S]*?)(?=Restriction of Cover|Transcript Of Proposal|$)/i);
  if (prevSection) {
    const match = prevSection[1].match(/Policy\s*Number\s*[:]?\s*([0-9]+)/i);
    if (match) return match[1].trim();
  }
  const fallback = txt.match(/Previous\s*Policy\s*Number\s*[:]?\s*([0-9]+)/i);
  return fallback ? fallback[1].trim() : "-";
};

// ---- Previous Insurer ----
const extractPreviousInsurer = (text = "") => {
  if (!text) return "-";
  const txt = normalizeText(text);
  const isCommercial = /Commercial\s*Vehicle|Goods\s*Carrying|Public\s*Carrier|Private\s*Carrier|CV\s*Policy|Goods\s*Carriage|Tipper|Pick\s*Up|Van/i.test(
    txt
  );
  const stopPattern = /\s+(?:NCB|Policy\s*Number|Date\s*of\s*Expiry|Type\s*of\s*Cover|Address\s*of\s*the\s*Insurer|Claim|Accident|Period\s*of\s*Insurance|Restriction\s*of\s*Cover|Add\s*on\s*Covers|$)/i;
  let name = "-";

  if (isCommercial) {
    const section = txt.match(
      /(?:Previous\s*Insurance\s*(?:Details|Particulars)|Transcript\s*Of\s*Proposal)\s*([\s\S]*?)(?=Restriction\s*of\s*Cover|Add\s*on\s*Covers|$)/i
    );
    if (section) {
      const match = section[1].match(/Name\s*of\s*the\s*Insurer\s*\*?\s*[:：]\s*([^\n]+)/i);
      if (match) {
        let raw = match[1].trim();
        const cleanMatch = raw.match(new RegExp(`^(.*?)${stopPattern.source}`));
        name = cleanMatch ? cleanMatch[1].trim() : raw;
      }
    }
    if (name === "-") {
      const fallback = txt.match(/Name\s*of\s*the\s*Insurer\s*\*?\s*[:：]\s*([^\n]+)/i);
      if (fallback) {
        let raw = fallback[1].trim();
        const cleanMatch = raw.match(new RegExp(`^(.*?)${stopPattern.source}`));
        name = cleanMatch ? cleanMatch[1].trim() : raw;
      }
    }
  } else {
    const prevSection = txt.match(/Previous Insurance Details\s*([\s\S]*?)(?=Restriction of Cover|Transcript Of Proposal|$)/i);
    if (prevSection) {
      const match = prevSection[1].match(/Name\s*of\s*the\s*Insurer\s*[:]?\s*(.*?)(?=\s*\d+\.\s*Policy\s*Number|\n|$)/i);
      if (match) {
        let raw = match[1].trim();
        const cleanMatch = raw.match(new RegExp(`^(.*?)${stopPattern.source}`));
        name = cleanMatch ? cleanMatch[1].trim() : raw;
      }
    }
    if (name === "-") {
      const fallback = txt.match(/Previous\s*Insurer\s*[:]?\s*(.*?)(?=\s*Policy\s*Number|$)/i);
      if (fallback) {
        let raw = fallback[1].trim();
        const cleanMatch = raw.match(new RegExp(`^(.*?)${stopPattern.source}`));
        name = cleanMatch ? cleanMatch[1].trim() : raw;
      }
    }
  }
  return name.replace(/\s+\d+\..*$/, "").trim() || "-";
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

  // OD
  const baseODMatch =
    pText.match(/Basic\s*Own\s*Damage\s*Premium[^0-9]*([\d,.]+)/i) ||
    pText.match(/Own\s*Damage\s*Premium\s*on\s*Vehicle\s*and\s*Accessories[\s\S]{0,50}?([\d,.]+)/i);
  const totalODMatch =
    pText.match(/Total\s*Own\s*Damage\s*Premium\s*\(A\)[^0-9]*([\d,.]+)/i) ||
    pText.match(/Net\s*Own\s*Damage\s*Premium\s*\(A\+C\)[^0-9]*([\d,.]+)/i);

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
    totalOdPremium: totalODMatch ? totalODMatch[1].replace(/,/g, "") : "0",
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
    bodyType: "-",
    fuelType: "-",
    colour: "-",
    cubicCapacity: "-",
    seatingCapacity: "-",
    financierName: "-",
    commercialVehicleType: "-",
    subType: "-",
  };
  if (!text) return result;
  const txt = normalizeText(text);
  const isCommercial = /Commercial Vehicle Package Policy|Goods Carrying Vehicle|Public Carrier|GVW/i.test(txt);

  // Extract the relevant vehicle details section
  let section = "";
  if (isCommercial) {
    const commercialSection =
      txt.match(/Vehicle\s*Details\s*:?\s*([\s\S]*?)(?=Public\s*Carrier|Private\s*Carrier|Insured\s*Declared\s*Value|Schedule\s*of\s*Premium|$)/i) ||
      txt.match(/Vehicle\s*Details\s*:?\s*([\s\S]*?)(?=RTO\s*Location|Zone|Geographical\s*Area|$)/i);
    if (commercialSection) {
      section = commercialSection[1];
    }
  } else {
    const privateSection = txt.match(
      /Vehicle\s*Details\s*[-–]\s*Accurate\s*Vehicle\s*Details,\s*Custom\s*Insurance\s*([\s\S]*?)(?=Zone\s*Details|Battery\s*Details|Agent|Insured\s*Declared\s*Value|$)/i
    ) || txt.match(
      /Vehicle\s*Details\s*([\s\S]*?)(?=Zone\s*Details|Battery\s*Details|Agent|Insured\s*Declared\s*Value|Schedule\s*of\s*Premium|$)/i
    );
    if (privateSection) {
      section = privateSection[1];
    }
  }

  const searchText = section || txt;

  // ---------- REGISTRATION NUMBER ----------
  let regMatch = searchText.match(/Registration\s*No\.?\s*([A-Z0-9\s\-]+?)(?=\s+(?:MAKE|MODEL|ENGINE|CHASSIS|FUEL|CC|YEAR|MFG|BODY|SEATING|HIRE|ZONE|RTO|$))/i);
  if (regMatch) {
    result.registrationNumber = regMatch[1].replace(/\s+/g, "").toUpperCase();
  }

  // ---------- FUEL TYPE (IMPROVED FOR RELIABILITY) ----------
  let fuelMatch = null;

  // 1. Try in the vehicle section first
  if (section) {
    fuelMatch = section.match(/Fuel\s*Type\s*[:：]?\s*([A-Za-z0-9\-]+)/i);
  }

  // 2. If not found, search the entire normalized text
  if (!fuelMatch) {
    fuelMatch = txt.match(/Fuel\s*Type\s*[:：]?\s*([A-Za-z0-9\-]+)/i);
  }

  // 3. Final fallback: look for "Fuel:" alone
  if (!fuelMatch) {
    fuelMatch = txt.match(/Fuel\s*[:：]?\s*([A-Za-z0-9\-]+)/i);
  }

  if (fuelMatch && fuelMatch[1]) {
    const rawFuel = fuelMatch[1];
    const cleanedFuel = formatFuelType(rawFuel);
    const finalFuel = cleanedFuel.toUpperCase();
    result.fuelType = finalFuel;
  } else {
    result.fuelType = "-";
  }

  // ---------- OTHER FIELDS (unchanged) ----------
  // Make / Model / Variant
  if (isCommercial) {
    const mmv = searchText.match(/Make\s*\/\s*Model\s*\/\s*Body\s*Type\s*\/\s*Segment\s*([A-Z0-9\/\-\s]+)/i) ||
                txt.match(/Make\/Model\/Body\s*Type\/Segment\s*:?\s*([A-Z0-9\/\-\s]+)/i);
    if (mmv) {
      const parts = mmv[1].split("/").map(v => v.trim()).filter(Boolean);
      result.make = parts[0] || "-";
      result.model = parts[1] || "-";
      if (parts.length >= 5) {
        result.bodyType = parts.slice(2, parts.length - 1).join(" ");
        result.subType = parts[parts.length - 1];
      }
    }
  } else {
    const mmv = searchText.match(/Make\s*\/\s*Model\s*\/\s*Variant\s*([^\n]+)/i);
    if (mmv) {
      const parts = mmv[1].split("/").map(v => v.trim());
      result.make = parts[0] || "-";
      if (parts[1]) result.model = formatModelName(parts[1]);
      if (parts[2]) result.variant = formatVariantName(parts[2]);
    }
  }

  // Engine
  const engineMatch = searchText.match(/Engine\s*(?:No\.?|Number)\s*\/?\s*Motor\s*No\.?\s*(?:\(for EV\))?\s*([A-Z0-9]+)/i) ||
                      txt.match(/Engine\s*(?:No\.?|Number)\s*\/?\s*Motor\s*No\.?\s*(?:\(for EV\))?\s*([A-Z0-9]+)/i);
  if (engineMatch) result.engineNumber = formatEngineNumber(engineMatch[1]);

  // Chassis
  const chassisMatch = searchText.match(/Chassis\s*No\.?\s*([A-Z0-9]+)/i) || txt.match(/Chassis\s*No\.?\s*([A-Z0-9]+)/i);
  if (chassisMatch) result.chassisNumber = formatChassisNumber(chassisMatch[1]);

  // Body (private only)
  if (!isCommercial) {
    const bodyMatch = searchText.match(/Body\s*Type\s*(.*?)(?=\s*CC\/KW|\s*Mfg\.|\s*Date of|\s*Hire|\s*Seating|$)/i);
    if (bodyMatch) result.bodyType = formatBodyType(bodyMatch[1].trim());
  }

  // CC
  const ccMatch = searchText.match(/CC\/KW\s*(\d+)/i) || txt.match(/CC\/KW\s*(\d+)/i);
  if (ccMatch) result.cubicCapacity = `${ccMatch[1]} cc`;

  // Year
  const yearMatch = searchText.match(/Mfg\.\s*Year\s*(\d{4})/i) || txt.match(/Mfg\.\s*Year\s*(\d{4})/i);
  if (yearMatch) result.manufacturingYear = yearMatch[1];

  // Seating
  if (isCommercial) {
    const seatMatch = searchText.match(/Licensed\s*Carrying\s*Capacity\s*Including\s*Driver\s*(\d+)/i) ||
                      txt.match(/Licensed\s*Carrying\s*Capacity\s*Including\s*Driver\s*(\d+)/i);
    if (seatMatch) result.seatingCapacity = seatMatch[1];
  } else {
    const seatMatch = searchText.match(/Seating\s*Capacity\s*\(Including\s*Driver\)\s*(\d+)/i);
    if (seatMatch) result.seatingCapacity = seatMatch[1];
  }

  // GVW
  if (isCommercial) {
    const gvwMatch = searchText.match(/GVW\s*(\d+)/i) || txt.match(/GVW\s*(\d+)/i);
    if (gvwMatch) result.gvw = gvwMatch[1].trim();
  }

  // Commercial Vehicle Type
  if (isCommercial) {
    const cvType = txt.match(/Public\s*Carrier\s*\/\s*Private\s*Carrier\s*([^\n]+)/i);
    if (cvType) result.commercialVehicleType = cvType[1].replace(/\s+/g, " ").trim();
  }

  // Financier
  const finMatch = searchText.match(/Hire\s*Purchase\s*\/\s*Hypothecation\s*\/\s*Lease\s*with\s*([\s\S]{0,100}?)(?=Seating|Licensed|Zone|RTO|$)/i);
  if (finMatch) {
    const financier = finMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    if (financier && !/^NA$/i.test(financier) && !/^N\/A$/i.test(financier)) {
      result.financierName = formatFinancierName(financier);
    }
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

  const vehicleCategory = getVehicleCategory(policy?.policyType, vehicle?.bodyType, fullText);
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
    fullText.match(/Policy\s*No\.\s*([\d\s]+)/i)?.[1]?.trim() ||
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