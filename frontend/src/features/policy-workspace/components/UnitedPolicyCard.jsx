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

const cleanUnitedRegistrationNumber = (value) => {
  if (!value || value === "-") return "-";
  return removeHyphens(String(value).replace(/\s+/g, "")).toUpperCase();
};

const formatModelName = (model) => {
  let cleaned = formatGenericField(model, [/Registration\s*no\.?/i, /Variant/i, /Colour/i, /Year/i, /Type of body/i]);
  return removeHyphens(cleaned);
};

const formatVariantName = (variant) => formatGenericField(variant, [/Gvw/i, /GVW/i, /Year of manufacture/i, /Type of body/i, /Colour/i, /Registration/i]);

const splitUnitedModelVariant = (value = "") => {
  const cleaned = cleanValue(value).replace(/\s+null$/i, "");
  if (cleaned === "-") return { model: "-", variant: "-" };

  const withoutYearRange = cleaned.replace(/\s*\(\s*(?:19|20)\d{2}\s*-\s*(?:19|20)\d{2}\s*\)\s*/i, " ").replace(/\s+/g, " ").trim();
  const variantMatch = withoutYearRange.match(/^(.+?)\s+((?:MAGNA|SPORTZ|ASTA|ERA|D-LITE|LXI|VXI|ZXI|STD|DX|LX|LS|VX|GL|GLE|GLS|GX|GXI)\b.*)$/i);
  if (variantMatch) {
    return {
      model: cleanValue(variantMatch[1]).toUpperCase(),
      variant: cleanValue(variantMatch[2]).toUpperCase(),
    };
  }

  return { model: withoutYearRange.toUpperCase(), variant: "-" };
};

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

  const oldPrivateCarLiabilityRowMatch = normalizedText.match(
    /\b([A-Z]{2})\s*-\s*(\d{1,2})\s*-\s*([A-Z]{1,3})\s*-\s*(\d{3,4})\s+(?:Yes|No)\s+([A-Z0-9]+)\s+([A-Z0-9]+)\s+([A-Z][A-Z\s&]+?)\s*\/\s*([A-Z0-9\s]+?)\s*(?:\((Petrol|Diesel|CNG|LPG|Electric)\))?\s+(Saloon|Sedan|Hatch\s*Back|SUV|MUV|Jeep|Van|Goods\s+Carrier)\s+(20\d{2}|19\d{2})\s+(\d{2,5})\s+(\d{1,2})\b/i
  );

  if (oldPrivateCarLiabilityRowMatch) {
    const modelTokens = oldPrivateCarLiabilityRowMatch[8].replace(/\s+/g, " ").trim().split(/\s+/);
    const variantToken = modelTokens.length > 1 ? modelTokens.pop() : "";

    result.registrationNumber = removeHyphens(`${oldPrivateCarLiabilityRowMatch[1]}-${oldPrivateCarLiabilityRowMatch[2]}-${oldPrivateCarLiabilityRowMatch[3]}-${oldPrivateCarLiabilityRowMatch[4]}`);
    result.engineNumber = oldPrivateCarLiabilityRowMatch[5].trim();
    result.chassisNumber = oldPrivateCarLiabilityRowMatch[6].trim();
    result.make = oldPrivateCarLiabilityRowMatch[7].replace(/\s+/g, " ").trim();
    result.model = modelTokens.join(" ").trim() || oldPrivateCarLiabilityRowMatch[8].replace(/\s+/g, " ").trim();
    result.variant = variantToken || "-";
    result.fuelType = oldPrivateCarLiabilityRowMatch[9]?.toUpperCase() || "-";
    result.manufacturingYear = oldPrivateCarLiabilityRowMatch[11].trim();
    result.cubicCapacity = oldPrivateCarLiabilityRowMatch[12].trim();
    result.seatingCapacity = oldPrivateCarLiabilityRowMatch[13].trim();
    return result;
  }

  const liabilityCarRowMatch = normalizedText.match(
    /Particulars\s+of\s+Vehicle\s+Insured\s+Registration\s+No\.\s+Obsolete\s+Vehicle\s+Engine\s+No\.\s+Chassis\s+No\.\s+Make\/Model\s+Type\s+of\s+Body\s+Year\s+of\s+Mfg\s+Cubic\s+Capacity\/KW\s+Seating\s+including\s+driver\s+Vehicle\s+Trailer\s+\(if\s+any\)\s+([A-Z]{2})\s*-\s*(\d{2})\s*-\s*([A-Z]{1,3})\s*-\s*(\d{4})\s+(?:Yes|No)\s+([A-Z0-9]+)\s+([A-Z0-9]+)\s+(.+?)\s*\/\s*(.+?)\s+(?:null|NA|-)?\s*(Saloon|Sedan|Hatch\s*Back|SUV|MUV|Jeep|Van|Goods\s+Carrier)\s+(20\d{2}|19\d{2})\s+(\d{2,5})\s+(\d{1,2})\b/i
  );

  if (liabilityCarRowMatch) {
    result.registrationNumber = removeHyphens(`${liabilityCarRowMatch[1]}-${liabilityCarRowMatch[2]}-${liabilityCarRowMatch[3]}-${liabilityCarRowMatch[4]}`);
    result.engineNumber = liabilityCarRowMatch[5].trim();
    result.chassisNumber = liabilityCarRowMatch[6].trim();
    result.make = liabilityCarRowMatch[7].replace(/\s+/g, " ").trim();
    const modelVariantText = liabilityCarRowMatch[8].replace(/\s+/g, " ").trim();
    const modelVariantMatch = modelVariantText.match(/^(.+?)\s+(GL|GLE|GLS|LX|LXI|VX|VXI|ZXI|ZX|DX|DLX|STD)$/i);
    result.model = modelVariantMatch?.[1]?.trim() || modelVariantText;
    result.variant = modelVariantMatch?.[2]?.trim().toUpperCase() || "-";
    result.manufacturingYear = liabilityCarRowMatch[10].trim();
    result.cubicCapacity = liabilityCarRowMatch[11].trim();
    result.seatingCapacity = liabilityCarRowMatch[12].trim();
    return result;
  }

  const liabilityCertificateRowMatch = normalizedText.match(
    /Particulars\s+of\s+Vehicle\s+Insured[\s\S]{0,500}?([A-Z]{2})\s*-\s*(\d{2})\s*-\s*([A-Z]{1,3})\s*-\s*(\d{3,4})\s+(?:Yes|No)\s+([A-Z0-9]+)\s+([A-Z0-9]+)\s+([A-Z ]+?)\s*\/\s*([A-Z0-9]+)\s+(?:null\s+)?([A-Z]+)\s+(19\d{2}|20\d{2})\s+([\d.]+)\s+(\d+)/i
  );

  if (liabilityCertificateRowMatch) {
    result.registrationNumber = cleanUnitedRegistrationNumber(`${liabilityCertificateRowMatch[1]}${liabilityCertificateRowMatch[2]}${liabilityCertificateRowMatch[3]}${liabilityCertificateRowMatch[4]}`);
    result.engineNumber = liabilityCertificateRowMatch[5].trim();
    result.chassisNumber = liabilityCertificateRowMatch[6].trim();
    result.make = liabilityCertificateRowMatch[7].replace(/\s+/g, " ").trim();
    result.model = liabilityCertificateRowMatch[8].trim();
    result.variant = "-";
    result.manufacturingYear = liabilityCertificateRowMatch[10].trim();
    result.cubicCapacity = liabilityCertificateRowMatch[11].trim();
    result.seatingCapacity = liabilityCertificateRowMatch[12].trim();
    result.fuelType = "-";
    return result;
  }

  const flexibleLiabilityCertificateRowMatch = normalizedText.match(
    /Particulars\s+of\s+Vehicle\s+Insured[\s\S]{0,650}?([A-Z]{2})\s*-\s*(\d{2})\s*-\s*([A-Z]{1,3})\s*-\s*(\d{3,4})\s+(?:Yes|No)\s+([A-Z0-9]+)\s+([A-Z0-9]+)\s+([A-Z ]+?)\s*\/\s*(.+?)\s+(?:null\s+)?(CAR|SUV|MUV|VAN|SEDAN|HATCH\s*BACK)\s+(19\d{2}|20\d{2})\s+([\d.]+)\s+(\d+)/i
  );

  if (flexibleLiabilityCertificateRowMatch) {
    const modelVariant = splitUnitedModelVariant(flexibleLiabilityCertificateRowMatch[8]);
    result.registrationNumber = cleanUnitedRegistrationNumber(`${flexibleLiabilityCertificateRowMatch[1]}${flexibleLiabilityCertificateRowMatch[2]}${flexibleLiabilityCertificateRowMatch[3]}${flexibleLiabilityCertificateRowMatch[4]}`);
    result.engineNumber = flexibleLiabilityCertificateRowMatch[5].trim();
    result.chassisNumber = flexibleLiabilityCertificateRowMatch[6].trim();
    result.make = flexibleLiabilityCertificateRowMatch[7].replace(/\s+/g, " ").trim();
    result.model = modelVariant.model;
    result.variant = modelVariant.variant;
    result.manufacturingYear = flexibleLiabilityCertificateRowMatch[10].trim();
    result.cubicCapacity = flexibleLiabilityCertificateRowMatch[11].trim();
    result.seatingCapacity = flexibleLiabilityCertificateRowMatch[12].trim();
    result.fuelType = "-";
    return result;
  }

  const scheduleRowMatch = normalizedText.match(
    /Registration\s+No\.\s+Obsolete\s+Vehicle\s+Engine\s+No\.\s+Chassis\s+No\.\s+Make\/Model\s+Year\s+of\s+Mfg\s+Vehicle\s+Trailer\s+\(if\s+any\)\s+([A-Z]{2})\s*-\s*(\d{2})\s*-\s*([A-Z]{1,3})\s*-\s*(\d{4})\s+No\s+([A-Z0-9]+)\s+([A-Z0-9]+)\s+(.+?)\s*\/\s*(.+?)\s+(20\d{2}|19\d{2})\s+Type\s+of\s+Body\s+HP\/Cubic\s+Capacity\s+GVW\s+Seating\s+Capacity\s+Public\/Private\s+([A-Z\s]+?)\s+(\d{2,5})\s+(\d{2,6})\s+(\d{1,2})\s+(Public|Private)\b/i
  );

  if (scheduleRowMatch) {
    result.registrationNumber = removeHyphens(`${scheduleRowMatch[1]}-${scheduleRowMatch[2]}-${scheduleRowMatch[3]}-${scheduleRowMatch[4]}`);
    result.engineNumber = scheduleRowMatch[5].trim();
    result.chassisNumber = scheduleRowMatch[6].trim();
    result.make = scheduleRowMatch[7].replace(/\s+/g, " ").trim();
    const modelVariantText = scheduleRowMatch[8].replace(/\s+/g, " ").trim();
    const modelVariantMatch = modelVariantText.match(/^(.+?\s+XTRA)\s+(.+)$/i);
    result.model = modelVariantMatch?.[1]?.trim() || modelVariantText;
    result.variant = modelVariantMatch?.[2]?.trim() || "-";
    result.manufacturingYear = scheduleRowMatch[9].trim();
    result.cubicCapacity = scheduleRowMatch[11].trim();
    result.gvw = scheduleRowMatch[12].trim();
    result.seatingCapacity = scheduleRowMatch[13].trim();
    return result;
  }

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
            .replace(/HATCH\s*BACK/i, "")
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

        let model = `${dataMatch[8]} ${dataMatch[9]}`.trim().replace(/\s+/g, " ");
        result.manufacturingYear = dataMatch[10].trim();
        result.cubicCapacity = dataMatch[11].trim();
        result.seatingCapacity = dataMatch[12].trim();

        const variantMatch = model.match(/(\([\d\s\-]+\)(?:\s*[A-Z0-9\.\s]+)?)/);
        if (variantMatch) {
          result.variant = variantMatch[1]
            .replace(/HATCH\s*BACK/i, "")
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

  const gcvPublicCarrierMatch = normalizedText.match(
    /Registration\s+No\.\s+Obsolete\s+Vehicle\s+Engine\s+No\.\s+Chassis\s+No\.\s+Make\/Model\s+Type\s+of\s+Body\s+Year\s+of\s+Mfg\s+HP\/Cubic\s+Capacity\s+GVW[\s\S]{0,700}?([A-Z]{2})\s*-\s*(\d{2})\s*-\s*([A-Z]{1,2})\s*-\s*(\d{3,4})\s+No\s+([A-Z0-9]+)\s+([A-Z0-9]+)\s+([A-Za-z ]+?)\s*\/\s*([A-Z0-9 ]+?)\s+(PIK[_\s-]?UP|PICK[_\s-]?UP|OPEN\s+BODY|CLOSED\s+BODY|GOODS\s+CARRIER)\s+(20\d{2}|19\d{2})\s+(\d{2,5})\s+(\d{2,6})/i
  );

  if (gcvPublicCarrierMatch) {
    const modelTokens = gcvPublicCarrierMatch[8].replace(/\s+/g, " ").trim().split(/\s+/);
    const knownFuel = ["CNG", "PETROL", "DIESEL", "LPG", "ELECTRIC"];
    const fuelToken = knownFuel.includes(modelTokens[modelTokens.length - 1]?.toUpperCase())
      ? modelTokens.pop().toUpperCase()
      : "-";
    const variant = modelTokens.length > 2 ? modelTokens.pop() : "-";

    result.registrationNumber = removeHyphens(`${gcvPublicCarrierMatch[1]}-${gcvPublicCarrierMatch[2]}-${gcvPublicCarrierMatch[3]}-${gcvPublicCarrierMatch[4]}`);
    result.engineNumber = gcvPublicCarrierMatch[5].trim();
    result.chassisNumber = gcvPublicCarrierMatch[6].trim();
    result.make = gcvPublicCarrierMatch[7].replace(/\s+/g, " ").trim();
    result.model = modelTokens.join(" ").trim() || gcvPublicCarrierMatch[8].replace(/\s+/g, " ").trim();
    result.variant = variant;
    result.fuelType = fuelToken;
    result.manufacturingYear = gcvPublicCarrierMatch[10].trim();
    result.cubicCapacity = gcvPublicCarrierMatch[11].trim();
    result.gvw = gcvPublicCarrierMatch[12].trim();

    const seatMatch = normalizedText.match(/Registration\s+Authority\s+Geographical\s+Area\s+Financier\s+Seating\s+Capacity\s+Public\s*\/\s*Private\s+[A-Z0-9\s]+?\s+INDIA\s+(\d{1,3})\s+Public/i) ||
      normalizedText.match(/Cubic\s+Capacity\/Seating\s+Capacity\s+\d+\s*\/\s*(\d{1,3})/i);
    if (seatMatch?.[1]) result.seatingCapacity = seatMatch[1];

    const gvw = Number(result.gvw);
    if (Number.isFinite(gvw) && gvw > 0 && gvw <= 2500) {
      result.commercialVehicleType = "GCV-Public(upto-2.5T)";
    }

    return result;
  }

  const pcvThreeWheelerMatch = normalizedText.match(
    /VEHICLE\s+DETAILS\s+Registration\s+Number\s+([A-Z]{2})\s*-\s*(\d{2})\s*-\s*([A-Z]{1,3})\s*-\s*(\d{3,4})\s+Obsolete\s+Vehicle\s*&\s+Engine\s+Number\s+No\s*&\s*([A-Z0-9]+)\s+Year\s+Of\s+Manufacture\s+(20\d{2}|19\d{2})[\s\S]{0,250}?Chassis\s+Number\s+([A-Z0-9]+)\s+Cubic\s+Capacity\s+(\d{2,5})[\s\S]{0,250}?Vehicle\s+Make\s*&\s*Model\s+(.+?)\s+Type\s+Of\s+Body\s+([A-Z_ ]+)\s+Carrying\s+Capacity\s+(\d{1,3})\s+GVW\s+(\d{2,6})/i
  );

  if (pcvThreeWheelerMatch) {
    const makeModelText = pcvThreeWheelerMatch[9].replace(/\s+/g, " ").trim();
    const [rawMake, rawModel = ""] = makeModelText.split(/\s*&\s*/);
    const modelTokens = rawModel.trim().split(/\s+/).filter(Boolean);
    const knownFuel = ["CNG", "PETROL", "DIESEL", "LPG", "ELECTRIC"];
    const fuelToken = knownFuel.includes(modelTokens[modelTokens.length - 1]?.toUpperCase())
      ? modelTokens.pop().toUpperCase()
      : "-";
    const variant = modelTokens.length > 2 ? modelTokens.pop() : "-";

    result.registrationNumber = removeHyphens(`${pcvThreeWheelerMatch[1]}-${pcvThreeWheelerMatch[2]}-${pcvThreeWheelerMatch[3]}-${pcvThreeWheelerMatch[4]}`);
    result.engineNumber = pcvThreeWheelerMatch[5].trim();
    result.manufacturingYear = pcvThreeWheelerMatch[6].trim();
    result.chassisNumber = pcvThreeWheelerMatch[7].trim();
    result.cubicCapacity = pcvThreeWheelerMatch[8].trim();
    result.make = (rawMake || "-").trim();
    result.model = modelTokens.join(" ").trim() || rawModel.trim() || "-";
    result.variant = variant;
    result.fuelType = fuelToken;
    result.seatingCapacity = pcvThreeWheelerMatch[11].trim();
    result.gvw = pcvThreeWheelerMatch[12].trim();
    result.commercialVehicleType = "Three Wheeler - PCV - UPTO 6 PASS";

    return result;
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
  const tableRowMatch = normalizedText.match(
    /([A-Z\s&]+?)\s*\/\s*([A-Z0-9\s\(\)\-\.]+?)\s+([A-Z0-9]{2,12})\s+(?:Saloon|Hatch\s*back|Sedan|SUV|MUV|Station\s*Wagon|Open\s*Body|Closed\s*Body)\s+(?:19|20)\d{2}\s+\d{2,5}\s+\d{1,2}/i
  );

  if (tableRowMatch) {
    return { 
      make: tableRowMatch[1].trim(), 
      model: tableRowMatch[2].trim()
    };
  }

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
  const tableRowMatch = normalizedText.match(
    /[A-Z\s&]+?\s*\/\s*[A-Z0-9\s\(\)\-\.]+?\s+([A-Z0-9]{2,12})\s+(?:Saloon|Hatch\s*back|Sedan|SUV|MUV|Station\s*Wagon|Open\s*Body|Closed\s*Body)\s+(?:19|20)\d{2}\s+\d{2,5}\s+\d{1,2}/i
  );

  if (tableRowMatch) {
    return tableRowMatch[1].trim();
  }

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

  const uiYearMatch = normalizedText.match(/Year Of Manufacture[\s\S]{0,50}?(?:Weight\s*\(?Kg\.?\)?\s*)?(\d{4})/i);
  if (uiYearMatch?.[1]) {
     const year = parseInt(uiYearMatch[1], 10);
     if (year >= 1900 && year <= new Date().getFullYear() + 1) {
         return uiYearMatch[1];
     }
  }

  return "-";
};

const extractCubicCapacityField = (normalizedText) => {
  const ccMatch = normalizedText.match(/Cubic capacity\(cc\).*?(\d{2,5}\s*cc)/is);
  if (ccMatch?.[1]) return ccMatch[1].replace(/\s+/g, "").trim();

  const saCcMatch = normalizedText.match(/Cubic Capacity\/KW\s*(\d+)/i);
  if (saCcMatch) return saCcMatch[1];

  return "-";
};

const extractSeatingCapacityField = (normalizedText) => {
  const seatMatch = normalizedText.match(/Seating capacity\s*\(?including\s*Driver\)?\s*[:\-]?\s*(\d+)/is);
  if (seatMatch?.[1]) return seatMatch[1];

  const saSeatMatch = normalizedText.match(/Seating Capacity\(Including\s*SideCar\)\s*(\d+)/i);
  if (saSeatMatch) return saSeatMatch[1];

  const unitedSeatMatch = normalizedText.match(/Seating\s+Capacity\s*\(Including\s+Driver\)\s*(\d+)/i);
  if (unitedSeatMatch) return unitedSeatMatch[1];

  return "-";
};

const extractGvwField = (normalizedText) => {
  let gvwMatch = normalizedText.match(/Gross Vehicle Weight\s*\(GVW\)\s*[:\-]?\s*(\d+)/i);
  if (!gvwMatch) gvwMatch = normalizedText.match(/GVW\s*[:\-]?\s*(\d+)/i);
  if (gvwMatch?.[1]) return gvwMatch[1];

  return "-";
};

const extractFinancierNameField = (normalizedText) => {
  const financierTableMatch = normalizedText.match(
    /Financier\s+Name\s+Branch\s+Agreement\s+Type\s+([A-Z0-9 &.]+?(?:BANK|FINANCE|FINSERV|LTD|LIMITED)[A-Z0-9 &.]*)\s+[A-Z ]+\s+Hypothecation/i
  );
  if (financierTableMatch?.[1]) {
    return formatFinancierName(financierTableMatch[1]);
  }

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

  const finTableMatch = normalizedText.match(/Financier\s+(.*?)(?=\s*Policy\s+Subject\s+to\s+IMT|\s*Applicable\s+Addon)/i);
  if (finTableMatch) {
     const val = finTableMatch[1].trim();
     if (val && val.length > 2 && !/^Policy\s*Subject/i.test(val)) {
         return formatFinancierName(val);
     }
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
    variant: "-", gvw: "-", manufacturingYear: "-", fuelType: "-", commercialVehicleType: "-",
    cubicCapacity: "-", seatingCapacity: "-", financierName: "-", ncb: "0%"
  };

  if (!text || typeof text !== "string") return result;

  const normalizedText = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");

  const tableData = extractTableVehicleDetails(normalizedText);

  const stdReg = extractRegistrationNumber(normalizedText);
  const stdEngChas = extractEngineAndChassis(normalizedText);
  const stdMakeModel = extractMakeAndModel(normalizedText);
  const stdVariant = extractVariantField(normalizedText);
  const stdYear = extractManufacturingYear(normalizedText);
  const stdCc = extractCubicCapacityField(normalizedText);
  const stdSeats = extractSeatingCapacityField(normalizedText);
  const stdGvw = extractGvwField(normalizedText);
  let stdFinancier = extractFinancierNameField(normalizedText);
  if (stdFinancier === "N/A") stdFinancier = "-";

  result = {
    registrationNumber: tableData?.registrationNumber || stdReg,
    chassisNumber: tableData?.chassisNumber || stdEngChas.chassisNumber,
    engineNumber: tableData?.engineNumber || stdEngChas.engineNumber,
    make: tableData?.make || stdMakeModel.make,
    model: tableData?.model || stdMakeModel.model,
    variant: tableData?.variant || stdVariant,
    gvw: tableData?.gvw || stdGvw,
    manufacturingYear: tableData?.manufacturingYear || stdYear,
    fuelType: tableData?.fuelType || "-", // HARDCODED FUEL TYPE REMOVAL
    cubicCapacity: tableData?.cubicCapacity || stdCc,
    seatingCapacity: tableData?.seatingCapacity || stdSeats,
    financierName: tableData?.financierName || stdFinancier,
    commercialVehicleType: tableData?.commercialVehicleType || "-",
    ncb: extractNcbField(text)
  };

  const unitedScheduleText = normalizedText.replace(/\s+/g, " ");
  const unitedLiabilityVehicleMatch = unitedScheduleText.match(
    /Registration\s+Number\s*([A-Z]{2}\s*-\s*\d{2}\s*-\s*[A-Z]{1,3}\s*-\s*\d{3,4})[\s\S]{0,120}?Engine\s+Number\s+(?:Yes|No)?\s*&\s*([A-Z0-9]+)[\s\S]{0,220}?Chassis\s+Number\s+([A-Z0-9]+)[\s\S]{0,220}?Vehicle\s+Make\s*&\s*Model\s+(.+?)\s+Type\s+Of\s+Body\s+([A-Z]+)[\s\S]{0,180}?Year\s+Of\s+Manufacture[\s\S]{0,80}?(\d{4})[\s\S]{0,180}?Cubic\s+Capacity\/KW\s*([\d.]+)[\s\S]{0,220}?Seating\s+Capacity\s*\(Including\s+Driver\)\s*(\d+)/i
  );
  if (unitedLiabilityVehicleMatch) {
    result.registrationNumber = cleanUnitedRegistrationNumber(unitedLiabilityVehicleMatch[1]);
    result.engineNumber = unitedLiabilityVehicleMatch[2].trim();
    result.chassisNumber = unitedLiabilityVehicleMatch[3].trim();
    const makeModelParts = unitedLiabilityVehicleMatch[4].replace(/\s+/g, " ").trim().split(/\s*&\s*/);
    result.make = makeModelParts[0]?.trim() || result.make;
    result.model = makeModelParts[1]?.replace(/\s+null$/i, "").trim() || result.model;
    result.variant = "-";
    result.manufacturingYear = unitedLiabilityVehicleMatch[6].trim();
    result.cubicCapacity = unitedLiabilityVehicleMatch[7].trim();
    result.seatingCapacity = unitedLiabilityVehicleMatch[8].trim();
    result.fuelType = "-";
  }

  const unitedMiscScheduleMatch = unitedScheduleText.match(
    /Registration\s+Number\s*([A-Z]{2}\s*-\s*\d{2}\s*-\s*[A-Z]{1,3}\s*-\s*\d{3,4})[\s\S]{0,160}?Chassis\s+Number\s+(?:Yes|No)?\s*&\s*([A-Z0-9]+)[\s\S]{0,160}?Gross\s+vehicle\s+Weight\s*(\d+)[\s\S]{0,220}?Vehicle\s+Make\s*&\s*Model\s+(.+?)\s+Type\s+Of\s+Body\/Vehicle\s+(.+?)\s+Registration\s+Date[\s\S]{0,120}?Cubic\s+Capacity\/Seating\s+Capacity\s*([\d.]+)\s*\/\s*(\d+)[\s\S]{0,160}?Engine\s+Number\s*([A-Z0-9]+)\s*Year\s+Of\s+Manufacture\s*(\d{4})/i
  );
  if (unitedMiscScheduleMatch) {
    const makeModelParts = unitedMiscScheduleMatch[4]
      .replace(/\s+null$/i, "")
      .replace(/\s+/g, " ")
      .trim()
      .split(/\s*&\s*/);

    result.registrationNumber = cleanUnitedRegistrationNumber(unitedMiscScheduleMatch[1]);
    result.chassisNumber = unitedMiscScheduleMatch[2].trim();
    result.gvw = unitedMiscScheduleMatch[3].trim();
    result.make = makeModelParts.slice(0, -1).join(" & ").trim() || makeModelParts[0]?.trim() || result.make;
    result.model = makeModelParts.length > 1 ? makeModelParts[makeModelParts.length - 1].trim() : result.model;
    result.variant = "-";
    result.commercialVehicleType = cleanValue(unitedMiscScheduleMatch[5]);
    result.cubicCapacity = unitedMiscScheduleMatch[6].trim();
    result.seatingCapacity = unitedMiscScheduleMatch[7].trim();
    result.engineNumber = unitedMiscScheduleMatch[8].trim();
    result.manufacturingYear = unitedMiscScheduleMatch[9].trim();
    result.fuelType = "-";
  }

  if (result.model && result.model !== "-") {
    const seatingVariantMatch = result.model.match(/\s*(?:\(\s*\d{4}\s*-\s*\)\s*)?(\d+\s*STR)\s*$/i);
    if (seatingVariantMatch) {
      result.model = result.model
        .replace(/\s*(?:\(\s*\d{4}\s*-\s*\)\s*)?\d+\s*STR\s*$/i, "")
        .replace(/\s+/g, " ")
        .trim() || "-";
      if (result.variant === "-") {
        result.variant = seatingVariantMatch[1].replace(/\s+/g, " ").toUpperCase();
      }
    }
  }

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
  const normalizedText = fullText.replace(/\s+/g, " ").trim();

  const headerBranchMatch = normalizedText.match(
    /UNITED\s+INDIA\s+INSURANCE\s+COMPANY\s+LIMITED\s+(.+?\d{6}\s+MADHYA\s+PRADESH)\s+PH\s*:/i
  );
  if (headerBranchMatch?.[1]) {
    return headerBranchMatch[1].replace(/\s+/g, " ").trim();
  }

  let match = fullText.match(/Issuing Office Address\s*Code\s+\d+\s+([\s\S]*?\d{6}(?:\s+BHOPAL\s+MADHYA\s+PRADESH)?)(?=\s+Telephone|$)/i);
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

  match = normalizedText.match(/Policy\s+Issuing\s+Office\s+Address\s*:?\s*(NO\..+?Pincode\s*:\s*\d{6})\s+Telephone/i);
  if (match?.[1]) {
    return match[1]
      .replace(/\s*,?\s*GST\s+No\.?:-.*$/i, "")
      .replace(/\s*City\s*:/i, ", City:")
      .replace(/\s*District\s*:/i, ", District:")
      .replace(/\s*State\s*:/i, ", State:")
      .replace(/\s*Pincode\s*:/i, ", Pincode:")
      .replace(/\s+/g, " ")
      .replace(/,\s*,/g, ",")
      .trim();
  }

  return "-";
};

const extractInsuredDetails = (text) => {
  if (!text) return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };

  const normalizedText = text.replace(/\s+/g, " ").trim();
  let insuredName = "-";

  // ----- NAME -----
  let nameMatch = text.match(/Insured Name\/ID\s*:\s*([^\/\n]+)(?:\/|$)/i);
  if (nameMatch && nameMatch[1]) insuredName = nameMatch[1].trim();
  if (insuredName === "-") {
    nameMatch = text.match(/Name\s+of\s+the\s+Insured\s*([^\n\r]+)/i);
    if (nameMatch?.[1]) insuredName = nameMatch[1].replace(/\s+/g, " ").trim();
  }
  if (insuredName === "-") {
    nameMatch = normalizedText.match(/Insured\s+Details\s+Customer\s+Id\s+\d+\s+Name\s+((?:MR|MRS|MS)\.?\s+[A-Z][A-Z\s]+?)\s+Tel\b/i) ||
                normalizedText.match(/\bInsured\s+((?:MR|MRS|MS)\.?\s+[A-Z][A-Z\s]+?)\s+(WARD|HOUSE|GRAM|VILLAGE|FLAT|PLOT|H\s*NO|S\/O)\b(.+?)\s+CONTACT\s+NUMBER\s*:/i);
    if (nameMatch?.[1]) insuredName = nameMatch[1].replace(/\s+/g, " ").trim();
  }
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
  const coverPageInsuredMatch = normalizedText.match(
    /\bInsured\s+((?:MR|MRS|MS)\.?\s+[A-Z][A-Z\s]+?)\s+(WARD|HOUSE|GRAM|VILLAGE|FLAT|PLOT|H\s*NO|S\/O)\b(.+?)\s+CONTACT\s+NUMBER\s*:/i
  );
  if (coverPageInsuredMatch?.[2] && coverPageInsuredMatch?.[3]) {
    insuredAddress = `${coverPageInsuredMatch[2]}${coverPageInsuredMatch[3]}`.replace(/\s+/g, " ").trim();
  }

  const multilineAddrMatch = insuredAddress === "-" ? text.match(/Insured address\s*:[\s\S]*?(HOUSE NO.*?Pincode:\s*\d{6})/is) : null;
  if (multilineAddrMatch) {
    insuredAddress = multilineAddrMatch[1].replace(/\s+/g, ' ').replace(/,\s*$/, '').trim();
  } else {
    let addrMatch = text.match(/Address of the\s+Insured\s*(?:\d+\s+)?([\s\S]*?\d{6}(?:\s+[A-Z ]+){0,2})/i);
    if (addrMatch && addrMatch[1]) {
      insuredAddress = addrMatch[1]
        .replace(/\s*(?:Business(?:\/Occupation)?|Mobile\s+No\.?|Certificate\s+Number|Issuing\s+Office).*$/i, "")
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/,\s*$/, '');
    } else {
      const simpleMatch = text.match(/Address of the Insured\s*:?\s*([^\n]+)/i);
      if (simpleMatch && simpleMatch[1]) insuredAddress = simpleMatch[1].trim();
    }
  }

  const unitedScheduleAddrMatch = text.match(/Insured address\s*:?\s*([\s\S]+?Pincode\s*:\s*\d{6})\s+Telephone/i);
  if (unitedScheduleAddrMatch?.[1]) {
    insuredAddress = unitedScheduleAddrMatch[1]
      .replace(/Policy\s+Issuing\s+Office\s+Address\s*:?\s*/i, "")
      .replace(/\s*City\s*:/i, ", City:")
      .replace(/\s*District\s*:/i, ", District:")
      .replace(/\s*State\s*:/i, ", State:")
      .replace(/\s*Pincode\s*:/i, ", Pincode:")
      .replace(/\s+/g, " ")
      .replace(/,\s*,/g, ",")
      .trim();
  }

  // ----- CONTACT -----
  let contactMatch = text.match(/Mobile(?:\s*No\.?)?\s*[:\-]?\s*([0-9*]{8,15})/i);
  const contactNumber = contactMatch?.[1]?.trim() || "-";

  // ----- EMAIL -----
  const emailMatch = text.match(/Email\s+([*A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  const email = emailMatch?.[1] || "-";

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

  if (/LIABILITY\s+ONLY\s+POLICY/i.test(text)) return "0";
  
  const totalMatch = text.match(/Total\s+([\d,]+)/i);
  if (totalMatch?.[1]) return totalMatch[1].replace(/,/g, "");
  
  const individualCoverMatch = text.match(/For individual covers?\s*\(OD\)\s*in\s*RS?[:\s]*([\d,]+)/i);
  if (individualCoverMatch?.[1]) return individualCoverMatch[1].replace(/,/g, "");
  
  return "-";
};

const extractPreviousPolicyNumber = (text = "") => {
  let match = text.match(/Previous Policy No\.?\s*[:]?\s*([A-Z0-9\/\-]*\d[A-Z0-9\/\-]*)/i);
  if (!match) {
    match = text.match(/Previous Policy Number\.?\s*[:]?\s*([A-Z0-9\/\-]*\d[A-Z0-9\/\-]*)/i);
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
    totalOdPremium: "0", totalTpPremium: "0", netPremium: "0",
    gst: "0", totalPayable: "-", calculatedOdPremium: "0", calculatedTpPremium: "0"
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
    if (od !== "-") { 
      result.totalOdPremium = od; 
    }
  } else {
    result.totalOdPremium = "0";
  }

  const tp = extract([/Gross TP\(B\)\s*([\d,]+(?:\.\d{2})?)/i, /Basic - TP\s*([\d,]+(?:\.\d{2})?)/i, /Premium\s*:\s*([\d,]+(?:\.\d{2})?)/i]);
  if (tp !== "-") { 
    result.totalTpPremium = tp; 
  }

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
    const cgstValues = [...normalized.matchAll(/CGST\s*-\s*[^:]+:\s*([\d,]+(?:\.\d{2})?)/gi)].map((match) => cleanAmount(match[1]));
    const sgstValues = [...normalized.matchAll(/SGST\s*-\s*[^:]+:\s*([\d,]+(?:\.\d{2})?)/gi)].map((match) => cleanAmount(match[1]));
    const splitTaxValues = [...cgstValues, ...sgstValues]
      .map((value) => parseFloat(value))
      .filter((value) => Number.isFinite(value));

    if (splitTaxValues.length) {
      gstVal = splitTaxValues.reduce((sum, value) => sum + value, 0).toFixed(2);
    }
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

  const netNum = parseFloat(result.netPremium);
  const totalNum = parseFloat(result.totalPayable);
  const gstNum = parseFloat(result.gst);
  if (
    Number.isFinite(netNum) &&
    Number.isFinite(totalNum) &&
    Number.isFinite(gstNum) &&
    Math.abs((netNum + gstNum) - totalNum) > 1
  ) {
    result.gst = (totalNum - netNum).toFixed(2);
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

  // HARDCODED CALCULATED PREMIUMS REMOVAL
  const finalPremium = {
    calculatedOdPremium: "-",
    calculatedTpPremium: "-",
    totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
    totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
    netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
    gst: premium?.gst || autoPremium?.gst || "0",
    totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
  };

  const policyNumber = policy?.policyNumber || 
                       item?.fullText?.match(/Policy Number\s*:?\s*([A-Z0-9]{10,22})(?=Previous|\s|$)/i)?.[1] ||
                       item?.fullText?.match(/Policy\s+No\.?\s*[\r\n\s]+([A-Z0-9]{10,22})/i)?.[1] ||
                       item?.fullText?.match(/Policy No\.?\s+([A-Z0-9]{10,22})/i)?.[1] ||
                       item?.fullText?.match(/POLICY\s+NO\.?\s*:\s*([A-Z0-9]+)/i)?.[1] || "-";

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
