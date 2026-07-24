// src/components/IndusindPolicyCard.jsx

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

const removeHyphens = (value) => {
  if (!value || value === "-") return "-";
  return String(value).replace(/-/g, "");
};

// =======================================
// EXTRACTION FUNCTIONS
// =======================================

const extractFinancierName = (text = "") => {
  if (!text) return "-";
  const match = text.match(/Hypothecation\s*\/?\s*Lease\s*[:]?\s*([^\/,\n]+)/i);
  if (match && match[1]) {
    let name = match[1].trim().replace(/\s+/g, " ").replace(/:/g, "");
    // Only return if the name contains the word "Bank" (case‑insensitive)
    if (/\bBank\b/i.test(name)) {
      return name.toUpperCase() || "-";
    }
  }
  return "-";
};

const extractInsuranceCompanyName = (fullText = "") => {
  if (!fullText) return "-";
  
  const patterns = [
    /(IndusInd\s*General\s*Insurance\s*Company\.?\s*Limited\.?)/i,
    /([A-Z][a-z]+\s+General\s+Insurance\s+Company\s+Limited)/i,
    /Insurance\s*Company\s*:\s*([^\n]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return "-";
};

const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "-";
  
  const patterns = [
    // NEW: If there are two addresses separated by ". ", take the second one
    /Policy Issuing Branch\s*:\s*.*?\.\s+([^.\n]+(?:MAHARASHTRA|MADHYA PRADESH)[^.\n]*?\d{6})/i,
    // Original patterns (fallback)
    /Policy Issuing Branch\s*:\s*([^.\n]+?(?:MADHYA PRADESH|MAHARASHTRA)[^.\n]*?\d{6})/i,
    /Policy Issuing Branch\s*:\s*([^\n]+)/i,
    /Branch\s*Address\s*:\s*([^\n]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      let address = match[1].trim();
      address = address
        .replace(/\s+/g, " ")                // normalize spaces
        .replace(/,$/, "")                   // remove trailing comma
        .replace(/insuredAddress/gi, "")     // remove the literal string "insuredAddress"
        .trim();
      if (address.length > 10) {
        return address;
      }
    }
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
    /Insured'?s?\s*Name\s*[:]?\s*([^\n]+?)(?=\s*Period of Insurance|\n|$)/i,
    /Insured Name\s*[:]?\s*([^\n]+?)(?=\s*Period of Insurance|\n|$)/i,
    /Proposer'?s?\s*Full Name\s*[:]?\s*(?:Mr\.|Mrs\.|Ms\.|M\/S\.)?\s*([^\n]+?)(?=\s*Period of Insurance|\n|$)/i
  ];

  for (const pattern of namePatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      insuredName = match[1].replace(/\s+/g, " ").trim();
      insuredName = insuredName.replace(/\s*Period of Insurance.*$/i, '');
      if (!insuredName.match(/^(Mr\.|Mrs\.|Ms\.|M\/S\.)/i) && insuredName !== "-") {
        insuredName = `Mr. ${insuredName}`;
      }
      break;
    }
  }
  
  let panNumber = "-";
  const panPatterns = [
    /PAN\s*No\.?\s*[:]?\s*([A-Z]{5}[0-9]{4}[A-Z]{1})/i,
    /PAN\s*[:]?\s*([A-Z]{5}[0-9]{4}[A-Z]{1})/i
  ];
  for (const pattern of panPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      panNumber = match[1].toUpperCase();
      break;
    }
  }
  
  let contactNumber = "-";
  const contactPatterns = [
    /Mobile\s*No:\s*([\d\*]+)/i,
    /Mobile\s*No\.?\s*[:]?\s*([\d\*]{10,})/i
  ];
  for (const pattern of contactPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      contactNumber = match[1];
      break;
    }
  }
  
  let email = "-";
  const emailMatch = normalizedText.match(/Email\s*-\s*ID\s*:\s*([^\s]+)/i);
  if (emailMatch && emailMatch[1]) {
    let extractedValue = emailMatch[1].trim();
    extractedValue = extractedValue.split(/GSTIN|UIN/i)[0];
    let cleanedValue = extractedValue.replace(/-ID$/i, '');
    
    if (extractedValue === "-ID" || extractedValue.match(/^-ID$/i)) {
      email = "N/A";
    } else if (cleanedValue.includes('@') && cleanedValue !== '-') {
      email = cleanedValue;
    } else if (email === "-") {
      email = "N/A";
    }
  }
  
  let insuredAddress = "-";
  const commAddressMatch = normalizedText.match(/Communication Address & Place of Supply :\s*([^.\d]+(?:[A-Za-z\s,]+(?:)[^.\d]*\d{6}))/i);
  if (commAddressMatch && commAddressMatch[1]) {
    insuredAddress = commAddressMatch[1]
      .replace(/\n+/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/^(?:Mr\.\s+)?(?:\s+\s+)?(?:\s+)/i, '')
      .trim();
  } 
  
  if (insuredAddress === "-") {
    const welcomeMatch = normalizedText.match(/(?:Mr\.|Mrs\.)\s+[A-Z]+\s+[A-Z]+\s+([\s\S]*?)(?=\d{6})/i);
    if (welcomeMatch && welcomeMatch[1]) {
      const pincodeMatch = normalizedText.match(/\d{6}/);
      insuredAddress = (welcomeMatch[1] + (pincodeMatch ? pincodeMatch[0] : ''))
        .replace(/\n+/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/^[A-Z]+\s+/, '')
        .trim();
    }
  }
  
 let gstin = "-";
  
  
  return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin };
};

const extractPolicyDates = (fullText = "") => {
  if (!fullText) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };

  const normalized = fullText.replace(/\s+/g, ' ');

  const odMatch = normalized.match(/Own\s+Damage\s*-\s*Section-I\s+Period\s*:.*?From\s*:.*?on\s+(\d{2}-\w{3}-\d{4}).*?to\s+.*?of\s+(\d{2}-\w{3}-\d{4})/i) ||
                  normalized.match(/Period\s+of\s+Insurance\s*:\s*From\s+[\d:]+ Hrs\s+on\s+(\d{2}-\w{3}-\d{4})\s+to\s+Midnight\s+of\s+(\d{2}-\w{3}-\d{4})/i);

  const tpMatch = 
  normalized.match(/Liability\s*-\s*Section-II\s+Period\s*:.*?to\s+.*?of\s+(\d{2}-\w{3}-\d{4})/i) ||
  normalized.match(/Existing\s+TP\s+Policy\s+Period.*?To\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);

  if (odMatch) {
    const startDate = odMatch[1];
    const odExpireDate = odMatch[2];
    const tpExpireDate = tpMatch ? tpMatch[1] : odExpireDate;
    return { startDate, odExpireDate, tpExpireDate };
  }

  const bundledODMatch = normalized.match(/OD Cover\s*(\d{2}\/\d{2}\/\d{4})\s*\d{2}:\d{2}:\d{2}\s*(?:AM|PM)\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  const bundledTPMatch = normalized.match(/TP Cover\s*(\d{2}\/\d{2}\/\d{4})\s*\d{2}:\d{2}:\d{2}\s*(?:AM|PM)\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (bundledODMatch) {
    return {
      startDate: bundledODMatch[1] || "-",
      odExpireDate: bundledODMatch[2] || "-",
      tpExpireDate: bundledTPMatch?.[2] || bundledODMatch[2] || "-"
    };
  }

  const periodMatch = normalized.match(/Period of cover\s*(\d{2}\/\d{2}\/\d{4})(?:.*?)to\s*(\d{2}\/\d{2}\/\d{4})/i);
  let tpExpiryDate = periodMatch?.[2] || "-";
  const bundledLiabilityMatch = normalized.match(/Bundled\/Liability Policy\s*period:\s*\d{2}\/\d{2}\/\d{4}\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (bundledLiabilityMatch?.[1]) tpExpiryDate = bundledLiabilityMatch[1];
  const periodOnlyMatch = normalized.match(/period:\s*\d{2}\/\d{2}\/\d{4}\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (periodOnlyMatch?.[1]) tpExpiryDate = periodOnlyMatch[1];

  return { startDate: periodMatch?.[1] || "-", odExpireDate: periodMatch?.[2] || "-", tpExpireDate: tpExpiryDate };
};

const extractDateOfIssue = (text = "") => {
  if (!text) return "-";
  
  let match = text.match(/&\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})(?:\s+\d{2}:\d{2})?/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  match = text.match(/Tax Invoice No\. & Date\s*[:]?\s*.*?&?\s*(\d{4}-\d{2}-\d{2})/i);
  return match?.[1] || "-";
};

const extractIDV = (text = "") => {
  if (!text) return "-";
  
  const totalIdvMatch = text.match(/Total\s+IDV\s*`?\s*([\d,]+(?:\.\d+)?)/i);
  if (totalIdvMatch && totalIdvMatch[1]) {
    const numStr = totalIdvMatch[1].replace(/,/g, '');
    const num = parseFloat(numStr);
    return Math.floor(num).toString();
  }
  
  const vehicleIdvMatch = text.match(/Vehicle\s+IDV\s*([\d,]+(?:\.\d+)?)/i);
  if (vehicleIdvMatch && vehicleIdvMatch[1]) {
    const numStr = vehicleIdvMatch[1].replace(/,/g, '');
    const num = parseFloat(numStr);
    return Math.floor(num).toString();
  }
  
  return "-";
};

const extractPreviousPolicyNumber = (text = "") => {
  const match = text.match(/Existing TP Policy Period\s+([A-Z0-9\/\-]+)/i);
  return match?.[1] || "-";
};

const extractPreviousInsurer = (text = "") => {
  const parts = text.split(/\s{2,}/);
  const idx = parts.findIndex(p => p.includes("Existing TP Policy Company Name"));
  if (idx !== -1 && parts[idx + 3]) {
    return parts[idx + 3].trim();
  }
  return "-";
};

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
  
  const totalOdMatch = text.match(/TOTAL\s+OWN\s+DAMAGE\s+PREMIUM\s*(\d+(?:\.\d+)?)/i);
  if (totalOdMatch) result.totalOdPremium = totalOdMatch[1];
  
  const totalLiabilityMatch = text.match(/TOTAL\s+LIABILITY\s+PREMIUM\s*([\d,]+\.\d+)/i);
  if (totalLiabilityMatch) result.totalTpPremium = totalLiabilityMatch[1].replace(/,/g, "");
  
  const packageMatch = text.match(/TOTAL\s+(?:PACKAGE\s+)?PREMIUM\s*\([^)]+\)\s*([\d,]+(?:\.\d+)?)/i);
  if (packageMatch) result.netPremium = packageMatch[1].replace(/,/g, "");
  
  const gstMatch = text.match(/IGST\s*\(@?\s*[\d.]+%\s*\)\s*(\d+\.\d+)/i);
  if (gstMatch && gstMatch[1]) {
    result.gst = gstMatch[1];
  }
  
  const totalMatch = text.match(/TOTAL\s+PREMIUM\s+PAYABLE\s*\([^)]*\)\s*([\d,]+\.\d+)/i);
  if (totalMatch) result.totalPayable = totalMatch[1].replace(/,/g, "");
  
  return result;
};

const extractVehicleDetailsFromText = (text) => {
  const result = {
    registrationNumber: "-",
    dateOfRegistration: "-",
    chassisNumber: "-",
    engineNumber: "-",
    make: "-",
    model: "-",
    variant: "-",
    manufacturingYear: "-",
    fuelType: "-",
    cubicCapacity: "-",
    seatingCapacity: "-",
    gvw: "-",
    ncb: "0%"
  };
  
  if (!text) return result;

  // Registration Number (with hyphen removal)
  const regPatterns = [
    /Registration\s*No\.?\s*([A-Z0-9\-]{2,}?)(?:\s*Mfg|\s*$|\n)/i,
    /Registration\s*No\.?\s*[:]?\s*([A-Z0-9\-]{2,})(?=\s|$|Mfg)/i,
    /\b([A-Z]{2}\d{2}[A-Z]{2}\d{4})\b/i
  ];

  for (const pattern of regPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let regNum = match[1].trim();
      regNum = regNum.replace(/Mfg$/i, '');
      result.registrationNumber = removeHyphens(regNum);
      break;
    }
  }

  // Engine & Chassis
  const combinedMatch = text.match(/Engine\s*No\.?\s*\/\s*Chassis\s*No\.?\s*(?:\/\s*Motor\s*No\.?\s*)?\s*([A-Z0-9]+)\s*\/\s*([A-Z0-9]+)/i);
  if (combinedMatch) {
    result.engineNumber = combinedMatch[1].trim();
    result.chassisNumber = combinedMatch[2].trim();
  } else {
    const enginePatterns = [
      /Engine\s*No\.?\s*[:]?\s*([A-Z0-9]+)/i,
      /Engine\s*Number\s*[:]?\s*([A-Z0-9]+)/i
    ];
    for (const pattern of enginePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.engineNumber = match[1].trim();
        break;
      }
    }

    const chassisPatterns = [
      /Chassis\s*No\.?\s*[:]?\s*([A-Z0-9]{10,})/i,
      /Chassis.*?([A-Z0-9]{12,})/i
    ];
    for (const pattern of chassisPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let chassis = match[1].trim();
        chassis = chassis.replace(/(Seating|Mfg|Make|Model|Variant|Type).*$/i, '');
        result.chassisNumber = chassis;
        break;
      }
    }
  }

  // Make, Model, Variant
  const makeModelMatch = text.match(/Make\s*\/\s*Model\s*&\s*Variant\s*[:]?\s*([^\n]+)/i);

  if (makeModelMatch && makeModelMatch[1]) {
    let fullText = makeModelMatch[1].trim();
    fullText = fullText.split(/\s*CC\s*\/\s*HP\s*\/\s*Watt/i)[0].trim();
    
    const variantKeywords = ['CNG', 'PETROL', 'DIESEL', 'LPG', 'BS', 'EV', 'HYBRID', 'GASOLINE', 'ELECTRIC', 'FUEL'];
    let variantStartIndex = -1;
    let upperFullText = fullText.toUpperCase();
    
    for (let kw of variantKeywords) {
      let idx = upperFullText.indexOf(kw);
      if (idx !== -1 && (variantStartIndex === -1 || idx < variantStartIndex)) {
        variantStartIndex = idx;
      }
    }
    
    if (variantStartIndex !== -1) {
      result.variant = fullText.slice(variantStartIndex).trim();
      let beforeVariant = fullText.slice(0, variantStartIndex).trim();
      let words = beforeVariant.split(/\s+/);
      
      const makeSuffixes = ['LTD', 'LTD.', 'LIMITED', 'MOTORS', 'PVT', 'INDIA', 'AUTO', 'CORP'];
      let splitIndex = -1;
      
      for (let i = words.length - 1; i >= 0; i--) {
        if (makeSuffixes.includes(words[i].toUpperCase())) {
          splitIndex = i;
          break;
        }
      }
      
      if (splitIndex !== -1 && splitIndex < words.length - 1) {
        result.make = words.slice(0, splitIndex + 1).join(' ');
        result.model = words.slice(splitIndex + 1).join(' ');
      } else {
        let firstDigitIdx = words.findIndex(w => /\d/.test(w));
        if (firstDigitIdx > 0) {
          let modelStartIdx = firstDigitIdx - 1;
          result.make = words.slice(0, modelStartIdx).join(' ');
          result.model = words.slice(modelStartIdx).join(' ');
        } else {
          result.make = words[0] || "-";
          result.model = words.slice(1).join(' ') || "-";
        }
      }
    } else {
      const parts = fullText.split(/\s+/);
      if (parts.length >= 1) result.make = parts[0];
      if (parts.length >= 2) result.model = parts[1];
      if (parts.length >= 3) result.variant = parts.slice(2).join(' ');
    }
  }

  // Manufacturing Year
  const yearPatterns = [
    /Mfg\.\s*Month\s*&\s*Year\s*[:]?\s*(?:[A-Z]+)-(\d{4})/i,
    /Year\s*of\s*Manufacture\s*[:]?\s*(\d{4})/i
  ];
  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.manufacturingYear = match[1];
      break;
    }
  }

  // Cubic Capacity
  const ccPatterns = [
    /CC\s*\/\s*HP\s*\/\s*Watt\s*[:]?\s*(\d+)/i,
    /(\d+)\s*cc/i
  ];
  for (const pattern of ccPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.cubicCapacity = match[1];
      break;
    }
  }

  // Seating Capacity
  const seatPatterns = [
    /Seating\s*Capacity\s*Including\s*Driver\s*[:]?\s*(\d+)/i,
    /Seating\s*Capacity\s*[:]?\s*(\d+)/i,
    /LCC\s*Including\s*Driver\s*[:]?\s*(\d+)/i // <-- Added new pattern
  ];
  
  for (const pattern of seatPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.seatingCapacity = match[1];
      break;
    }
  }

  // Fuel Type
  const fuelPatterns = [
    /Type\s*of\s*Fuel\s*[:]?\s*([A-Za-z]+)/i,
    /Fuel\s*Type\s*[:]?\s*([A-Za-z]+)/i
  ];
  for (const pattern of fuelPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.fuelType = match[1];
      break;
    }
  }

  // No Claim Bonus
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

  return result;
};

// =======================================
// MAIN COMPONENT
// =======================================

function IndusindPolicyCard({ item }) {
  const sanitizeValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "string" && value.trim() === "") return "-";
    return value;
  };

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
  
  const extractedFinancier = extractFinancierName(item?.fullText || "");

  const insuredName = sanitizeValue(insured?.insuredName || autoInsuredDetails?.insuredName);
  const insuredAddress = sanitizeValue(insured?.insuredAddress || autoInsuredDetails?.insuredAddress);
  const panNumber = sanitizeValue(insured?.panNumber || autoInsuredDetails?.panNumber);
  const contactNumber = sanitizeValue(insured?.contactNumber || autoInsuredDetails?.contactNumber);
  const email = sanitizeValue(insured?.email || autoInsuredDetails?.email);
  const gstin = sanitizeValue(autoInsuredDetails?.gstin);

  const vehicleCategory = sanitizeValue(getVehicleCategory(policy?.policyType, item?.fullText));
  const productType = sanitizeValue(getProductType(policy?.policyType, item?.fullText));
  
  const dateOfIssue = sanitizeValue(extractDateOfIssue(item?.fullText));

  const totalValue = sanitizeValue(extractIDV(item?.fullText));
  const previousPolicyNumber = sanitizeValue(extractPreviousPolicyNumber(item?.fullText));
  const previousInsurer = sanitizeValue(extractPreviousInsurer(item?.fullText));

  const finalPremium = {
    calculatedOdPremium: premium?.calculatedOdPremium || autoPremium?.calculatedOdPremium || "0",
    calculatedTpPremium: premium?.calculatedTpPremium || autoPremium?.calculatedTpPremium || "0",
    totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
    totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
    netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
    gst: premium?.gst || autoPremium?.gst || "0",
    totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
  };

  const sanitizedPolicyDates = {
    startDate: sanitizeValue(policyDates.startDate),
    odExpireDate: sanitizeValue(policyDates.odExpireDate),
    tpExpireDate: sanitizeValue(policyDates.tpExpireDate),
  };

  const policyNumber = sanitizeValue(policy?.policyNumber || item?.fullText?.match(/Policy Number\s*[:]?\s*([0-9]+)/i)?.[1]);

  const sanitizedExtractedVehicle = {
    registrationNumber: sanitizeValue(extractedVehicle.registrationNumber),
    chassisNumber: sanitizeValue(extractedVehicle.chassisNumber),
    engineNumber: sanitizeValue(extractedVehicle.engineNumber),
    make: sanitizeValue(extractedVehicle.make),
    model: sanitizeValue(extractedVehicle.model),
    variant: sanitizeValue(extractedVehicle.variant),
    manufacturingYear: sanitizeValue(extractedVehicle.manufacturingYear),
    fuelType: sanitizeValue(extractedVehicle.fuelType),
    cubicCapacity: sanitizeValue(extractedVehicle.cubicCapacity),
    seatingCapacity: sanitizeValue(extractedVehicle.seatingCapacity),
    financierName: sanitizeValue(extractedFinancier),
    gvw: sanitizeValue(extractedVehicle.gvw),
  };

  return (
    <PolicyCardView
      item={item}
      policyNumber={policyNumber}
      insuranceCompany={sanitizeValue(insuranceCompany)}
      branchAddress={sanitizeValue(branchAddress)}
      productType={productType}
      vehicleCategory={vehicleCategory}
      insuredName={insuredName}
      panNumber={panNumber}
      gstin={gstin}
      contactNumber={contactNumber}
      email={email}
      insuredAddress={insuredAddress}
      policyDates={sanitizedPolicyDates}
      dateOfIssue={dateOfIssue}
      totalValue={totalValue}
      previousInsurer={previousInsurer}
      previousPolicyNumber={previousPolicyNumber}
      finalPremium={finalPremium}
      vehicle={vehicle}
      extractedVehicle={sanitizedExtractedVehicle}
    />
  );
}

export default IndusindPolicyCard;
