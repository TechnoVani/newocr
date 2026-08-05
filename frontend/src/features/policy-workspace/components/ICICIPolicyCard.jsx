// // // src/components/ICICIPolicyCard.jsx

// // import PolicyCardView from "./PolicyCardView";
// // import { getProductType, getVehicleCategory } from "./PolicyClassification";

// // // =======================================
// // // UTILITY FUNCTIONS
// // // =======================================

// // const normalizeText = (text) => {
// //   if (!text) return "";
// //   return text.replace(/\r/g, "\n").replace(/\t/g, " ").replace(/[ ]{2,}/g, " ");
// // };

// // const formatFinancierName = (financier) => {
// //   if (!financier) return "-";
  
// //   let name = String(financier).trim();
// //   if (name === "-" || name === "" || name === "N/A" || name === "NA" || name === "null") return "-";
  
// //   name = name
// //     .replace(/(Invoice No\.|Servicing Branch Address|Cover Note No|Policy No|Vehicle Registration|Make|Model|Chassis|Engine).*$/i, "")
// //     .replace(/[\/:]/g, "")
// //     .replace(/\s+/g, " ")
// //     .trim();
  
// //   if (!name || name.length < 3) return "-";
  
// //   const isValidFinancier = /(BANK|FINANCE|LTD|HDFC|ICICI|SBI|AXIS|KOTAK|INDUSIND|BAJAJ|TATA|CHOLAMANDALAM|MUTHOOT|MANAPPURAM)/i.test(name);
// //   if (!isValidFinancier) return "-";
  
// //   if (name.length > 50) {
// //     const shortMatch = name.match(/([A-Z]{3,}\s+(?:FINANCE|BANK)\s+[A-Z]{3,})/i);
// //     if (shortMatch) return shortMatch[1].toUpperCase();
// //     const bankMatch = name.match(/([A-Z\s]+(?:BANK|FINANCE)\s+(?:LTD\.?|LIMITED)?)/i);
// //     if (bankMatch) return bankMatch[1].trim().toUpperCase();
// //   }
// //   return name.toUpperCase();
// // };

// // // =======================================
// // // EXTRACTION FUNCTIONS
// // // =======================================

// // const extractInsuranceCompanyName = (fullText = "") => {
// //   if (!fullText) return "-";
// //   if (fullText.match(/ICICI\s*Lombard\s*General\s*Insurance\s*Company\s*Limited/i)) {
// //     return "ICICI LOMBARD GENERAL INSURANCE COMPANY LIMITED";
// //   }
// //   const altMatch = fullText.match(/([A-Z\s]+ICICI\s*LOMBARD?\s*INSURANCE?)/i);
// //   return altMatch ? altMatch[1].trim() : "ICICI LOMBARD GENERAL INSURANCE COMPANY LIMITED";
// // };

// // const extractBranchAddress = (fullText = "") => {
// //   if (!fullText) return "-";
  
// //   const servicingMatch = fullText.match(/Servicing\s*Branch\s*Address\s*:\s*([^\n]+(?:,\s*[^\n]+)*?)(?=\s+(?:Are you|Vehicle\s+Registration|Geographical\s+Area|CERTIFICATE|Policy\s+Issued\s+On|Nominee\s+Name|RTO\s+Location|Hypothecated\s+To|Make|Model|$))/i);
// //   if (servicingMatch?.[1]) {
// //     return servicingMatch[1].trim().replace(/\s+No\.?\s*$/, '').replace(/\s+Are\s+you.*$/, '');
// //   }
  
// //   const officeMatch = fullText.match(/POLICY ISSUING OFFICE:\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)\s*\n\s*([^\n]+?)(?=\s+(?:Are you|Vehicle\s+Registration|Geographical\s+Area|CERTIFICATE|$))/i);
// //   if (officeMatch) {
// //     return [1, 2, 3, 4]
// //       .map(i => officeMatch[i]?.trim().replace(/\s+(Are you|Vehicle).*$/, ''))
// //       .filter(part => part && !/^(Are you|Vehicle|Geographical|CERTIFICATE)/i.test(part))
// //       .join(", ");
// //   }
  
// //   return "-";
// // };

// // const extractInsuredDetails = (text = "") => {
// //   const result = { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
// //   if (!text) return result;
  
// //   const normalizedText = normalizeText(text);
// //   let extractedName = "";

// //   let nameMatch = normalizedText.match(/Dear\s+(?!Customer|Sir\/?Madam|Sir|Madam|Policyholder)([A-Za-z\s\.]+),/i);
// //   if (nameMatch?.[1]) extractedName = nameMatch[1];

// //   if (!extractedName) {
// //     const headerMatch = normalizedText.match(/Date\s*:\s*[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+([A-Z\s\.]+?)(?=\s+(?:S\/O|D\/O|W\/O|C\/O|H\.NO|,\s*H\.NO))/i);
// //     if (headerMatch?.[1]) extractedName = headerMatch[1];
// //   }

// //   if (!extractedName) {
// //     const tableMatch = normalizedText.match(/(?:Name of Insured|Name of the Insured)[^\n]*\n+([A-Z\s\.]+?)(?=\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})/i);
// //     if (tableMatch?.[1]) extractedName = tableMatch[1];
// //   }

// //   if (!extractedName) {
// //     const kvMatch = normalizedText.match(/(?:Name of the Insured|Name of Insured|Insured'?s?\s*Name|Insured Name)\s*:?\s*([^\n]+?)(?=\s*Policy No\.|\n|$)/i);
// //     if (kvMatch?.[1] && !/Period of Insurance|Vehicle Make/i.test(kvMatch[1])) {
// //       extractedName = kvMatch[1];
// //     }
// //   }

// //   if (extractedName) {
// //     extractedName = extractedName.replace(/\s+/g, " ").replace(/Policy No\..*$/i, '').replace(/\s*Period of Insurance.*$/i, '').trim();
// //     if (extractedName) result.insuredName = extractedName;
// //   }
  
// //   result.contactNumber = normalizedText.match(/Mobile\s*No\s*:\s*([X\d\*]+)/i)?.[1] || "-";
  
// //   let email = normalizedText.match(/Email Address\s+([A-Z0-9\*]+@[A-Z]+\.[A-Z]+)/i)?.[1]?.trim();
// //   if (!email) email = normalizedText.match(/([A-Z0-9\*]+@GMAIL\.COM)/i)?.[1];
// //   result.email = email || "-";
  
// //   const addressPatterns = [
// //     /Address\s*:\s*([\s\S]+?)(?=\n\s*(?:Period of Insurance|Mobile No|Telephone No|Email Address|GSTIN|Tenure)|$)/i,
// //     /Address\s*:\s*\n\s*([^\n]+)\n\s*([^\n]+)\n\s*([^\n]+)\n\s*([^\n]+?)(?=\n\s*(?:Period of Insurance|Tenure)|$)/i,
// //     /Insured'?s?\s*Address\s*([\s\S]+?)(?=\n\s*(?:Period of Insurance|Contact|Mobile|Tenure)|$)/i,
// //   ];
  
// //   for (const pattern of addressPatterns) {
// //     const match = normalizedText.match(pattern);
// //     if (match?.[1]) {
// //       if (match.length > 2) {
// //         result.insuredAddress = [1, 2, 3, 4].map(i => match[i]?.trim()).filter(Boolean).join(", ");
// //       } else {
// //         result.insuredAddress = match[1].replace(/\n+/g, ", ").replace(/[ ]{2,}/g, " ").replace(/,\s*,/g, ",").trim();
// //       }
// //       break;
// //     }
// //   }

// //   if (result.insuredAddress !== "-") {
// //     result.insuredAddress = result.insuredAddress.replace(/(Tenure|Period of Insurance|Mobile No|Telephone No|Email Address|GSTIN).*$/i, '').replace(/,\s*$/, '').trim() || "-";
// //   }
  
// //   result.gstin = normalizedText.match(/GSTIN\s*No\.?\s*\(Customer\)\s*:\s*([A-Z0-9]{15})/i)?.[1] || "-";
  
// //   return result;
// // };

// // const extractPolicyDates = (fullText = "") => {
// //   const result = { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
// //   if (!fullText) return result;

// //   const odLabelMatch = fullText.match(/Period of Insurance(?: - Own Damage)?\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2})?)\s*(?:to|Till|until|Midnight of)\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
// //   const tpLabelMatch = fullText.match(/Period of Insurance - Third Party\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2})?)\s*(?:to|Till|until|Midnight of)\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);

// //   if (odLabelMatch) {
// //     result.startDate = odLabelMatch[1].trim();
// //     result.odExpireDate = odLabelMatch[2].trim();
// //   }
// //   if (tpLabelMatch) {
// //     result.tpExpireDate = tpLabelMatch[2].trim();
// //   }

// //   if (result.tpExpireDate === "-") {
// //     const twoRanges = fullText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
// //     if (twoRanges) {
// //       if (result.startDate === "-") result.startDate = twoRanges[1].trim();
// //       if (result.odExpireDate === "-") result.odExpireDate = twoRanges[2].trim();
// //       result.tpExpireDate = twoRanges[4].trim(); 
// //     }
// //   }

// //   if (result.tpExpireDate === "-") {
// //     const rangeRegex = /([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+(?:to|Till|until|Midnight of)\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/gi;
// //     const matches = [];
// //     let match;
// //     while ((match = rangeRegex.exec(fullText)) !== null) {
// //       matches.push({ start: match[1].trim(), end: match[2].trim() });
// //     }
// //     if (matches.length >= 2) {
// //       if (result.startDate === "-") result.startDate = matches[0].start;
// //       if (result.odExpireDate === "-") result.odExpireDate = matches[0].end;
// //       result.tpExpireDate = matches[1].end;
// //     } else if (matches.length === 1) {
// //       if (result.startDate === "-") result.startDate = matches[0].start;
// //       if (result.odExpireDate === "-") result.odExpireDate = matches[0].end;
// //       if (result.tpExpireDate === "-") result.tpExpireDate = matches[0].end;
// //     }
// //   }

// //   return result;
// // };

// // const extractDateOfIssue = (text = "") => {
// //   let issueDate = text.match(/Policy Issued [Oo]n\s*:\s*([A-Za-z]+\s*\d{1,2},\s*\d{4})/i)?.[1];
// //   if (!issueDate) {
// //     const receiptMatch = text.match(/Receipt Date\s+([0-9]{2}-[0-9]{2}-[0-9]{4})/i);
// //     if (receiptMatch) issueDate = receiptMatch[1];
// //   }
// //   return issueDate || "-";
// // };

// // const extractIDV = (text = "") => {
// //   if (!text) return "-";
// //   const tableBlock = text.match(/Total IDV\s*\(`\)([\s\S]+?)(?:Premium Details|OWN DAMAGE)/i);
// //   if (tableBlock) {
// //     const numbers = tableBlock[1].match(/\b\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?\b|\b\d{4,}\b/g);
// //     if (numbers && numbers.length > 0) {
// //       const idvCandidates = numbers.filter(n => parseFloat(n.replace(/,/g, "")) > 1000);
// //       if (idvCandidates.length > 0) {
// //         return idvCandidates[idvCandidates.length - 1].replace(/,/g, "").replace(/\.\d*$/, "");
// //       }
// //     }
// //   }

// //   const fallbackMatch = text.match(/(?:Total|Vehicle)\s*IDV\s*\(`\)\s*([\d,]+\.?\d*)/i);
// //   if (fallbackMatch && parseFloat(fallbackMatch[1].replace(/,/g, "")) > 1000) {
// //     return fallbackMatch[1].replace(/,/g, "").replace(/\.\d*$/, "");
// //   }

// //   return "-";
// // };

// // const extractPreviousPolicyNumber = (text = "") => {
// //   return text?.match(/Previous\s+Policy\s+No\.[\s\S]*?\n?\s*([A-Z0-9/-]{10,})/i)?.[1]?.trim() || "-";
// // };

// // const extractPreviousInsurer = (text = "") => {
// //   if (!text) return "-";
// //   return text.match(/\d{2}-\d{2}-\d{4}\s+to\s+\d{2}-\d{2}-\d{4}\s+\d+%\s+\d+\s+([A-Z]+)\s+(?:Comprehensive|Package|Liability|Third|Party|Insurance|Details)/i)?.[1]?.trim() || 
// //          text.match(/\d{2}-\d{2}-\d{4}\s+to\s+\d{2}-\d{2}-\d{4}\s+\d+%\s+\d+\s+([A-Z]{2,20})\b/i)?.[1]?.trim() || "-";
// // };

// // const extractPremiumData = (text = "") => {
// //   const result = {
// //     calculatedOdPremium: "-", 
// //     calculatedTpPremium: "-", 
// //     totalOdPremium: "0", 
// //     totalTpPremium: "0", 
// //     netPremium: "0", 
// //     gst: "0", 
// //     totalPayable: "0"
// //   };
  
// //   if (!text) return result;
  
// //   const extractVal = (regex) => text.match(regex)?.[1]?.replace(/,/g, "") || "";

// //   result.totalOdPremium = extractVal(/Total Own Damage Premium\(A\)\s*\n?\s*([\d,]+\.?\d*)/i) || "0";
// //   result.totalTpPremium = extractVal(/Total Liability Premium\s*\(B\)\s*`?\s*([\d,]+\.?\d*)/i) || "0";
  
// //   result.netPremium = extractVal(/Total Package Premium\s*\(A\+B\)\s*:?\s*([\d,]+\.?\d*)/i) || 
// //                       extractVal(/Total Premium\s*:?\s*`?\s*([\d,]+\.?\d*)/i) || 
// //                       extractVal(/Total Own Damage Premium\(A\) \s*:?\s*`?\s*([\d,]+\.?\d*)/i) || 
// //                       extractVal(/Total Premium Payable In\s+`\s*([\d,]+\.?\d*)/i);

// //   if (!result.netPremium || result.netPremium === "0") {
// //     const od = parseFloat(result.totalOdPremium) || 0;
// //     const tp = parseFloat(result.totalTpPremium) || 0;
// //     if (od > 0 || tp > 0) result.netPremium = (od + tp).toFixed(2).replace(/\.00$/, "");
// //   }
  
// //   // Safe GST / IGST calculation
// //   const cgstMatch = text.match(/CGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);
// //   const sgstMatch = text.match(/SGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);
// //   const igstMatch = text.match(/IGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);

// //   const cgstAmount = cgstMatch ? parseFloat(cgstMatch[1].replace(/,/g, "")) : 0;
// //   const sgstAmount = sgstMatch ? parseFloat(sgstMatch[1].replace(/,/g, "")) : 0;
// //   const igstAmount = igstMatch ? parseFloat(igstMatch[1].replace(/,/g, "")) : 0;

// //   const totalGst = cgstAmount + sgstAmount + igstAmount;
// //   if (totalGst > 0) {
// //     result.gst = totalGst.toFixed(2);
// //   }
  
// //   result.totalPayable = extractVal(/Total Premium Payable In\s+`\s*([\d,]+\.?\d*)/i) || extractVal(/Total Premium Payable\s*:?\s*`?\s*([\d,]+\.?\d*)/i) || "0";
  
// //   return result;
// // };

// // // =======================================
// // // VEHICLE EXTRACTION (FULLY DYNAMIC)
// // // =======================================

// // // const extractVehicleDetailsFromText = (text = "") => {
// // //   const result = {
// // //     registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-", model: "-",
// // //     variant: "-", gvw: "-", manufacturingYear: "-", fuelType: "-", cubicCapacity: "-", 
// // //     seatingCapacity: "-", geographicalArea: "-", financierName: "-", idv: "-", ncb: "0%"
// // //   };
  
// // //   if (!text || typeof text !== "string") return result;
  
// // //   const normalizedText = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
// // //   const textWithoutHeaders = normalizedText.replace(/Vehicle Registration No\.?\s*Make\s*Model\s*Type of Body\s*CC\/KW\s*Mfg Yr\s*Seating Capacity\s*Chassis No\.?\s*Engine No\.?/gi, " ");

// // //   const applyVariantSplit = (rawModelString) => {
// // //     if (!rawModelString) return;
// // //     const words = rawModelString.split(/\s+/);
// // //     let variantStart = -1;
// // //     const variantPattern = /^(LXI|VXI|ZXI|ZXI\+|ALPHA|DELTA|SIGMA|ZETA|SMART|HYBRID|SPORT|SPORTS|PLUS|AGS|AMT|CVT|AT|PETROL|DIESEL|CNG|EV|ELECTRIC|STD|DLX|VX|ZX|LX|EX|SX|DISC|DRUM|OBD|OBD2|OBD2B|BS4|BS6|SPECIAL|EDITION|RACE|DELUXE|PRO|ABS|CBS|CRYSTA|\d\.\d[A-Z]*)$/i;
    
// // //     for (let i = 0; i < words.length; i++) {
// // //       if (variantPattern.test(words[i])) {
// // //         variantStart = i;
// // //         break;
// // //       }
// // //     }
    
// // //     if (variantStart > 0) {
// // //       result.model = words.slice(0, variantStart).join(" ").trim();
// // //       result.variant = words.slice(variantStart).join(" ").trim();
// // //     } else if (variantStart === 0) {
// // //        result.model = "-";
// // //        result.variant = rawModelString;
// // //     } else {
// // //       result.model = rawModelString;
// // //       result.variant = "-";
// // //     }
// // //   };

// // //   const slashMakeModel = text.match(/([A-Za-z0-9&]+(?:\s+[A-Za-z0-9&]+){0,4})\s*\/\s*([A-Za-z0-9\s.\-\/]+?)(?:\s+[A-Z]{3,}(?:\s+[A-Z]{3,})?\s*-\s*[A-Z]{3,}|$|\n)/i);
// // //   if (slashMakeModel) {
// // //     let rawMake = slashMakeModel[1].trim();
// // //     rawMake = rawMake.replace(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{4}|\bto\b|Midnight of|Midnight|\b\d{4}\b)\s*/gi, "").trim();
// // //     result.make = rawMake;
    
// // //     let rawModel = slashMakeModel[2].trim();
// // //     rawModel = rawModel.replace(/\s+[A-Z]{3,}(?:\s+[A-Z]{3,})?\s*-\s*[A-Z]{3,}.*/i, "");
// // //     rawModel = rawModel.replace(/\s+(MADHYA PRADESH|CHHATTISGARH|MAHARASHTRA|GUJARAT|RAJASTHAN|UTTAR PRADESH|ANDHRA PRADESH|TAMIL NADU|WEST BENGAL).*$/i, "");
// // //     rawModel = rawModel.replace(/\s*\b/i, "");
    
// // //     applyVariantSplit(rawModel.trim());
// // //   }

// // //   const raRowMatch = textWithoutHeaders.match(/([A-Z]{2}[0-9]{1,2}[A-Z]*[0-9]{4})\s+[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+([A-Z0-9]{5,25})\s+([A-Z0-9]{17})\s+\d{1,3}%/i);
// // //   if (raRowMatch) {
// // //     if (result.registrationNumber === "-") result.registrationNumber = raRowMatch[1];
// // //     if (result.engineNumber === "-") result.engineNumber = raRowMatch[2];
// // //     if (result.chassisNumber === "-") result.chassisNumber = raRowMatch[3];
// // //   }

// // //   const specsMatch = textWithoutHeaders.match(/\b([A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s+(\d{2,5})\s+(19\d{2}|20\d{2})\s+(\d{1,3})\b/);
// // //   if (specsMatch) {
// // //     if (result.cubicCapacity === "-") result.cubicCapacity = specsMatch[2];
// // //     if (result.manufacturingYear === "-") result.manufacturingYear = specsMatch[3];
// // //     if (result.seatingCapacity === "-") result.seatingCapacity = specsMatch[4];
// // //   }

// // //   const parseDynamicMakeModelBody = (combinedString) => {
// // //     if (!combinedString) return;
// // //     let remainingString = combinedString.trim();
    
// // //     if (result.make !== "-" && remainingString.toUpperCase().includes(result.make.toUpperCase())) {
// // //       remainingString = remainingString.replace(new RegExp(result.make, 'i'), "").trim();
// // //     } else if (result.make === "-") {
// // //       const parts = remainingString.split(/\s+/);
// // //       result.make = parts[0] || "-";
// // //       remainingString = parts.slice(1).join(" ").trim();
// // //     }
    
// // //     let modelRaw = remainingString.replace(/\s*\bSEATER\b/i, "");
// // //     if (result.model === "-") applyVariantSplit(modelRaw);
// // //   };

// // //   const tablePattern = /(NEW|[A-Z0-9]{8,11})\s+([A-Za-z0-9\s.-]+?)\s+(\d{2,5})\s+(\d{4})\s+(\d{1,2})\s+([A-Z0-9\s]{15,20})\s+([A-Z0-9]{10,15})/i;
// // //   const tableMatch = textWithoutHeaders.match(tablePattern);
// // //   if (tableMatch) {
// // //     if (result.registrationNumber === "-") result.registrationNumber = tableMatch[1].trim();
// // //     parseDynamicMakeModelBody(tableMatch[2]);
// // //     if (result.chassisNumber === "-") result.chassisNumber = tableMatch[6].replace(/\s+/g, ""); 
// // //     if (result.engineNumber === "-") result.engineNumber = tableMatch[7].trim();
// // //   }

// // //   if (result.make === "-" || result.model === "-") {
// // //     const partialPattern = /(NEW|[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4})\s+([A-Z0-9\s.-]{5,50})(?=\s+(?:\d{2,4}\b|$))/i;
// // //     const partialMatch = textWithoutHeaders.match(partialPattern);
// // //     if (partialMatch) {
// // //       if (result.registrationNumber === "-") result.registrationNumber = partialMatch[1].trim();
// // //       parseDynamicMakeModelBody(partialMatch[2]);
// // //     }
// // //   }

// // //   if (result.registrationNumber === "-") {
// // //     const regMatch = textWithoutHeaders.match(/Vehicle Registration No\.?\s*\.?\s*(NEW|[A-Z0-9]+)/i);
// // //     if (regMatch?.[1]) result.registrationNumber = regMatch[1].trim();
// // //   }
  
// // //   if (result.chassisNumber === "-") {
// // //     const chassisMatch = textWithoutHeaders.match(/Chassis No\.?\s*\.?\s*([A-Z0-9]+)/i);
// // //     if (chassisMatch?.[1]) result.chassisNumber = chassisMatch[1].trim();
// // //   }

// // //   if (result.engineNumber === "-" || result.engineNumber.length < 8 || /^\d+$/.test(result.engineNumber)) {
// // //     const vehicleSection = textWithoutHeaders.match(/Vehicle Registration No[\s\S]*?Vehicle IDV/i);
// // //     if (vehicleSection?.[0]) {
// // //       const values = vehicleSection[0].match(/\b[A-Z0-9]{10,25}\b/g) || [];
// // //       const engineCandidate = values[values.length - 1];
// // //       if (engineCandidate && engineCandidate !== result.registrationNumber) {
// // //         result.engineNumber = engineCandidate;
// // //       }
// // //     }
// // //   }

// // //   if (result.idv === "-") {
// // //     let idvMatch = textWithoutHeaders.match(/Vehicle IDV\s*\(`\)\s*([\d,]+\.?\d*)/i) || textWithoutHeaders.match(/Total IDV\s*\(`\)\s*([\d,]+\.?\d*)/i);
// // //     if (idvMatch?.[1] && parseFloat(idvMatch[1].replace(/,/g, "")) > 1000) {
// // //       result.idv = idvMatch[1].replace(/,/g, "").replace(/\.\d*$/, "");
// // //     }
// // //   }

// // //   const fuelMatch = textWithoutHeaders.match(/Type of fuel\s*[:\-]?\s*([A-Za-z\s]+?)(?=\s*(?:Cubic|CC|Engine|$))/i);
// // //   if (fuelMatch?.[1]) result.fuelType = fuelMatch[1].trim().toUpperCase();
// // //   if (result.fuelType === "-") {
// // //     const nearFuelMatch = textWithoutHeaders.match(/fuel\s+([A-Za-z]+)/i);
// // //     if (nearFuelMatch?.[1]) result.fuelType = nearFuelMatch[1].toUpperCase();
// // //   }
  
// // //   const geoMatch = textWithoutHeaders.match(/Geographical Area\s*:\s*([A-Za-z\s]+?)(?=\s+(?:Applicable|Compulsory|CERTIFICATE|$))/i);
// // //   if (geoMatch?.[1]) result.geographicalArea = geoMatch[1].trim();
  
// // //   const finMatch = textWithoutHeaders.match(/Hypothecated To\s*:\s*([^,\n]+(?:[,\s]+[A-Z]+)?)/i);
// // //   if (finMatch?.[1]) {
// // //     const financierValue = finMatch[1].trim();
// // //     if (financierValue !== "" && financierValue.toLowerCase() !== "none") {
// // //       result.financierName = typeof formatFinancierName === 'function' ? formatFinancierName(financierValue) : financierValue;
// // //     }
// // //   }

// // //   const validNcbSlabs = ["0", "20", "25", "35", "45", "50"];
// // //   const ncbPatterns = [
// // //     /No\s*Claim\s*Bonus[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
// // //     /\bNCB(?:\s*(?:Discount|Percentage|Applicable))?[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
// // //     /\bNCB\s*\(\s*%\s*\)[\s:\-]*(\d{1,2}(?:\.\d+)?)/i,
// // //     /Deduct\s*(\d{1,2}(?:\.\d+)?)\s*%?\s*for\s*NCB/i
// // //   ];
  
// // //   for (const pattern of ncbPatterns) {
// // //     const match = text.match(pattern);
// // //     if (match?.[1]) {
// // //       const extractedNum = parseInt(match[1], 10).toString();
// // //       if (validNcbSlabs.includes(extractedNum)) {
// // //         result.ncb = `${extractedNum}%`; 
// // //         break;
// // //       }
// // //     }
// // //   }
  
// // //   const gvwMatch = textWithoutHeaders.match(/Gross Vehicle Weight\s*[:\-]?\s*([\d,]+)/i);
// // //   if (gvwMatch?.[1]) result.gvw = gvwMatch[1];

// // //   if (result.make !== "-") result.make = result.make.replace(/[,;:]/g, "").trim();
// // //   if (result.model !== "-") result.model = result.model.replace(/[,;:]/g, "").trim();

// // //   return result;
// // // };

// // const extractVehicleDetailsFromText = (text = "") => {
// //   const result = {
// //     registrationNumber: "-",
// //     chassisNumber: "-",
// //     engineNumber: "-",
// //     make: "-",
// //     model: "-",
// //     variant: "-",
// //     gvw: "-",
// //     manufacturingYear: "-",
// //     fuelType: "-",
// //     cubicCapacity: "-",
// //     seatingCapacity: "-",
// //     geographicalArea: "-",
// //     financierName: "-",
// //     idv: "-",
// //     ncb: "0%"
// //   };

// //   if (!text || typeof text !== "string") return result;

// //   const normalizedText = String(text)
// //     .replace(/\r/g, " ")
// //     .replace(/\n/g, " ")
// //     .replace(/\t/g, " ")
// //     .replace(/\u00a0/g, " ")
// //     .replace(/[ ]{2,}/g, " ")
// //     .trim();

// //   const textWithoutHeaders = normalizedText.replace(
// //     /Vehicle Registration No\.?\s*Make\s*Model\s*Type of Body\s*CC\/KW\s*Mfg Yr\s*Seating Capacity\s*Chassis No\.?\s*Engine No\.?/gi,
// //     " "
// //   );

// //   // ============================================================
// //   // COMMON HELPERS
// //   // ============================================================
// //   const cleanValue = (value = "") => {
// //     return String(value)
// //       .replace(/\s+/g, " ")
// //       .replace(/^[,;:\-\s]+|[,;:\-\s]+$/g, "")
// //       .trim();
// //   };

// //   const cleanRegistrationNumber = (value = "") => {
// //     if (!value) return "-";

// //     const cleaned = String(value)
// //       .replace(/[^A-Z0-9]/gi, "")
// //       .toUpperCase()
// //       .trim();

// //     return cleaned || "-";
// //   };

// //   const cleanIdv = (value = "") => {
// //     if (!value) return "-";

// //     const cleaned = String(value)
// //       .replace(/[₹`]/g, "")
// //       .replace(/\s+/g, "")
// //       .trim();

// //     const numericValue = Number(cleaned.replace(/,/g, ""));

// //     return Number.isFinite(numericValue) && numericValue > 1000
// //       ? cleaned
// //       : "-";
// //   };

// //   const applyVariantSplit = (rawModelString) => {
// //     if (!rawModelString) return;

// //     const cleanedModelString = cleanValue(rawModelString);
// //     if (!cleanedModelString) return;

// //     const words = cleanedModelString.split(/\s+/);
// //     let variantStart = -1;

// //     const variantPattern =
// //       /^(LXI|VXI|ZXI|ZXI\+|ALPHA|DELTA|SIGMA|ZETA|SMART|HYBRID|SPORT|SPORTS|PLUS|AGS|AMT|CVT|AT|PETROL|DIESEL|CNG|EV|ELECTRIC|STD|DLX|VX|ZX|LX|EX|SX|DISC|DRUM|OBD|OBD2|OBD2B|BS4|BS6|SPECIAL|EDITION|RACE|DELUXE|PRO|ABS|CBS|CRYSTA|\d{2,4}[A-Z]*|\d\.\d[A-Z]*)$/i;

// //     for (let i = 0; i < words.length; i++) {
// //       if (variantPattern.test(words[i])) {
// //         variantStart = i;
// //         break;
// //       }
// //     }

// //     if (variantStart > 0) {
// //       result.model = words.slice(0, variantStart).join(" ").trim();
// //       result.variant = words.slice(variantStart).join(" ").trim();
// //     } else if (variantStart === 0) {
// //       result.model = "-";
// //       result.variant = cleanedModelString;
// //     } else {
// //       result.model = cleanedModelString;
// //       result.variant = "-";
// //     }
// //   };

// //   // ============================================================
// //   // ICICI RISK ASSUMPTION LETTER:
// //   //
// //   // Vehicle Make / Model:
// //   // EICHER MOTOR / STARLINE 2090L CNG BUS
// //   //
// //   // Expected:
// //   // Make    = EICHER MOTOR
// //   // Model   = STARLINE
// //   // Variant = 2090L CNG BUS
// //   // ============================================================
// //   const riskAssumptionVehicleMatch = normalizedText.match(
// //     /Period\s+of\s+Insurance\s+Vehicle\s+Make\s*\/\s*Model[\s\S]*?\b(?:to|-)\b[\s\S]*?\d{4}\s+([A-Z][A-Z0-9&.\-\s]{1,50}?)\s*\/\s*([A-Z0-9][A-Z0-9&.\-\s]{1,80}?)(?=\s+(?:M\s*P\s*-|MP\s*-|MADHYA\s+PRADESH|CHHATTISGARH|MAHARASHTRA|GUJARAT|RAJASTHAN|UTTAR\s+PRADESH|Vehicle\s+Registration|[A-Z]{2}\s*-\s*[A-Z]))/i
// //   );

// //   if (riskAssumptionVehicleMatch) {
// //     const rawMake = cleanValue(riskAssumptionVehicleMatch[1]);
// //     const rawModelVariant = cleanValue(riskAssumptionVehicleMatch[2]);

// //     if (rawMake) {
// //       result.make = rawMake;
// //     }

// //     /*
// //      * For commercial vehicle descriptions such as:
// //      * STARLINE 2090L CNG BUS
// //      *
// //      * The first word is the model and the remaining words are the variant.
// //      */
// //     const commercialModelMatch = rawModelVariant.match(
// //       /^([A-Z][A-Z0-9&.\-]*)(?:\s+(.+))?$/i
// //     );

// //     if (commercialModelMatch) {
// //       result.model = cleanValue(commercialModelMatch[1]);
// //       result.variant = cleanValue(commercialModelMatch[2]) || "-";
// //     }
// //   }

// //   // More direct fallback for:
// //   // EICHER MOTOR / STARLINE 2090L CNG BUS M P -RAISEN-C2-C3
// //   if (result.make === "-" || result.model === "-") {
// //     const directCommercialMakeModelMatch = normalizedText.match(
// //       /\b([A-Z][A-Z0-9&.\-]*(?:\s+[A-Z][A-Z0-9&.\-]*){0,3})\s*\/\s*([A-Z][A-Z0-9&.\-]*)\s+([A-Z0-9][A-Z0-9&.\-\s]*?)(?=\s+(?:M\s*P\s*-|MP\s*-|[A-Z]{2}\s*-\s*[A-Z]+|Vehicle\s+Registration\s+No))/i
// //     );

// //     if (directCommercialMakeModelMatch) {
// //       result.make = cleanValue(directCommercialMakeModelMatch[1]);
// //       result.model = cleanValue(directCommercialMakeModelMatch[2]);
// //       result.variant = cleanValue(directCommercialMakeModelMatch[3]);
// //     }
// //   }

// //   // ============================================================
// //   // GENERAL MAKE / MODEL FALLBACK
// //   // ============================================================
// //   if (result.make === "-" || result.model === "-") {
// //     const slashMakeModel = normalizedText.match(
// //       /([A-Za-z0-9&]+(?:\s+[A-Za-z0-9&]+){0,4})\s*\/\s*([A-Za-z0-9\s.\-]+?)(?=\s+(?:[A-Z]{1,3}\s*-\s*[A-Z]{2,}|Vehicle\s+Registration\s+No|RTO\s+City|$))/i
// //     );

// //     if (slashMakeModel) {
// //       let rawMake = cleanValue(slashMakeModel[1]);

// //       rawMake = rawMake
// //         .replace(
// //           /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{4}|\bto\b|Midnight\s+of|Midnight|\b\d{4}\b)\s*/gi,
// //           ""
// //         )
// //         .trim();

// //       let rawModel = cleanValue(slashMakeModel[2]);

// //       rawModel = rawModel
// //         .replace(
// //           /\s+(MADHYA PRADESH|CHHATTISGARH|MAHARASHTRA|GUJARAT|RAJASTHAN|UTTAR PRADESH|ANDHRA PRADESH|TAMIL NADU|WEST BENGAL).*$/i,
// //           ""
// //         )
// //         .trim();

// //       if (result.make === "-" && rawMake) {
// //         result.make = rawMake;
// //       }

// //       if (result.model === "-" && rawModel) {
// //         applyVariantSplit(rawModel);
// //       }
// //     }
// //   }

// //   // ============================================================
// //   // REGISTRATION, ENGINE AND CHASSIS
// //   // Example:
// //   // MP38P0424 Sep 20, 2022 E416CCND391650 MC2FDLRT0ND507732 45%
// //   // ============================================================
// //   const raRowMatch = normalizedText.match(
// //     /\b([A-Z]{2}\s*[- ]?\s*\d{1,2}\s*[- ]?\s*[A-Z]{1,3}\s*[- ]?\s*\d{3,4})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})\s+([A-Z0-9./\-]{5,30})\s+([A-Z0-9./\-]{15,30})\s+(\d{1,3})\s*%/i
// //   );

// //   if (raRowMatch) {
// //     result.registrationNumber = cleanRegistrationNumber(raRowMatch[1]);

// //     if (result.manufacturingYear === "-") {
// //       result.manufacturingYear = raRowMatch[2];
// //     }

// //     result.engineNumber = cleanValue(raRowMatch[3]).replace(/\s+/g, "");
// //     result.chassisNumber = cleanValue(raRowMatch[4]).replace(/\s+/g, "");

// //     const currentNcb = Number(raRowMatch[5]);

// //     if ([0, 20, 25, 35, 45, 50].includes(currentNcb)) {
// //       result.ncb = `${currentNcb}%`;
// //     }
// //   }

// //   // Simpler fallback for the same row
// //   if (
// //     result.registrationNumber === "-" ||
// //     result.engineNumber === "-" ||
// //     result.chassisNumber === "-"
// //   ) {
// //     const simpleVehicleRowMatch = normalizedText.match(
// //       /\b([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})\s+([A-Z0-9./\-]{5,30})\s+([A-Z0-9./\-]{15,30})\s+(\d{1,3})\s*%/i
// //     );

// //     if (simpleVehicleRowMatch) {
// //       if (result.registrationNumber === "-") {
// //         result.registrationNumber = cleanRegistrationNumber(
// //           simpleVehicleRowMatch[1]
// //         );
// //       }

// //       if (result.manufacturingYear === "-") {
// //         result.manufacturingYear = simpleVehicleRowMatch[2];
// //       }

// //       if (result.engineNumber === "-") {
// //         result.engineNumber = simpleVehicleRowMatch[3];
// //       }

// //       if (result.chassisNumber === "-") {
// //         result.chassisNumber = simpleVehicleRowMatch[4];
// //       }

// //       const currentNcb = Number(simpleVehicleRowMatch[5]);

// //       if ([0, 20, 25, 35, 45, 50].includes(currentNcb)) {
// //         result.ncb = `${currentNcb}%`;
// //       }
// //     }
// //   }

// //   // ============================================================
// //   // REGISTRATION NUMBER FALLBACK
// //   // ============================================================
// //   if (result.registrationNumber === "-") {
// //     const registrationPatterns = [
// //       /Vehicle\s+Registration\s+No\.?\s*[:\-]?\s*(NEW|[A-Z]{2}\s*[- ]?\s*\d{1,2}\s*[- ]?\s*[A-Z]{1,3}\s*[- ]?\s*\d{3,4})/i,
// //       /\b([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\b/i
// //     ];

// //     for (const pattern of registrationPatterns) {
// //       const match = normalizedText.match(pattern);

// //       if (match?.[1]) {
// //         result.registrationNumber =
// //           match[1].toUpperCase() === "NEW"
// //             ? "NEW"
// //             : cleanRegistrationNumber(match[1]);
// //         break;
// //       }
// //     }
// //   }

// //   // ============================================================
// //   // VEHICLE REGISTRATION DATE / MANUFACTURING YEAR
// //   //
// //   // Example:
// //   // Vehicle Registration Date ... Sep 20, 2022
// //   //
// //   // When manufacturing year is unavailable, use registration year.
// //   // ============================================================
// //   if (result.manufacturingYear === "-") {
// //     const registrationDatePatterns = [
// //       /Vehicle\s+Registration\s+Date[\s\S]{0,500}?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})/i,

// //       /Registration\s+Date\s*[:\-]?\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})/i,

// //       /Registration\s+Date\s*[:\-]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-](19\d{2}|20\d{2})/i
// //     ];

// //     for (const pattern of registrationDatePatterns) {
// //       const match = normalizedText.match(pattern);

// //       if (match?.[1]) {
// //         result.manufacturingYear = match[1];
// //         break;
// //       }
// //     }
// //   }

// //   // ============================================================
// //   // TABLE DETAILS
// //   // ============================================================
// //   const specsMatch = textWithoutHeaders.match(
// //     /\b([A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s+(\d{2,5})\s+(19\d{2}|20\d{2})\s+(\d{1,3})\b/
// //   );

// //   if (specsMatch) {
// //     if (result.cubicCapacity === "-") {
// //       result.cubicCapacity = specsMatch[2];
// //     }

// //     if (result.manufacturingYear === "-") {
// //       result.manufacturingYear = specsMatch[3];
// //     }

// //     if (result.seatingCapacity === "-") {
// //       result.seatingCapacity = specsMatch[4];
// //     }
// //   }

// //   const parseDynamicMakeModelBody = (combinedString) => {
// //     if (!combinedString) return;

// //     let remainingString = cleanValue(combinedString);

// //     if (
// //       result.make !== "-" &&
// //       remainingString.toUpperCase().includes(result.make.toUpperCase())
// //     ) {
// //       remainingString = remainingString
// //         .replace(
// //           new RegExp(
// //             result.make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
// //             "i"
// //           ),
// //           ""
// //         )
// //         .trim();
// //     } else if (result.make === "-") {
// //       const parts = remainingString.split(/\s+/);

// //       result.make = parts[0] || "-";
// //       remainingString = parts.slice(1).join(" ").trim();
// //     }

// //     const modelRaw = remainingString.replace(/\s*\bSEATER\b/i, "").trim();

// //     if (result.model === "-") {
// //       applyVariantSplit(modelRaw);
// //     }
// //   };

// //   const tablePattern =
// //     /(NEW|[A-Z0-9]{8,11})\s+([A-Za-z0-9\s.-]+?)\s+(\d{2,5})\s+(\d{4})\s+(\d{1,3})\s+([A-Z0-9\s]{15,25})\s+([A-Z0-9./\-]{8,25})/i;

// //   const tableMatch = textWithoutHeaders.match(tablePattern);

// //   if (tableMatch) {
// //     if (result.registrationNumber === "-") {
// //       result.registrationNumber = cleanRegistrationNumber(tableMatch[1]);
// //     }

// //     if (result.make === "-" || result.model === "-") {
// //       parseDynamicMakeModelBody(tableMatch[2]);
// //     }

// //     if (result.cubicCapacity === "-") {
// //       result.cubicCapacity = tableMatch[3];
// //     }

// //     if (result.manufacturingYear === "-") {
// //       result.manufacturingYear = tableMatch[4];
// //     }

// //     if (result.seatingCapacity === "-") {
// //       result.seatingCapacity = tableMatch[5];
// //     }

// //     if (result.chassisNumber === "-") {
// //       result.chassisNumber = tableMatch[6].replace(/\s+/g, "");
// //     }

// //     if (result.engineNumber === "-") {
// //       result.engineNumber = tableMatch[7].replace(/\s+/g, "");
// //     }
// //   }

// //   // ============================================================
// //   // SEATING CAPACITY
// //   // Supports:
// //   // Seating Capacity: 50
// //   // Seating Capacity 50
// //   // Seating Cap 50
// //   // Seat Cap 50
// //   // 49 + 1
// //   // ============================================================
// //   if (result.seatingCapacity === "-") {
// //     const seatingPatterns = [
// //       /Seating\s+Capacity\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
// //       /Seating\s+Cap(?:acity)?\.?\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
// //       /Seat\s+Cap(?:acity)?\.?\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
// //       /Licensed\s+Carrying\s+Capacity\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
// //       /Number\s+of\s+Persons\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i
// //     ];

// //     for (const pattern of seatingPatterns) {
// //       const match = normalizedText.match(pattern);

// //       if (match?.[1]) {
// //         result.seatingCapacity = match[1].replace(/\s+/g, " ").trim();
// //         break;
// //       }
// //     }
// //   }

// //   // Commercial vehicle table fallback:
// //   // Fuel / GVW / Seating Capacity
// //   if (result.seatingCapacity === "-") {
// //     const commercialSeatingMatch = normalizedText.match(
// //       /(?:SCHOOL\s+BUS|BUS|PASSENGER\s+CARRYING\s+VEHICLE)[\s\S]{0,1200}?Seating\s+Capacity[\s\S]{0,100}?(\d{1,3})(?!\d)/i
// //     );

// //     if (commercialSeatingMatch?.[1]) {
// //       result.seatingCapacity = commercialSeatingMatch[1];
// //     }
// //   }

// //   // ============================================================
// //   // CHASSIS NUMBER
// //   // ============================================================
// //   if (result.chassisNumber === "-") {
// //     const chassisPatterns = [
// //       /Chassis\s+No\.?\s*[:\-]?\s*([A-Z0-9./\-]{12,30})/i,
// //       /Chassis\s+Number\s*[:\-]?\s*([A-Z0-9./\-]{12,30})/i
// //     ];

// //     for (const pattern of chassisPatterns) {
// //       const match = normalizedText.match(pattern);

// //       if (match?.[1]) {
// //         result.chassisNumber = match[1].replace(/\s+/g, "").trim();
// //         break;
// //       }
// //     }
// //   }

// //   // ============================================================
// //   // ENGINE NUMBER
// //   // ============================================================
// //   if (
// //     result.engineNumber === "-" ||
// //     result.engineNumber.length < 5 ||
// //     /^\d+$/.test(result.engineNumber)
// //   ) {
// //     const enginePatterns = [
// //       /Engine\s+No\.?\s*[:\-]?\s*([A-Z0-9./\-]{5,30})/i,
// //       /Engine\s+Number\s*[:\-]?\s*([A-Z0-9./\-]{5,30})/i,
// //       /Motor\s+No\.?\s*[:\-]?\s*([A-Z0-9./\-]{5,30})/i
// //     ];

// //     for (const pattern of enginePatterns) {
// //       const match = normalizedText.match(pattern);

// //       if (match?.[1]) {
// //         result.engineNumber = match[1].replace(/\s+/g, "").trim();
// //         break;
// //       }
// //     }
// //   }

// //   // ============================================================
// //   // IDV
// //   //
// //   // Supports:
// //   // Vehicle IDV (`) 2,60,000.00
// //   // Vehicle IDV ₹ 2,60,000.00
// //   // Total IDV 2,60,000.00
// //   // Insured Declared Value 2,60,000.00
// //   // IDV 2,60,000.00
// //   // ============================================================
// //   if (result.idv === "-") {
// //     const idvPatterns = [
// //       /Vehicle\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,

// //       /Total\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,

// //       /Insured(?:'s)?\s+Declared\s+Value(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,

// //       /\bIDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,

// //       /Vehicle\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+)/i,

// //       /Total\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+)/i,

// //       /Insured(?:'s)?\s+Declared\s+Value(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+)/i
// //     ];

// //     for (const pattern of idvPatterns) {
// //       const match = normalizedText.match(pattern);

// //       if (match?.[1]) {
// //         const idvValue = cleanIdv(match[1]);

// //         if (idvValue !== "-") {
// //           result.idv = idvValue;
// //           break;
// //         }
// //       }
// //     }
// //   }

// //   // IDV table fallback:
// //   // Vehicle | Sidecar | Accessories | Total
// //   // if (result.idv === "-") {
// //   //   const idvSectionMatch = normalizedText.match(
// //   //     /(?:Insured(?:'s)?\s+Declared\s+Value|IDV\s+Details|Vehicle\s+IDV)[\s\S]{0,1000}/i
// //   //   );

// //   //   if (idvSectionMatch?.[0]) {
// //   //     const amounts =
// //   //       idvSectionMatch[0].match(
// //   //         /\b\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b/g
// //   //       ) || [];

// //   //     const validAmounts = amounts.filter((amount) => {
// //   //       const value = Number(amount.replace(/,/g, ""));
// //   //       return Number.isFinite(value) && value > 1000;
// //   //     });

// //   //     if (validAmounts.length) {
// //   //       /*
// //   //        * Prefer the first amount for Vehicle IDV.
// //   //        * Do not automatically take the last number because that can be
// //   //        * Total IDV including accessories.
// //   //        */
// //   //       result.idv = validAmounts[0];
// //   //     }
// //   //   }
// //   // }

// //   if (result.idv === "-") {
// //     const tabularIdvMatch = normalizedText.match(/Total\s+IDV\s*\(`\)([\s\S]+?)(?:Premium\s+Details|OWN\s+DAMAGE)/i);
    
// //     if (tabularIdvMatch?.[1]) {
// //       const amounts = tabularIdvMatch[1].match(/\b\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?\b/g) || [];
// //       const validAmounts = amounts.filter((amount) => {
// //         const value = Number(amount.replace(/,/g, ""));
// //         return Number.isFinite(value) && value > 1000;
// //       });

// //       if (validAmounts.length > 0) {
// //         result.idv = validAmounts[validAmounts.length - 1]; 
// //       }
// //     }
// //   }

// //   // ============================================================
// //   // FUEL TYPE
// //   // ============================================================
// //   const fuelMatch = normalizedText.match(
// //     /Type\s+of\s+fuel\s*[:\-]?\s*([A-Za-z\s/]+?)(?=\s*(?:Cubic|CC|Engine|Chassis|Seating|$))/i
// //   );

// //   if (fuelMatch?.[1]) {
// //     result.fuelType = cleanValue(fuelMatch[1]).toUpperCase();
// //   }

// //   if (result.fuelType === "-") {
// //     const knownFuelMatch = [
// //       result.variant,
// //       result.model,
// //       normalizedText
// //     ]
// //       .join(" ")
// //       .match(/\b(PETROL|DIESEL|CNG|LPG|ELECTRIC|EV|HYBRID)\b/i);

// //     if (knownFuelMatch?.[1]) {
// //       result.fuelType = knownFuelMatch[1].toUpperCase();
// //     }
// //   }

// //   // ============================================================
// //   // CUBIC CAPACITY
// //   // ============================================================
// //   // ============================================================
// // // CUBIC CAPACITY
// // // ============================================================
// // if (result.cubicCapacity === "-") {
// //   const ccPatterns = [
// //     /(?:Cubic\s+Capacity|Engine\s+Capacity|CC\/KW|CC)\s*[:\-]?\s*(\d{2,5})/i,

// //     // Example:
// //     // Cubic Capacity 2956
// //     /Cubic\s+Capacity[\s\S]{0,50}?(\d{2,5})/i,

// //     // Example:
// //     // 2956 CC
// //     /\b(\d{2,5})\s*(?:CC|C\.C\.)\b/i
// //   ];

// //   for (const pattern of ccPatterns) {
// //     const match = normalizedText.match(pattern);

// //     if (match?.[1]) {
// //       const ccValue = Number(match[1]);

// //       if (ccValue >= 50 && ccValue <= 20000) {
// //         result.cubicCapacity = match[1];
// //         break;
// //       }
// //     }
// //   }
// // }

// // // Specific fallback for Eicher Starline 2090L CNG Bus
// // if (
// //   result.cubicCapacity === "-" &&
// //   /EICHER\s+MOTOR/i.test(result.make) &&
// //   /STARLINE/i.test(result.model) &&
// //   /2090L/i.test(result.variant)
// // ) {
// //   result.cubicCapacity = "2956";
// // }

// //   // ============================================================
// //   // GEOGRAPHICAL AREA
// //   // ============================================================
// //   const geoMatch = normalizedText.match(
// //     /Geographical\s+Area\s*:\s*([A-Za-z\s]+?)(?=\s+(?:Applicable|Compulsory|Certificate|Policy|$))/i
// //   );

// //   if (geoMatch?.[1]) {
// //     result.geographicalArea = cleanValue(geoMatch[1]);
// //   }

// //   // ============================================================
// //   // FINANCIER
// //   // ============================================================
// //   const financierPatterns = [
// //     /Hypothecated\s+To\s*:\s*(.+?)(?=\s+(?:Vehicle|Policy|Chassis|Engine|$))/i,
// //     /Financier\s+Name\s*:\s*(.+?)(?=\s+(?:Vehicle|Policy|Chassis|Engine|$))/i,
// //     /Agreement\s+with\s*:\s*(.+?)(?=\s+(?:Vehicle|Policy|Chassis|Engine|$))/i
// //   ];

// //   for (const pattern of financierPatterns) {
// //     const match = normalizedText.match(pattern);

// //     if (match?.[1]) {
// //       const financierValue = cleanValue(match[1]);

// //       if (
// //         financierValue &&
// //         !/^(NONE|NO|NA|N\/A|NOT APPLICABLE)$/i.test(financierValue)
// //       ) {
// //         result.financierName =
// //           typeof formatFinancierName === "function"
// //             ? formatFinancierName(financierValue)
// //             : financierValue;
// //         break;
// //       }
// //     }
// //   }

// //   // ============================================================
// //   // CURRENT YEAR NCB
// //   //
// //   // Important:
// //   // Current Year NCB = 45%
// //   // Previous Year NCB = 35%
// //   //
// //   // Prefer current-year NCB.
// //   // ============================================================
// //   const currentNcbPatterns = [
// //     /Current\s+Year\s+NCB\s*\(\s*%\s*\)\s*(\d{1,2}(?:\.\d+)?)/i,
// //     /Current\s+Year\s+NCB\s*[:\-]?\s*(\d{1,2}(?:\.\d+)?)\s*%/i,
// //     /Current\s+NCB\s*[:\-]?\s*(\d{1,2}(?:\.\d+)?)\s*%/i,
// //     /No\s+Claim\s+Bonus[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
// //     /\bNCB(?:\s*(?:Discount|Percentage|Applicable))?[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
// //     /Deduct\s*(\d{1,2}(?:\.\d+)?)\s*%?\s*for\s*NCB/i
// //   ];

// //   const validNcbSlabs = [0, 20, 25, 35, 45, 50];

// //   for (const pattern of currentNcbPatterns) {
// //     const match = normalizedText.match(pattern);

// //     if (match?.[1]) {
// //       const ncbValue = Number(match[1]);

// //       if (validNcbSlabs.includes(ncbValue)) {
// //         result.ncb = `${ncbValue}%`;
// //         break;
// //       }
// //     }
// //   }

// //   // ============================================================
// //   // GVW
// //   // ============================================================
// //   const gvwPatterns = [
// //     /Gross\s+Vehicle\s+Weight\s*[:\-]?\s*([\d,]+)/i,
// //     /\bGVW\s*[:\-]?\s*([\d,]+)/i
// //   ];

// //   for (const pattern of gvwPatterns) {
// //     const match = normalizedText.match(pattern);

// //     if (match?.[1]) {
// //       result.gvw = match[1];
// //       break;
// //     }
// //   }

// //   // ============================================================
// //   // FINAL CLEANUP
// //   // ============================================================
// //   if (result.make !== "-") {
// //     result.make = cleanValue(result.make).toUpperCase();
// //   }

// //   if (result.model !== "-") {
// //     result.model = cleanValue(result.model).toUpperCase();
// //   }

// //   if (result.variant !== "-") {
// //     result.variant = cleanValue(result.variant).toUpperCase();
// //   }

// //   if (result.registrationNumber !== "-") {
// //     result.registrationNumber =
// //       result.registrationNumber === "NEW"
// //         ? "NEW"
// //         : cleanRegistrationNumber(result.registrationNumber);
// //   }

// //   return result;
// // };
// // // =======================================
// // // REACT COMPONENT
// // // =======================================

// // function ICICIPolicyCard({ item }) {
// //   const sanitizeValue = (value) => {
// //     if (value === null || value === undefined || value === "") return "-";
// //     if (typeof value === "string" && value.trim() === "") return "-";
// //     return value;
// //   };

// //   const fullText = item?.fullText || "";
// //   const insured = item?.insuredDetails || {};
// //   const policy = item?.policyDetails || {};
// //   const vehicle = item?.vehicleDetails || {};
// //   const premium = item?.premiumDetails || {};

// //   const autoInsuredDetails = extractInsuredDetails(fullText);
// //   const extractedVehicle = extractVehicleDetailsFromText(fullText);
// //   const autoPremium = extractPremiumData(fullText);
// //   const policyDates = extractPolicyDates(fullText);

// //   // Set default missing values gracefully
// //   const finalPremium = {
// //     calculatedOdPremium: "-", 
// //     calculatedTpPremium: "-", 
// //     totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
// //     totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
// //     netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
// //     gst: premium?.gst || autoPremium?.gst || "0",
// //     totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
// //   };

// //   // Safe vehicle registration enforcement
// //   if (/^new$/i.test(extractedVehicle.registrationNumber?.trim())) {
// //     extractedVehicle.registrationNumber = "NEW";
// //   }

// //   // Merge vehicle details with the layout style of Bajaj/Indusind
// //   const mergedVehicle = {
// //     registrationNumber: vehicle?.registrationNumber || extractedVehicle.registrationNumber,
// //     chassisNumber: vehicle?.chassisNumber || extractedVehicle.chassisNumber,
// //     engineNumber: vehicle?.engineNumber || extractedVehicle.engineNumber,
// //     make: vehicle?.make || extractedVehicle.make,
// //     model: vehicle?.model || extractedVehicle.model,
// //     variant: vehicle?.variant || extractedVehicle.variant,
// //     manufacturingYear: vehicle?.manufacturingYear || extractedVehicle.manufacturingYear,
// //     fuelType: vehicle?.fuelType || extractedVehicle.fuelType,
// //     cubicCapacity: vehicle?.cubicCapacity || extractedVehicle.cubicCapacity,
// //     seatingCapacity: vehicle?.seatingCapacity || extractedVehicle.seatingCapacity,
// //     financierName: vehicle?.financierName || extractedVehicle.financierName,
// //     gvw: vehicle?.gvw || extractedVehicle.gvw,
// //     ncb: vehicle?.ncb || extractedVehicle.ncb,
// //   };

// //   if (/^new$/i.test(mergedVehicle.registrationNumber?.trim())) {
// //     mergedVehicle.registrationNumber = "NEW";
// //   }

// //   // Determine Product Type
// //   const isNewVehicle = mergedVehicle.registrationNumber === "NEW";
// //   const originalProductType = sanitizeValue(getProductType(policy?.policyType, fullText));
// //   const finalProductType = isNewVehicle ? "Bundled Policy" : originalProductType;

// //   return (
// //     <PolicyCardView
// //       item={item}
// //       policyNumber={sanitizeValue(policy?.policyNumber || fullText.match(/Policy No\.?\s*:\s*([0-9\/O]+)/i)?.[1])}
// //       insuranceCompany={sanitizeValue(extractInsuranceCompanyName(fullText))}
// //       branchAddress={sanitizeValue(extractBranchAddress(fullText))}
// //       productType={finalProductType}
// //       vehicleCategory={sanitizeValue(getVehicleCategory(policy?.policyType, fullText))}
      
// //       insuredName={sanitizeValue(insured?.insuredName || autoInsuredDetails?.insuredName)}
// //       panNumber={sanitizeValue(insured?.panNumber || autoInsuredDetails?.panNumber)}
// //       gstin={sanitizeValue(autoInsuredDetails?.gstin)}
// //       contactNumber={sanitizeValue(insured?.contactNumber || autoInsuredDetails?.contactNumber)}
// //       email={sanitizeValue(insured?.email || autoInsuredDetails?.email)}
// //       insuredAddress={sanitizeValue(insured?.insuredAddress || autoInsuredDetails?.insuredAddress)}
      
// //       policyDates={{
// //         startDate: sanitizeValue(policyDates.startDate),
// //         odExpireDate: sanitizeValue(policyDates.odExpireDate),
// //         tpExpireDate: sanitizeValue(policyDates.tpExpireDate),
// //       }}
// //       dateOfIssue={sanitizeValue(extractDateOfIssue(fullText))}
// //       totalValue={sanitizeValue(mergedVehicle.idv || extractedVehicle.idv || extractIDV(fullText))}
      
// //       previousInsurer={sanitizeValue(extractPreviousInsurer(fullText))}
// //       previousPolicyNumber={sanitizeValue(extractPreviousPolicyNumber(fullText))}
      
// //       finalPremium={finalPremium}
// //       vehicle={mergedVehicle}
// //       extractedVehicle={extractedVehicle}
// //     />
// //   );
// // }

// // export default ICICIPolicyCard;



// // src/components/ICICIPolicyCard.jsx

// import PolicyCardView from "./PolicyCardView";
// import { getProductType, getVehicleCategory } from "./PolicyClassification";

// // =======================================
// // UTILITY FUNCTIONS
// // =======================================

// const normalizeText = (text) => {
//   if (!text) return "";
//   return text.replace(/\r/g, "\n").replace(/\t/g, " ").replace(/[ ]{2,}/g, " ");
// };

// const formatFinancierName = (financier) => {
//   if (!financier) return "-";
  
//   let name = String(financier).trim();
//   if (name === "-" || name === "" || name === "N/A" || name === "NA" || name === "null") return "-";
  
//   name = name
//     .replace(/(Invoice No\.|Servicing Branch Address|Cover Note No|Policy No|Vehicle Registration|Make|Model|Chassis|Engine).*$/i, "")
//     .replace(/[\/:]/g, "")
//     .replace(/\s+/g, " ")
//     .trim();
  
//   if (!name || name.length < 3) return "-";
  
//   const isValidFinancier = /(BANK|FINANCE|LTD|HDFC|ICICI|SBI|AXIS|KOTAK|INDUSIND|BAJAJ|TATA|CHOLAMANDALAM|MUTHOOT|MANAPPURAM)/i.test(name);
//   if (!isValidFinancier) return "-";
  
//   if (name.length > 50) {
//     const shortMatch = name.match(/([A-Z]{3,}\s+(?:FINANCE|BANK)\s+[A-Z]{3,})/i);
//     if (shortMatch) return shortMatch[1].toUpperCase();
//     const bankMatch = name.match(/([A-Z\s]+(?:BANK|FINANCE)\s+(?:LTD\.?|LIMITED)?)/i);
//     if (bankMatch) return bankMatch[1].trim().toUpperCase();
//   }
//   return name.toUpperCase();
// };

// // =======================================
// // EXTRACTION FUNCTIONS
// // =======================================

// const extractInsuranceCompanyName = (fullText = "") => {
//   if (!fullText) return "-";
//   if (fullText.match(/ICICI\s*Lombard\s*General\s*Insurance\s*Company\s*Limited/i)) {
//     return "ICICI LOMBARD GENERAL INSURANCE COMPANY LIMITED";
//   }
//   const altMatch = fullText.match(/([A-Z\s]+ICICI\s*LOMBARD?\s*INSURANCE?)/i);
//   return altMatch ? altMatch[1].trim() : "ICICI LOMBARD GENERAL INSURANCE COMPANY LIMITED";
// };

// const extractBranchAddress = (fullText = "") => {
//   if (!fullText) return "-";
  
//   const servicingMatch = fullText.match(/Servicing\s*Branch\s*Address\s*:\s*([^\n]+(?:,\s*[^\n]+)*?)(?=\s+(?:Are you|Vehicle\s+Registration|Geographical\s+Area|CERTIFICATE|Policy\s+Issued\s+On|Nominee\s+Name|RTO\s+Location|Hypothecated\s+To|Make|Model|$))/i);
//   if (servicingMatch?.[1]) {
//     return servicingMatch[1].trim().replace(/\s+No\.?\s*$/, '').replace(/\s+Are\s+you.*$/, '');
//   }
  
//   const officeMatch = fullText.match(/POLICY ISSUING OFFICE:\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)\s*\n\s*([^\n]+?)(?=\s+(?:Are you|Vehicle\s+Registration|Geographical\s+Area|CERTIFICATE|$))/i);
//   if (officeMatch) {
//     return [1, 2, 3, 4]
//       .map(i => officeMatch[i]?.trim().replace(/\s+(Are you|Vehicle).*$/, ''))
//       .filter(part => part && !/^(Are you|Vehicle|Geographical|CERTIFICATE)/i.test(part))
//       .join(", ");
//   }
  
//   return "-";
// };

// const extractInsuredDetails = (text = "") => {
//   const result = { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
//   if (!text) return result;
  
//   const normalizedText = normalizeText(text);
//   let extractedName = "";

//   let nameMatch = normalizedText.match(/Dear\s+(?!Customer|Sir\/?Madam|Sir|Madam|Policyholder)([A-Za-z\s\.]+),/i);
//   if (nameMatch?.[1]) extractedName = nameMatch[1];

//   if (!extractedName) {
//     const headerMatch = normalizedText.match(/Date\s*:\s*[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+([A-Z\s\.]+?)(?=\s+(?:S\/O|D\/O|W\/O|C\/O|H\.NO|,\s*H\.NO))/i);
//     if (headerMatch?.[1]) extractedName = headerMatch[1];
//   }

//   if (!extractedName) {
//     const tableMatch = normalizedText.match(/(?:Name of Insured|Name of the Insured)[^\n]*\n+([A-Z\s\.]+?)(?=\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})/i);
//     if (tableMatch?.[1]) extractedName = tableMatch[1];
//   }

//   if (!extractedName) {
//     const kvMatch = normalizedText.match(/(?:Name of the Insured|Name of Insured|Insured'?s?\s*Name|Insured Name)\s*:?\s*([^\n]+?)(?=\s*Policy No\.|\n|$)/i);
//     if (kvMatch?.[1] && !/Period of Insurance|Vehicle Make/i.test(kvMatch[1])) {
//       extractedName = kvMatch[1];
//     }
//   }

//   if (extractedName) {
//     extractedName = extractedName.replace(/\s+/g, " ").replace(/Policy No\..*$/i, '').replace(/\s*Period of Insurance.*$/i, '').trim();
//     if (extractedName) result.insuredName = extractedName;
//   }
  
//   result.contactNumber = normalizedText.match(/Mobile\s*No\s*:\s*([X\d\*]+)/i)?.[1] || "-";
  
//   let email = normalizedText.match(/Email\s+Address\s*:?\s*([A-Z0-9._%+\-*]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)?.[1]?.trim();
//   if (!email) email = normalizedText.match(/([A-Z0-9._%+\-*]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)?.[1];
//   result.email = email || "-";
  
//   const addressPatterns = [
//     /Address\s*:\s*([\s\S]+?)(?=\n\s*(?:Period of Insurance|Mobile No|Telephone No|Email Address|GSTIN|Tenure)|$)/i,
//     /Address\s*:\s*\n\s*([^\n]+)\n\s*([^\n]+)\n\s*([^\n]+)\n\s*([^\n]+?)(?=\n\s*(?:Period of Insurance|Tenure)|$)/i,
//     /Insured'?s?\s*Address\s*([\s\S]+?)(?=\n\s*(?:Period of Insurance|Contact|Mobile|Tenure)|$)/i,
//   ];
  
//   for (const pattern of addressPatterns) {
//     const match = normalizedText.match(pattern);
//     if (match?.[1]) {
//       if (match.length > 2) {
//         result.insuredAddress = [1, 2, 3, 4].map(i => match[i]?.trim()).filter(Boolean).join(", ");
//       } else {
//         result.insuredAddress = match[1].replace(/\n+/g, ", ").replace(/[ ]{2,}/g, " ").replace(/,\s*,/g, ",").trim();
//       }
//       break;
//     }
//   }

//   if (result.insuredAddress !== "-") {
//     result.insuredAddress = result.insuredAddress.replace(/(Tenure|Period of Insurance|Mobile No|Telephone No|Email Address|GSTIN).*$/i, '').replace(/,\s*$/, '').trim() || "-";
//   }
  
//   result.gstin = normalizedText.match(/GSTIN\s*No\.?\s*\(Customer\)\s*:\s*([A-Z0-9]{15})/i)?.[1] || "-";
  
//   return result;
// };

// const extractPolicyDates = (fullText = "") => {
//   const result = { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
//   if (!fullText) return result;

//   const odLabelMatch = fullText.match(/Period of Insurance(?: - Own Damage)?\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2})?)\s*(?:to|Till|until|Midnight of)\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
//   const tpLabelMatch = fullText.match(/Period of Insurance - Third Party\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2})?)\s*(?:to|Till|until|Midnight of)\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);

//   if (odLabelMatch) {
//     result.startDate = odLabelMatch[1].trim();
//     result.odExpireDate = odLabelMatch[2].trim();
//   }
//   if (tpLabelMatch) {
//     result.tpExpireDate = tpLabelMatch[2].trim();
//   }

//   if (result.tpExpireDate === "-") {
//     const twoRanges = fullText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
//     if (twoRanges) {
//       if (result.startDate === "-") result.startDate = twoRanges[1].trim();
//       if (result.odExpireDate === "-") result.odExpireDate = twoRanges[2].trim();
//       result.tpExpireDate = twoRanges[4].trim(); 
//     }
//   }

//   if (result.tpExpireDate === "-") {
//     const rangeRegex = /([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+(?:to|Till|until|Midnight of)\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/gi;
//     const matches = [];
//     let match;
//     while ((match = rangeRegex.exec(fullText)) !== null) {
//       matches.push({ start: match[1].trim(), end: match[2].trim() });
//     }
//     if (matches.length >= 2) {
//       if (result.startDate === "-") result.startDate = matches[0].start;
//       if (result.odExpireDate === "-") result.odExpireDate = matches[0].end;
//       result.tpExpireDate = matches[1].end;
//     } else if (matches.length === 1) {
//       if (result.startDate === "-") result.startDate = matches[0].start;
//       if (result.odExpireDate === "-") result.odExpireDate = matches[0].end;
//       if (result.tpExpireDate === "-") result.tpExpireDate = matches[0].end;
//     }
//   }

//   return result;
// };

// const extractDateOfIssue = (text = "") => {
//   let issueDate = text.match(/Policy Issued [Oo]n\s*:\s*([A-Za-z]+\s*\d{1,2},\s*\d{4})/i)?.[1];
//   if (!issueDate) {
//     const receiptMatch = text.match(/Receipt Date\s+([0-9]{2}-[0-9]{2}-[0-9]{4})/i);
//     if (receiptMatch) issueDate = receiptMatch[1];
//   }
//   return issueDate || "-";
// };

// const extractIDV = (text = "") => {
//   if (!text) return "-";
//   const tableBlock = text.match(/Total IDV\s*\(`\)([\s\S]+?)(?:Premium Details|OWN DAMAGE)/i);
//   if (tableBlock) {
//     const numbers = tableBlock[1].match(/\b\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?\b|\b\d{4,}\b/g);
//     if (numbers && numbers.length > 0) {
//       const idvCandidates = numbers.filter(n => parseFloat(n.replace(/,/g, "")) > 1000);
//       if (idvCandidates.length > 0) {
//         return idvCandidates[idvCandidates.length - 1].replace(/,/g, "").replace(/\.\d*$/, "");
//       }
//     }
//   }

//   const fallbackMatch = text.match(/(?:Total|Vehicle)\s*IDV\s*\(`\)\s*([\d,]+\.?\d*)/i);
//   if (fallbackMatch && parseFloat(fallbackMatch[1].replace(/,/g, "")) > 1000) {
//     return fallbackMatch[1].replace(/,/g, "").replace(/\.\d*$/, "");
//   }

//   return "-";
// };

// const extractPreviousPolicyNumber = (text = "") => {
//   return text?.match(/Previous\s+Policy\s+No\.[\s\S]*?\n?\s*([A-Z0-9/-]{10,})/i)?.[1]?.trim() || "-";
// };

// const extractPreviousInsurer = (text = "") => {
//   if (!text) return "-";
//   return text.match(/\d{2}-\d{2}-\d{4}\s+to\s+\d{2}-\d{2}-\d{4}\s+\d+%\s+\d+\s+([A-Z]+)\s+(?:Comprehensive|Package|Liability|Third|Party|Insurance|Details)/i)?.[1]?.trim() || 
//          text.match(/\d{2}-\d{2}-\d{4}\s+to\s+\d{2}-\d{2}-\d{4}\s+\d+%\s+\d+\s+([A-Z]{2,20})\b/i)?.[1]?.trim() || "-";
// };

// const extractPremiumData = (text = "") => {
//   const result = {
//     calculatedOdPremium: "-", 
//     calculatedTpPremium: "-", 
//     totalOdPremium: "0", 
//     totalTpPremium: "0", 
//     netPremium: "0", 
//     gst: "0", 
//     totalPayable: "0"
//   };
  
//   if (!text) return result;
  
//   const extractVal = (regex) => text.match(regex)?.[1]?.replace(/,/g, "") || "";

//   result.totalOdPremium = extractVal(/Total Own Damage Premium\(A\)\s*\n?\s*([\d,]+\.?\d*)/i) || "0";
//   result.totalTpPremium = extractVal(/Total Liability Premium\s*\(B\)\s*`?\s*([\d,]+\.?\d*)/i) || "0";
  
//   result.netPremium = extractVal(/Total Package Premium\s*\(A\+B\)\s*:?\s*([\d,]+\.?\d*)/i) || 
//                       extractVal(/Total Premium\s*:?\s*`?\s*([\d,]+\.?\d*)/i) || 
//                       extractVal(/Total Own Damage Premium\(A\) \s*:?\s*`?\s*([\d,]+\.?\d*)/i) || 
//                       extractVal(/Total Premium Payable In\s+`\s*([\d,]+\.?\d*)/i);

//   if (!result.netPremium || result.netPremium === "0") {
//     const od = parseFloat(result.totalOdPremium) || 0;
//     const tp = parseFloat(result.totalTpPremium) || 0;
//     if (od > 0 || tp > 0) result.netPremium = (od + tp).toFixed(2).replace(/\.00$/, "");
//   }
  
//   // Safe GST / IGST calculation
//   const cgstMatch = text.match(/CGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);
//   const sgstMatch = text.match(/SGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);
//   const igstMatch = text.match(/IGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);

//   const cgstAmount = cgstMatch ? parseFloat(cgstMatch[1].replace(/,/g, "")) : 0;
//   const sgstAmount = sgstMatch ? parseFloat(sgstMatch[1].replace(/,/g, "")) : 0;
//   const igstAmount = igstMatch ? parseFloat(igstMatch[1].replace(/,/g, "")) : 0;
//   const totalGst = cgstAmount + sgstAmount + igstAmount;

//   const totalTaxMatch = text.match(/Total\s+Tax\s+Payable\s+in\s+`\s*([\d,]+\.?\d*)/i);
//   if (totalTaxMatch?.[1]) {
//     result.gst = totalTaxMatch[1].replace(/,/g, "");
//   } else if (totalGst > 0) {
//     result.gst = totalGst.toFixed(2);
//   }
  
//   result.totalPayable = extractVal(/Total Premium Payable In\s+`\s*([\d,]+\.?\d*)/i) || extractVal(/Total Premium Payable\s*:?\s*`?\s*([\d,]+\.?\d*)/i) || "0";
  
//   return result;
// };

// // =======================================
// // VEHICLE EXTRACTION (FULLY DYNAMIC)
// // =======================================

// const extractVehicleDetailsFromText = (text = "") => {
//   const result = {
//     registrationNumber: "-",
//     chassisNumber: "-",
//     engineNumber: "-",
//     make: "-",
//     model: "-",
//     variant: "-",
//     gvw: "-",
//     manufacturingYear: "-",
//     fuelType: "-",
//     cubicCapacity: "-",
//     seatingCapacity: "-",
//     geographicalArea: "-",
//     financierName: "-",
//     idv: "-",
//     ncb: "0%"
//   };

//   if (!text || typeof text !== "string") return result;

//   const normalizedText = String(text)
//     .replace(/\r/g, " ")
//     .replace(/\n/g, " ")
//     .replace(/\t/g, " ")
//     .replace(/\u00a0/g, " ")
//     .replace(/[ ]{2,}/g, " ")
//     .trim();

//   const textWithoutHeaders = normalizedText.replace(
//     /Vehicle Registration No\.?\s*Make\s*Model\s*Type of Body\s*CC\/KW\s*Mfg Yr\s*Seating Capacity\s*Chassis No\.?\s*Engine No\.?/gi,
//     " "
//   );

//   // ============================================================
//   // COMMON HELPERS
//   // ============================================================
//   const cleanValue = (value = "") => {
//     return String(value)
//       .replace(/\s+/g, " ")
//       .replace(/^[,;:\-\s]+|[,;:\-\s]+$/g, "")
//       .trim();
//   };

//   const cleanRegistrationNumber = (value = "") => {
//     if (!value) return "-";

//     const cleaned = String(value)
//       .replace(/[^A-Z0-9]/gi, "")
//       .toUpperCase()
//       .trim();

//     return cleaned || "-";
//   };

//   const cleanIdv = (value = "") => {
//     if (!value) return "-";

//     const cleaned = String(value)
//       .replace(/[₹`]/g, "")
//       .replace(/\s+/g, "")
//       .trim();

//     const numericValue = Number(cleaned.replace(/,/g, ""));

//     return Number.isFinite(numericValue) && numericValue > 1000
//       ? String(Math.trunc(numericValue))
//       : "-";
//   };

//   const applyVariantSplit = (rawModelString) => {
//     if (!rawModelString) return;

//     const cleanedModelString = cleanValue(rawModelString);
//     if (!cleanedModelString) return;

//     const words = cleanedModelString.split(/\s+/);
//     let variantStart = -1;

//     const variantPattern =
//       /^(LXI|VXI|ZXI|ZXI\+|ALPHA|DELTA|SIGMA|ZETA|SMART|HYBRID|SPORT|SPORTS|PLUS|AGS|AMT|CVT|AT|PETROL|DIESEL|CNG|EV|ELECTRIC|STD|DLX|VX|ZX|LX|EX|SX|DISC|DRUM|OBD|OBD2|OBD2B|BS4|BS6|SPECIAL|EDITION|RACE|DELUXE|PRO|ABS|CBS|CRYSTA|\d{2,4}[A-Z]*|\d\.\d[A-Z]*)$/i;

//     for (let i = 0; i < words.length; i++) {
//       if (variantPattern.test(words[i])) {
//         variantStart = i;
//         break;
//       }
//     }

//     if (variantStart > 0) {
//       result.model = words.slice(0, variantStart).join(" ").trim();
//       result.variant = words.slice(variantStart).join(" ").trim();
//     } else if (variantStart === 0) {
//       result.model = "-";
//       result.variant = cleanedModelString;
//     } else {
//       result.model = cleanedModelString;
//       result.variant = "-";
//     }
//   };

//   // ============================================================
//   // ICICI COMMERCIAL / BUS TABLE LAYOUT
//   // ============================================================
//   const commercialBusTableMatch = normalizedText.match(
//     /Vehicle\s+Registration\s+No\.\s+Make\s+Vehicle\s+SubClass\s+Model\s+Model\s+Build\s+Type\s+of\s+Body\s+CC\s+Mfg\s+Yr\s+Seating\s+Capacity\s+([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s+([A-Z][A-Z0-9\s&.-]+?)\s+C2\(A\)[\s\S]*?\s+([A-Z][A-Z0-9\s.-]*?\bBUS)\s+([A-Z\s]+?)\s+(Closed|Open|Saloon|Hatch\s*Back|Sedan|SUV|MUV)\s+(\d{1,5})\s+(19\d{2}|20\d{2})\s+(\d{1,3})\s+Carrying\s+Capacity\s+Chassis\s+No\.\s+Engine\s+No\.[\s\S]*?\s+\d{1,3}\s+([A-Z0-9]{8,20})\s+([A-Z0-9]{4,12})\s+([A-Z0-9]{8,25})[\s\S]*?([\d,]+(?:\.\d{1,2})?)\s+Premium\s+Details/i
//   );

//   if (commercialBusTableMatch) {
//     result.registrationNumber = cleanRegistrationNumber(commercialBusTableMatch[1]);
//     result.make = cleanValue(commercialBusTableMatch[2]);
//     result.model = cleanValue(commercialBusTableMatch[3]);
//     result.variant = cleanValue(commercialBusTableMatch[4]);
//     result.cubicCapacity = commercialBusTableMatch[6];
//     result.manufacturingYear = commercialBusTableMatch[7];
//     result.seatingCapacity = commercialBusTableMatch[8];
//     result.chassisNumber = `${commercialBusTableMatch[9]}${commercialBusTableMatch[10]}`.replace(/\s+/g, "");
//     result.engineNumber = commercialBusTableMatch[11].replace(/\s+/g, "");
//     result.idv = cleanIdv(commercialBusTableMatch[12]);
//   }

//   // ============================================================
//   // ICICI RISK ASSUMPTION LETTER:
//   // ============================================================
//   const riskAssumptionVehicleMatch = result.make === "-" || result.model === "-"
//     ? normalizedText.match(
//       /Period\s+of\s+Insurance\s+Vehicle\s+Make\s*\/\s*Model[\s\S]*?\b(?:to|-)\b[\s\S]*?\d{4}\s+([A-Z][A-Z0-9&.\-\s]{1,50}?)\s*\/\s*([A-Z0-9][A-Z0-9&.\-\s]{1,80}?)(?=\s+(?:M\s*P\s*-|MP\s*-|MADHYA\s+PRADESH|CHHATTISGARH|MAHARASHTRA|GUJARAT|RAJASTHAN|UTTAR\s+PRADESH|Vehicle\s+Registration|[A-Z]{2}\s*-\s*[A-Z]))/i
//     )
//     : null;

//   if (riskAssumptionVehicleMatch) {
//     const rawMake = cleanValue(riskAssumptionVehicleMatch[1]);
//     const rawModelVariant = cleanValue(riskAssumptionVehicleMatch[2]);

//     if (rawMake) {
//       result.make = rawMake;
//     }

//     const commercialModelMatch = rawModelVariant.match(
//       /^([A-Z][A-Z0-9&.\-]*)(?:\s+(.+))?$/i
//     );

//     if (commercialModelMatch) {
//       result.model = cleanValue(commercialModelMatch[1]);
//       result.variant = cleanValue(commercialModelMatch[2]) || "-";
//     }
//   }

//   if (result.make === "-" || result.model === "-") {
//     const directCommercialMakeModelMatch = normalizedText.match(
//       /\b([A-Z][A-Z0-9&.\-]*(?:\s+[A-Z][A-Z0-9&.\-]*){0,3})\s*\/\s*([A-Z][A-Z0-9&.\-]*)\s+([A-Z0-9][A-Z0-9&.\-\s]*?)(?=\s+(?:M\s*P\s*-|MP\s*-|[A-Z]{2}\s*-\s*[A-Z]+|Vehicle\s+Registration\s+No))/i
//     );

//     if (directCommercialMakeModelMatch) {
//       result.make = cleanValue(directCommercialMakeModelMatch[1]);
//       result.model = cleanValue(directCommercialMakeModelMatch[2]);
//       result.variant = cleanValue(directCommercialMakeModelMatch[3]);
//     }
//   }

//   // ============================================================
//   // GENERAL MAKE / MODEL FALLBACK
//   // ============================================================
//   if (result.make === "-" || result.model === "-") {
//     const slashMakeModel = normalizedText.match(
//       /([A-Za-z0-9&]+(?:\s+[A-Za-z0-9&]+){0,4})\s*\/\s*([A-Za-z0-9\s.\-]+?)(?=\s+(?:[A-Z]{1,3}\s*-\s*[A-Z]{2,}|Vehicle\s+Registration\s+No|RTO\s+City|$))/i
//     );

//     if (slashMakeModel) {
//       let rawMake = cleanValue(slashMakeModel[1]);

//       rawMake = rawMake
//         .replace(
//           /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{4}|\bto\b|Midnight\s+of|Midnight|\b\d{4}\b)\s*/gi,
//           ""
//         )
//         .trim();

//       let rawModel = cleanValue(slashMakeModel[2]);

//       rawModel = rawModel
//         .replace(
//           /\s+(MADHYA PRADESH|CHHATTISGARH|MAHARASHTRA|GUJARAT|RAJASTHAN|UTTAR PRADESH|ANDHRA PRADESH|TAMIL NADU|WEST BENGAL).*$/i,
//           ""
//         )
//         .trim();

//       if (result.make === "-" && rawMake) {
//         result.make = rawMake;
//       }

//       if (result.model === "-" && rawModel) {
//         applyVariantSplit(rawModel);
//       }
//     }
//   }

//   // ============================================================
//   // REGISTRATION, ENGINE AND CHASSIS
//   // ============================================================
//   const raRowMatch = normalizedText.match(
//     /\b([A-Z]{2}\s*[- ]?\s*\d{1,2}\s*[- ]?\s*[A-Z]{1,3}\s*[- ]?\s*\d{3,4})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})\s+([A-Z0-9./\-]{5,30})\s+([A-Z0-9./\-]{15,30})\s+(\d{1,3})\s*%/i
//   );

//   if (raRowMatch) {
//     result.registrationNumber = cleanRegistrationNumber(raRowMatch[1]);

//     if (result.manufacturingYear === "-") {
//       result.manufacturingYear = raRowMatch[2];
//     }

//     result.engineNumber = cleanValue(raRowMatch[3]).replace(/\s+/g, "");
//     result.chassisNumber = cleanValue(raRowMatch[4]).replace(/\s+/g, "");

//     const currentNcb = Number(raRowMatch[5]);

//     if ([0, 20, 25, 35, 45, 50].includes(currentNcb)) {
//       result.ncb = `${currentNcb}%`;
//     }
//   }

//   if (
//     result.registrationNumber === "-" ||
//     result.engineNumber === "-" ||
//     result.chassisNumber === "-"
//   ) {
//     const simpleVehicleRowMatch = normalizedText.match(
//       /\b([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})\s+([A-Z0-9./\-]{5,30})\s+([A-Z0-9./\-]{15,30})\s+(\d{1,3})\s*%/i
//     );

//     if (simpleVehicleRowMatch) {
//       if (result.registrationNumber === "-") {
//         result.registrationNumber = cleanRegistrationNumber(
//           simpleVehicleRowMatch[1]
//         );
//       }

//       if (result.manufacturingYear === "-") {
//         result.manufacturingYear = simpleVehicleRowMatch[2];
//       }

//       if (result.engineNumber === "-") {
//         result.engineNumber = simpleVehicleRowMatch[3];
//       }

//       if (result.chassisNumber === "-") {
//         result.chassisNumber = simpleVehicleRowMatch[4];
//       }

//       const currentNcb = Number(simpleVehicleRowMatch[5]);

//       if ([0, 20, 25, 35, 45, 50].includes(currentNcb)) {
//         result.ncb = `${currentNcb}%`;
//       }
//     }
//   }

//   // ============================================================
//   // REGISTRATION NUMBER FALLBACK
//   // ============================================================
//   if (result.registrationNumber === "-") {
//     const registrationPatterns = [
//       /Vehicle\s+Registration\s+No\.?\s*[:\-]?\s*(NEW|[A-Z]{2}\s*[- ]?\s*\d{1,2}\s*[- ]?\s*[A-Z]{1,3}\s*[- ]?\s*\d{3,4})/i,
//       /\b([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\b/i
//     ];

//     for (const pattern of registrationPatterns) {
//       const match = normalizedText.match(pattern);

//       if (match?.[1]) {
//         result.registrationNumber =
//           match[1].toUpperCase() === "NEW"
//             ? "NEW"
//             : cleanRegistrationNumber(match[1]);
//         break;
//       }
//     }
//   }

//   // ============================================================
//   // VEHICLE REGISTRATION DATE / MANUFACTURING YEAR
//   // ============================================================
//   if (result.manufacturingYear === "-") {
//     const registrationDatePatterns = [
//       /Vehicle\s+Registration\s+Date[\s\S]{0,500}?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})/i,
//       /Registration\s+Date\s*[:\-]?\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})/i,
//       /Registration\s+Date\s*[:\-]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-](19\d{2}|20\d{2})/i
//     ];

//     for (const pattern of registrationDatePatterns) {
//       const match = normalizedText.match(pattern);

//       if (match?.[1]) {
//         result.manufacturingYear = match[1];
//         break;
//       }
//     }
//   }

//   // ============================================================
//   // TABLE DETAILS
//   // ============================================================
//   const specsMatch = textWithoutHeaders.match(
//     /\b([A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s+(\d{2,5})\s+(19\d{2}|20\d{2})\s+(\d{1,3})\b/
//   );

//   if (specsMatch) {
//     if (result.cubicCapacity === "-") {
//       result.cubicCapacity = specsMatch[2];
//     }

//     if (result.manufacturingYear === "-") {
//       result.manufacturingYear = specsMatch[3];
//     }

//     if (result.seatingCapacity === "-") {
//       result.seatingCapacity = specsMatch[4];
//     }
//   }

//   const parseDynamicMakeModelBody = (combinedString) => {
//     if (!combinedString) return;

//     let remainingString = cleanValue(combinedString);

//     if (
//       result.make !== "-" &&
//       remainingString.toUpperCase().includes(result.make.toUpperCase())
//     ) {
//       remainingString = remainingString
//         .replace(
//           new RegExp(
//             result.make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
//             "i"
//           ),
//           ""
//         )
//         .trim();
//     } else if (result.make === "-") {
//       const parts = remainingString.split(/\s+/);

//       result.make = parts[0] || "-";
//       remainingString = parts.slice(1).join(" ").trim();
//     }

//     const modelRaw = remainingString.replace(/\s*\bSEATER\b/i, "").trim();

//     if (result.model === "-") {
//       applyVariantSplit(modelRaw);
//     }
//   };

//   const tablePattern =
//     /(NEW|[A-Z0-9]{8,11})\s+([A-Za-z0-9\s.-]+?)\s+(\d{2,5})\s+(\d{4})\s+(\d{1,3})\s+([A-Z0-9\s]{15,25})\s+([A-Z0-9./\-]{8,25})/i;

//   const tableMatch = textWithoutHeaders.match(tablePattern);

//   if (tableMatch) {
//     if (result.registrationNumber === "-") {
//       result.registrationNumber = cleanRegistrationNumber(tableMatch[1]);
//     }

//     if (result.make === "-" || result.model === "-") {
//       parseDynamicMakeModelBody(tableMatch[2]);
//     }

//     if (result.cubicCapacity === "-") {
//       result.cubicCapacity = tableMatch[3];
//     }

//     if (result.manufacturingYear === "-") {
//       result.manufacturingYear = tableMatch[4];
//     }

//     if (result.seatingCapacity === "-") {
//       result.seatingCapacity = tableMatch[5];
//     }

//     if (result.chassisNumber === "-") {
//       result.chassisNumber = tableMatch[6].replace(/\s+/g, "");
//     }

//     if (result.engineNumber === "-") {
//       result.engineNumber = tableMatch[7].replace(/\s+/g, "");
//     }
//   }

//   // ============================================================
//   // SEATING CAPACITY
//   // ============================================================
//   if (result.seatingCapacity === "-") {
//     const seatingPatterns = [
//       /Seating\s+Capacity\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
//       /Seating\s+Cap(?:acity)?\.?\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
//       /Seat\s+Cap(?:acity)?\.?\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
//       /Licensed\s+Carrying\s+Capacity\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
//       /Number\s+of\s+Persons\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
//       /(?:19\d{2}|20\d{2})\s+(\d{1,3})\s+Carrying\s+Capacity/i
//     ];

//     for (const pattern of seatingPatterns) {
//       const match = normalizedText.match(pattern);

//       if (match?.[1]) {
//         result.seatingCapacity = match[1].replace(/\s+/g, " ").trim();
//         break;
//       }
//     }
//   }

//   if (result.seatingCapacity === "-") {
//     const commercialSeatingMatch = normalizedText.match(
//       /(?:SCHOOL\s+BUS|BUS|PASSENGER\s+CARRYING\s+VEHICLE)[\s\S]{0,1200}?Seating\s+Capacity[\s\S]{0,100}?(\d{1,3})(?!\d)/i
//     );

//     if (commercialSeatingMatch?.[1]) {
//       result.seatingCapacity = commercialSeatingMatch[1];
//     }
//   }

//   // ============================================================
//   // CHASSIS NUMBER
//   // ============================================================
//   if (result.chassisNumber === "-") {
//     const chassisPatterns = [
//       /Chassis\s+No\.?\s*[:\-]?\s*([A-Z0-9./\-]{12,30})/i,
//       /Chassis\s+Number\s*[:\-]?\s*([A-Z0-9./\-]{12,30})/i
//     ];

//     for (const pattern of chassisPatterns) {
//       const match = normalizedText.match(pattern);

//       if (match?.[1]) {
//         result.chassisNumber = match[1].replace(/\s+/g, "").trim();
//         break;
//       }
//     }
//   }

//   // ============================================================
//   // ENGINE NUMBER
//   // ============================================================
//   if (
//     result.engineNumber === "-" ||
//     result.engineNumber.length < 5 ||
//     /^\d+$/.test(result.engineNumber)
//   ) {
//     const enginePatterns = [
//       /Engine\s+No\.?\s*[:\-]?\s*([A-Z0-9./\-]{5,30})/i,
//       /Engine\s+Number\s*[:\-]?\s*([A-Z0-9./\-]{5,30})/i,
//       /Motor\s+No\.?\s*[:\-]?\s*([A-Z0-9./\-]{5,30})/i
//     ];

//     for (const pattern of enginePatterns) {
//       const match = normalizedText.match(pattern);

//       if (match?.[1]) {
//         result.engineNumber = match[1].replace(/\s+/g, "").trim();
//         break;
//       }
//     }
//   }

//   // ============================================================
//   // IDV
//   // ============================================================
//   if (result.idv === "-") {
//     const idvPatterns = [
//       /Vehicle\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,
//       /Total\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,
//       /Insured(?:'s)?\s+Declared\s+Value(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,
//       /\bIDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,
//       /Vehicle\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+)/i,
//       /Total\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+)/i,
//       /Insured(?:'s)?\s+Declared\s+Value(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+)/i
//     ];

//     for (const pattern of idvPatterns) {
//       const match = normalizedText.match(pattern);

//       if (match?.[1]) {
//         const idvValue = cleanIdv(match[1]);

//         if (idvValue !== "-") {
//           result.idv = idvValue;
//           break;
//         }
//       }
//     }
//   }

//   // Tabular Format handling separated headers & values
//   if (result.idv === "-") {
//     const tabularIdvMatch = normalizedText.match(/Total\s+IDV\s*\(`\)([\s\S]+?)(?:Premium\s+Details|OWN\s+DAMAGE)/i);
    
//     if (tabularIdvMatch?.[1]) {
//       const amounts = tabularIdvMatch[1].match(/\b\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?\b|\b\d{4,}(?:\.\d{1,2})?\b/g) || [];
//       const validAmounts = amounts.filter((amount) => {
//         const value = Number(amount.replace(/,/g, ""));
//         return Number.isFinite(value) && value > 1000;
//       });

//       if (validAmounts.length > 0) {
//         result.idv = cleanIdv(validAmounts[validAmounts.length - 1]);
//       }
//     }
//   }

//   // IDV table fallback
//   if (result.idv === "-") {
//     const idvSectionMatch = normalizedText.match(
//       /(?:Insured(?:'s)?\s+Declared\s+Value|IDV\s+Details|Vehicle\s+IDV)[\s\S]{0,1000}/i
//     );

//     if (idvSectionMatch?.[0]) {
//       const amounts =
//         idvSectionMatch[0].match(
//           /\b\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b/g
//         ) || [];

//       const validAmounts = amounts.filter((amount) => {
//         const value = Number(amount.replace(/,/g, ""));
//         return Number.isFinite(value) && value > 1000;
//       });

//       if (validAmounts.length) {
//         result.idv = cleanIdv(validAmounts[0]);
//       }
//     }
//   }

//   // ============================================================
//   // FUEL TYPE
//   // ============================================================
//   const fuelMatch = normalizedText.match(
//     /Type\s+of\s+fuel\s*[:\-]?\s*([A-Za-z\s/]+?)(?=\s*(?:Cubic|CC|Engine|Chassis|Seating|$))/i
//   );

//   if (fuelMatch?.[1]) {
//     result.fuelType = cleanValue(fuelMatch[1]).toUpperCase();
//   }

//   if (result.fuelType === "-") {
//     const knownFuelMatch = [
//       result.variant,
//       result.model,
//       normalizedText
//     ]
//       .join(" ")
//       .match(/\b(PETROL|DIESEL|CNG|LPG|ELECTRIC|EV|HYBRID)\b/i);

//     if (knownFuelMatch?.[1]) {
//       result.fuelType = knownFuelMatch[1].toUpperCase();
//     }
//   }

//   // ============================================================
//   // CUBIC CAPACITY
//   // ============================================================
//   if (result.cubicCapacity === "-") {
//     const ccPatterns = [
//       /(?:Cubic\s+Capacity|Engine\s+Capacity|CC\/KW|CC)\s*[:\-]?\s*(\d{2,5})/i,
//       /Cubic\s+Capacity[\s\S]{0,50}?(\d{2,5})/i,
//       /\b(\d{2,5})\s*(?:CC|C\.C\.)\b/i
//     ];

//     for (const pattern of ccPatterns) {
//       const match = normalizedText.match(pattern);

//       if (match?.[1]) {
//         const ccValue = Number(match[1]);

//         if (ccValue >= 50 && ccValue <= 20000) {
//           result.cubicCapacity = match[1];
//           break;
//         }
//       }
//     }
//   }

//   if (
//     (result.cubicCapacity === "-" || result.cubicCapacity === "1") &&
//     /EICHER\s+MOTOR/i.test(result.make) &&
//     /STARLINE/i.test(`${result.model} ${result.variant}`) &&
//     /2090L/i.test(`${result.model} ${result.variant}`)
//   ) {
//     result.cubicCapacity = "2956";
//   }

//   // ============================================================
//   // GEOGRAPHICAL AREA
//   // ============================================================
//   const geoMatch = normalizedText.match(
//     /Geographical\s+Area\s*:\s*([A-Za-z\s]+?)(?=\s+(?:Applicable|Compulsory|Certificate|Policy|$))/i
//   );

//   if (geoMatch?.[1]) {
//     result.geographicalArea = cleanValue(geoMatch[1]);
//   }

//   // ============================================================
//   // FINANCIER
//   // ============================================================
//   const financierPatterns = [
//     /Hypothecated\s+To\s*:\s*(.+?)(?=\s+(?:Vehicle|Policy|Chassis|Engine|$))/i,
//     /Financier\s+Name\s*:\s*(.+?)(?=\s+(?:Vehicle|Policy|Chassis|Engine|$))/i,
//     /Agreement\s+with\s*:\s*(.+?)(?=\s+(?:Vehicle|Policy|Chassis|Engine|$))/i
//   ];

//   for (const pattern of financierPatterns) {
//     const match = normalizedText.match(pattern);

//     if (match?.[1]) {
//       const financierValue = cleanValue(match[1]);

//       if (
//         financierValue &&
//         !/^(NONE|NO|NA|N\/A|NOT APPLICABLE)$/i.test(financierValue)
//       ) {
//         result.financierName =
//           typeof formatFinancierName === "function"
//             ? formatFinancierName(financierValue)
//             : financierValue;
//         break;
//       }
//     }
//   }

//   // ============================================================
//   // CURRENT YEAR NCB
//   // ============================================================
//   const currentNcbPatterns = [
//     /Current\s+Year\s+NCB\s*\(\s*%\s*\)\s*(\d{1,2}(?:\.\d+)?)/i,
//     /Current\s+Year\s+NCB\s*[:\-]?\s*(\d{1,2}(?:\.\d+)?)\s*%/i,
//     /Current\s+NCB\s*[:\-]?\s*(\d{1,2}(?:\.\d+)?)\s*%/i,
//     /No\s+Claim\s+Bonus[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
//     /\bNCB(?:\s*(?:Discount|Percentage|Applicable))?[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
//     /Deduct\s*(\d{1,2}(?:\.\d+)?)\s*%?\s*for\s*NCB/i
//   ];

//   const validNcbSlabs = [0, 20, 25, 35, 45, 50];

//   for (const pattern of currentNcbPatterns) {
//     const match = normalizedText.match(pattern);

//     if (match?.[1]) {
//       const ncbValue = Number(match[1]);

//       if (validNcbSlabs.includes(ncbValue)) {
//         result.ncb = `${ncbValue}%`;
//         break;
//       }
//     }
//   }

//   // ============================================================
//   // GVW
//   // ============================================================
//   const gvwPatterns = [
//     /Gross\s+Vehicle\s+Weight\s*[:\-]?\s*([\d,]+)/i,
//     /\bGVW\s*[:\-]?\s*([\d,]+)/i
//   ];

//   for (const pattern of gvwPatterns) {
//     const match = normalizedText.match(pattern);

//     if (match?.[1]) {
//       result.gvw = match[1];
//       break;
//     }
//   }

//   // ============================================================
//   // FINAL CLEANUP
//   // ============================================================
//   if (result.make !== "-") {
//     result.make = cleanValue(result.make).toUpperCase();
//   }

//   if (result.model !== "-") {
//     result.model = cleanValue(result.model).toUpperCase();
//     const eicherStarlineMatch = result.model.match(/\b(STARLINE\s+2090L\s+CNG\s+BUS)\b/i);
//     if (/EICHER\s+MOTOR/i.test(result.make) && eicherStarlineMatch?.[1]) {
//       result.model = eicherStarlineMatch[1].toUpperCase();
//     }
//   }

//   if (result.variant !== "-") {
//     result.variant = cleanValue(result.variant).toUpperCase();
//   }

//   if (result.idv !== "-") {
//     result.idv = cleanIdv(result.idv);
//   }

//   if (result.registrationNumber !== "-") {
//     result.registrationNumber =
//       result.registrationNumber === "NEW"
//         ? "NEW"
//         : cleanRegistrationNumber(result.registrationNumber);
//   }

//   return result;
// };

// // =======================================
// // REACT COMPONENT
// // =======================================

// function ICICIPolicyCard({ item }) {
//   const sanitizeValue = (value) => {
//     if (value === null || value === undefined || value === "") return "-";
//     if (typeof value === "string" && value.trim() === "") return "-";
//     return value;
//   };

//   const fullText = item?.fullText || "";
//   const insured = item?.insuredDetails || {};
//   const policy = item?.policyDetails || {};
//   const vehicle = item?.vehicleDetails || {};
//   const premium = item?.premiumDetails || {};

//   const autoInsuredDetails = extractInsuredDetails(fullText);
//   const extractedVehicle = extractVehicleDetailsFromText(fullText);
//   const autoPremium = extractPremiumData(fullText);
//   const policyDates = extractPolicyDates(fullText);

//   // Set default missing values gracefully
//   const finalPremium = {
//     calculatedOdPremium: "-", 
//     calculatedTpPremium: "-", 
//     totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
//     totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
//     netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
//     gst: premium?.gst || autoPremium?.gst || "0",
//     totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
//   };

//   // Safe vehicle registration enforcement
//   if (/^new$/i.test(extractedVehicle.registrationNumber?.trim())) {
//     extractedVehicle.registrationNumber = "NEW";
//   }

//   // Merge vehicle details with the layout style of Bajaj/Indusind
//   const mergedVehicle = {
//     registrationNumber: vehicle?.registrationNumber || extractedVehicle.registrationNumber,
//     chassisNumber: vehicle?.chassisNumber || extractedVehicle.chassisNumber,
//     engineNumber: vehicle?.engineNumber || extractedVehicle.engineNumber,
//     make: vehicle?.make || extractedVehicle.make,
//     model: vehicle?.model || extractedVehicle.model,
//     variant: vehicle?.variant || extractedVehicle.variant,
//     manufacturingYear: vehicle?.manufacturingYear || extractedVehicle.manufacturingYear,
//     fuelType: vehicle?.fuelType || extractedVehicle.fuelType,
//     cubicCapacity: vehicle?.cubicCapacity || extractedVehicle.cubicCapacity,
//     seatingCapacity: vehicle?.seatingCapacity || extractedVehicle.seatingCapacity,
//     financierName: vehicle?.financierName || extractedVehicle.financierName,
//     gvw: vehicle?.gvw || extractedVehicle.gvw,
//     ncb: vehicle?.ncb || extractedVehicle.ncb,
//   };

//   if (/^new$/i.test(mergedVehicle.registrationNumber?.trim())) {
//     mergedVehicle.registrationNumber = "NEW";
//   }

//   // Determine Product Type
//   const isNewVehicle = mergedVehicle.registrationNumber === "NEW";
//   const originalProductType = sanitizeValue(getProductType(policy?.policyType, fullText));
//   const finalProductType = isNewVehicle ? "Bundled Policy" : originalProductType;

//   return (
//     <PolicyCardView
//       item={item}
//       policyNumber={sanitizeValue(policy?.policyNumber || fullText.match(/Policy No\.?\s*:\s*([0-9\/O]+)/i)?.[1])}
//       insuranceCompany={sanitizeValue(extractInsuranceCompanyName(fullText))}
//       branchAddress={sanitizeValue(extractBranchAddress(fullText))}
//       productType={finalProductType}
//       vehicleCategory={sanitizeValue(getVehicleCategory(policy?.policyType, fullText))}
      
//       insuredName={sanitizeValue(insured?.insuredName || autoInsuredDetails?.insuredName)}
//       panNumber={sanitizeValue(insured?.panNumber || autoInsuredDetails?.panNumber)}
//       gstin={sanitizeValue(autoInsuredDetails?.gstin)}
//       contactNumber={sanitizeValue(insured?.contactNumber || autoInsuredDetails?.contactNumber)}
//       email={sanitizeValue(insured?.email || autoInsuredDetails?.email)}
//       insuredAddress={sanitizeValue(insured?.insuredAddress || autoInsuredDetails?.insuredAddress)}
      
//       policyDates={{
//         startDate: sanitizeValue(policyDates.startDate),
//         odExpireDate: sanitizeValue(policyDates.odExpireDate),
//         tpExpireDate: sanitizeValue(policyDates.tpExpireDate),
//       }}
//       dateOfIssue={sanitizeValue(extractDateOfIssue(fullText))}
//       totalValue={sanitizeValue(mergedVehicle.idv || extractedVehicle.idv || extractIDV(fullText))}
      
//       previousInsurer={sanitizeValue(extractPreviousInsurer(fullText))}
//       previousPolicyNumber={sanitizeValue(extractPreviousPolicyNumber(fullText))}
      
//       finalPremium={finalPremium}
//       vehicle={mergedVehicle}
//       extractedVehicle={extractedVehicle}
//     />
//   );
// }

// export default ICICIPolicyCard;



import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

// =======================================
// UTILITY FUNCTIONS
// =======================================

const normalizeText = (text) => {
  if (!text) return "";
  return text.replace(/\r/g, "\n").replace(/\t/g, " ").replace(/[ ]{2,}/g, " ");
};

const formatFinancierName = (financier) => {
  if (!financier) return "-";
  
  let name = String(financier).trim();
  if (name === "-" || name === "" || name === "N/A" || name === "NA" || name === "null") return "-";
  
  name = name
    .replace(/(Invoice No\.|Servicing Branch Address|Cover Note No|Policy No|Vehicle Registration|Make|Model|Chassis|Engine).*$/i, "")
    .replace(/[\/:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  if (!name || name.length < 3) return "-";
  
  const isValidFinancier = /(BANK|FINANCE|LTD|HDFC|ICICI|SBI|AXIS|KOTAK|INDUSIND|BAJAJ|TATA|CHOLAMANDALAM|MUTHOOT|MANAPPURAM)/i.test(name);
  if (!isValidFinancier) return "-";
  
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
  if (!fullText) return "-";
  if (fullText.match(/ICICI\s*Lombard\s*General\s*Insurance\s*Company\s*Limited/i)) {
    return "ICICI LOMBARD GENERAL INSURANCE COMPANY LIMITED";
  }
  const altMatch = fullText.match(/([A-Z\s]+ICICI\s*LOMBARD?\s*INSURANCE?)/i);
  return altMatch ? altMatch[1].trim() : "ICICI LOMBARD GENERAL INSURANCE COMPANY LIMITED";
};

const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "-";
  
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
  
  return "-";
};

const extractInsuredDetails = (text = "") => {
  const result = { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
  if (!text) return result;
  
  const normalizedText = normalizeText(text);
  let extractedName = "";

  let nameMatch = normalizedText.match(/Dear\s+(?!Customer|Sir\/?Madam|Sir|Madam|Policyholder)([A-Za-z\s\.]+),/i);
  if (nameMatch?.[1]) extractedName = nameMatch[1];

  if (!extractedName) {
    const headerMatch = normalizedText.match(/Date\s*:\s*[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+([A-Z\s\.]+?)(?=\s+(?:S\/O|D\/O|W\/O|C\/O|H\.NO|,\s*H\.NO))/i);
    if (headerMatch?.[1]) extractedName = headerMatch[1];
  }

  if (!extractedName) {
    const tableMatch = normalizedText.match(/(?:Name of Insured|Name of the Insured)[^\n]*\n+([A-Z\s\.]+?)(?=\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})/i);
    if (tableMatch?.[1]) extractedName = tableMatch[1];
  }

  if (!extractedName) {
    const kvMatch = normalizedText.match(/(?:Name of the Insured|Name of Insured|Insured'?s?\s*Name|Insured Name)\s*:?\s*([^\n]+?)(?=\s*Policy No\.|\n|$)/i);
    if (kvMatch?.[1] && !/Period of Insurance|Vehicle Make/i.test(kvMatch[1])) {
      extractedName = kvMatch[1];
    }
  }

  if (extractedName) {
    extractedName = extractedName.replace(/\s+/g, " ").replace(/Policy No\..*$/i, '').replace(/\s*Period of Insurance.*$/i, '').trim();
    if (extractedName) result.insuredName = extractedName;
  }
  
  result.contactNumber = normalizedText.match(/Mobile\s*No\s*:\s*([X\d\*]+)/i)?.[1] || "-";
  
  let email = normalizedText.match(/Email\s+Address\s*:?\s*([A-Z0-9._%+\-*]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)?.[1]?.trim();
  if (!email) email = normalizedText.match(/([A-Z0-9._%+\-*]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)?.[1];
  result.email = email || "-";
  
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

  if (result.insuredAddress !== "-") {
    result.insuredAddress = result.insuredAddress.replace(/(Tenure|Period of Insurance|Mobile No|Telephone No|Email Address|GSTIN).*$/i, '').replace(/,\s*$/, '').trim() || "-";
  }
  
  result.gstin = normalizedText.match(/GSTIN\s*No\.?\s*\(Customer\)\s*:\s*([A-Z0-9]{15})/i)?.[1] || "-";
  
  return result;
};

const extractPolicyDates = (fullText = "") => {
  const result = { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  if (!fullText) return result;

  const normalizedText = normalizeText(fullText).replace(/\s+/g, " ");
  const stripPolicyTime = (value = "") =>
    String(value).replace(/\s+\d{1,2}:\d{2}$/, "").trim();

  const odLabelMatch = normalizedText.match(/Period\s+of\s+Insurance\s*-\s*Own\s+Damage\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2})?)\s*(?:to\s+Midnight\s+of|to|Till|until|Midnight of)\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i) ||
                       fullText.match(/Period of Insurance(?: - Own Damage)?\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2})?)\s*(?:to\s+Midnight\s+of|to|Till|until|Midnight of)\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  const tpLabelMatch = normalizedText.match(/Period\s+of\s+Insurance\s*-\s*Third\s+Party\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2})?)\s*(?:to\s+Midnight\s+of|to|Till|until|Midnight of)\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i) ||
                       fullText.match(/Period of Insurance - Third Party\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2})?)\s*(?:to\s+Midnight\s+of|to|Till|until|Midnight of)\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);

  if (odLabelMatch) {
    result.startDate = stripPolicyTime(odLabelMatch[1]);
    result.odExpireDate = odLabelMatch[2].trim();
  }
  if (tpLabelMatch) {
    result.tpExpireDate = tpLabelMatch[2].trim();
  }

  if (result.tpExpireDate === "-") {
    const twoRanges = fullText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
    if (twoRanges) {
      if (result.startDate === "-") result.startDate = twoRanges[1].trim();
      if (result.odExpireDate === "-") result.odExpireDate = twoRanges[2].trim();
      result.tpExpireDate = twoRanges[4].trim(); 
    }
  }

  if (result.tpExpireDate === "-") {
    const rangeRegex = /([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+(?:to|Till|until|Midnight of)\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/gi;
    const matches = [];
    let match;
    while ((match = rangeRegex.exec(fullText)) !== null) {
      matches.push({ start: match[1].trim(), end: match[2].trim() });
    }
    if (matches.length >= 2) {
      if (result.startDate === "-") result.startDate = matches[0].start;
      if (result.odExpireDate === "-") result.odExpireDate = matches[0].end;
      result.tpExpireDate = matches[1].end;
    } else if (matches.length === 1) {
      if (result.startDate === "-") result.startDate = matches[0].start;
      if (result.odExpireDate === "-") result.odExpireDate = matches[0].end;
      if (result.tpExpireDate === "-") result.tpExpireDate = matches[0].end;
    }
  }

  return result;
};

const extractDateOfIssue = (text = "") => {
  let issueDate = text.match(/Policy Issued [Oo]n\s*:\s*([A-Za-z]+\s*\d{1,2},\s*\d{4})/i)?.[1];
  if (!issueDate) {
    const receiptMatch = text.match(/Receipt Date\s+([0-9]{2}-[0-9]{2}-[0-9]{4})/i);
    if (receiptMatch) issueDate = receiptMatch[1];
  }
  return issueDate || "-";
};

const extractIDV = (text = "") => {
  if (!text) return "-";
  const compactTotalIdv = text.match(/Total\s+IDV\s*\([^)]*\)\s*([\d,]+(?:\.\d{2})?)/i);
  if (compactTotalIdv && parseFloat(compactTotalIdv[1].replace(/,/g, "")) > 1000) {
    return compactTotalIdv[1].replace(/,/g, "").replace(/\.\d*$/, "");
  }

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

  return "-";
};

const extractPreviousPolicyNumber = (text = "") => {
  return text?.match(/Previous\s+Policy\s+No\.[\s\S]*?\n?\s*([A-Z0-9/-]{10,})/i)?.[1]?.trim() || "-";
};

const normalizeICICIPolicyNumber = (value = "") => {
  return String(value || "")
    .trim()
    .replace(/[\\]+/g, "/")
    .replace(/\s*\/\s*/g, "/")
    .replace(/[^\w/-]+$/g, "")
    .toUpperCase();
};

const extractICICIPolicyNumber = (text = "") => {
  if (!text) return "-";

  const rawText = String(text);
  const labelPattern = /(?:^|[^A-Z])Policy\s*(?:No\.?|Number|#)\s*[:.]?\s*/ig;
  let match;

  while ((match = labelPattern.exec(rawText))) {
    const labelPrefix = rawText
      .slice(Math.max(0, match.index - 16), match.index)
      .toLowerCase();

    if (labelPrefix.includes("previous")) {
      continue;
    }

    const valueStart = match.index + match[0].length;
    const valueWindow = rawText.slice(valueStart, valueStart + 180);
    const valueMatch = valueWindow.match(/[A-Z0-9]+(?:\s*[\/\\]\s*[A-Z0-9]+){2,4}/i);

    if (valueMatch) {
      const policyNumber = normalizeICICIPolicyNumber(valueMatch[0]);

      if (policyNumber.includes("/") && !policyNumber.endsWith("/")) {
        return policyNumber;
      }
    }
  }

  const fallbackMatch = rawText.match(/\b[A-Z0-9]{2,}(?:\s*[\/\\]\s*[A-Z0-9]{2,}){3,4}\b/i);
  return fallbackMatch ? normalizeICICIPolicyNumber(fallbackMatch[0]) : "-";
};

const resolveICICIPolicyNumber = (candidate = "", text = "") => {
  const fromText = extractICICIPolicyNumber(text);
  const normalizedCandidate = normalizeICICIPolicyNumber(candidate);

  if (fromText !== "-") {
    if (!normalizedCandidate || normalizedCandidate.endsWith("/") || fromText.startsWith(normalizedCandidate)) {
      return fromText;
    }
  }

  return normalizedCandidate || fromText;
};

const extractPreviousInsurer = (text = "") => {
  if (!text) return "-";
  return text.match(/\d{2}-\d{2}-\d{4}\s+to\s+\d{2}-\d{2}-\d{4}\s+\d+%\s+\d+\s+([A-Z]+)\s+(?:Comprehensive|Package|Liability|Third|Party|Insurance|Details)/i)?.[1]?.trim() || 
         text.match(/\d{2}-\d{2}-\d{4}\s+to\s+\d{2}-\d{2}-\d{4}\s+\d+%\s+\d+\s+([A-Z]{2,20})\b/i)?.[1]?.trim() || "-";
};

const extractPremiumData = (text = "") => {
  const result = {
    calculatedOdPremium: "-", 
    calculatedTpPremium: "-", 
    totalOdPremium: "0", 
    totalTpPremium: "0", 
    netPremium: "0", 
    gst: "0", 
    totalPayable: "0"
  };
  
  if (!text) return result;
  
  const extractVal = (regex) => text.match(regex)?.[1]?.replace(/,/g, "") || "";

  result.totalOdPremium = extractVal(/Total Own Damage Premium\(A\)\s*\n?\s*([\d,]+\.?\d*)/i) || "0";
  result.totalTpPremium = extractVal(/Total Liability Premium\s*\(B\)\s*`?\s*([\d,]+\.?\d*)/i) || "0";
  
  result.netPremium = extractVal(/Total Package Premium\s*\(A\+B\)\s*:?\s*([\d,]+\.?\d*)/i) || 
                      extractVal(/Total Premium\s*:?\s*`?\s*([\d,]+\.?\d*)/i) || 
                      extractVal(/Total Own Damage Premium\(A\) \s*:?\s*`?\s*([\d,]+\.?\d*)/i) || 
                      extractVal(/Total Premium Payable In\s+`\s*([\d,]+\.?\d*)/i);

  if (!result.netPremium || result.netPremium === "0") {
    const od = parseFloat(result.totalOdPremium) || 0;
    const tp = parseFloat(result.totalTpPremium) || 0;
    if (od > 0 || tp > 0) result.netPremium = (od + tp).toFixed(2).replace(/\.00$/, "");
  }
  
  // Safe GST / IGST calculation
  const cgstMatch = text.match(/CGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);
  const sgstMatch = text.match(/SGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);
  const igstMatch = text.match(/IGST\s+%\s+[\d.]+\s+`\s+([\d,]+\.?\d*)/i);

  const cgstAmount = cgstMatch ? parseFloat(cgstMatch[1].replace(/,/g, "")) : 0;
  const sgstAmount = sgstMatch ? parseFloat(sgstMatch[1].replace(/,/g, "")) : 0;
  const igstAmount = igstMatch ? parseFloat(igstMatch[1].replace(/,/g, "")) : 0;
  const totalGst = cgstAmount + sgstAmount + igstAmount;

  const totalTaxMatch = text.match(/Total\s+Tax\s+Payable\s+in\s+\D*([\d,]+\.?\d*)/i);
  if (totalTaxMatch?.[1]) {
    result.gst = totalTaxMatch[1].replace(/,/g, "");
  } else if (totalGst > 0) {
    result.gst = totalGst.toFixed(2);
  }
  
  result.totalPayable = extractVal(/Total Premium Payable In\s+\D*([\d,]+\.?\d*)/i) || extractVal(/Total Premium Payable\s*:?\s*\D*([\d,]+\.?\d*)/i) || "0";
  
  return result;
};

// =======================================
// VEHICLE EXTRACTION (FULLY DYNAMIC)
// =======================================

const extractVehicleDetailsFromText = (text = "") => {
  const result = {
    registrationNumber: "-",
    chassisNumber: "-",
    engineNumber: "-",
    make: "-",
    model: "-",
    variant: "-",
    gvw: "-",
    manufacturingYear: "-",
    fuelType: "-",
    cubicCapacity: "-",
    seatingCapacity: "-",
    geographicalArea: "-",
    financierName: "-",
    commercialVehicleType: "-",
    idv: "-",
    ncb: "0%"
  };

  if (!text || typeof text !== "string") return result;

  const normalizedText = String(text)
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  const textWithoutHeaders = normalizedText.replace(
    /Vehicle Registration No\.?\s*Make\s*Model\s*Type of Body\s*CC\/KW\s*Mfg Yr\s*Seating Capacity\s*Chassis No\.?\s*Engine No\.?/gi,
    " "
  );

  // ============================================================
  // COMMON HELPERS
  // ============================================================
  const cleanValue = (value = "") => {
    return String(value)
      .replace(/\s+/g, " ")
      .replace(/^[,;:\-\s]+|[,;:\-\s]+$/g, "")
      .trim();
  };

  const cleanRegistrationNumber = (value = "") => {
    if (!value) return "-";

    const cleaned = String(value)
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase()
      .trim();

    return cleaned || "-";
  };

  const cleanIdv = (value = "") => {
    if (!value) return "-";

    const cleaned = String(value)
      .replace(/[₹`]/g, "")
      .replace(/\s+/g, "")
      .trim();

    const numericValue = Number(cleaned.replace(/,/g, ""));

    return Number.isFinite(numericValue) && numericValue > 1000
      ? String(Math.trunc(numericValue))
      : "-";
  };

  const applyVariantSplit = (rawModelString) => {
    if (!rawModelString) return;

    const cleanedModelString = cleanValue(rawModelString);
    if (!cleanedModelString) return;

    const words = cleanedModelString.split(/\s+/);
    let variantStart = -1;

    const variantPattern =
      /^(LXI|VXI|ZXI|ZXI\+|ALPHA|DELTA|SIGMA|ZETA|SMART|HYBRID|SPORT|SPORTS|PLUS|AGS|AMT|CVT|AT|PETROL|DIESEL|CNG|EV|ELECTRIC|STD|DLX|VX|ZX|LX|EX|SX|DISC|DRUM|OBD|OBD2|OBD2B|BS4|BS6|SPECIAL|EDITION|RACE|DELUXE|PRO|ABS|CBS|CRYSTA|\d{2,4}[A-Z]*|\d\.\d[A-Z]*)$/i;

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
      result.model = "-";
      result.variant = cleanedModelString;
    } else {
      result.model = cleanedModelString;
      result.variant = "-";
    }
  };

  // ============================================================
  // ICICI NEW TWO-WHEELER BUNDLED TABLE LAYOUT
  // ============================================================
  const newTwoWheelerTableMatch = normalizedText.match(
    /Vehicle\s+Registration\s+No\.?\s+Make\s*Model\s*Type\s+of\s+Body\s*CC\/KW\s*Mfg\s*Yr\s*Seating\s+Capacity\s+Chassis\s+No\.?\s*Engine\s+No\.?\s+(NEW|[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s+([A-Z]+)\s+(MOTORCYCLE|SCOOTER|MOPED)\s+(.+?)\s+(Solo\s+With\s+Pillion|Solo|Scooter|Motorcycle)\s+(\d{2,5})(20\d{2})(\d{1,2})\s+([A-Z0-9]{10,20})\s+(\d{1,6})\s+([A-Z0-9]{8,25})\b/i
  ) || normalizedText.match(
    /Vehicle\s+Registration\s+No\.?\s+Make\s*Model\s*Type\s+of\s+Body\s*CC\/KW\s*Mfg\s*Yr\s*Seating\s+Capacity\s+Chassis\s+No\.?\s*Engine\s+No\.?\s+(NEW|[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s+([A-Z]+)\s+(MOTORCYCLE|SCOOTER|MOPED)\s+(.+?)\s+(Solo\s+With\s+Pillion|Solo|Scooter|Motorcycle)\s+(\d{2,5})\s+(20\d{2})\s+(\d{1,2})\s+([A-Z0-9]{10,20})\s+(\d{1,6})\s+([A-Z0-9]{8,25})\b/i
  );

  if (newTwoWheelerTableMatch) {
    result.registrationNumber = /^NEW$/i.test(newTwoWheelerTableMatch[1])
      ? "NEW"
      : cleanRegistrationNumber(newTwoWheelerTableMatch[1]);
    result.make = cleanValue(`${newTwoWheelerTableMatch[2]} ${newTwoWheelerTableMatch[3]}`);

    const modelVariant = cleanValue(newTwoWheelerTableMatch[4]);
    const activaMatch = modelVariant.match(/^(ACTIVA\s+125)\s+(.+)$/i);
    if (activaMatch) {
      result.model = cleanValue(activaMatch[1]);
      result.variant = cleanValue(activaMatch[2]);
    } else {
      applyVariantSplit(modelVariant);
    }

    result.cubicCapacity = newTwoWheelerTableMatch[6];
    result.manufacturingYear = newTwoWheelerTableMatch[7];
    result.seatingCapacity = newTwoWheelerTableMatch[8];
    result.chassisNumber = `${newTwoWheelerTableMatch[9]}${newTwoWheelerTableMatch[10]}`.replace(/\s+/g, "");
    result.engineNumber = newTwoWheelerTableMatch[11].replace(/\s+/g, "");
  }

  // ============================================================
  // ICICI PASSENGER CARRYING / SCHOOL BUS TABLE LAYOUT
  // ============================================================
  const schoolBusTableMatch = normalizedText.match(
    /Vehicle\s+Registration\s+No\.?\s+MakeVehicle\s+SubClassModelModel\s+Build\s+Type\s+of\s+Body\s+CCMfg\s+YrSeating\s+Capacity\s+([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s+([A-Z]+)\s+(MOTORS\s+LTD)\s+C2\(A\)[\s\S]{0,220}?PASSENGERS\s+([A-Z0-9][A-Z0-9\s.-]+?)\s+(FULLY\s+BUILT|SEMI\s+BUILT|BUILT)\s+(Closed|Open|Saloon|Hatch\s*Back|Sedan|SUV|MUV)\s*(\d{3,5})(20\d{2})(\d{1,3})\s+Carrying\s+Capacity\s+Chassis\s+No\.Engine\s+No\.Body\s+IDV[\s\S]{0,160}?(\d{1,3})\s+([A-Z0-9]{10,20})\s+(\d{3,8})\s+([A-Z0-9]{5,20})(\d{1,2},\d{2},\d{3}\.\d{2})/i
  );

  if (schoolBusTableMatch) {
    result.registrationNumber = cleanRegistrationNumber(schoolBusTableMatch[1]);
    result.make = cleanValue(`${schoolBusTableMatch[2]} ${schoolBusTableMatch[3]}`);
    result.model = cleanValue(schoolBusTableMatch[4]);
    result.variant = cleanValue(schoolBusTableMatch[5]);
    result.cubicCapacity = schoolBusTableMatch[7];
    result.manufacturingYear = schoolBusTableMatch[8];
    result.seatingCapacity = schoolBusTableMatch[9];
    result.chassisNumber = `${schoolBusTableMatch[11]}${schoolBusTableMatch[12]}`.replace(/\s+/g, "");
    result.engineNumber = schoolBusTableMatch[13].replace(/\s+/g, "");
    result.idv = cleanIdv(schoolBusTableMatch[14]);
    result.commercialVehicleType = "SCHOOL BUS";
  }

  // ============================================================
  // ICICI COMMERCIAL / BUS TABLE LAYOUT
  // ============================================================
  const commercialBusTableMatch = normalizedText.match(
    /Vehicle\s+Registration\s+No\.\s+Make\s+Vehicle\s+SubClass\s+Model\s+Model\s+Build\s+Type\s+of\s+Body\s+CC\s+Mfg\s+Yr\s+Seating\s+Capacity\s+([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s+([A-Z][A-Z0-9\s&.-]+?)\s+C2\(A\)[\s\S]*?\s+([A-Z][A-Z0-9\s.-]*?\bBUS)\s+([A-Z\s]+?)\s+(Closed|Open|Saloon|Hatch\s*Back|Sedan|SUV|MUV)\s+(\d{1,5})\s+(19\d{2}|20\d{2})\s+(\d{1,3})\s+Carrying\s+Capacity\s+Chassis\s+No\.\s+Engine\s+No\.[\s\S]*?\s+\d{1,3}\s+([A-Z0-9]{8,20})\s+([A-Z0-9]{4,12})\s+([A-Z0-9]{8,25})[\s\S]*?([\d,]+(?:\.\d{1,2})?)\s+Premium\s+Details/i
  );

  if (commercialBusTableMatch) {
    result.registrationNumber = cleanRegistrationNumber(commercialBusTableMatch[1]);
    result.make = cleanValue(commercialBusTableMatch[2]);
    result.model = cleanValue(commercialBusTableMatch[3]);
    result.variant = cleanValue(commercialBusTableMatch[4]);
    result.cubicCapacity = commercialBusTableMatch[6];
    result.manufacturingYear = commercialBusTableMatch[7];
    result.seatingCapacity = commercialBusTableMatch[8];
    result.chassisNumber = `${commercialBusTableMatch[9]}${commercialBusTableMatch[10]}`.replace(/\s+/g, "");
    result.engineNumber = commercialBusTableMatch[11].replace(/\s+/g, "");
    result.idv = cleanIdv(commercialBusTableMatch[12]);
  }

  // ============================================================
  // ICICI RISK ASSUMPTION LETTER:
  // ============================================================
  const riskAssumptionVehicleMatch = result.make === "-" || result.model === "-"
    ? normalizedText.match(
      /Period\s+of\s+Insurance\s+Vehicle\s+Make\s*\/\s*Model[\s\S]*?\b(?:to|-)\b[\s\S]*?\d{4}\s+([A-Z][A-Z0-9&.\-\s]{1,50}?)\s*\/\s*([A-Z0-9][A-Z0-9&.\-\s]{1,80}?)(?=\s+(?:M\s*P\s*-|MP\s*-|MADHYA\s+PRADESH|CHHATTISGARH|MAHARASHTRA|GUJARAT|RAJASTHAN|UTTAR\s+PRADESH|Vehicle\s+Registration|[A-Z]{2}\s*-\s*[A-Z]))/i
    )
    : null;

  if (riskAssumptionVehicleMatch) {
    const rawMake = cleanValue(riskAssumptionVehicleMatch[1]);
    const rawModelVariant = cleanValue(riskAssumptionVehicleMatch[2]);

    if (rawMake) {
      result.make = rawMake;
    }

    const commercialModelMatch = rawModelVariant.match(
      /^([A-Z][A-Z0-9&.\-]*)(?:\s+(.+))?$/i
    );

    if (commercialModelMatch) {
      result.model = cleanValue(commercialModelMatch[1]);
      result.variant = cleanValue(commercialModelMatch[2]) || "-";
    }
  }

  if (result.make === "-" || result.model === "-") {
    const directCommercialMakeModelMatch = normalizedText.match(
      /\b([A-Z][A-Z0-9&.\-]*(?:\s+[A-Z][A-Z0-9&.\-]*){0,3})\s*\/\s*([A-Z][A-Z0-9&.\-]*)\s+([A-Z0-9][A-Z0-9&.\-\s]*?)(?=\s+(?:M\s*P\s*-|MP\s*-|[A-Z]{2}\s*-\s*[A-Z]+|Vehicle\s+Registration\s+No))/i
    );

    if (directCommercialMakeModelMatch) {
      result.make = cleanValue(directCommercialMakeModelMatch[1]);
      result.model = cleanValue(directCommercialMakeModelMatch[2]);
      result.variant = cleanValue(directCommercialMakeModelMatch[3]);
    }
  }

  // ============================================================
  // GENERAL MAKE / MODEL FALLBACK
  // ============================================================
  if (result.make === "-" || result.model === "-") {
    const slashMakeModel = normalizedText.match(
      /([A-Za-z0-9&]+(?:\s+[A-Za-z0-9&]+){0,4})\s*\/\s*([A-Za-z0-9\s.\-]+?)(?=\s+(?:[A-Z]{1,3}\s*-\s*[A-Z]{2,}|Vehicle\s+Registration\s+No|RTO\s+City|$))/i
    );

    if (slashMakeModel) {
      let rawMake = cleanValue(slashMakeModel[1]);

      rawMake = rawMake
        .replace(
          /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{4}|\bto\b|Midnight\s+of|Midnight|\b\d{4}\b)\s*/gi,
          ""
        )
        .trim();

      let rawModel = cleanValue(slashMakeModel[2]);

      rawModel = rawModel
        .replace(
          /\s+(MADHYA PRADESH|CHHATTISGARH|MAHARASHTRA|GUJARAT|RAJASTHAN|UTTAR PRADESH|ANDHRA PRADESH|TAMIL NADU|WEST BENGAL).*$/i,
          ""
        )
        .trim();

      if (result.make === "-" && rawMake) {
        result.make = rawMake;
      }

      if (result.model === "-" && rawModel) {
        applyVariantSplit(rawModel);
      }
    }
  }

  // ============================================================
  // REGISTRATION, ENGINE AND CHASSIS
  // ============================================================
  const raRowMatch = normalizedText.match(
    /\b([A-Z]{2}\s*[- ]?\s*\d{1,2}\s*[- ]?\s*[A-Z]{1,3}\s*[- ]?\s*\d{3,4})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})\s+([A-Z0-9./\-]{5,30})\s+([A-Z0-9./\-]{15,30})\s+(\d{1,3})\s*%/i
  );

  if (raRowMatch) {
    result.registrationNumber = cleanRegistrationNumber(raRowMatch[1]);

    if (result.manufacturingYear === "-") {
      result.manufacturingYear = raRowMatch[2];
    }

    result.engineNumber = cleanValue(raRowMatch[3]).replace(/\s+/g, "");
    result.chassisNumber = cleanValue(raRowMatch[4]).replace(/\s+/g, "");

    const currentNcb = Number(raRowMatch[5]);

    if ([0, 20, 25, 35, 45, 50].includes(currentNcb)) {
      result.ncb = `${currentNcb}%`;
    }
  }

  if (
    result.registrationNumber === "-" ||
    result.engineNumber === "-" ||
    result.chassisNumber === "-"
  ) {
    const simpleVehicleRowMatch = normalizedText.match(
      /\b([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})\s+([A-Z0-9./\-]{5,30})\s+([A-Z0-9./\-]{15,30})\s+(\d{1,3})\s*%/i
    );

    if (simpleVehicleRowMatch) {
      if (result.registrationNumber === "-") {
        result.registrationNumber = cleanRegistrationNumber(
          simpleVehicleRowMatch[1]
        );
      }

      if (result.manufacturingYear === "-") {
        result.manufacturingYear = simpleVehicleRowMatch[2];
      }

      if (result.engineNumber === "-") {
        result.engineNumber = simpleVehicleRowMatch[3];
      }

      if (result.chassisNumber === "-") {
        result.chassisNumber = simpleVehicleRowMatch[4];
      }

      const currentNcb = Number(simpleVehicleRowMatch[5]);

      if ([0, 20, 25, 35, 45, 50].includes(currentNcb)) {
        result.ncb = `${currentNcb}%`;
      }
    }
  }

  // ============================================================
  // REGISTRATION NUMBER FALLBACK
  // ============================================================
  if (result.registrationNumber === "-") {
    const registrationPatterns = [
      /Vehicle\s+Registration\s+No\.?\s*[:\-]?\s*(NEW|[A-Z]{2}\s*[- ]?\s*\d{1,2}\s*[- ]?\s*[A-Z]{1,3}\s*[- ]?\s*\d{3,4})/i,
      /\b([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\b/i
    ];

    for (const pattern of registrationPatterns) {
      const match = normalizedText.match(pattern);

      if (match?.[1]) {
        result.registrationNumber =
          match[1].toUpperCase() === "NEW"
            ? "NEW"
            : cleanRegistrationNumber(match[1]);
        break;
      }
    }
  }

  // ============================================================
  // VEHICLE REGISTRATION DATE / MANUFACTURING YEAR
  // ============================================================
  if (result.manufacturingYear === "-") {
    const registrationDatePatterns = [
      /Vehicle\s+Registration\s+Date[\s\S]{0,500}?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})/i,
      /Registration\s+Date\s*[:\-]?\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(19\d{2}|20\d{2})/i,
      /Registration\s+Date\s*[:\-]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-](19\d{2}|20\d{2})/i
    ];

    for (const pattern of registrationDatePatterns) {
      const match = normalizedText.match(pattern);

      if (match?.[1]) {
        result.manufacturingYear = match[1];
        break;
      }
    }
  }

  // ============================================================
  // TABLE DETAILS
  // ============================================================
  const specsMatch = textWithoutHeaders.match(
    /\b([A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s+(\d{2,5})\s+(19\d{2}|20\d{2})\s+(\d{1,3})\b/
  );

  if (specsMatch) {
    if (result.cubicCapacity === "-") {
      result.cubicCapacity = specsMatch[2];
    }

    if (result.manufacturingYear === "-") {
      result.manufacturingYear = specsMatch[3];
    }

    if (result.seatingCapacity === "-") {
      result.seatingCapacity = specsMatch[4];
    }
  }

  const parseDynamicMakeModelBody = (combinedString) => {
    if (!combinedString) return;

    let remainingString = cleanValue(combinedString);

    if (
      result.make !== "-" &&
      remainingString.toUpperCase().includes(result.make.toUpperCase())
    ) {
      remainingString = remainingString
        .replace(
          new RegExp(
            result.make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "i"
          ),
          ""
        )
        .trim();
    } else if (result.make === "-") {
      const parts = remainingString.split(/\s+/);

      result.make = parts[0] || "-";
      remainingString = parts.slice(1).join(" ").trim();
    }

    const modelRaw = remainingString.replace(/\s*\bSEATER\b/i, "").trim();

    if (result.model === "-") {
      applyVariantSplit(modelRaw);
    }
  };

  const tablePattern =
    /(NEW|[A-Z0-9]{8,11})\s+([A-Za-z0-9\s.-]+?)\s+(\d{2,5})\s+(\d{4})\s+(\d{1,3})\s+([A-Z0-9\s]{15,25})\s+([A-Z0-9./\-]{8,25})/i;

  const tableMatch = textWithoutHeaders.match(tablePattern);

  if (tableMatch) {
    if (result.registrationNumber === "-") {
      result.registrationNumber = cleanRegistrationNumber(tableMatch[1]);
    }

    if (result.make === "-" || result.model === "-") {
      parseDynamicMakeModelBody(tableMatch[2]);
    }

    if (result.cubicCapacity === "-") {
      result.cubicCapacity = tableMatch[3];
    }

    if (result.manufacturingYear === "-") {
      result.manufacturingYear = tableMatch[4];
    }

    if (result.seatingCapacity === "-") {
      result.seatingCapacity = tableMatch[5];
    }

    if (result.chassisNumber === "-") {
      result.chassisNumber = tableMatch[6].replace(/\s+/g, "");
    }

    if (result.engineNumber === "-") {
      result.engineNumber = tableMatch[7].replace(/\s+/g, "");
    }
  }

  // ============================================================
  // SEATING CAPACITY
  // ============================================================
  if (result.seatingCapacity === "-") {
    const seatingPatterns = [
      /Seating\s+Capacity\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
      /Seating\s+Cap(?:acity)?\.?\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
      /Seat\s+Cap(?:acity)?\.?\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
      /Licensed\s+Carrying\s+Capacity\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
      /Number\s+of\s+Persons\s*[:\-]?\s*(\d{1,3}\s*\+\s*\d{1,2}|\d{1,3})/i,
      /(?:19\d{2}|20\d{2})\s+(\d{1,3})\s+Carrying\s+Capacity/i
    ];

    for (const pattern of seatingPatterns) {
      const match = normalizedText.match(pattern);

      if (match?.[1]) {
        result.seatingCapacity = match[1].replace(/\s+/g, " ").trim();
        break;
      }
    }
  }

  if (result.seatingCapacity === "-") {
    const commercialSeatingMatch = normalizedText.match(
      /(?:SCHOOL\s+BUS|BUS|PASSENGER\s+CARRYING\s+VEHICLE)[\s\S]{0,1200}?Seating\s+Capacity[\s\S]{0,100}?(\d{1,3})(?!\d)/i
    );

    if (commercialSeatingMatch?.[1]) {
      result.seatingCapacity = commercialSeatingMatch[1];
    }
  }

  // ============================================================
  // CHASSIS NUMBER
  // ============================================================
  if (result.chassisNumber === "-") {
    const chassisPatterns = [
      /Chassis\s+No\.?\s*[:\-]?\s*([A-Z0-9./\-]{12,30})/i,
      /Chassis\s+Number\s*[:\-]?\s*([A-Z0-9./\-]{12,30})/i
    ];

    for (const pattern of chassisPatterns) {
      const match = normalizedText.match(pattern);

      if (match?.[1]) {
        result.chassisNumber = match[1].replace(/\s+/g, "").trim();
        break;
      }
    }
  }

  // ============================================================
  // ENGINE NUMBER
  // ============================================================
  if (
    result.engineNumber === "-" ||
    result.engineNumber.length < 5 ||
    /^\d+$/.test(result.engineNumber)
  ) {
    const enginePatterns = [
      /Engine\s+No\.?\s*[:\-]?\s*([A-Z0-9./\-]{5,30})/i,
      /Engine\s+Number\s*[:\-]?\s*([A-Z0-9./\-]{5,30})/i,
      /Motor\s+No\.?\s*[:\-]?\s*([A-Z0-9./\-]{5,30})/i
    ];

    for (const pattern of enginePatterns) {
      const match = normalizedText.match(pattern);

      if (match?.[1]) {
        result.engineNumber = match[1].replace(/\s+/g, "").trim();
        break;
      }
    }
  }

  // ============================================================
  // IDV
  // ============================================================
  if (result.idv === "-") {
    const idvPatterns = [
      /Vehicle\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,
      /Total\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,
      /Insured(?:'s)?\s+Declared\s+Value(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,
      /\bIDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+\.\d{1,2})/i,
      /Vehicle\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+)/i,
      /Total\s+IDV(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+)/i,
      /Insured(?:'s)?\s+Declared\s+Value(?:\s*\([^)]*\))?\s*[:\-₹`]?\s*([\d,]+)/i
    ];

    for (const pattern of idvPatterns) {
      const match = normalizedText.match(pattern);

      if (match?.[1]) {
        const idvValue = cleanIdv(match[1]);

        if (idvValue !== "-") {
          result.idv = idvValue;
          break;
        }
      }
    }
  }

  // Tabular Format handling separated headers & values
  if (result.idv === "-") {
    const tabularIdvMatch = normalizedText.match(/Total\s+IDV\s*\(`\)([\s\S]+?)(?:Premium\s+Details|OWN\s+DAMAGE)/i);
    
    if (tabularIdvMatch?.[1]) {
      const amounts = tabularIdvMatch[1].match(/\b\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?\b|\b\d{4,}(?:\.\d{1,2})?\b/g) || [];
      const validAmounts = amounts.filter((amount) => {
        const value = Number(amount.replace(/,/g, ""));
        return Number.isFinite(value) && value > 1000;
      });

      if (validAmounts.length > 0) {
        result.idv = cleanIdv(validAmounts[validAmounts.length - 1]);
      }
    }
  }

  // IDV table fallback
  if (result.idv === "-") {
    const idvSectionMatch = normalizedText.match(
      /(?:Insured(?:'s)?\s+Declared\s+Value|IDV\s+Details|Vehicle\s+IDV)[\s\S]{0,1000}/i
    );

    if (idvSectionMatch?.[0]) {
      const amounts =
        idvSectionMatch[0].match(
          /\b\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b/g
        ) || [];

      const validAmounts = amounts.filter((amount) => {
        const value = Number(amount.replace(/,/g, ""));
        return Number.isFinite(value) && value > 1000;
      });

      if (validAmounts.length) {
        result.idv = cleanIdv(validAmounts[0]);
      }
    }
  }

  // ============================================================
  // FUEL TYPE
  // ============================================================
  const fuelMatch = normalizedText.match(
    /Type\s+of\s+fuel\s*[:\-]?\s*([A-Za-z\s/]+?)(?=\s*(?:Cubic|CC|Engine|Chassis|Seating|$))/i
  );

  if (fuelMatch?.[1]) {
    result.fuelType = cleanValue(fuelMatch[1]).toUpperCase();
  }

  if (result.fuelType === "-") {
    const knownFuelMatch = [
      result.variant,
      result.model,
      normalizedText
    ]
      .join(" ")
      .match(/\b(PETROL|DIESEL|CNG|LPG|ELECTRIC|EV|HYBRID)\b/i);

    if (knownFuelMatch?.[1]) {
      result.fuelType = knownFuelMatch[1].toUpperCase();
    }
  }

  // ============================================================
  // CUBIC CAPACITY
  // ============================================================
  if (result.cubicCapacity === "-") {
    const ccPatterns = [
      /(?:Cubic\s+Capacity|Engine\s+Capacity|CC\/KW|CC)\s*[:\-]?\s*(\d{2,5})/i,
      /Cubic\s+Capacity[\s\S]{0,50}?(\d{2,5})/i,
      /\b(\d{2,5})\s*(?:CC|C\.C\.)\b/i
    ];

    for (const pattern of ccPatterns) {
      const match = normalizedText.match(pattern);

      if (match?.[1]) {
        const ccValue = Number(match[1]);

        if (ccValue >= 50 && ccValue <= 20000) {
          result.cubicCapacity = match[1];
          break;
        }
      }
    }
  }

  if (
    (result.cubicCapacity === "-" || result.cubicCapacity === "1") &&
    /EICHER\s+MOTOR/i.test(result.make) &&
    /STARLINE/i.test(`${result.model} ${result.variant}`) &&
    /2090L/i.test(`${result.model} ${result.variant}`)
  ) {
    result.cubicCapacity = "2956";
  }

  // ============================================================
  // GEOGRAPHICAL AREA
  // ============================================================
  const geoMatch = normalizedText.match(
    /Geographical\s+Area\s*:\s*([A-Za-z\s]+?)(?=\s+(?:Applicable|Compulsory|Certificate|Policy|$))/i
  );

  if (geoMatch?.[1]) {
    result.geographicalArea = cleanValue(geoMatch[1]);
  }

  // ============================================================
  // FINANCIER
  // ============================================================
  const financierPatterns = [
    /Hypothecated\s+To\s*:\s*(.+?)(?=\s+(?:Vehicle|Policy|Chassis|Engine|$))/i,
    /Financier\s+Name\s*:\s*(.+?)(?=\s+(?:Vehicle|Policy|Chassis|Engine|$))/i,
    /Agreement\s+with\s*:\s*(.+?)(?=\s+(?:Vehicle|Policy|Chassis|Engine|$))/i
  ];

  for (const pattern of financierPatterns) {
    const match = normalizedText.match(pattern);

    if (match?.[1]) {
      const financierValue = cleanValue(match[1]);

      if (
        financierValue &&
        !/^(NONE|NO|NA|N\/A|NOT APPLICABLE)$/i.test(financierValue)
      ) {
        result.financierName =
          typeof formatFinancierName === "function"
            ? formatFinancierName(financierValue)
            : financierValue;
        break;
      }
    }
  }

  // ============================================================
  // CURRENT YEAR NCB
  // ============================================================
  const currentNcbPatterns = [
    /Current\s+Year\s+NCB\s*\(\s*%\s*\)\s*(\d{1,2}(?:\.\d+)?)/i,
    /Current\s+Year\s+NCB\s*[:\-]?\s*(\d{1,2}(?:\.\d+)?)\s*%/i,
    /Current\s+NCB\s*[:\-]?\s*(\d{1,2}(?:\.\d+)?)\s*%/i,
    /No\s+Claim\s+Bonus[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
    /\bNCB(?:\s*(?:Discount|Percentage|Applicable))?[\s:\-%.()]*(\d{1,2}(?:\.\d+)?)\s*%?/i,
    /Deduct\s*(\d{1,2}(?:\.\d+)?)\s*%?\s*for\s*NCB/i
  ];

  const validNcbSlabs = [0, 20, 25, 35, 45, 50];

  for (const pattern of currentNcbPatterns) {
    const match = normalizedText.match(pattern);

    if (match?.[1]) {
      const ncbValue = Number(match[1]);

      if (validNcbSlabs.includes(ncbValue)) {
        result.ncb = `${ncbValue}%`;
        break;
      }
    }
  }

  // ============================================================
  // GVW
  // ============================================================
  const gvwPatterns = [
    /Gross\s+Vehicle\s+Weight\s*[:\-]?\s*([\d,]+)/i,
    /\bGVW\s*[:\-]?\s*([\d,]+)/i
  ];

  for (const pattern of gvwPatterns) {
    const match = normalizedText.match(pattern);

    if (match?.[1]) {
      result.gvw = match[1];
      break;
    }
  }

  // ============================================================
  // ADDED LOGIC FOR NEW REGISTRATION, CHASSIS AND ENGINE FIX
  // ============================================================
  const exactRowMatch = normalizedText.match(/\b(NEW|[A-Z]{2}[- ]?\d{1,2}[- ]?[A-Z]{1,3}[- ]?\d{3,4})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\s+([A-Z0-9]{5,20})\s+([A-Z0-9]{15,25})\s+\d{1,3}\s*%/i);
  if (exactRowMatch) {
    result.registrationNumber = exactRowMatch[1] === "NEW" ? "NEW" : exactRowMatch[1];
    result.engineNumber = exactRowMatch[2].toUpperCase();
    result.chassisNumber = exactRowMatch[3].toUpperCase();
  }

  const tableChassisEngine = normalizedText.match(/\b\d{1,3}\s+([A-Z0-9\s]{15,25})\s+([A-Z0-9]{5,20})\s+\d{1,3}\s+[\d,]+\.\d{2}/i);
  if (tableChassisEngine) {
    result.chassisNumber = tableChassisEngine[1].replace(/\s+/g, "").toUpperCase();
    result.engineNumber = tableChassisEngine[2].replace(/\s+/g, "").toUpperCase();
  }

  const regCheck = normalizedText.match(/Vehicle\s+Registration\s+No\.?\s*[:.]?\s*(NEW)/i);
  if (regCheck && regCheck[1] && result.registrationNumber === "-") {
    result.registrationNumber = "NEW";
  }

  if (/CHASSIS/i.test(result.engineNumber)) {
     const backupEngine = normalizedText.match(/Engine\s+No\.?\s*[:.]?\s*(?!Chassis)([A-Z0-9]{5,})/i);
     result.engineNumber = backupEngine ? backupEngine[1].toUpperCase() : "-";
  }

  // ============================================================
  // FINAL CLEANUP
  // ============================================================
  if (result.make !== "-") {
    result.make = cleanValue(result.make).toUpperCase();
  }

  if (result.model !== "-") {
    result.model = cleanValue(result.model).toUpperCase();
    const eicherStarlineMatch = result.model.match(/\b(STARLINE\s+2090L\s+CNG\s+BUS)\b/i);
    if (/EICHER\s+MOTOR/i.test(result.make) && eicherStarlineMatch?.[1]) {
      result.model = eicherStarlineMatch[1].toUpperCase();
    }
  }

  if (result.variant !== "-") {
    result.variant = cleanValue(result.variant).toUpperCase();
  }

  if (result.idv !== "-") {
    result.idv = cleanIdv(result.idv);
  }

  if (result.registrationNumber !== "-") {
    result.registrationNumber =
      result.registrationNumber === "NEW"
        ? "NEW"
        : cleanRegistrationNumber(result.registrationNumber);
  }

  return result;
};

// =======================================
// REACT COMPONENT
// =======================================

function ICICIPolicyCard({ item }) {
  const sanitizeValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "string" && value.trim() === "") return "-";
    return value;
  };

  const fullText = item?.fullText || "";
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};

  const autoInsuredDetails = extractInsuredDetails(fullText);
  const extractedVehicle = extractVehicleDetailsFromText(fullText);
  const autoPremium = extractPremiumData(fullText);
  const policyDates = extractPolicyDates(fullText);
  const policyNumber = resolveICICIPolicyNumber(policy?.policyNumber, fullText);

  // Set default missing values gracefully
  const finalPremium = {
    calculatedOdPremium: "-", 
    calculatedTpPremium: "-", 
    totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
    totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
    netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
    gst: premium?.gst || autoPremium?.gst || "0",
    totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
  };

  // Safe vehicle registration enforcement
  if (/^new$/i.test(extractedVehicle.registrationNumber?.trim())) {
    extractedVehicle.registrationNumber = "NEW";
  }

  // Merge vehicle details with the layout style of Bajaj/Indusind
  const mergedVehicle = {
    registrationNumber: vehicle?.registrationNumber || extractedVehicle.registrationNumber,
    chassisNumber: vehicle?.chassisNumber || extractedVehicle.chassisNumber,
    engineNumber: vehicle?.engineNumber || extractedVehicle.engineNumber,
    make: vehicle?.make || extractedVehicle.make,
    model: vehicle?.model || extractedVehicle.model,
    variant: vehicle?.variant || extractedVehicle.variant,
    manufacturingYear: vehicle?.manufacturingYear || extractedVehicle.manufacturingYear,
    fuelType: vehicle?.fuelType || extractedVehicle.fuelType,
    cubicCapacity: vehicle?.cubicCapacity || extractedVehicle.cubicCapacity,
    seatingCapacity: vehicle?.seatingCapacity || extractedVehicle.seatingCapacity,
    financierName: vehicle?.financierName || extractedVehicle.financierName,
    commercialVehicleType: vehicle?.commercialVehicleType || extractedVehicle.commercialVehicleType,
    gvw: vehicle?.gvw || extractedVehicle.gvw,
    ncb: vehicle?.ncb || extractedVehicle.ncb,
  };

  if (/^new$/i.test(mergedVehicle.registrationNumber?.trim())) {
    mergedVehicle.registrationNumber = "NEW";
  }

  // Determine Product Type
  const isNewVehicle = mergedVehicle.registrationNumber === "NEW";
  const originalProductType = sanitizeValue(getProductType(policy?.policyType, fullText));
  const finalProductType = isNewVehicle ? "Bundled Policy" : originalProductType;

  return (
    <PolicyCardView
      item={item}
      policyNumber={sanitizeValue(policyNumber)}
      insuranceCompany={sanitizeValue(extractInsuranceCompanyName(fullText))}
      branchAddress={sanitizeValue(extractBranchAddress(fullText))}
      productType={finalProductType}
      vehicleCategory={sanitizeValue(getVehicleCategory(policy?.policyType, fullText))}
      
      insuredName={sanitizeValue(insured?.insuredName || autoInsuredDetails?.insuredName)}
      panNumber={sanitizeValue(insured?.panNumber || autoInsuredDetails?.panNumber)}
      gstin={sanitizeValue(autoInsuredDetails?.gstin)}
      contactNumber={sanitizeValue(insured?.contactNumber || autoInsuredDetails?.contactNumber)}
      email={sanitizeValue(insured?.email || autoInsuredDetails?.email)}
      insuredAddress={sanitizeValue(insured?.insuredAddress || autoInsuredDetails?.insuredAddress)}
      
      policyDates={{
        startDate: sanitizeValue(policyDates.startDate),
        odExpireDate: sanitizeValue(policyDates.odExpireDate),
        tpExpireDate: sanitizeValue(policyDates.tpExpireDate),
      }}
      dateOfIssue={sanitizeValue(extractDateOfIssue(fullText))}
      totalValue={sanitizeValue(mergedVehicle.idv || extractedVehicle.idv || extractIDV(fullText))}
      
      previousInsurer={sanitizeValue(extractPreviousInsurer(fullText))}
      previousPolicyNumber={sanitizeValue(extractPreviousPolicyNumber(fullText))}
      
      finalPremium={finalPremium}
      vehicle={mergedVehicle}
      extractedVehicle={extractedVehicle}
    />
  );
}

export default ICICIPolicyCard;
