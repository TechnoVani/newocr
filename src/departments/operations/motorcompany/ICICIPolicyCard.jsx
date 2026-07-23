// src/components/ICICIPolicyCard.jsx

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
  if (fullText.match(/ICICI\s*Lombard\s*General\s*Insurance\s*Company\s*Limited/i)) {
    return "ICICI LOMBARD GENERAL INSURANCE COMPANY LIMITED";
  }
  const altMatch = fullText.match(/([A-Z\s]+ICICI\s*LOMBARD?\s*INSURANCE?)/i);
  return altMatch ? altMatch[1].trim() : "ICICI LOMBARD GENERAL INSURANCE COMPANY LIMITED";
};

const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "";
  
  const servicingMatch = fullText.match(/Servicing\s*Branch\s*Address\s*:\s*([^\n]+(?:,\s*[^\n]+)*?)(?=\s+(?:Are you|Vehicle\s+Registration|Geographical\s+Area|CERTIFICATE|Policy\s+Issued\s+On|Nominee\s+Name|RTO\s+Location|Hypothecated\s+To|Make|Model|$))/i);
  if (servicingMatch?.[1]) {
    return servicingMatch[1].trim().replace(/\s+No\.?\s*$/, '').replace(/\s+Are\s+you.*$/, '');
  }
  
  const officeMatch = fullText.match(/POLICY ISSUING OFFICE:\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)\s*\n\s*([^\n]+?)(?=\s+(?:Are you|Vehicle\s+Registration|Geographical\s+Area|CERTIFICATE|$))/i);
  if (officeMatch) {
    return [1, 2, 3, 4]
      .map(i => officeMatch[i]?.trim().replace(/\s+(Are you|Vehicle).*$/, ''))
      .filter(part => part && !/^(Are you|Vehicle|Geographical|CERTIFICATE)/i.test(part))
      .join(", ");
  }
  
  return "";
};

const extractInsuredDetails = (text = "") => {
  const result = { insuredName: "", insuredAddress: "", panNumber: "", contactNumber: "", email: "", gstin: "", ncb: "" };
  if (!text) return result;
  
  const normalizedText = normalizeText(text);
  
  let extractedName = "";

  // 1. Try standard Salutation, explicitly excluding generic terms like "Sir/Madam"
  let nameMatch = normalizedText.match(/Dear\s+(?!Customer|Sir\/?Madam|Sir|Madam|Policyholder)([A-Za-z\s\.]+),/i);
  if (nameMatch?.[1]) {
    extractedName = nameMatch[1];
  }

  // 2. Try Top Header pattern (e.g., "Date: Jun 11, 2026 SANDIP SANKAT S/O:...")
  if (!extractedName) {
    const headerMatch = normalizedText.match(/Date\s*:\s*[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+([A-Z\s\.]+?)(?=\s+(?:S\/O|D\/O|W\/O|C\/O|H\.NO|,\s*H\.NO))/i);
    if (headerMatch?.[1]) {
      extractedName = headerMatch[1];
    }
  }

  // 3. Try ICICI Table layout where the name sits directly before the start date month
  if (!extractedName) {
    const tableMatch = normalizedText.match(/(?:Name of Insured|Name of the Insured)[^\n]*\n+([A-Z\s\.]+?)(?=\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})/i);
    if (tableMatch?.[1]) {
      extractedName = tableMatch[1];
    }
  }

  // 4. Original standard Key-Value fallback (ensuring we don't accidentally capture table headers)
  if (!extractedName) {
    const kvMatch = normalizedText.match(/(?:Name of the Insured|Name of Insured|Insured'?s?\s*Name|Insured Name)\s*:?\s*([^\n]+?)(?=\s*Policy No\.|\n|$)/i);
    if (kvMatch?.[1] && !/Period of Insurance|Vehicle Make/i.test(kvMatch[1])) {
      extractedName = kvMatch[1];
    }
  }

  // Final cleanup of the extracted string
  if (extractedName) {
    extractedName = extractedName
      .replace(/\s+/g, " ")
      .replace(/Policy No\..*$/i, '')
      .replace(/\s*Period of Insurance.*$/i, '')
      .trim();
    
    if (extractedName) {
      result.insuredName = extractedName;
    }
  }
  
  result.contactNumber = normalizedText.match(/Mobile\s*No\s*:\s*([X\d\*]+)/i)?.[1] || "";
  
  let email = normalizedText.match(/Email Address\s+([A-Z0-9\*]+@[A-Z]+\.[A-Z]+)/i)?.[1]?.trim() || "";
  if (email === "") email = normalizedText.match(/([A-Z0-9\*]+@GMAIL\.COM)/i)?.[1] || "";
  result.email = email;
  
  const addressPatterns = [
    /Address\s*:\s*([\s\S]+?)(?=\n\s*(?:Period of Insurance|Mobile No|Telephone No|Email Address|GSTIN|Tenure)|$)/i,
    /Address\s*:\s*\n\s*([^\n]+)\n\s*([^\n]+)\n\s*([^\n]+)\n\s*([^\n]+?)(?=\n\s*(?:Period of Insurance|Tenure)|$)/i,
    /Insured'?s?\s*Address\s*([\s\S]+?)(?=\n\s*(?:Period of Insurance|Contact|Mobile|Tenure)|$)/i,
  ];
  
  for (const pattern of addressPatterns) {
    const match = normalizedText.match(pattern);
    if (match?.[1]) {
      if (match.length > 2) {
        result.insuredAddress = [1, 2, 3, 4].map(i => match[i]?.trim()).filter(Boolean).join(", ");
      } else {
        result.insuredAddress = match[1].replace(/\n+/g, ", ").replace(/[ ]{2,}/g, " ").replace(/,\s*,/g, ",").trim();
      }
      break;
    }
  }

  if (result.insuredAddress !== "") {
    result.insuredAddress = result.insuredAddress.replace(/(Tenure|Period of Insurance|Mobile No|Telephone No|Email Address|GSTIN).*$/i, '').replace(/,\s*$/, '').trim() || "";
  }
  
  result.gstin = normalizedText.match(/GSTIN\s*No\.?\s*\(Customer\)\s*:\s*([A-Z0-9]{15})/i)?.[1] || "";
  
  return result;
};

const extractPolicyDates = (fullText = "") => {
  const result = { startDate: "", odExpireDate: "", tpExpireDate: "" };
  if (!fullText) return result;

  const odLabelMatch = fullText.match(
    /Period of Insurance(?: - Own Damage)?\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2})?)\s*(?:to|Till|until|Midnight of)\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
  );
  const tpLabelMatch = fullText.match(
    /Period of Insurance - Third Party\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2})?)\s*(?:to|Till|until|Midnight of)\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
  );

  if (odLabelMatch) {
    result.startDate = odLabelMatch[1].trim();
    result.odExpireDate = odLabelMatch[2].trim();
  }
  if (tpLabelMatch) {
    result.tpExpireDate = tpLabelMatch[2].trim();
  }

  if (result.tpExpireDate === "") {
    const twoRanges = fullText.match(
      /([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
    );
    if (twoRanges) {
      if (!result.startDate) result.startDate = twoRanges[1].trim();
      if (!result.odExpireDate) result.odExpireDate = twoRanges[2].trim();
      result.tpExpireDate = twoRanges[4].trim(); 
    }
  }

  if (result.tpExpireDate === "") {
    const rangeRegex = /([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+(?:to|Till|until|Midnight of)\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/gi;
    const matches = [];
    let match;
    while ((match = rangeRegex.exec(fullText)) !== null) {
      matches.push({ start: match[1].trim(), end: match[2].trim() });
    }
    if (matches.length >= 2) {
      if (!result.startDate) result.startDate = matches[0].start;
      if (!result.odExpireDate) result.odExpireDate = matches[0].end;
      result.tpExpireDate = matches[1].end;
    } else if (matches.length === 1) {
      if (!result.startDate) result.startDate = matches[0].start;
      if (!result.odExpireDate) result.odExpireDate = matches[0].end;
      if (!result.tpExpireDate) result.tpExpireDate = matches[0].end;
    }
  }

  return result;
};

const extractDateOfIssue = (text = "") => {
  // 1. Try standard Policy Issued On label
  let issueDate = text.match(/Policy Issued [Oo]n\s*:\s*([A-Za-z]+\s*\d{1,2},\s*\d{4})/i)?.[1];
  
  // 2. Fallback to Receipt Date if not found
  if (!issueDate) {
    const receiptMatch = text.match(/Receipt Date\s+([0-9]{2}-[0-9]{2}-[0-9]{4})/i);
    if (receiptMatch) {
      issueDate = receiptMatch[1];
    }
  }
  
  return issueDate || "";
};

const extractIDV = (text = "") => {
  if (!text) return "";
  
  const tableBlock = text.match(/Total IDV\s*\(`\)([\s\S]+?)(?:Premium Details|OWN DAMAGE)/i);
  if (tableBlock) {
    const numbers = tableBlock[1].match(/\b\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?\b|\b\d{4,}\b/g);
    if (numbers && numbers.length > 0) {
      const idvCandidates = numbers.filter(n => parseFloat(n.replace(/,/g, "")) > 1000);
      if (idvCandidates.length > 0) {
        return idvCandidates[idvCandidates.length - 1].replace(/,/g, "").replace(/\.\d*$/, "");
      }
    }
  }

  const fallbackMatch = text.match(/(?:Total|Vehicle)\s*IDV\s*\(`\)\s*([\d,]+\.?\d*)/i);
  if (fallbackMatch && parseFloat(fallbackMatch[1].replace(/,/g, "")) > 1000) {
    return fallbackMatch[1].replace(/,/g, "").replace(/\.\d*$/, "");
  }

  return "";
};

const extractPreviousPolicyNumber = (text = "") => {
  return text?.match(/Previous\s+Policy\s+No\.[\s\S]*?\n?\s*([A-Z0-9/-]{10,})/i)?.[1]?.trim() || "";
};

const extractPreviousInsurer = (text = "") => {
  if (!text) return "";
  return text.match(/\d{2}-\d{2}-\d{4}\s+to\s+\d{2}-\d{2}-\d{4}\s+\d+%\s+\d+\s+([A-Z]+)\s+(?:Comprehensive|Package|Liability|Third|Party|Insurance|Details)/i)?.[1]?.trim() || 
         text.match(/\d{2}-\d{2}-\d{4}\s+to\s+\d{2}-\d{2}-\d{4}\s+\d+%\s+\d+\s+([A-Z]{2,20})\b/i)?.[1]?.trim() || "";
};

const extractPremiumData = (text = "") => {
  const result = {
    basicOdPremium: "", ncbPercentage: "", totalOdPremium: "", totalTpPremium: "", netPremium: "", gst: "", totalPayable: ""
  };
  
  if (!text) return result;
  
  const extractVal = (regex) => text.match(regex)?.[1]?.replace(/,/g, "") || "";

  result.basicOdPremium = extractVal(/Basic OD Premium\s*\n?\s*([\d,]+\.?\d*)/i);
  result.ncbPercentage = text.match(/No Claim Bonus\s*(\d+)%/i)?.[1] || "";
  result.totalOdPremium = extractVal(/Total Own Damage Premium\(A\)\s*\n?\s*([\d,]+\.?\d*)/i);
  result.totalTpPremium = extractVal(/Total Liability Premium\s*\(B\)\s*`?\s*([\d,]+\.?\d*)/i);
  
  result.netPremium = extractVal(/Total Package Premium\s*\(A\+B\)\s*:?\s*([\d,]+\.?\d*)/i) || 
                      extractVal(/Total Premium\s*:?\s*`?\s*([\d,]+\.?\d*)/i) || 
                      extractVal(/Total Own Damage Premium\(A\) \s*:?\s*`?\s*([\d,]+\.?\d*)/i) || 
                      extractVal(/Total Premium Payable In\s+`\s*([\d,]+\.?\d*)/i);

  if (!result.netPremium) {
    const od = parseFloat(result.totalOdPremium) || 0;
    const tp = parseFloat(result.totalTpPremium) || 0;
    
    if (od > 0 || tp > 0) {
      result.netPremium = (od + tp).toFixed(2).replace(/\.00$/, "");
    }
  }
  
  const cgst = text.match(/CGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);
  const sgst = text.match(/SGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);
  if (cgst && sgst) {
    result.gst = (parseFloat(cgst[1].replace(/,/g, "")) + parseFloat(sgst[1].replace(/,/g, ""))).toString();
  }
  
  result.totalPayable = extractVal(/Total Premium Payable In\s+`\s*([\d,]+\.?\d*)/i) || extractVal(/Total Premium Payable\s*:?\s*`?\s*([\d,]+\.?\d*)/i);
  
  return result;
};

// =======================================
// VEHICLE EXTRACTION (FULLY DYNAMIC)
// =======================================

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
    idv: ""
  };
  
  if (!text || typeof text !== "string") return result;
  
  const normalizedText = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  const textWithoutHeaders = normalizedText.replace(/Vehicle Registration No\.?\s*Make\s*Model\s*Type of Body\s*CC\/KW\s*Mfg Yr\s*Seating Capacity\s*Chassis No\.?\s*Engine No\.?/gi, " ");

  const applyVariantSplit = (rawModelString) => {
    if (!rawModelString) return;
    const words = rawModelString.split(/\s+/);
    let variantStart = -1;
    
    const variantPattern = /^(LXI|VXI|ZXI|ZXI\+|ALPHA|DELTA|SIGMA|ZETA|SMART|HYBRID|SPORT|SPORTS|PLUS|AGS|AMT|CVT|AT|PETROL|DIESEL|CNG|EV|ELECTRIC|STD|DLX|VX|ZX|LX|EX|SX|DISC|DRUM|OBD|OBD2|OBD2B|BS4|BS6|SPECIAL|EDITION|RACE|DELUXE|PRO|ABS|CBS|CRYSTA|\d\.\d[A-Z]*)$/i;
    
    for (let i = 0; i < words.length; i++) {
      if (variantPattern.test(words[i])) {
        variantStart = i;
        break;
      }
    }
    
    if (variantStart > 0) {
      result.model = words.slice(0, variantStart).join(" ").trim();
      result.variant = words.slice(variantStart).join(" ").trim();
    } else if (variantStart === 0) {
       result.model = "";
       result.variant = rawModelString;
    } else {
      result.model = rawModelString;
      result.variant = "";
    }
  };

  // 1. RISK ASSUMPTION LETTER SLASH-FORMAT EXTRACTION
  const slashMakeModel = text.match(/([A-Za-z0-9&]+(?:\s+[A-Za-z0-9&]+){0,4})\s*\/\s*([A-Za-z0-9\s.\-\/]+?)(?:\s+[A-Z]{3,}(?:\s+[A-Z]{3,})?\s*-\s*[A-Z]{3,}|$|\n)/i);
  if (slashMakeModel) {
    let rawMake = slashMakeModel[1].trim();
    // Added \bto\b to prevent stripping "TO" from words like "MOTORS"
    rawMake = rawMake.replace(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{4}|\bto\b|Midnight of|Midnight|\b\d{4}\b)\s*/gi, "").trim();
    result.make = rawMake;
    
    let rawModel = slashMakeModel[2].trim();
    rawModel = rawModel.replace(/\s+[A-Z]{3,}(?:\s+[A-Z]{3,})?\s*-\s*[A-Z]{3,}.*/i, "");
    rawModel = rawModel.replace(/\s+(MADHYA PRADESH|CHHATTISGARH|MAHARASHTRA|GUJARAT|RAJASTHAN|UTTAR PRADESH|ANDHRA PRADESH|TAMIL NADU|WEST BENGAL).*$/i, "");
    rawModel = rawModel.replace(/\s*\b/i, "");
    
    applyVariantSplit(rawModel.trim());
  }

  // 2. EXPLICIT RISK ASSUMPTION ROW MATCHER
  const raRowMatch = textWithoutHeaders.match(/([A-Z]{2}[0-9]{1,2}[A-Z]*[0-9]{4})\s+[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+([A-Z0-9]{5,25})\s+([A-Z0-9]{17})\s+\d{1,3}%/i);
  if (raRowMatch) {
    if (!result.registrationNumber) result.registrationNumber = raRowMatch[1];
    if (!result.engineNumber) result.engineNumber = raRowMatch[2];
    if (!result.chassisNumber) result.chassisNumber = raRowMatch[3];
  }

  // 3. SPECS BLOCK MATCHER (Adjusted for removal of bodyType)
  const specsMatch = textWithoutHeaders.match(/\b([A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s+(\d{2,5})\s+(19\d{2}|20\d{2})\s+(\d{1,3})\b/);
  if (specsMatch) {
    if (!result.cubicCapacity) result.cubicCapacity = specsMatch[2];
    if (!result.manufacturingYear) result.manufacturingYear = specsMatch[3];
    if (!result.seatingCapacity) result.seatingCapacity = specsMatch[4];
  }

  const parseDynamicMakeModelBody = (combinedString) => {
    if (!combinedString) return;
    let remainingString = combinedString.trim();
    
    if (result.make && remainingString.toUpperCase().includes(result.make.toUpperCase())) {
      remainingString = remainingString.replace(new RegExp(result.make, 'i'), "").trim();
    } else if (!result.make) {
      const parts = remainingString.split(/\s+/);
      result.make = parts[0] || "";
      remainingString = parts.slice(1).join(" ").trim();
    }
    
    let modelRaw = remainingString;
    modelRaw = modelRaw.replace(/\s*\bSEATER\b/i, "");
    if (!result.model) applyVariantSplit(modelRaw);
  };

  // 4. DYNAMIC TABLE MATCH
  const tablePattern = /(NEW|[A-Z0-9]{8,11})\s+([A-Za-z0-9\s.-]+?)\s+(\d{2,5})\s+(\d{4})\s+(\d{1,2})\s+([A-Z0-9\s]{15,20})\s+([A-Z0-9]{10,15})/i;
  const tableMatch = textWithoutHeaders.match(tablePattern);
  if (tableMatch) {
    if (!result.registrationNumber) result.registrationNumber = tableMatch[1].trim();
    parseDynamicMakeModelBody(tableMatch[2]);
    if (!result.chassisNumber) result.chassisNumber = tableMatch[6].replace(/\s+/g, ""); 
    if (!result.engineNumber) result.engineNumber = tableMatch[7].trim();
  }

  // 5. PARTIAL TEXT MATCH
  if (!result.make || !result.model) {
    const partialPattern = /(NEW|[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4})\s+([A-Z0-9\s.-]{5,50})(?=\s+(?:\d{2,4}\b|$))/i;
    const partialMatch = textWithoutHeaders.match(partialPattern);
    if (partialMatch) {
      if (!result.registrationNumber) result.registrationNumber = partialMatch[1].trim();
      parseDynamicMakeModelBody(partialMatch[2]);
    }
  }

  // 6. EXPLICIT LABEL FALLBACKS
  if (!result.registrationNumber) {
    const regMatch = textWithoutHeaders.match(/Vehicle Registration No\.?\s*\.?\s*(NEW|[A-Z0-9]+)/i);
    if (regMatch?.[1]) result.registrationNumber = regMatch[1].trim();
  }
  
  if (!result.chassisNumber) {
    const chassisMatch = textWithoutHeaders.match(/Chassis No\.?\s*\.?\s*([A-Z0-9]+)/i);
    if (chassisMatch?.[1]) result.chassisNumber = chassisMatch[1].trim();
  }

  if (!result.engineNumber || result.engineNumber.length < 8 || /^\d+$/.test(result.engineNumber)) {
    const vehicleSection = textWithoutHeaders.match(/Vehicle Registration No[\s\S]*?Vehicle IDV/i);
    if (vehicleSection?.[0]) {
      const values = vehicleSection[0].match(/\b[A-Z0-9]{10,25}\b/g) || [];
      const engineCandidate = values[values.length - 1];
      if (engineCandidate && engineCandidate !== result.registrationNumber) {
        result.engineNumber = engineCandidate;
      }
    }
  }

  // 7. SECONDARY FIELDS
  if (!result.idv) {
    let idvMatch = textWithoutHeaders.match(/Vehicle IDV\s*\(`\)\s*([\d,]+\.?\d*)/i);
    if (!idvMatch) idvMatch = textWithoutHeaders.match(/Total IDV\s*\(`\)\s*([\d,]+\.?\d*)/i);
    if (idvMatch?.[1] && parseFloat(idvMatch[1].replace(/,/g, "")) > 1000) {
      result.idv = idvMatch[1].replace(/,/g, "").replace(/\.\d*$/, "");
    }
  }

  const fuelMatch = textWithoutHeaders.match(/Type of fuel\s*[:\-]?\s*([A-Za-z\s]+?)(?=\s*(?:Cubic|CC|Engine|$))/i);
  if (fuelMatch?.[1]) result.fuelType = fuelMatch[1].trim().toUpperCase();
  if (!result.fuelType) {
    const nearFuelMatch = textWithoutHeaders.match(/fuel\s+([A-Za-z]+)/i);
    if (nearFuelMatch?.[1]) result.fuelType = nearFuelMatch[1].toUpperCase();
  }
  
  const colourMatch = textWithoutHeaders.match(/Colour\s*[:\-]?\s*([A-Za-z\s]+?)(?=\s*(?:Type of fuel|Year of manufacture|Registration|Variant|$))/i);
  if (colourMatch?.[1]) result.colour = colourMatch[1].trim().toUpperCase();
  
  const geoMatch = textWithoutHeaders.match(/Geographical Area\s*:\s*([A-Za-z\s]+?)(?=\s+(?:Applicable|Compulsory|CERTIFICATE|$))/i);
  if (geoMatch?.[1]) result.geographicalArea = geoMatch[1].trim();
  
  const finMatch = textWithoutHeaders.match(/Hypothecated To\s*:\s*([^,\n]+(?:[,\s]+[A-Z]+)?)/i);
  if (finMatch?.[1]) {
    const financierValue = finMatch[1].trim();
    if (financierValue === "" || financierValue.toLowerCase() === "none") {
      result.financierName = "";
    } else {
      result.financierName = typeof formatFinancierName === 'function' ? formatFinancierName(financierValue) : financierValue;
    }
  }

  const ncbPatterns = [
    /No\s*Claim\s*Bonus(?:\s*\(NCB\))?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%/i,
    /\bNCB(?:\s*(?:Discount|Percentage|Applicable))?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%/i,
    /\bNCB\s*\(\s*%\s*\)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    /Deduct\s*(\d+(?:\.\d+)?)\s*%\s*for\s*NCB/i // <-- Added new pattern
  ];
  
  for (const pattern of ncbPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      result.ncb = `${match[1]}%`;
      break;
    }
  }
  
  const gvwMatch = textWithoutHeaders.match(/Gross Vehicle Weight\s*[:\-]?\s*([\d,]+)/i);
  if (gvwMatch?.[1]) result.gvw = gvwMatch[1];

  // 8. FINAL DYNAMIC CLEANUP 
  if (result.make) result.make = result.make.replace(/[,;:]/g, "").trim();
  if (result.model) result.model = result.model.replace(/[,;:]/g, "").trim();

  return result;
};

// =======================================
// REACT COMPONENT
// =======================================

const sanitizeValue = (value) => (value === null || value === undefined ? "" : (typeof value === "string" ? value.trim() : value));
const sanitizeObject = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sanitizeValue(v)]));

function ICICIPolicyCard({ item }) {
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};

  const autoInsuredDetails = extractInsuredDetails(item?.fullText || "");
  const extractedVehicle = extractVehicleDetailsFromText(item?.fullText || "");
  const autoPremium = extractPremiumData(item?.fullText || "");

  const mergedVehicleRaw = { ...vehicle };
  for (const key in extractedVehicle) {
    if (extractedVehicle[key] !== "") mergedVehicleRaw[key] = extractedVehicle[key];
  }
  
  mergedVehicleRaw.idv = extractedVehicle.idv !== "" ? extractedVehicle.idv : sanitizeValue(extractIDV(item?.fullText));

  return (
    <PolicyCardView
      item={item}
      policyNumber={sanitizeValue(policy?.policyNumber || item?.fullText?.match(/Policy No\.?\s*:\s*([0-9\/O]+)/i)?.[1])}
      insuranceCompany={sanitizeValue(extractInsuranceCompanyName(item?.fullText || ""))}
      branchAddress={sanitizeValue(extractBranchAddress(item?.fullText || ""))}
      productType={sanitizeValue(getProductType(policy?.policyType, item?.fullText))}
      vehicleCategory={sanitizeValue(getVehicleCategory(policy?.policyType, item?.fullText))}
      insuredName={sanitizeValue(insured?.insuredName || autoInsuredDetails?.insuredName)}
      panNumber={sanitizeValue(insured?.panNumber || autoInsuredDetails?.panNumber)}
      gstin={sanitizeValue(autoInsuredDetails?.gstin)}
      contactNumber={sanitizeValue(insured?.contactNumber || autoInsuredDetails?.contactNumber)}
      email={sanitizeValue(insured?.email || autoInsuredDetails?.email)}
      insuredAddress={sanitizeValue(insured?.insuredAddress || autoInsuredDetails?.insuredAddress)}
      policyDates={sanitizeObject(extractPolicyDates(item?.fullText))}
      dateOfIssue={sanitizeValue(extractDateOfIssue(item?.fullText))}
      totalValue={mergedVehicleRaw.idv}
      previousInsurer={sanitizeValue(extractPreviousInsurer(item?.fullText))}
      previousPolicyNumber={sanitizeValue(extractPreviousPolicyNumber(item?.fullText))}
      finalPremium={sanitizeObject({
        ...premium,
        ...autoPremium
      })}
      vehicle={sanitizeObject(mergedVehicleRaw)}
      extractedVehicle={sanitizeObject({
        ...extractedVehicle,
        model: extractedVehicle.model || "-",
        variant: extractedVehicle.variant || "-"
      })}
    />
  );
}

export default ICICIPolicyCard;