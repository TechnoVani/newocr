// // src/components/ShriramPolicyCard.jsx

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
// // FORMATTING FUNCTIONS (Reusable across companies)
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

// const formatEngineNumber = (engine = "", fullText = "") => {
//   const cleanEngine = (value) => {
//     if (!value) return "-";
//     return String(value)
//       .replace(/\r|\n/g, "")
//       .replace(/\s+/g, "")
//       .replace(/MAKE$/i, "")
//       .replace(/MODEL$/i, "")
//       .replace(/VARIANT$/i, "")
//       .replace(/[^A-Z0-9]/gi, "")
//       .toUpperCase()
//       .trim();
//   };

//   if (!fullText || typeof fullText !== "string") {
//     return cleanEngine(engine);
//   }

//   const normalizedText = fullText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
//   let match;

//   match = normalizedText.match(
//     /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+\s+[A-Z0-9]+)/i
//   );
//   if (match) return cleanEngine(`${match[2]}`);

//   match = normalizedText.match(
//     /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+)\s*\n\s*([A-Z0-9]+)\b/i
//   );
//   if (match) return cleanEngine(`${match[2]}${match[3]}`);

//   match = normalizedText.match(
//     /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\n\s*([A-Z0-9]+)\s*\/\s*([A-Z0-9]+)/i
//   );
//   if (match) return cleanEngine(match[3]);

//   match = normalizedText.match(
//     /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+)/i
//   );
//   if (match) return cleanEngine(match[2]);

//   match = normalizedText.match(/Engine\s*Number\s*[:\-]?\s*([A-Z0-9\s]+)/i);
//   if (match) return cleanEngine(match[1]);
  
//   match = normalizedText.match(
//     /Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([A-Z0-9]+)\s*\/\s*([A-Z0-9]+)\s+([A-Z0-9]+)/i
//   );
//   if (match) return cleanEngine(`${match[2]}${match[3]}`);

//   return cleanEngine(engine);
// };

// const formatChassisNumber = (chassis = "", fullText = "") => {
//   const cleanChassis = (value) => {
//     if (!value) return "-";
//     return String(value).replace(/[^A-Z0-9~]/gi, "").toUpperCase().trim();
//   };

//   if (!fullText || typeof fullText !== "string") {
//     return cleanChassis(chassis);
//   }

//   const normalizedText = fullText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");

//   let match = normalizedText.match(
//     /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*[A-Z0-9]+\s*\n\s*[A-Z0-9]+/i
//   );
//   if (match) return cleanChassis(match[1]);

//   match = normalizedText.match(
//     /Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\n\s*([A-Z0-9]+)\s*\/\s*[A-Z0-9]+/i
//   );
//   if (match) return cleanChassis(`${match[1]}${match[2]}`);
  
//   match = normalizedText.match(
//     /Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([A-Z0-9]+)\s*\/\s*[A-Z0-9]+\s+[A-Z0-9]+/i
//   );
//   if (match) return cleanChassis(match[1]);

//   return cleanChassis(chassis);
// };

// // Generic field formatter
// const formatGenericField = (value, stopWords = []) => {
//   if (!value) return "-";
//   let formatted = String(value);
//   for (const word of stopWords) {
//     const regex = new RegExp(`\\s*${word.source || word}\\s*.*$`, 'i');
//     formatted = formatted.replace(regex, "");
//   }
//   return formatted.trim();
// };

// const removeHyphens = (value) => {
//   if (!value || value === "-") return "-";
//   return String(value).replace(/-/g, "");
// };

// const formatModelName = (model) => {
//   let cleaned = formatGenericField(model, [/Registration\s*no\.?/i, /Variant/i, /Colour/i, /Year/i, /Type of body/i]);
//   return removeHyphens(cleaned);
// };

// const formatVariantName = (variant) => formatGenericField(variant, [/Gvw/i, /GVW/i, /Year of manufacture/i, /Type of body/i, /Colour/i, /Registration/i]);
// const formatFuelType = (fuel) => formatGenericField(fuel, [/Cubic/i]);
// const formatCommercialVehicleType = (type) => formatGenericField(type, [/Sub Type/i]);
//   /Name of the Financier/i, /Chassis no/i, /Type of fuel/i, /Cubic capacity/i,
//   /Type of body/i, /Gross Vehicle Weight/i, /Make\/Model/i, /Registration no/i,
//   /Seating capacity/i, /Variant/i, /Automobile Association/i, /Colour/i
// ]);

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
// // SHIRAM‑SPECIFIC EXTRACTION FUNCTIONS
// // =======================================

// // ----- Policy Dates (Shriram) -----
// const extractPolicyDates = (fullText = "") => {
//   if (!fullText) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };

//   // 1. OD/TP bundled pattern (existing)
//   const odFromMatch = fullText.match(/OD\s*Policy\s*From\s*([\d:]+)\s*Hrs?\s*of\s*(\d{2}\/\d{2}\/\d{4})/i);
//   const odToMatch = fullText.match(/To\s+(?:[\d:]+\s+Hrs?\s+of\s+|Midnight\s+Of\s+)(\d{2}\/\d{2}\/\d{4})/i);
//   const tpFromMatch = fullText.match(/TP\s*Policy\s*From\s*([\d:]+)\s*Hrs?\s*of\s*(\d{2}\/\d{2}\/\d{4})/i);
//   const tpToMatch = fullText.match(/TP\s*Policy\s*From[\s\S]*?To\s+(?:[\d:]+\s+Hrs?\s+of\s+|Midnight\s+Of\s+)(\d{2}\/\d{2}\/\d{4})/i);

//   let startDate = "-", odExpireDate = "-", tpExpireDate = "-";

//   if (odFromMatch) startDate = odFromMatch[2] || "-";
//   if (odToMatch) odExpireDate = odToMatch[1] || "-";

//   if (tpToMatch) {
//     tpExpireDate = tpToMatch[1] || odExpireDate;
//   } else {
//     const tpToAlt = fullText.match(/To\s*Date\s*&\s*Time\s*([\d/]+)/i);
//     if (tpToAlt) tpExpireDate = tpToAlt[1] || odExpireDate;
//     else tpExpireDate = odExpireDate;
//   }

//   if (startDate === "-" && tpFromMatch) startDate = tpFromMatch[2] || "-";

//   // If still not found, try "Period of Insurance" pattern (new format)
//   if (startDate === "-" || odExpireDate === "-") {
//     const periodMatch = fullText.match(
//       /Period\s+of\s+Insurance\s+From\s+[\d:]+\s+(?:Hrs\s+of\s+|HRS\s+OF\s+|hrs\s+of\s+)?(\d{2}\/\d{2}\/\d{4})\s+To\s+(?:Midnight\s+of\s+|[\d:]+\s+Hrs?\s+of\s+)(\d{2}\/\d{2}\/\d{4})/i
//     );
//     if (periodMatch) {
//       startDate = periodMatch[1] || startDate;
//       odExpireDate = periodMatch[2] || odExpireDate;
//       tpExpireDate = periodMatch[2] || tpExpireDate;
//     }
//   }

//   return { startDate, odExpireDate, tpExpireDate };
// };

// // ----- Insurance Company -----
// const extractInsuranceCompanyName = () => {
//   return "Shriram General Insurance Co.Ltd.";
// };

// // ----- Branch Address -----
// const extractBranchAddress = (fullText = "") => {
//   if (!fullText) return "-";
//   const text = normalizeText(fullText);
//   const branchMatch = text.match(/Branch\s*Address\s*([\s\S]*?)(?=Branch Office Phone No\.|Geographical Area|$)/i);
//   if (branchMatch) {
//     let addr = branchMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
//     addr = addr.replace(/Branch Office Phone No\..*$/i, "").trim();
//     return addr || "-";
//   }
//   return "-";
// };

// // ----- Insured Details -----
// const extractInsuredDetails = (fullText = "") => {
//   if (!fullText) {
//     return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
//   }
//   const text = normalizeText(fullText);
//   const result = {};

//   // Insured Name
//   const insuredNameMatch = text.match(
//     /Insured'?s?\s*Code\s*\/\s*Name\s*([\s\S]*?)(?=GSTIN\s*No\.?\s*Of\s*Insured|Insured\s*Address|CKYC\s*Details|Insured\s*State\s*Code)/i
//   );
//   if (insuredNameMatch) {
//     let nameBlock = insuredNameMatch[1].replace(/\s+/g, " ").trim();
//     nameBlock = nameBlock.replace(/^[A-Z]{1,5}-?\d+\s*\/\s*/i, "");
//     result.insuredName = nameBlock.trim() || "-";
//   } else {
//     result.insuredName = "-";
//   }

//   // Insured Address
//   const insuredAddrMatch = text.match(
//     /Insured\s*Address\s*(?:and\s*Contact\s*Details)?([\s\S]*?)(?=Insured\s*Address\s*as\s*Per\s*RC|CKYC\s*Details|Insured\s*State\s*Code)/i
//   );
//   if (insuredAddrMatch) {
//     let addr = insuredAddrMatch[1].replace(/\s+/g, " ").trim();
//     addr = addr.replace(/Mob-.*$/i, "").replace(/Email-.*$/i, "").trim();
//     result.insuredAddress = addr || "-";
//   } else {
//     result.insuredAddress = "-";
//   }

//   // PAN
//   // Look for PAN No. followed by either "N.A", "N.A.", or a standard 10-character string
// const panMatch = text.match(/PAN\s*No\.?\s*([A-Z]{5}\d{4}[A-Z]|N\.?A\.?|[A-Z0-9]+)/i);
// let panNumber = "-";

// if (panMatch?.[1]) {
//   const rawPan = panMatch[1].trim();
//   if (rawPan) panNumber = rawPan;
// }

// if (panNumber === "-") {
//   // Updated fallback to also ignore trailing text
//   const fallbackPan = text.match(/PAN\/FORM\s*60:\s*([A-Z]{5}\d{4}[A-Z]|N\.?A\.?|[A-Z0-9]+)/i);
//   if (fallbackPan?.[1]) panNumber = fallbackPan[1].trim();
// }

// result.panNumber = panNumber;

//   const contactMatch = text.match(/Mob[- ]?(\*+|\d+)/i);
//   result.contactNumber = contactMatch?.[1]?.trim() || "-";

//   const emailMatch = text.match(/Email[- ]?([^\s,]+)/i);
//   result.email = emailMatch?.[1]?.trim() || "-";

//   // GSTIN
//   const gstinMatch = text.match(/GSTIN\s*No\.?\s*Of\s*Insured\s*([^\n\r]+)/i);
//   let gstValue = gstinMatch?.[1]?.trim() || "";
//   if (!gstValue || /Unregistered/i.test(gstValue) || /^N\.?A\.?$/i.test(gstValue)) {
//     result.gstin = "-";
//   } else {
//     result.gstin = gstValue;
//   }

//   return result;
// };

// // ----- Date of Issue -----
// const extractDateOfIssue = (fullText = "", fallbackStartDate = "-") => {
//   const match = fullText.match(/Date\s*of\s*Issue\s*[:.]?\s*(\d{2}\/\d{2}\/\d{4})/i);
//   return match?.[1] || fallbackStartDate;
// };

// // ----- IDV -----
// const extractIDV = (fullText = "") => {
//   if (!fullText) return "0";
//   const text = normalizeText(fullText);
//   const idvBlockMatch = text.match(
//     /IDV\s*FOR\s*THE\s*VEHICLE[\s\S]*?TOTAL\s*VALUE\s*([\d.\s]+)/i
//   );
//   if (idvBlockMatch) {
//     const nums = idvBlockMatch[1].match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
//     const nonZeroValues = nums.filter(n => n > 0);
//     return nonZeroValues.length ? Math.max(...nonZeroValues).toString() : "0";
//   }
//   return "0";
// };

// // ----- Previous Insurer & Policy -----
// const extractPreviousInsurer = (fullText = "") => {
//   if (!fullText) return "-";
//   const text = normalizeText(fullText);
//   const prevInsMatch = text.match(
//     /Previous\s*Insurer\s*([\s\S]*?)(?=Previous\s*Policy\s*No|Nominee\s*for\s*Owner\/Driver|Nominee\s*Age)/i
//   );
//   let prevInsurer = prevInsMatch?.[1]?.replace(/\s+/g, " ")?.trim() || "";
//   prevInsurer = prevInsurer.replace(/Total\s+\d+.*$/i, "").trim();
//   if (!prevInsurer || /^N\.?A\.?$/i.test(prevInsurer) || /^N\.?A\./i.test(prevInsurer)) {
//     return "-";
//   }
//   return prevInsurer;
// };

// const extractPreviousPolicyNumber = (fullText = "") => {
//   if (!fullText) return "-";
//   const text = normalizeText(fullText);
//   const prevPolMatch = text.match(
//     /Previous\s*Policy\s*No\.?\s*([\s\S]*?)(?=Nominee\s*for\s*Owner\/Driver|Nominee\s*Age|Appointee)/i
//   );
//   let prevPolicy = prevPolMatch?.[1]?.replace(/\s+/g, " ")?.trim() || "";
//   if (!prevPolicy || /^N\.?A\.?$/i.test(prevPolicy)) return "-";
//   return prevPolicy;
// };

// // ----- Premium Data -----
// const extractPremiumData = (fullText = "") => {
//   const defaultResult = { calculatedOdPremium: "0", calculatedTpPremium: "0", totalOdPremium: "0", totalTpPremium: "0", netPremium: "0", gst: "0", totalPayable: "0" };
//   if (!fullText) return defaultResult;
//   const text = normalizeText(fullText);
//   const result = {};

//   // Try existing patterns first (OD/TP TOTAL)
//   const odTotalMatch = text.match(/OD\s*TOTAL\s*([\d.]+)/i);
//   if (odTotalMatch) result.totalOdPremium = odTotalMatch[1];

//   const tpTotalMatch = text.match(/TP\s*TOTAL\s*([\d.]+)/i);
//   if (tpTotalMatch) result.totalTpPremium = tpTotalMatch[1];

//   // If not found, try liability-only pattern (new)
//   if (!tpTotalMatch) {
//     const basicTP = text.match(/BASIC TP COVER\s*([\d.]+)/i);
//     if (basicTP) {
//       result.totalTpPremium = basicTP[1];
//       // Also try to get total TP from "TP TOTAL" if present later
//       const tpTotalFallback = text.match(/TP\s*TOTAL\s*([\d.]+)/i);
//       if (tpTotalFallback) result.totalTpPremium = tpTotalFallback[1];
//     }
//   }

//   // Net premium (TOTAL PREMIUM or Premium(A+B))
//   const totalPremMatch = text.match(/TOTAL\s*PREMIUM\s*([\d.]+)/i);
//   if (totalPremMatch) result.netPremium = totalPremMatch[1];
//   else {
//     const premSum = text.match(/Premium\(A\+B\)\s*([\d.]+)/i);
//     if (premSum) result.netPremium = premSum[1];
//   }

//   // GST: try CGST + SGST (existing), then IGST
//   const cgstMatch = text.match(/CGST\s*([\d.]+)/i);
//   const sgstMatch = text.match(/SGST\/UTGST\s*([\d.]+)/i);
//   if (cgstMatch || sgstMatch) {
//     result.gst = (parseFloat(cgstMatch?.[1] || 0) + parseFloat(sgstMatch?.[1] || 0)).toFixed(2);
//   } else {
//     const igstMatch = text.match(/IGST\s*([\d.]+)/i);
//     if (igstMatch) result.gst = igstMatch[1];
//   }

//   // Total payable (PREMIUM AMOUNT or Total)
//   const totalPayMatch = text.match(/PREMIUM\s*AMOUNT\s*([\d.]+)/i) || text.match(/Total\s*([\d.]+)/i);
//   if (totalPayMatch) result.totalPayable = totalPayMatch[1];

//   // For Shriram, calculated OD and TP are same as total (bundled) or TP only (liability)
//   result.calculatedOdPremium = result.totalOdPremium || "0";
//   result.calculatedTpPremium = result.totalTpPremium || "0";

//   return { ...defaultResult, ...result };
// };

// // ----- Vehicle Details -----
// const extractVehicleDetails = (fullText = "") => {
//   const result = {
//     registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-", model: "-",
//     variant: "-", gvw: "-", manufacturingYear: "-", fuelType: "-", cubicCapacity: "-", 
//     seatingCapacity: "-", financierName: "-", ncb: "-"
//   };
  
//   if (!fullText) return result;
  
//   const text = fullText.toUpperCase().replace(/\n/g, " ");

//   const regMatch = text.match(
//     /REGISTRATION\s*MARK\s*&\s*PLACE[\s\S]*?SEAT\s*CAP\.?\s*\(INCL\.?\s*DRIVER\)\s*([A-Z0-9\s&-]+?)\s+[A-Z0-9]{10,}\s*&\s*[A-Z0-9]{10,}/i
//   );
//   if (regMatch) {
//     let reg = regMatch[1].replace(/\s+/g, " ").trim();
//     if (reg.includes("&")) reg = reg.split("&")[0].trim();
//     result.registrationNumber = reg.replace(/-/g, "") || "-"; 
//   }

//   const engChassisMatch = text.match(/([A-Z0-9]{10,})\s*&\s*([A-Z0-9]{10,})/i);
//   if (engChassisMatch) {
//     result.engineNumber = engChassisMatch[1].trim();
//     result.chassisNumber = engChassisMatch[2].trim();
//   }
  
//   let postChassisText = text;
//   if (result.chassisNumber !== "-") {
//     const splitText = text.split(result.chassisNumber);
//     if (splitText.length > 1) {
//       postChassisText = splitText[1];
//     }
//   }

//   const makeModelMatch = postChassisText.match(/^\s*([A-Z\s]+?)\s*-\s*(.*?)\s+(BS\s*[A-Z0-9]+)\s+(?=[A-Z\s]+\/)/i);
  
//   if (makeModelMatch) {
//     result.make = makeModelMatch[1].replace(/\s+/g, " ").trim();
//     result.model = makeModelMatch[2].replace(/\s+/g, " ").trim();
//     result.variant = makeModelMatch[3].replace(/\s+/g, " ").trim();
//   } else {
//     const fallbackMatch = postChassisText.match(/^\s*([A-Z\s]+?)\s*-\s*([A-Z0-9\s]+?)\s+(?=(?:E\s+)?(?:MOTOR\s+CYCLE|MOTOR\s+CAB|MAXI\s+CAB|OMNI\s+BUS|GOODS\s+CARRIER|STATION\s+WAGON|THREE\s+WHEELER|TWO\s+WHEELER|RICKSHAW|CART|SCOOTER|[A-Z]+)\s*\/)/i);
    
//     if (fallbackMatch) {
//       result.make = fallbackMatch[1].replace(/\s+/g, " ").trim();
//       const fullValue = fallbackMatch[2].replace(/\s+/g, " ").trim();
//       const words = fullValue.split(" ");
//       result.model = words[0];
//       result.variant = words.slice(1).join(" ").trim() || "-";
//     }
//   }

//   // 4. Fuel Type
//   const bodyFuelMatch = text.match(
//     /([A-Z]+(?:\s+[A-Z]+)?)\s*\/\s*([A-Z]+)\s+\d+\s*\/\s*\d+\s*\/\s*\d{4}/i
//   );
//   if (bodyFuelMatch) {
//     result.fuelType = bodyFuelMatch[2].replace(/\s+/g, " ").trim();
//   }

//   // 5. Cubic Capacity / Watt / Year / Reg Date / Seating
//   const specMatch = text.match(
//     /(\d+)\s*\/\s*(\d+)\s*\/\s*(\d{4})[\s\n\r]+(\d{2}\/\d{2}\/\d{4})[\s\n\r]+(\d+\s*\+\s*\d+)/i
//   );
//   if (specMatch) {
//     result.cubicCapacity = specMatch[1]?.trim() || "-";
//     result.manufacturingYear = specMatch[3]?.trim() || "-";
//     result.seatingCapacity = specMatch[5]?.trim() || "-";
//   }

//   // 6. Seating capacity fallback
//   let seatMatch = text.match(
//     /\d+\s*\/\s*\d+\s*\/\s*\d{4}\s+\d{2}\/\d{2}\/\d{4}\s+(\d+\s*\+\s*\d+)/i
//   );
//   if (!seatMatch) seatMatch = text.match(/\b(\d+\s*\+\s*\d+)\b/);
//   if (seatMatch) result.seatingCapacity = seatMatch[1].replace(/\s+/g, " ").trim();

//   // 7. Defaults
//   result.financierName = "N/A";
//   result.gvw = "-";

//   return result;
// };

// // =======================================
// // UI COMPONENTS (Same as NewIndia – kept for consistency)
// // =======================================

// const CompactDetailRow = ({ label, value, highlight = false }) => (
//   <div className={`flex justify-between items-start py-1.5 border-b border-gray-100 last:border-0 ${highlight ? 'bg-blue-50 -mx-2 px-2 rounded-lg' : ''}`}>
//     <span className="text-xs font-medium text-gray-500">{label}</span>
//     <span className="text-xs text-gray-800 font-medium text-right break-words max-w-[60%]">{value || "-"}</span>
//   </div>
// );

// const SectionHeader = ({ icon, title, color }) => {
//   const colors = { blue: "bg-blue-500", green: "bg-green-500", red: "bg-red-500", purple: "bg-purple-500", orange: "bg-orange-500", teal: "bg-teal-500" };
//   return (
//     <div className={`${colors[color]} text-white px-3 py-1.5 rounded-lg flex items-center gap-2 mb-3`}>
//       <span className="text-sm">{icon}</span>
//       <h4 className="text-xs font-semibold tracking-wide">{title}</h4>
//     </div>
//   );
// };

// // =======================================
// // MAIN COMPONENT
// // =======================================

// function ShriramPolicyCard({ item }) {
//   const [copied, setCopied] = useState(false);

//   // Extract data using Shriram-specific functions
//   const policyDates = extractPolicyDates(item?.fullText || "");
//   const insuredDetails = extractInsuredDetails(item?.fullText || "");
//   const vehicleDetails = extractVehicleDetails(item?.fullText || "");
//   const premiumData = extractPremiumData(item?.fullText || "");
//   const insuranceCompany = extractInsuranceCompanyName();
//   const branchAddress = extractBranchAddress(item?.fullText || "");
//   const dateOfIssue = extractDateOfIssue(item?.fullText || "", policyDates.startDate);
//   const totalValue = extractIDV(item?.fullText || "");
//   const previousInsurer = extractPreviousInsurer(item?.fullText || "");
//   const previousPolicyNumber = extractPreviousPolicyNumber(item?.fullText || "");

//   // Merge with props (if any)
//   const insured = item?.insuredDetails || {};
//   const policy = item?.policyDetails || {};
//   const vehicle = item?.vehicleDetails || {};
//   const premium = item?.premiumDetails || {};

//   const insuredName = insured?.insuredName || insuredDetails?.insuredName || "-";
//   const insuredAddress = insured?.insuredAddress || insuredDetails?.insuredAddress || "-";
//   const panNumber = insured?.panNumber || insuredDetails?.panNumber || "-";
//   const contactNumber = insured?.contactNumber || insuredDetails?.contactNumber || "-";
//   const email = insured?.email || insuredDetails?.email || "-";
//   const gstin = insured?.gstin || insuredDetails?.gstin || "-";

//   const policyNumber = policy?.policyNumber || item?.fullText?.match(/Policy\s*No\.?\s*[:.]?\s*([\d/]+)/i)?.[1] || "-";

//   const finalPremium = {
//     calculatedOdPremium: premium?.calculatedOdPremium || premiumData?.calculatedOdPremium || "0",
//     calculatedTpPremium: premium?.calculatedTpPremium || premiumData?.calculatedTpPremium || "0",
//     totalOdPremium: premium?.totalOdPremium || premiumData?.totalOdPremium || "0",
//     totalTpPremium: premium?.totalTpPremium || premiumData?.totalTpPremium || "0",
//     netPremium: premium?.netPremium || premiumData?.netPremium || "0",
//     gst: premium?.gst || premiumData?.gst || "0",
//     totalPayable: premium?.totalPayable || premiumData?.totalPayable || "0",
//   };

//   // Merge extracted vehicle with props
//   const mergedVehicle = {
//     registrationNumber: vehicle?.registrationNumber || vehicleDetails?.registrationNumber || "-",
//     chassisNumber: vehicle?.chassisNumber || vehicleDetails?.chassisNumber || "-",
//     engineNumber: vehicle?.engineNumber || vehicleDetails?.engineNumber || "-",
//     make: vehicle?.make || vehicleDetails?.make || "-",
//     model: vehicle?.model || vehicleDetails?.model || "-",
//     variant: vehicle?.variant || vehicleDetails?.variant || "-",
//     gvw: vehicle?.gvw || vehicleDetails?.gvw || "-",
//     manufacturingYear: vehicle?.manufacturingYear || vehicleDetails?.manufacturingYear || "-",
//     fuelType: vehicle?.fuelType || vehicleDetails?.fuelType || "-",
//     cubicCapacity: vehicle?.cubicCapacity || vehicleDetails?.cubicCapacity || "-",
//     seatingCapacity: vehicle?.seatingCapacity || vehicleDetails?.seatingCapacity || "-",
//     financierName: vehicle?.financierName || vehicleDetails?.financierName || "-",
//   };

//   // Classification
//   const productType = getProductType ? getProductType(policy?.policyType, item?.fullText) : "TWO WHEELER";
//   const vehicleCategory = getVehicleCategory ? getVehicleCategory(policy?.policyType, item?.fullText) : "TWO_WHEELER";

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
//       vehicle={mergedVehicle}
//       extractedVehicle={mergedVehicle}
//     />
//   );
// }

// export default ShriramPolicyCard;






// src/components/ShriramPolicyCard.jsx

import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

// =======================================
// TEXT NORMALIZATION & UTILS
// =======================================

const normalizeText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ");
};

const sanitizeValue = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "" || String(value).trim() === "") {
    return fallback;
  }
  return String(value).trim();
};

// =======================================
// SHIRAM-SPECIFIC EXTRACTION FUNCTIONS
// =======================================

// ----- Policy Dates -----
const extractPolicyDates = (fullText = "") => {
  if (!fullText) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };

  const odFromMatch = fullText.match(/OD\s*Policy\s*From\s*([\d:]+)\s*Hrs?\s*of\s*(\d{2}\/\d{2}\/\d{4})/i);
  const odToMatch = fullText.match(/To\s+(?:[\d:]+\s+Hrs?\s+of\s+|Midnight\s+Of\s+)(\d{2}\/\d{2}\/\d{4})/i);
  const tpFromMatch = fullText.match(/TP\s*Policy\s*From\s*([\d:]+)\s*Hrs?\s*of\s*(\d{2}\/\d{2}\/\d{4})/i);
  const tpToMatch = fullText.match(/TP\s*Policy\s*From[\s\S]*?To\s+(?:[\d:]+\s+Hrs?\s+of\s+|Midnight\s+Of\s+)(\d{2}\/\d{2}\/\d{4})/i);

  let startDate = "-", odExpireDate = "-", tpExpireDate = "-";

  if (odFromMatch) startDate = odFromMatch[2] || "-";
  if (odToMatch) odExpireDate = odToMatch[1] || "-";

  if (tpToMatch) {
    tpExpireDate = tpToMatch[1] || odExpireDate;
  } else {
    const tpToAlt = fullText.match(/To\s*Date\s*&\s*Time\s*([\d/]+)/i);
    if (tpToAlt) tpExpireDate = tpToAlt[1] || odExpireDate;
    else tpExpireDate = odExpireDate;
  }

  if (startDate === "-" && tpFromMatch) startDate = tpFromMatch[2] || "-";

  if (startDate === "-" || odExpireDate === "-") {
    const periodMatch = fullText.match(
      /Period\s+of\s+Insurance\s+From\s+[\d:]+\s+(?:Hrs\s+of\s+|HRS\s+OF\s+|hrs\s+of\s+)?(\d{2}\/\d{2}\/\d{4})\s+To\s+(?:Midnight\s+of\s+|[\d:]+\s+Hrs?\s+of\s+)(\d{2}\/\d{2}\/\d{4})/i
    );
    if (periodMatch) {
      startDate = periodMatch[1] || startDate;
      odExpireDate = periodMatch[2] || odExpireDate;
      tpExpireDate = periodMatch[2] || tpExpireDate;
    }
  }

  return { startDate, odExpireDate, tpExpireDate };
};

// ----- Insurance Company -----
const extractInsuranceCompanyName = () => {
  return "Shriram General Insurance Co.Ltd.";
};

// ----- Branch Address -----
const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "-";
  const text = normalizeText(fullText);
  const branchMatch = text.match(/Branch\s*Address\s*([\s\S]*?)(?=Branch Office Phone No\.|Geographical Area|$)/i);
  if (branchMatch) {
    let addr = branchMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    addr = addr.replace(/Branch Office Phone No\..*$/i, "").trim();
    return addr || "-";
  }
  return "-";
};

// ----- Insured Details -----
const extractInsuredDetails = (fullText = "") => {
  if (!fullText) {
    return { insuredName: "", insuredAddress: "", panNumber: "", contactNumber: "", email: "", gstin: "" };
  }
  const text = normalizeText(fullText);
  const result = {};

  // Insured Name
  const insuredNameMatch = text.match(
    /Insured'?s?\s*Code\s*\/\s*Name\s*([\s\S]*?)(?=GSTIN\s*No\.?\s*Of\s*Insured|Insured\s*Address|CKYC\s*Details|Insured\s*State\s*Code)/i
  );
  if (insuredNameMatch) {
    let nameBlock = insuredNameMatch[1].replace(/\s+/g, " ").trim();
    nameBlock = nameBlock.replace(/^[A-Z]{1,5}-?\d+\s*\/\s*/i, "");
    result.insuredName = nameBlock.trim() || "";
  } else {
    result.insuredName = "";
  }

  // Insured Address
  const insuredAddrMatch = text.match(
    /Insured\s*Address\s*(?:and\s*Contact\s*Details)?([\s\S]*?)(?=Insured\s*Address\s*as\s*Per\s*RC|CKYC\s*Details|Insured\s*State\s*Code)/i
  );
  if (insuredAddrMatch) {
    let addr = insuredAddrMatch[1].replace(/\s+/g, " ").trim();
    addr = addr.replace(/Mob-.*$/i, "").replace(/Email-.*$/i, "").trim();
    result.insuredAddress = addr || "";
  } else {
    result.insuredAddress = "";
  }

  // PAN
  const panMatch = text.match(/PAN\s*No\.?\s*([A-Z]{5}\d{4}[A-Z]|N\.?A\.?|[A-Z0-9]+)/i);
  let panNumber = "";
  if (panMatch?.[1]) {
    panNumber = panMatch[1].trim();
  }
  if (!panNumber || panNumber === "-" || panNumber.toUpperCase() === "N.A" || panNumber.toUpperCase() === "N.A.") {
    const fallbackPan = text.match(/PAN\/FORM\s*60:\s*([A-Z]{5}\d{4}[A-Z]|N\.?A\.?|[A-Z0-9]+)/i);
    if (fallbackPan?.[1]) {
      let fPan = fallbackPan[1].trim();
      if (fPan.toUpperCase() !== "N.A" && fPan.toUpperCase() !== "N.A.") panNumber = fPan;
    }
  }
  result.panNumber = panNumber;

  // Contact & Email
  const contactMatch = text.match(/Mob[- ]?(\*+|\d+)/i);
  result.contactNumber = contactMatch?.[1]?.trim() || "";

  const emailMatch = text.match(/Email[- ]?([^\s,]+)/i);
  result.email = emailMatch?.[1]?.trim() || "";

  // GSTIN
  const gstinMatch = text.match(/GSTIN\s*No\.?\s*Of\s*Insured\s*([^\n\r]+)/i);
  let gstValue = gstinMatch?.[1]?.trim() || "";
  if (!gstValue || /Unregistered/i.test(gstValue) || /^N\.?A\.?$/i.test(gstValue)) {
    result.gstin = "";
  } else {
    result.gstin = gstValue;
  }

  return result;
};

// ----- Date of Issue -----
const extractDateOfIssue = (fullText = "", fallbackStartDate = "-") => {
  const match = fullText.match(/Date\s*of\s*Issue\s*[:.]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  return match?.[1] || fallbackStartDate;
};

// ----- IDV -----
const extractIDV = (fullText = "") => {
  if (!fullText) return "0";
  const text = normalizeText(fullText);
  const idvBlockMatch = text.match(
    /IDV\s*FOR\s*THE\s*VEHICLE[\s\S]*?TOTAL\s*VALUE\s*([\d.\s]+)/i
  );
  if (idvBlockMatch) {
    const nums = idvBlockMatch[1].match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    const nonZeroValues = nums.filter(n => n > 0);
    return nonZeroValues.length ? Math.max(...nonZeroValues).toString() : "0";
  }
  return "0";
};

// ----- Previous Insurer & Policy -----
const extractPreviousInsurer = (fullText = "") => {
  if (!fullText) return "-";
  const text = normalizeText(fullText);
  const prevInsMatch = text.match(
    /Previous\s*Insurer\s*([\s\S]*?)(?=Previous\s*Policy\s*No|Nominee\s*for\s*Owner\/Driver|Nominee\s*Age)/i
  );
  let prevInsurer = prevInsMatch?.[1]?.replace(/\s+/g, " ")?.trim() || "";
  prevInsurer = prevInsurer.replace(/Total\s+\d+.*$/i, "").trim();
  if (!prevInsurer || /^N\.?A\.?$/i.test(prevInsurer) || /^N\.?A\./i.test(prevInsurer)) {
    return "-";
  }
  return prevInsurer;
};

const extractPreviousPolicyNumber = (fullText = "") => {
  if (!fullText) return "-";
  const text = normalizeText(fullText);
  const prevPolMatch = text.match(
    /Previous\s*Policy\s*No\.?\s*([\s\S]*?)(?=Nominee\s*for\s*Owner\/Driver|Nominee\s*Age|Appointee)/i
  );
  let prevPolicy = prevPolMatch?.[1]?.replace(/\s+/g, " ")?.trim() || "";
  if (!prevPolicy || /^N\.?A\.?$/i.test(prevPolicy)) return "-";
  return prevPolicy;
};

// ----- Premium Data -----
const extractPremiumData = (fullText = "") => {
  const defaultResult = { calculatedOdPremium: "0", calculatedTpPremium: "0", totalOdPremium: "0", totalTpPremium: "0", netPremium: "0", gst: "0", totalPayable: "0" };
  if (!fullText) return defaultResult;
  const text = normalizeText(fullText);
  const result = {};

  const odTotalMatch = text.match(/OD\s*TOTAL\s*([\d.]+)/i);
  if (odTotalMatch) result.totalOdPremium = odTotalMatch[1];

  const tpTotalMatch = text.match(/TP\s*TOTAL\s*([\d.]+)/i);
  if (tpTotalMatch) result.totalTpPremium = tpTotalMatch[1];

  if (!tpTotalMatch) {
    const basicTP = text.match(/BASIC TP COVER\s*([\d.]+)/i);
    if (basicTP) {
      result.totalTpPremium = basicTP[1];
      const tpTotalFallback = text.match(/TP\s*TOTAL\s*([\d.]+)/i);
      if (tpTotalFallback) result.totalTpPremium = tpTotalFallback[1];
    }
  }

  const totalPremMatch = text.match(/TOTAL\s*PREMIUM\s*([\d.]+)/i);
  if (totalPremMatch) result.netPremium = totalPremMatch[1];
  else {
    const premSum = text.match(/Premium\(A\+B\)\s*([\d.]+)/i);
    if (premSum) result.netPremium = premSum[1];
  }

  const cgstMatch = text.match(/CGST\s*([\d.]+)/i);
  const sgstMatch = text.match(/SGST\/UTGST\s*([\d.]+)/i);
  if (cgstMatch || sgstMatch) {
    result.gst = (parseFloat(cgstMatch?.[1] || 0) + parseFloat(sgstMatch?.[1] || 0)).toFixed(2);
  } else {
    const igstMatch = text.match(/IGST\s*([\d.]+)/i);
    if (igstMatch) result.gst = igstMatch[1];
  }

  const totalPayMatch = text.match(/PREMIUM\s*AMOUNT\s*([\d.]+)/i) || text.match(/Total\s*([\d.]+)/i);
  if (totalPayMatch) result.totalPayable = totalPayMatch[1];

  result.calculatedOdPremium = result.totalOdPremium || "0";
  result.calculatedTpPremium = result.totalTpPremium || "0";

  return { ...defaultResult, ...result };
};

// ----- Vehicle Details -----
const extractVehicleDetails = (fullText = "") => {
  const result = {
    registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-", model: "-",
    variant: "-", gvw: "-", manufacturingYear: "-", fuelType: "-", cubicCapacity: "-", 
    seatingCapacity: "-", financierName: "-", ncb: "-"
  };
  
  if (!fullText) return result;
  
  const text = fullText.toUpperCase().replace(/\n/g, " ");

  const regMatch = text.match(
    /REGISTRATION\s*MARK\s*&\s*PLACE[\s\S]*?SEAT\s*CAP\.?\s*\(INCL\.?\s*DRIVER\)\s*([A-Z0-9\s&-]+?)\s+[A-Z0-9]{10,}\s*&\s*[A-Z0-9]{10,}/i
  );
  if (regMatch) {
    let reg = regMatch[1].replace(/\s+/g, " ").trim();
    if (reg.includes("&")) reg = reg.split("&")[0].trim();
    result.registrationNumber = reg.replace(/-/g, "") || "-"; 
  }

  const engChassisMatch = text.match(/([A-Z0-9]{10,})\s*&\s*([A-Z0-9]{10,})/i);
  if (engChassisMatch) {
    result.engineNumber = engChassisMatch[1].trim();
    result.chassisNumber = engChassisMatch[2].trim();
  }
  
  let postChassisText = text;
  if (result.chassisNumber !== "-") {
    const splitText = text.split(result.chassisNumber);
    if (splitText.length > 1) {
      postChassisText = splitText[1];
    }
  }

  const makeModelMatch = postChassisText.match(/^\s*([A-Z\s]+?)\s*-\s*(.*?)\s+(BS\s*[A-Z0-9]+)\s+(?=[A-Z\s]+\/)/i);
  
  if (makeModelMatch) {
    result.make = makeModelMatch[1].replace(/\s+/g, " ").trim();
    result.model = makeModelMatch[2].replace(/\s+/g, " ").trim();
    result.variant = makeModelMatch[3].replace(/\s+/g, " ").trim();
  } else {
    const fallbackMatch = postChassisText.match(/^\s*([A-Z\s]+?)\s*-\s*([A-Z0-9\s]+?)\s+(?=(?:E\s+)?(?:MOTOR\s+CYCLE|MOTOR\s+CAB|MAXI\s+CAB|OMNI\s+BUS|GOODS\s+CARRIER|STATION\s+WAGON|THREE\s+WHEELER|TWO\s+WHEELER|RICKSHAW|CART|SCOOTER|[A-Z]+)\s*\/)/i);
    
    if (fallbackMatch) {
      result.make = fallbackMatch[1].replace(/\s+/g, " ").trim();
      const fullValue = fallbackMatch[2].replace(/\s+/g, " ").trim();
      const words = fullValue.split(" ");
      result.model = words[0];
      result.variant = words.slice(1).join(" ").trim() || "-";
    }
  }

  const bodyFuelMatch = text.match(
    /([A-Z]+(?:\s+[A-Z]+)?)\s*\/\s*([A-Z]+)\s+\d+\s*\/\s*\d+\s*\/\s*\d{4}/i
  );
  if (bodyFuelMatch) {
    result.fuelType = bodyFuelMatch[2].replace(/\s+/g, " ").trim();
  }

  const specMatch = text.match(
    /(\d+)\s*\/\s*(\d+)\s*\/\s*(\d{4})[\s\n\r]+(\d{2}\/\d{2}\/\d{4})[\s\n\r]+(\d+\s*\+\s*\d+)/i
  );
  if (specMatch) {
    result.cubicCapacity = specMatch[1]?.trim() || "-";
    result.manufacturingYear = specMatch[3]?.trim() || "-";
    result.seatingCapacity = specMatch[5]?.trim() || "-";
  }

  let seatMatch = text.match(
    /\d+\s*\/\s*\d+\s*\/\s*\d{4}\s+\d{2}\/\d{2}\/\d{4}\s+(\d+\s*\+\s*\d+)/i
  );
  if (!seatMatch) seatMatch = text.match(/\b(\d+\s*\+\s*\d+)\b/);
  if (seatMatch) result.seatingCapacity = seatMatch[1].replace(/\s+/g, " ").trim();

  result.financierName = "N/A";
  result.gvw = "-";

  return result;
};

// =======================================
// MAIN COMPONENT
// =======================================

function ShriramPolicyCard({ item }) {
  // Extract data using Shriram-specific functions
  const policyDates = extractPolicyDates(item?.fullText || "");
  const insuredDetails = extractInsuredDetails(item?.fullText || "");
  const vehicleDetails = extractVehicleDetails(item?.fullText || "");
  const premiumData = extractPremiumData(item?.fullText || "");
  const insuranceCompany = extractInsuranceCompanyName();
  const branchAddress = extractBranchAddress(item?.fullText || "");
  const dateOfIssue = extractDateOfIssue(item?.fullText || "", policyDates.startDate);
  const totalValue = extractIDV(item?.fullText || "");
  const previousInsurer = extractPreviousInsurer(item?.fullText || "");
  const previousPolicyNumber = extractPreviousPolicyNumber(item?.fullText || "");

  // Merge with props (if any)
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};

  const insuredName = insured?.insuredName || insuredDetails?.insuredName || "";
  const insuredAddress = insured?.insuredAddress || insuredDetails?.insuredAddress || "";
  const panNumber = insured?.panNumber || insuredDetails?.panNumber || "";
  const contactNumber = insured?.contactNumber || insuredDetails?.contactNumber || "";
  const email = insured?.email || insuredDetails?.email || "";
  const gstin = insured?.gstin || insuredDetails?.gstin || "";

  const policyNumber = policy?.policyNumber || item?.fullText?.match(/Policy\s*No\.?\s*[:.]?\s*([\d/]+)/i)?.[1] || "-";

  const finalPremium = {
    calculatedOdPremium: premium?.calculatedOdPremium || premiumData?.calculatedOdPremium || "0",
    calculatedTpPremium: premium?.calculatedTpPremium || premiumData?.calculatedTpPremium || "0",
    totalOdPremium: premium?.totalOdPremium || premiumData?.totalOdPremium || "0",
    totalTpPremium: premium?.totalTpPremium || premiumData?.totalTpPremium || "0",
    netPremium: premium?.netPremium || premiumData?.netPremium || "0",
    gst: premium?.gst || premiumData?.gst || "0",
    totalPayable: premium?.totalPayable || premiumData?.totalPayable || "0",
  };

  const mergedVehicle = {
    registrationNumber: vehicle?.registrationNumber || vehicleDetails?.registrationNumber || "-",
    chassisNumber: vehicle?.chassisNumber || vehicleDetails?.chassisNumber || "-",
    engineNumber: vehicle?.engineNumber || vehicleDetails?.engineNumber || "-",
    make: vehicle?.make || vehicleDetails?.make || "-",
    model: vehicle?.model || vehicleDetails?.model || "-",
    variant: vehicle?.variant || vehicleDetails?.variant || "-",
    gvw: vehicle?.gvw || vehicleDetails?.gvw || "-",
    manufacturingYear: vehicle?.manufacturingYear || vehicleDetails?.manufacturingYear || "-",
    fuelType: vehicle?.fuelType || vehicleDetails?.fuelType || "-",
    cubicCapacity: vehicle?.cubicCapacity || vehicleDetails?.cubicCapacity || "-",
    seatingCapacity: vehicle?.seatingCapacity || vehicleDetails?.seatingCapacity || "-",
    financierName: vehicle?.financierName || vehicleDetails?.financierName || "-",
  };

  // Build sanitized objects for PolicyCardView
  const sanitizedPolicyDates = {
    startDate: sanitizeValue(policyDates?.startDate),
    odExpireDate: sanitizeValue(policyDates?.odExpireDate),
    tpExpireDate: sanitizeValue(policyDates?.tpExpireDate),
  };

  const sanitizedExtractedVehicle = {};
  Object.keys(mergedVehicle).forEach((key) => {
    sanitizedExtractedVehicle[key] = sanitizeValue(mergedVehicle[key]);
  });

  // Classification
  const productType = getProductType ? getProductType(policy?.policyType, item?.fullText) : "TWO WHEELER";
  const vehicleCategory = getVehicleCategory ? getVehicleCategory(policy?.policyType, item?.fullText) : "TWO_WHEELER";

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

export default ShriramPolicyCard;
