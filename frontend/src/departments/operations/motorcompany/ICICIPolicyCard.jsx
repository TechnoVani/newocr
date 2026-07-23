// src/components/TATAAIGPolicyCard.jsx

import { useState } from "react";
import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

// =======================================
// UTILITY FUNCTIONS
// =======================================

const normalizeText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ");
};

const formatFinancierName = (financier) => {
  if (!financier) return "";
  let name = String(financier).trim();
  if (name === "-" || name === "" || name === "N/A" || name === "NA" || name === "null") return "";

  name = name
    .replace(/(Invoice No\.|Servicing Branch Address|Cover Note No|Policy No|Vehicle Registration|Make|Model|Chassis|Engine).*$/i, "")
    .replace(/[\/:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!name || name.length < 3) return "";
  const isValidFinancier = /(BANK|FINANCE|LTD|HDFC|ICICI|SBI|AXIS|KOTAK|INDUSIND|BAJAJ|TATA|CHOLAMANDALAM|MUTHOOT|MANAPPURAM)/i.test(name);
  if (!isValidFinancier) return "";

  if (name.length > 50) {
    const shortMatch = name.match(/([A-Z]{3,}\s+(?:FINANCE|BANK)\s+[A-Z]{3,})/i);
    if (shortMatch) return shortMatch[1].toUpperCase();
    const bankMatch = name.match(/([A-Z\s]+(?:BANK|FINANCE)\s+(?:LTD\.?|LIMITED)?)/i);
    if (bankMatch) return bankMatch[1].trim().toUpperCase();
  }
  return name.toUpperCase();
};

// =======================================
// EXTRACTION FUNCTIONS
// =======================================

const extractInsuranceCompanyName = (fullText = "") => {
  if (!fullText) return "";
  const match = fullText.match(/Thank you for choosing\s*([A-Z\s]+)\s+as your Insurer!/i);
  if (match) return match[1].trim();
  return fullText.match(/TATA AIG General Insurance Company Limited/i) ? "TATA AIG General Insurance Company Limited" : "";
};

const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "";
  const match = fullText.match(/Policy\s*Servicing\s*O.*?ce\s*:\s*(.+?\b\d{6}\b|[^\n]*)/i);
  return match ? match[1].trim().replace(/\s+/g, " ") || "" : "";
};

const extractInsuredDetails = (fullText = "") => {
  const result = { insuredName: "", insuredAddress: "", panNumber: "", contactNumber: "", email: "", gstin: "" };
  if (!fullText) return result;
  const txt = normalizeText(fullText);

  // Name
  const nameMatch = txt.match(/Name\s+(.+?)(?=\s+Address|$)/i);
  if (nameMatch) result.insuredName = nameMatch[1].trim();

  // Address
  const addressMatch = txt.match(/Address\s+([\s\S]*?)\s+Contact\s*No\./i);
  if (addressMatch) {
    result.insuredAddress = addressMatch[1].replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  }

  // Contact
  const contactMatch = txt.match(/Contact\s*No\.?\s*([0-9*+\-\s]{8,20})/i);
  if (contactMatch) result.contactNumber = contactMatch[1].replace(/\s+/g, "").trim();

  // Email
  const emailMatch = txt.match(/Email\s*ID\s*([^\s]+@[^\s]+)/i);
  if (emailMatch) result.email = emailMatch[1].trim();

  // GSTIN
  const gstinMatch = txt.match(/Insured\/Lessor\s*GSTIN\s*([A-Z0-9]+)/i) || txt.match(/GSTIN\s*([A-Z0-9]+)/i);
  if (gstinMatch) result.gstin = gstinMatch[1].trim();

  // PAN
  const panMatch = txt.match(/PAN\s*No\.?\s*[:]?\s*([A-Z0-9]+)/i);
  if (panMatch) result.panNumber = panMatch[1].trim();

  return result;
};

const extractPolicyDates = (fullText = "") => {
  const result = { startDate: "", odExpireDate: "", tpStartDate: "", tpExpireDate: "" };
  if (!fullText) return result;
  const txt = normalizeText(fullText);

  // Try commercial single period first
  let match = txt.match(
    /Period\s*of\s*Insurance\s*(\d{2}\/\d{2}\/\d{4})\s*[\d:]+?\s*(?:Hours)?\s*To\s*(\d{2}\/\d{2}\/\d{4})\s*(?:Midnight|Hours)?/i
  );
  if (match) {
    result.startDate = match[1];
    result.odExpireDate = match[2];
    result.tpStartDate = match[1];
    result.tpExpireDate = match[2];
    return result;
  }

  // Private / Package with separate OD and TP periods
  const odMatch = txt.match(/Own\s*Damage\s*Cover\s*(\d{2}\/\d{2}\/\d{4}).*?(\d{2}\/\d{2}\/\d{4})/is);
  if (odMatch) {
    result.startDate = odMatch[1];
    result.odExpireDate = odMatch[2];
  }

  const tpMatch = txt.match(/Third[- ]?Party\s*Cover\s*(\d{2}\/\d{2}\/\d{4}).*?(\d{2}\/\d{2}\/\d{4})/is);
  if (tpMatch) {
    result.tpStartDate = tpMatch[1];
    result.tpExpireDate = tpMatch[2];
  } else {
    // Fallback: look for two dates in TP section
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

  // Last resort: any two dates
  if (!result.startDate || !result.odExpireDate) {
    const fallback = txt.match(/(\d{2}\/\d{2}\/\d{4})\s+to\s+(\d{2}\/\d{2}\/\d{4})/i);
    if (fallback) {
      if (!result.startDate) result.startDate = fallback[1];
      if (!result.odExpireDate) result.odExpireDate = fallback[2];
      if (!result.tpStartDate) result.tpStartDate = fallback[1];
      if (!result.tpExpireDate) result.tpExpireDate = fallback[2];
    }
  }

  return result;
};

const extractDateOfIssue = (text = "") => {
  let match = text.match(/Receipt\s*Date\s*([\d\/]+)/i);
  if (match) return match[1].trim();
  match = text.match(/Date\s*of\s*Issue\s*[:]?\s*([\d\/]+)/i);
  return match ? match[1].trim() : "";
};

const extractIDV = (text = "") => {
  if (!text) return "";
  const txt = normalizeText(text);
  const rowMatch = txt.match(/1(?:\s+[\d,]+){5,}\s+([\d,]+)/);
  if (rowMatch) return rowMatch[1].replace(/,/g, "");
  const totalMatch = txt.match(/Total\s*IDV[^0-9]*([\d,]+)/i);
  return totalMatch ? totalMatch[1].replace(/,/g, "") : "";
};

const extractPreviousPolicyNumber = (text = "") => {
  if (!text) return "";
  const txt = normalizeText(text);
  // Commercial
  const isCommercial = /Commercial\s*Vehicle|Goods\s*Carrying|Public\s*Carrier|CV\s*Policy/i.test(txt);
  if (isCommercial) {
    const match = txt.match(/Policy\s*Number\s*\*?\s*[:：]\s*([A-Z0-9/]+)/i);
    return match ? match[1].trim() : "";
  }
  // Private
  const prevSection = txt.match(/Previous Insurance Details\s*([\s\S]*?)(?=Restriction of Cover|Transcript Of Proposal|$)/i);
  if (prevSection) {
    const match = prevSection[1].match(/Policy\s*Number\s*[:]?\s*([0-9]+)/i);
    if (match) return match[1].trim();
  }
  const fallback = txt.match(/Previous\s*Policy\s*Number\s*[:]?\s*([0-9]+)/i);
  return fallback ? fallback[1].trim() : "";
};

const extractPreviousInsurer = (text = "") => {
  if (!text) return "";
  const txt = normalizeText(text);
  const isCommercial = /Commercial\s*Vehicle|Goods\s*Carrying|Public\s*Carrier|CV\s*Policy/i.test(txt);
  const stopPattern = /\s+(?:NCB|Policy\s*Number|Date\s*of\s*Expiry|Type\s*of\s*Cover|Address\s*of\s*the\s*Insurer|Claim|Accident|Period\s*of\s*Insurance|Restriction\s*of\s*Cover|Add\s*on\s*Covers|$)/i;
  let name = "";

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
    if (!name) {
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
    if (!name) {
      const fallback = txt.match(/Previous\s*Insurer\s*[:]?\s*(.*?)(?=\s*Policy\s*Number|$)/i);
      if (fallback) {
        let raw = fallback[1].trim();
        const cleanMatch = raw.match(new RegExp(`^(.*?)${stopPattern.source}`));
        name = cleanMatch ? cleanMatch[1].trim() : raw;
      }
    }
  }
  return name.replace(/\s+\d+\..*$/, "").trim() || "";
};

const extractPremiumData = (text = "") => {
  const result = {
    calculatedOdPremium: "",
    calculatedTpPremium: "",
    totalOdPremium: "",
    totalTpPremium: "",
    netPremium: "",
    gst: "",
    totalPayable: "",
  };
  if (!text) return result;
  const txt = normalizeText(text);
  const premiumSection = txt.match(
    /Schedule\s*of\s*Premium\s*([\s\S]*?)(?=Drivers Clause|Limitations as to Use|Limitation as to use|Grievance Redressal|Receipt|$)/i
  );
  if (!premiumSection) return result;
  const pText = premiumSection[1];

  // OD
  const baseODMatch =
    pText.match(/Basic\s*Own\s*Damage\s*Premium[^0-9]*([\d,.]+)/i) ||
    pText.match(/Own\s*Damage\s*Premium\s*on\s*Vehicle\s*and\s*Accessories[\s\S]{0,50}?([\d,.]+)/i);
  if (baseODMatch) result.calculatedOdPremium = baseODMatch[1].replace(/,/g, "");

  const totalODMatch =
    pText.match(/Total\s*Own\s*Damage\s*Premium\s*\(A\)[^0-9]*([\d,.]+)/i) ||
    pText.match(/Net\s*Own\s*Damage\s*Premium\s*\(A\+C\)[^0-9]*([\d,.]+)/i);
  if (totalODMatch) result.totalOdPremium = totalODMatch[1].replace(/,/g, "");

  // TP
  const totalLiabilityMatch =
    pText.match(/TOTAL\s*LIABILITY\s*PREMIUM[^0-9]*([\d,.]+)/i) ||
    pText.match(/Total\s*Liability\s*Premium\s*\(B\)[^0-9]*([\d,.]+)/i);
  if (totalLiabilityMatch) {
    result.totalTpPremium = totalLiabilityMatch[1].replace(/,/g, "");
  } else {
    const basicTPMatch =
      pText.match(/Basic\s*TP\s*Premium[^0-9]*([\d,.]+)/i) ||
      pText.match(/Third[- ]Party\s*Premium[^0-9]*([\d,.]+)/i);
    if (basicTPMatch) {
      result.calculatedTpPremium = basicTPMatch[1].replace(/,/g, "");
      result.totalTpPremium = result.calculatedTpPremium;
    }
  }

  // Net Premium
  const netMatch =
    pText.match(/Net\s*Premium\s*\(A\+B\+C\+D\+E\)[^0-9]*([\d,.]+)/i) ||
    pText.match(/Net\s*Premium\s*\(A\+B\+C\+D\)[^0-9]*([\d,.]+)/i) ||
    pText.match(/Net\s*Premium\s*\(A\+B\+C\)[^0-9]*([\d,.]+)/i) ||
    pText.match(/Net\s*Premium[^0-9]*([\d,.]+)/i);
  if (netMatch) result.netPremium = netMatch[1].replace(/,/g, "");

  // Total Payable
  const totalPayableMatch =
    pText.match(/Total\s*Policy\s*Premium[^0-9]*([\d,.]+)/i) ||
    pText.match(/Total\s*Premium[^0-9]*([\d,.]+)/i);
  if (totalPayableMatch) result.totalPayable = totalPayableMatch[1].replace(/,/g, "");

  // GST
  if (result.netPremium && result.totalPayable) {
    const net = parseFloat(result.netPremium);
    const total = parseFloat(result.totalPayable);
    if (total > net) result.gst = String(Math.round(total - net));
  }
  if (!result.gst) {
    const sgstMatch = pText.match(/SGST\s*₹?\s*([\d,.]+)\s*CGST\s*₹?\s*([\d,.]+)/is);
    if (sgstMatch) {
      const sgst = parseFloat(sgstMatch[1].replace(/,/g, ""));
      const cgst = parseFloat(sgstMatch[2].replace(/,/g, ""));
      result.gst = String(Math.round(sgst + cgst));
    }
  }
  if (!result.gst) {
    const igstMatch = pText.match(/IGST\s*@?\s*\d+%?[^0-9]*([\d,.]+)/i);
    if (igstMatch) result.gst = String(Math.round(parseFloat(igstMatch[1].replace(/,/g, ""))));
  }

  return result;
};

// ---- Vehicle Details ----
const extractVehicleDetailsFromText = (text = "") => {
  const result = {
    registrationNumber: "",
    chassisNumber: "",
    engineNumber: "",
    make: "",
    model: "",
    variant: "",
    gvw: "",
    manufacturingYear: "",
    fuelType: "",
    colour: "",
    cubicCapacity: "",
    seatingCapacity: "",
    geographicalArea: "",
    financierName: "",
    commercialVehicleType: "",
    subType: "",
    idv: "",
  };
  if (!text || typeof text !== "string") return result;

  const txt = normalizeText(text);
  const isCommercial = /Commercial Vehicle Package Policy|Goods Carrying Vehicle|Public Carrier|GVW/i.test(txt);

  // Extract vehicle section
  let section = "";
  if (isCommercial) {
    const commercialSection =
      txt.match(/Vehicle\s*Details\s*:?\s*([\s\S]*?)(?=Public\s*Carrier|Private\s*Carrier|Insured\s*Declared\s*Value|Schedule\s*of\s*Premium|$)/i) ||
      txt.match(/Vehicle\s*Details\s*:?\s*([\s\S]*?)(?=RTO\s*Location|Zone|Geographical\s*Area|$)/i);
    if (commercialSection) section = commercialSection[1];
  } else {
    const privateSection = txt.match(
      /Vehicle\s*Details\s*[-–]\s*Accurate\s*Vehicle\s*Details,\s*Custom\s*Insurance\s*([\s\S]*?)(?=Zone\s*Details|Battery\s*Details|Agent|Insured\s*Declared\s*Value|$)/i
    ) || txt.match(
      /Vehicle\s*Details\s*([\s\S]*?)(?=Zone\s*Details|Battery\s*Details|Agent|Insured\s*Declared\s*Value|Schedule\s*of\s*Premium|$)/i
    );
    if (privateSection) section = privateSection[1];
  }

  const searchText = section || txt;

  // Registration Number
  let regMatch = searchText.match(/Registration\s*No\.?\s*([A-Z0-9\s\-]+?)(?=\s+(?:MAKE|MODEL|ENGINE|CHASSIS|FUEL|CC|YEAR|MFG|BODY|SEATING|HIRE|ZONE|RTO|$))/i);
  if (regMatch) {
    result.registrationNumber = regMatch[1].replace(/\s+/g, "").toUpperCase();
  }

  // Fuel Type (with multiple fallbacks)
  let fuelMatch = null;
  if (section) {
    fuelMatch = section.match(/Fuel\s*Type\s*[:：]?\s*([A-Za-z0-9\-]+)/i);
  }
  if (!fuelMatch) {
    fuelMatch = txt.match(/Fuel\s*Type\s*[:：]?\s*([A-Za-z0-9\-]+)/i);
  }
  if (!fuelMatch) {
    fuelMatch = txt.match(/Fuel\s*[:：]?\s*([A-Za-z0-9\-]+)/i);
  }
  if (fuelMatch && fuelMatch[1]) {
    // Clean and uppercase
    let fuel = fuelMatch[1].trim().toUpperCase();
    // Remove common suffixes like "Cubic", "cc"
    fuel = fuel.replace(/\bCUBIC\b|\bCC\b/i, "").trim();
    result.fuelType = fuel;
  }

  // Make / Model / Variant
  if (isCommercial) {
    const mmv = searchText.match(/Make\s*\/\s*Model\s*\/\s*Body\s*Type\s*\/\s*Segment\s*([A-Z0-9\/\-\s]+)/i) ||
                txt.match(/Make\/Model\/Body\s*Type\/Segment\s*:?\s*([A-Z0-9\/\-\s]+)/i);
    if (mmv) {
      const parts = mmv[1].split("/").map(v => v.trim()).filter(Boolean);
      result.make = parts[0] || "";
      result.model = parts[1] || "";
      if (parts.length >= 5) {
        result.subType = parts[parts.length - 1];
      }
    }
  } else {
    const mmv = searchText.match(/Make\s*\/\s*Model\s*\/\s*Variant\s*([^\n]+)/i);
    if (mmv) {
      const parts = mmv[1].split("/").map(v => v.trim());
      result.make = parts[0] || "";
      if (parts[1]) result.model = parts[1];
      if (parts[2]) result.variant = parts[2];
    }
  }

  // Engine
  const engineMatch = searchText.match(/Engine\s*(?:No\.?|Number)\s*\/?\s*Motor\s*No\.?\s*(?:\(for EV\))?\s*([A-Z0-9]+)/i) ||
                      txt.match(/Engine\s*(?:No\.?|Number)\s*\/?\s*Motor\s*No\.?\s*(?:\(for EV\))?\s*([A-Z0-9]+)/i);
  if (engineMatch) result.engineNumber = engineMatch[1].toUpperCase();

  // Chassis
  const chassisMatch = searchText.match(/Chassis\s*No\.?\s*([A-Z0-9]+)/i) || txt.match(/Chassis\s*No\.?\s*([A-Z0-9]+)/i);
  if (chassisMatch) result.chassisNumber = chassisMatch[1].toUpperCase();

  // Cubic Capacity
  const ccMatch = searchText.match(/CC\/KW\s*(\d+)/i) || txt.match(/CC\/KW\s*(\d+)/i);
  if (ccMatch) result.cubicCapacity = `${ccMatch[1]} cc`;

  // Manufacturing Year
  const yearMatch = searchText.match(/Mfg\.\s*Year\s*(\d{4})/i) || txt.match(/Mfg\.\s*Year\s*(\d{4})/i);
  if (yearMatch) result.manufacturingYear = yearMatch[1];

  // Seating Capacity
  if (isCommercial) {
    const seatMatch = searchText.match(/Licensed\s*Carrying\s*Capacity\s*Including\s*Driver\s*(\d+)/i) ||
                      txt.match(/Licensed\s*Carrying\s*Capacity\s*Including\s*Driver\s*(\d+)/i);
    if (seatMatch) result.seatingCapacity = seatMatch[1];
  } else {
    const seatMatch = searchText.match(/Seating\s*Capacity\s*\(Including\s*Driver\)\s*(\d+)/i);
    if (seatMatch) result.seatingCapacity = seatMatch[1];
  }

  // GVW (commercial only)
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

  // Geographical Area
  const geoMatch = txt.match(/Geographical\s*Area\s*[:：]?\s*([A-Z\s.]+)/i);
  if (geoMatch) {
    let area = geoMatch[1].trim();
    if (area.endsWith('.')) area = area.slice(0, -1);
    result.geographicalArea = area;
  }

  // IDV (if not already extracted by the main function)
  if (!result.idv) {
    const idvMatch = txt.match(/Total\s*IDV[^0-9]*([\d,]+)/i) ||
                     txt.match(/IDV[^0-9]*([\d,]+)/i);
    if (idvMatch) result.idv = idvMatch[1].replace(/,/g, "");
  }

  return result;
};

// =======================================
// REACT COMPONENT
// =======================================

const sanitizeValue = (value) => (value === null || value === undefined ? "" : (typeof value === "string" ? value.trim() : value));
const sanitizeObject = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sanitizeValue(v)]));

function TATAAIGPolicyCard({ item }) {
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};

  const fullText = item?.fullText || item?.text || item?.content || "";

  const autoInsuredDetails = extractInsuredDetails(fullText);
  const policyDates = extractPolicyDates(fullText);
  const extractedVehicle = extractVehicleDetailsFromText(fullText);
  const autoPremium = extractPremiumData(fullText);

  const mergedVehicle = { ...vehicle };
  for (const key in extractedVehicle) {
    if (extractedVehicle[key] !== "" && extractedVehicle[key] !== null && extractedVehicle[key] !== undefined) {
      mergedVehicle[key] = extractedVehicle[key];
    }
  }

  const policyNumber = policy?.policyNumber ||
                       fullText.match(/Policy\s*No\.\s*([\d\s]+)/i)?.[1]?.trim() ||
                       "";

  const finalPremium = {
    calculatedOdPremium: premium?.calculatedOdPremium || autoPremium.calculatedOdPremium || "",
    calculatedTpPremium: premium?.calculatedTpPremium || autoPremium.calculatedTpPremium || "",
    totalOdPremium: premium?.totalOdPremium || autoPremium.totalOdPremium || "",
    totalTpPremium: premium?.totalTpPremium || autoPremium.totalTpPremium || "",
    netPremium: premium?.netPremium || autoPremium.netPremium || "",
    gst: premium?.gst || autoPremium.gst || "",
    totalPayable: premium?.totalPayable || autoPremium.totalPayable || "",
  };

  return (
    <PolicyCardView
      item={item}
      policyNumber={sanitizeValue(policyNumber)}
      insuranceCompany={sanitizeValue(extractInsuranceCompanyName(fullText))}
      branchAddress={sanitizeValue(extractBranchAddress(fullText))}
      productType={sanitizeValue(getProductType(policy?.policyType, fullText))}
      vehicleCategory={sanitizeValue(getVehicleCategory(policy?.policyType, fullText))}
      insuredName={sanitizeValue(insured?.insuredName || autoInsuredDetails?.insuredName)}
      panNumber={sanitizeValue(insured?.panNumber || autoInsuredDetails?.panNumber)}
      gstin={sanitizeValue(autoInsuredDetails?.gstin)}
      contactNumber={sanitizeValue(insured?.contactNumber || autoInsuredDetails?.contactNumber)}
      email={sanitizeValue(insured?.email || autoInsuredDetails?.email)}
      insuredAddress={sanitizeValue(insured?.insuredAddress || autoInsuredDetails?.insuredAddress)}
      policyDates={sanitizeObject({
        startDate: policyDates.startDate,
        odExpireDate: policyDates.odExpireDate,
        tpStartDate: policyDates.tpStartDate,
        tpExpireDate: policyDates.tpExpireDate,
      })}
      dateOfIssue={sanitizeValue(extractDateOfIssue(fullText))}
      totalValue={sanitizeValue(extractedVehicle.idv || extractIDV(fullText))}
      previousInsurer={sanitizeValue(extractPreviousInsurer(fullText))}
      previousPolicyNumber={sanitizeValue(extractPreviousPolicyNumber(fullText))}
      finalPremium={sanitizeObject(finalPremium)}
      vehicle={sanitizeObject(mergedVehicle)}
      extractedVehicle={sanitizeObject(extractedVehicle)}
    />
  );
}

export default TATAAIGPolicyCard;
