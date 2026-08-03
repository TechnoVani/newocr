// // src/components/RoyalSundaramPolicyCard.jsx

// import PolicyCardView from "./PolicyCardView";
// import { getProductType, getVehicleCategory } from "./PolicyClassification";

// // =======================================
// // UTILITY FUNCTIONS
// // =======================================

// const cleanValue = (value) => {
//   if (!value) return "-";
//   return String(value)
//     .replace(/\s+/g, " ")
//     .replace(/[\n\r]+/g, " ")
//     .trim();
// };

// // =======================================
// // TEXT NORMALIZATION HELPER
// // =======================================

// const normalizeText = (text) => {
//   if (!text) return "";
//   return text
//     .replace(/\r/g, "\n")
//     .replace(/\t/g, " ")
//     .replace(/[ ]{2,}/g, " ");
// };

// // =======================================
// // EXTRACTION FUNCTIONS
// // =======================================

// const extractInsuranceCompanyName = (fullText = "") => {
//   if (!fullText) return "-";
//   const match = fullText.match(/Royal Sundaram/i);
//   if (match) return "Royal Sundaram General Insurance Co. Limited";
//   return "-";
// };

// const extractBranchAddress = (fullText = "") => {
//   if (!fullText) return "-";
  
//   const addressMatch = fullText.match(/(\d+(?:st|nd|rd|th)?\s*Floor[,\s]+[A-Za-z\s,]+(?:BHOPAL|CHENNAI)[,\s]+[\d\-]+)/i);
//   if (addressMatch) {
//     return addressMatch[1].trim();
//   }
  
//   if (fullText.includes("Alankar Complex") && fullText.includes("MP Nagar")) {
//     return "3rd Floor, Alankar Complex, Plo # 11, Zone-II, MP Nagar, D2-Bhopal, BHOPAL - 462011";
//   }
  
//   return "-";
// };

// const extractInsuredDetails = (text = "") => {
//   if (!text) {
//     return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
//   }
//   const normalizedText = normalizeText(text);
//   let insuredName = "-";
  
//   const namePatterns = [
//     /Name of the Insured\s*:\s*([^\n]+?)(?=\s*(?:Mobile No\.|Email ID|Make of the Vehicle|$))/i,
//     /Mr\.([A-Z\s]+?)(?=\s*(?:S\/O:|Mobile|Email|$))/i,
//     /Insured'?s?\s*Name\s*([^\n]+?)(?=\s*(?:Mobile|Email|$))/i,
//     /Insured Name:\s*([^,\n]+)/i,
//     /Address of insured:\s*Insured Name:\s*([^\n]+)/i,
//   ];
//   for (const pattern of namePatterns) {
//     const match = normalizedText.match(pattern);
//     if (match?.[1]) {
//       let rawName = match[1].replace(/\s+/g, " ").trim();
//       if (rawName.includes("C/O")) {
//         rawName = rawName.split("C/O")[0].trim();
//       }
//       if (rawName.includes(",")) {
//         rawName = rawName.split(",")[0].trim();
//       }
//       if (rawName.startsWith("Mr.")) {
//         insuredName = rawName;
//       } else if (rawName.startsWith(": Mr.")) {
//         insuredName = rawName.replace(": ", "");
//       } else {
//         insuredName = "Mr." + rawName;
//       }
//       break;
//     }
//   }
  
//   if (insuredName === "-" || insuredName === "") {
//     const fallbackMatch = normalizedText.match(/Mr\.([A-Z\s]+?)(?:\s+C\/O|\s+GRAM|$)/i);
//     if (fallbackMatch?.[1]) {
//       insuredName = "Mr." + fallbackMatch[1].trim();
//     }
//   }
  
//   const contactMatch = normalizedText.match(/Mobile\s*No\.?\s*:\s*(\d{10}|\d{2}[x\d]+)/i) || normalizedText.match(/Mobile\s*No\.?\s*:\s*(\d{2}[x\d]+)/i) || normalizedText.match(/Mobile\s*No\.?\s*:\s*(\d{10})/i) || normalizedText.match(/Mobile\s*Number\s*:\s*(\d{10}|\d{2}[x\d]+)/i) || normalizedText.match(/Mobile\s*:\s*(\d{10}|\d{2}[x\d]+)/i);
//   const contactNumber = contactMatch?.[1] || "-";
  
//   const emailMatch = normalizedText.match(/Email ID\s*:\s*([^\s]+@[^\s]+)/i);
//   const email = emailMatch?.[1] || "-";
  
//   let insuredAddress = "-";
//   const addressPatterns = [
//     /(S\/O[:\s]+[^\n]+(?:\n[^\n]+)*?)(?=\s*(?:Telephone|Mobile|NEXT RENEWAL|Certificate of Insurance|$))/i,
//     /(C\/O[:\s]+[^\n]+(?:\n[^\n]+)*?)(?=\s*(?:Telephone|Mobile|NEXT RENEWAL|Certificate of Insurance|$))/i,
//     /(GRAM[:\s]+[^\n]+(?:\n[^\n]+)*?)(?=\s*(?:Telephone|Mobile|NEXT RENEWAL|Certificate of Insurance|$))/i,
//     /(C\/O[^,]+,\s*GRAM\s+POST[^\n]+(?:\n[^\n]+)*?)(?=\s*(?:Telephone|Mobile|NEXT RENEWAL|Certificate of Insurance|$))/i,
//     /(Address of insured:\s*Insured Name:[^\n]+\n([^\n]+(?:\n[^\n]+)*?))(?=\s*(?:Taxable Premium|$))/i,
//   ];
//   for (const pattern of addressPatterns) {
//     const match = normalizedText.match(pattern);
//     if (match?.[1]) {
//       insuredAddress = match[1]
//         .replace(/\n/g, " ")
//         .replace(/\s+/g, " ")
//         .trim();
//       break;
//     }
//   }
//   if (insuredAddress !== "-") {
//     const stopPatterns = [/Telephone/i, /Mobile/i, /NEXT RENEWAL/i, /Certificate of Insurance/i, /Taxable Premium/i];
//     for (const stopPattern of stopPatterns) {
//       const stopMatch = insuredAddress.match(stopPattern);
//       if (stopMatch) {
//         insuredAddress = insuredAddress.substring(0, stopMatch.index).trim();
//         break;
//       }
//     }
//   }
  
//   // ============================================================
//   // PAN NUMBER EXTRACTION (from Certificate & Policy Schedule)
//   // ============================================================
//   let panNumber = "-";

  

//   return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin: "-" };
// };

// const extractPolicyDates = (fullText = "") => {
//   if (!fullText) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  
//   const normalizedText = normalizeText(fullText);
  
//   let match = normalizedText.match(/From\s+[\d:]+\s+hours?\s+on\s+(\d{2}\/\d{2}\/\d{4})\s+To\s+Midnight\s+of\s+(\d{2}\/\d{2}\/\d{4})/i);
//   if (!match) {
//     match = normalizedText.match(/Policy Period.*?From\s+[\d:]+\s+on\s+(\d{2}\/\d{2}\/\d{4})\s+To\s+Midnight\s+of\s+(\d{2}\/\d{2}\/\d{4})/i);
//   }
//   if (!match) {
//     match = normalizedText.match(/(\d{2}\/\d{2}\/\d{4})(?:.*?)to\s*(\d{2}\/\d{2}\/\d{4})/i);
//   }
  
//   const startDate = match?.[1] || "-";
//   const expireDate = match?.[2] || "-";
  
//   return { startDate, odExpireDate: expireDate, tpExpireDate: expireDate };
// };

// const extractDateOfIssue = (text = "") => {
//   const match = text.match(/Invoice Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
//   if (match) return match[1];
//   const altMatch = text.match(/Date of Issue\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i);
//   return altMatch?.[1] || "-";
// };

// const extractIDV = (text = "") => {
//   if (!text) return "-";
//   const idvMatch = text.match(/Total\s+IDV\s*([\d,]+)/i);
//   if (idvMatch?.[1]) return idvMatch[1].replace(/,/g, "");
//   const tableMatch = text.match(/For the Vehicle\s+For Trailers\s+Non Electrical Accessories.*?\n\s*([\d,]+)/i);
//   if (tableMatch?.[1]) return tableMatch[1].replace(/,/g, "");
//   return "-";
// };

// const extractPreviousPolicyNumber = (text = "") => {
//   const match = text.match(
//     /Previous\s+Policy\s+(?:Number|No\.?)\s*[:]?\s*([A-Z0-9\/\-]+?)(?=\s*(?:Previous\s+Policy\s+Insurance\s+Co\.?|Previous\s+Insurer)|$)/
//   );
//   return match?.[1] || "-";
// };

// const extractPreviousInsurer = (text = "") => {
//   const match = text.match(
//     /Previous\s+(?:Insurer|Policy\s+Insurance\s+Co\.?)\s*[:]?\s*([^\n]+?)(?=\s*Previous\s+Policy\s+(?:Number|No\.?)|$)/
//   );
//   if (match?.[1]) {
//     const value = match[1]
//       .replace(/\s*Previous\s+Policy\s+(?:Number|No\.?).*$/i, "")
//       .replace(/\s+/g, " ")
//       .trim();
//     return value || "-";
//   }
//   return "-";
// };

// const extractPremiumData = (text = "") => {
//   const defaultResult = { 
//     calculatedOdPremium: "0", 
//     calculatedTpPremium: "0", 
//     totalOdPremium: "0", 
//     totalTpPremium: "0", 
//     netPremium: "0", 
//     gst: "0", 
//     totalPayable: "0" 
//   };
//   if (!text) return defaultResult;
  
//   const result = {};
  
//   const netMatch = text.match(/Total\s+Premium\s*\(A\s*\+\s*B\)\s*([\d,]+\.?\d*)/i);
//   if (netMatch) result.netPremium = netMatch[1];

//   const odMatch = text.match(/TOTAL OWN DAMAGE PREMIUM\s*\(A\)\s*([\d,]+\.?\d*)/i);
//   if (odMatch) result.totalOdPremium = odMatch[1].replace(/,/g, "");
  
//   const tpMatch = text.match(/TOTAL LIABILITY PREMIUM\s*\(B\)\s*([\d,]+\.?\d*)/i);
//   if (tpMatch) result.totalTpPremium = tpMatch[1].replace(/,/g, "");
  
//   const sgstMatch = text.match(/SGST\s+([\d,]+\.?\d*)/i);
//   const cgstMatch = text.match(/CGST\s+([\d,]+\.?\d*)/i);
//   if (sgstMatch && cgstMatch) {
//     const sgst = parseFloat(sgstMatch[1].replace(/,/g, "")) || 0;
//     const cgst = parseFloat(cgstMatch[1].replace(/,/g, "")) || 0;
//     result.gst = (sgst + cgst).toString();
//   }
  
//   const totalMatch = text.match(/TOTAL PREMIUM PAYABLE\s*([\d,]+\.?\d*)/i);
//   if (totalMatch) result.totalPayable = totalMatch[1].replace(/,/g, "");
  
//   const invoiceMatch = text.match(/Taxable Premium\s*([\d,]+\.?\d*).*?SGST\s*[\d.]+\%\s*([\d,]+\.?\d*).*?CGST\s*[\d.]+\%\s*([\d,]+\.?\d*).*?Gross Premium\s*([\d,]+\.?\d*)/is);
//   if (invoiceMatch) {
//     result.netPremium = invoiceMatch[1]?.replace(/,/g, "") || result.netPremium;
//     const sgst = parseFloat(invoiceMatch[2]?.replace(/,/g, "") || 0);
//     const cgst = parseFloat(invoiceMatch[3]?.replace(/,/g, "") || 0);
//     result.gst = (sgst + cgst).toString();
//     result.totalPayable = invoiceMatch[4]?.replace(/,/g, "") || result.totalPayable;
//   }
  
//   return { ...defaultResult, ...result };
// };

// const extractVehicleDetailsFromText = (text = "") => {
//   const result = {
//     registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-", model: "-",
//     variant: "-", gvw: "-", manufacturingYear: "-", fuelType: "-",
//     cubicCapacity: "-", seatingCapacity: "-", financierName: "-", ncb: "0%"
//   };
//   if (!text || typeof text !== "string") return result;

//   const normalizedText = text.replace(/\s+/g, " ").trim();

//   // ----- Simple label → value extractions (no fallbacks) -----
//   const regMatch = normalizedText.match(/Registration\s*Number\s+([A-Z0-9\-]+)/i);
//   if (regMatch) result.registrationNumber = regMatch[1];

//   const engineMatch = normalizedText.match(/Engine\s*Number\s+([A-Z0-9\-]+)/i);
//   if (engineMatch) result.engineNumber = engineMatch[1];

//   const chassisMatch = normalizedText.match(/Chassis\s*Number\s+([A-Z0-9\-]+)/i);
//   if (chassisMatch) result.chassisNumber = chassisMatch[1];

//   const yearMatch = normalizedText.match(/Year\s*of\s*Manufacture\s+(\d{4})/i);
//   if (yearMatch) result.manufacturingYear = yearMatch[1];

//   const makeMatch = normalizedText.match(
//     /Make\s*of\s*the\s*Vehicle\s+([A-Za-z0-9\s.,]+?)(?=\s+(?:Gross\s+Vehicle\s+Weight|Model\s+Description|Fuel\s+Type|Engine\s+Number|Chassis\s+Number|Year\s+of\s+Manufacture|Type\s+of\s+Body|Registration\s+Number)|$)/
//   );
//   if (makeMatch) result.make = makeMatch[1].trim();

//   const gvwMatch = normalizedText.match(/Gross\s*Vehicle\s*Weight\s*\(Kgs\)\s+([\d,]+)/i);
//   if (gvwMatch) result.gvw = gvwMatch[1].replace(/,/g, "");

//   const modelMatch = normalizedText.match(
//     /Model\s*Description\s+([A-Za-z0-9\s\-+.&]+?)(?=\s+Engine\s+Number|\s+Total\s+Premium|\s+Gross\s+Vehicle|\s+Fuel\s+Type|\s+Year\s+of|\s+Type\s+of\s+Body|\s+Chassis\s+Number|\s+Cubic\s+Capacity|\s+BatterySerial\s+Number|\s+Seating\s+Capacity|\s+Maximum\s+Licensed\s+carrying\s+capacity\s+including\s+driver|$)/
//   );
//   if (modelMatch) result.model = modelMatch[1].trim();

//   const fuelMatch = normalizedText.match(/Fuel\s*Type\s+([A-Za-z]+)/i);
//   if (fuelMatch) result.fuelType = fuelMatch[1];

//   const ccMatch = normalizedText.match(/Cubic\s*Capacity\/KW\s+([\d]+)/i);
//   if (ccMatch) result.cubicCapacity = ccMatch[1];

//   const seatMatch = normalizedText.match(/Seating\s*Capacity\s+(\d+)/i);
//   if (seatMatch) result.seatingCapacity = seatMatch[1];

//   const maxLicensedMatch = normalizedText.match(/Maximum\s*Licensed\s*carrying\s*capacity\s+including\s+driver\s+(\d+)/i);
//   if (maxLicensedMatch && result.seatingCapacity === "-") {
//     result.seatingCapacity = maxLicensedMatch[1];
//   }

//   result.ncb = "0%"; 

//   // 2. Define standard valid NCB slabs
//   const validNcbSlabs = ["0", "20", "25", "35", "45", "50"];

//   const ncbPatterns = [
//     /No\s*Claim\s*Bonus[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
//     /\bNCB(?:\s*(?:Discount|Percentage|Applicable))?[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
//     /\bNCB\s*\(\s*%\s*\)[\s:\-]*(\d{1,2}(?:\.\d+)?)/i,
//     /Deduct\s*(\d{1,2}(?:\.\d+)?)\s*%?\s*for\s*NCB/i
//   ];
  
//   for (const pattern of ncbPatterns) {
//     const match = text.match(pattern); // Note: use normalizedText if inside United/ICICI
//     if (match?.[1]) {
//       // Parse as integer to safely turn "50.00" into "50"
//       const extractedNum = parseInt(match[1], 10).toString();
      
//       // 3. Only apply if it matches one of the defined slabs
//       if (validNcbSlabs.includes(extractedNum)) {
//         result.ncb = `${extractedNum}%`; 
//         break;
//       }
//     }
//   }

//   return result;
// };

// // =======================================
// // MAIN COMPONENT
// // =======================================

// function RoyalSundaramPolicyCard({ item }) {
//   const insured = item?.insuredDetails || {};
//   const policy = item?.policyDetails || {};
//   const vehicle = item?.vehicleDetails || {};
//   const premium = item?.premiumDetails || {};

//   const autoInsuredDetails = extractInsuredDetails(item?.fullText || "");
//   const policyDates = extractPolicyDates(item?.fullText);
//   const extractedVehicle = extractVehicleDetailsFromText(item?.fullText || "");
//   const autoPremium = extractPremiumData(item?.fullText || "");
//   const insuranceCompany = extractInsuranceCompanyName(item?.fullText || "");
//   const branchAddress = extractBranchAddress(item?.fullText || "");

//   const insuredName = insured?.insuredName || autoInsuredDetails?.insuredName || "-";
//   const insuredAddress = insured?.insuredAddress || autoInsuredDetails?.insuredAddress || "-";
//   const panNumber = insured?.panNumber || autoInsuredDetails?.panNumber || "-";
//   const contactNumber = insured?.contactNumber || autoInsuredDetails?.contactNumber || "-";
//   const email = insured?.email || autoInsuredDetails?.email || "-";
//   const gstin = autoInsuredDetails?.gstin || "-";

//   const vehicleCategory = getVehicleCategory(policy?.policyType, item?.fullText);
//   const productType = getProductType(policy?.policyType, item?.fullText);
//   const dateOfIssue = extractDateOfIssue(item?.fullText);
//   const totalValue = extractIDV(item?.fullText);
//   const previousPolicyNumber = extractPreviousPolicyNumber(item?.fullText);
//   const previousInsurer = extractPreviousInsurer(item?.fullText);

//   const finalPremium = {
//     calculatedOdPremium: premium?.calculatedOdPremium || autoPremium?.calculatedOdPremium || "0",
//     calculatedTpPremium: premium?.calculatedTpPremium || autoPremium?.calculatedTpPremium || "0",
//     totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
//     totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
//     netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
//     gst: premium?.gst || autoPremium?.gst || "0",
//     totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
//   };

//   const policyNumber = cleanValue(policy?.policyNumber || item?.fullText?.match(/Policy No\.?\s*([A-Z0-9]+)/i)?.[1]);  
  
//   return (
//     <PolicyCardView
//       item={item}
//       policyNumber={policyNumber}
//       insuranceCompany={insuranceCompany}
//       branchAddress={branchAddress}
//       productType={productType}
//       vehicleCategory={vehicleCategory}
//       insuredName={insuredName}
//       panNumber={panNumber}
//       gstin={gstin}
//       contactNumber={contactNumber}
//       email={email}
//       insuredAddress={insuredAddress}
//       policyDates={policyDates}
//       dateOfIssue={dateOfIssue}
//       totalValue={totalValue}
//       previousInsurer={previousInsurer}
//       previousPolicyNumber={previousPolicyNumber}
//       finalPremium={finalPremium}
//       vehicle={vehicle}
//       extractedVehicle={extractedVehicle}
//     />
//   );
// }

// export default RoyalSundaramPolicyCard;


// src/components/RoyalSundaramPolicyCard.jsx

import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

// =======================================
// UTILITY FUNCTIONS
// =======================================

const cleanValue = (value) => {
  if (!value) return "-";
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/[\n\r]+/g, " ")
    .trim();
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
// EXTRACTION FUNCTIONS
// =======================================

const extractInsuranceCompanyName = (fullText = "") => {
  if (!fullText) return "-";
  const match = fullText.match(/Royal Sundaram/i);
  if (match) return "Royal Sundaram General Insurance Co. Limited";
  return "-";
};

const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "-";
  
  const addressMatch = fullText.match(/(\d+(?:st|nd|rd|th)?\s*Floor[,\s]+[A-Za-z\s,]+(?:BHOPAL|CHENNAI)[,\s]+[\d\-]+)/i);
  if (addressMatch) {
    return addressMatch[1].trim();
  }
  
  if (fullText.includes("Alankar Complex") && fullText.includes("MP Nagar")) {
    return "3rd Floor, Alankar Complex, Plo # 11, Zone-II, MP Nagar, D2-Bhopal, BHOPAL - 462011";
  }
  
  return "-";
};

const extractInsuredDetails = (fullText = "") => {
  const result = { insuredName: "", insuredAddress: "", panNumber: "", contactNumber: "", email: "", gstin: "" };
  if (!fullText) return result;

  // 1. Extract Insured Name
  // Strictly matches everything between "Name of the Insured:" and "Mobile No"
  const insuredNameMatch = fullText.match(/Name of the Insured:\s*(.*?)\s*Mobile No/i);
  if (insuredNameMatch) {
    result.insuredName = insuredNameMatch[1].trim();
  } else {
    // Fallback if the first format isn't found (from Page 2 INSURED DETAILS)
    const nameFallback = fullText.match(/Name of Insured\s*(.*?)\s*\d{2}\/\d{2}\/\d{4}/i);
    if (nameFallback) {
      let rawName = nameFallback[1].trim();
      
      // Clean up PDF table headers that accidentally get caught in the text extraction
      rawName = rawName.replace(/Insured Date of Birth.*?Registration Date/ig, '').trim();
      
      result.insuredName = rawName;
    }
  }

  // 2. Extract Insured Address
  // Matches "Address of insured: Insured Name: <ADDRESS>" stopping before "State:" or "Telephone"
  const addressMatch = fullText.match(/Address of insured:\s*Insured Name:\s*(.*?)(?=\s*State:|\s*Telephone:|\s*Mobile:|$)/i);
  
  if (addressMatch) {
    result.insuredAddress = addressMatch[1].trim();
  } else {
    // Fallback logic for address
    const dateToPhoneRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+(.*?)\s+(?:Telephone\s*:|Mobile\s*:|NEXT RENEWAL|Intermediary Code)/i;
    const headerBlockMatch = fullText.match(dateToPhoneRegex);
    
    if (headerBlockMatch) {
      let fullBlock = headerBlockMatch[1].trim(); 

      // Remove the name from the address block if it matches
      if (result.insuredName) {
        const safeName = result.insuredName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nameRemover = new RegExp(`^\\s*${safeName}\\s*`, 'i');
        result.insuredAddress = fullBlock.replace(nameRemover, '').trim();
        result.insuredAddress = result.insuredAddress.replace(/^[\s,:-]+/, '').trim();
      } else {
        result.insuredAddress = fullBlock;
      }
    }
  }

  // 3. Extract Mobile/Contact Number
  const contactMatch = fullText.match(/Mobile\s*(?:No\.?)?[\s:]*([*\dxX]{10,})/i);
  if (contactMatch) {
    result.contactNumber = contactMatch[1].trim();
  }

  // 4. Extract Email
  const emailMatch = fullText.match(/Email ID:\s*([^\s]+)/i);
  if (emailMatch) {
    result.email = emailMatch[1].trim();
  }

  // 5. PAN & GSTIN
  const panMatch = fullText.match(/PAN Number\s*:\s*([A-Z]{5}[0-9]{4}[A-Z])/i);
  result.panNumber = panMatch ? panMatch[1].trim() : "";

  const gstinMatch = fullText.match(/GSTIN\s*:\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i);
  result.gstin = gstinMatch ? gstinMatch[1].trim() : "";

  return result;
};

const extractPolicyDates = (fullText = "") => {
  if (!fullText) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  
  const normalizedText = normalizeText(fullText);
  
  let match = normalizedText.match(/From\s+[\d:]+\s+hours?\s+on\s+(\d{2}\/\d{2}\/\d{4})\s+To\s+Midnight\s+of\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (!match) {
    match = normalizedText.match(/Policy Period.*?From\s+[\d:]+\s+on\s+(\d{2}\/\d{2}\/\d{4})\s+To\s+Midnight\s+of\s+(\d{2}\/\d{2}\/\d{4})/i);
  }
  if (!match) {
    match = normalizedText.match(/(\d{2}\/\d{2}\/\d{4})(?:.*?)to\s*(\d{2}\/\d{2}\/\d{4})/i);
  }
  
  const startDate = match?.[1] || "-";
  const expireDate = match?.[2] || "-";
  
  return { startDate, odExpireDate: expireDate, tpExpireDate: expireDate };
};

const extractDateOfIssue = (text = "") => {
  const match = text.match(/Invoice Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (match) return match[1];
  const altMatch = text.match(/Date of Issue\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  return altMatch?.[1] || "-";
};

const extractIDV = (text = "") => {
  if (!text) return "-";
  const idvMatch = text.match(/Total\s+IDV\s*([\d,]+)/i);
  if (idvMatch?.[1]) return idvMatch[1].replace(/,/g, "");
  const tableMatch = text.match(/For the Vehicle\s+For Trailers\s+Non Electrical Accessories.*?\n\s*([\d,]+)/i);
  if (tableMatch?.[1]) return tableMatch[1].replace(/,/g, "");
  return "-";
};

const extractPreviousPolicyNumber = (text = "") => {
  const match = text.match(
    /Previous\s+Policy\s+(?:Number|No\.?)\s*[:]?\s*([A-Z0-9\/\-]+?)(?=\s*(?:Previous\s+Policy\s+Insurance\s+Co\.?|Previous\s+Insurer)|$)/
  );
  return match?.[1] || "-";
};

const extractPreviousInsurer = (text = "") => {
  const match = text.match(
    /Previous\s+(?:Insurer|Policy\s+Insurance\s+Co\.?)\s*[:]?\s*([^\n]+?)(?=\s*Previous\s+Policy\s+(?:Number|No\.?)|$)/
  );
  if (match?.[1]) {
    const value = match[1]
      .replace(/\s*Previous\s+Policy\s+(?:Number|No\.?).*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
    return value || "-";
  }
  return "-";
};

const extractPremiumData = (text = "") => {
  const defaultResult = { 
    calculatedOdPremium: "0", 
    calculatedTpPremium: "0", 
    totalOdPremium: "0", 
    totalTpPremium: "0", 
    netPremium: "0", 
    gst: "0", 
    totalPayable: "0" 
  };
  if (!text) return defaultResult;
  
  const result = {};
  
  const netMatch = text.match(/Total\s+Premium\s*\(A\s*\+\s*B\)\s*([\d,]+\.?\d*)/i);
  if (netMatch) result.netPremium = netMatch[1];

  const odMatch = text.match(/TOTAL OWN DAMAGE PREMIUM\s*\(A\)\s*([\d,]+\.?\d*)/i);
  if (odMatch) result.totalOdPremium = odMatch[1].replace(/,/g, "");
  
  const tpMatch = text.match(/TOTAL LIABILITY PREMIUM\s*\(B\)\s*([\d,]+\.?\d*)/i);
  if (tpMatch) result.totalTpPremium = tpMatch[1].replace(/,/g, "");
  
  const sgstMatch = text.match(/SGST\s+([\d,]+\.?\d*)/i);
  const cgstMatch = text.match(/CGST\s+([\d,]+\.?\d*)/i);
  if (sgstMatch && cgstMatch) {
    const sgst = parseFloat(sgstMatch[1].replace(/,/g, "")) || 0;
    const cgst = parseFloat(cgstMatch[1].replace(/,/g, "")) || 0;
    result.gst = (sgst + cgst).toString();
  }
  
  const totalMatch = text.match(/TOTAL PREMIUM PAYABLE\s*([\d,]+\.?\d*)/i);
  if (totalMatch) result.totalPayable = totalMatch[1].replace(/,/g, "");
  
  const invoiceMatch = text.match(/Taxable Premium\s*([\d,]+\.?\d*).*?SGST\s*[\d.]+\%\s*([\d,]+\.?\d*).*?CGST\s*[\d.]+\%\s*([\d,]+\.?\d*).*?Gross Premium\s*([\d,]+\.?\d*)/is);
  if (invoiceMatch) {
    result.netPremium = invoiceMatch[1]?.replace(/,/g, "") || result.netPremium;
    const sgst = parseFloat(invoiceMatch[2]?.replace(/,/g, "") || 0);
    const cgst = parseFloat(invoiceMatch[3]?.replace(/,/g, "") || 0);
    result.gst = (sgst + cgst).toString();
    result.totalPayable = invoiceMatch[4]?.replace(/,/g, "") || result.totalPayable;
  }
  
  return { ...defaultResult, ...result };
};

const extractVehicleDetailsFromText = (text = "") => {
  const result = {
    registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-", model: "-",
    variant: "-", gvw: "-", manufacturingYear: "-", fuelType: "-",
    cubicCapacity: "-", seatingCapacity: "-", financierName: "-", ncb: "0%"
  };
  if (!text || typeof text !== "string") return result;

  const normalizedText = text.replace(/\s+/g, " ").trim();

  const regMatch = normalizedText.match(/Registration\s*Number\s+([A-Z0-9\-]+)/i);
  if (regMatch) result.registrationNumber = regMatch[1];

  const engineMatch = normalizedText.match(/Engine\s*Number\s+([A-Z0-9\-]+)/i);
  if (engineMatch) result.engineNumber = engineMatch[1];

  const chassisMatch = normalizedText.match(/Chassis\s*Number\s+([A-Z0-9\-]+)/i);
  if (chassisMatch) result.chassisNumber = chassisMatch[1];

  const yearMatch = normalizedText.match(/Year\s*of\s*Manufacture\s+(\d{4})/i);
  if (yearMatch) result.manufacturingYear = yearMatch[1];

  const makeMatch = normalizedText.match(
    /Make\s*of\s*the\s*Vehicle\s+([A-Za-z0-9\s.,]+?)(?=\s+(?:Gross\s+Vehicle\s+Weight|Model\s+Description|Fuel\s+Type|Engine\s+Number|Chassis\s+Number|Year\s+of\s+Manufacture|Type\s+of\s+Body|Registration\s+Number)|$)/
  );
  if (makeMatch) result.make = makeMatch[1].trim();

  const gvwMatch = normalizedText.match(/Gross\s*Vehicle\s*Weight\s*\(Kgs\)\s+([\d,]+)/i);
  if (gvwMatch) result.gvw = gvwMatch[1].replace(/,/g, "");

  // --- UPDATED MODEL & VARIANT LOGIC ---
  const modelMatch = normalizedText.match(
    /Model\s*Description\s+([A-Za-z0-9\s\-+.&]+?)(?=\s+Engine\s+Number|\s+Total\s+Premium|\s+Gross\s+Vehicle|\s+Fuel\s+Type|\s+Year\s+of|\s+Type\s+of\s+Body|\s+Chassis\s+Number|\s+Cubic\s+Capacity|\s+BatterySerial\s+Number|\s+Seating\s+Capacity|\s+Maximum\s+Licensed\s+carrying\s+capacity\s+including\s+driver|$)/
  );
  
  if (modelMatch) {
    const fullModelString = modelMatch[1].trim();
    const parts = fullModelString.split(/\s+/);

    if (parts.length > 1) {
      if (parts.length >= 3) {
        // If the first word is short (e.g., 'U') OR the second word contains a number (e.g., '3118' or '407'),
        // we group the first two words as the Model and the rest as the Variant.
        if (parts[0].length <= 2 || /\d/.test(parts[1])) {
          result.model = parts.slice(0, 2).join(" ");     // e.g., "U 3118"
          result.variant = parts.slice(2).join(" ");      // e.g., "5350 WB"
        } else {
          // e.g., "SWIFT LXI OPTIONAL" -> Model: "SWIFT", Variant: "LXI OPTIONAL"
          result.model = parts[0];
          result.variant = parts.slice(1).join(" ");
        }
      } else {
        // Exactly 2 words (e.g., "SWIFT VXI")
        result.model = parts[0];
        result.variant = parts[1];
      }
    } else {
      // Only 1 word found
      result.model = fullModelString;
    }
  }

  const fuelMatch = normalizedText.match(/Fuel\s*Type\s+([A-Za-z]+)/i);
  if (fuelMatch) result.fuelType = fuelMatch[1];

  const ccMatch = normalizedText.match(/Cubic\s*Capacity\/KW\s+([\d]+)/i);
  if (ccMatch) result.cubicCapacity = ccMatch[1];

  const seatMatch = normalizedText.match(/Seating\s*Capacity\s+(\d+)/i);
  if (seatMatch) result.seatingCapacity = seatMatch[1];

  const maxLicensedMatch = normalizedText.match(/Maximum\s*Licensed\s*carrying\s+capacity\s+including\s+driver\s+(\d+)/i);
  if (maxLicensedMatch && result.seatingCapacity === "-") {
    result.seatingCapacity = maxLicensedMatch[1];
  }

  result.ncb = "0%"; 
  const validNcbSlabs = ["0", "20", "25", "35", "45", "50"];
  const ncbPatterns = [
    /No\s*Claim\s*Bonus[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
    /\bNCB(?:\s*(?:Discount|Percentage|Applicable))?[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
    /\bNCB\s*\(\s*%\s*\)[\s:\-]*(\d{1,2}(?:\.\d+)?)/i,
    /Deduct\s*(\d{1,2}(?:\.\d+)?)\s*%?\s*for\s*NCB/i
  ];
  
  for (const pattern of ncbPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const extractedNum = parseInt(match[1], 10).toString();
      if (validNcbSlabs.includes(extractedNum)) {
        result.ncb = `${extractedNum}%`; 
        break;
      }
    }
  }

  return result;
};

// =======================================
// MAIN COMPONENT
// =======================================

function RoyalSundaramPolicyCard({ item }) {
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

  // --- PREMIUM LOGIC FOR PRODUCT TYPE ---
  const finalPremium = {
    calculatedOdPremium: premium?.calculatedOdPremium || autoPremium?.calculatedOdPremium || "0",
    calculatedTpPremium: premium?.calculatedTpPremium || autoPremium?.calculatedTpPremium || "0",
    totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
    totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
    netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
    gst: premium?.gst || autoPremium?.gst || "0",
    totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
  };

  const isEmpty = (val) => !val || val === "0" || val === "-" || val?.toUpperCase() === "NULL";
  
  const odIsEmpty = isEmpty(finalPremium.totalOdPremium);
  const tpIsEmpty = isEmpty(finalPremium.totalTpPremium);

  let productType = getProductType(policy?.policyType, item?.fullText);

  if (odIsEmpty && !tpIsEmpty) {
    productType = "Liability Policy";
  } else if (!odIsEmpty && tpIsEmpty) {
    productType = "Standalone OD Policy";
  } else if (!odIsEmpty && !tpIsEmpty) {
    productType = "Package Policy";
  }
  // --------------------------------------

  const vehicleCategory = getVehicleCategory(policy?.policyType, item?.fullText);
  const dateOfIssue = extractDateOfIssue(item?.fullText);
  const totalValue = extractIDV(item?.fullText);
  const previousPolicyNumber = extractPreviousPolicyNumber(item?.fullText);
  const previousInsurer = extractPreviousInsurer(item?.fullText);

  const policyNumber = cleanValue(policy?.policyNumber || item?.fullText?.match(/Policy No\.?\s*([A-Z0-9]+)/i)?.[1]);  
  
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

export default RoyalSundaramPolicyCard;
