// // src/components/SBIPolicyCard.jsx

// import { useState } from "react";
// import PolicyCardView from "./PolicyCardView";
// import { getProductType, getVehicleCategory } from "./PolicyClassification";

// // =======================================
// // UTILITY FUNCTIONS
// // =======================================

// const escapeRegex = (string) => {
//   return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// };

// const cleanValue = (value) => {
//   if (!value) return "-";
//   return String(value)
//     .replace(/\s+/g, " ")
//     .replace(/[\n\r]+/g, " ")
//     .trim();
// };

// const formatLabel = (key) => {
//   return key
//     .replace(/([A-Z])/g, " $1")
//     .replace(/^./, (str) => str.toUpperCase());
// };

// const getPremiumValue = (value) => {
//   if (value === null || value === undefined || value === "" || value === "NA") {
//     return "0";
//   }
//   return String(value).replace(/,/g, "");
// };

// const copyText = async (text, setCopied) => {
//   try {
//     await navigator.clipboard.writeText(text || "");
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   } catch (err) {
//     console.error(err);
//   }
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
// // FORMATTING FUNCTIONS (Fixed)
// // =======================================

// const cleanAlphaNumeric = (value, keepSpaces = false) => {
//   if (!value) return "-";
//   let cleaned = String(value)
//     .replace(/\r|\n/g, "")
//     .replace(/\s+/g, keepSpaces ? " " : "");
//   if (!keepSpaces) {
//     cleaned = cleaned.replace(/[^A-Z0-9]/gi, "");
//   }
//   return cleaned.toUpperCase().trim();
// };

// // FIXED: Robust engine extraction
// const extractChassisAndEngine = (fullText) => {
//   let chassis = "-", engine = "-";
//   const normalized = fullText.replace(/\r/g, "\n").replace(/\t/g, " ");
  
//   const engineMatch = normalized.match(/Engine\s+Number\s*[:\-]?\s*([A-Z0-9]+)/i);
//   const chassisMatch = normalized.match(/Chassis\s+Number\s*[:\-]?\s*([A-Z0-9]+)/i);
  
//   if (engineMatch) engine = engineMatch[1].trim().toUpperCase();
//   if (chassisMatch) chassis = chassisMatch[1].trim().toUpperCase();
  
//   // Fallback for combined line
//   if (engine === "-" || chassis === "-") {
//     const combined = normalized.match(/Engine\s*&\s*Chassis\s+Number\s*([A-Z0-9]+)\s*&\s*([A-Z0-9]+)/i);
//     if (combined) {
//       engine = combined[1].trim().toUpperCase();
//       chassis = combined[2].trim().toUpperCase();
//     }
//   }
  
//   return { engine, chassis };
// };

// const formatEngineNumber = (engine = "", fullText = "") => {
//   if (fullText) {
//     const { engine: extracted } = extractChassisAndEngine(fullText);
//     if (extracted !== "-") return extracted;
//   }
//   if (!engine) return "-";
//   return String(engine).replace(/[^A-Z0-9]/gi, "").toUpperCase().trim();
// };

// const formatChassisNumber = (chassis = "", fullText = "") => {
//   if (fullText) {
//     const { chassis: extracted } = extractChassisAndEngine(fullText);
//     if (extracted !== "-") return extracted;
//   }
//   if (!chassis) return "-";
//   return String(chassis).replace(/[^A-Z0-9]/gi, "").toUpperCase().trim();
// };

// const formatModelName = (model) => {
//   if (!model) return "-";
//   return String(model).replace(/Registration\s*no\.?/i, "").replace(/Variant/i, "").replace(/Colour/i, "").replace(/Year/i, "").trim();
// };

// const formatVariantName = (variant) => {
//   if (!variant) return "-";
//   return String(variant).replace(/Gvw/i, "").replace(/GVW/i, "").replace(/Year of manufacture/i, "").trim();
// };

// const formatGeographicalArea = (geoArea) => {
//   if (!geoArea) return "-";
//   let area = String(geoArea);
//   area = area.replace(/\s*Name of the Financier.*$/i, '');
//   area = area.replace(/^Geographical Area\s*\/\s*Zone/i, '');
//   const colonMatch = area.match(/:\s*([^/]+?)(?=\s*Year of manufacture|\s*Name of the Financier|\s*$)/i);
//   if (colonMatch) return colonMatch[1].trim();
//   const yearMatch = area.match(/^(.+?)(?=\s*Year of manufacture|\s*Name of the Financier|$)/i);
//   if (yearMatch) return yearMatch[1].trim();
//   if (/\d/.test(area)) {
//     const nameMatch = area.match(/^([A-Za-z\s]+)/);
//     if (nameMatch) return nameMatch[1].trim();
//   }
//   return area.trim();
// };

// const formatFinancierName = (financier) => {
//   if (!financier) return "-";
//   let name = String(financier);
//   name = name
//     .replace(/Cover Note No.*$/i, "")
//     .replace(/[\/:]/g, "")
//     .replace(/\s+/g, " ")
//     .trim();
//   if (name.length > 50) {
//     const shortMatch = name.match(/([A-Z]{3,}\s+(?:FINANCE|BANK)\s+[A-Z]{3,})/i);
//     if (shortMatch) return shortMatch[1].toUpperCase();
//   }
//   return name.toUpperCase();
// };

// // =======================================
// // EXTRACTION FUNCTIONS (Fixed)
// // =======================================

// const extractInsuranceCompanyName = (fullText = "") => {
//   if (!fullText) return "-";
//   const companyMatch = fullText.match(/SBI General Insurance Company Limited/i);
//   if (companyMatch) return "SBI General Insurance Company Limited";
//   const altMatch = fullText.match(/([A-Z\s]+ASSURANCE\s*CO\.?\s*LTD\.?)/i);
//   return altMatch ? altMatch[1].trim() : "-";
// };

// const extractBranchAddress = (fullText = "") => {
//   if (!fullText) return "-";
//   const text = normalizeText(fullText);

//   // Try to match "Policy Servicing Branch"
//   const match = text.match(
//     /Policy\s+Servicing\s+Branch\s*:\s*([\s\S]*?)(?=\s*(?:Intermediary|Period|Geographical|Policy|$))/i
//   );
//   if (match) {
//     let addr = match[1].trim();
//     // If empty, return "-"
//     if (!addr) return "-";
//     // Remove any trailing labels like "Intermediary Name", "Intermediary Details", etc.
//     addr = addr.replace(/\s*(?:Intermediary\s+(?:Name|Details|Contact)|Period|Geographical|Policy).*$/i, '');
//     addr = addr.replace(/,\s*$/, '').trim();
//     return addr || "-";
//   }

//   // Fallback: original "Branch Address" pattern (for other insurers)
//   const branchMatch = text.match(/Branch\s*Address\s*([\s\S]*?)(?=Branch Office Phone No\.|Geographical Area|$)/i);
//   if (branchMatch) {
//     let addr = branchMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
//     addr = addr.replace(/Branch Office Phone No\..*$/i, "").trim();
//     return addr || "-";
//   }

//   return "-";
// };

// const extractInsuredDetails = (text = "") => {
//   if (!text) {
//     return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-", ncb: "-" };
//   }
//   const normalizedText = normalizeText(text);
//   let insuredName = "-";
//   let insuredAddress = "-";
//   let contactNumber = "-";
//   let email = "-";

//   // ========== 1. INSURED NAME (Priority order) ==========
//   // Priority 1: Policy Holder Name (from Premium Receipt)
//   let match = normalizedText.match(/Policy Holder Name\s*([^\n]+)/i);
//   if (match?.[1]) {
//     insuredName = match[1].replace(/\s+/g, " ").trim();
//   }
//   // Priority 2: Premium Paid by
//   else {
//     match = normalizedText.match(/Premium Paid by\s*([^\n]+)/i);
//     if (match?.[1]) {
//       insuredName = match[1].replace(/\s+/g, " ").trim();
//     }
//     // Priority 3: Proposer Name (from Proposal Details)
//     else {
//       match = normalizedText.match(/Proposer Name\s*([^\n]+)/i);
//       if (match?.[1]) {
//         insuredName = match[1].replace(/\s+/g, " ").trim();
//       }
//       // Priority 4: Name : (first page)
//       else {
//         match = normalizedText.match(/Name\s*:\s*([^\n]+)/i);
//         if (match?.[1]) {
//           insuredName = match[1].replace(/\s+/g, " ").trim();
//         }
//         // Priority 5: Insured Name
//         else {
//           match = normalizedText.match(/Insured'?s?\s*Name\s*([^\n]+)/i);
//           if (match?.[1]) {
//             insuredName = match[1].replace(/\s+/g, " ").trim();
//           }
//         }
//       }
//     }
//   }
//   // Cleanup
//   insuredName = insuredName.replace(/\s+Intermediary.*$/i, "").trim();

//   // ========== 2. INSURED ADDRESS (Priority: Proposer Address first) ==========
// // Priority 1: Proposer Address (from Proposal Details)
// let addrMatch = normalizedText.match(
//   /Proposer\s+Address\s*([\s\S]*?)(?=\s*(?:Insured\s+Name|Mobile|Email|Proposer\s+Contact\s+Number|GSTIN|$))/i
// );
// if (addrMatch?.[1]) {
//   insuredAddress = addrMatch[1]
//     .replace(/\n+/g, " ")
//     .replace(/[ ]{2,}/g, " ")
//     .replace(/,\s*$/, '')      // remove trailing comma
//     .trim();
// }
// // Priority 2: Address : (first page)
// else {
//   addrMatch = normalizedText.match(/Address\s*:\s*([^\n]+(?:,\s*[^\n]+)*)/i);
//   if (addrMatch?.[1]) {
//     insuredAddress = addrMatch[1]
//       .replace(/\n+/g, " ")
//       .replace(/[ ]{2,}/g, " ")
//       .replace(/,\s*$/, '')
//       .trim();
//   }
//   // Priority 3: Insured Address
//   else {
//     addrMatch = normalizedText.match(/Insured'?s?\s*Address\s*([^\n]+(?:,\s*[^\n]+)*)/i);
//     if (addrMatch?.[1]) {
//       insuredAddress = addrMatch[1]
//         .replace(/\n+/g, " ")
//         .replace(/[ ]{2,}/g, " ")
//         .replace(/,\s*$/, '')
//         .trim();
//     }
//   }
// }

//   // ========== 3. CONTACT NUMBER (Priority: Proposer Contact Number) ==========
//   let contactMatch = normalizedText.match(/Proposer Contact Number\s*([\d\s]+)/i);
//   if (contactMatch?.[1]) {
//     contactNumber = contactMatch[1].replace(/\s+/g, "").trim();
//   } else {
//     contactMatch = normalizedText.match(/Contact No\s*:\s*([X\d]+)/i);
//     if (contactMatch?.[1]) {
//       contactNumber = contactMatch[1].replace(/\s+/g, "").trim();
//     } else {
//       contactMatch = normalizedText.match(/Contact Number\s*([\d\s]+)/i);
//       if (contactMatch?.[1]) contactNumber = contactMatch[1].replace(/\s+/g, "").trim();
//     }
//   }

//   // ========== 4. EMAIL (Priority: Proposer Email Address) ==========
//   let emailMatch = normalizedText.match(/Proposer Email Address\s*([^\s]+@[^\s]+)/i);
//   if (emailMatch?.[1]) {
//     email = emailMatch[1].trim();
//   } else {
//     emailMatch = normalizedText.match(/Email Id\s*:\s*([^\s]+@[^\s]+)/i);
//     if (emailMatch?.[1]) {
//       email = emailMatch[1].trim();
//     } else {
//       emailMatch = normalizedText.match(/Email\s*([^\s]+@[^\s]+)/i);
//       if (emailMatch?.[1]) email = emailMatch[1].trim();
//     }
//   }

//   // PAN and GST remain as fallbacks (not present in this PDF)
//   const panNumber = "-";
//   const gstin = "-";

//   let ncb = "-";
// // const normalizedText = "No Claim Bonus %   20% "; // Example input

// // Try multiple patterns to capture various NCB formats
// const ncbPatterns = [
//   // 1. Matches: "35% NCB", "20% No Claim Bonus" (Percentage comes first)
//   /([0-9]+(?:\.[0-9]+)?)\s*[%％]\s*(?:NCB|No\s+Claim\s+Bonus)\b/i,
  
//   // 2. Matches: "NCB Discount 35%", "No Claim Bonus %   20%", "NCB: 50%" (Text comes first)
//   /(?:NCB|No\s+Claim\s+Bonus)[^\d]*([0-9]+(?:\.[0-9]+)?)\s*[%％]/i
// ];

// for (const pattern of ncbPatterns) {
//   const match = normalizedText.match(pattern);
//   if (match?.[1]) {
//     ncb = `${match[1]}%`;  // Extracts the digits and appends '%' -> "20%"
//     break;
//   }
// }

//   return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin, ncb };
// };

// const extractPolicyDates = (fullText = "") => {
//   if (!fullText) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
//   const normalized = normalizeText(fullText);
//   let startDate = "-", odExpireDate = "-", tpExpireDate = "-";
  
//   // Priority 1: From Premium Receipt section
//   let startMatch = normalized.match(/Policy Start Date\s*([\d/]+)/i);
//   let endMatch = normalized.match(/Policy End Date\s*([\d/]+)/i);
  
//   if (startMatch?.[1]) startDate = startMatch[1];
//   if (endMatch?.[1]) odExpireDate = endMatch[1];
  
//   // Priority 2: From Period of Insurance OD
//   if (startDate === "-") {
//     const odFromMatch = normalized.match(/Period of Insurance OD\s*:\s*From:\s*([\d/]+)/i);
//     if (odFromMatch?.[1]) startDate = odFromMatch[1];
//   }
//   if (odExpireDate === "-") {
//     const odToMatch = normalized.match(/To:\s*([\d/]+)/i);
//     if (odToMatch?.[1]) odExpireDate = odToMatch[1];
//   }
  
//   // For standalone, it's "-", but for bundled we try to find
//   const tpMatch = normalized.match(/Active TP Policy Details.*?Policy End Date\s*([\d/]+)/is);
//   if (tpMatch?.[1]) tpExpireDate = tpMatch[1];
//   else {
//     // Alternative: Check for "TP Cover" period in bundled policies
//     const tpPeriodMatch = normalized.match(/TP Cover\s*[\d/]+\s*to\s*([\d/]+)/i);
//     if (tpPeriodMatch?.[1]) tpExpireDate = tpPeriodMatch[1];
//   }
  
//   return { startDate, odExpireDate, tpExpireDate };
// };

// const extractDateOfIssue = (text = "") => {
//   const match = text.match(/Policy Issue Date\s*:\s*([\d/]+)/i);
//   return match?.[1] || "-";
// };

// const extractIDV = (text = "") => {
//   if (!text) return "-";
  
//   // Pattern 1: Look for "Total" followed by a number (the last value in the IDV table)
//   let totalMatch = text.match(/Total\s+(\d+(?:\.\d+)?)/i);
//   if (totalMatch) return totalMatch[1];
  
//   // Pattern 2: Look for "Total IDV" or "Total IDV :" pattern
//   totalMatch = text.match(/Total\s+IDV\s*[:]?\s*(\d+(?:\.\d+)?)/i);
//   if (totalMatch) return totalMatch[1];
  
//   // Pattern 3: Look for the last number in the IDV table row (fallback)
//   const tableRow = text.match(/INSURED DECLARED VALUE.*?\n\s*(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+NA\s+NA\s+NA\s+(\d+(?:\.\d+)?)/is);
//   if (tableRow && tableRow[2]) return tableRow[2];
  
//   return "-";
// };

// const extractPreviousPolicyNumber = (text = "") => {
//   const match = text.match(/Previous Policy Number\s*([A-Z0-9\/\-]+)/i);
//   return match?.[1] || "-";
// };

// const extractPreviousInsurer = (text = "") => {
//   if (!text) return "-";
//   // Match "Previous Insurer" and capture everything until the next known field
//   const match = text.match(
//     /Previous\s+Insurer\s*([^:\n]+?)(?=\s*(?:Insurer\s+Name|Previous\s+Policy\s+Number|$))/i
//   );
//   if (match && match[1]) {
//     return match[1].trim();
//   }
//   // Fallback: original greedy match (just in case)
//   const fallback = text.match(/Previous Insurer\s*([^\n]+)/i);
//   return fallback ? fallback[1].trim() : "-";
// };

// const extractPremiumData = (text = "") => {
//   const result = {
//    calculatedTpPremium: "0",
//     totalOdPremium: "0", totalTpPremium: "0",
//     netPremium: "0", gst: "0", totalPayable: "0"
//   };
//   if (!text) return result;
//   const normalized = text.replace(/\s+/g, " ");
  
//   const totalODMatch = normalized.match(/TOTAL OWN DAMAGE PREMIUM\s*([\d.]+)/i);
//   if (totalODMatch) result.totalOdPremium = totalODMatch[1];
  
//   const gstMatch = normalized.match(/GST\s*([\d.]+)/i);
//   if (gstMatch) result.gst = gstMatch[1];
  
//   const finalMatch = normalized.match(/FINAL PREMIUM\s*([\d.]+)/i);
//   if (finalMatch) result.totalPayable = finalMatch[1];
  
//   result.netPremium = result.totalOdPremium;
//   return result;
// };

// const extractVehicleDetailsFromText = (text = "") => {
//   const result = {
//     registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-", model: "-",
//     variant: "-", gvw: "-", manufacturingYear: "-", fuelType: "-", cubicCapacity: "-", seatingCapacity: "-",
//     financierName: "-"
//   };
//   if (!text || typeof text !== "string") return result;
//   const normalizedText = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  
//   // Registration Number
//   const regMatch = normalizedText.match(/Registration Number\s+([A-Z0-9]+)(?:\s+RTO|$)/i);
//   if (regMatch) result.registrationNumber = regMatch[1].trim();
  
//   // Engine Number
//   const engineMatch = normalizedText.match(/Engine Number\s+([A-Z0-9]+)/i);
//   if (engineMatch) {
//     result.engineNumber = engineMatch[1].trim();
//   } else {
//     const { engine } = extractChassisAndEngine(normalizedText);
//     result.engineNumber = engine;
//   }
  
//   // Chassis Number
//   let chassisValue = null;
//   const chassisMatch1 = normalizedText.match(/Chassis Number\s+([A-Z0-9]+)(?=\s+(?:First|Year|Vehicle|Fuel|Seating|$))/i);
//   if (chassisMatch1) chassisValue = chassisMatch1[1];
//   if (!chassisValue) {
//     const chassisMatch2 = normalizedText.match(/Chassis Number\s+([A-Z0-9]+)/i);
//     if (chassisMatch2) chassisValue = chassisMatch2[1];
//   }
//   if (!chassisValue) {
//     const chassisMatch3 = normalizedText.match(/Chassis\s*Number\s*:\s*([A-Z0-9]+)/i);
//     if (chassisMatch3) chassisValue = chassisMatch3[1];
//   }
//   result.chassisNumber = chassisValue || "-";
  
//   // ========== MAKE - precise extraction ==========
//   let makeValue = "-";
//   const vehicleSection = text.match(/YOUR VEHICLE DETAILS([\s\S]*?)(?=\n\s*\n|\n\s*[A-Z][A-Z\s]+|$)/i);
//   const searchText = vehicleSection ? vehicleSection[1] : text;
//   const makeMatch = searchText.match(/Vehicle Make\s+([A-Za-z0-9]+)/i);
//   if (makeMatch) {
//     makeValue = makeMatch[1];
//   } else {
//     const lines = searchText.split(/\r?\n/);
//     for (const line of lines) {
//       if (line.includes('Vehicle Make')) {
//         const parts = line.trim().split(/\s+/);
//         const index = parts.findIndex(p => p === 'Vehicle' && parts[index+1] === 'Make');
//         if (index !== -1 && parts[index+2]) {
//           let rawMake = parts[index+2];
//           rawMake = rawMake.replace(/&amp;/g, '');
//           if (rawMake.includes('&')) rawMake = rawMake.split('&')[0];
//           makeValue = rawMake;
//         }
//         break;
//       }
//     }
//   }
//   result.make = makeValue;
  
//   // ========== MODEL - with conditional fallbacks ==========
//   let modelValue = null;
//   const modelMatch1 = normalizedText.match(/Vehicle Model\s+([A-Za-z0-9\s\-&]+?)(?=\s+Vehicle Variant|\s+Year|\s+Fuel|\s+Seating|$)/i);
//   if (modelMatch1) modelValue = modelMatch1[1].trim();
//   if (!modelValue) {
//     const modelMatch2 = normalizedText.match(/Vehicle Model\s+([^\n]+)/i);
//     if (modelMatch2) modelValue = modelMatch2[1].trim();
//   }
//   result.model = modelValue || "-";
  
//   // ========== VARIANT - conditional ==========
//   let variantValue = null;
//   const variantMatch1 = normalizedText.match(/Vehicle Variant\s+([A-Za-z0-9\s\-]+?)(?=\s+Cubic Capacity|\s+Year|\s+Fuel|\s+Seating|$)/i);
//   if (variantMatch1) variantValue = variantMatch1[1].trim();
//   if (!variantValue) {
//     const variantMatch2 = normalizedText.match(/Vehicle Variant\s+([^\n]+)/i);
//     if (variantMatch2) variantValue = variantMatch2[1].trim();
//   }
//   result.variant = variantValue || "-";
  
//   // ========== FINANCIER - with comma removal ==========
//   let financierValue = null;

// const finMatch1 = normalizedText.match(/Financier Name\s*[:]?\s*([^\n]+)/i);
// if (finMatch1) financierValue = finMatch1[1].trim();

// if (!financierValue) {
//   const finMatch2 = normalizedText.match(/Name of the Financier\s*[:]?\s*([^\n]+)/i);
//   if (finMatch2) financierValue = finMatch2[1].trim();
// }

// if (!financierValue) {
//   const finMatch3 = normalizedText.match(/Hypothecation\s*\/\s*Lease\s*\/\s*Hire Purchaser Name\s*[:]?\s*([^\n]+)/i);
//   // Removed the explicit !== "NA" rejection from the original code
//   if (finMatch3) financierValue = finMatch3[1].trim(); 
// }

// if (!financierValue) {
//   const finMatch4 = normalizedText.match(/Financier Details\s+([A-Za-z0-9\s,&]+?)(?=\s+(?:Intermediary|Roadside|POSP|\n|$))/i);
//   if (finMatch4) financierValue = finMatch4[1].trim();
// }

// // --- Cleanup & Formatting Phase ---
// if (financierValue) {
//   // 1. If the string starts with "NA " or is exactly "NA", discard the smushed document text
//   if (/^NA(?:\s|$)/i.test(financierValue)) {
//     financierValue = "NA";
//   } 
//   // 2. Otherwise, truncate at the first comma (as per your original logic)
//   else {
//     const commaIndex = financierValue.indexOf(',');
//     if (commaIndex !== -1) {
//       financierValue = financierValue.substring(0, commaIndex).trim();
//     }
//   }
  
//   result.financierName = financierValue;
// } else {
//   // 3. Default to "NA" instead of "-" if nothing is found
//   result.financierName = "NA"; 
// }
  
//   // ========== Other fields ==========
//   const yearMatch = normalizedText.match(/Year of Manufacture\s*(\d{4})/i);
//   if (yearMatch) result.manufacturingYear = yearMatch[1];
  
//   const fuelMatch = normalizedText.match(/Fuel\s*[:]?\s*([A-Za-z]+)(?=\s+(?:RTO|Seating|Cubic|$))/i);
//   if (fuelMatch) result.fuelType = fuelMatch[1].trim();
  
//   const ccMatch = normalizedText.match(/Cubic Capacity\s*\/\s*Kilo Watt\s*\/\s*Gross Vehicle Weight\s*\/\s*Horsepower\s*(\d+)/i);
//   if (ccMatch) result.cubicCapacity = ccMatch[1];
  
//   const seatMatch = normalizedText.match(/Seating Capacity including Driver\s*(\d+)/i);
//   if (seatMatch) result.seatingCapacity = seatMatch[1];
  
//   const geoMatch = normalizedText.match(/Geographical Area\s*\/\s*Zone\s*:\s*([^\n]+)/i);
//   if (geoMatch) result.geographicalArea = formatGeographicalArea(geoMatch[1]);
  
//   return result;
// };

// // =======================================
// // MAIN COMPONENT
// // =======================================

// function SBIPolicyCard({ item }) {
//   const sanitizeValue = (value) => {
//     if (value === null || value === undefined || value === "") return "-";
//     if (typeof value === "string" && value.trim() === "") return "-";
//     return value;
//   };

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

//   const insuredName = sanitizeValue(insured?.insuredName || autoInsuredDetails?.insuredName);
//   const insuredAddress = sanitizeValue(insured?.insuredAddress || autoInsuredDetails?.insuredAddress);
//   const panNumber = sanitizeValue(insured?.panNumber || autoInsuredDetails?.panNumber);
//   const contactNumber = sanitizeValue(insured?.contactNumber || autoInsuredDetails?.contactNumber);
//   const email = sanitizeValue(insured?.email || autoInsuredDetails?.email);
//   const gstin = sanitizeValue(autoInsuredDetails?.gstin);

//   // Use shared classification utilities
//   const vehicleCategory = sanitizeValue(getVehicleCategory(policy?.policyType, item?.fullText));
//   const productType = sanitizeValue(getProductType(policy?.policyType, item?.fullText));
//   const dateOfIssue = sanitizeValue(extractDateOfIssue(item?.fullText));
//   const totalValue = sanitizeValue(extractIDV(item?.fullText));
//   const previousPolicyNumber = sanitizeValue(extractPreviousPolicyNumber(item?.fullText));
//   const previousInsurer = sanitizeValue(extractPreviousInsurer(item?.fullText));

//   const finalPremium = {
//     calculatedTpPremium: premium?.calculatedTpPremium || autoPremium?.calculatedTpPremium || "0",
//     totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
//     totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
//     netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
//     gst: premium?.gst || autoPremium?.gst || "0",
//     totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
//   };

//   const policyNumber = sanitizeValue(policy?.policyNumber || item?.fullText?.match(/Policy \/ Certificate No\s*:\s*([0-9A-Z]+)/i)?.[1]);

//   // Sanitize policy dates
//   const sanitizedPolicyDates = {
//     startDate: sanitizeValue(policyDates.startDate),
//     odExpireDate: sanitizeValue(policyDates.odExpireDate),
//     tpExpireDate: sanitizeValue(policyDates.tpExpireDate),
//   };

//   // Merge extracted vehicle with existing vehicle details
//   const mergedVehicle = {
//     ...vehicle,
//     ...extractedVehicle,
//     registrationNumber: sanitizeValue(extractedVehicle.registrationNumber !== "-" ? extractedVehicle.registrationNumber : vehicle?.registrationNumber),
//     chassisNumber: sanitizeValue(extractedVehicle.chassisNumber !== "-" ? extractedVehicle.chassisNumber : vehicle?.chassisNumber),
//     engineNumber: sanitizeValue(extractedVehicle.engineNumber !== "-" ? extractedVehicle.engineNumber : vehicle?.engineNumber),
//     make: sanitizeValue(extractedVehicle.make !== "-" ? extractedVehicle.make : vehicle?.make),
//     model: sanitizeValue(extractedVehicle.model !== "-" ? extractedVehicle.model : vehicle?.model),
//     variant: sanitizeValue(extractedVehicle.variant !== "-" ? extractedVehicle.variant : vehicle?.variant),
//     manufacturingYear: sanitizeValue(extractedVehicle.manufacturingYear !== "-" ? extractedVehicle.manufacturingYear : vehicle?.manufacturingYear),
//     fuelType: sanitizeValue(extractedVehicle.fuelType !== "-" ? extractedVehicle.fuelType : vehicle?.fuelType),
//     cubicCapacity: sanitizeValue(extractedVehicle.cubicCapacity !== "-" ? extractedVehicle.cubicCapacity : vehicle?.cubicCapacity),
//     seatingCapacity: sanitizeValue(extractedVehicle.seatingCapacity !== "-" ? extractedVehicle.seatingCapacity : vehicle?.seatingCapacity),
//     financierName: sanitizeValue(extractedVehicle.financierName !== "-" ? extractedVehicle.financierName : vehicle?.financierName),
//     gvw: sanitizeValue(extractedVehicle.gvw !== "-" ? extractedVehicle.gvw : vehicle?.gvw),
//     geographicalArea: sanitizeValue(extractedVehicle.geographicalArea !== "-" ? extractedVehicle.geographicalArea : vehicle?.geographicalArea),
//   };

//   const sanitizedExtractedVehicle = {
//     registrationNumber: sanitizeValue(extractedVehicle.registrationNumber),
//     chassisNumber: sanitizeValue(extractedVehicle.chassisNumber),
//     engineNumber: sanitizeValue(extractedVehicle.engineNumber),
//     make: sanitizeValue(extractedVehicle.make),
//     model: sanitizeValue(extractedVehicle.model),
//     variant: sanitizeValue(extractedVehicle.variant),
//     manufacturingYear: sanitizeValue(extractedVehicle.manufacturingYear),
//     fuelType: sanitizeValue(extractedVehicle.fuelType),
//     cubicCapacity: sanitizeValue(extractedVehicle.cubicCapacity),
//     seatingCapacity: sanitizeValue(extractedVehicle.seatingCapacity),
//     financierName: sanitizeValue(extractedVehicle.financierName),
//     gvw: sanitizeValue(extractedVehicle.gvw),
//     geographicalArea: sanitizeValue(extractedVehicle.geographicalArea),
//   };

//   return (
//     <PolicyCardView
//       item={item}
//       policyNumber={policyNumber}
//       insuranceCompany={sanitizeValue(insuranceCompany)}
//       branchAddress={sanitizeValue(branchAddress)}
//       productType={productType}
//       vehicleCategory={vehicleCategory}
//       insuredName={insuredName}
//       panNumber={panNumber}
//       gstin={gstin}
//       contactNumber={contactNumber}
//       email={email}
//       insuredAddress={insuredAddress}
//       policyDates={sanitizedPolicyDates}
//       dateOfIssue={dateOfIssue}
//       totalValue={totalValue}
//       previousInsurer={previousInsurer}
//       previousPolicyNumber={previousPolicyNumber}
//       finalPremium={finalPremium}
//       vehicle={mergedVehicle}
//       extractedVehicle={sanitizedExtractedVehicle}
//     />
//   );
// }

// export default SBIPolicyCard;



// src/components/SBIPolicyCard.jsx

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

const sanitizeValue = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  return value;
};

// =======================================
// FORMATTING FUNCTIONS
// =======================================

const extractChassisAndEngine = (fullText) => {
  let chassis = "-", engine = "-";
  const normalized = fullText.replace(/\r/g, "\n").replace(/\t/g, " ");
  
  const engineMatch = normalized.match(/Engine\s+Number\s*[:\-]?\s*([A-Z0-9]+)/i);
  const chassisMatch = normalized.match(/Chassis\s+Number\s*[:\-]?\s*([A-Z0-9]+)/i);
  
  if (engineMatch) engine = engineMatch[1].trim().toUpperCase();
  if (chassisMatch) chassis = chassisMatch[1].trim().toUpperCase();
  
  // Fallback for combined line
  if (engine === "-" || chassis === "-") {
    const combined = normalized.match(/Engine\s*&\s*Chassis\s+Number\s*([A-Z0-9]+)\s*&\s*([A-Z0-9]+)/i);
    if (combined) {
      engine = combined[1].trim().toUpperCase();
      chassis = combined[2].trim().toUpperCase();
    }
  }
  
  return { engine, chassis };
};

const formatGeographicalArea = (geoArea) => {
  if (!geoArea) return "-";
  let area = String(geoArea);
  area = area.replace(/\s*Name of the Financier.*$/i, '');
  area = area.replace(/^Geographical Area\s*\/\s*Zone/i, '');
  const colonMatch = area.match(/:\s*([^/]+?)(?=\s*Year of manufacture|\s*Name of the Financier|\s*$)/i);
  if (colonMatch) return colonMatch[1].trim();
  const yearMatch = area.match(/^(.+?)(?=\s*Year of manufacture|\s*Name of the Financier|$)/i);
  if (yearMatch) return yearMatch[1].trim();
  if (/\d/.test(area)) {
    const nameMatch = area.match(/^([A-Za-z\s]+)/);
    if (nameMatch) return nameMatch[1].trim();
  }
  return area.trim();
};

// =======================================
// EXTRACTION FUNCTIONS
// =======================================

const extractInsuranceCompanyName = (fullText = "") => {
  if (!fullText) return "-";
  const companyMatch = fullText.match(/SBI General Insurance Company Limited/i);
  if (companyMatch) return "SBI General Insurance Company Limited";
  const altMatch = fullText.match(/([A-Z\s]+ASSURANCE\s*CO\.?\s*LTD\.?)/i);
  return altMatch ? altMatch[1].trim() : "-";
};

const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "-";
  const text = normalizeText(fullText);

  // Try to match "Policy Servicing Branch"
  const match = text.match(
    /Policy\s+Servicing\s+Branch\s*:\s*([\s\S]*?)(?=\s*(?:Intermediary|Period|Geographical|Policy|$))/i
  );
  if (match) {
    let addr = match[1].trim();
    if (!addr) return "-";
    addr = addr.replace(/\s*(?:Intermediary\s+(?:Name|Details|Contact)|Period|Geographical|Policy).*$/i, '');
    addr = addr.replace(/,\s*$/, '').trim();
    return addr || "-";
  }

  // Fallback: original "Branch Address" pattern
  const branchMatch = text.match(/Branch\s*Address\s*([\s\S]*?)(?=Branch Office Phone No\.|Geographical Area|$)/i);
  if (branchMatch) {
    let addr = branchMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    addr = addr.replace(/Branch Office Phone No\..*$/i, "").trim();
    return addr || "-";
  }

  return "-";
};

const extractInsuredDetails = (text = "") => {
  if (!text) {
    return { insuredName: "", insuredAddress: "", panNumber: "", contactNumber: "", email: "", gstin: "", ncb: "-" };
  }
  const normalizedText = normalizeText(text);
  let insuredName = "";
  let insuredAddress = "";
  let contactNumber = "";
  let email = "";

  // ========== 1. INSURED NAME ==========
  let match = normalizedText.match(/Policy Holder Name\s*([^\n]+)/i);
  if (match?.[1]) {
    insuredName = match[1].replace(/\s+/g, " ").trim();
  } else {
    match = normalizedText.match(/Premium Paid by\s*([^\n]+)/i);
    if (match?.[1]) {
      insuredName = match[1].replace(/\s+/g, " ").trim();
    } else {
      match = normalizedText.match(/Proposer Name\s*([^\n]+)/i);
      if (match?.[1]) {
        insuredName = match[1].replace(/\s+/g, " ").trim();
      } else {
        match = normalizedText.match(/Name\s*:\s*([^\n]+)/i);
        if (match?.[1]) {
          insuredName = match[1].replace(/\s+/g, " ").trim();
        } else {
          match = normalizedText.match(/Insured'?s?\s*Name\s*([^\n]+)/i);
          if (match?.[1]) {
            insuredName = match[1].replace(/\s+/g, " ").trim();
          }
        }
      }
    }
  }
  insuredName = insuredName.replace(/\s+Intermediary.*$/i, "").trim();

  // ========== 2. INSURED ADDRESS ==========
  let addrMatch = normalizedText.match(
    /Proposer\s+Address\s*([\s\S]*?)(?=\s*(?:Insured\s+Name|Mobile|Email|Proposer\s+Contact\s+Number|GSTIN|$))/i
  );
  if (addrMatch?.[1]) {
    insuredAddress = addrMatch[1]
      .replace(/\n+/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/,\s*$/, '')
      .trim();
  } else {
    addrMatch = normalizedText.match(/Address\s*:\s*([^\n]+(?:,\s*[^\n]+)*)/i);
    if (addrMatch?.[1]) {
      insuredAddress = addrMatch[1]
        .replace(/\n+/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/,\s*$/, '')
        .trim();
    } else {
      addrMatch = normalizedText.match(/Insured'?s?\s*Address\s*([^\n]+(?:,\s*[^\n]+)*)/i);
      if (addrMatch?.[1]) {
        insuredAddress = addrMatch[1]
          .replace(/\n+/g, " ")
          .replace(/[ ]{2,}/g, " ")
          .replace(/,\s*$/, '')
          .trim();
      }
    }
  }

  // ========== 3. CONTACT NUMBER ==========
  let contactMatch = normalizedText.match(/Proposer Contact Number\s*([\d\s]+)/i);
  if (contactMatch?.[1]) {
    contactNumber = contactMatch[1].replace(/\s+/g, "").trim();
  } else {
    contactMatch = normalizedText.match(/Contact No\s*:\s*([X\d]+)/i);
    if (contactMatch?.[1]) {
      contactNumber = contactMatch[1].replace(/\s+/g, "").trim();
    } else {
      contactMatch = normalizedText.match(/Contact Number\s*([\d\s]+)/i);
      if (contactMatch?.[1]) contactNumber = contactMatch[1].replace(/\s+/g, "").trim();
    }
  }

  // ========== 4. EMAIL ==========
  let emailMatch = normalizedText.match(/Proposer Email Address\s*([^\s]+@[^\s]+)/i);
  if (emailMatch?.[1]) {
    email = emailMatch[1].trim();
  } else {
    emailMatch = normalizedText.match(/Email Id\s*:\s*([^\s]+@[^\s]+)/i);
    if (emailMatch?.[1]) {
      email = emailMatch[1].trim();
    } else {
      emailMatch = normalizedText.match(/Email\s*([^\s]+@[^\s]+)/i);
      if (emailMatch?.[1]) email = emailMatch[1].trim();
    }
  }

  const panNumber = "";
  const gstin = "";

  let ncb = "-";
  const ncbPatterns = [
    /([0-9]+(?:\.[0-9]+)?)\s*[%％]\s*(?:NCB|No\s+Claim\s+Bonus)\b/i,
    /(?:NCB|No\s+Claim\s+Bonus)[^\d]*([0-9]+(?:\.[0-9]+)?)\s*[%％]/i
  ];

  for (const pattern of ncbPatterns) {
    const match = normalizedText.match(pattern);
    if (match?.[1]) {
      ncb = `${match[1]}%`;
      break;
    }
  }

  return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin, ncb };
};

const extractPolicyDates = (fullText = "") => {
  if (!fullText) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  const normalized = normalizeText(fullText);
  let startDate = "-", odExpireDate = "-", tpExpireDate = "-";
  
  let startMatch = normalized.match(/Policy Start Date\s*([\d/]+)/i);
  let endMatch = normalized.match(/Policy End Date\s*([\d/]+)/i);
  
  if (startMatch?.[1]) startDate = startMatch[1];
  if (endMatch?.[1]) odExpireDate = endMatch[1];
  
  if (startDate === "-") {
    const odFromMatch = normalized.match(/Period of Insurance OD\s*:\s*From:\s*([\d/]+)/i);
    if (odFromMatch?.[1]) startDate = odFromMatch[1];
  }
  if (odExpireDate === "-") {
    const odToMatch = normalized.match(/To:\s*([\d/]+)/i);
    if (odToMatch?.[1]) odExpireDate = odToMatch[1];
  }
  
  const tpMatch = normalized.match(/Active TP Policy Details.*?Policy End Date\s*([\d/]+)/is);
  if (tpMatch?.[1]) tpExpireDate = tpMatch[1];
  else {
    const tpPeriodMatch = normalized.match(/TP Cover\s*[\d/]+\s*to\s*([\d/]+)/i);
    if (tpPeriodMatch?.[1]) tpExpireDate = tpPeriodMatch[1];
  }
  
  return { startDate, odExpireDate, tpExpireDate };
};

const extractDateOfIssue = (text = "") => {
  const match = text.match(/Policy Issue Date\s*:\s*([\d/]+)/i);
  return match?.[1] || "-";
};

const extractIDV = (text = "") => {
  if (!text) return "-";
  
  let totalMatch = text.match(/Total\s+(\d+(?:\.\d+)?)/i);
  if (totalMatch) return totalMatch[1];
  
  totalMatch = text.match(/Total\s+IDV\s*[:]?\s*(\d+(?:\.\d+)?)/i);
  if (totalMatch) return totalMatch[1];
  
  const tableRow = text.match(/INSURED DECLARED VALUE.*?\n\s*(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+NA\s+NA\s+NA\s+(\d+(?:\.\d+)?)/is);
  if (tableRow && tableRow[2]) return tableRow[2];
  
  return "-";
};

const extractPreviousPolicyNumber = (text = "") => {
  const match = text.match(/Previous Policy Number\s*([A-Z0-9\/\-]+)/i);
  return match?.[1] || "-";
};

const extractPreviousInsurer = (text = "") => {
  if (!text) return "-";
  const match = text.match(
    /Previous\s+Insurer\s*([^:\n]+?)(?=\s*(?:Insurer\s+Name|Previous\s+Policy\s+Number|$))/i
  );
  if (match && match[1]) {
    return match[1].trim();
  }
  const fallback = text.match(/Previous Insurer\s*([^\n]+)/i);
  return fallback ? fallback[1].trim() : "-";
};

const extractPremiumData = (text = "") => {
  const result = {
    calculatedTpPremium: "0",
    totalOdPremium: "0", totalTpPremium: "0",
    netPremium: "0", gst: "0", totalPayable: "0"
  };
  if (!text) return result;
  const normalized = text.replace(/\s+/g, " ");
  
  const totalODMatch = normalized.match(/TOTAL OWN DAMAGE PREMIUM\s*([\d.]+)/i);
  if (totalODMatch) result.totalOdPremium = totalODMatch[1];
  
  const gstMatch = normalized.match(/GST\s*([\d.]+)/i);
  if (gstMatch) result.gst = gstMatch[1];
  
  const finalMatch = normalized.match(/FINAL PREMIUM\s*([\d.]+)/i);
  if (finalMatch) result.totalPayable = finalMatch[1];
  
  result.netPremium = result.totalOdPremium;
  return result;
};

const extractVehicleDetailsFromText = (text = "") => {
  const result = {
    registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-", model: "-",
    variant: "-", gvw: "-", manufacturingYear: "-", fuelType: "-", cubicCapacity: "-", seatingCapacity: "-",
    financierName: "-"
  };
  if (!text || typeof text !== "string") return result;
  const normalizedText = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  
  // Registration Number
  const regMatch = normalizedText.match(/Registration Number\s+([A-Z0-9]+)(?:\s+RTO|$)/i);
  if (regMatch) result.registrationNumber = regMatch[1].trim();
  
  // Engine Number
  const engineMatch = normalizedText.match(/Engine Number\s+([A-Z0-9]+)/i);
  if (engineMatch) {
    result.engineNumber = engineMatch[1].trim();
  } else {
    const { engine } = extractChassisAndEngine(normalizedText);
    result.engineNumber = engine;
  }
  
  // Chassis Number
  let chassisValue = null;
  const chassisMatch1 = normalizedText.match(/Chassis Number\s+([A-Z0-9]+)(?=\s+(?:First|Year|Vehicle|Fuel|Seating|$))/i);
  if (chassisMatch1) chassisValue = chassisMatch1[1];
  if (!chassisValue) {
    const chassisMatch2 = normalizedText.match(/Chassis Number\s+([A-Z0-9]+)/i);
    if (chassisMatch2) chassisValue = chassisMatch2[1];
  }
  if (!chassisValue) {
    const chassisMatch3 = normalizedText.match(/Chassis\s*Number\s*:\s*([A-Z0-9]+)/i);
    if (chassisMatch3) chassisValue = chassisMatch3[1];
  }
  result.chassisNumber = chassisValue || "-";
  
  // MAKE
  let makeValue = "-";
  const vehicleSection = text.match(/YOUR VEHICLE DETAILS([\s\S]*?)(?=\n\s*\n|\n\s*[A-Z][A-Z\s]+|$)/i);
  const searchText = vehicleSection ? vehicleSection[1] : text;
  const makeMatch = searchText.match(/Vehicle Make\s+([A-Za-z0-9]+)/i);
  if (makeMatch) {
    makeValue = makeMatch[1];
  } else {
    const lines = searchText.split(/\r?\n/);
    for (const line of lines) {
      if (line.includes('Vehicle Make')) {
        const parts = line.trim().split(/\s+/);
        const index = parts.findIndex(p => p === 'Vehicle' && parts[index+1] === 'Make');
        if (index !== -1 && parts[index+2]) {
          let rawMake = parts[index+2];
          rawMake = rawMake.replace(/&amp;/g, '');
          if (rawMake.includes('&')) rawMake = rawMake.split('&')[0];
          makeValue = rawMake;
        }
        break;
      }
    }
  }
  result.make = makeValue;
  
  // MODEL
  let modelValue = null;
  const modelMatch1 = normalizedText.match(/Vehicle Model\s+([A-Za-z0-9\s\-&]+?)(?=\s+Vehicle Variant|\s+Year|\s+Fuel|\s+Seating|$)/i);
  if (modelMatch1) modelValue = modelMatch1[1].trim();
  if (!modelValue) {
    const modelMatch2 = normalizedText.match(/Vehicle Model\s+([^\n]+)/i);
    if (modelMatch2) modelValue = modelMatch2[1].trim();
  }
  result.model = modelValue || "-";
  
  // VARIANT
  let variantValue = null;
  const variantMatch1 = normalizedText.match(/Vehicle Variant\s+([A-Za-z0-9\s\-]+?)(?=\s+Cubic Capacity|\s+Year|\s+Fuel|\s+Seating|$)/i);
  if (variantMatch1) variantValue = variantMatch1[1].trim();
  if (!variantValue) {
    const variantMatch2 = normalizedText.match(/Vehicle Variant\s+([^\n]+)/i);
    if (variantMatch2) variantValue = variantMatch2[1].trim();
  }
  result.variant = variantValue || "-";
  
  // FINANCIER
  let financierValue = null;
  const finMatch1 = normalizedText.match(/Financier Name\s*[:]?\s*([^\n]+)/i);
  if (finMatch1) financierValue = finMatch1[1].trim();

  if (!financierValue) {
    const finMatch2 = normalizedText.match(/Name of the Financier\s*[:]?\s*([^\n]+)/i);
    if (finMatch2) financierValue = finMatch2[1].trim();
  }

  if (!financierValue) {
    const finMatch3 = normalizedText.match(/Hypothecation\s*\/\s*Lease\s*\/\s*Hire Purchaser Name\s*[:]?\s*([^\n]+)/i);
    if (finMatch3) financierValue = finMatch3[1].trim(); 
  }

  if (!financierValue) {
    const finMatch4 = normalizedText.match(/Financier Details\s+([A-Za-z0-9\s,&]+?)(?=\s+(?:Intermediary|Roadside|POSP|\n|$))/i);
    if (finMatch4) financierValue = finMatch4[1].trim();
  }

  if (financierValue) {
    if (/^NA(?:\s|$)/i.test(financierValue)) {
      financierValue = "NA";
    } else {
      const commaIndex = financierValue.indexOf(',');
      if (commaIndex !== -1) {
        financierValue = financierValue.substring(0, commaIndex).trim();
      }
    }
    result.financierName = financierValue;
  } else {
    result.financierName = "NA"; 
  }
  
  // OTHER FIELDS
  const yearMatch = normalizedText.match(/Year of Manufacture\s*(\d{4})/i);
  if (yearMatch) result.manufacturingYear = yearMatch[1];
  
  const fuelMatch = normalizedText.match(/Fuel\s*[:]?\s*([A-Za-z]+)(?=\s+(?:RTO|Seating|Cubic|$))/i);
  if (fuelMatch) result.fuelType = fuelMatch[1].trim();
  
  const ccMatch = normalizedText.match(/Cubic Capacity\s*\/\s*Kilo Watt\s*\/\s*Gross Vehicle Weight\s*\/\s*Horsepower\s*(\d+)/i);
  if (ccMatch) result.cubicCapacity = ccMatch[1];
  
  const seatMatch = normalizedText.match(/Seating Capacity including Driver\s*(\d+)/i);
  if (seatMatch) result.seatingCapacity = seatMatch[1];
  
  const geoMatch = normalizedText.match(/Geographical Area\s*\/\s*Zone\s*:\s*([^\n]+)/i);
  if (geoMatch) result.geographicalArea = formatGeographicalArea(geoMatch[1]);
  
  return result;
};

// =======================================
// MAIN COMPONENT
// =======================================

function SBIPolicyCard({ item }) {
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

  // Using empty string as requested default for insured details where applicable
  const insuredName = sanitizeValue(insured?.insuredName || autoInsuredDetails?.insuredName, "");
  const insuredAddress = sanitizeValue(insured?.insuredAddress || autoInsuredDetails?.insuredAddress, "");
  const panNumber = sanitizeValue(insured?.panNumber || autoInsuredDetails?.panNumber, "");
  const contactNumber = sanitizeValue(insured?.contactNumber || autoInsuredDetails?.contactNumber, "");
  const email = sanitizeValue(insured?.email || autoInsuredDetails?.email, "");
  const gstin = sanitizeValue(autoInsuredDetails?.gstin, "");

  const vehicleCategory = sanitizeValue(getVehicleCategory(policy?.policyType, item?.fullText));
  const productType = sanitizeValue(getProductType(policy?.policyType, item?.fullText));
  const dateOfIssue = sanitizeValue(extractDateOfIssue(item?.fullText));
  const totalValue = sanitizeValue(extractIDV(item?.fullText));
  const previousPolicyNumber = sanitizeValue(extractPreviousPolicyNumber(item?.fullText));
  const previousInsurer = sanitizeValue(extractPreviousInsurer(item?.fullText));

  const finalPremium = {
    calculatedTpPremium: premium?.calculatedTpPremium || autoPremium?.calculatedTpPremium || "0",
    totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
    totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
    netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
    gst: premium?.gst || autoPremium?.gst || "0",
    totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
  };

  const policyNumber = sanitizeValue(policy?.policyNumber || item?.fullText?.match(/Policy \/ Certificate No\s*:\s*([0-9A-Z]+)/i)?.[1]);

  const sanitizedPolicyDates = {
    startDate: sanitizeValue(policyDates.startDate),
    odExpireDate: sanitizeValue(policyDates.odExpireDate),
    tpExpireDate: sanitizeValue(policyDates.tpExpireDate),
  };

  const mergedVehicle = {
    ...vehicle,
    ...extractedVehicle,
    registrationNumber: sanitizeValue(extractedVehicle.registrationNumber !== "-" ? extractedVehicle.registrationNumber : vehicle?.registrationNumber),
    chassisNumber: sanitizeValue(extractedVehicle.chassisNumber !== "-" ? extractedVehicle.chassisNumber : vehicle?.chassisNumber),
    engineNumber: sanitizeValue(extractedVehicle.engineNumber !== "-" ? extractedVehicle.engineNumber : vehicle?.engineNumber),
    make: sanitizeValue(extractedVehicle.make !== "-" ? extractedVehicle.make : vehicle?.make),
    model: sanitizeValue(extractedVehicle.model !== "-" ? extractedVehicle.model : vehicle?.model),
    variant: sanitizeValue(extractedVehicle.variant !== "-" ? extractedVehicle.variant : vehicle?.variant),
    manufacturingYear: sanitizeValue(extractedVehicle.manufacturingYear !== "-" ? extractedVehicle.manufacturingYear : vehicle?.manufacturingYear),
    fuelType: sanitizeValue(extractedVehicle.fuelType !== "-" ? extractedVehicle.fuelType : vehicle?.fuelType),
    cubicCapacity: sanitizeValue(extractedVehicle.cubicCapacity !== "-" ? extractedVehicle.cubicCapacity : vehicle?.cubicCapacity),
    seatingCapacity: sanitizeValue(extractedVehicle.seatingCapacity !== "-" ? extractedVehicle.seatingCapacity : vehicle?.seatingCapacity),
    financierName: sanitizeValue(extractedVehicle.financierName !== "-" ? extractedVehicle.financierName : vehicle?.financierName),
    gvw: sanitizeValue(extractedVehicle.gvw !== "-" ? extractedVehicle.gvw : vehicle?.gvw),
    geographicalArea: sanitizeValue(extractedVehicle.geographicalArea !== "-" ? extractedVehicle.geographicalArea : vehicle?.geographicalArea),
  };

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
    financierName: sanitizeValue(extractedVehicle.financierName),
    gvw: sanitizeValue(extractedVehicle.gvw),
    geographicalArea: sanitizeValue(extractedVehicle.geographicalArea),
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
      vehicle={mergedVehicle}
      extractedVehicle={sanitizedExtractedVehicle}
    />
  );
}

export default SBIPolicyCard;
