// src/components/NewIndiaPolicyCard.jsx

import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

// =======================================
// UTILITY FUNCTIONS
// =======================================

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// =======================================
// TEXT NORMALIZATION HELPER
// =======================================

const normalizeText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ");
};

// =======================================
// FORMATTING FUNCTIONS (Combined & Reusable)
// =======================================

const formatEngineNumber = (engine = "", fullText = "") => {
  const cleanEngine = (value) => {
    if (!value) return "-";
    return String(value)
      .replace(/\r|\n/g, "")
      .replace(/\s+/g, "")
      .replace(/MAKE$/i, "")
      .replace(/MODEL$/i, "")
      .replace(/VARIANT$/i, "")
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase()
      .trim();
  };

  if (!fullText || typeof fullText !== "string") {
    return cleanEngine(engine);
  }

  const normalizedText = fullText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
  let match;

  match = normalizedText.match(
    /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+\s+[A-Z0-9]+)/i
  );
  if (match) return cleanEngine(`${match[2]}`);

  match = normalizedText.match(
    /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+)\s*\n\s*([A-Z0-9]+)\b/i
  );
  if (match) return cleanEngine(`${match[2]}${match[3]}`);

  match = normalizedText.match(
    /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\n\s*([A-Z0-9]+)\s*\/\s*([A-Z0-9]+)/i
  );
  if (match) return cleanEngine(match[3]);

  match = normalizedText.match(
    /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+)/i
  );
  if (match) return cleanEngine(match[2]);

  match = normalizedText.match(/Engine\s*Number\s*[:\-]?\s*([A-Z0-9\s]+)/i);
  if (match) return cleanEngine(match[1]);
  
  match = normalizedText.match(
    /Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([A-Z0-9]+)\s*\/\s*([A-Z0-9]+)\s+([A-Z0-9]+)/i
  );
  if (match) return cleanEngine(`${match[2]}${match[3]}`);

  return cleanEngine(engine);
};

const formatChassisNumber = (chassis = "", fullText = "") => {
  const cleanChassis = (value) => {
    if (!value) return "-";
    return String(value).replace(/[^A-Z0-9~]/gi, "").toUpperCase().trim();
  };

  if (!fullText || typeof fullText !== "string") {
    return cleanChassis(chassis);
  }

  const normalizedText = fullText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");

  let match = normalizedText.match(
    /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*[A-Z0-9]+\s*\n\s*[A-Z0-9]+/i
  );
  if (match) return cleanChassis(match[1]);

  match = normalizedText.match(
    /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\n\s*([A-Z0-9]+)\s*\/\s*[A-Z0-9]+/i
  );
  if (match) return cleanChassis(`${match[1]}${match[2]}`);
  
  match = normalizedText.match(
    /Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([A-Z0-9]+)\s*\/\s*[A-Z0-9]+\s+[A-Z0-9]+/i
  );
  if (match) return cleanChassis(match[1]);

  return cleanChassis(chassis);
};

// Generic field formatter for vehicle fields
const formatGenericField = (value, stopWords = []) => {
  if (!value) return "-";
  let formatted = String(value);
  for (const word of stopWords) {
    const regex = new RegExp(`\\s*${word.source || word}\\s*.*$`, 'i');
    formatted = formatted.replace(regex, "");
  }
  return formatted.trim();
};

// Utility: remove all hyphens from a string (keep for other fields, not for registration)
const removeHyphens = (value) => {
  if (!value || value === "-") return "-";
  return String(value).replace(/-/g, "");
};

const formatModelName = (model) => {
  let cleaned = formatGenericField(model, [/Registration\s*no\.?/i, /Variant/i, /Colour/i, /Year/i, /Type of body/i]);
  return removeHyphens(cleaned);
};

// ***** FIX 1: Added "Automobile Association" to stop words *****
const formatVariantName = (variant) =>
  formatGenericField(variant, [
    /Gvw/i,
    /GVW/i,
    /Year of manufacture/i,
    /Type of body/i,
    /Colour/i,
    /Registration/i,
    /Automobile Association/i,   // <-- added
  ]);

const formatFuelType = (fuel) => formatGenericField(fuel, [/Cubic/i]);

const formatFinancierName = (financier) => {
  if (!financier) return "-";
  let name = String(financier);
  name = name
    .replace(/Cover Note No.*$/i, "")
    .replace(/[\/:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  if (name.length > 50) {
    const shortMatch = name.match(/([A-Z]{3,}\s+(?:FINANCE|BANK)\s+[A-Z]{3,})/i);
    if (shortMatch) return shortMatch[1].toUpperCase();
  }
  return name.toUpperCase();
};

// =======================================
// EXTRACTION FUNCTIONS
// =======================================

const extractInsuranceCompanyName = (fullText = "") => {
  if (!fullText) return "-";
  const companyMatch = fullText.match(/THE\s*NEW\s*INDIA\s*ASSURANCE\s*CO\.?\s*LTD\.?/i);
  if (companyMatch) return "THE NEW INDIA ASSURANCE CO. LTD.";
  const altMatch = fullText.match(/([A-Z\s]+ASSURANCE\s*CO\.?\s*LTD\.?)/i);
  return altMatch ? altMatch[1].trim() : "-";
};

const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "-";
  
  let match = fullText.match(/POLICY ISSUING OFFICE:\s*([\s\S]*?)(?=\n\s*(?:BUSINESS CHANNEL|CLAIM CONTACT|INSURED DETAILS|\n\s*\n))/i);
  if (match) {
    let addressBlock = match[1].trim();
    addressBlock = addressBlock.replace(/\s*PHONE NUMBER:.*$/i, '');
    addressBlock = addressBlock.replace(/\s*FAX NUMBER:.*$/i, '');
    addressBlock = addressBlock.replace(/\s*Email:.*$/i, '');
    addressBlock = addressBlock.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
    addressBlock = addressBlock.replace(/,$/, '');
    if (addressBlock) return addressBlock;
  }
  
  const simpleMatch = fullText.match(/POLICY ISSUING OFFICE:\s*([^\n]+?)(?=\s*(?:PHONE|FAX|Email|$))/i);
  if (simpleMatch && simpleMatch[1].trim()) {
    let addr = simpleMatch[1].trim();
    addr = addr.replace(/,\s*$/, '');
    return addr;
  }
  
  return "-";
};

const extractInsuredDetails = (text = "") => {
  if (!text) {
    return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
  }
  const normalizedText = normalizeText(text);
  let insuredName = "-";
  const namePatterns = [
    /Insured'?s?\s*Name\s*([^\n]+?)(?:\n|Customer\s*ID)/i,
    /Insured Name\s*([^\n]+)/i,
    /Insured's Name\s*([^\n]+)/i,
    /Insured Name\s*([A-Z][A-Z\s]+?)(?:\n|Customer)/i
  ];
  for (const pattern of namePatterns) {
    const match = normalizedText.match(pattern);
    if (match?.[1]) {
      insuredName = match[1].replace(/\s+/g, " ").trim();
      break;
    }
  }
  const panMatch = normalizedText.match(/PAN No\s*[:]?\s*([A-Z0-9]+)/i);
  const panNumber = panMatch?.[1] || "-";
  
  const contactMatch = normalizedText.match(/Contact Number\s*\/\s*[\/\s]*([X\d]+)/i);
  const contactNumber = contactMatch?.[1] || "-";

  const emailMatch = normalizedText.match(/Email \s*([^\s]+@[^\s]+)/i);
  const email = emailMatch?.[1] || "-";
  
  let insuredAddress = "-";
  const addressMatch = normalizedText.match(/Insured'?s?\s*Address\s*([\s\S]*?)(?=\s*Contact\s+Number|\s*Email|\s*GSTIN|$)/i);
  if (addressMatch?.[1]) {
    let raw = addressMatch[1];
    const contactIndex = raw.search(/Contact\s+Number/i);
    if (contactIndex !== -1) {
      raw = raw.substring(0, contactIndex);
    }
    insuredAddress = raw
      .replace(/\n+/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .trim();
  }
  if (insuredAddress === "-" || insuredAddress === "") {
    const fallbackPatterns = [
      /Insured Address\s*([^\n]+(?:,\s*[^\n]+)*)/i,
      /Insured's Address\s*([^\n]+(?:,\s*[^\n]+)*)/i
    ];
    for (const pattern of fallbackPatterns) {
      const match = normalizedText.match(pattern);
      if (match?.[1]) {
        insuredAddress = match[1].replace(/\n+/g, " ").replace(/[ ]{2,}/g, " ").trim();
        const contactIdx = insuredAddress.search(/Contact\s+Number/i);
        if (contactIdx !== -1) insuredAddress = insuredAddress.substring(0, contactIdx).trim();
        break;
      }
    }
  }

  const gstinMatch = normalizedText.match(/GSTIN\s*([A-Z0-9]{15})/i);
  const gstin = gstinMatch?.[1] || "-";
  return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin };
};

const extractPolicyDates = (fullText = "") => {
  if (!fullText) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  const bundledODMatch = fullText.match(/OD Cover\s*(\d{2}\/\d{2}\/\d{4})\s*\d{2}:\d{2}:\d{2}\s*(?:AM|PM)\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  const bundledTPMatch = fullText.match(/TP Cover\s*(\d{2}\/\d{2}\/\d{4})\s*\d{2}:\d{2}:\d{2}\s*(?:AM|PM)\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (bundledODMatch) {
    return {
      startDate: bundledODMatch[1] || "-",
      odExpireDate: bundledODMatch[2] || "-",
      tpExpireDate: bundledTPMatch?.[2] || bundledODMatch[2] || "-"
    };
  }
  const periodMatch = fullText.match(/Period of cover\s*(\d{2}\/\d{2}\/\d{4})(?:.*?)to\s*(\d{2}\/\d{2}\/\d{4})/i);
  let tpExpiryDate = periodMatch?.[2] || "-";
  const bundledLiabilityMatch = fullText.match(/Bundled\/Liability Policy\s*period:\s*\d{2}\/\d{2}\/\d{4}\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (bundledLiabilityMatch?.[1]) tpExpiryDate = bundledLiabilityMatch[1];
  const periodOnlyMatch = fullText.match(/period:\s*\d{2}\/\d{2}\/\d{4}\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (periodOnlyMatch?.[1]) tpExpiryDate = periodOnlyMatch[1];
  return { startDate: periodMatch?.[1] || "-", odExpireDate: periodMatch?.[2] || "-", tpExpireDate: tpExpiryDate };
};

const extractDateOfIssue = (text = "") => {
  const match = text.match(/Date of Issue\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  return match?.[1] || "-";
};

const extractIDV = (text = "") => {
  if (!text) return "-";
  const tableVehicleMatch = text.match(/INSURED DECLARED VALUE.*?\nVehicle\s+Trailer\s+Non-Elec Acc.*?\n\s*([\d,]+)/is);
  if (tableVehicleMatch?.[1]) return tableVehicleMatch[1].replace(/,/g, "");
  const individualCoverMatch = text.match(/For individual covers?\s*\(OD\)\s*in\s*RS?[:\s]*([\d,]+)/i);
  if (individualCoverMatch?.[1]) return individualCoverMatch[1].replace(/,/g, "");
  const totalValueMatch = text.match(/Total Value\s*[:]?\s*([\d,]+)/i);
  return totalValueMatch?.[1] ? totalValueMatch[1].replace(/,/g, "") : "-";
};

const extractPreviousPolicyNumber = (text = "") => {
  const match = text.match(/Previous Policy Number\s*[:]?\s*([A-Z0-9\/\-]+)/i);
  return match?.[1] || "-";
};

const extractPreviousInsurer = (text = "") => {
  const match = text.match(/Previous Insurer\s*[:]?\s*([^\n]+?)(?:\s*Previous Policy Number|$)/i);
  if (match?.[1]) {
    return match[1].replace(/Previous Policy Number.*$/i, "").replace(/\s+/g, " ").trim();
  }
  return "-";
};

const extractPremiumData = (text = "") => {
  const defaultResult = { calculatedOdPremium: "0", calculatedTpPremium: "0", totalOdPremium: "0", totalTpPremium: "0", netPremium: "0", gst: "0", totalPayable: "0" };
  if (!text) return defaultResult;
  const result = {};
  const premiumSection = text.match(/SCHEDULE OF PREMIUM([\s\S]*?)(?=Total Payable|Limitation as to use|$)/i);
  
  if (premiumSection) {
    const premiumText = premiumSection[1];
    const calcOdMatch = premiumText.match(/Calculated OD Premium\s*([\d.]+)/i);
    if (calcOdMatch) result.calculatedOdPremium = calcOdMatch[1];
    
    const calcTpMatch = premiumText.match(/Calculated TP Premium\s*([\d.]+)/i);
    if (calcTpMatch) result.calculatedTpPremium = calcTpMatch[1];     
    
    // Updated match logic
    const totalOdMatch = premiumText.match(/Total OD Premium\s*([\d.]+)/i) || 
                         text.match(/Total OD Premium in Rs\s*([\d.]+)/i) || 
                         text.match(/Total OD Premium in\s*\(Rs\)\s*([\d.]+)/i) || 
                         text.match(/Total OD Premium\s*\(Rs\)\s*([\d.]+)/i);
                         
    if (totalOdMatch) result.totalOdPremium = totalOdMatch[1]; 
    
    const totalTpMatch = premiumText.match(/Total TP Premium\s*([\d.]+)/i) || text.match(/Total TP Premium\s*\(Rs\)\s*([\d.]+)/i);   
    if (totalTpMatch) result.totalTpPremium = totalTpMatch[1];
  }

  // ... rest of your code (Net Premium, GST, etc.)
  const netMatch = text.match(/Net Premium\s*\(Rs\)\s*([\d,]+)/i) || text.match(/Net Premium in Rs\s*[\s:]*([\d,]+)/i);
  if (netMatch) result.netPremium = netMatch[1].replace(/,/g, "");
  
  const gstMatch = text.match(/GST\s*\(Rs\)\s*([\d,]+)/i) || text.match(/GST in Rs\s*[\s:]*([\d,]+)/i);
  if (gstMatch) result.gst = gstMatch[1].replace(/,/g, "");
  
  const totalMatch = text.match(/Total Payable\s*\(Rs\)\s*([\d,]+)/i) || text.match(/Total Payable in Rs\s*[\s:]*([\d,]+)/i);
  if (totalMatch) result.totalPayable = totalMatch[1].replace(/,/g, "");
  
  return { ...defaultResult, ...result };
};

const extractVehicleDetailsFromText = (text = "") => {
  const result = {
    registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-", model: "-",
    variant: "-", gvw: "-", manufacturingYear: "-", fuelType: "-",
    cubicCapacity: "-", seatingCapacity: "-", financierName: "-", ncb: "-"
  };
  if (!text || typeof text !== "string") return result;
  const normalizedText = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  
  // ============================================================
  // FIXED: Registration number – keep hyphens
  // ============================================================
    let registrationNumber = "-";

    // Primary: match "Registration no." or "Registration Number" explicitly
    let regMatch = normalizedText.match(/Registration\s*(?:no\.?|Number)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
    if (regMatch?.[1]) {
      registrationNumber = regMatch[1].trim();
    } else {
      // Fallback: more liberal
      const fallbackMatch = normalizedText.match(/(?:Reg(?:istration)?\s*no\.?|Registration\s*Number)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
      if (fallbackMatch?.[1]) registrationNumber = fallbackMatch[1].trim();
    }

    // If still not found, try capturing a typical Indian registration format (e.g., XX-00-XX-0000)
    if (registrationNumber === "-") {
      const genericMatch = normalizedText.match(/\b([A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4})\b/i);
      if (genericMatch?.[1]) registrationNumber = genericMatch[1].trim();
    }

    // Clean up extra spaces (should not be necessary, but safe)
    registrationNumber = registrationNumber.replace(/\s+/g, ' ').trim();

    // ----- NEW: Remove all hyphens from the registration number -----
    if (registrationNumber !== "-") {
      registrationNumber = registrationNumber.replace(/-/g, '');
    }

    result.registrationNumber = registrationNumber;
  // ============================================================

  // Chassis and Engine extraction (unchanged)
  const ceLineMatch = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([^\n]+)/i);
  if (ceLineMatch) {
    const ceLine = ceLineMatch[1].trim();
    if (ceLine.includes("/")) {
      const lastSlashIndex = ceLine.lastIndexOf("/");
      const chassisPart = ceLine.substring(0, lastSlashIndex).trim();
      const enginePart = ceLine.substring(lastSlashIndex + 1).trim();
      
      result.chassisNumber = formatChassisNumber(chassisPart, normalizedText);
      result.engineNumber = formatEngineNumber(enginePart, normalizedText);
      
      // Handle engine number that continues on next line
      const nextLineMatch = normalizedText.match(new RegExp(`${escapeRegex(ceLine)}\\s*\\n\\s*([A-Z0-9]+)`, "i"));
      if (nextLineMatch?.[1]) {
        result.engineNumber = formatEngineNumber(result.engineNumber + nextLineMatch[1], normalizedText);
      }
    }
  }
  
  // If still not extracted, try alternative patterns
  if (result.chassisNumber === "-" || result.engineNumber === "-") {
    const altMatch = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~ ]+?)\s*\/\s*([A-Z0-9]+)/i);
    if (altMatch) {
      if (result.chassisNumber === "-") result.chassisNumber = formatChassisNumber(altMatch[1], normalizedText);
      if (result.engineNumber === "-") result.engineNumber = formatEngineNumber(altMatch[2], normalizedText);
    }
  }
  
  // Make / Model / Variant
  const mmMatch = normalizedText.match(/Make\s*\/\s*Model\s*([A-Z0-9\s&]+?)\s*\/\s*([A-Z0-9\s\-]+)/i);
  if (mmMatch) {
    result.make = mmMatch[1]?.replace(/Variant.*$/i, "").trim() || "-";
    result.model = formatModelName(mmMatch[2]?.replace(/Variant.*$/i, "").replace(/:.*$/i, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim() || "-");
  }
  if (result.make === "-" || result.model === "-") {
    const mmMatchAlt = normalizedText.match(/Make\/Model\s*:\s*([^\n]+)/i);
    if (mmMatchAlt?.[1]) {
      const mmText = mmMatchAlt[1];
      if (mmText.includes("/")) {
        const parts = mmText.split("/");
        result.make = parts[0].trim();
        result.model = formatModelName(parts[1].trim());
      } else {
        result.model = formatModelName(mmText.trim());
      }
    }
  }
  
  let variantMatch = normalizedText.match(/\d*Variant\s*[:\-]?\s*([^\n]+?)(?=Year of manufacture|Type of body|Colour|Registration|$)/i);
  if (!variantMatch) variantMatch = normalizedText.match(/Variant\s*[:\-]?\s*([^\n]+?)(?=Year of manufacture|Type of body|Colour|Registration|$)/i);
  if (variantMatch?.[1]) result.variant = formatVariantName(variantMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim());
  if (result.variant === "-") {
    const variantMatchAlt = normalizedText.match(/Variant\s*:\s*([^\n]+)/i);
    if (variantMatchAlt?.[1]) result.variant = formatVariantName(variantMatchAlt[1].trim());
  }
  
  const yearMatch = normalizedText.match(/Year of manufacture\s*[:\-]?\s*(\d{4})/i);
  if (yearMatch?.[1]) result.manufacturingYear = yearMatch[1];
  
  let bodyFuelCombined = normalizedText.match(/Type of body\s*\/\s*Type of Fuel\s*:\s*([^\n]+?)(?=\s*Year of manufacture|\s*Colour|$)/i);
  if (!bodyFuelCombined || !bodyFuelCombined[1]) {
    bodyFuelCombined = normalizedText.match(/Type of body\s*\/\s*Type of Fuel\s*([A-Za-z]+\/[A-Za-z]+)/i);
    if (!bodyFuelCombined) bodyFuelCombined = normalizedText.match(/Type of Fuel\s*([A-Za-z]+\/[A-Za-z]+)/i);
  }
  if (bodyFuelCombined?.[1]) {
    let combinedText = bodyFuelCombined[1].trim().replace(/Cubic capacity.*$/i, '');
    const parts = combinedText.split("/");
    if (parts.length >= 2) {
      result.fuelType = parts[parts.length - 1].trim();
    } else {
      result.fuelType = combinedText.trim();
    }
  }
  if (result.fuelType === "-") {
    let fuelMatch = normalizedText.match(/Type of fuel\s*:\s*([^\n]+?)(?=\s*Cubic|$)/i);
    if (!fuelMatch) fuelMatch = normalizedText.match(/Type of Fuel\s*[A-Za-z]+\/([A-Za-z]+)/i);
    if (fuelMatch?.[1]) result.fuelType = formatFuelType(fuelMatch[1].trim().replace(/Cubic.*$/i, ''));
    if (result.fuelType === "-") {
      const fuelMatchLast = normalizedText.match(/Type of fuel\s*:\s*([A-Za-z]+)/i);
      if (fuelMatchLast?.[1]) result.fuelType = fuelMatchLast[1].trim();
      else {
        const slashMatch = normalizedText.match(/[A-Za-z]+\/([A-Za-z]+)/i);
        if (slashMatch?.[1]) result.fuelType = slashMatch[1].trim();
      }
    }
  }

  const ccMatch = normalizedText.match(/Cubic capacity\(cc\).*?(\d{2,5}\s*cc)/is);
  if (ccMatch?.[1]) result.cubicCapacity = ccMatch[1].replace(/\s+/g, "").trim();

  // ***** FIX 2: Improved seating capacity extraction *****
  let seatCapacity = "-";
  let seatMatch = normalizedText.match(/Seating\s*capacity\s*(?:including\s*Driver)?\s*[:\-]?\s*(\d+)/i);
  if (seatMatch?.[1]) {
    seatCapacity = seatMatch[1];
  } else {
    seatMatch = normalizedText.match(/Seating\s*capacity\s*\(including\s*Driver\)\s*[:\-]?\s*(\d+)/i);
    if (seatMatch?.[1]) seatCapacity = seatMatch[1];
  }
  if (seatCapacity === "-") {
    seatMatch = normalizedText.match(/Seating\s*capacity\s*[:\-]?\s*(\d+)/i);
    if (seatMatch?.[1]) seatCapacity = seatMatch[1];
  }
  result.seatingCapacity = seatCapacity;

  let gvwMatch = normalizedText.match(/Gross Vehicle Weight\s*\(GVW\)\s*[:\-]?\s*(\d+)/i);
  if (!gvwMatch) gvwMatch = normalizedText.match(/GVW\s*[:\-]?\s*(\d+)/i);
  if (gvwMatch?.[1]) result.gvw = gvwMatch[1];
  let finMatch = normalizedText.match(/Geographical Area\s*\/\s*Zone[^\n]*\n\s*Name of the Financier\s*:\s*([^\n]+)/i);
  if (!finMatch) finMatch = normalizedText.match(/Name of the Financier\s*:\s*([^\n]+?)(?=\s*Cover Note No|\s*Automobile Association|\s*Chassis\s*no\.|$)/i);
  if (!finMatch) finMatch = normalizedText.match(/Name of the Financier\s+([A-Z\s]+(?:LTD\.?|LTD)?)/i);
  if (!finMatch) finMatch = normalizedText.match(/Name of the Financier\s*:\s*([^\n]+)/i);
  if (!finMatch) finMatch = normalizedText.match(/Name of the Financier\s*([A-Z\s]+(?:LTD\.?|LTD)?)/i);
  if (finMatch?.[1]) {
    let financierText = finMatch[1].trim()
      .replace(/\s*Cover Note No.*$/i, '')
      .replace(/\s*Automobile Association.*$/i, '')
      .replace(/\s*Chassis\s*no\.*.*$/i, '')
      .replace(/\s*FASTag.*$/i, '')
      .replace(/\s*$/, '')
      .replace(/^[^A-Z]*/, '')
      .trim();
    result.financierName = formatFinancierName(financierText);
  } else {
    result.financierName = "N/A";
  }

  // ============================================================
  // NEW POST‑PROCESSING: split model and variant, and strip model prefix from variant
  // ============================================================
  if (result.model !== "-" && result.model !== "") {
    // If model contains a space followed by 2+ uppercase letters and an opening parenthesis,
    // split it into base model and variant (e.g., "LPT 1613 TCIC (42" → base="LPT 1613", var="TCIC (42")
    const keywordIndex = result.model.search(/\s+[A-Z]{2,}\s*\(/);
    if (keywordIndex !== -1) {
      const baseModel = result.model.substring(0, keywordIndex).trim();
      const variantPart = result.model.substring(keywordIndex).trim();
      if (baseModel) {
        result.model = baseModel;
        // If variant was not already set or if it equals the old full model, assign the split‑off part
        if (result.variant === "-" || result.variant === baseModel + " " + variantPart) {
          result.variant = variantPart;
        }
      }
    }
  }

  // If the variant starts with the model name, remove that prefix
  if (result.variant !== "-" && result.model !== "-") {
    const prefix = result.model + " ";
    if (result.variant.startsWith(prefix)) {
      result.variant = result.variant.substring(prefix.length).trim();
    }
  }
  // ============================================================

  const ncbMatch = text.match(/No\s+Claim\s+Bonus\s*[:]?\s*[-]?\s*(\d+%)/i);
  if (ncbMatch) {
    result.ncb = ncbMatch[1];
  }

  return result;
};

// =======================================
// UI COMPONENTS
// =======================================

// =======================================
// MAIN COMPONENT
// =======================================

function NewIndiaPolicyCard({ item }) {
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};

  const autoInsuredDetails = extractInsuredDetails(item?.fullText || "");
  const policyDates = extractPolicyDates(item?.fullText);
  const extractedVehicle = extractVehicleDetailsFromText(item?.fullText || "");
  const autoPremium = extractPremiumData(item?.fullText || "");
  const insuranceCompany = extractInsuranceCompanyName(item?.fullText || "");
  const branchAddress = extractBranchAddress(item?.fullText || "");

  const insuredName = insured?.insuredName || autoInsuredDetails?.insuredName || "-";
  const insuredAddress = insured?.insuredAddress || autoInsuredDetails?.insuredAddress || "-";
  const panNumber = insured?.panNumber || autoInsuredDetails?.panNumber || "-";
  const contactNumber = insured?.contactNumber || autoInsuredDetails?.contactNumber || "-";
  const email = insured?.email || autoInsuredDetails?.email || "-";
  const gstin = autoInsuredDetails?.gstin || "-";

  const vehicleCategory = getVehicleCategory(policy?.policyType, item?.fullText); // now imported
  const productType = getProductType(policy?.policyType, item?.fullText); // now imported
  const dateOfIssue = extractDateOfIssue(item?.fullText);
  const totalValue = extractIDV(item?.fullText);
  const previousPolicyNumber = extractPreviousPolicyNumber(item?.fullText);
  const previousInsurer = extractPreviousInsurer(item?.fullText);

  const finalPremium = {
    calculatedOdPremium: premium?.calculatedOdPremium || autoPremium?.calculatedOdPremium || "0",
    calculatedTpPremium: premium?.calculatedTpPremium || autoPremium?.calculatedTpPremium || "0",
    totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
    totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
    netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
    gst: premium?.gst || autoPremium?.gst || "0",
    totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
  };

  const policyNumber = policy?.policyNumber || item?.fullText?.match(/Policy Number\s*[:]?\s*([0-9]+)/i)?.[1] || "-";

  return (
    <PolicyCardView
      item={item}
      policyNumber={policyNumber}
      insuranceCompany={insuranceCompany}
      branchAddress={branchAddress}
      productType={productType}
      vehicleCategory={vehicleCategory}
      insuredName={insuredName}
      panNumber={panNumber}
      gstin={gstin}
      contactNumber={contactNumber}
      email={email}
      insuredAddress={insuredAddress}
      policyDates={policyDates}
      dateOfIssue={dateOfIssue}
      totalValue={totalValue}
      previousInsurer={previousInsurer}
      previousPolicyNumber={previousPolicyNumber}
      finalPremium={finalPremium}
      vehicle={vehicle}
      extractedVehicle={extractedVehicle}
    />
  );
}

export default NewIndiaPolicyCard;
