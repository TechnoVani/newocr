// src/components/UnitedPolicyCard.jsx

import { useState } from "react";
import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

// =======================================
// UTILITY FUNCTIONS
// =======================================

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const cleanValue = (value) => {
  if (!value) return "-";
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/[\n\r]+/g, " ")
    .trim();
};

const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

const getPremiumValue = (value) => {
  if (value === null || value === undefined || value === "" || value === "NA") {
    return "0";
  }
  return String(value).replace(/,/g, "");
};

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

  match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+\s+[A-Z0-9]+)/i);
  if (match) return cleanEngine(`${match[2]}`);

  match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+)\s*\n\s*([A-Z0-9]+)\b/i);
  if (match) return cleanEngine(`${match[2]}${match[3]}`);

  match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\n\s*([A-Z0-9]+)\s*\/\s*([A-Z0-9]+)/i);
  if (match) return cleanEngine(match[3]);

  match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+)/i);
  if (match) return cleanEngine(match[2]);

  match = normalizedText.match(/Engine\s*Number\s*[:\-]?\s*(?:No\s*&\s*)?([A-Z0-9\s]+)/i);
  if (match) return cleanEngine(match[1]);
  
  match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([A-Z0-9]+)\s*\/\s*([A-Z0-9]+)\s+([A-Z0-9]+)/i);
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

  let match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*[A-Z0-9]+\s*\n\s*[A-Z0-9]+/i);
  if (match) return cleanChassis(match[1]);

  match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\n\s*([A-Z0-9]+)\s*\/\s*[A-Z0-9]+/i);
  if (match) return cleanChassis(`${match[1]}${match[2]}`);
  
  match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([A-Z0-9]+)\s*\/\s*[A-Z0-9]+\s+[A-Z0-9]+/i);
  if (match) return cleanChassis(match[1]);

  match = normalizedText.match(/Chassis\s*Number\s*([A-Z0-9]+)/i);
  if (match) return cleanChassis(match[1]);

  return cleanChassis(chassis);
};

const formatGenericField = (value, stopWords = []) => {
  if (!value) return "-";
  let formatted = String(value);
  for (const word of stopWords) {
    const regex = new RegExp(`\\s*${word.source || word}\\s*.*$`, 'i');
    formatted = formatted.replace(regex, "");
  }
  return formatted.trim();
};

const removeHyphens = (value) => {
  if (!value || value === "-") return "-";
  return String(value).replace(/-/g, "");
};

const formatModelName = (model) => {
  let cleaned = formatGenericField(model, [/Registration\s*no\.?/i, /Variant/i, /Colour/i, /Year/i, /Type of body/i]);
  return removeHyphens(cleaned);
};

const formatVariantName = (variant) => formatGenericField(variant, [/Gvw/i, /GVW/i, /Year of manufacture/i, /Type of body/i, /Colour/i, /Registration/i]);
const formatFuelType = (fuel) => formatGenericField(fuel, [/Cubic/i]);

const formatFinancierName = (financier) => {
  if (!financier || financier === "-") return "-";
  let name = String(financier);

  const bracketMatch = name.match(/^([^(]+)/);
  if (bracketMatch) name = bracketMatch[1];

  name = name
    .replace(/Cover Note No.*$/i, "")
    .replace(/Policy Subject to.*$/i, "")
    .replace(/SUBJECT TO IMT ENDORSEMENT.*$/i, "")
    .replace(/I\/?WE HEREBY CERTIFY.*$/i, "")
    .replace(/AMOUNT SUBJECT TO REVERSE CHARGES.*$/i, "")
    .replace(/IMPORTANT NOTICE.*$/i, "")
    .replace(/NOTE\s*-\s*WITH REFERENCE.*$/i, "")
    .replace(/DEALER NAME.*$/i, "")
    .replace(/DIRECT BUSINESS DEVELOPMENT.*$/i, "")
    .replace(/Applicable Addon.*?Code/ig, "")
    .replace(/SERVICES UNIQUE REFERENCE CODE/ig, "")
    .replace(/UNIQUE REFERENCE CODE/ig, "")
    .replace(/\([^)]+\)/g, "")
    .replace(/LTD\._\d+.*$/i, "LTD")
    .replace(/[\/:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (name.length > 40) {
    const shortMatch = name.match(/([A-Z0-9\s&.,]{2,35}\s+(?:FINANCE|BANK|FINSERV)(?:\s+LTD\.?|\s+LIMITED)?)/i);
    if (shortMatch) name = shortMatch[1].trim();
  }

  let finalName = name.toUpperCase().replace(/\s*(?:LTD\.?|LIMITED)\s*$/i, "").trim();
  if (["", "LTD", "LIMITED", "N/A"].includes(finalName)) return "-";
  return finalName;
};

// =======================================
// SEPARATED VEHICLE DETAILS EXTRACTORS
// =======================================

const extractTableVehicleDetails = (normalizedText) => {
  const result = {};
  const tableHeaderMatch = normalizedText.match(/Registration\s*No\.\s+Obsolete\s+Vehicle\s+Engine\s+No\.\s+Chassis\s+No\./i);
  
  if (tableHeaderMatch) {
    const isTractor = /HP\/Cubic\s*Capacity/.test(normalizedText) || /GVW/.test(normalizedText);

    if (isTractor) {      
      const dataMatch = normalizedText.match(
        /([A-Z]{2})\s*-\s*(\d{2})\s*-\s*([A-Z]{1,2})\s*-\s*(\d{4})\s+No\s+([A-Z0-9\/]+)\s+([A-Z0-9]+)\s+([A-Za-z0-9\s&]+?)\s*\/\s*([A-Z0-9\s]+?)(?:\s+([A-Z0-9]+))?\s+(?:null\s+)?([A-Za-z0-9\/\s]+?)\s+(\d{4})(?:\s+(\d+)\s+(\d+))?/
      );
      if (dataMatch) {
        result.registrationNumber = removeHyphens(`${dataMatch[1]}-${dataMatch[2]}-${dataMatch[3]}-${dataMatch[4]}`);
        result.engineNumber = dataMatch[5].trim();
        result.chassisNumber = dataMatch[6].trim();
        result.make = dataMatch[7].trim();
        result.model = dataMatch[8].trim();
        
        if (dataMatch[9]) {
          result.variant = dataMatch[9]
            .replace(/HATCH\s*BACK/i, "") // Added logic to remove HATCH BACK
            .trim();
        }
        
        if (dataMatch[11]) result.manufacturingYear = dataMatch[11].trim();
        if (dataMatch[12]) result.cubicCapacity = dataMatch[12].trim();
        if (dataMatch[13]) result.gvw = dataMatch[13].trim();

        const seatMatch = normalizedText.match(/Seating\s+Capacity\s+(\d+)/i);
        if (seatMatch) result.seatingCapacity = seatMatch[1];
        return result;
      }
    } else {
      const dataMatch = normalizedText.match(
        /([A-Z]{2})\s*-\s*(\d{2})\s*-\s*([A-Z]{1,2})\s*-\s*(\d{4})\s+No\s+([A-Z0-9]+)\s+([A-Z0-9]+)\s+([A-Z0-9\s&]+?)\s*\/\s*([A-Z0-9\s\(\)\-\.]+?)\s+([A-Z\s]+?)\s+(\d{4})\s+(\d+)\s+(\d+)/
      );
      if (dataMatch) {
        result.registrationNumber = removeHyphens(`${dataMatch[1]}-${dataMatch[2]}-${dataMatch[3]}-${dataMatch[4]}`);
        result.engineNumber = dataMatch[5].trim();
        result.chassisNumber = dataMatch[6].trim();
        result.make = dataMatch[7].trim();

        // Combine Group 8 and Group 9 into the full model text
        let model = `${dataMatch[8]} ${dataMatch[9]}`.trim().replace(/\s+/g, " ");

        result.manufacturingYear = dataMatch[10].trim();
        result.cubicCapacity = dataMatch[11].trim();
        result.seatingCapacity = dataMatch[12].trim();

        // Extract bracket and text that follows (e.g., "(2008 - 2015) GL HATCH BACK")
        const variantMatch = model.match(/(\([\d\s\-]+\)(?:\s*[A-Z0-9\.\s]+)?)/);
        
        if (variantMatch) {
          result.variant = variantMatch[1]
            .replace(/HATCH\s*BACK/i, "") // <--- FIX: Removes "HATCH BACK" or "HATCHBACK"
            .trim();
            
          model = model.replace(variantMatch[1], '').trim();
        } else {
          result.variant = "-";
        }
        
        result.model = model;
        return result;
      }
    }
  }
  return null;
};

const extractRegistrationNumber = (normalizedText) => {
  const spacedRegMatch = normalizedText.match(/Registration\s*Number\s*([A-Z0-9\s\-]+?)\s+(?:Obsolete|Engine|Chassis)/i);
  if (spacedRegMatch && spacedRegMatch[1]) return removeHyphens(spacedRegMatch[1].replace(/[\s\-]/g, ''));

  const regMatch = normalizedText.match(/Registration\s*Number\s*([^\n]+?)(?=\s+Chassis|$)/i);
  if (regMatch?.[1]) return removeHyphens(regMatch[1].replace(/\s+/g, " ").trim());

  const altRegMatch = normalizedText.match(/Registration\s*no\.?\s*[:\-]?\s*([A-Z0-9\-]+)/i);
  if (altRegMatch?.[1]) return removeHyphens(altRegMatch[1].trim());

  const saRegMatch = normalizedText.match(/Registration Number\s*([A-Z]{2}\s*-\s*\d{2}\s*-\s*[A-Z]{1,2}\s*-\s*\d{4})/i);
  if (saRegMatch) return removeHyphens(saRegMatch[1]);

  return "-";
};

const extractEngineAndChassis = (normalizedText) => {
  let engineNumber = "-";
  let chassisNumber = "-";

  const ceLineMatch = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([^\n]+)/i);
  if (ceLineMatch) {
    const ceLine = ceLineMatch[1].trim();
    if (ceLine.includes("/")) {
      const lastSlashIndex = ceLine.lastIndexOf("/");
      const chassisPart = ceLine.substring(0, lastSlashIndex).trim();
      const enginePart = ceLine.substring(lastSlashIndex + 1).trim();
      
      chassisNumber = formatChassisNumber(chassisPart, normalizedText);
      engineNumber = formatEngineNumber(enginePart, normalizedText);
      
      const nextLineMatch = normalizedText.match(new RegExp(`${escapeRegex(ceLine)}\\s*\\n\\s*([A-Z0-9]+)`, "i"));
      if (nextLineMatch?.[1]) {
        engineNumber = formatEngineNumber(engineNumber + nextLineMatch[1], normalizedText);
      }
    }
  }
  
  if (chassisNumber === "-" || engineNumber === "-") {
    const altMatch = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~ ]+?)\s*\/\s*([A-Z0-9]+)/i);
    if (altMatch) {
      if (chassisNumber === "-") chassisNumber = formatChassisNumber(altMatch[1], normalizedText);
      if (engineNumber === "-") engineNumber = formatEngineNumber(altMatch[2], normalizedText);
    }
  }

  if (engineNumber === "-") {
    const saEngineMatch = normalizedText.match(/Engine\s*Number\s*(?:No\s*&\s*)?([A-Z0-9]+)/i);
    if (saEngineMatch) engineNumber = saEngineMatch[1].trim();
  }
  if (chassisNumber === "-") {
    const saChassisMatch = normalizedText.match(/Chassis Number\s*([A-Z0-9]+)/i);
    if (saChassisMatch) chassisNumber = saChassisMatch[1].trim();
  }

  return { engineNumber, chassisNumber };
};

const extractMakeAndModel = (normalizedText) => {
  let make = "-";
  let model = "-";

  const mmMatch = normalizedText.match(/Make\s*\/\s*Model\s*([A-Z0-9\s&]+?)\s*\/\s*([A-Z0-9\s\-]+)/i);
  if (mmMatch) {
    make = mmMatch[1]?.replace(/Variant.*$/i, "").trim() || "-";
    model = formatModelName(mmMatch[2]?.replace(/Variant.*$/i, "").replace(/:.*$/i, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim() || "-");
  }
  
  if (make === "-" || model === "-") {
    const mmMatchAlt = normalizedText.match(/Make\/Model\s*:\s*([^\n]+)/i);
    if (mmMatchAlt?.[1]) {
      const mmText = mmMatchAlt[1];
      if (mmText.includes("/")) {
        const parts = mmText.split("/");
        make = parts[0].trim();
        model = formatModelName(parts[1].trim());
      } else {
        model = formatModelName(mmText.trim());
      }
    }
  }

  if (make === "-" || model === "-") {
    const saMakeModelMatch = normalizedText.match(/Vehicle Make & Model\s*([^\n]+?)(?=Type Of Body|AA Membership)/i);
    if (saMakeModelMatch) {
      const parts = saMakeModelMatch[1].split('&');
      if (make === "-") make = parts[0].trim();
      if (parts[1] && model === "-") {
        const rawModel = parts[1].trim();
        const tokens = rawModel.split(/\s+/);
        const half = Math.floor(tokens.length / 2);
        if (tokens.slice(0, half).join(' ') === tokens.slice(half).join(' ')) {
          model = tokens.slice(0, half).join(' ');
        } else {
          model = rawModel;
        }
      }
    }
  }

  return { make, model };
};

const extractVariantField = (normalizedText) => {
  let variantMatch = normalizedText.match(/\d*Variant\s*[:\-]?\s*([^\n]+?)(?=Year of manufacture|Type of body|Colour|Registration|$)/i);
  if (!variantMatch) variantMatch = normalizedText.match(/Variant\s*[:\-]?\s*([^\n]+?)(?=Year of manufacture|Type of body|Colour|Registration|$)/i);
  if (variantMatch?.[1]) return formatVariantName(variantMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim());
  
  const variantMatchAlt = normalizedText.match(/Variant\s*:\s*([^\n]+)/i);
  if (variantMatchAlt?.[1]) return formatVariantName(variantMatchAlt[1].trim());

  return "-";
};

const extractManufacturingYear = (normalizedText) => {
  const yearMatch = normalizedText.match(/Year of manufacture\s*[:\-]?\s*(\d{4})/i);
  if (yearMatch?.[1]) return yearMatch[1];
  
  const saYearMatch = normalizedText.match(/Year Of\s*Manufacture\s*(\d{4})/i);
  if (saYearMatch) return saYearMatch[1];

  return "-";
};

const extractFuelTypeField = (normalizedText) => {
  let fuelType = "-";
  
  let bodyFuelCombined = normalizedText.match(/Type of body\s*\/\s*Type of Fuel\s*:\s*([^\n]+?)(?=\s*Year of manufacture|\s*Colour|$)/i);
  if (!bodyFuelCombined || !bodyFuelCombined[1]) {
    bodyFuelCombined = normalizedText.match(/Type of body\s*\/\s*Type of Fuel\s*([A-Za-z]+\/[A-Za-z]+)/i);
    if (!bodyFuelCombined) bodyFuelCombined = normalizedText.match(/Type of Fuel\s*([A-Za-z]+\/[A-Za-z]+)/i);
  }
  
  if (bodyFuelCombined?.[1]) {
    let combinedText = bodyFuelCombined[1].trim().replace(/Cubic capacity.*$/i, '');
    const isElectric = /ELECTRIC/i.test(combinedText);
    const parts = combinedText.split("/");
    if (parts.length >= 2) {
      fuelType = isElectric ? "electric" : parts[parts.length - 1].trim();
    } else {
      fuelType = isElectric ? "electric" : combinedText.trim();
    }
  }

  if (fuelType.toUpperCase() === "ID") fuelType = "-";

  if (fuelType === "-") {
    let fuelMatch = normalizedText.match(/Type of fuel\s*:\s*([^\n]+?)(?=\s*Cubic|$)/i);
    if (!fuelMatch) fuelMatch = normalizedText.match(/Type of Fuel\s*[A-Za-z]+\/([A-Za-z]+)/i);
    if (fuelMatch?.[1]) fuelType = formatFuelType(fuelMatch[1].trim().replace(/Cubic.*$/i, ''));
    
    if (fuelType === "-" || fuelType.toUpperCase() === "ID") {
      const fuelMatchLast = normalizedText.match(/Type of fuel\s*:\s*([A-Za-z]+)/i);
      if (fuelMatchLast?.[1]) {
        fuelType = fuelMatchLast[1].trim();
      } else {
        const knownFuel = normalizedText.match(/\b(PETROL|DIESEL|CNG|LPG|ELECTRIC|HYBRID|BATTERY|EV)\b/i);
        if (knownFuel) fuelType = knownFuel[1].trim();
      }
    }
  }
  return fuelType;
};

const extractCubicCapacityField = (normalizedText) => {
  const ccMatch = normalizedText.match(/Cubic capacity\(cc\).*?(\d{2,5}\s*cc)/is);
  if (ccMatch?.[1]) return ccMatch[1].replace(/\s+/g, "").trim();

  const saCcMatch = normalizedText.match(/Cubic Capacity\/KW\s*(\d+)/i);
  if (saCcMatch) return saCcMatch[1];

  return "-";
};

const extractSeatingCapacityField = (normalizedText) => {
  const seatMatch = normalizedText.match(/Seating capacity including\s*Driver\s*(\d+)/is);
  if (seatMatch?.[1]) return seatMatch[1];

  const saSeatMatch = normalizedText.match(/Seating Capacity\(Including\s*SideCar\)\s*(\d+)/i);
  if (saSeatMatch) return saSeatMatch[1];

  return "-";
};

const extractGvwField = (normalizedText) => {
  let gvwMatch = normalizedText.match(/Gross Vehicle Weight\s*\(GVW\)\s*[:\-]?\s*(\d+)/i);
  if (!gvwMatch) gvwMatch = normalizedText.match(/GVW\s*[:\-]?\s*(\d+)/i);
  if (gvwMatch?.[1]) return gvwMatch[1];

  return "-";
};

const extractFinancierNameField = (normalizedText) => {
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
    return formatFinancierName(financierText);
  } 

  const finTableMatch = normalizedText.match(/Financier\s+([A-Z\s]+)/i);
  if (finTableMatch && finTableMatch[1]) {
    return formatFinancierName(finTableMatch[1].trim());
  } 

  const saFinMatch = normalizedText.match(/(?:Financier\s*.*?|Name of the Financier\s*:?\s*)([A-Z\s&]+(?:BANK|FINANCE|LTD|LIMITED)[^\(]*)/i);
  if (saFinMatch) return formatFinancierName(saFinMatch[1]);

  return "-";
};

const extractNcbField = (text) => {
  const cleanNcbText = (text || "").replace(/\u00a0/g, " ").replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
  const validNcbSlabs = ["50", "45", "35", "25", "20", "0"];

  const ncbGlobalRegex = /(?:No\s*Claim\s*Bonus|\bNCB\b)[^\d\n\r]{0,30}?(\d{1,2}(?:\.\d+)?)\s*%/gi;
  const matches = [...cleanNcbText.matchAll(ncbGlobalRegex)];

  let foundNcb = null;
  for (const match of matches) {
    if (match?.[1]) {
      const extractedNum = parseInt(match[1], 10).toString();
      if (validNcbSlabs.includes(extractedNum)) {
        foundNcb = `${extractedNum}%`;
        if (extractedNum !== "0") break;
      }
    }
  }

  if (!foundNcb || foundNcb === "0%") {
    const ncbFallbackRegex = /(?:No\s*Claim\s*Bonus|\bNCB\b)[^\d\n\r]{0,30}?(\d{1,2}(?:\.\d+)?)/gi;
    const fallbackMatches = [...cleanNcbText.matchAll(ncbFallbackRegex)];

    for (const match of fallbackMatches) {
      if (match?.[1]) {
        const extractedNum = parseInt(match[1], 10).toString();
        if (validNcbSlabs.includes(extractedNum)) {
          foundNcb = `${extractedNum}%`;
          if (extractedNum !== "0") break;
        }
      }
    }
  }

  return foundNcb || "0%";
};

// =======================================
// MASTER VEHICLE EXTRACTOR (REFACTORED)
// =======================================
const extractVehicleDetailsFromText = (text = "") => {
  let result = {
    registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-", model: "-",
    variant: "-", gvw: "-", manufacturingYear: "-", fuelType: "-",
    cubicCapacity: "-", seatingCapacity: "-", financierName: "-", ncb: "0%"
  };

  if (!text || typeof text !== "string") return result;

  const normalizedText = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");

  // 1. Try fetching via Table format first
  const tableData = extractTableVehicleDetails(normalizedText);

  // 2. Fetch standard fallback properties individually
  const stdReg = extractRegistrationNumber(normalizedText);
  const stdEngChas = extractEngineAndChassis(normalizedText);
  const stdMakeModel = extractMakeAndModel(normalizedText);
  const stdVariant = extractVariantField(normalizedText);
  const stdYear = extractManufacturingYear(normalizedText);
  const stdFuel = extractFuelTypeField(normalizedText);
  const stdCc = extractCubicCapacityField(normalizedText);
  const stdSeats = extractSeatingCapacityField(normalizedText);
  const stdGvw = extractGvwField(normalizedText);
  let stdFinancier = extractFinancierNameField(normalizedText);
  if (stdFinancier === "N/A") stdFinancier = "-"; // Cleanup fallback flag

  // 3. Merge data (Table data has priority over standard extraction if it exists)
  result = {
    registrationNumber: tableData?.registrationNumber || stdReg,
    chassisNumber: tableData?.chassisNumber || stdEngChas.chassisNumber,
    engineNumber: tableData?.engineNumber || stdEngChas.engineNumber,
    make: tableData?.make || stdMakeModel.make,
    model: tableData?.model || stdMakeModel.model,
    variant: tableData?.variant || stdVariant,
    gvw: tableData?.gvw || stdGvw,
    manufacturingYear: tableData?.manufacturingYear || stdYear,
    fuelType: tableData?.fuelType || stdFuel,
    cubicCapacity: tableData?.cubicCapacity || stdCc,
    seatingCapacity: tableData?.seatingCapacity || stdSeats,
    financierName: tableData?.financierName || stdFinancier,
    ncb: extractNcbField(text)
  };

  return result;
};

// =======================================
// EXTRACTION FUNCTIONS
// =======================================

const extractInsuranceCompanyName = (fullText = "") => {
  if (!fullText) return "-";
  const companyMatch = fullText.match(/UNITED\s*INDIA\s*INSURANCE\s*COMPANY\s*LIMITED/i);
  if (companyMatch) return "UNITED INDIA INSURANCE COMPANY LIMITED";
  const altMatch = fullText.match(/([A-Z\s]+ASSURANCE\s*COMPANY\s*LIMITED)/i);
  return altMatch ? altMatch[1].trim() : "-";
};

const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "-";
  let match = fullText.match(/Issuing Office Address\s+Code\s+\d+\s+(.*?\d{6})/i);
  if (match) {
    let address = match[1].trim()
      .replace(/\s+/g, ' ')          // collapse multiple spaces
      .replace(/,\s*$/, '');        // remove trailing comma
    return address || "-";
  }
  
  let altMatch = fullText.match(/(?:Mobile\s*:\s*[*0-9]+)\s+([\s\S]*?)(?=\s*,?\s*GST\s*No)/i);
  if (altMatch) {
    let address = altMatch[1].trim()
      .replace(/\s+/g, ' ')          
      .replace(/,\s*$/, '');        
    return address || "-";
  }

  return "-";
};

const extractInsuredDetails = (text) => {
  if (!text) return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };

  let insuredName = "-";

  // ----- NAME -----
  let nameMatch = text.match(/Insured Name\/ID\s*:\s*([^\/\n]+)(?:\/|$)/i);
  if (nameMatch && nameMatch[1]) insuredName = nameMatch[1].trim();
  if (insuredName === "-") {
    nameMatch = text.match(/Name of the Insured\s*:\s*([^\n]+)/i);
    if (nameMatch && nameMatch[1]) insuredName = nameMatch[1].trim().replace(/\/\d+$/, '').replace(/\s+\d+$/, '');
  }
  if (insuredName === "-") {
    nameMatch = text.match(/(?:MR|MRS|MS)\.?\s+([A-Z][A-Z\s]+?)(?=\s+(?:S\/O|C\/O|W\/O|D\/O|$|\n))/i);
    if (nameMatch && nameMatch[1]) insuredName = (nameMatch[0].match(/MR|MRS|MS/i)?.[0] || "") + " " + nameMatch[1].trim();
  }
  insuredName = insuredName.replace(/\s+\d+$/, '').replace(/\/\d+$/, '').trim();

  // ----- ADDRESS (fixed) -----
  let insuredAddress = "-";
  
  const multilineAddrMatch = text.match(/Insured address\s*:[\s\S]*?(HOUSE NO.*?Pincode:\s*\d{6})/is);
  if (multilineAddrMatch) {
    insuredAddress = multilineAddrMatch[1].replace(/\s+/g, ' ').replace(/,\s*$/, '').trim();
  } else {
    let addrMatch = text.match(/Address of the Insured\s*(?:\d+\s+)?(.*?\d{6})/i);
    if (addrMatch && addrMatch[1]) {
      insuredAddress = addrMatch[1].trim().replace(/\s+/g, ' ').replace(/,\s*$/, '');
    } else {
      const simpleMatch = text.match(/Address of the Insured\s*:?\s*([^\n]+)/i);
      if (simpleMatch && simpleMatch[1]) insuredAddress = simpleMatch[1].trim();
    }
  }

  // ----- CONTACT -----
  let contactMatch = text.match(/Mobile(?:\s*No\.?)?\s*[:\-]?\s*([0-9*]{8,15})/i);
  const contactNumber = contactMatch?.[1]?.trim() || "-";

  // ----- EMAIL -----
  let emailMatch = "-";
  const email = emailMatch || "-";

  // ----- PAN -----
  const panMatch = text.match(/PAN\/FORM\s*60:\s*([A-Z0-9]+)/i);
  const panNumber = panMatch?.[1] || "-";

  // ----- GSTIN -----
  let gstMatch = "-"  
  const gstin = gstMatch || "-";

  return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin };
};

const extractPolicyDates = (fullText = "") => {
  if (!fullText) {
    return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  }

  const startEndMatch = fullText.match(/Insurance Start Date & Time\s*:\s*(\d{2}\/\d{2}\/\d{4}).*?Insurance expiry Date & Time\s*:\s*(\d{2}\/\d{2}\/\d{4})/is);
  if (startEndMatch) {
    return {
      startDate: startEndMatch[1],
      odExpireDate: startEndMatch[2],
      tpExpireDate: startEndMatch[2]
    };
  }

  const bundledODMatch = fullText.match(/OD Cover\s*(\d{2}\/\d{2}\/\d{4})\s*\d{2}:\d{2}:\d{2}\s*(?:AM|PM)\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  const bundledTPMatch = fullText.match(/TP Cover\s*(\d{2}\/\d{2}\/\d{4})\s*\d{2}:\d{2}:\d{2}\s*(?:AM|PM)\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (bundledODMatch) {
    return {
      startDate: bundledODMatch[1] || "-",
      odExpireDate: bundledODMatch[2] || "-",
      tpExpireDate: bundledTPMatch?.[2] || bundledODMatch[2] || "-"
    };
  }

  const actFromMatch = fullText.match(
    /Act\s+from\s+\d{1,2}:\d{2}\s+(?:Hrs|HRS|hrs)?\s+on\s+(\d{2}\/\d{2}\/\d{4}).*?Date\s+of\s+Expiry\s+of\s+the\s+Insurance\s+Midnight\s+on\s+(\d{2}\/\d{2}\/\d{4})/is
  );
  if (actFromMatch) {
    return {
      startDate: actFromMatch[1],
      odExpireDate: actFromMatch[2],
      tpExpireDate: actFromMatch[2]  
    };
  }

  const periodInsuranceMatch = fullText.match(
    /Period\s+of\s+Insurance\s+From\s+\d{2}:\d{2}\s+(?:Hrs\s+of|HRS\s+OF|hrs\s+of)?\s*(\d{2}\/\d{2}\/\d{4})\s+To\s+Midnight\s+of\s+(\d{2}\/\d{2}\/\d{4})/is
  );
  if (periodInsuranceMatch) {
    return {
      startDate: periodInsuranceMatch[1],
      odExpireDate: periodInsuranceMatch[2],
      tpExpireDate: periodInsuranceMatch[2]
    };
  }

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

const extractDateOfIssue = (text = "") => {
  const match = text.match(/Date of Issue\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (match?.[1]) return match[1];

  let extMatch = text.match(/Date & Signature of Proposal\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (extMatch?.[1]) return extMatch[1];

  extMatch = text.match(/Receipt Date\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (extMatch?.[1]) return extMatch[1];

  extMatch = text.match(/Invoice No & Date.*?(?:&|:|\s)\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (extMatch?.[1]) return extMatch[1];

  return "-";
};

const extractIDV = (text = "") => {
  if (!text) return "-";
  
  const directMatch = text.match(/Insured's Declared Value\s*([\d,]+)/i);
  if (directMatch?.[1]) return directMatch[1].replace(/,/g, "");

  const newTableMatch = text.match(/Total\s+Co\s*-\s*Insurance\s+Details\s+([\d,]+)/i);
  if (newTableMatch?.[1]) return newTableMatch[1].replace(/,/g, "");
  
  const tableVehicleMatch = text.match(/INSURED DECLARED VALUE.*?\n\s*Vehicle\s+Trailer\s+Electrical\/Electronic Accessories\s+Non Electrical Accessories\s+CNG Kit\s+LPG Kit\s+Total\s+Co\s*-\s*Insurance\s+Details\s+([\d,]+)/is);
  if (tableVehicleMatch?.[1]) return tableVehicleMatch[1].replace(/,/g, "");
  
  const totalMatch = text.match(/Total\s+([\d,]+)/i);
  if (totalMatch?.[1]) return totalMatch[1].replace(/,/g, "");
  
  const individualCoverMatch = text.match(/For individual covers?\s*\(OD\)\s*in\s*RS?[:\s]*([\d,]+)/i);
  if (individualCoverMatch?.[1]) return individualCoverMatch[1].replace(/,/g, "");
  
  return "-";
};

const extractPreviousPolicyNumber = (text = "") => {
  let match = text.match(/Previous Policy No\s*[:]?\s*([A-Z0-9\/\-]*\d[A-Z0-9\/\-]*)/i);
  if (!match) {
    match = text.match(/Previous Policy Number\s*[:]?\s*([A-Z0-9\/\-]*\d[A-Z0-9\/\-]*)/i);
  }
  return match?.[1] || "-";
};

const extractPreviousInsurer = (text = "") => {
  const match = text.match(/Previous Insurer\s*[:]?\s*([^\n]+?)(?:\s*Previous Policy Number|$)/i);
  if (match?.[1]) {
    return match[1].replace(/Previous Policy Number.*$/i, "").replace(/\s+/g, " ").trim();
  }
  return "-";
};

const extractPremiumData = (text) => {
  const result = {
    totalOdPremium: "-", totalTpPremium: "-", netPremium: "-",
    gst: "-", totalPayable: "-", calculatedOdPremium: "-", calculatedTpPremium: "-"
  };
  if (!text) return result;

  const normalized = text.replace(/\r/g, "\n").replace(/\t/g, " ").replace(/[ ]+/g, " ");
  const cleanAmount = (val) => val ? val.replace(/,/g, "").trim() : "-";
  const extract = (patterns) => {
    for (const p of patterns) {
      const m = normalized.match(p);
      if (m && m[1]) return cleanAmount(m[1]);
    }
    return "-";
  };

  const isLiability = normalized.includes("LIABILITY ONLY") || normalized.includes("THIRD PARTY");

  if (!isLiability) {
    const od = extract([/Gross OD\s*([\d,]+(?:\.\d{2})?)/i, /Gross OD\(A\)\s*([\d,]+(?:\.\d{2})?)/i, /Basic premium on Vehicle\s*([\d,]+(?:\.\d{2})?)/i]);
    if (od !== "-") { result.totalOdPremium = od; result.calculatedOdPremium = od; }
  } else {
    result.totalOdPremium = "0";
    result.calculatedOdPremium = "0";
  }

  const tp = extract([/Gross TP\(B\)\s*([\d,]+(?:\.\d{2})?)/i, /Basic - TP\s*([\d,]+(?:\.\d{2})?)/i, /Premium\s*:\s*([\d,]+(?:\.\d{2})?)/i]);
  if (tp !== "-") { result.totalTpPremium = tp; result.calculatedTpPremium = tp; }

  let net = extract([/Premium\(A\+B\)\s*([\d,]+(?:\.\d{2})?)/i, /Premium\s*:\s*([\d,]+(?:\.\d{2})?)/i, /Gross OD\s*([\d,]+(?:\.\d{2})?)\s*Premium\s*([\d,]+(?:\.\d{2})?)/i]);
  if (net !== "-") result.netPremium = net;
  else if (result.totalOdPremium !== "-" && result.totalTpPremium !== "-") {
    const odNum = parseFloat(result.totalOdPremium);
    const tpNum = parseFloat(result.totalTpPremium);
    if (!isNaN(odNum) && !isNaN(tpNum)) result.netPremium = (odNum + tpNum).toFixed(2);
  } else if (result.totalOdPremium !== "-" && result.totalTpPremium === "-") {
    result.netPremium = result.totalOdPremium;
  }

  let gstVal = extract([/IGST\(18%\)\s*([\d,]+(?:\.\d{2})?)/i, /IGST\(18%\)\s*:\s*([\d,]+(?:\.\d{2})?)/i]);
  if (gstVal === "-") {
    const cgst = extract([/CGST\(9%\)\s*([\d,]+(?:\.\d{2})?)/i, /CGST\(9%\)\s*:\s*([\d,]+(?:\.\d{2})?)/i]);
    const sgst = extract([/SGST\(9%\)\s*([\d,]+(?:\.\d{2})?)/i, /SGST\(9%\)\s*:\s*([\d,]+(?:\.\d{2})?)/i]);
    if (cgst !== "-" && sgst !== "-") gstVal = (parseFloat(cgst) + parseFloat(sgst)).toFixed(2);
  }
  if (gstVal === "-") {
    const cest = extract([/CEST\(9%\)\s*([\d,]+(?:\.\d{2})?)/i, /CEST\(9%\)\s*:\s*([\d,]+(?:\.\d{2})?)/i]);
    const sest = extract([/SEST\(9%\)\s*([\d,]+(?:\.\d{2})?)/i, /SEST\(9%\)\s*:\s*([\d,]+(?:\.\d{2})?)/i]);
    if (cest !== "-" && sest !== "-") gstVal = (parseFloat(cest) + parseFloat(sest)).toFixed(2);
  }
  if (gstVal !== "-") result.gst = gstVal;

  let total = extract([/TOTAL PAYABLE PREMIUM\s*([\d,]+(?:\.\d{2})?)/i, /Total\s*\(Rounded\s*Off\)\s*:\s*([\d,]+(?:\.\d{2})?)/i]);
  if (total !== "-") result.totalPayable = total;
  else if (result.netPremium !== "-" && result.gst !== "-") {
    const np = parseFloat(result.netPremium);
    const g = parseFloat(result.gst);
    if (!isNaN(np) && !isNaN(g)) result.totalPayable = (np + g).toFixed(2);
  }

  return result;
};

// =======================================
// MAIN COMPONENT
// =======================================

function UnitedPolicyCard({ item }) {
  const [copied, setCopied] = useState(false);
  
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

  const vehicleCategory = getVehicleCategory(policy?.policyType, item?.fullText); 
  const productType = getProductType(policy?.policyType, item?.fullText); 
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

  const policyNumber = policy?.policyNumber || 
                       item?.fullText?.match(/Policy Number\s*:\s*(\S+)/i)?.[1] || 
                       item?.fullText?.match(/Policy No.\s+(\S+)/i)?.[1] || "-";

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
      vehicle={extractedVehicle} 
      extractedVehicle={extractedVehicle}
    />
  );
}

export default UnitedPolicyCard;