// // src/components/OrientalPolicyCard.jsx

// import PolicyCardView from "./PolicyCardView";
// import { getProductType, getVehicleCategory } from "./PolicyClassification";

// // =======================================
// // UTILITY FUNCTIONS
// // =======================================
// const normalizeText = (text) => {
//   if (!text) return "";
//   return text
//     .replace(/\r/g, "\n")
//     .replace(/\t/g, " ")
//     .replace(/[ ]{2,}/g, " ");
// };

// // =======================================
// // SEPARATED VEHICLE DETAILS EXTRACTORS
// // =======================================

// const extractRegistrationNumber = (normalizedText) => {
//   if (/BUNDLED\s+COVER\s+POLICY/i.test(normalizedText)) {
//     return "New";
//   }
//   const regMatch = normalizedText.match(/\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\b/i);
//   if (regMatch) {
//     return regMatch[0].replace(/\s+/g, "");
//   }
//   return "-";
// };

// const extractEngineChassisYear = (normalizedText) => {
//   let engineNumber = "-";
//   let chassisNumber = "-";
//   let manufacturingYear = "-";

//   const flatRowMatch = normalizedText.match(
//     /\b([A-Z0-9]{10,15})\s+([A-Z0-9]{15,20})\s+([A-Z]+)\s+([A-Z]+)\s+(.+?)\s+(20\d{2}|19\d{2})\s+(PETROL|DIESEL|CNG|EV|ELECTRIC|HYBRID)\b/i
//   );
  
//   if (flatRowMatch) {
//     engineNumber = flatRowMatch[1];
//     chassisNumber = flatRowMatch[2];
//     manufacturingYear = flatRowMatch[6];
//     return { engineNumber, chassisNumber, manufacturingYear };
//   }

//   const splitChassisMatch = normalizedText.match(/\b([A-Z0-9]{10,})\s*-\s*([A-Z0-9]{10,})\s+(\d{4})\s+(\d{4})\b/i);
//   if (splitChassisMatch) {
//     engineNumber = splitChassisMatch[1];
//     chassisNumber = splitChassisMatch[2] + splitChassisMatch[3];
//     manufacturingYear = splitChassisMatch[4];
//     return { engineNumber, chassisNumber, manufacturingYear };
//   }

//   const ecYearMatch = normalizedText.match(/\b([A-Z0-9]{10,})\s+(\d{4})\s+([A-Z0-9]{10,})(?:\s+([\d\~-]+))?\b/i);
//   if (ecYearMatch) {
//     engineNumber = ecYearMatch[1];
//     manufacturingYear = ecYearMatch[2];
//     let chassis = ecYearMatch[3];
//     if (ecYearMatch[4]) chassis += ecYearMatch[4].replace(/\D/g, '');
//     chassisNumber = chassis;
//     return { engineNumber, chassisNumber, manufacturingYear };
//   }

//   const ecMatch = normalizedText.match(/\b([A-Z0-9]{10,})\s*-\s*([A-Z0-9]{10,})\b/i);
//   if (ecMatch) {
//     engineNumber = ecMatch[1];
//     chassisNumber = ecMatch[2];
//   }

//   const yearMatch = normalizedText.match(/\b(19|20)\d{2}\b/);
//   if (yearMatch && manufacturingYear === "-") {
//     manufacturingYear = yearMatch[0];
//   }

//   return { engineNumber, chassisNumber, manufacturingYear };
// };

// const extractMakeModelVariant = (normalizedText) => {
//   let make = "-", model = "-", variant = "-";

//   // 1. Flat Row Extraction
//   const flatRowMatch = normalizedText.match(
//     /\b[A-Z0-9]{10,15}\s+[A-Z0-9]{15,20}\s+([A-Z]+)\s+([A-Z]+)\s+(.+?)\s+(20\d{2}|19\d{2})\s+(PETROL|DIESEL|CNG|EV|ELECTRIC|HYBRID)\b/i
//   );
  
//   if (flatRowMatch) {
//     make = flatRowMatch[1];
//     let modelVariantRaw = flatRowMatch[3].trim();
    
//     if (modelVariantRaw.toUpperCase().startsWith("SHINE 125")) {
//       model = "SHINE 125";
//       variant = modelVariantRaw.substring(9).trim();
//     } else {
//       let parts = modelVariantRaw.split(/\s+/);
//       if (parts.length > 2) {
//         model = parts.slice(0, 2).join(" ");
//         variant = parts.slice(2).join(" ");
//       } else {
//         model = modelVariantRaw;
//       }
//     }
//     return { make, model, variant };
//   }

//   // 2. Car format
//   const carMatch = normalizedText.match(/\b([A-Z]+)\s+MOTORS?-([A-Z]+)\s+(.+?)\s+INDIA\b/i);
//   if (carMatch) {
//     make = carMatch[2].trim();
//     const vehicleText = carMatch[3].replace(/\s+/g, " ").trim();
//     const tokens = vehicleText.split(" ");
//     if (tokens.length > 1) {
//       variant = tokens.pop();
//       model = tokens.join(" ").trim();
//     } else {
//       model = vehicleText;
//     }
//     return { make, model, variant };
//   }

//   // 3. Commercial Vehicle format
//   const cvMatch = normalizedText.match(/\b([A-Z]{2,20})\s+([A-Z0-9]{2,20})\s+(BSIII|BSIV|BSVI|BS6)\s+(\d{3,5})\b/i);
//   if (cvMatch) {
//     make = cvMatch[1].trim().toUpperCase();
//     model = cvMatch[2].trim().toUpperCase();
//     variant = cvMatch[3].trim().toUpperCase();
//     return { make, model, variant };
//   }

//   // 4. "Make - Model" Label format
//   const mmLabel = normalizedText.match(/Make\s*-\s*Model\s*[:：]?\s*([^\n]+)/i);
//   if (mmLabel) {
//     let modelStr = mmLabel[1].trim().replace(/\s*(Type\s+Of\s+Body|Cubic\s+Capacity|Seating\s+Capacity|Year\s+Of\s+Manf.).*/i, "").trim();
//     const parts = modelStr.split(/\s*-\s*/);
//     if (parts.length >= 2) {
//       make = parts[0].trim();
//       model = parts.slice(1).join(" ").trim();
//     } else {
//       model = modelStr;
//     }
//     return { make, model, variant };
//   }

//   // 5. Bike format
//   const bikeMatch = normalizedText.match(/\b([A-Za-z][A-Za-z\s]+?)\s*-\s*([A-Za-z\s]+?)(?=\s+\d|\s*$)/i);
//   if (bikeMatch) {
//     make = bikeMatch[1].trim();
//     const vehicleText = bikeMatch[2].replace(/\s+/g, " ").trim();
//     const tokens = vehicleText.split(" ");
//     if (tokens.length > 1) {
//       variant = tokens.pop();
//       model = tokens.join(" ").trim();
//     } else {
//       model = vehicleText;
//     }
//   }

//   return { make, model, variant };
// };

// const extractSpecs = (normalizedText) => {
//   let gvw = "-", cubicCapacity = "-", seatingCapacity = "-", fuelType = "-";

//   const gvwMatch = normalizedText.match(/\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\s+(\d{2,5})\s+(?:OPEN\s+BODY|BULKER|CLOSED\s+BODY|TROLLEY|TANKER|CONTAINER)/i);
//   if (gvwMatch) gvw = gvwMatch[1];

//   const seatMatch = normalizedText.match(/\b(\d+\s*\+\s*\d+)\b/);
//   if (seatMatch) seatingCapacity = seatMatch[1];

//   let ccMatch = normalizedText.match(/\b(?:BSIII|BSIV|BSVI|BS6)\s+(\d{3,5})\b/i);
//   if (!ccMatch) ccMatch = normalizedText.match(/\b(\d{2,5})\s*(?:CC|cc|Cubic\s+Capacity|Cubic)\b/i);
//   if (!ccMatch) ccMatch = normalizedText.match(/\b(?:PETROL|DIESEL|CNG|LPG|HYBRID)?\s*(?:BSIV|BSVI)?\s*(?:[A-Z\s-]*?)\s(\d{3,4})\s+[A-Z]{3,}/i);
//   if (!ccMatch) ccMatch = normalizedText.match(/\b(\d{2,5})\s+OTHERS\s+\d+\s*\+\s*\d+\b/i);
//   if (ccMatch) cubicCapacity = ccMatch[1];

//   const fuelMatch = normalizedText.match(/Type\s+Of\s+Fuel\s*:?\s*([A-Z]+)/i);
//   if (fuelMatch) {
//     fuelType = fuelMatch[1].trim();
//   } else {
//     const fuelFallback = normalizedText.match(/\b(PETROL|DIESEL|CNG|LPG|ELECTRIC|HYBRID)\b/i);
//     if (fuelFallback) fuelType = fuelFallback[1].toUpperCase();
//   }

//   return { gvw, cubicCapacity, seatingCapacity, fuelType };
// };

// const extractFinancierNameField = (normalizedText) => {
//   let finMatch = normalizedText.match(/\b([A-Z][A-Z\s&.,]{5,60}?)\s+Hire\s+Purchase\/Lessor\s+Agreement/i) ||
//                  normalizedText.match(/Hire\s+Purchase\/Lessor\s+Agreement\s+with\s*:?\s*([A-Z0-9.,&-\s]+?)(?=\s*-\s*(?:Subject|Details)|\n|$)/i) ||
//                  normalizedText.match(/Hypothecation\s+Agreement\s+with\s*:?\s*([A-Z0-9.,&-\s]+?)(?=\s*-\s*(?:Subject|Details)|\n|$)/i) ||
//                  normalizedText.match(/\b([A-Z\s&]+BANK\s+LTD\.?)\b/i) ||
//                  normalizedText.match(/\b(HINDUJA\s+LEYLAND\s+FINANCE.*?)(?=\s*-|\n|$)/i);

//   if (finMatch?.[1]) {
//     return finMatch[1].replace(/,\s*[A-Z\s]+$/i, '').trim();
//   }
//   return "-";
// };

// const extractNcbField = (normalizedText = "") => {
//   if (!normalizedText) return "0%";

//   const cleanText = String(normalizedText)
//     .replace(/\r/g, " ")
//     .replace(/\n/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();

//   const validSlabs = ["0", "20", "25", "35", "45", "50"];

//   const ncbPatterns = [
//     // NCB discount - 45 %
//     /NCB\s*(?:DISCOUNT)?\s*[:\-–]?\s*(\d{1,2}(?:\.\d+)?)\s*%/gi,

//     // NO CLAIM BONUS - 45 %
//     /NO\s+CLAIM\s+BONUS\s*(?:DISCOUNT)?\s*[:\-–]?\s*(\d{1,2}(?:\.\d+)?)\s*%/gi,

//     // Flexible fallback
//     /(?:NCB|NO\s+CLAIM\s+BONUS)[^\d%]{0,40}(\d{1,2}(?:\.\d+)?)\s*%/gi
//   ];

//   for (const pattern of ncbPatterns) {
//     const matches = [...cleanText.matchAll(pattern)];

//     for (const match of matches) {
//       if (!match?.[1]) continue;

//       const number = Number.parseFloat(match[1]);

//       if (!Number.isFinite(number)) continue;

//       const slab = String(number); // always string

//       if (validSlabs.includes(slab)) {
//         return `${slab}%`;
//       }
//     }
//   }

//   return "0%";
// };

// // =======================================
// // MASTER VEHICLE EXTRACTOR (REFACTORED)
// // =======================================
// const extractVehicleDetailsFromText = (text = "") => {
//   const result = {
//     registrationNumber: "-",
//     chassisNumber: "-",
//     engineNumber: "-",
//     make: "-",
//     model: "-",
//     variant: "-",
//     manufacturingYear: "-",
//     cubicCapacity: "-",
//     seatingCapacity: "-",
//     geographicalArea: "-",
//     financierName: "-",
//     fuelType: "-",
//     gvw: "-",
//     ncb: "0%"   // only one ncb key
//   };

//   if (!text) return result;

//   const normalizedText = normalizeText(text);

//   // =======================================================================
//   // ---- Registration ----
//   // =======================================================================
//   if (/BUNDLED\s+COVER\s+POLICY/i.test(normalizedText)) {
//     result.registrationNumber = "New";
//   } else {
//     const regMatch = normalizedText.match(/\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\b/i);
//     if (regMatch) {
//       result.registrationNumber = regMatch[0].replace(/\s+/g, "");
//     }
//   }

//   // ---- Engine, Chassis, Year ----
//   const splitChassisMatch = normalizedText.match(
//     /\b([A-Z0-9]{10,})\s*-\s*([A-Z0-9]{10,})\s+(\d{4})\s+(\d{4})\b/i
//   );
//   if (splitChassisMatch) {
//     result.engineNumber = splitChassisMatch[1];
//     result.chassisNumber = splitChassisMatch[2] + splitChassisMatch[3];
//     result.manufacturingYear = splitChassisMatch[4];
//   } else {
//     const ecYearMatch = normalizedText.match(
//       /\b([A-Z0-9]{10,})\s+(\d{4})\s+([A-Z0-9]{10,})(?:\s+([\d\~-]+))?\b/i
//     );
//     if (ecYearMatch) {
//       result.engineNumber = ecYearMatch[1];
//       result.manufacturingYear = ecYearMatch[2];
//       let chassis = ecYearMatch[3];
//       if (ecYearMatch[4]) {
//         const suffixDigits = ecYearMatch[4].replace(/\D/g, '');
//         chassis += suffixDigits;
//       }
//       result.chassisNumber = chassis;
//     } else {
//       const ecMatch = normalizedText.match(
//         /\b([A-Z0-9]{10,})\s*-\s*([A-Z0-9]{10,})\b/i
//       );
//       if (ecMatch) {
//         result.engineNumber = ecMatch[1];
//         result.chassisNumber = ecMatch[2];
//       }
//     }
//   }

//   // ---- GVW extraction ----
//   const gvwMatch = normalizedText.match(
//     /\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\s+(\d{2,5})\s+(?:OPEN\s+BODY|BULKER|CLOSED\s+BODY|TROLLEY|TANKER|CONTAINER)/i
//   );
//   if (gvwMatch) {
//     result.gvw = gvwMatch[1];
//   }

//   let make = "-", model = "-", variant = "-";

//   // =======================================================================
//   // Oriental Flat Row Extraction (Engine, Chassis, Make, Model, CC, etc.)
//   // =======================================================================
//   if (result.engineNumber === "-" || result.chassisNumber === "-") {
//     const flatRowMatch = normalizedText.match(
//       /\b([A-Z0-9]{10,15})\s+([A-Z0-9]{15,20})\s+([A-Z]+)\s+([A-Z]+)\s+(.+?)\s+(20\d{2}|19\d{2})\s+(PETROL|DIESEL|CNG|EV|ELECTRIC|HYBRID)\s+(\d+\s*\+\s*\d+)\s+(\d{2,5})\b/i
//     );
//     if (flatRowMatch) {
//       result.engineNumber = flatRowMatch[1];
//       result.chassisNumber = flatRowMatch[2];
//       make = flatRowMatch[3];
//       let modelVariantRaw = flatRowMatch[5].trim();
      
//       // Explicit split logic for Honda Shine 125 based on your request
//       if (modelVariantRaw.toUpperCase().startsWith("SHINE 125")) {
//         model = "SHINE 125";
//         variant = modelVariantRaw.substring(9).trim();
//       } else {
//         // Generic fallback for other flat-row models
//         let parts = modelVariantRaw.split(/\s+/);
//         if (parts.length > 2) {
//           model = parts.slice(0, 2).join(" ");
//           variant = parts.slice(2).join(" ");
//         } else {
//           model = modelVariantRaw;
//         }
//       }
//       result.manufacturingYear = flatRowMatch[6];
//       result.fuelType = flatRowMatch[7];
//       result.seatingCapacity = flatRowMatch[8];
//       result.cubicCapacity = flatRowMatch[9];
//     }
//   }

//   // =======================================================================
//   // Car format
//   // =======================================================================
//   const carMatch = normalizedText.match(
//     /\b([A-Z]+)\s+MOTORS?-([A-Z]+)\s+(.+?)\s+INDIA\b/i
//   );
//   if (carMatch) {
//     make = carMatch[2].trim();
//     const vehicleText = carMatch[3].replace(/\s+/g, " ").trim();
//     const tokens = vehicleText.split(" ");
//     if (tokens.length > 1) {
//       variant = tokens.pop();
//       model = tokens.join(" ").trim();
//     } else {
//       model = vehicleText;
//     }
//   }

//   if (make === "-") {
//     const cityList = [
//       "BHOPAL", "INDORE", "NAGPUR", "GWALIOR", "GWALIAR",
//       "JABALPUR", "MANDLA", "MUMBAI", "DELHI", "CHENNAI",
//       "KOLKATA", "PUNE"
//     ];
//     const cityRegex = new RegExp(`\\b(${cityList.join('|')})\\s+-\\s+([A-Z]+)\\s+([A-Z]+)\\s+(.*?)(?=\\s+\\d{3,5}\\b|$)`, 'i');
//     const locationDashMatch = normalizedText.match(cityRegex);
//     if (locationDashMatch) {
//       make = locationDashMatch[2].trim().toUpperCase();
//       model = locationDashMatch[3].trim().toUpperCase();
//       variant = locationDashMatch[4].trim();
//       // Remove trailing cubic‑capacity digits if any (e.g., " 2393")
//       variant = variant.replace(/\s+\d{3,5}$/, '').trim();
//     }
//   }

//   // -------- 3) Bike format (fallback) --------
//   if (make === "-") {
//     const bikeMatch = normalizedText.match(
//       /\b([A-Za-z][A-Za-z\s]+?)\s*-\s*([A-Za-z\s]+?)(?=\s+\d|\s*$)/i
//     );
//     if (bikeMatch) {
//       make = bikeMatch[1].trim();
//       const vehicleText = bikeMatch[2].replace(/\s+/g, " ").trim();
//       const tokens = vehicleText.split(" ");
//       if (tokens.length > 1) {
//         variant = tokens.pop();
//         model = tokens.join(" ").trim();
//       } else {
//         model = vehicleText;
//       }
//     }
//   }

//   // -------- 4) Commercial Vehicle (e.g., DOST RLS BSIV 1478) --------
//   if (make === "-") {
//     const cvMatch = normalizedText.match(
//       /\b([A-Z]{2,20})\s+([A-Z0-9]{2,20})\s+(BSIII|BSIV|BSVI|BS6)\s+(\d{3,5})\b/i
//     );
//     if (cvMatch) {
//       make = cvMatch[1].trim().toUpperCase();
//       model = cvMatch[2].trim().toUpperCase();
//       variant = cvMatch[3].trim().toUpperCase();
//     }
//   }

//   // -------- 5) Fallback from "Make - Model" label --------
//   if (make === "-") {
//     const mmLabel = normalizedText.match(
//       /Make\s*-\s*Model\s*[:：]?\s*([^\n]+)/i
//     );
//     if (mmLabel) {
//       let modelStr = mmLabel[1].trim();
//       modelStr = modelStr.replace(
//         /\s*(Type\s+Of\s+Body|Cubic\s+Capacity|Seating\s+Capacity|Year\s+Of\s+Manf.).*/i,
//         ""
//       ).trim();
//       const parts = modelStr.split(/\s*-\s*/);
//       if (parts.length >= 2) {
//         make = parts[0].trim();
//         model = parts.slice(1).join(" ").trim();
//       } else {
//         model = modelStr;
//       }
//     }
//   }

//   // -------- 6) Commercial Vehicle Make/Model fallback --------
//   if (
//     make === "-" ||
//     make === "PUBLIC" ||
//     make === "CC" ||
//     /PACKAGE POLICY/i.test(make)
//   ) {
//     const cvVehicleMatch = normalizedText.match(
//       /\b(?:BHOPAL|INDORE|NAGPUR|LUCKNOW|DELHI|MUMBAI|PUNE|JABALPUR)\s*-\s*([A-Z]+)\s+([A-Z0-9]+)\s+([A-Z0-9\s]+?)\s+(?:\d{3,5}|M\/S|[A-Z].*?GSTIN:)/i
//     );
//     if (cvVehicleMatch) {
//       make = cvVehicleMatch[1].trim().toUpperCase();
//       model = cvVehicleMatch[2].trim().toUpperCase();
//       variant = cvVehicleMatch[3].trim().toUpperCase();
//     }
//   }

//   result.make = make;
//   result.model = model;
//   result.variant = variant;

//   // ---- Year fallback ----
//   if (result.manufacturingYear === "-") {
//     const yearMatch = normalizedText.match(/\b(19|20)\d{2}\b/);
//     if (yearMatch) result.manufacturingYear = yearMatch[0];
//   }

//   // ---- Seating Capacity ----
//   const seatMatch = normalizedText.match(/\b(\d+\s*\+\s*\d+)\b/);
//   if (seatMatch && result.seatingCapacity === "-") result.seatingCapacity = seatMatch[1];

//   // ---- Cubic Capacity ----
//   let ccMatch = null;
//   // 1) Try to capture number after variant: city - MAKE MODEL VARIANT NUMBER
//   const variantNumberMatch = normalizedText.match(
//     /\b[A-Z]{2,}\s+-\s+[A-Z]+\s+[A-Z]+\s+[A-Z0-9\s.]*?\s+(\d{3,5})\b/i
//   );
//   if (variantNumberMatch && result.cubicCapacity === "-") {
//     const candidate = variantNumberMatch[1];
//     const year = parseInt(candidate, 10);
//     if (!(year >= 1900 && year <= 2099)) {
//       result.cubicCapacity = candidate;
//     }
//   }

//   // 2) If not found, look for BSIII/BSIV/BSVI/BS6 directly
//   if (result.cubicCapacity === "-") {
//     ccMatch = normalizedText.match(/\b(?:BSIII|BSIV|BSVI|BS6)\s+(\d{3,5})\b/i);
//     if (ccMatch) {
//       result.cubicCapacity = ccMatch[1];
//     }
//   }

//   // 3) If still not found, look for "CC", "Cubic Capacity" label
//   if (result.cubicCapacity === "-") {
//     ccMatch = normalizedText.match(
//       /\b(\d{2,5})\s*(?:CC|cc|Cubic\s+Capacity|Cubic)\b/i
//     );
//     if (ccMatch) {
//       result.cubicCapacity = ccMatch[1];
//     }
//   }

//   // 4) Smart fallback (PETROL/DIESEL ...)
//   if (result.cubicCapacity === "-") {
//     const ccSmartFallback = normalizedText.match(
//       /\b(?:PETROL|DIESEL|CNG|LPG|HYBRID)?\s*(?:BSIV|BSVI)?\s*(?:[A-Z\s-]*?)\s(\d{3,4})\s+[A-Z]{3,}/i
//     );
//     if (ccSmartFallback) {
//       result.cubicCapacity = ccSmartFallback[1];
//     } else {
//       const ccOthers = normalizedText.match(
//         /\b(\d{2,5})\s+OTHERS\s+\d+\s*\+\s*\d+\b/i
//       );
//       if (ccOthers) {
//         result.cubicCapacity = ccOthers[1];
//       } else {
//         const bikeCc = normalizedText.match(
//           /\b\d{4}\s+\d+\s*\+\s*\d+\s+(\d{2,4})\s+[A-Z]/i
//         );
//         if (bikeCc) {
//           result.cubicCapacity = bikeCc[1];
//         } else {
//           const tableCc = normalizedText.match(
//             /\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\s+(\d{2,5})\s+[A-Z]+\s+\d+\s*\+\s*\d+/i
//           );
//           if (tableCc) {
//             result.cubicCapacity = tableCc[1];
//           }
//         }
//       }
//     }
//   }

//   // ---- Fuel ----
//   if (result.fuelType === "-") {
//     const fuelMatch = normalizedText.match(/Type\s+Of\s+Fuel\s*:?\s*([A-Z]+)/i);
//     if (fuelMatch) {
//       result.fuelType = fuelMatch[1].trim();
//     } else {
//       const fuelFallback = normalizedText.match(/\b(PETROL|DIESEL|CNG|LPG|ELECTRIC|HYBRID)\b/i);
//       if (fuelFallback) result.fuelType = fuelFallback[1].toUpperCase();
//     }
//   }

//   // ---- Geographical Area ----
//   const geoMatch = normalizedText.match(/Geographical\s+Area\s*:?\s*([A-Z\s]+)/i);
//   if (geoMatch) result.geographicalArea = geoMatch[1].trim();

//   // ---- Financier ----
//   let financierName = "-";

//   // 1. Check if the financier name is written BEFORE the label
//   // (e.g., "HINDUJA LEYLAND FINANCE SATNA Hire Purchase/Lessor Agreement")
//   const preFinMatch = normalizedText.match(
//     /\b([A-Z][A-Z\s&.,]{5,60}?)\s+Hire\s+Purchase\/Lessor\s+Agreement/i
//   );
  
//   if (preFinMatch) {
//     financierName = preFinMatch[1].trim();
//   }

//   // 2. If not found before, fallback to standard checks AFTER the labels
//   if (financierName === "-") {
    
//     // Pattern 1: Hire Purchase/Lessor Agreement (name after label)
//     let finMatch = normalizedText.match(
//       /Hire\s+Purchase\/Lessor\s+Agreement\s+with\s*:?\s*([A-Z0-9.,&-\s]+?)(?=\s*-\s*(?:Subject|Details)|\n|$)/i
//     );
    
//     if (!finMatch) {
//       // Pattern 2: Hypothecation Agreement
//       finMatch = normalizedText.match(
//         /Hypothecation\s+Agreement\s+with\s*:?\s*([A-Z0-9.,&-\s]+?)(?=\s*-\s*(?:Subject|Details)|\n|$)/i
//       );
//     }
    
//     if (!finMatch) {
//       // Generic bank fallback (Fixed: Escaped the dot in LTD\.)
//       finMatch = normalizedText.match(
//         /\b([A-Z\s&]+BANK\s+LTD\.?)\b/i
//       );
//     }

//     // Hinduja Leyland Finance hardcoded fallback
//     if (!finMatch) {
//       finMatch = normalizedText.match(
//         /\b(HINDUJA\s+LEYLAND\s+FINANCE.*?)(?=\s*-|\n|$)/i
//       );
//     }

//     if (finMatch?.[1]) {
//       financierName = finMatch[1]
//         .replace(/,\s*[A-Z\s]+$/i, '') // remove trailing city name if preceded by a comma
//         .trim();
//     }
//   }

//   result.financierName = financierName;

//   // ---- NCB ----
//   const ncb = extractNcbField(normalizedText);
//   result.ncb = ncb;

//   // ============================================================
//   // POST-PROCESS: Split "SONET" model into model + variant
//   // Example: model = "SONET D 1.5 6 MT", variant = "HTX"
//   //          → model = "SONET", variant = "D 1.5 6 MT HTX"
//   // ============================================================
//   if (result.model && result.model.startsWith("SONET")) {
//     const parts = result.model.split(/\s+/);
//     if (parts.length > 1) {
//       const modelName = parts[0]; // "SONET"
//       const rest = parts.slice(1).join(" "); // "D 1.5 6 MT"
//       result.model = modelName;
//       // Combine rest with existing variant (if any)
//       if (result.variant && result.variant !== "-") {
//         result.variant = rest + " " + result.variant;
//       } else {
//         result.variant = rest;
//       }
//     }
//   }
  
//   return result;
// };

// // =======================================
// // OTHER EXTRACTION FUNCTIONS
// // =======================================

// const extractInsuranceCompany = (text) => text.includes("The Oriental Insurance Company Limited") ? "The Oriental Insurance Company Limited" : "-";

// const extractPolicyNumber = (text) => {
//   const match = text.match(/([A-Z0-9\/]{10,})\s+Policy\s+No/i) || text.match(/Policy\s+No\s*[:：]\s*([A-Z0-9\/\-]+)/i);
//   return match ? match[1] : "-";
// };

// const extractBranchAddress = (text) => {
//   if (!text) return "-";
//   const normalizedText = text.replace(/\s+/g, " ").trim();

//   let match = normalizedText.match(/(E-\d+\/\d+,\s*.*?ARERA\s+COLONY.*?MADHYA\s+PRADESH\s+\d{6})/i) ||
//               normalizedText.match(/([A-Z0-9\/,\-().\s]+(?:COLONY|ROAD|NAGAR|COMPLEX|MARKET|FLOOR|TOWER|BUILDING)[A-Z0-9\/,\-().\s]*?MADHYA\s+PRADESH\s+\d{6})/i) ||
//               normalizedText.match(/(\d{1,2},\s*A\.?D\.?\s*COMPLEX.*?(?:\d{6}|\d{3}\s*\d{3}))/i) ||
//               normalizedText.match(/([A-Z0-9\/,\-().\s]{20,}MADHYA\s+PRADESH\s+\d{6})(?=\s+MOTOR\s+INSURANCE)/i) ||
//               normalizedText.match(/([A-Z0-9\/,\-().\s]{20,}?MADHYA\s+PRADESH\s+\d{6})/i);

//   if (match?.[1]) return match[1].trim();

//   const blockMatch = text.match(/Prev\s+Policy\s+No\s*[:：]\s*[^\n]+\s+([\s\S]*?)\s*FROM\s+\d{2}:\d{2}/i);
//   if (blockMatch?.[1]) {
//     const lines = blockMatch[1].trim().split(/\n/).map((line) => line.trim()).filter(Boolean);
//     if (lines.length >= 2) return lines[1];
//   }
//   return "-";
// };

// const extractInsuredDetails = (text = "") => {
//   if (!text) return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };

//   const normalizedText = normalizeText(text);
//   let insuredName = "-";
//   let insuredAddress = "-";

//   const driverMatch = normalizedText.match(/\bperson\s+driving\s+holds\s+an?\s+([A-Z][A-Z\s]+?)\s*(?=\(GSTIN|$)/i);
//   if (driverMatch) insuredName = driverMatch[1].replace(/\s*\(.*$/, '').trim();

//   if (insuredName === "-") {
//     const companyMatch = normalizedText.match(/\b(?:M\/?S\.?|M\/s\.?)\s+([A-Z0-9\s&.,\-]+?)\s*\(GSTIN/i) ||
//                          normalizedText.match(/\b(?:MR|MRS|MS|M\/S\.?)\s+([A-Z\s]+?)\s*\(GSTIN/i) ||
//                          normalizedText.match(/\b([A-Z]{2,}(?:\s+[A-Z]{2,}){1,5})\s*\(GSTIN\s*:/i) ||
//                          normalizedText.match(/([A-Z][A-Z\s]{3,60})\s*\(GSTIN/i);
//     if (companyMatch) insuredName = companyMatch[1].replace(/^IND\s+/i, '').replace(/\s*\(.*$/, '').trim();
//   }

//   const dualAddressMatch = normalizedText.match(/Address\s*:\s*(.*?)\s*Address\s*:/i);
//   if (dualAddressMatch?.[1] && dualAddressMatch[1].length > 15 && !/Validated|Tel|Email/i.test(dualAddressMatch[1])) {
//     insuredAddress = dualAddressMatch[1].trim();
//   }

//   if (insuredAddress === "-") {
//     const addressMatch = normalizedText.match(/Prev\s+Policy\s+No\s*[\s:-]+([A-Z0-9\s,\.\/()]+?\d{6})\s+(?:15\s*,\s*A\.?\s*D\.?\s*COMPLEX|\d{1,2}\s*,|FROM)/i) ||
//                          normalizedText.match(/\(GSTIN:\s*[^)]+\)\s*([A-Z0-9\s,\.]+?)(?=\s*\d{1,2},\s*A\.?D\.?|MOTOR INSURANCE|FROM|$)/i) ||
//                          normalizedText.match(/\b(\d{1,3},\s*[A-Z0-9\s,.-]+?\s+\d{6})\b/i);
//     if (addressMatch) insuredAddress = addressMatch[1].replace(/^-\s*/, '').replace(/^\d+\s+\d+\s*/, '').trim();
//   }

//   const panMatch = normalizedText.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i) || normalizedText.match(/PAN\s+No\s*[:]?\s*([A-Z0-9]{10,})/i);
//   const panNumber = panMatch && !/Validated|Email|Mobile|Number/i.test(panMatch[1]) ? panMatch[1].toUpperCase() : "-";

//  // ---- Updated Contact & Email Extraction ----
// // let contactNumber = "-";
// // let email = "-";

// // let contactLine = normalizedText.match(
// //   /\/\s*\/\s*(\d{7,15})\s*\/\s*(NA|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i
// // );

// // if (contactLine) {
// //   contactNumber = contactLine[1].trim();

// //   if (/^NA$/i.test(contactLine[2])) {
// //     email = "NA";
// //   } else {
// //     email = contactLine[2].trim();
// //   }
// // } else {
// //   // =======================================
// //   // Mobile fallback
// //   // =======================================
// //   const contactMatch =
// //     normalizedText.match(
// //       /(?:Validated\s+Mobile\s+No\.?|Validated\s+Mobile\s+Number|Mobile\s*No\.?|Mobile|Phone|Tel)\s*[:\-]?\s*([\d*]{7,15})/i
// //     ) ||
// //     normalizedText.match(/\b([6-9]\d{9})\b/);

// //   if (contactMatch) {
// //     contactNumber = contactMatch[1];
// //   }

// //   // =======================================
// //   // Email fallback
// //   // =======================================
// //   const emailMatch = normalizedText.match(
// //     /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/i
// //   );

// //   if (emailMatch) {
// //     email = emailMatch[1];
// //   } else if (/\/\s*NA\b/i.test(normalizedText)) {
// //     email = "NA";
// //   }
// // }
  

// // ---- Updated Contact & Email Extraction (Handling Obfuscated Data) ----
//   let contactNumber = "-";
//   let email = "-";

//   // Regex specifically targeting the format: 
//   // Tel./Fax/Email : ******9883//a********************@gmail.com
//   const contactLineMatch = normalizedText.match(
//     /(?:Tel\.\/Fax\/Email\s*:\s*)\s*([\d*]{7,15})\/\/\s*([A-Za-z0-9._%+\-*]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i
//   );

//   if (contactLineMatch) {
//     contactNumber = contactLineMatch[1].trim();
//     email = contactLineMatch[2].trim();
//   } else {
//     // Fallback: Standard Phone Extraction (allowing *)
//     const contactMatch =
//       normalizedText.match(
//         /(?:Validated\s+Mobile\s+No\.?|Validated\s+Mobile\s+Number|Mobile\s*No\.?|Mobile|Phone|Tel)\s*[:\-]?\s*([\d*]{7,15})/i
//       ) ||
//       normalizedText.match(/\b([6-9]\d{9})\b/);

//     if (contactMatch) {
//       contactNumber = contactMatch[1];
//     }

//     // Fallback: Standard Email Extraction (allowing *)
//     const emailMatch = normalizedText.match(
//       /\b([A-Za-z0-9._%+\-*]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/i
//     );

//     if (emailMatch) {
//       email = emailMatch[1];
//     } else if (/\/\s*NA\b/i.test(normalizedText)) {
//       email = "NA";
//     }
//   }
  
//  // Replace your old gstin extraction line with this:
// const gstinRegex = /GSTIN\s*[:]?\s*([A-Z0-9]{15})/gi;
// const gstinMatches = [...normalizedText.matchAll(gstinRegex)];

// let gstin = "-";

// for (const match of gstinMatches) {
//   const value = match[1].toUpperCase();

//   // Ignore Oriental Insurance GSTIN and invalid GSTIN
//   if (
//     value !== "23AAACT0627R4Z4" &&
//     value !== "27AAACT0627R4ZW" &&
//     value !== "0"
//   ) {
//     gstin = value;
//     break;
//   }
// }
//   return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin };
// };

// const extractPolicyDates = (text = "") => {
//   if (!text) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };

//   const odPeriodMatch = text.match(/Policy\s+Period\s*\(OWN\s+DAMAGE\)\s*:\s*FROM\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}\s+TO\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}/i);
//   const liabilityPeriodMatch = text.match(/Policy\s+Period\s*\(LIABILITY\)\s*:\s*FROM\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+TO\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}/i);

//   if (odPeriodMatch) {
//     return {
//       startDate: odPeriodMatch[1],
//       odExpireDate: odPeriodMatch[2],
//       tpExpireDate: liabilityPeriodMatch ? liabilityPeriodMatch[1] : odPeriodMatch[2]
//     };
//   }

//   const match = text.match(/FROM\s+\d{2}:\d{2}\s+ON\s+(\d{2}\/\d{2}\/\d{4})\s+TO\s+MIDNIGHT\s+OF\s+(\d{2}\/\d{2}\/\d{4})/i) ||
//                 text.match(/Period\s+of\s+Insurance\s*[:：]?\s*FROM\s+(\d{2}\/\d{2}\/\d{4})\s+TO\s+MIDNIGHT\s+OF\s+(\d{2}\/\d{2}\/\d{4})/i) ||
//                 text.match(/(\d{2}\/\d{2}\/\d{4})\s+TO\s+(\d{2}\/\d{2}\/\d{4})/i);

//   return match ? { startDate: match[1], odExpireDate: match[2], tpExpireDate: match[2] } : { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
// };

// const extractDateOfIssue = (text = "") => {
//   if (!text) return "-";
//   const match = text.match(/Collection\s+No\.\s*&\s*Dt\.\s*:\s*[A-Z0-9]+\s+(\d{2}-\d{2}-\d{4})/i) ||
//                 text.match(/Date\s+of\s+Issue\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
//                 text.match(/[A-Z]+\s+(\d{2}\/\d{2}\/\d{4})\s+Place\s*:?\s*Date\s*:/i) ||
//                 text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/) ||
//                 text.match(/\b(\d{2}-\d{2}-\d{4})\b/);
//   return match ? match[1] : "-";
// };

// const extractIDV = (text = "") => {
//   if (!text) return "-";
//   const normalized = text.replace(/\s+/g, " ");

//   // 1. Try explicit IDV labels
//   let match = normalized.match(/Total\s+Value\s+IDV[^0-9]{0,50}([\d,]{3,})/i) || 
//               normalized.match(/IDV\s+of\s+the\s+Vehicle[^0-9]{0,50}([\d,]{3,})/i);
  
//   let idv = match?.[1] ? match[1].replace(/,/g, "") : null;

//   // 2. If not found, fallback to the largest number with commas
//   if (!idv) {
//     const candidates = normalized.match(/\b\d{1,3}(?:,\d{2,3}){1,3}\b/g);
//     if (candidates?.length) {
//       const sorted = candidates.map(n => parseInt(n.replace(/,/g, ""), 10)).sort((a, b) => b - a);
//       idv = String(sorted[0]);
//     }
//   }

//   // 3. If we got a value, clean and validate
//   if (idv) {
//     // Remove any trailing non‑digit characters and trim
//     idv = idv.trim();

//     // 🆕 If the extracted value is the branch code "181100", return "0"
//     if (idv === "181100") {
//       return "0";
//     }

//     // You can also add other branch codes here if needed
//     // if (idv === "anotherCode") return "0";

//     return idv;
//   }

//   return "-";
// };

// // const extractPreviousPolicyNumber = (text = "") => {
// //   if (!text) return "-";

// //   const normalized = String(text)
// //     .replace(/\r/g, " ")
// //     .replace(/\n/g, " ")
// //     .replace(/\t/g, " ")
// //     .replace(/\u00a0/g, " ")
// //     .replace(/\s+/g, " ")
// //     .trim();

// //   let match = null;

// //   // ============================================================
// //   // 1. ORIENTAL OCR FORMAT
// //   // Example: Policy No : 152801/31/2027/1112 Prev Policy No : 1907003125P103774483
// //   // ============================================================
// //   match = normalized.match(
// //     new RegExp(
// //       "Policy\\s*No\\.?\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9/-]{7,49}?)\\s+Prev(?:ious)?\\s*Policy\\s*No\\.?",
// //       "i"
// //     )
// //   );

// //   if (match?.[1]) {
// //     const value = match[1].trim();

// //     if (value && value !== "-") {
// //       return value;
// //     }
// //   }

// //   // ============================================================
// //   // 2. EXPLICIT PREVIOUS POLICY NUMBER
// //   // ============================================================
// //   match = normalized.match(
// //     new RegExp(
// //       "Prev(?:ious)?\\s*Policy\\s*No\\.?\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9/-]{7,49})",
// //       "i"
// //     )
// //   );

// //   if (match?.[1]) {
// //     const value = match[1].trim();

// //     if (
// //       value &&
// //       value !== "-" &&
// //       value.toUpperCase() !== "NA" &&
// //       value.toUpperCase() !== "N/A"
// //     ) {
// //       return value;
// //     }
// //   }

// //   // ============================================================
// //   // 3. ORIENTAL SLASH POLICY NUMBERS
// //   // Current: 181100/31/2027/1347, Previous: 181100/31/2026/936
// //   // ============================================================
// //   const slashPolicyRegex = new RegExp(
// //     "\\b\\d{6}/\\d{2}/\\d{4}/\\d+\\b",
// //     "g"
// //   );

// //   const allPolicies = normalized.match(slashPolicyRegex);

// //   if (allPolicies?.length >= 2) {
// //     return allPolicies[1];
// //   }

// //   // ============================================================
// //   // 4. VALUE IMMEDIATELY BEFORE PREV POLICY NO
// //   // ============================================================
// //   match = normalized.match(
// //     new RegExp(
// //       "\\b([A-Z0-9][A-Z0-9/-]{7,49})\\s+Prev(?:ious)?\\s*Policy\\s*No\\.?",
// //       "i"
// //     )
// //   );

// //   if (match?.[1]) {
// //     const value = match[1].trim();

// //     if (value && value !== "-") {
// //       return value;
// //     }
// //   }

// //   // ============================================================
// //   // 5. GENERIC POLICY NUMBER FALLBACK
// //   // ============================================================
// //   match = normalized.match(
// //     new RegExp(
// //       "Policy\\s*No\\.?\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9/-]{7,49})",
// //       "i"
// //     )
// //   );

// //   if (match?.[1]) {
// //     const value = match[1].trim();

// //     if (value && value !== "-") {
// //       return value;
// //     }
// //   }

// //   return "-";
// // };


// const extractPreviousPolicyNumber = (text = "", productType = "") => {
//   if (!text) return "-";

//   // 1. Check if productType is "Bundled Policy" (or contains "Bundled Policy")
//   if (
//     productType &&
//     String(productType).trim().toLowerCase().includes("bundled policy")
//   ) {
//     return "-";
//   }

//   const normalized = String(text)
//     .replace(/\r/g, " ")
//     .replace(/\n/g, " ")
//     .replace(/\t/g, " ")
//     .replace(/\u00a0/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();

//   // Safeguard: Check directly in the text if "BUNDLED" is present
//   if (/\bBUNDLED\b/i.test(normalized)) {
//     return "-";
//   }

//   let match = null;

//   // ============================================================
//   // 1. ORIENTAL OCR FORMAT
//   // Example: Policy No : 152801/31/2027/1112 Prev Policy No : 1907003125P103774483
//   // ============================================================
//   match = normalized.match(
//     new RegExp(
//       "Policy\\s*No\\.?\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9/-]{7,49}?)\\s+Prev(?:ious)?\\s*Policy\\s*No\\.?",
//       "i"
//     )
//   );

//   if (match?.[1]) {
//     const value = match[1].trim();

//     if (value && value !== "-") {
//       return value;
//     }
//   }

//   // ============================================================
//   // 2. EXPLICIT PREVIOUS POLICY NUMBER
//   // ============================================================
//   match = normalized.match(
//     new RegExp(
//       "Prev(?:ious)?\\s*Policy\\s*No\\.?\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9/-]{7,49})",
//       "i"
//     )
//   );

//   if (match?.[1]) {
//     const value = match[1].trim();

//     if (
//       value &&
//       value !== "-" &&
//       value.toUpperCase() !== "NA" &&
//       value.toUpperCase() !== "N/A"
//     ) {
//       return value;
//     }
//   }

//   // ============================================================
//   // 3. ORIENTAL SLASH POLICY NUMBERS
//   // Current: 181100/31/2027/1347, Previous: 181100/31/2026/936
//   // ============================================================
//   const slashPolicyRegex = new RegExp(
//     "\\b\\d{6}/\\d{2}/\\d{4}/\\d+\\b",
//     "g"
//   );

//   const allPolicies = normalized.match(slashPolicyRegex);

//   if (allPolicies?.length >= 2) {
//     return allPolicies[1];
//   }

//   // ============================================================
//   // 4. VALUE IMMEDIATELY BEFORE PREV POLICY NO
//   // ============================================================
//   match = normalized.match(
//     new RegExp(
//       "\\b([A-Z0-9][A-Z0-9/-]{7,49})\\s+Prev(?:ious)?\\s*Policy\\s*No\\.?",
//       "i"
//     )
//   );

//   if (match?.[1]) {
//     const value = match[1].trim();

//     if (value && value !== "-") {
//       return value;
//     }
//   }

//   // ============================================================
//   // 5. GENERIC POLICY NUMBER FALLBACK
//   // ============================================================
//   match = normalized.match(
//     new RegExp(
//       "Policy\\s*No\\.?\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9/-]{7,49})",
//       "i"
//     )
//   );

//   if (match?.[1]) {
//     const value = match[1].trim();

//     if (value && value !== "-") {
//       return value;
//     }
//   }

//   return "-";
// };

// const extractPreviousInsurer = (text = "") => {
//   const match = text.match(/Previous Insurer\s*[:]?\s*([^\n]+?)(?:\s*Previous Policy Number|$)/i);
//   return match?.[1] ? match[1].replace(/Previous Policy Number.*$/i, "").replace(/\s+/g, " ").trim() : "-";
// };

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

//   if (!text) return result;

//   const normalizedText = String(text)
//     .replace(/\r/g, "\n")
//     .replace(/\t/g, " ")
//     .replace(/\u00a0/g, " ")
//     .replace(/[ ]{2,}/g, " ");

//   // ============================================
//   // HELPER: CLEAN AMOUNT
//   // ============================================
//   const cleanAmount = (value) => {
//     const cleaned = String(value || "0")
//       .replace(/[₹,\s]/g, "")
//       .trim();

//     const number = Number.parseFloat(cleaned);

//     if (!Number.isFinite(number)) {
//       return "0";
//     }

//     return number.toFixed(2);
//   };

//   // ============================================
//   // HELPER: ADD MULTIPLE AMOUNTS
//   // ============================================
//   const addAmounts = (...values) => {
//     const total = values.reduce((sum, value) => {
//       const cleaned = String(value || "0")
//         .replace(/[₹,\s]/g, "")
//         .trim();

//       const amount = Number.parseFloat(cleaned);

//       return sum + (Number.isFinite(amount) ? amount : 0);
//     }, 0);

//     return total.toFixed(2);
//   };

//   // ============================================
//   // HELPER: GET AMOUNTS
//   // ============================================
//   const getAmounts = (value = "") => {
//     return (
//       String(value).match(
//         /\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?/g
//       ) || []
//     );
//   };

//   // ============================================================
//   // 1. OWN DAMAGE PREMIUM
//   // ============================================================
//   const odBlockMatch = normalizedText.match(
//     /MOTOR\s+TOTAL\s+OD\s+([\d,.\s]+?)(?=\s*(?:\*|IDV\b|SCHEDULE\b|Attached\b|$))/i
//   );

//   if (odBlockMatch?.[1]) {
//     const odAmounts = getAmounts(odBlockMatch[1]);

//     if (odAmounts.length) {
//       const odPremium = cleanAmount(
//         odAmounts[odAmounts.length - 1]
//       );

//       result.calculatedOdPremium = odPremium;
//       result.totalOdPremium = odPremium;
//     }
//   }

//   // ============================================================
//   // 2. ORIENTAL CGST + SGST FORMAT
//   // ============================================================
//   const orientalCgstSgstMatch = normalizedText.match(
//     /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*CGST[_\s-]*OD\s+ADD\s*:?\s*CGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*OD\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
//   );

//   if (orientalCgstSgstMatch) {
//     const basicTpCover = cleanAmount(
//       orientalCgstSgstMatch[1]
//     );

//     const tpTotal = cleanAmount(
//       orientalCgstSgstMatch[5]
//     );

//     const totalPremium = cleanAmount(
//       orientalCgstSgstMatch[6]
//     );

//     const cgstOd = orientalCgstSgstMatch[8];
//     const cgstTp = orientalCgstSgstMatch[9];
//     const sgstTp = orientalCgstSgstMatch[10];
//     const sgstOd = orientalCgstSgstMatch[11];

//     const totalAmount = cleanAmount(
//       orientalCgstSgstMatch[12]
//     );

//     result.calculatedTpPremium = basicTpCover;
//     result.totalTpPremium = tpTotal;
//     result.netPremium = totalPremium;

//     result.gst = addAmounts(
//       cgstOd,
//       cgstTp,
//       sgstTp,
//       sgstOd
//     );

//     result.totalPayable = totalAmount;

//     return result;
//   }

//   // ============================================================
//   // 3. FLEXIBLE CGST + SGST FORMAT
//   // ============================================================
//   const flexibleCgstSgstMatch = normalizedText.match(
//     /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*CGST[_\s-]*OD\s+ADD\s*:?\s*CGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*OD\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){7,15}[\d,.]+)/i
//   );

//   if (flexibleCgstSgstMatch?.[1]) {
//     const values = getAmounts(
//       flexibleCgstSgstMatch[1]
//     );

//     if (values.length >= 8) {
//       const lastValues = values.slice(-8);

//       const tpTotal = lastValues[0];
//       const totalPremium = lastValues[1];
//       const cgstOd = lastValues[3];
//       const cgstTp = lastValues[4];
//       const sgstTp = lastValues[5];
//       const sgstOd = lastValues[6];
//       const totalAmount = lastValues[7];

//       result.calculatedTpPremium = cleanAmount(
//         values[0]
//       );

//       result.totalTpPremium = cleanAmount(
//         tpTotal
//       );

//       result.netPremium = cleanAmount(
//         totalPremium
//       );

//       result.gst = addAmounts(
//         cgstOd,
//         cgstTp,
//         sgstTp,
//         sgstOd
//       );

//       result.totalPayable = cleanAmount(
//         totalAmount
//       );

//       return result;
//     }
//   }

//   // ============================================================
//   // 4. ORIENTAL IGST_OD + IGST_TP FORMAT
//   // ============================================================
//   const orientalIgstSplitMatch = normalizedText.match(
//     /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*IGST[_\s-]*OD\s+ADD\s*:?\s*IGST[_\s-]*TP\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
//   );

//   if (orientalIgstSplitMatch) {
//     const basicTpCover = cleanAmount(
//       orientalIgstSplitMatch[1]
//     );

//     const tpTotal = cleanAmount(
//       orientalIgstSplitMatch[5]
//     );

//     const totalPremium = cleanAmount(
//       orientalIgstSplitMatch[6]
//     );

//     const igstOd = orientalIgstSplitMatch[8];
//     const igstTp = orientalIgstSplitMatch[9];

//     const totalAmount = cleanAmount(
//       orientalIgstSplitMatch[10]
//     );

//     result.calculatedTpPremium = basicTpCover;
//     result.totalTpPremium = tpTotal;
//     result.netPremium = totalPremium;

//     result.gst = addAmounts(
//       igstOd,
//       igstTp
//     );

//     result.totalPayable = totalAmount;

//     return result;
//   }

//   // ============================================================
//   // 5. FLEXIBLE IGST_OD + IGST_TP FORMAT
//   // ============================================================
//   const flexibleSplitIgstMatch = normalizedText.match(
//     /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*IGST[_\s-]*OD\s+ADD\s*:?\s*IGST[_\s-]*TP\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){6,14}[\d,.]+)/i
//   );

//   if (flexibleSplitIgstMatch?.[1]) {
//     const values = getAmounts(
//       flexibleSplitIgstMatch[1]
//     );

//     if (values.length >= 6) {
//       const lastValues = values.slice(-6);

//       result.calculatedTpPremium = cleanAmount(
//         values[0]
//       );

//       result.totalTpPremium = cleanAmount(
//         lastValues[0]
//       );

//       result.netPremium = cleanAmount(
//         lastValues[1]
//       );

//       result.gst = addAmounts(
//         lastValues[3],
//         lastValues[4]
//       );

//       result.totalPayable = cleanAmount(
//         lastValues[5]
//       );

//       return result;
//     }
//   }

//   // ============================================================
//   // 6. ORIENTAL SINGLE IGST FORMAT
//   // ============================================================
//   const orientalSingleIgstMatch = normalizedText.match(
//     /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+(?:ADD\s*:?\s*IGST\s+STAMP\s+DUTY|STAMP\s+DUTY\s+ADD\s*:?\s*IGST)\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){6,20}[\d,.]+)/i
//   );

//   if (orientalSingleIgstMatch?.[1]) {
//     const values = getAmounts(
//       orientalSingleIgstMatch[1]
//     );

//     if (values.length >= 7) {
//       const lastFiveValues = values.slice(-5);

//       const tpTotal = lastFiveValues[0];
//       const totalPremium = lastFiveValues[1];
//       const thirdValue = lastFiveValues[2];
//       const fourthValue = lastFiveValues[3];
//       const totalAmount = lastFiveValues[4];

//       const thirdAmount = Number.parseFloat(
//         String(thirdValue).replace(/,/g, "")
//       );

//       const fourthAmount = Number.parseFloat(
//         String(fourthValue).replace(/,/g, "")
//       );

//       let igst = fourthValue;

//       if (
//         Number.isFinite(thirdAmount) &&
//         Number.isFinite(fourthAmount)
//       ) {
//         igst =
//           thirdAmount > fourthAmount
//             ? thirdValue
//             : fourthValue;
//       }

//       result.calculatedTpPremium = cleanAmount(
//         values[0]
//       );

//       result.totalTpPremium = cleanAmount(
//         tpTotal
//       );

//       result.netPremium = cleanAmount(
//         totalPremium
//       );

//       result.gst = cleanAmount(
//         igst
//       );

//       result.totalPayable = cleanAmount(
//         totalAmount
//       );

//       return result;
//     }
//   }
//   // ============================================================
//   // 7. PAGE 1 POLICY SUMMARY FALLBACK
//   // ============================================================
//   const policySummaryMatch = normalizedText.match(
//     /\b([\d,]+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)\s+(\.?\d+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)\s+(?:GCCV|PRIVATE\s+CAR|TWO\s+WHEELER|MOTOR)/i
//   );

//   if (policySummaryMatch) {
//     if (result.netPremium === "0") {
//       result.netPremium = cleanAmount(
//         policySummaryMatch[1]
//       );
//     }

//     if (result.gst === "0") {
//       result.gst = cleanAmount(
//         policySummaryMatch[2]
//       );
//     }

//     if (result.totalPayable === "0") {
//       result.totalPayable = cleanAmount(
//         policySummaryMatch[4]
//       );
//     }
//   }

//   // ============================================================
//   // 8. TP VALUES FALLBACK
//   // ============================================================
//   const tpSectionMatch = normalizedText.match(
//     /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL([\s\S]{0,700}?)TOTAL\s+AMOUNT/i
//   );

//   if (tpSectionMatch?.[1]) {
//     const tpValues = getAmounts(
//       tpSectionMatch[1]
//     );

//     if (tpValues.length) {
//       if (result.calculatedTpPremium === "0") {
//         result.calculatedTpPremium = cleanAmount(
//           tpValues[0]
//         );
//       }

//       if (result.totalTpPremium === "0") {
//         const tpLabelBlock = normalizedText.match(
//           /TP\s+TOTAL\s+TOTAL\s+PREMIUM[\s\S]{0,500}?((?:[\d,.]+\s+){2,15}[\d,.]+)/i
//         );

//         if (tpLabelBlock?.[1]) {
//           const values = getAmounts(
//             tpLabelBlock[1]
//           );

//           if (values.length >= 2) {
//             result.totalTpPremium = cleanAmount(
//               tpValues[Math.max(0, tpValues.length - 7)]
//             );
//           }
//         }
//       }
//     }
//   }

//   // ============================================================
//   // 9. NET PREMIUM FALLBACK
//   // ============================================================
//   if (result.netPremium === "0") {
//     const totalPremiumValueMatch = normalizedText.match(
//       /TOTAL\s+PREMIUM(?:\s+STAMP\s+DUTY|\s+ADD\s*:?\s*(?:I|C|S)GST[\s\S]{0,150}?TOTAL\s+AMOUNT)\s+((?:[\d,.]+\s+){2,15}[\d,.]+)/i
//     );

//     if (totalPremiumValueMatch?.[1]) {
//       const values = getAmounts(
//         totalPremiumValueMatch[1]
//       );

//       if (values.length) {
//         const possibleNetPremium = values.find((value) => {
//           const amount = Number.parseFloat(
//             String(value).replace(/,/g, "")
//           );

//           return Number.isFinite(amount) && amount >= 1;
//         });

//         if (possibleNetPremium) {
//           result.netPremium = cleanAmount(
//             possibleNetPremium
//           );
//         }
//       }
//     }
//   }

//   // ============================================================
//   // 10. GST FALLBACK
//   // ============================================================
//   if (result.gst === "0") {
//     const igstOdMatch = normalizedText.match(
//       /IGST[_\s-]*OD[^0-9]*([\d,.]+)/i
//     );

//     const igstTpMatch = normalizedText.match(
//       /IGST[_\s-]*TP[^0-9]*([\d,.]+)/i
//     );

//     const cgstOdMatch = normalizedText.match(
//       /CGST[_\s-]*OD[^0-9]*([\d,.]+)/i
//     );

//     const cgstTpMatch = normalizedText.match(
//       /CGST[_\s-]*TP[^0-9]*([\d,.]+)/i
//     );

//     const sgstOdMatch = normalizedText.match(
//       /SGST[_\s-]*OD[^0-9]*([\d,.]+)/i
//     );

//     const sgstTpMatch = normalizedText.match(
//       /SGST[_\s-]*TP[^0-9]*([\d,.]+)/i
//     );

//     if (
//       cgstOdMatch?.[1] ||
//       cgstTpMatch?.[1] ||
//       sgstOdMatch?.[1] ||
//       sgstTpMatch?.[1]
//     ) {
//       result.gst = addAmounts(
//         cgstOdMatch?.[1] || "0",
//         cgstTpMatch?.[1] || "0",
//         sgstOdMatch?.[1] || "0",
//         sgstTpMatch?.[1] || "0"
//       );
//     } else if (
//       igstOdMatch?.[1] ||
//       igstTpMatch?.[1]
//     ) {
//       result.gst = addAmounts(
//         igstOdMatch?.[1] || "0",
//         igstTpMatch?.[1] || "0"
//       );
//     } else {
//       const singleIgstMatch = normalizedText.match(
//         /\bIGST\b[^0-9]*([\d,.]+)/i
//       );

//       const singleCgstMatch = normalizedText.match(
//         /\bCGST\b[^0-9]*([\d,.]+)/i
//       );

//       const singleSgstMatch = normalizedText.match(
//         /\bSGST\b[^0-9]*([\d,.]+)/i
//       );

//       if (
//         singleCgstMatch?.[1] ||
//         singleSgstMatch?.[1]
//       ) {
//         result.gst = addAmounts(
//           singleCgstMatch?.[1] || "0",
//           singleSgstMatch?.[1] || "0"
//         );
//       } else if (singleIgstMatch?.[1]) {
//         result.gst = cleanAmount(
//           singleIgstMatch[1]
//         );
//       }
//     }
//   }

//   // ============================================================
//   // 11. TOTAL PAYABLE FALLBACK
//   // ============================================================
//   if (result.totalPayable === "0") {
//     const totalAmountBlock = normalizedText.match(
//       /TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){1,15}[\d,.]+)/i
//     );

//     if (totalAmountBlock?.[1]) {
//       const amounts = getAmounts(
//         totalAmountBlock[1]
//       );

//       if (amounts.length) {
//         result.totalPayable = cleanAmount(
//           amounts[amounts.length - 1]
//         );
//       }
//     }
//   }

//   // ============================================================
//   // 12. FINAL CALCULATION FALLBACK
//   // ============================================================
//   if (
//     result.netPremium === "0" &&
//     result.totalPayable !== "0" &&
//     result.gst !== "0"
//   ) {
//     const totalPayable = Number.parseFloat(
//       result.totalPayable
//     );

//     const gst = Number.parseFloat(
//       result.gst
//     );

//     if (
//       Number.isFinite(totalPayable) &&
//       Number.isFinite(gst) &&
//       totalPayable >= gst
//     ) {
//       result.netPremium = (
//         totalPayable - gst
//       ).toFixed(2);
//     }
//   }

//   return result;
// };

// function OrientalPolicyCard({ item }) {
//   const fullText = item?.fullText || "";
  
//   const insuredDetails = extractInsuredDetails(fullText);
//   const policyDates = extractPolicyDates(fullText);
//   const vehicleDetails = extractVehicleDetailsFromText(fullText);
//   const premiumDetails = extractPremiumData(fullText);

//   // Fallbacks to prop items if present
//   const insuredName = item?.insuredDetails?.insuredName || insuredDetails.insuredName;
//   const insuredAddress = item?.insuredDetails?.insuredAddress || insuredDetails.insuredAddress;
//   const panNumber = item?.insuredDetails?.panNumber || insuredDetails.panNumber;
//   const contactNumber = item?.insuredDetails?.contactNumber || insuredDetails.contactNumber;
//   const email = item?.insuredDetails?.email || insuredDetails.email;
//   const gstin = insuredDetails.gstin;

//   const policyNumber = extractPolicyNumber(fullText) !== "-" ? extractPolicyNumber(fullText) : (item?.policyDetails?.policyNumber || "-");
  
//   const finalPremium = {
//     calculatedOdPremium: item?.premiumDetails?.calculatedOdPremium || premiumDetails.calculatedOdPremium,
//     calculatedTpPremium: item?.premiumDetails?.calculatedTpPremium || premiumDetails.calculatedTpPremium,
//     totalOdPremium: item?.premiumDetails?.totalOdPremium || premiumDetails.totalOdPremium,
//     totalTpPremium: item?.premiumDetails?.totalTpPremium || premiumDetails.totalTpPremium,
//     netPremium: item?.premiumDetails?.netPremium || premiumDetails.netPremium,
//     gst: item?.premiumDetails?.gst || premiumDetails.gst,
//     totalPayable: item?.premiumDetails?.totalPayable || premiumDetails.totalPayable,
//   };

//   return (
//     <PolicyCardView
//       item={item}
//       policyNumber={policyNumber}
//       insuranceCompany={extractInsuranceCompany(fullText)}
//       branchAddress={extractBranchAddress(fullText)}
//       productType={getProductType(item?.policyDetails?.policyType, fullText)}
//       vehicleCategory={getVehicleCategory(item?.policyDetails?.policyType, fullText)}
//       insuredName={insuredName}
//       panNumber={panNumber}
//       gstin={gstin}
//       contactNumber={contactNumber}
//       email={email}
//       insuredAddress={insuredAddress}
//       policyDates={policyDates}
//       dateOfIssue={extractDateOfIssue(fullText)}
//       totalValue={extractIDV(fullText)}
//       previousInsurer={extractPreviousInsurer(fullText)}
//       previousPolicyNumber={extractPreviousPolicyNumber(fullText)}
//       finalPremium={finalPremium}
//       vehicle={vehicleDetails}
//       extractedVehicle={vehicleDetails}
//     />
//   );
// }

// export default OrientalPolicyCard;










// src/components/OrientalPolicyCard.jsx

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

// =======================================
// SEPARATED VEHICLE DETAILS EXTRACTORS
// =======================================

const extractRegistrationNumber = (normalizedText) => {
  if (/BUNDLED\s+COVER\s+POLICY/i.test(normalizedText)) {
    return "New";
  }
  const regMatch = normalizedText.match(/\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\b/i);
  if (regMatch) {
    return regMatch[0].replace(/\s+/g, "");
  }
  return "-";
};

const extractEngineChassisYear = (normalizedText) => {
  let engineNumber = "-";
  let chassisNumber = "-";
  let manufacturingYear = "-";

  const flatRowMatch = normalizedText.match(
    /\b([A-Z0-9]{10,15})\s+([A-Z0-9]{15,20})\s+([A-Z]+)\s+([A-Z]+)\s+(.+?)\s+(20\d{2}|19\d{2})\s+(PETROL|DIESEL|CNG|EV|ELECTRIC|HYBRID)\b/i
  );
  
  if (flatRowMatch) {
    engineNumber = flatRowMatch[1];
    chassisNumber = flatRowMatch[2];
    manufacturingYear = flatRowMatch[6];
    return { engineNumber, chassisNumber, manufacturingYear };
  }

  const splitChassisMatch = normalizedText.match(/\b([A-Z0-9]{10,})\s*-\s*([A-Z0-9]{10,})\s+(\d{4})\s+(\d{4})\b/i);
  if (splitChassisMatch) {
    engineNumber = splitChassisMatch[1];
    chassisNumber = splitChassisMatch[2] + splitChassisMatch[3];
    manufacturingYear = splitChassisMatch[4];
    return { engineNumber, chassisNumber, manufacturingYear };
  }

  const ecYearMatch = normalizedText.match(/\b([A-Z0-9]{10,})\s+(\d{4})\s+([A-Z0-9]{10,})(?:\s+([\d\~-]+))?\b/i);
  if (ecYearMatch) {
    engineNumber = ecYearMatch[1];
    manufacturingYear = ecYearMatch[2];
    let chassis = ecYearMatch[3];
    if (ecYearMatch[4]) chassis += ecYearMatch[4].replace(/\D/g, '');
    chassisNumber = chassis;
    return { engineNumber, chassisNumber, manufacturingYear };
  }

  const ecMatch = normalizedText.match(/\b([A-Z0-9]{10,})\s*-\s*([A-Z0-9]{10,})\b/i);
  if (ecMatch) {
    engineNumber = ecMatch[1];
    chassisNumber = ecMatch[2];
  }

  const yearMatch = normalizedText.match(/\b(19|20)\d{2}\b/);
  if (yearMatch && manufacturingYear === "-") {
    manufacturingYear = yearMatch[0];
  }

  return { engineNumber, chassisNumber, manufacturingYear };
};

const extractMakeModelVariant = (normalizedText) => {
  let make = "-", model = "-", variant = "-";

  // 1. Flat Row Extraction
  const flatRowMatch = normalizedText.match(
    /\b[A-Z0-9]{10,15}\s+[A-Z0-9]{15,20}\s+([A-Z]+)\s+([A-Z]+)\s+(.+?)\s+(20\d{2}|19\d{2})\s+(PETROL|DIESEL|CNG|EV|ELECTRIC|HYBRID)\b/i
  );
  
  if (flatRowMatch) {
    make = flatRowMatch[1];
    let modelVariantRaw = flatRowMatch[3].trim();
    
    if (modelVariantRaw.toUpperCase().startsWith("SHINE 125")) {
      model = "SHINE 125";
      variant = modelVariantRaw.substring(9).trim();
    } else {
      let parts = modelVariantRaw.split(/\s+/);
      if (parts.length > 2) {
        model = parts.slice(0, 2).join(" ");
        variant = parts.slice(2).join(" ");
      } else {
        model = modelVariantRaw;
      }
    }
    return { make, model, variant };
  }

  // 2. Car format
  const carMatch = normalizedText.match(/\b([A-Z]+)\s+MOTORS?-([A-Z]+)\s+(.+?)\s+INDIA\b/i);
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
    return { make, model, variant };
  }

  // 3. Commercial Vehicle format
  const cvMatch = normalizedText.match(/\b([A-Z]{2,20})\s+([A-Z0-9]{2,20})\s+(BSIII|BSIV|BSVI|BS6)\s+(\d{3,5})\b/i);
  if (cvMatch) {
    make = cvMatch[1].trim().toUpperCase();
    model = cvMatch[2].trim().toUpperCase();
    variant = cvMatch[3].trim().toUpperCase();
    return { make, model, variant };
  }

  // 4. "Make - Model" Label format
  const mmLabel = normalizedText.match(/Make\s*-\s*Model\s*[:：]?\s*([^\n]+)/i);
  if (mmLabel) {
    let modelStr = mmLabel[1].trim().replace(/\s*(Type\s+Of\s+Body|Cubic\s+Capacity|Seating\s+Capacity|Year\s+Of\s+Manf.).*/i, "").trim();
    const parts = modelStr.split(/\s*-\s*/);
    if (parts.length >= 2) {
      make = parts[0].trim();
      model = parts.slice(1).join(" ").trim();
    } else {
      model = modelStr;
    }
    return { make, model, variant };
  }

  // 5. Bike format
  const bikeMatch = normalizedText.match(/\b([A-Za-z][A-Za-z\s]+?)\s*-\s*([A-Za-z\s]+?)(?=\s+\d|\s*$)/i);
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

  return { make, model, variant };
};

const extractSpecs = (normalizedText) => {
  let gvw = "-", cubicCapacity = "-", seatingCapacity = "-", fuelType = "-";

  const gvwMatch = normalizedText.match(/\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\s+(\d{2,5})\s+(?:OPEN\s+BODY|BULKER|CLOSED\s+BODY|TROLLEY|TANKER|CONTAINER)/i);
  if (gvwMatch) gvw = gvwMatch[1];

  const seatMatch = normalizedText.match(/\b(\d+\s*\+\s*\d+)\b/);
  if (seatMatch) seatingCapacity = seatMatch[1];

  let ccMatch = normalizedText.match(/\b(?:BSIII|BSIV|BSVI|BS6)\s+(\d{3,5})\b/i);
  if (!ccMatch) ccMatch = normalizedText.match(/\b(\d{2,5})\s*(?:CC|cc|Cubic\s+Capacity|Cubic)\b/i);
  if (!ccMatch) ccMatch = normalizedText.match(/\b(?:PETROL|DIESEL|CNG|LPG|HYBRID)?\s*(?:BSIV|BSVI)?\s*(?:[A-Z\s-]*?)\s(\d{3,4})\s+[A-Z]{3,}/i);
  if (!ccMatch) ccMatch = normalizedText.match(/\b(\d{2,5})\s+OTHERS\s+\d+\s*\+\s*\d+\b/i);
  if (ccMatch) cubicCapacity = ccMatch[1];

  const fuelMatch = normalizedText.match(/Type\s+Of\s+Fuel\s*:?\s*([A-Z]+)/i);
  if (fuelMatch) {
    fuelType = fuelMatch[1].trim();
  } else {
    const fuelFallback = normalizedText.match(/\b(PETROL|DIESEL|CNG|LPG|ELECTRIC|HYBRID)\b/i);
    if (fuelFallback) fuelType = fuelFallback[1].toUpperCase();
  }

  return { gvw, cubicCapacity, seatingCapacity, fuelType };
};

const extractFinancierNameField = (normalizedText) => {
  let finMatch = normalizedText.match(/\b([A-Z][A-Z\s&.,]{5,60}?)\s+Hire\s+Purchase\/Lessor\s+Agreement/i) ||
                 normalizedText.match(/Hire\s+Purchase\/Lessor\s+Agreement\s+with\s*:?\s*([A-Z0-9.,&-\s]+?)(?=\s*-\s*(?:Subject|Details)|\n|$)/i) ||
                 normalizedText.match(/Hypothecation\s+Agreement\s+with\s*:?\s*([A-Z0-9.,&-\s]+?)(?=\s*-\s*(?:Subject|Details)|\n|$)/i) ||
                 normalizedText.match(/\b([A-Z\s&]+BANK\s+LTD\.?)\b/i) ||
                 normalizedText.match(/\b(HINDUJA\s+LEYLAND\s+FINANCE.*?)(?=\s*-|\n|$)/i);

  if (finMatch?.[1]) {
    return finMatch[1].replace(/,\s*[A-Z\s]+$/i, '').trim();
  }
  return "-";
};

const extractNcbField = (normalizedText = "") => {
  if (!normalizedText) return "0%";

  const cleanText = String(normalizedText)
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const validSlabs = ["0", "20", "25", "35", "45", "50"];

  const ncbPatterns = [
    // NCB discount - 45 %
    /NCB\s*(?:DISCOUNT)?\s*[:\-–]?\s*(\d{1,2}(?:\.\d+)?)\s*%/gi,

    // NO CLAIM BONUS - 45 %
    /NO\s+CLAIM\s+BONUS\s*(?:DISCOUNT)?\s*[:\-–]?\s*(\d{1,2}(?:\.\d+)?)\s*%/gi,

    // Flexible fallback
    /(?:NCB|NO\s+CLAIM\s+BONUS)[^\d%]{0,40}(\d{1,2}(?:\.\d+)?)\s*%/gi
  ];

  for (const pattern of ncbPatterns) {
    const matches = [...cleanText.matchAll(pattern)];

    for (const match of matches) {
      if (!match?.[1]) continue;

      const number = Number.parseFloat(match[1]);

      if (!Number.isFinite(number)) continue;

      const slab = String(number); // always string

      if (validSlabs.includes(slab)) {
        return `${slab}%`;
      }
    }
  }

  return "0%";
};

// =======================================
// MASTER VEHICLE EXTRACTOR (REFACTORED)
// =======================================
const extractVehicleDetailsFromText = (text = "") => {
  const result = {
    registrationNumber: "-",
    chassisNumber: "-",
    engineNumber: "-",
    make: "-",
    model: "-",
    variant: "-",
    manufacturingYear: "-",
    cubicCapacity: "-",
    seatingCapacity: "-",
    geographicalArea: "-",
    financierName: "-",
    fuelType: "-",
    gvw: "-",
    ncb: "0%"   // only one ncb key
  };

  if (!text) return result;

  const normalizedText = normalizeText(text);

  // =======================================================================
  // ---- Registration ----
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
  // Car format
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

  // ---- NCB ----
  const ncb = extractNcbField(normalizedText);
  result.ncb = ncb;

  // ============================================================
  // POST-PROCESS: Split "SONET" model into model + variant
  // Example: model = "SONET D 1.5 6 MT", variant = "HTX"
  //          → model = "SONET", variant = "D 1.5 6 MT HTX"
  // ============================================================
  if (result.model && result.model.startsWith("SONET")) {
    const parts = result.model.split(/\s+/);
    if (parts.length > 1) {
      const modelName = parts[0]; // "SONET"
      const rest = parts.slice(1).join(" "); // "D 1.5 6 MT"
      result.model = modelName;
      // Combine rest with existing variant (if any)
      if (result.variant && result.variant !== "-") {
        result.variant = rest + " " + result.variant;
      } else {
        result.variant = rest;
      }
    }
  }
  
  return result;
};

// =======================================
// OTHER EXTRACTION FUNCTIONS
// =======================================

const extractInsuranceCompany = (text) => text.includes("The Oriental Insurance Company Limited") ? "The Oriental Insurance Company Limited" : "-";

const extractPolicyNumber = (text) => {
  const match = text.match(/([A-Z0-9\/]{10,})\s+Policy\s+No/i) || text.match(/Policy\s+No\s*[:：]\s*([A-Z0-9\/\-]+)/i);
  return match ? match[1] : "-";
};

const extractBranchAddress = (text) => {
  if (!text) return "-";
  const normalizedText = text.replace(/\s+/g, " ").trim();

  let match = normalizedText.match(/(E-\d+\/\d+,\s*.*?ARERA\s+COLONY.*?MADHYA\s+PRADESH\s+\d{6})/i) ||
              normalizedText.match(/([A-Z0-9\/,\-().\s]+(?:COLONY|ROAD|NAGAR|COMPLEX|MARKET|FLOOR|TOWER|BUILDING)[A-Z0-9\/,\-().\s]*?MADHYA\s+PRADESH\s+\d{6})/i) ||
              normalizedText.match(/(\d{1,2},\s*A\.?D\.?\s*COMPLEX.*?(?:\d{6}|\d{3}\s*\d{3}))/i) ||
              normalizedText.match(/([A-Z0-9\/,\-().\s]{20,}MADHYA\s+PRADESH\s+\d{6})(?=\s+MOTOR\s+INSURANCE)/i) ||
              normalizedText.match(/([A-Z0-9\/,\-().\s]{20,}?MADHYA\s+PRADESH\s+\d{6})/i);

  if (match?.[1]) return match[1].trim();

  const blockMatch = text.match(/Prev\s+Policy\s+No\s*[:：]\s*[^\n]+\s+([\s\S]*?)\s*FROM\s+\d{2}:\d{2}/i);
  if (blockMatch?.[1]) {
    const lines = blockMatch[1].trim().split(/\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length >= 2) return lines[1];
  }
  return "-";
};

const extractInsuredDetails = (text = "") => {
  if (!text) return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };

  const normalizedText = normalizeText(text);
  let insuredName = "-";
  let insuredAddress = "-";

  const driverMatch = normalizedText.match(/\bperson\s+driving\s+holds\s+an?\s+([A-Z][A-Z\s]+?)\s*(?=\(GSTIN|$)/i);
  if (driverMatch) insuredName = driverMatch[1].replace(/\s*\(.*$/, '').trim();

  if (insuredName === "-") {
    const companyMatch = normalizedText.match(/\b(?:M\/?S\.?|M\/s\.?)\s+([A-Z0-9\s&.,\-]+?)\s*\(GSTIN/i) ||
                         normalizedText.match(/\b(?:MR|MRS|MS|M\/S\.?)\s+([A-Z\s]+?)\s*\(GSTIN/i) ||
                         normalizedText.match(/\b([A-Z]{2,}(?:\s+[A-Z]{2,}){1,5})\s*\(GSTIN\s*:/i) ||
                         normalizedText.match(/([A-Z][A-Z\s]{3,60})\s*\(GSTIN/i);
    if (companyMatch) insuredName = companyMatch[1].replace(/^IND\s+/i, '').replace(/\s*\(.*$/, '').trim();
  }

  const dualAddressMatch = normalizedText.match(/Address\s*:\s*(.*?)\s*Address\s*:/i);
  if (dualAddressMatch?.[1] && dualAddressMatch[1].length > 15 && !/Validated|Tel|Email/i.test(dualAddressMatch[1])) {
    insuredAddress = dualAddressMatch[1].trim();
  }

  if (insuredAddress === "-") {
    const addressMatch = normalizedText.match(/Prev\s+Policy\s+No\s*[\s:-]+([A-Z0-9\s,\.\/()]+?\d{6})\s+(?:15\s*,\s*A\.?\s*D\.?\s*COMPLEX|\d{1,2}\s*,|FROM)/i) ||
                         normalizedText.match(/\(GSTIN:\s*[^)]+\)\s*([A-Z0-9\s,\.]+?)(?=\s*\d{1,2},\s*A\.?D\.?|MOTOR INSURANCE|FROM|$)/i) ||
                         normalizedText.match(/\b(\d{1,3},\s*[A-Z0-9\s,.-]+?\s+\d{6})\b/i);
    if (addressMatch) insuredAddress = addressMatch[1].replace(/^-\s*/, '').replace(/^\d+\s+\d+\s*/, '').trim();
  }

  const panMatch = normalizedText.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i) || normalizedText.match(/PAN\s+No\s*[:]?\s*([A-Z0-9]{10,})/i);
  const panNumber = panMatch && !/Validated|Email|Mobile|Number/i.test(panMatch[1]) ? panMatch[1].toUpperCase() : "-";

 // ---- Updated Contact & Email Extraction ----
  let contactNumber = "-";
  let email = "-";

  // Regex specifically targeting the format: 
  // Tel./Fax/Email : ******9883//a********************@gmail.com
  const contactLineMatch = normalizedText.match(
    /(?:Tel\.\/Fax\/Email\s*:\s*)\s*([\d*]{7,15})\/\/\s*([A-Za-z0-9._%+\-*]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i
  );

  if (contactLineMatch) {
    contactNumber = contactLineMatch[1].trim();
    email = contactLineMatch[2].trim();
  } else {
    // Fallback: Standard Phone Extraction (allowing *)
    const contactMatch =
      normalizedText.match(
        /(?:Validated\s+Mobile\s+No\.?|Validated\s+Mobile\s+Number|Mobile\s*No\.?|Mobile|Phone|Tel)\s*[:\-]?\s*([\d*]{7,15})/i
      ) ||
      normalizedText.match(/\b([6-9]\d{9})\b/);

    if (contactMatch) {
      contactNumber = contactMatch[1];
    }

    // Fallback: Standard Email Extraction (allowing *)
    const emailMatch = normalizedText.match(
      /\b([A-Za-z0-9._%+\-*]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/i
    );

    if (emailMatch) {
      email = emailMatch[1];
    } else if (/\/\s*NA\b/i.test(normalizedText)) {
      email = "NA";
    }
  }
  
 // Replace your old gstin extraction line with this:
const gstinRegex = /GSTIN\s*[:]?\s*([A-Z0-9]{15})/gi;
const gstinMatches = [...normalizedText.matchAll(gstinRegex)];

let gstin = "-";

for (const match of gstinMatches) {
  const value = match[1].toUpperCase();

  // Ignore Oriental Insurance GSTIN and invalid GSTIN
  if (
    value !== "23AAACT0627R4Z4" &&
    value !== "27AAACT0627R4ZW" &&
    value !== "0"
  ) {
    gstin = value;
    break;
  }
}
  return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin };
};

const extractPolicyDates = (text = "") => {
  if (!text) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };

  const odPeriodMatch = text.match(/Policy\s+Period\s*\(OWN\s+DAMAGE\)\s*:\s*FROM\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}\s+TO\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}/i);
  const liabilityPeriodMatch = text.match(/Policy\s+Period\s*\(LIABILITY\)\s*:\s*FROM\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+TO\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}/i);

  if (odPeriodMatch) {
    return {
      startDate: odPeriodMatch[1],
      odExpireDate: odPeriodMatch[2],
      tpExpireDate: liabilityPeriodMatch ? liabilityPeriodMatch[1] : odPeriodMatch[2]
    };
  }

  const match = text.match(/FROM\s+\d{2}:\d{2}\s+ON\s+(\d{2}\/\d{2}\/\d{4})\s+TO\s+MIDNIGHT\s+OF\s+(\d{2}\/\d{2}\/\d{4})/i) ||
                text.match(/Period\s+of\s+Insurance\s*[:：]?\s*FROM\s+(\d{2}\/\d{2}\/\d{4})\s+TO\s+MIDNIGHT\s+OF\s+(\d{2}\/\d{2}\/\d{4})/i) ||
                text.match(/(\d{2}\/\d{2}\/\d{4})\s+TO\s+(\d{2}\/\d{2}\/\d{4})/i);

  return match ? { startDate: match[1], odExpireDate: match[2], tpExpireDate: match[2] } : { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
};

const extractDateOfIssue = (text = "") => {
  if (!text) return "-";
  const match = text.match(/Collection\s+No\.\s*&\s*Dt\.\s*:\s*[A-Z0-9]+\s+(\d{2}-\d{2}-\d{4})/i) ||
                text.match(/Date\s+of\s+Issue\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                text.match(/[A-Z]+\s+(\d{2}\/\d{2}\/\d{4})\s+Place\s*:?\s*Date\s*:/i) ||
                text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/) ||
                text.match(/\b(\d{2}-\d{2}-\d{4})\b/);
  return match ? match[1] : "-";
};

const extractIDV = (text = "") => {
  if (!text) return "-";
  const normalized = text.replace(/\s+/g, " ");

  // 1. Try explicit IDV labels
  let match = normalized.match(/Total\s+Value\s+IDV[^0-9]{0,50}([\d,]{3,})/i) || 
              normalized.match(/IDV\s+of\s+the\s+Vehicle[^0-9]{0,50}([\d,]{3,})/i);
  
  let idv = match?.[1] ? match[1].replace(/,/g, "") : null;

  // 2. If not found, fallback to the largest number with commas
  if (!idv) {
    const candidates = normalized.match(/\b\d{1,3}(?:,\d{2,3}){1,3}\b/g);
    if (candidates?.length) {
      const sorted = candidates.map(n => parseInt(n.replace(/,/g, ""), 10)).sort((a, b) => b - a);
      idv = String(sorted[0]);
    }
  }

  // 3. If we got a value, clean and validate
  if (idv) {
    // Remove any trailing non‑digit characters and trim
    idv = idv.trim();

    // If the extracted value is the branch code "181100", return "0"
    if (idv === "181100") {
      return "0";
    }

    return idv;
  }

  return "-";
};

const extractPreviousPolicyNumber = (text = "", productType = "") => {
  if (!text) return "-";

  // 1. Check if productType is "Bundled Policy" (or contains "Bundled Policy")
  if (
    productType &&
    String(productType).trim().toLowerCase().includes("bundled policy")
  ) {
    return "-";
  }

  const normalized = String(text)
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Safeguard: Check directly in the text if "BUNDLED" is present
  if (/\bBUNDLED\b/i.test(normalized)) {
    return "-";
  }

  let match = null;

  // ============================================================
  // 1. ORIENTAL OCR FORMAT
  // Example: Policy No : 152801/31/2027/1112 Prev Policy No : 1907003125P103774483
  // ============================================================
  match = normalized.match(
    new RegExp(
      "Policy\\s*No\\.?\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9/-]{7,49}?)\\s+Prev(?:ious)?\\s*Policy\\s*No\\.?",
      "i"
    )
  );

  if (match?.[1]) {
    const value = match[1].trim();

    if (value && value !== "-") {
      return value;
    }
  }

  // ============================================================
  // 2. EXPLICIT PREVIOUS POLICY NUMBER
  // ============================================================
  match = normalized.match(
    new RegExp(
      "Prev(?:ious)?\\s*Policy\\s*No\\.?\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9/-]{7,49})",
      "i"
    )
  );

  if (match?.[1]) {
    const value = match[1].trim();

    if (
      value &&
      value !== "-" &&
      value.toUpperCase() !== "NA" &&
      value.toUpperCase() !== "N/A"
    ) {
      return value;
    }
  }

  // ============================================================
  // 3. ORIENTAL SLASH POLICY NUMBERS
  // Current: 181100/31/2027/1347, Previous: 181100/31/2026/936
  // ============================================================
  const slashPolicyRegex = new RegExp(
    "\\b\\d{6}/\\d{2}/\\d{4}/\\d+\\b",
    "g"
  );

  const allPolicies = normalized.match(slashPolicyRegex);

  if (allPolicies?.length >= 2) {
    return allPolicies[1];
  }

  // ============================================================
  // 4. VALUE IMMEDIATELY BEFORE PREV POLICY NO
  // ============================================================
  match = normalized.match(
    new RegExp(
      "\\b([A-Z0-9][A-Z0-9/-]{7,49})\\s+Prev(?:ious)?\\s*Policy\\s*No\\.?",
      "i"
    )
  );

  if (match?.[1]) {
    const value = match[1].trim();

    if (value && value !== "-") {
      return value;
    }
  }

  // ============================================================
  // 5. GENERIC POLICY NUMBER FALLBACK
  // ============================================================
  match = normalized.match(
    new RegExp(
      "Policy\\s*No\\.?\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9/-]{7,49})",
      "i"
    )
  );

  if (match?.[1]) {
    const value = match[1].trim();

    if (value && value !== "-") {
      return value;
    }
  }

  return "-";
};

const extractPreviousInsurer = (text = "") => {
  const match = text.match(/Previous Insurer\s*[:]?\s*([^\n]+?)(?:\s*Previous Policy Number|$)/i);
  return match?.[1] ? match[1].replace(/Previous Policy Number.*$/i, "").replace(/\s+/g, " ").trim() : "-";
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

  const normalizedText = String(text)
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ ]{2,}/g, " ");

  // ============================================
  // HELPER: CLEAN AMOUNT
  // ============================================
  const cleanAmount = (value) => {
    const cleaned = String(value || "0")
      .replace(/[₹,\s]/g, "")
      .trim();

    const number = Number.parseFloat(cleaned);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return number.toFixed(2);
  };

  // ============================================
  // HELPER: ADD MULTIPLE AMOUNTS
  // ============================================
  const addAmounts = (...values) => {
    const total = values.reduce((sum, value) => {
      const cleaned = String(value || "0")
        .replace(/[₹,\s]/g, "")
        .trim();

      const amount = Number.parseFloat(cleaned);

      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    return total.toFixed(2);
  };

  // ============================================
  // HELPER: GET AMOUNTS
  // ============================================
  const getAmounts = (value = "") => {
    return (
      String(value).match(
        /\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?/g
      ) || []
    );
  };

  // ============================================================
  // 1. OWN DAMAGE PREMIUM
  // ============================================================
  const odBlockMatch = normalizedText.match(
    /MOTOR\s+TOTAL\s+OD\s+([\d,.\s]+?)(?=\s*(?:\*|IDV\b|SCHEDULE\b|Attached\b|$))/i
  );

  if (odBlockMatch?.[1]) {
    const odAmounts = getAmounts(odBlockMatch[1]);

    if (odAmounts.length) {
      const odPremium = cleanAmount(
        odAmounts[odAmounts.length - 1]
      );

      result.calculatedOdPremium = odPremium;
      result.totalOdPremium = odPremium;
    }
  }

  // ============================================================
  // NEW: BUNDLED TWO-WHEELER PREMIUM SCHEDULE
  // Example:
  // MOTOR TOTAL OD   618
  // ...
  // TP TOTAL   3,851
  // ...
  // TOTAL PREMIUM   4469
  // ADD :IGST   804.0
  // ...
  // TOTAL AMOUNT   5,273
  // ============================================================
  const bundledScheduleMatch = normalizedText.match(
    /MOTOR\s+TOTAL\s+OD\s+([\d,.]+)\s*[\s\S]*?TP\s+TOTAL\s+([\d,.]+)\s*[\s\S]*?TOTAL\s+PREMIUM\s+([\d,.]+)\s*[\s\S]*?ADD\s*:?\s*IGST\s+([\d,.]+)\s*[\s\S]*?TOTAL\s+AMOUNT\s+([\d,.]+)/i
  );

  if (bundledScheduleMatch) {
    result.totalOdPremium = cleanAmount(bundledScheduleMatch[1]);
    result.calculatedOdPremium = result.totalOdPremium;
    result.totalTpPremium = cleanAmount(bundledScheduleMatch[2]);
    result.calculatedTpPremium = result.totalTpPremium;
    result.netPremium = cleanAmount(bundledScheduleMatch[3]);
    result.gst = cleanAmount(bundledScheduleMatch[4]);
    result.totalPayable = cleanAmount(bundledScheduleMatch[5]);
    return result;
  }

  // ============================================================
  // 2. ORIENTAL CGST + SGST FORMAT
  // ============================================================
  const orientalCgstSgstMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*CGST[_\s-]*OD\s+ADD\s*:?\s*CGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*OD\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
  );

  if (orientalCgstSgstMatch) {
    const basicTpCover = cleanAmount(
      orientalCgstSgstMatch[1]
    );

    const tpTotal = cleanAmount(
      orientalCgstSgstMatch[5]
    );

    const totalPremium = cleanAmount(
      orientalCgstSgstMatch[6]
    );

    const cgstOd = orientalCgstSgstMatch[8];
    const cgstTp = orientalCgstSgstMatch[9];
    const sgstTp = orientalCgstSgstMatch[10];
    const sgstOd = orientalCgstSgstMatch[11];

    const totalAmount = cleanAmount(
      orientalCgstSgstMatch[12]
    );

    result.calculatedTpPremium = basicTpCover;
    result.totalTpPremium = tpTotal;
    result.netPremium = totalPremium;

    result.gst = addAmounts(
      cgstOd,
      cgstTp,
      sgstTp,
      sgstOd
    );

    result.totalPayable = totalAmount;

    return result;
  }

  // ============================================================
  // 3. FLEXIBLE CGST + SGST FORMAT
  // ============================================================
  const flexibleCgstSgstMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*CGST[_\s-]*OD\s+ADD\s*:?\s*CGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*OD\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){7,15}[\d,.]+)/i
  );

  if (flexibleCgstSgstMatch?.[1]) {
    const values = getAmounts(
      flexibleCgstSgstMatch[1]
    );

    if (values.length >= 8) {
      const lastValues = values.slice(-8);

      const tpTotal = lastValues[0];
      const totalPremium = lastValues[1];
      const cgstOd = lastValues[3];
      const cgstTp = lastValues[4];
      const sgstTp = lastValues[5];
      const sgstOd = lastValues[6];
      const totalAmount = lastValues[7];

      result.calculatedTpPremium = cleanAmount(
        values[0]
      );

      result.totalTpPremium = cleanAmount(
        tpTotal
      );

      result.netPremium = cleanAmount(
        totalPremium
      );

      result.gst = addAmounts(
        cgstOd,
        cgstTp,
        sgstTp,
        sgstOd
      );

      result.totalPayable = cleanAmount(
        totalAmount
      );

      return result;
    }
  }

  // ============================================================
  // 4. ORIENTAL IGST_OD + IGST_TP FORMAT
  // ============================================================
  const orientalIgstSplitMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*IGST[_\s-]*OD\s+ADD\s*:?\s*IGST[_\s-]*TP\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
  );

  if (orientalIgstSplitMatch) {
    const basicTpCover = cleanAmount(
      orientalIgstSplitMatch[1]
    );

    const tpTotal = cleanAmount(
      orientalIgstSplitMatch[5]
    );

    const totalPremium = cleanAmount(
      orientalIgstSplitMatch[6]
    );

    const igstOd = orientalIgstSplitMatch[8];
    const igstTp = orientalIgstSplitMatch[9];

    const totalAmount = cleanAmount(
      orientalIgstSplitMatch[10]
    );

    result.calculatedTpPremium = basicTpCover;
    result.totalTpPremium = tpTotal;
    result.netPremium = totalPremium;

    result.gst = addAmounts(
      igstOd,
      igstTp
    );

    result.totalPayable = totalAmount;

    return result;
  }

  // ============================================================
  // 5. FLEXIBLE IGST_OD + IGST_TP FORMAT
  // ============================================================
  const flexibleSplitIgstMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*IGST[_\s-]*OD\s+ADD\s*:?\s*IGST[_\s-]*TP\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){6,14}[\d,.]+)/i
  );

  if (flexibleSplitIgstMatch?.[1]) {
    const values = getAmounts(
      flexibleSplitIgstMatch[1]
    );

    if (values.length >= 6) {
      const lastValues = values.slice(-6);

      result.calculatedTpPremium = cleanAmount(
        values[0]
      );

      result.totalTpPremium = cleanAmount(
        lastValues[0]
      );

      result.netPremium = cleanAmount(
        lastValues[1]
      );

      result.gst = addAmounts(
        lastValues[3],
        lastValues[4]
      );

      result.totalPayable = cleanAmount(
        lastValues[5]
      );

      return result;
    }
  }

  // ============================================================
  // 6. ORIENTAL SINGLE IGST FORMAT
  // ============================================================
  const orientalSingleIgstMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+(?:ADD\s*:?\s*IGST\s+STAMP\s+DUTY|STAMP\s+DUTY\s+ADD\s*:?\s*IGST)\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){6,20}[\d,.]+)/i
  );

  if (orientalSingleIgstMatch?.[1]) {
    const values = getAmounts(
      orientalSingleIgstMatch[1]
    );

    if (values.length >= 7) {
      const lastFiveValues = values.slice(-5);

      const tpTotal = lastFiveValues[0];
      const totalPremium = lastFiveValues[1];
      const thirdValue = lastFiveValues[2];
      const fourthValue = lastFiveValues[3];
      const totalAmount = lastFiveValues[4];

      const thirdAmount = Number.parseFloat(
        String(thirdValue).replace(/,/g, "")
      );

      const fourthAmount = Number.parseFloat(
        String(fourthValue).replace(/,/g, "")
      );

      let igst = fourthValue;

      if (
        Number.isFinite(thirdAmount) &&
        Number.isFinite(fourthAmount)
      ) {
        igst =
          thirdAmount > fourthAmount
            ? thirdValue
            : fourthValue;
      }

      result.calculatedTpPremium = cleanAmount(
        values[0]
      );

      result.totalTpPremium = cleanAmount(
        tpTotal
      );

      result.netPremium = cleanAmount(
        totalPremium
      );

      result.gst = cleanAmount(
        igst
      );

      result.totalPayable = cleanAmount(
        totalAmount
      );

      return result;
    }
  }
  // ============================================================
  // 7. PAGE 1 POLICY SUMMARY FALLBACK
  // ============================================================
  const policySummaryMatch = normalizedText.match(
    /\b([\d,]+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)\s+(\.?\d+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)\s+(?:GCCV|PRIVATE\s+CAR|TWO\s+WHEELER|MOTOR)/i
  );

  if (policySummaryMatch) {
    if (result.netPremium === "0") {
      result.netPremium = cleanAmount(
        policySummaryMatch[1]
      );
    }

    if (result.gst === "0") {
      result.gst = cleanAmount(
        policySummaryMatch[2]
      );
    }

    if (result.totalPayable === "0") {
      result.totalPayable = cleanAmount(
        policySummaryMatch[4]
      );
    }
  }

  // ============================================================
  // 8. TP VALUES FALLBACK
  // ============================================================
  const tpSectionMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL([\s\S]{0,700}?)TOTAL\s+AMOUNT/i
  );

  if (tpSectionMatch?.[1]) {
    const tpValues = getAmounts(
      tpSectionMatch[1]
    );

    if (tpValues.length) {
      if (result.calculatedTpPremium === "0") {
        result.calculatedTpPremium = cleanAmount(
          tpValues[0]
        );
      }

      if (result.totalTpPremium === "0") {
        const tpLabelBlock = normalizedText.match(
          /TP\s+TOTAL\s+TOTAL\s+PREMIUM[\s\S]{0,500}?((?:[\d,.]+\s+){2,15}[\d,.]+)/i
        );

        if (tpLabelBlock?.[1]) {
          const values = getAmounts(
            tpLabelBlock[1]
          );

          if (values.length >= 2) {
            result.totalTpPremium = cleanAmount(
              tpValues[Math.max(0, tpValues.length - 7)]
            );
          }
        }
      }
    }
  }

  // ============================================================
  // 9. NET PREMIUM FALLBACK
  // ============================================================
  if (result.netPremium === "0") {
    const totalPremiumValueMatch = normalizedText.match(
      /TOTAL\s+PREMIUM(?:\s+STAMP\s+DUTY|\s+ADD\s*:?\s*(?:I|C|S)GST[\s\S]{0,150}?TOTAL\s+AMOUNT)\s+((?:[\d,.]+\s+){2,15}[\d,.]+)/i
    );

    if (totalPremiumValueMatch?.[1]) {
      const values = getAmounts(
        totalPremiumValueMatch[1]
      );

      if (values.length) {
        const possibleNetPremium = values.find((value) => {
          const amount = Number.parseFloat(
            String(value).replace(/,/g, "")
          );

          return Number.isFinite(amount) && amount >= 1;
        });

        if (possibleNetPremium) {
          result.netPremium = cleanAmount(
            possibleNetPremium
          );
        }
      }
    }
  }

  // ============================================================
  // 10. GST FALLBACK
  // ============================================================
  if (result.gst === "0") {
    const igstOdMatch = normalizedText.match(
      /IGST[_\s-]*OD[^0-9]*([\d,.]+)/i
    );

    const igstTpMatch = normalizedText.match(
      /IGST[_\s-]*TP[^0-9]*([\d,.]+)/i
    );

    const cgstOdMatch = normalizedText.match(
      /CGST[_\s-]*OD[^0-9]*([\d,.]+)/i
    );

    const cgstTpMatch = normalizedText.match(
      /CGST[_\s-]*TP[^0-9]*([\d,.]+)/i
    );

    const sgstOdMatch = normalizedText.match(
      /SGST[_\s-]*OD[^0-9]*([\d,.]+)/i
    );

    const sgstTpMatch = normalizedText.match(
      /SGST[_\s-]*TP[^0-9]*([\d,.]+)/i
    );

    if (
      cgstOdMatch?.[1] ||
      cgstTpMatch?.[1] ||
      sgstOdMatch?.[1] ||
      sgstTpMatch?.[1]
    ) {
      result.gst = addAmounts(
        cgstOdMatch?.[1] || "0",
        cgstTpMatch?.[1] || "0",
        sgstOdMatch?.[1] || "0",
        sgstTpMatch?.[1] || "0"
      );
    } else if (
      igstOdMatch?.[1] ||
      igstTpMatch?.[1]
    ) {
      result.gst = addAmounts(
        igstOdMatch?.[1] || "0",
        igstTpMatch?.[1] || "0"
      );
    } else {
      const singleIgstMatch = normalizedText.match(
        /\bIGST\b[^0-9]*([\d,.]+)/i
      );

      const singleCgstMatch = normalizedText.match(
        /\bCGST\b[^0-9]*([\d,.]+)/i
      );

      const singleSgstMatch = normalizedText.match(
        /\bSGST\b[^0-9]*([\d,.]+)/i
      );

      if (
        singleCgstMatch?.[1] ||
        singleSgstMatch?.[1]
      ) {
        result.gst = addAmounts(
          singleCgstMatch?.[1] || "0",
          singleSgstMatch?.[1] || "0"
        );
      } else if (singleIgstMatch?.[1]) {
        result.gst = cleanAmount(
          singleIgstMatch[1]
        );
      }
    }
  }

  // ============================================================
  // 11. TOTAL PAYABLE FALLBACK
  // ============================================================
  if (result.totalPayable === "0") {
    const totalAmountBlock = normalizedText.match(
      /TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){1,15}[\d,.]+)/i
    );

    if (totalAmountBlock?.[1]) {
      const amounts = getAmounts(
        totalAmountBlock[1]
      );

      if (amounts.length) {
        result.totalPayable = cleanAmount(
          amounts[amounts.length - 1]
        );
      }
    }
  }

  // ============================================================
  // 12. FINAL CALCULATION FALLBACK
  // ============================================================
  if (
    result.netPremium === "0" &&
    result.totalPayable !== "0" &&
    result.gst !== "0"
  ) {
    const totalPayable = Number.parseFloat(
      result.totalPayable
    );

    const gst = Number.parseFloat(
      result.gst
    );

    if (
      Number.isFinite(totalPayable) &&
      Number.isFinite(gst) &&
      totalPayable >= gst
    ) {
      result.netPremium = (
        totalPayable - gst
      ).toFixed(2);
    }
  }

  return result;
};

function OrientalPolicyCard({ item }) {
  const fullText = item?.fullText || "";
  
  const insuredDetails = extractInsuredDetails(fullText);
  const policyDates = extractPolicyDates(fullText);
  const vehicleDetails = extractVehicleDetailsFromText(fullText);
  const premiumDetails = extractPremiumData(fullText);

  // Fallbacks to prop items if present
  const insuredName = item?.insuredDetails?.insuredName || insuredDetails.insuredName;
  const insuredAddress = item?.insuredDetails?.insuredAddress || insuredDetails.insuredAddress;
  const panNumber = item?.insuredDetails?.panNumber || insuredDetails.panNumber;
  const contactNumber = item?.insuredDetails?.contactNumber || insuredDetails.contactNumber;
  const email = item?.insuredDetails?.email || insuredDetails.email;
  const gstin = insuredDetails.gstin;

  const policyNumber = extractPolicyNumber(fullText) !== "-" ? extractPolicyNumber(fullText) : (item?.policyDetails?.policyNumber || "-");
  
  const productType = getProductType(item?.policyDetails?.policyType, fullText);
  
  const finalPremium = {
    calculatedOdPremium: item?.premiumDetails?.calculatedOdPremium || premiumDetails.calculatedOdPremium,
    calculatedTpPremium: item?.premiumDetails?.calculatedTpPremium || premiumDetails.calculatedTpPremium,
    totalOdPremium: item?.premiumDetails?.totalOdPremium || premiumDetails.totalOdPremium,
    totalTpPremium: item?.premiumDetails?.totalTpPremium || premiumDetails.totalTpPremium,
    netPremium: item?.premiumDetails?.netPremium || premiumDetails.netPremium,
    gst: item?.premiumDetails?.gst || premiumDetails.gst,
    totalPayable: item?.premiumDetails?.totalPayable || premiumDetails.totalPayable,
  };

  return (
    <PolicyCardView
      item={item}
      policyNumber={policyNumber}
      insuranceCompany={extractInsuranceCompany(fullText)}
      branchAddress={extractBranchAddress(fullText)}
      productType={productType}
      vehicleCategory={getVehicleCategory(item?.policyDetails?.policyType, fullText)}
      insuredName={insuredName}
      panNumber={panNumber}
      gstin={gstin}
      contactNumber={contactNumber}
      email={email}
      insuredAddress={insuredAddress}
      policyDates={policyDates}
      dateOfIssue={extractDateOfIssue(fullText)}
      totalValue={extractIDV(fullText)}
      previousInsurer={extractPreviousInsurer(fullText)}
      previousPolicyNumber={extractPreviousPolicyNumber(fullText, productType)}
      finalPremium={finalPremium}
      vehicle={vehicleDetails}
      extractedVehicle={vehicleDetails}
    />
  );
}

export default OrientalPolicyCard;