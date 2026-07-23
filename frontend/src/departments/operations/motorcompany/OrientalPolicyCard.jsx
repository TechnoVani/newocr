// src/components/OrientalPolicyCard.jsx

import { useState } from "react";
import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

const normalizeText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ");
};

const extractInsuranceCompany = (text) => {
  return text.includes("The Oriental Insurance Company Limited")
    ? "The Oriental Insurance Company Limited"
    : "-";
};

const extractPolicyNumber = (text) => {
  const match = text.match(/([A-Z0-9\/]{10,})\s+Policy\s+No/i);
  if (match) return match[1];
  const alt = text.match(/Policy\s+No\s*[:：]\s*([A-Z0-9\/\-]+)/i);
  return alt ? alt[1] : "-";
};

const extractBranchAddress = (text) => {
  if (!text) return "-";

  // Normalize whitespace while preserving address content
  const normalizedText = text.replace(/\s+/g, " ").trim();

  // =====================================================
  // 1. Special handling for Oriental Insurance Bhopal branch
  // Captures full address starting with E-6/76
  // =====================================================
  const areraMatch = normalizedText.match(
    /(E-\d+\/\d+,\s*.*?ARERA\s+COLONY.*?MADHYA\s+PRADESH\s+\d{6})/i
  );

  if (areraMatch?.[1]) {
    return areraMatch[1].trim();
  }

  // =====================================================
  // 2. Generic office address ending with PIN code
  // =====================================================
  const officeAddressMatch = normalizedText.match(
    /([A-Z0-9\/,\-().\s]+(?:COLONY|ROAD|NAGAR|COMPLEX|MARKET|FLOOR|TOWER|BUILDING)[A-Z0-9\/,\-().\s]*?MADHYA\s+PRADESH\s+\d{6})/i
  );

  if (officeAddressMatch?.[1]) {
    return officeAddressMatch[1].trim();
  }

  // =====================================================
  // 3. 🆕 UPDATED: A.D. COMPLEX branch logic
  // Captures from the building number up to the 6-digit PIN (handles spaces in PIN)
  // =====================================================
  const branchMatch = normalizedText.match(
    /(\d{1,2},\s*A\.?D\.?\s*COMPLEX.*?(?:\d{6}|\d{3}\s*\d{3}))/i
  );

  if (branchMatch?.[1]) {
    return branchMatch[1].trim();
  }

  // =====================================================
  // 4. Extract address before MOTOR INSURANCE CERTIFICATE
  // =====================================================
  const motorSectionMatch = normalizedText.match(
    /([A-Z0-9\/,\-().\s]{20,}MADHYA\s+PRADESH\s+\d{6})(?=\s+MOTOR\s+INSURANCE)/i
  );

  if (motorSectionMatch?.[1]) {
    return motorSectionMatch[1].trim();
  }

  // =====================================================
  // 5. Original block logic
  // =====================================================
  const blockMatch = text.match(
    /Prev\s+Policy\s+No\s*[:：]\s*[^\n]+\s+([\s\S]*?)\s*FROM\s+\d{2}:\d{2}/i
  );

  if (blockMatch?.[1]) {
    const block = blockMatch[1].trim();

    const lines = block
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length >= 2) {
      return lines[1];
    }
  }

  // =====================================================
  // 6. Fallback - find any MP address with PIN
  // =====================================================
  const fallbackMatch = normalizedText.match(
    /([A-Z0-9\/,\-().\s]{20,}?MADHYA\s+PRADESH\s+\d{6})/i
  );

  if (fallbackMatch?.[1]) {
    return fallbackMatch[1].trim();
  }

  return "-";
};

const extractInsuredDetails = (text = "") => {
  if (!text) {
    return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
  }

  const normalizedText = normalizeText(text);
  let insuredName = "-";
  let insuredAddress = "-";

  // ---- 🆕 Extract from "person driving holds an" ----
  const driverMatch = normalizedText.match(
    /\bperson\s+driving\s+holds\s+an?\s+([A-Z][A-Z\s]+?)\s*(?=\(GSTIN|$)/i
  );
  if (driverMatch?.[1]) {
    insuredName = driverMatch[1].trim();
    insuredName = insuredName.replace(/\s*\(.*$/, '').trim();
  }

  // ---- 🆕 NEW: Extract company name (M/s, M/S, etc.) ----
  if (insuredName === "-") {
    const companyMatch = normalizedText.match(
      /\b(?:M\/?S\.?|M\/s\.?)\s+([A-Z0-9\s&.,\-]+?)\s*\(GSTIN/i
    );
    if (companyMatch?.[1]) {
      insuredName = companyMatch[1].trim();
      // Remove any trailing parentheses or extra text
      insuredName = insuredName.replace(/\s*\(.*$/, '').trim();
    }
  }

  // ---- Existing name extraction (fallback) ----
  if (insuredName === "-") {
    const titleNameMatch = normalizedText.match(
      /\b(?:MR|MRS|MS|M\/S\.?)\s+([A-Z\s]+?)\s*\(GSTIN/i
    );
    if (titleNameMatch?.[1]) {
      insuredName = titleNameMatch[1].trim();
    }
  }

  if (insuredName === "-") {
    const genericMatch = normalizedText.match(
      /\b([A-Z]{2,}(?:\s+[A-Z]{2,}){1,5})\s*\(GSTIN\s*:/i
    );
    if (genericMatch?.[1]) {
      insuredName = genericMatch[1].trim();
    }
  }

  if (insuredName === "-") {
    const gstMatch = normalizedText.match(
      /([A-Z][A-Z\s]{3,60})\s*\(GSTIN/i
    );
    if (gstMatch?.[1]) {
      insuredName = gstMatch[1].trim();
    }
  }

  insuredName = insuredName.replace(/^IND\s+/i, '').trim();

  // ---- 🆕 NEW: Added logic exclusively for the dual-address format ----
  if (insuredAddress === "-" || insuredAddress === "") {
    const dualAddressMatch = normalizedText.match(/Address\s*:\s*(.*?)\s*Address\s*:/i);
    if (dualAddressMatch?.[1]) {
      let candidate = dualAddressMatch[1].trim();
      // FIX: Prevent capturing the table header labels
      if (candidate.length > 15 && !/Validated|Tel\s*\/Fax|Email/i.test(candidate)) {
        insuredAddress = candidate;
      }
    }
  }

  // ---- 🆕 NEW: Address extraction for flattened Oriental format (e.g., SO PURAN LAL...) ----
  if (insuredAddress === "-" || insuredAddress === "") {
    const flattenedAddressMatch = normalizedText.match(
      /Prev\s+Policy\s+No\s*[\s:-]+([A-Z0-9\s,\.\/()]+?\d{6})\s+(?:15\s*,\s*A\.?\s*D\.?\s*COMPLEX|\d{1,2}\s*,|FROM)/i
    );
    if (flattenedAddressMatch?.[1]) {
      let candidate = flattenedAddressMatch[1].trim();
      // Remove leading dash if present
      candidate = candidate.replace(/^-\s*/, '').trim(); 
      if (candidate.length > 15) {
        insuredAddress = candidate;
      }
    }
  }

  // ---- Address extraction (unchanged fallbacks) ----
  const branchGstinMatch = normalizedText.match(
    /\(GSTIN:\s*(?!0\b)([A-Z0-9]{15})\)/i
  );
  if (branchGstinMatch) {
    const branchGstin = branchGstinMatch[1];
    const gstinIndex = normalizedText.indexOf(branchGstin);
    if (gstinIndex !== -1) {
      const afterGstin = normalizedText.substring(gstinIndex + branchGstin.length);
      const branchMarkerMatch = afterGstin.match(
        /\b(E-\d+\/\d+|2ND\s+FLOOR\s+ARERA\s+COLONY|A\.?D\.?\s+COMPLEX)/i
      );
      if (branchMarkerMatch) {
        const branchStart = afterGstin.indexOf(branchMarkerMatch[0]);
        if (branchStart > 0) {
          let candidate = afterGstin.substring(0, branchStart).trim();
          candidate = candidate.replace(/^[\s()]*/, '');
          candidate = candidate.replace(/^\d+\s+\d+\s*/, '');
          candidate = candidate.replace(/^\d+\s*/, '');
          if (/\d{6}\s*$/.test(candidate) && candidate.length > 15) {
            insuredAddress = candidate;
          }
        }
      }
    }
  }

  if (insuredAddress === "-" || insuredAddress === "") {
    const addressMatch = normalizedText.match(
      /\(GSTIN:\s*[^)]+\)\s*([A-Z0-9\s,\.]+?)(?=\s*\d{1,2},\s*A\.?D\.?|MOTOR INSURANCE|FROM|$)/i
    );
    if (addressMatch) {
      insuredAddress = addressMatch[1].trim();
      insuredAddress = insuredAddress.replace(/^\d+\s+\d+\s*/, '').trim();
    }
  }

  if (insuredAddress === "-" || insuredAddress === "") {
    const addressBlockMatch = normalizedText.match(
      /Prev\s+Policy\s+No\s*[:：]\s*[^\n]+\s+([\s\S]*?)\s*FROM\s+\d{2}:\d{2}/i
    );
    if (addressBlockMatch) {
      let block = addressBlockMatch[1].trim();
      let lines = block.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length >= 2) {
        insuredAddress = lines[0];
      } else if (lines.length === 1) {
        const branchPattern = /\d{1,2}\s*,\s*[A-Z\.]+\s+COMPLEX/i;
        const branchMatch = lines[0].match(branchPattern);
        if (branchMatch) {
          const branchIndex = lines[0].indexOf(branchMatch[0]);
          insuredAddress = lines[0].substring(0, branchIndex).trim();
        } else {
          insuredAddress = lines[0];
        }
      } else {
        insuredAddress = block;
      }
      insuredAddress = insuredAddress.replace(/^\d+\s+\d+\s*/, '').trim();
      if (insuredName === "-" || insuredName === "") {
        const nameMatch = insuredAddress.match(/^([^,]+)/);
        if (nameMatch) insuredName = nameMatch[1].trim();
      }
    }
  }

  if (insuredAddress === "-" || insuredAddress === "") {
    const pinAddressMatch = normalizedText.match(
      /\b(\d{1,3},\s*[A-Z0-9\s,.-]+?\s+\d{6})\b/i
    );
    if (pinAddressMatch) {
      const candidate = pinAddressMatch[1].trim();
      if (!/COMPLEX|A\.?D\.?\s*COMPLEX|ARERA\s+COLONY/i.test(candidate)) {
        insuredAddress = candidate;
      }
    }
  }

  if (insuredAddress === "-" || insuredAddress === "" || /MOUNT\s*ROAD/i.test(insuredAddress)) {
    const wardMatch = normalizedText.match(
      /WARD\s+NO\s+\d+\s+[A-Z0-9\s,]+?\s+\d{6}/i
    );
    if (wardMatch) {
      insuredAddress = wardMatch[0].trim();
    }
  }

  // ---- NEW Address extraction from Prev Policy No block ----
  if (insuredAddress === "-" || insuredAddress === "") {
    const policyAddressMatch = normalizedText.match(
      /Prev\s+Policy\s+No\s*:\s*-\s*([\s\S]*?)\s*15,\s*A\.?\s*D\.?\s*COMPLEX/i
    );

    if (policyAddressMatch?.[1]) {
      let candidate = policyAddressMatch[1]
        .replace(/\s+/g, " ")
        .trim();

      // remove accidental leading name labels if present
      candidate = candidate.replace(
        /^IND\s+[A-Z\s]+\(GSTIN:\s*0\)\s*/i,
        ""
      );

      if (candidate.length > 20) {
        insuredAddress = candidate;
      }
    }
  }
    
  // ---- 🆕 PAN extraction with stricter validation ----
  let panNumber = "-";
  // Try to capture a valid PAN (10 chars: 5 letters, 4 digits, 1 letter)
  const panRegex = /\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i;
  const panMatch = normalizedText.match(panRegex);
  if (panMatch) {
    panNumber = panMatch[1].toUpperCase();
  } else {
    // Fallback: capture any 10+ character alphanumeric token after "PAN No"
    const fallbackMatch = normalizedText.match(/PAN\s+No\s*[:]?\s*([A-Z0-9]{10,})/i);
    if (fallbackMatch && !/Validated|Email|Mobile|Number/i.test(fallbackMatch[1])) {
      panNumber = fallbackMatch[1].trim().toUpperCase();
    }
  }
  
  // Added [\w.*-] to capture the masked email
  const contactLine = normalizedText.match(/([\d*]{4,})\s*\/\/\s*([\w.*-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

  let contactNumber = "-";
  let email = "-";

  if (contactLine) {
    contactNumber = contactLine[1] || "-";
    email = contactLine[2] || "-";
  } else {
    
    const contactMatch = normalizedText.match(/(?:Mobile|Tel|Phone|Validated Mobile Number)[^\d]*([\d*]{7,})/i);
    contactNumber = contactMatch?.[1] || "-";
    
    // Regex looks for an email pattern that includes asterisks
    const emailMatch = normalizedText.match(/([a-zA-Z0-9.*_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    email = emailMatch?.[1] || "-";
  }

  const gstinMatch = normalizedText.match(/GSTIN\s*([A-Z0-9]{15})/i);
  const gstin = gstinMatch?.[1] || "-";

  return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin };
};

const extractVehicleDetailsFromText = (text = "") => {
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
    fuelType: "-",
    gvw: "-"
  };

  if (!text) return result;

  const normalizedText = normalizeText(text);

  // =======================================================================
  // ---- 🆕 Registration ----
  // =======================================================================
  if (/BUNDLED\s+COVER\s+POLICY/i.test(normalizedText)) {
    result.registrationNumber = "New";
  } else {
    const regMatch = normalizedText.match(/\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\b/i);
    if (regMatch) {
      result.registrationNumber = regMatch[0].replace(/\s+/g, "");
    }
  }

  // ---- Engine, Chassis, Year ----
  const splitChassisMatch = normalizedText.match(
    /\b([A-Z0-9]{10,})\s*-\s*([A-Z0-9]{10,})\s+(\d{4})\s+(\d{4})\b/i
  );
  if (splitChassisMatch) {
    result.engineNumber = splitChassisMatch[1];
    result.chassisNumber = splitChassisMatch[2] + splitChassisMatch[3];
    result.manufacturingYear = splitChassisMatch[4];
  } else {
    const ecYearMatch = normalizedText.match(
      /\b([A-Z0-9]{10,})\s+(\d{4})\s+([A-Z0-9]{10,})(?:\s+([\d\~-]+))?\b/i
    );
    if (ecYearMatch) {
      result.engineNumber = ecYearMatch[1];
      result.manufacturingYear = ecYearMatch[2];
      let chassis = ecYearMatch[3];
      if (ecYearMatch[4]) {
        const suffixDigits = ecYearMatch[4].replace(/\D/g, '');
        chassis += suffixDigits;
      }
      result.chassisNumber = chassis;
    } else {
      const ecMatch = normalizedText.match(
        /\b([A-Z0-9]{10,})\s*-\s*([A-Z0-9]{10,})\b/i
      );
      if (ecMatch) {
        result.engineNumber = ecMatch[1];
        result.chassisNumber = ecMatch[2];
      }
    }
  }

  // ---- GVW extraction ----
  const gvwMatch = normalizedText.match(
    /\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\s+(\d{2,5})\s+(?:OPEN\s+BODY|BULKER|CLOSED\s+BODY|TROLLEY|TANKER|CONTAINER)/i
  );
  if (gvwMatch) {
    result.gvw = gvwMatch[1];
  }

  let make = "-", model = "-", variant = "-";

  // =======================================================================
  // Oriental Flat Row Extraction (Engine, Chassis, Make, Model, CC, etc.)
  // Captures the entire flat string based on the provided document layout
  // =======================================================================
  if (result.engineNumber === "-" || result.chassisNumber === "-") {
    const flatRowMatch = normalizedText.match(
      /\b([A-Z0-9]{10,15})\s+([A-Z0-9]{15,20})\s+([A-Z]+)\s+([A-Z]+)\s+(.+?)\s+(20\d{2}|19\d{2})\s+(PETROL|DIESEL|CNG|EV|ELECTRIC|HYBRID)\s+(\d+\s*\+\s*\d+)\s+(\d{2,5})\b/i
    );
    if (flatRowMatch) {
      result.engineNumber = flatRowMatch[1];
      result.chassisNumber = flatRowMatch[2];
      make = flatRowMatch[3];
      let modelVariantRaw = flatRowMatch[5].trim();
      
      // Explicit split logic for Honda Shine 125 based on your request
      if (modelVariantRaw.toUpperCase().startsWith("SHINE 125")) {
        model = "SHINE 125";
        variant = modelVariantRaw.substring(9).trim();
      } else {
        // Generic fallback for other flat-row models
        let parts = modelVariantRaw.split(/\s+/);
        if (parts.length > 2) {
          model = parts.slice(0, 2).join(" ");
          variant = parts.slice(2).join(" ");
        } else {
          model = modelVariantRaw;
        }
      }
      result.manufacturingYear = flatRowMatch[6];
      result.fuelType = flatRowMatch[7];
      result.seatingCapacity = flatRowMatch[8];
      result.cubicCapacity = flatRowMatch[9];
    }
  }

  // =======================================================================
  const carMatch = normalizedText.match(
    /\b([A-Z]+)\s+MOTORS?-([A-Z]+)\s+(.+?)\s+INDIA\b/i
  );
  if (carMatch) {
    make = carMatch[2].trim();
    const vehicleText = carMatch[3].replace(/\s+/g, " ").trim();
    const tokens = vehicleText.split(" ");
    if (tokens.length > 1) {
      variant = tokens.pop();
      model = tokens.join(" ").trim();
    } else {
      model = vehicleText;
    }
  }

  if (make === "-") {
    const cityList = [
      "BHOPAL", "INDORE", "NAGPUR", "GWALIOR", "GWALIAR",
      "JABALPUR", "MANDLA", "MUMBAI", "DELHI", "CHENNAI",
      "KOLKATA", "PUNE"
    ];
    const cityRegex = new RegExp(`\\b(${cityList.join('|')})\\s+-\\s+([A-Z]+)\\s+([A-Z]+)\\s+(.*?)(?=\\s+\\d{3,5}\\b|$)`, 'i');
    const locationDashMatch = normalizedText.match(cityRegex);
    if (locationDashMatch) {
      make = locationDashMatch[2].trim().toUpperCase();
      model = locationDashMatch[3].trim().toUpperCase();
      variant = locationDashMatch[4].trim();
      // Remove trailing cubic‑capacity digits if any (e.g., " 2393")
      variant = variant.replace(/\s+\d{3,5}$/, '').trim();
    }
  }

  // -------- 3) Bike format (fallback) --------
  if (make === "-") {
    const bikeMatch = normalizedText.match(
      /\b([A-Za-z][A-Za-z\s]+?)\s*-\s*([A-Za-z\s]+?)(?=\s+\d|\s*$)/i
    );
    if (bikeMatch) {
      make = bikeMatch[1].trim();
      const vehicleText = bikeMatch[2].replace(/\s+/g, " ").trim();
      const tokens = vehicleText.split(" ");
      if (tokens.length > 1) {
        variant = tokens.pop();
        model = tokens.join(" ").trim();
      } else {
        model = vehicleText;
      }
    }
  }

  // -------- 4) Commercial Vehicle (e.g., DOST RLS BSIV 1478) --------
  if (make === "-") {
    const cvMatch = normalizedText.match(
      /\b([A-Z]{2,20})\s+([A-Z0-9]{2,20})\s+(BSIII|BSIV|BSVI|BS6)\s+(\d{3,5})\b/i
    );
    if (cvMatch) {
      make = cvMatch[1].trim().toUpperCase();
      model = cvMatch[2].trim().toUpperCase();
      variant = cvMatch[3].trim().toUpperCase();
    }
  }

  // -------- 5) Fallback from "Make - Model" label --------
  if (make === "-") {
    const mmLabel = normalizedText.match(
      /Make\s*-\s*Model\s*[:：]?\s*([^\n]+)/i
    );
    if (mmLabel) {
      let modelStr = mmLabel[1].trim();
      modelStr = modelStr.replace(
        /\s*(Type\s+Of\s+Body|Cubic\s+Capacity|Seating\s+Capacity|Year\s+Of\s+Manf.).*/i,
        ""
      ).trim();
      const parts = modelStr.split(/\s*-\s*/);
      if (parts.length >= 2) {
        make = parts[0].trim();
        model = parts.slice(1).join(" ").trim();
      } else {
        model = modelStr;
      }
    }
  }

  // -------- 6) Commercial Vehicle Make/Model fallback --------
  if (
    make === "-" ||
    make === "PUBLIC" ||
    make === "CC" ||
    /PACKAGE POLICY/i.test(make)
  ) {
    const cvVehicleMatch = normalizedText.match(
      /\b(?:BHOPAL|INDORE|NAGPUR|LUCKNOW|DELHI|MUMBAI|PUNE|JABALPUR)\s*-\s*([A-Z]+)\s+([A-Z0-9]+)\s+([A-Z0-9\s]+?)\s+(?:\d{3,5}|M\/S|[A-Z].*?GSTIN:)/i
    );
    if (cvVehicleMatch) {
      make = cvVehicleMatch[1].trim().toUpperCase();
      model = cvVehicleMatch[2].trim().toUpperCase();
      variant = cvVehicleMatch[3].trim().toUpperCase();
    }
  }

  result.make = make;
  result.model = model;
  result.variant = variant;

  // ---- Year fallback ----
  if (result.manufacturingYear === "-") {
    const yearMatch = normalizedText.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) result.manufacturingYear = yearMatch[0];
  }

  // ---- Seating Capacity ----
  const seatMatch = normalizedText.match(/\b(\d+\s*\+\s*\d+)\b/);
  if (seatMatch && result.seatingCapacity === "-") result.seatingCapacity = seatMatch[1];

  // ---- Cubic Capacity ----
  let ccMatch = null;
  // 1) Try to capture number after variant: city - MAKE MODEL VARIANT NUMBER
  const variantNumberMatch = normalizedText.match(
    /\b[A-Z]{2,}\s+-\s+[A-Z]+\s+[A-Z]+\s+[A-Z0-9\s.]*?\s+(\d{3,5})\b/i
  );
  if (variantNumberMatch && result.cubicCapacity === "-") {
    const candidate = variantNumberMatch[1];
    const year = parseInt(candidate, 10);
    if (!(year >= 1900 && year <= 2099)) {
      result.cubicCapacity = candidate;
    }
  }

  // 2) If not found, look for BSIII/BSIV/BSVI/BS6 directly
  if (result.cubicCapacity === "-") {
    ccMatch = normalizedText.match(/\b(?:BSIII|BSIV|BSVI|BS6)\s+(\d{3,5})\b/i);
    if (ccMatch) {
      result.cubicCapacity = ccMatch[1];
    }
  }

  // 3) If still not found, look for "CC", "Cubic Capacity" label
  if (result.cubicCapacity === "-") {
    ccMatch = normalizedText.match(
      /\b(\d{2,5})\s*(?:CC|cc|Cubic\s+Capacity|Cubic)\b/i
    );
    if (ccMatch) {
      result.cubicCapacity = ccMatch[1];
    }
  }

  // 4) Smart fallback (PETROL/DIESEL ...)
  if (result.cubicCapacity === "-") {
    const ccSmartFallback = normalizedText.match(
      /\b(?:PETROL|DIESEL|CNG|LPG|HYBRID)?\s*(?:BSIV|BSVI)?\s*(?:[A-Z\s-]*?)\s(\d{3,4})\s+[A-Z]{3,}/i
    );
    if (ccSmartFallback) {
      result.cubicCapacity = ccSmartFallback[1];
    } else {
      const ccOthers = normalizedText.match(
        /\b(\d{2,5})\s+OTHERS\s+\d+\s*\+\s*\d+\b/i
      );
      if (ccOthers) {
        result.cubicCapacity = ccOthers[1];
      } else {
        const bikeCc = normalizedText.match(
          /\b\d{4}\s+\d+\s*\+\s*\d+\s+(\d{2,4})\s+[A-Z]/i
        );
        if (bikeCc) {
          result.cubicCapacity = bikeCc[1];
        } else {
          const tableCc = normalizedText.match(
            /\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\s+(\d{2,5})\s+[A-Z]+\s+\d+\s*\+\s*\d+/i
          );
          if (tableCc) {
            result.cubicCapacity = tableCc[1];
          }
        }
      }
    }
  }

  // ---- Fuel ----
  if (result.fuelType === "-") {
    const fuelMatch = normalizedText.match(/Type\s+Of\s+Fuel\s*:?\s*([A-Z]+)/i);
    if (fuelMatch) {
      result.fuelType = fuelMatch[1].trim();
    } else {
      const fuelFallback = normalizedText.match(/\b(PETROL|DIESEL|CNG|LPG|ELECTRIC|HYBRID)\b/i);
      if (fuelFallback) result.fuelType = fuelFallback[1].toUpperCase();
    }
  }

  // ---- Geographical Area ----
  const geoMatch = normalizedText.match(/Geographical\s+Area\s*:?\s*([A-Z\s]+)/i);
  if (geoMatch) result.geographicalArea = geoMatch[1].trim();

  // ---- Financier ----
  let financierName = "-";

  // 1. Check if the financier name is written BEFORE the label
  // (e.g., "HINDUJA LEYLAND FINANCE SATNA Hire Purchase/Lessor Agreement")
  const preFinMatch = normalizedText.match(
    /\b([A-Z][A-Z\s&.,]{5,60}?)\s+Hire\s+Purchase\/Lessor\s+Agreement/i
  );
  
  if (preFinMatch) {
    financierName = preFinMatch[1].trim();
  }

  // 2. If not found before, fallback to standard checks AFTER the labels
  if (financierName === "-") {
    
    // Pattern 1: Hire Purchase/Lessor Agreement (name after label)
    let finMatch = normalizedText.match(
      /Hire\s+Purchase\/Lessor\s+Agreement\s+with\s*:?\s*([A-Z0-9.,&-\s]+?)(?=\s*-\s*(?:Subject|Details)|\n|$)/i
    );
    
    if (!finMatch) {
      // Pattern 2: Hypothecation Agreement
      finMatch = normalizedText.match(
        /Hypothecation\s+Agreement\s+with\s*:?\s*([A-Z0-9.,&-\s]+?)(?=\s*-\s*(?:Subject|Details)|\n|$)/i
      );
    }
    
    if (!finMatch) {
      // Generic bank fallback (Fixed: Escaped the dot in LTD\.)
      finMatch = normalizedText.match(
        /\b([A-Z\s&]+BANK\s+LTD\.?)\b/i
      );
    }

    // Hinduja Leyland Finance hardcoded fallback
    if (!finMatch) {
      finMatch = normalizedText.match(
        /\b(HINDUJA\s+LEYLAND\s+FINANCE.*?)(?=\s*-|\n|$)/i
      );
    }

    if (finMatch?.[1]) {
      financierName = finMatch[1]
        .replace(/,\s*[A-Z\s]+$/i, '') // remove trailing city name if preceded by a comma
        .trim();
    }
  }

  result.financierName = financierName;
  
  return result;
};

const extractPolicyDates = (text = "") => {
  if (!text) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };

  // ---- NEW: Extract from Policy Period (OWN DAMAGE) and (LIABILITY) ----
  const odPeriodMatch = text.match(
    /Policy\s+Period\s*\(OWN\s+DAMAGE\)\s*:\s*FROM\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}\s+TO\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}/i
  );
  const liabilityPeriodMatch = text.match(
    /Policy\s+Period\s*\(LIABILITY\)\s*:\s*FROM\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+TO\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}/i
  );

  if (odPeriodMatch) {
    const startDate = odPeriodMatch[1];          // e.g., "23-06-2026"
    const odExpireDate = odPeriodMatch[2];       // e.g., "22-06-2027"
    let tpExpireDate = odExpireDate;             // fallback if liability not found
    if (liabilityPeriodMatch) {
      tpExpireDate = liabilityPeriodMatch[1];    // e.g., "22-06-2031"
    }
    return { startDate, odExpireDate, tpExpireDate };
  }

  // ---- Existing patterns (unchanged) ----
  let match = text.match(
    /FROM\s+\d{2}:\d{2}\s+ON\s+(\d{2}\/\d{2}\/\d{4})\s+TO\s+MIDNIGHT\s+OF\s+(\d{2}\/\d{2}\/\d{4})/i
  );
  if (match) {
    return { startDate: match[1], odExpireDate: match[2], tpExpireDate: match[2] };
  }

  match = text.match(
    /Period\s+of\s+Insurance\s*[:：]?\s*FROM\s+(\d{2}\/\d{2}\/\d{4})\s+TO\s+MIDNIGHT\s+OF\s+(\d{2}\/\d{2}\/\d{4})/i
  );
  if (match) {
    return { startDate: match[1], odExpireDate: match[2], tpExpireDate: match[2] };
  }

  match = text.match(/(\d{2}\/\d{2}\/\d{4})\s+TO\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (match) {
    return { startDate: match[1], odExpireDate: match[2], tpExpireDate: match[2] };
  }

  return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
};

const extractDateOfIssue = (text = "") => {
  if (!text) return "-";

  // ---- NEW: Extract from "Collection No. & Dt." line ----
  let match = text.match(
    /Collection\s+No\.\s*&\s*Dt\.\s*:\s*[A-Z0-9]+\s+(\d{2}-\d{2}-\d{4})/i
  );
  if (match) return match[1];

  // ---- Existing patterns (unchanged) ----
  match = text.match(/Date\s+of\s+Issue\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (match) return match[1];

  match = text.match(/[A-Z]+\s+(\d{2}\/\d{2}\/\d{4})\s+Place\s*:?\s*Date\s*:/i);
  if (match) return match[1];

  match = text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
  if (match) return match[1];

  // Final fallback for any dash‑separated date (optional)
  match = text.match(/\b(\d{2}-\d{2}-\d{4})\b/);
  return match ? match[1] : "-";
};

const extractIDV = (text = "") => {
  if (!text) return "-";

  const normalized = text.replace(/\s+/g, " ");

  // 1️⃣ Try labeled IDV patterns first
  let match = normalized.match(
    /Total\s+Value\s+IDV[^0-9]{0,50}([\d,]{3,})/i
  );
  if (match?.[1]) {
    return match[1].replace(/,/g, "");
  }

  // 2️⃣ IDV of Vehicle fallback (very common in Oriental PDFs)
  match = normalized.match(
    /IDV\s+of\s+the\s+Vehicle[^0-9]{0,50}([\d,]{3,})/i
  );
  if (match?.[1]) {
    return match[1].replace(/,/g, "");
  }

  // 3️⃣ OCR fallback: pick highest valid IDV-like number in section
  const candidates = normalized.match(/\b\d{1,3}(?:,\d{2,3}){1,3}\b/g);

  if (candidates?.length) {
    // pick the largest number (usually IDV is biggest in that block)
    const sorted = candidates
      .map(n => parseInt(n.replace(/,/g, ""), 10))
      .sort((a, b) => b - a);

    return String(sorted[0]);
  }

  return "-";
};

const extractPreviousPolicyNumber = (text = "") => {
  if (!text) return "-";

  const normalized = text.replace(/\s+/g, " ");

  // 1️⃣ Try explicit "Previous Policy No"
  let match = normalized.match(
    /Prev(?:ious)?\s+Policy\s+No\s*[:\-]?\s*([A-Z0-9/-]+)/i
  );
  if (match?.[1] && match[1] !== "-") {
    return match[1].trim();
  }

  // 2️⃣ Fallback: Policy No (VERY COMMON in Oriental PDFs)
  match = normalized.match(
    /Policy\s+No\s*[:\-]?\s*([A-Z0-9]{10,30})/i
  );
  if (match?.[1]) {
    return match[1].trim();
  }

  return "-";
};

const extractPreviousInsurer = (text = "") => {
  const match = text.match(/Previous Insurer\s*[:]?\s*([^\n]+?)(?:\s*Previous Policy Number|$)/i);
  if (match?.[1]) {
    return match[1].replace(/Previous Policy Number.*$/i, "").replace(/\s+/g, " ").trim();
  }
  return "-";
};

// const extractPremiumData = (text = "") => {
//   const result = {
//     calculatedOdPremium: "0",
//     calculatedTpPremium: "0",
//     totalOdPremium: "0",
//     totalTpPremium: "0",
//     netPremium: "0",
//     gst: "0",
//     totalPayable: "0"
//   };

  
//   const motorTotalOdMatch = text.match(
//     /MOTOR\s+TOTAL\s+OD\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
//   );
//   if (motorTotalOdMatch) {
//     const odVal = motorTotalOdMatch[7].replace(/,/g, "").trim();
//     result.totalOdPremium = odVal;
//     result.calculatedOdPremium = odVal;
//   }

//   // 2) TP / GST / TOTAL from the Oriental block
//   const orientalBlock = text.match(
//     /TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*\\?\:IGST[_ ]?OD\s+ADD\s*\\?\:IGST[_ ]?TP\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
//   );

//   if (orientalBlock) {
//     result.totalTpPremium = orientalBlock[5];
//     result.calculatedTpPremium = orientalBlock[5];
//     result.netPremium = orientalBlock[6];

//     const gstOd = parseFloat(orientalBlock[8].replace(/,/g, ""));
//     const gstTp = parseFloat(orientalBlock[9].replace(/,/g, ""));
//     result.gst = (gstOd + gstTp).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//     result.totalPayable = orientalBlock[10];
//   }

//   // If the Oriental block gave us everything, return early.
//   if (
//     result.totalOdPremium !== "0" &&
//     result.totalTpPremium !== "0" &&
//     result.netPremium !== "0" &&
//     result.gst !== "0" &&
//     result.totalPayable !== "0"
//   ) {
//     return result;
//   }

//   // ============================================================
//   //  ORIGINAL FIRST CODE – ADDED LOGIC (specific format)
//   // ============================================================
//   // 1) Extract OD premium from "MOTOR TOTAL OD" block – take the last number
//   const motorOdMatch = text.match(
//     /MOTOR\s+TOTAL\s+OD\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
//   );
//   if (motorOdMatch) {
//     const odVal = motorOdMatch[7].replace(/,/g, '');
//     result.totalOdPremium = odVal;
//     result.calculatedOdPremium = odVal;
//   }

//   // 2) Extract the 12-number premium block after the "ADD :BASIC TP..." line
//   const premiumBlockMatch = text.match(
//     /ADD\s*:BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL\s+ADD\s*:PA\s+FOR\s+OWNER\s+DRIVER[^\n]*\s+([\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+)/i
//   );
//   if (premiumBlockMatch) {
//     const numbers = premiumBlockMatch[1].trim().split(/\s+/).map(n => n.replace(/,/g, ''));
//     if (numbers.length >= 12) {
//       result.totalTpPremium = numbers[4];
//       result.netPremium = numbers[5];
//       const gstSum = [numbers[7], numbers[8], numbers[9], numbers[10]]
//         .reduce((sum, val) => sum + parseFloat(val), 0);
//       result.gst = gstSum.toFixed(2);
//       result.totalPayable = numbers[11];
//       result.calculatedTpPremium = result.totalTpPremium;
//       return result;
//     }
//   }
  
//   const odMatch = text.match(/TOTAL\s+OD\s+([\d,.]+)/i);
//   if (odMatch) {
//     const val = odMatch[1].replace(/,/g, '');
//     result.totalOdPremium = val;
//     result.calculatedOdPremium = val;
//   }

//   // 2) Extract Premium summary after "TOTAL PREMIUM ADD" (8 numbers)
//   const premiumMatch = text.match(
//     /TOTAL\s+PREMIUM\s+ADD\s*:?\s*IGST\s+STAMP\s+DUTY\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
//   );
//   if (premiumMatch) {
//     result.totalTpPremium = premiumMatch[4].replace(/,/g, '');
//     result.netPremium = premiumMatch[5].replace(/,/g, '');
//     result.gst = premiumMatch[6].replace(/,/g, '');
//     result.totalPayable = premiumMatch[8].replace(/,/g, '');
//     result.calculatedTpPremium = result.totalTpPremium;
//   } else {
//     // Fallback: older pattern with 10 numbers
//     const summaryMatch = text.match(
//       /TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*IGST\s+TOTAL\s+AMOUNT\s+([\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+)/i
//     );
//     if (summaryMatch) {
//       const numbers = summaryMatch[1].trim().split(/\s+/).map(n => n.replace(/,/g, ''));
//       if (numbers.length >= 10) {
//         result.totalTpPremium = numbers[5];
//         result.totalOdPremium = numbers[6];
//         result.gst = numbers[8];
//         result.totalPayable = numbers[9];
//         result.netPremium = String(parseFloat(numbers[6]) + parseFloat(numbers[5]));
//         result.calculatedOdPremium = numbers[6];
//         result.calculatedTpPremium = numbers[5];
//       }
//       return result;
//     }

//     // Old pattern: TOTAL PREMIUM ADD :IGST STAMP DUTY TOTAL AMOUNT (7 numbers)
//     let match = text.match(
//       /TOTAL\s+PREMIUM\s+ADD\s*:?\s*IGST\s+STAMP\s+DUTY\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
//     );
//     if (match) {
//       result.totalTpPremium = match[4];
//       result.netPremium = match[4];
//       result.gst = match[5];
//       result.totalPayable = match[7];
//       result.calculatedTpPremium = match[4];
//       return result;
//     }

//     // Simple fallbacks
//     match = text.match(/TOTAL\s+PREMIUM\s+([\d,.]+)/i);
//     if (match) {
//       result.totalTpPremium = match[1];
//       result.netPremium = match[1];
//     }
//     match = text.match(/IGST\s+([\d,.]+)/i);
//     if (match) result.gst = match[1];
//     match = text.match(/TOTAL\s+AMOUNT\s+([\d,.]+)/i);
//     if (match) result.totalPayable = match[1];
//   }

//   return result;
// };

const extractPremiumData = (text = "") => {
  const result = {
    calculatedOdPremium: "0",
    calculatedTpPremium: "0",
    totalOdPremium: "0",
    totalTpPremium: "0",
    netPremium: "0",
    gst: "0",
    totalPayable: "0"
  };

  if (!text) return result;

  // ============================================================
  // 1. ORIENTAL‑SPECIFIC EXTRACTION (based on provided sample)
  // ============================================================

  // --- OD Premium: extract last number from "MOTOR TOTAL OD" block ---
  const odBlockMatch = text.match(
    /MOTOR\s+TOTAL\s+OD\s+([\d,.]+(?:\s+[\d,.]+)*)/i
  );
  if (odBlockMatch) {
    const numbers = odBlockMatch[1].trim().split(/\s+/).map(n => n.replace(/,/g, ''));
    if (numbers.length > 0) {
      const odValue = numbers[numbers.length - 1]; // take the last number
      result.totalOdPremium = odValue;
      result.calculatedOdPremium = odValue;
    }
  }

  // --- TP and Net Premium: extract from "BASIC TP COVER" block ---
  const tpBlockMatch = text.match(
    /BASIC\s+TP\s+COVER.*?TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
  );
  if (tpBlockMatch) {
    // Groups: 1-5 are various TP components, 6=TP total, 7=net premium, 8=stamp, 9=GST, 10=total payable
    const tpValue = tpBlockMatch[6].replace(/,/g, '');
    const netValue = tpBlockMatch[7].replace(/,/g, '');
    const gstValue = tpBlockMatch[9].replace(/,/g, '');
    const totalPayableValue = tpBlockMatch[10].replace(/,/g, '');

    result.totalTpPremium = tpValue;
    result.calculatedTpPremium = tpValue;
    result.netPremium = netValue;
    result.gst = gstValue;
    result.totalPayable = totalPayableValue;
  }

  // If we successfully extracted all three main values, return early.
  if (
    result.totalOdPremium !== "0" &&
    result.totalTpPremium !== "0" &&
    result.netPremium !== "0"
  ) {
    return result;
  }

  // ============================================================
  // 2. FALLBACK: existing extraction logic (unchanged)
  // ============================================================

  // ---- Original OD extraction (with the new flexible OD match) ----
  // (already tried above, but keep other patterns just in case)

  // ---- Original TP/Net extraction (fallback) ----
  const motorTotalOdMatch = text.match(
    /MOTOR\s+TOTAL\s+OD\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
  );
  if (motorTotalOdMatch) {
    const odVal = motorTotalOdMatch[7].replace(/,/g, "").trim();
    result.totalOdPremium = odVal;
    result.calculatedOdPremium = odVal;
  }

  // 2) TP / GST / TOTAL from the Oriental block
  const orientalBlock = text.match(
    /TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*\\?\:IGST[_ ]?OD\s+ADD\s*\\?\:IGST[_ ]?TP\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
  );

  if (orientalBlock) {
    result.totalTpPremium = orientalBlock[5];
    result.calculatedTpPremium = orientalBlock[5];
    result.netPremium = orientalBlock[6];

    const gstOd = parseFloat(orientalBlock[8].replace(/,/g, ""));
    const gstTp = parseFloat(orientalBlock[9].replace(/,/g, ""));
    result.gst = (gstOd + gstTp).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    result.totalPayable = orientalBlock[10];
  }

  // If the Oriental block gave us everything, return early.
  if (
    result.totalOdPremium !== "0" &&
    result.totalTpPremium !== "0" &&
    result.netPremium !== "0" &&
    result.gst !== "0" &&
    result.totalPayable !== "0"
  ) {
    return result;
  }

  // ============================================================
  //  ORIGINAL FIRST CODE – ADDED LOGIC (specific format)
  // ============================================================
  // 1) Extract OD premium from "MOTOR TOTAL OD" block – take the last number
  const motorOdMatch = text.match(
    /MOTOR\s+TOTAL\s+OD\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
  );
  if (motorOdMatch) {
    const odVal = motorOdMatch[7].replace(/,/g, '');
    result.totalOdPremium = odVal;
    result.calculatedOdPremium = odVal;
  }

  // 2) Extract the 12-number premium block after the "ADD :BASIC TP..." line
  const premiumBlockMatch = text.match(
    /ADD\s*:BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL\s+ADD\s*:PA\s+FOR\s+OWNER\s+DRIVER[^\n]*\s+([\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+)/i
  );
  if (premiumBlockMatch) {
    const numbers = premiumBlockMatch[1].trim().split(/\s+/).map(n => n.replace(/,/g, ''));
    if (numbers.length >= 12) {
      result.totalTpPremium = numbers[4];
      result.netPremium = numbers[5];
      const gstSum = [numbers[7], numbers[8], numbers[9], numbers[10]]
        .reduce((sum, val) => sum + parseFloat(val), 0);
      result.gst = gstSum.toFixed(2);
      result.totalPayable = numbers[11];
      result.calculatedTpPremium = result.totalTpPremium;
      return result;
    }
  }
  
  const odMatch = text.match(/TOTAL\s+OD\s+([\d,.]+)/i);
  if (odMatch) {
    const val = odMatch[1].replace(/,/g, '');
    result.totalOdPremium = val;
    result.calculatedOdPremium = val;
  }

  // 2) Extract Premium summary after "TOTAL PREMIUM ADD" (8 numbers)
  const premiumMatch = text.match(
    /TOTAL\s+PREMIUM\s+ADD\s*:?\s*IGST\s+STAMP\s+DUTY\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
  );
  if (premiumMatch) {
    result.totalTpPremium = premiumMatch[4].replace(/,/g, '');
    result.netPremium = premiumMatch[5].replace(/,/g, '');
    result.gst = premiumMatch[6].replace(/,/g, '');
    result.totalPayable = premiumMatch[8].replace(/,/g, '');
    result.calculatedTpPremium = result.totalTpPremium;
  } else {
    // Fallback: older pattern with 10 numbers
    const summaryMatch = text.match(
      /TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*IGST\s+TOTAL\s+AMOUNT\s+([\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+)/i
    );
    if (summaryMatch) {
      const numbers = summaryMatch[1].trim().split(/\s+/).map(n => n.replace(/,/g, ''));
      if (numbers.length >= 10) {
        result.totalTpPremium = numbers[5];
        result.totalOdPremium = numbers[6];
        result.gst = numbers[8];
        result.totalPayable = numbers[9];
        result.netPremium = String(parseFloat(numbers[6]) + parseFloat(numbers[5]));
        result.calculatedOdPremium = numbers[6];
        result.calculatedTpPremium = numbers[5];
      }
      return result;
    }

    // Old pattern: TOTAL PREMIUM ADD :IGST STAMP DUTY TOTAL AMOUNT (7 numbers)
    let match = text.match(
      /TOTAL\s+PREMIUM\s+ADD\s*:?\s*IGST\s+STAMP\s+DUTY\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
    );
    if (match) {
      result.totalTpPremium = match[4];
      result.netPremium = match[4];
      result.gst = match[5];
      result.totalPayable = match[7];
      result.calculatedTpPremium = match[4];
      return result;
    }

    // Simple fallbacks
    match = text.match(/TOTAL\s+PREMIUM\s+([\d,.]+)/i);
    if (match) {
      result.totalTpPremium = match[1];
      result.netPremium = match[1];
    }
    match = text.match(/IGST\s+([\d,.]+)/i);
    if (match) result.gst = match[1];
    match = text.match(/TOTAL\s+AMOUNT\s+([\d,.]+)/i);
    if (match) result.totalPayable = match[1];
  }

  return result;
};

function OrientalPolicyCard({ item }) {
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};

  const autoInsuredDetails = extractInsuredDetails(item?.fullText || "");
  const policyDates = extractPolicyDates(item?.fullText);
  const extractedVehicle = extractVehicleDetailsFromText(item?.fullText || "");
  const autoPremium = extractPremiumData(item?.fullText || "");
  const insuranceCompany = extractInsuranceCompany(item?.fullText || "");
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
  const policyNumber = extractPolicyNumber(item?.fullText || "");

  const finalPremium = {
    calculatedOdPremium: premium?.calculatedOdPremium || autoPremium?.calculatedOdPremium || "0",
    calculatedTpPremium: premium?.calculatedTpPremium || autoPremium?.calculatedTpPremium || "0",
    totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
    totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
    netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
    gst: premium?.gst || autoPremium?.gst || "0",
    totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
  };

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

export default OrientalPolicyCard;
