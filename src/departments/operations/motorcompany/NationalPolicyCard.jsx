// // src/components/NationalPolicyCard.jsx

// import { useState } from "react";
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
//   if (!fullText || typeof fullText !== "string") return cleanEngine(engine);
//   const normalizedText = fullText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
//   let match;
//   match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+\s+[A-Z0-9]+)/i);
//   if (match) return cleanEngine(`${match[2]}`);
//   match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+)\s*\n\s*([A-Z0-9]+)\b/i);
//   if (match) return cleanEngine(`${match[2]}${match[3]}`);
//   match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\n\s*([A-Z0-9]+)\s*\/\s*([A-Z0-9]+)/i);
//   if (match) return cleanEngine(match[3]);
//   match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*([A-Z0-9]+)/i);
//   if (match) return cleanEngine(match[2]);
//   match = normalizedText.match(/Engine\s*Number\s*[:\-]?\s*([A-Z0-9\s]+)/i);
//   if (match) return cleanEngine(match[1]);
//   match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([A-Z0-9]+)\s*\/\s*([A-Z0-9]+)\s+([A-Z0-9]+)/i);
//   if (match) return cleanEngine(`${match[2]}${match[3]}`);
//   return cleanEngine(engine);
// };

// const formatChassisNumber = (chassis = "", fullText = "") => {
//   const cleanChassis = (value) => {
//     if (!value) return "-";
//     return String(value).replace(/[^A-Z0-9~]/gi, "").toUpperCase().trim();
//   };
//   if (!fullText || typeof fullText !== "string") return cleanChassis(chassis);
//   const normalizedText = fullText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
//   let match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*[A-Z0-9]+\s*\n\s*[A-Z0-9]+/i);
//   if (match) return cleanChassis(match[1]);
//   match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\n\s*([A-Z0-9]+)\s*\/\s*[A-Z0-9]+/i);
//   if (match) return cleanChassis(`${match[1]}${match[2]}`);
//   match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([A-Z0-9]+)\s*\/\s*[A-Z0-9]+\s+[A-Z0-9]+/i);
//   if (match) return cleanChassis(match[1]);
//   return cleanChassis(chassis);
// };

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

// const formatFinancierName = (financier) => {
//   if (!financier || financier === "-") return "-";
//   return String(financier).replace(/\s+/g, " ").toUpperCase().trim();
// };

// // =======================================
// // EXTRACTION FUNCTIONS
// // =======================================

// const extractPolicyNumber = (text) => {
//   let m = text.match(/Policy\s*No\s*[:：]\s*([0-9A-Z]+)/i);
//   if (m) return m[1];
//   m = text.match(/Policy\s*Number\s*[:：]\s*([0-9A-Z]+)/i);
//   if (m) return m[1];
//   m = text.match(/पॉिलसी\s*संखया\s*[:：]\s*([0-9A-Z]+)/i);
//   return m ? m[1] : "-";
// };

// const extractInsuranceCompany = (text) => {
//   return text.includes("National Insurance Company Ltd.")
//     ? "National Insurance Company Ltd."
//     : "National Insurance Company Ltd.";
// };

// const extractBranchAddress = (text = "") => {
//   if (!text) return "-";

//   let m;
//   m = text.match(
//     /([A-Z\s]+BUSINESS\s+OFFICE\s+[IVX]*[\s\S]*?-\s*\d{6}\.?)(?=\s*State\s+Code)/i
//   );

//   if (m) {
//     return m[1]
//       .replace(/\s+/g, " ")
//       .replace(/\s+,/g, ",")
//       .trim();
//   }

//   // Issuing Office Name & Address
//   m = text.match(
//     /Issuing\s+Office\s+Name\s*&\s*Address\s*([\s\S]*?)(?=\s*(?:Tel|Fax|GSTIN|RSA|Visit\s+us|$))/i
//   );

//   if (m) {
//     let address = m[1]
//       .replace(/\n/g, " ")
//       .replace(/\s+/g, " ")
//       .replace(/^[\s:]+|[\s:]+$/g, "")
//       .trim();

//     if (address) return address;
//   }

//   // Office Address:
//   m = text.match(
//     /Office\s+Address\s*[:：]\s*([^\n]+)/i
//   );

//   if (m) {
//     let address = m[1]
//       .replace(/\n/g, " ")
//       .replace(/\s+/g, " ")
//       .trim();

//     if (address) return address;
//   }

//   // Servicing Office Address
//   m = text.match(
//     /Servicing\s+Office\s+Address\s*([\s\S]*?)(?=\s*(?:GSTIN|NIC\/UBPORTAL|Visit\s+us|$))/i
//   );

//   if (m) {
//     let address = m[1]
//       .replace(/\n/g, " ")
//       .replace(/\s+/g, " ")
//       .replace(/^[\s:]+|[\s:]+$/g, "")
//       .trim();

//     if (address) return address;
//   }

//   // Older Bhopal Office Format
//   m = text.match(
//     /BHOPAL\s+BUSINESS\s+OFFICE\s*I\s*,?\s*([^,]+(?:,\s*[^,]+){1,6})/i
//   );

//   if (m) {
//     let address = m[1]
//       .replace(/\n/g, " ")
//       .replace(/\s+/g, " ")
//       .trim();

//     if (address) {
//       return `BHOPAL BUSINESS OFFICE I, ${address}`;
//     }
//   }

//   return "-";
// };

// // const extractInsuredDetails = (text = "") => {
// //   if (!text) {
// //     return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
// //   }
// //   const normalizedText = normalizeText(text);
// //   let insuredName = "-";

// //   let nameMatch = normalizedText.match(
// //     /गाहक\s*का\s*नाम\s*Customer\s*Name\s*[:：]\s*([^\n]+?)\s*(?=गाहक\s+आई\s*\.\s*डी|Customer\s+ID|पता|Address|$)/i
// //   );
// //   if (!nameMatch) {
// //     nameMatch = normalizedText.match(
// //       /Name\s*[:：]\s*(Mr|Mrs|Ms|Miss|Dr)\.?\s+([A-Z\s]+?)\s*(?=Address\s*:|$)/i
// //     );
// //   }
// //   if (!nameMatch) {
// //     nameMatch = normalizedText.match(
// //       /Name\s*[:：]\s*([^\n]+?)\s*(?=Address\s*:|$)/i
// //     );
// //   }
// //   if (nameMatch) {
// //     insuredName = nameMatch[1]?.trim() || "-";
// //     if (nameMatch[2]) insuredName = `${nameMatch[1]} ${nameMatch[2].trim()}`;
// //     insuredName = insuredName.replace(/\s+/g, " ").trim();
// //     insuredName = insuredName.replace(/\s*(गाहक\s+आई\s*\.\s*डी|Customer\s+ID|पता|Address).*$/i, '').trim();
// //   }

// //   // ============================================================
// // // PAN NUMBER: prefer the one without "No." (Policy Schedule)
// // // ============================================================
// // let panNumber = "-";
// // const panMatch = normalizedText.match(/PAN\s*[:：]\s*([A-Z0-9]+)/i) ||
// //                  normalizedText.match(/PAN\s*No\.?\s*[:：]?\s*([A-Z0-9]+)/i) ||
// //                  normalizedText.match(/पैन\s*PAN\s*[:：]?\s*([A-Z0-9]+)/i);
// // if (panMatch && panMatch[1]) {
// //   const extracted = panMatch[1].trim();
// //   if (extracted) { // only assign if not empty
// //     panNumber = extracted.toUpperCase();
// //   }
// // }
// // // panNumber remains "-" if no valid PAN found

// //   let contactMatch = normalizedText.match(/फोन\s*Phone\s*[:：]\s*([*\dXx\-]+)/i);
// //   if (!contactMatch) contactMatch = normalizedText.match(/संपकर\s*संखया\s*\/\s*Contact\s+Number\s*[:：]\s*([*\dXx\-]+)/i);
// //   if (!contactMatch) contactMatch = normalizedText.match(/सेल\s*\/\s*Cell\s*[:：]\s*([*\dXx\-]+)/i);
// //   if (!contactMatch) contactMatch = normalizedText.match(/Contact\s+Number\s*[:：]\s*([*\dXx\-]+)/i);
// //   if (!contactMatch) contactMatch = normalizedText.match(/Telephone\s*[:：]\s*([*\dXx\-]+)/i);
  
// //   const contactNumber = contactMatch?.[1]?.trim() || "-";

// //   let emailMatch = normalizedText.match(/ई\s*-\s*मेल\s*E-Mail\s*[:：]\s*([^\s]+)/i);
// //   if (!emailMatch) emailMatch = normalizedText.match(/Email\s*[:：]\s*([^\s]+@[^\s]+)/i);
// //   const email = emailMatch?.[1]?.trim() || "-";

// //   let insuredAddress = "-";
// //   const addressBlockMatch = normalizedText.match(
// //     /पता\s*Address\s*[:：]\s*([\s\S]*?)(?=\s*(?:सेल|Cell|फोन|Phone|ई-मेल|E-Mail|Contact\s+Number|$))/i
// //   );
// //   if (addressBlockMatch) {
// //     let raw = addressBlockMatch[1]
// //       .replace(/\n+/g, " ")
// //       .replace(/[ ]{2,}/g, " ")
// //       .trim();
// //     raw = raw
// //       .replace(/\s*शहर\s*\/\s*City\s*[:：]\s*/gi, ", ")
// //       .replace(/\s*िजला\s*\/\s*District\s*[:：]\s*/gi, ", ")
// //       .replace(/\s*राजय\s*\/\s*State\s*[:：]\s*/gi, ", ")
// //       .replace(/\s*िपन\s*\/\s*PIN\s*[:：]?\s*/gi, ", ")
// //       .replace(/\s*पिन\s*[:：]?\s*/gi, ", ")
// //       .replace(/,\s*,/g, ",")
// //       .replace(/,\s+/g, ", ")
// //       .replace(/^,\s*/, "")
// //       .replace(/\s*,\s*$/, "");
// //     insuredAddress = raw;
// //   }
// //   if (insuredAddress === "-" || insuredAddress === "") {
// //     let addrMatch = normalizedText.match(/Address\s*[:：]\s*([\s\S]*?)\s*Pin\s*Code\s*[:：]\s*(\d+)/i);
// //     if (!addrMatch) addrMatch = normalizedText.match(/Address\s*[:：]\s*([\s\S]*?)\s*Pincode\s*[:：]\s*(\d+)/i);
// //     if (addrMatch) {
// //       let addressPart = addrMatch[1].replace(/\n+/g, " ").replace(/[ ]{2,}/g, " ").trim();
// //       let pinPart = addrMatch[2].trim();
// //       insuredAddress = addressPart + " " + pinPart;
// //     }
// //   }

// //   const gstinMatch = normalizedText.match(/जीएसटीआईएन न\s*\/\s*GSTIN No \s*[:：]?\s*([A-Z0-9]{15})/i);
// //   const gstin = gstinMatch?.[1] || "-";

// //   // Looks for "No Claim Bonus" or "NCB" (with optional "Discount") followed by a percentage
// //   const ncbMatch = text.match(/(?:No\s*Claim\s*Bonus|NCB(?:\s*Discount)?)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*%)/i);
  
// //   if (ncbMatch?.[1]) {
// //     // Removes any accidental spaces between the number and the % sign (e.g., "35 %" -> "35%")
// //     result.ncb = ncbMatch[1].replace(/\s+/g, ""); 
// //   }

// //   return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin };
// // };

// const extractInsuredDetails = (text = "") => {
//   if (!text) {
//     return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-", ncb: "-" };
//   }
//   const normalizedText = normalizeText(text);
//   let insuredName = "-";

//   let nameMatch = normalizedText.match(
//     /गाहक\s*का\s*नाम\s*Customer\s*Name\s*[:：]\s*([^\n]+?)\s*(?=गाहक\s+आई\s*\.\s*डी|Customer\s+ID|पता|Address|$)/i
//   );
//   if (!nameMatch) {
//     nameMatch = normalizedText.match(
//       /Name\s*[:：]\s*(Mr|Mrs|Ms|Miss|Dr)\.?\s+([A-Z\s]+?)\s*(?=Address\s*:|$)/i
//     );
//   }
//   if (!nameMatch) {
//     nameMatch = normalizedText.match(
//       /Name\s*[:：]\s*([^\n]+?)\s*(?=Address\s*:|$)/i
//     );
//   }
//   if (nameMatch) {
//     insuredName = nameMatch[1]?.trim() || "-";
//     if (nameMatch[2]) insuredName = `${nameMatch[1]} ${nameMatch[2].trim()}`;
//     insuredName = insuredName.replace(/\s+/g, " ").trim();
//     insuredName = insuredName.replace(/\s*(गाहक\s+आई\s*\.\s*डी|Customer\s+ID|पता|Address).*$/i, '').trim();
//   }

//   // ============================================================
//   // PAN NUMBER: prefer the one without "No." (Policy Schedule)
//   // ============================================================
//   let panNumber = "-";
//   const panMatch = normalizedText.match(/PAN\s*[:：]\s*([A-Z0-9]+)/i) ||
//                    normalizedText.match(/PAN\s*No\.?\s*[:：]?\s*([A-Z0-9]+)/i) ||
//                    normalizedText.match(/पैन\s*PAN\s*[:：]?\s*([A-Z0-9]+)/i);
//   if (panMatch && panMatch[1]) {
//     const extracted = panMatch[1].trim();
//     if (extracted) { 
//       panNumber = extracted.toUpperCase();
//     }
//   }

//   let contactMatch = normalizedText.match(/फोन\s*Phone\s*[:：]\s*([*\dXx\-]+)/i);
//   if (!contactMatch) contactMatch = normalizedText.match(/संपकर\s*संखया\s*\/\s*Contact\s+Number\s*[:：]\s*([*\dXx\-]+)/i);
//   if (!contactMatch) contactMatch = normalizedText.match(/सेल\s*\/\s*Cell\s*[:：]\s*([*\dXx\-]+)/i);
//   if (!contactMatch) contactMatch = normalizedText.match(/Contact\s+Number\s*[:：]\s*([*\dXx\-]+)/i);
//   if (!contactMatch) contactMatch = normalizedText.match(/Telephone\s*[:：]\s*([*\dXx\-]+)/i);
  
//   const contactNumber = contactMatch?.[1]?.trim() || "-";

//   let emailMatch = normalizedText.match(/ई\s*-\s*मेल\s*E-Mail\s*[:：]\s*([^\s]+)/i);
//   if (!emailMatch) emailMatch = normalizedText.match(/Email\s*[:：]\s*([^\s]+@[^\s]+)/i);
//   const email = emailMatch?.[1]?.trim() || "-";

//   let insuredAddress = "-";
//   const addressBlockMatch = normalizedText.match(
//     /पता\s*Address\s*[:：]\s*([\s\S]*?)(?=\s*(?:सेल|Cell|फोन|Phone|ई-मेल|E-Mail|Contact\s+Number|$))/i
//   );
//   if (addressBlockMatch) {
//     let raw = addressBlockMatch[1]
//       .replace(/\n+/g, " ")
//       .replace(/[ ]{2,}/g, " ")
//       .trim();
//     raw = raw
//       .replace(/\s*शहर\s*\/\s*City\s*[:：]\s*/gi, ", ")
//       .replace(/\s*िजला\s*\/\s*District\s*[:：]\s*/gi, ", ")
//       .replace(/\s*राजय\s*\/\s*State\s*[:：]\s*/gi, ", ")
//       .replace(/\s*िपन\s*\/\s*PIN\s*[:：]?\s*/gi, ", ")
//       .replace(/\s*पिन\s*[:：]?\s*/gi, ", ")
//       .replace(/,\s*,/g, ",")
//       .replace(/,\s+/g, ", ")
//       .replace(/^,\s*/, "")
//       .replace(/\s*,\s*$/, "");
//     insuredAddress = raw;
//   }
//   if (insuredAddress === "-" || insuredAddress === "") {
//     let addrMatch = normalizedText.match(/Address\s*[:：]\s*([\s\S]*?)\s*Pin\s*Code\s*[:：]\s*(\d+)/i);
//     if (!addrMatch) addrMatch = normalizedText.match(/Address\s*[:：]\s*([\s\S]*?)\s*Pincode\s*[:：]\s*(\d+)/i);
//     if (addrMatch) {
//       let addressPart = addrMatch[1].replace(/\n+/g, " ").replace(/[ ]{2,}/g, " ").trim();
//       let pinPart = addrMatch[2].trim();
//       insuredAddress = addressPart + " " + pinPart;
//     }
//   }

//   const gstinMatch = normalizedText.match(/जीएसटीआईएन न\s*\/\s*GSTIN No \s*[:：]?\s*([A-Z0-9]{15})/i);
//   const gstin = gstinMatch?.[1] || "-";

//   let ncb = "-";

// const ncbPatterns = [
//   /NCB\s*Discount[\s:：\-–—]*([0-9]+(?:\.[0-9]+)?)\s*[%％]/i,
//   /No\s*Claim\s*Bonus[\s:：\-–—]*([0-9]+(?:\.[0-9]+)?)\s*[%％]/i,
//   /\bNCB\b[\s:：\-–—]*([0-9]+(?:\.[0-9]+)?)\s*[%％]/i,
//   /NCB\s*Discount[\s\S]{0,30}?([0-9]+(?:\.[0-9]+)?)\s*[%％]/i
// ];

// for (const pattern of ncbPatterns) {
//   const match = normalizedText.match(pattern);
//   if (match?.[1]) {
//     ncb = `${match[1]}%`;   // e.g., "35%"
//     break;
//   }
// }

//   // FIXED: Added 'ncb' to the return object
//   return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin, ncb };
// };

// const extractPolicyDates = (fullText = "") => {
//   if (!fullText) {
//     return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
//   }

//   const text = fullText.replace(/\s+/g, " ");

//   let match = text.match(
//     /Policy\s+Effective\s+from[\s\S]*?\bon\s+(\d{2}\/\d{2}\/\d{4})[\s\S]*?to\s+midnight\s+of\s+(\d{2}\/\d{2}\/\d{4})/i
//   );
//   if (match) {
//     return {
//       startDate: match[1],
//       odExpireDate: match[2],
//       tpExpireDate: match[2]
//     };
//   }

//   match = text.match(
//     /from\s+.*?of\s+(\d{2}\/\d{2}\/\d{4})\s+to\s+.*?of\s+(\d{2}\/\d{2}\/\d{4})/i
//   );
//   if (match) {
//     return {
//       startDate: match[1],
//       odExpireDate: match[2],
//       tpExpireDate: match[2]
//     };
//   }

//   match = text.match(
//     /(\d{2}\/\d{2}\/\d{4})\s+to\s+(\d{2}\/\d{2}\/\d{4})/
//   );
//   if (match) {
//     return {
//       startDate: match[1],
//       odExpireDate: match[2],
//       tpExpireDate: match[2]
//     };
//   }

//   return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
// };

// const extractDateOfIssue = (text = "") => {
//   let match = text.match(/Printed\s+on\s*[:：]?\s*(\d{2}\/\d{2}\/\d{4})/i);
//   if (!match) match = text.match(/Collection\s+Date\s*[:：]?\s*(\d{2}\/\d{2}\/\d{4})/i);
//   if (!match) match = text.match(/Date\s+of\s+issue\s*[:：]?\s*(\d{2}\/\d{2}\/\d{4})/i);
//   return match?.[1] || "-";
// };

// const extractIDV = (text) => {
//   let m = text.match(/Total\s+IDV\s*Rs\.?\s*([\d,]+)/i);
//   if (m) return m[1].replace(/,/g, "");
//   m = text.match(/IDV\s*Rs\.?\s*([\d,]+)/i);
//   if (m) return m[1].replace(/,/g, "");
//   return "-";
// };

// const extractPreviousPolicyNumber = (text = "") => {
//   if (!text) return "-";
//   // Look for "Prev Policy" line and extract the policy number from parentheses or after "Pol No:"
//   const match = text.match(/Prev\s+Policy\s*[:：]\s*([^\n]+?)(?=\s*(?:Nominee|Financier|NOTE|$))/i);
//   if (match) {
//     const line = match[1].trim();
//     // Try to extract policy number from "Pol No: xxx" or "(Pol No: xxx)" or similar
//     let polMatch = line.match(/Pol\s*No\s*[:：]\s*([A-Z0-9\-/]+)/i);
//     if (polMatch) return polMatch[1].trim();
//     // Or look for a sequence of digits/letters that looks like a policy number
//     const tokenMatch = line.match(/\b([A-Z0-9]{10,})\b/);
//     if (tokenMatch) return tokenMatch[1];
//   }
//   // Fallback to other patterns
//   let fallback = text.match(/Previous\s+Policy\s+Number\s*[:：]\s*([^\n]+)/i);
//   if (fallback?.[1]) return fallback[1].trim();
//   fallback = text.match(/Pol\s*No\s*[:：]\s*([A-Z0-9\/\-]+)/i);
//   return fallback?.[1] || "-";
// };

// const extractPreviousInsurer = (text = "") => {
//   if (!text) return "-";
//   // Look for "Prev Policy" line
//   const match = text.match(/Prev\s+Policy\s*[:：]\s*([^\n]+?)(?=\s*(?:Nominee|Financier|NOTE|$))/i);
//   if (match) {
//     const line = match[1].trim();
//     // Extract insurer name: remove the part after " (Pol No:" or similar
//     const namePart = line.replace(/\s*\(?\s*Pol\s*No\s*[:：][^)]*\)?\s*$/i, '').trim();
//     // Also remove any trailing " (Pol No: ...)" that might be without parentheses
//     const cleaned = namePart.replace(/\s*Pol\s*No\s*[:：].*$/i, '').trim();
//     if (cleaned) return cleaned;
//     // If we couldn't extract, return the whole line but it's not good, so fallback
//   }
//   // Try "Previous Insurer" label
//   let insMatch = text.match(/Previous\s+Insurer\s*[:：]\s*([^\n]+?)(?=\s*(?:Nominee|Financier|NOTE|$))/i);
//   if (insMatch?.[1]) return insMatch[1].trim();
//   // Return "-" if nothing found
//   return "-";
// };

// // ============================================================
// // FIXED: extractPremiumData with correct netPremium
// // ============================================================
// const extractPremiumData = (text) => {
//   const result = {
//     totalOdPremium: "-",
//     totalTpPremium: "-",
//     netPremium: "-",
//     gst: "-",
//     totalPayable: "-",
//     calculatedOdPremium: "-",
//     calculatedTpPremium: "-"
//   };
//   const cleanNumber = (value) => value ? value.replace(/,/g, "").trim() : "-";

//   let match = text.match(/OD\s*Total\s*\(Rounded\s*Off\)\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
//   if (!match) match = text.match(/Own\s+Damage\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
//   if (match) result.totalOdPremium = cleanNumber(match[1]);

//   match = text.match(/TP\s*Total\s*\(Rounded\s*Off\)\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
//   if (!match) match = text.match(/Legal\s+Liability\s+to\s+Third\s+Party\s*[-–]?\s*Liability\s+Only\s*([\d,]+(?:\.\d+)?)/i);
//   if (!match) match = text.match(/Legal\s+Liability\s+Cover\s*([\d,]+(?:\.\d+)?)/i);
//   if (match) result.totalTpPremium = cleanNumber(match[1]);

//   // ============================================================
//   // netPremium: look for TOTAL PREMIUM first
//   // ============================================================
//   let netMatch = text.match(/TOTAL\s+PREMIUM\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
//   if (!netMatch) netMatch = text.match(/(?:पीिमयम\s+)?Premium\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
//   if (!netMatch) netMatch = text.match(/Premium\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
//   if (netMatch) result.netPremium = cleanNumber(netMatch[1]);

//   match = text.match(/GST\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
//   if (match) {
//     result.gst = cleanNumber(match[1]);
//   } else {
//     const cgstMatch = text.match(/(?:सीजीएसटी\s*\/\s*)?CGST\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d{2})?)/i);
//     const sgstMatch = text.match(/(?:एसजीएसटी\s*\/\s*यूटीजीएसटी\s*\/\s*)?SGST(?:\/UTGST)?\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d{2})?)/i);
//     const igstMatch = text.match(/(?:आईजीएसटी\s*\/\s*)?IGST\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d{2})?)/i);
//     if (cgstMatch || sgstMatch || igstMatch) {
//       const c = cgstMatch ? parseFloat(cgstMatch[1].replace(/,/g, "")) : 0;
//       const s = sgstMatch ? parseFloat(sgstMatch[1].replace(/,/g, "")) : 0;
//       const i = igstMatch ? parseFloat(igstMatch[1].replace(/,/g, "")) : 0;
//       result.gst = (c + s + i).toFixed(2);
//     }
//   }

//   match = text.match(/(?:कुल\s+रािश\s+)?Total\s+Amount\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
//   if (!match) match = text.match(/NET\s+PAYABLE\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
//   if (!match) match = text.match(/Total\s+Invoice\s+Value\s*\(In\s*figures\)\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
//   if (match) result.totalPayable = cleanNumber(match[1]);

//   result.calculatedOdPremium = result.totalOdPremium;
//   result.calculatedTpPremium = result.totalTpPremium;

//   return result;
// };

// const cleanRegistrationNumber = (regNo) => {
//   if (!regNo || regNo === "-") return "-";
//   return String(regNo).replace(/[\s-]/g, "").toUpperCase().trim();
// };

// const extractVehicleDetailsFromText = (text) => {
//   const result = {
//     registrationNumber: "-",
//     chassisNumber: "-",
//     engineNumber: "-",
//     make: "-",
//     model: "-",
//     variant: "-",
//     manufacturingYear: "-",
//     colour: "-",
//     cubicCapacity: "-",
//     seatingCapacity: "-",
//     geographicalArea: "-",
//     financierName: "-",
//     regDistrict: "-",
//     fuelType: "-"
//   };

//   const isCommercial = /Miscellaneous and Special Type|Goods Carrying|Passenger Carrying|Commercial Vehicle/i.test(text);

//   if (isCommercial) {
//     // --- Registration ---
//     const regMatch = text.match(/Regn\.?\s*Number\s*[:：]?\s*([A-Z0-9\-]+)/i) ||
//                      text.match(/पंजी\s*\.\s*संखया\s*Regn\.?\s*Number\s*[:：]?\s*([A-Z0-9\-]+)/i);
//     if (regMatch) result.registrationNumber = cleanRegistrationNumber(regMatch[1]);

//     // --- Engine ---
//     const engineMatch = text.match(/Engine\s+(?:or\s+M\/c\s+)?No\.?\s*[:：]?\s*([A-Z0-9]+)/i) ||
//                         text.match(/इंजन\s*व\s*एम\s*\/\s*सी\s*सं\s*Engine\s+or\s+M\/c\s+No\.?\s*[:：]?\s*([A-Z0-9]+)/i);
//     if (engineMatch) result.engineNumber = engineMatch[1];

//     // --- Chassis ---
//     const chassisMatch = text.match(/Chassis\s+Number\s*[:：]?\s*([A-Z0-9]+)/i) ||
//                          text.match(/चेिसस\s*संखया\s*Chassis\s+Number\s*[:：]?\s*([A-Z0-9]+)/i);
//     if (chassisMatch) result.chassisNumber = chassisMatch[1];

//     // --- Make ---
//     const makeMatch = text.match(
//       /Make\s*[:：]?\s*([\s\S]*?)(?=\s*(?:कुल\s*कीमत|Total\s+Value|मॉडल|Model|अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i
//     ) || text.match(/बनावट\s*Make\s*[:：]?\s*([\s\S]*?)(?=\s*(?:कुल\s*कीमत|Total\s+Value|मॉडल|Model|अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i);
//     if (makeMatch) {
//       let raw = makeMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
//       raw = raw.replace(/\s*(कुल\s*कीमत|Total\s+Value|मॉडल|Model|अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg).*$/i, '');
//       result.make = raw;
//     }

//     // --- Model ---
//     const modelMatch = text.match(
//       /Model\s*[:：]?\s*([\s\S]*?)(?=\s*(?:अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i
//     ) || text.match(/मॉडल\s*Model\s*[:：]?\s*([\s\S]*?)(?=\s*(?:अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i);
//     if (modelMatch) {
//       let raw = modelMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
//       raw = raw.replace(/\s*(अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg).*$/i, '');
//       result.model = raw;
//     }

//     // --- Variant ---
//     const variantMatch = text.match(
//       /Variant\s*[:：]?\s*([\s\S]*?)(?=\s*(?:सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i
//     ) || text.match(/वेिरएंट\s*Variant\s*[:：]?\s*([\s\S]*?)(?=\s*(?:सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i);
//     if (variantMatch) {
//       let raw = variantMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
//       raw = raw.replace(/\s*(सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg).*$/i, '');
//       result.variant = raw;
//     }

//     // --- Year ---
//     const yearMatch = text.match(/Year\s+of\s+Mfg\.?\s*[:：]?\s*(\d{4})/i) ||
//                       text.match(/िनमारण\s*वषर\s*Year\s+of\s+Mfg\.?\s*[:：]?\s*(\d{4})/i);
//     if (yearMatch) result.manufacturingYear = yearMatch[1];

//     // --- Colour ---
//     const bodyMatch = text.match(/Body\s+Type\s*\/\s*Color\s*[:：]?\s*([^\n]+)/i) ||
//                       text.match(/ढाचा\s*का\s*पकार\s*\/\s*रंग\s*Body\s+Type\s*\/\s*Color\s*[:：]?\s*([^\n]+)/i) ||
//                       text.match(/Type\s+of\s+Body\s*[:：]?\s*([A-Za-z\s&\/]+)(?=\s+\d+|$)/i);
//     if (bodyMatch) {
//       const bodyColor = bodyMatch[1].trim();
//       const parts = bodyColor.split(/\s*\/\s*/);
      
//       if (parts.length >= 2) {
//         result.colour = parts[1].trim();
//       }
//     }

//     // --- CC / GVW ---
//     const ccMatch = text.match(/CC\s*\/\s*GVW\s*[:：]?\s*(\d+)/i) ||
//                     text.match(/सी\s*\.\s*सी\s*–\s*जी\s*\.\s*भी\s*डबलयू\s*CC\s*\/\s*GVW\s*[:：]?\s*(\d+)/i);
//     if (ccMatch) result.cubicCapacity = ccMatch[1];

//     // --- Seating Capacity ---
//     const seatingMatch = text.match(/Licensed\s+Seating\s*\/\s*Carrying\s+Capacity\s*[:：]?\s*(\d+)/i) ||
//                          text.match(/लाइसेस\s*िसिटंग\s*\/\s*वहन\s*की\s*कमता\s*कमत\s*Licensed\s+Seating\s*\/\s*Carrying\s+Capacity\s*[:：]?\s*(\d+)/i);
//     if (seatingMatch) result.seatingCapacity = seatingMatch[1];

//     // --- Fuel Type ---
//     const fuelMatch = text.match(/Type\s+of\s+Fuel\s*[:：]?\s*([A-Z\s]+)/i) ||
//                       text.match(/ईधन\s*का\s*पकार\s*\/\s*Type\s+of\s+Fuel\s*[:：]?\s*([A-Z\s]+)/i);
//     if (fuelMatch) result.fuelType = fuelMatch[1].trim();

//     // --- Registration District ---
//     const regDistrictMatch = text.match(/Regn\.?\s*Authority\s*[:：]?\s*([A-Z\s]+)/i) ||
//                              text.match(/पंजीकरण\s*अिध\s*\.\s*Regn\.?\s*Authority\s*[:：]?\s*([A-Z\s]+)/i);
//     if (regDistrictMatch) result.regDistrict = regDistrictMatch[1].trim();

//   } else {
//     // ============================================================
//     // Two-wheeler / Private Car logic
//     // ============================================================
//     const makeModel = text.match(/Make\s*&\s*Model\s*[:：]?\s*(.+?)(?=\s*Reg\.\s*No\.|$)/is);
//     if (makeModel) {
//       let raw = makeModel[1].trim().replace(/^Private\s*Car\s+/i, ""); 
//       const tokens = raw.split(/\s+/);

//       // 1. Logic for Make: Always the first token
//       result.make = tokens[0] || "-";

//       // 2. Logic for Model: The second token
//       result.model = tokens[1] || "-";

//       // 3. Logic for Variant: All subsequent tokens, excluding unwanted technical suffixes
//       if (tokens.length > 2) {
//         // Includes \d to strip out single isolated digits (like '8')
//         const stopWords = /^(STR|BS-III|BS-IV|BS6|G|V|VX|ZX|LXI|VXI|ZXI|AT|MT|\d)$/i;
        
//         result.variant = tokens.slice(2)
//           .filter(t => !stopWords.test(t))
//           .join(" ")
//           .trim();
//       } else {
//         result.variant = "-";
//       }
//     }

//     const dataRowRegex = /([A-Z]{2}[-]?\d{2}[-]?[A-Z]{1,3}[-]?\d{4})\s+([A-Z0-9]+)\s+([A-Z0-9]+)(?:\s+([A-Z]+))?\s+(\d+)\s+(\d{4})\s+([\d+]+)\s+([A-Z\s]+)/i;
//     const match = text.match(dataRowRegex);
//     if (match) {
//       result.registrationNumber = cleanRegistrationNumber(match[1]);
//       result.engineNumber = match[2];
//       result.chassisNumber = match[3];
//       result.cubicCapacity = match[5];
//       result.manufacturingYear = match[6];
//       result.seatingCapacity = match[7];
//       result.regDistrict = match[8].trim();
//     } else {
//       const lines = text.split(/\r?\n/);
//       const regPattern = /[A-Z]{2}\s*[-]?\s*\d{2}\s*[-]?\s*[A-Z]{1,3}\s*[-]?\s*\d{4}/i;
//       let dataLine = null;
//       for (const line of lines) {
//         if (regPattern.test(line)) { dataLine = line.trim(); break; }
//       }
//       if (dataLine) {
//         const tokens = dataLine.split(/\s+/);
//         if (tokens.length >= 7) {
//           result.registrationNumber = cleanRegistrationNumber(tokens[0]);
//           result.engineNumber = tokens[1] || "-";
//           result.chassisNumber = tokens[2] || "-";
//           let idx = 3;
//           while (idx < tokens.length && /^[A-Z]+$/.test(tokens[idx])) idx++;
//           if (idx < tokens.length && /^\d+$/.test(tokens[idx])) result.cubicCapacity = tokens[idx++];
//           if (idx < tokens.length && /^\d{4}$/.test(tokens[idx])) result.manufacturingYear = tokens[idx++];
//           if (idx < tokens.length) result.seatingCapacity = tokens[idx++];
//           if (idx < tokens.length) result.regDistrict = tokens.slice(idx).join(" ");
//         }
//       }
//     }
//   }

//   // --- Common Fields for both Commercial and Private ---
//   const geo = text.match(/Geographical\s+Area\s*[:：]?\s*([A-Z\s.]+)/i);
//   if (geo) {
//     let area = geo[1].trim();
//     if (area.endsWith('.')) area = area.slice(0, -1);
//     result.geographicalArea = area;
//   }

//   let fin = text.match(/HYPOTHECATION\s*[:：]?\s*([^\n\r]+)/i) || 
//             text.match(/Hypothecated\s+To\s*[:：]?\s*([^\n\r]+)/i) ||
//             text.match(/Financier\s*[:：]?\s*([^\n\r]+)/i);
//   if (fin) {
//     let financier = fin[1].trim();
//     financier = financier.replace(/Prev\s+Policy.*$/i, "").replace(/Nominee.*$/i, "").replace(/[,;]+$/g, "").trim();
//     if (financier && financier !== "-") {
//       result.financierName = formatFinancierName(financier);
//     }
//   }

//   return result;
// };

// // =======================================
// // MAIN COMPONENT
// // =======================================

// function NationalPolicyCard({ item }) {
//   const [copied, setCopied] = useState(false);
//   const insured = item?.insuredDetails || {};
//   const policy = item?.policyDetails || {};
//   const vehicle = item?.vehicleDetails || {};
//   const premium = item?.premiumDetails || {};
//   const fullText = item?.fullText || "";

//   const policyNumber = extractPolicyNumber(fullText);
//   const insuranceCompany = extractInsuranceCompany(fullText);
//   const branchAddress = extractBranchAddress(fullText);
//   const autoInsuredDetails = extractInsuredDetails(fullText);
//   const policyDates = extractPolicyDates(fullText);
//   const extractedVehicle = extractVehicleDetailsFromText(fullText);
//   const autoPremium = extractPremiumData(fullText);
//   const dateOfIssue = extractDateOfIssue(fullText);
//   const totalValue = extractIDV(fullText);
//   const previousPolicyNumber = extractPreviousPolicyNumber(fullText);
//   const previousInsurer = extractPreviousInsurer(fullText);

//   const insuredName = insured?.insuredName || autoInsuredDetails?.insuredName || "-";
//   const insuredAddress = insured?.insuredAddress || autoInsuredDetails?.insuredAddress || "-";
//   const panNumber = insured?.panNumber || autoInsuredDetails?.panNumber || "-";
//   const contactNumber = insured?.contactNumber || autoInsuredDetails?.contactNumber || "-";
//   const email = insured?.email || autoInsuredDetails?.email || "-";
//   const gstin = autoInsuredDetails?.gstin || "-";

//   const vehicleCategory = getVehicleCategory(policy?.policyType, fullText);
//   const productType = getProductType(policy?.policyType, fullText);

//   const finalPremium = {
//     calculatedOdPremium: premium?.calculatedOdPremium || autoPremium?.calculatedOdPremium || "0",
//     calculatedTpPremium: premium?.calculatedTpPremium || autoPremium?.calculatedTpPremium || "0",
//     totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
//     totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
//     netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
//     gst: premium?.gst || autoPremium?.gst || "0",
//     totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
//   };

//   if (productType === "Standalone OD Policy") {
//     finalPremium.totalOdPremium = finalPremium.netPremium;
//   } else if (productType === "Liability Policy") {
//     finalPremium.totalTpPremium = finalPremium.netPremium;
//   }

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

// export default NationalPolicyCard;


// src/components/NationalPolicyCard.jsx

import { useState } from "react";
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

const getPremiumValue = (value) => {
  if (value === null || value === undefined || value === "" || value === "NA") {
    return "0";
  }
  return String(value).replace(/,/g, "");
};

const copyText = async (text, setCopied) => {
  try {
    await navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error(err);
  }
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
  if (!fullText || typeof fullText !== "string") return cleanEngine(engine);
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
  match = normalizedText.match(/Engine\s*Number\s*[:\-]?\s*([A-Z0-9\s]+)/i);
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
  if (!fullText || typeof fullText !== "string") return cleanChassis(chassis);
  const normalizedText = fullText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
  let match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\/\s*[A-Z0-9]+\s*\n\s*[A-Z0-9]+/i);
  if (match) return cleanChassis(match[1]);
  match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*Number\s*([A-Z0-9~]+)\s*\n\s*([A-Z0-9]+)\s*\/\s*[A-Z0-9]+/i);
  if (match) return cleanChassis(`${match[1]}${match[2]}`);
  match = normalizedText.match(/Chassis\s*no\.?\s*\/\s*Engine\s*no\.?\s*:\s*([A-Z0-9]+)\s*\/\s*[A-Z0-9]+\s+[A-Z0-9]+/i);
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

const formatFinancierName = (financier) => {
  if (!financier || financier === "-") return "-";
  return String(financier).replace(/\s+/g, " ").toUpperCase().trim();
};

// =======================================
// EXTRACTION FUNCTIONS
// =======================================

const extractPolicyNumber = (text) => {
  let m = text.match(/Policy\s*No\s*[:：]\s*([0-9A-Z]+)/i);
  if (m) return m[1];
  m = text.match(/Policy\s*Number\s*[:：]\s*([0-9A-Z]+)/i);
  if (m) return m[1];
  m = text.match(/पॉिलसी\s*संखया\s*[:：]\s*([0-9A-Z]+)/i);
  return m ? m[1] : "-";
};

const extractInsuranceCompany = (text) => {
  return text.includes("National Insurance Company Ltd.")
    ? "National Insurance Company Ltd."
    : "National Insurance Company Ltd.";
};

const extractBranchAddress = (text = "") => {
  if (!text) return "-";

  let m;
  m = text.match(
    /([A-Z\s]+BUSINESS\s+OFFICE\s+[IVX]*[\s\S]*?-\s*\d{6}\.?)(?=\s*State\s+Code)/i
  );

  if (m) {
    return m[1]
      .replace(/\s+/g, " ")
      .replace(/\s+,/g, ",")
      .trim();
  }

  // Issuing Office Name & Address
  m = text.match(
    /Issuing\s+Office\s+Name\s*&\s*Address\s*([\s\S]*?)(?=\s*(?:Tel|Fax|GSTIN|RSA|Visit\s+us|$))/i
  );

  if (m) {
    let address = m[1]
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^[\s:]+|[\s:]+$/g, "")
      .trim();

    if (address) return address;
  }

  // Office Address:
  m = text.match(
    /Office\s+Address\s*[:：]\s*([^\n]+)/i
  );

  if (m) {
    let address = m[1]
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (address) return address;
  }

  // Servicing Office Address
  m = text.match(
    /Servicing\s+Office\s+Address\s*([\s\S]*?)(?=\s*(?:GSTIN|NIC\/UBPORTAL|Visit\s+us|$))/i
  );

  if (m) {
    let address = m[1]
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^[\s:]+|[\s:]+$/g, "")
      .trim();

    if (address) return address;
  }

  // Older Bhopal Office Format
  m = text.match(
    /BHOPAL\s+BUSINESS\s+OFFICE\s*I\s*,?\s*([^,]+(?:,\s*[^,]+){1,6})/i
  );

  if (m) {
    let address = m[1]
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (address) {
      return `BHOPAL BUSINESS OFFICE I, ${address}`;
    }
  }

  return "-";
};

const extractInsuredDetails = (text = "") => {
  if (!text) {
    return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-", ncb: "-" };
  }
  const normalizedText = normalizeText(text);
  let insuredName = "-";

  let nameMatch = normalizedText.match(
    /गाहक\s*का\s*नाम\s*Customer\s*Name\s*[:：]\s*([^\n]+?)\s*(?=गाहक\s+आई\s*\.\s*डी|Customer\s+ID|पता|Address|$)/i
  );
  if (!nameMatch) {
    nameMatch = normalizedText.match(
      /Name\s*[:：]\s*(Mr|Mrs|Ms|Miss|Dr)\.?\s+([A-Z\s]+?)\s*(?=Address\s*:|$)/i
    );
  }
  if (!nameMatch) {
    nameMatch = normalizedText.match(
      /Name\s*[:：]\s*([^\n]+?)\s*(?=Address\s*:|$)/i
    );
  }
  if (nameMatch) {
    insuredName = nameMatch[1]?.trim() || "-";
    if (nameMatch[2]) insuredName = `${nameMatch[1]} ${nameMatch[2].trim()}`;
    insuredName = insuredName.replace(/\s+/g, " ").trim();
    insuredName = insuredName.replace(/\s*(गाहक\s+आई\s*\.\s*डी|Customer\s+ID|पता|Address).*$/i, '').trim();
  }

  // ============================================================
  // PAN NUMBER: prefer the one without "No." (Policy Schedule)
  // ============================================================
  let panNumber = "-";
  const panMatch = normalizedText.match(/PAN\s*No\.?\s*[:：]?\s*([A-Z0-9]+)/i) ||
                   normalizedText.match(/पैन\s*PAN\s*[:：]?\s*([A-Z0-9]+)/i);
                   
  if (panMatch && panMatch[1]) {
    const extracted = panMatch[1].trim().toUpperCase();
    
    // Check if it's not empty AND does not contain the word "GSTIN"
    if (extracted && !extracted.includes("GSTIN")) { 
      panNumber = extracted;
    }
  }

  let contactMatch = normalizedText.match(/फोन\s*Phone\s*[:：]\s*([*\dXx\-]+)/i);
  if (!contactMatch) contactMatch = normalizedText.match(/संपकर\s*संखया\s*\/\s*Contact\s+Number\s*[:：]\s*([*\dXx\-]+)/i);
  if (!contactMatch) contactMatch = normalizedText.match(/सेल\s*\/\s*Cell\s*[:：]\s*([*\dXx\-]+)/i);
  if (!contactMatch) contactMatch = normalizedText.match(/Contact\s+Number\s*[:：]\s*([*\dXx\-]+)/i);
  if (!contactMatch) contactMatch = normalizedText.match(/Telephone\s*[:：]\s*([*\dXx\-]+)/i);
  
  const contactNumber = contactMatch?.[1]?.trim() || "-";

  let emailMatch = normalizedText.match(/ई\s*-\s*मेल\s*E-Mail\s*[:：]\s*([^\s]+)/i);
  if (!emailMatch) emailMatch = normalizedText.match(/Email\s*[:：]\s*([^\s]+@[^\s]+)/i);
  const email = emailMatch?.[1]?.trim() || "-";

  let insuredAddress = "-";
  const addressBlockMatch = normalizedText.match(
    /पता\s*Address\s*[:：]\s*([\s\S]*?)(?=\s*(?:सेल|Cell|फोन|Phone|ई-मेल|E-Mail|Contact\s+Number|$))/i
  );
  if (addressBlockMatch) {
    let raw = addressBlockMatch[1]
      .replace(/\n+/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .trim();
    raw = raw
      .replace(/\s*शहर\s*\/\s*City\s*[:：]\s*/gi, ", ")
      .replace(/\s*िजला\s*\/\s*District\s*[:：]\s*/gi, ", ")
      .replace(/\s*राजय\s*\/\s*State\s*[:：]\s*/gi, ", ")
      .replace(/\s*िपन\s*\/\s*PIN\s*[:：]?\s*/gi, ", ")
      .replace(/\s*पिन\s*[:：]?\s*/gi, ", ")
      .replace(/,\s*,/g, ",")
      .replace(/,\s+/g, ", ")
      .replace(/^,\s*/, "")
      .replace(/\s*,\s*$/, "");
    insuredAddress = raw;
  }
  if (insuredAddress === "-" || insuredAddress === "") {
    let addrMatch = normalizedText.match(/Address\s*[:：]\s*([\s\S]*?)\s*Pin\s*Code\s*[:：]\s*(\d+)/i);
    if (!addrMatch) addrMatch = normalizedText.match(/Address\s*[:：]\s*([\s\S]*?)\s*Pincode\s*[:：]\s*(\d+)/i);
    if (addrMatch) {
      let addressPart = addrMatch[1].replace(/\n+/g, " ").replace(/[ ]{2,}/g, " ").trim();
      let pinPart = addrMatch[2].trim();
      insuredAddress = addressPart + " " + pinPart;
    }
  }

  const gstinMatch = normalizedText.match(/जीएसटीआईएन न\s*\/\s*GSTIN No \s*[:：]?\s*([A-Z0-9]{15})/i);
  const gstin = gstinMatch?.[1] || "-";

  // ---- NCB EXTRACTION ----
  let ncb = "-";
  const ncbMatch = normalizedText.match(/NCB\s*Discount[^\d]*(\d+(?:\.\d+)?\s*%)/i);
    ncb = ncbMatch; 

  return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin, ncb };
};

const extractPolicyDates = (fullText = "") => {
  if (!fullText) {
    return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  }

  const text = fullText.replace(/\s+/g, " ");

  let match = text.match(
    /Policy\s+Effective\s+from[\s\S]*?\bon\s+(\d{2}\/\d{2}\/\d{4})[\s\S]*?to\s+midnight\s+of\s+(\d{2}\/\d{2}\/\d{4})/i
  );
  if (match) {
    return {
      startDate: match[1],
      odExpireDate: match[2],
      tpExpireDate: match[2]
    };
  }

  match = text.match(
    /from\s+.*?of\s+(\d{2}\/\d{2}\/\d{4})\s+to\s+.*?of\s+(\d{2}\/\d{2}\/\d{4})/i
  );
  if (match) {
    return {
      startDate: match[1],
      odExpireDate: match[2],
      tpExpireDate: match[2]
    };
  }

  match = text.match(
    /(\d{2}\/\d{2}\/\d{4})\s+to\s+(\d{2}\/\d{2}\/\d{4})/
  );
  if (match) {
    return {
      startDate: match[1],
      odExpireDate: match[2],
      tpExpireDate: match[2]
    };
  }

  return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
};

const extractDateOfIssue = (text = "") => {
  let match = text.match(/Printed\s+on\s*[:：]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (!match) match = text.match(/Collection\s+Date\s*[:：]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (!match) match = text.match(/Date\s+of\s+issue\s*[:：]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  return match?.[1] || "-";
};

const extractIDV = (text) => {
  let m = text.match(/Total\s+IDV\s*Rs\.?\s*([\d,]+)/i);
  if (m) return m[1].replace(/,/g, "");
  m = text.match(/IDV\s*Rs\.?\s*([\d,]+)/i);
  if (m) return m[1].replace(/,/g, "");
  return "-";
};

const extractPreviousPolicyNumber = (text = "") => {
  if (!text) return "-";
  // Look for "Prev Policy" line and extract the policy number from parentheses or after "Pol No:"
  const match = text.match(/Prev\s+Policy\s*[:：]\s*([^\n]+?)(?=\s*(?:Nominee|Financier|NOTE|$))/i);
  if (match) {
    const line = match[1].trim();
    // Try to extract policy number from "Pol No: xxx" or "(Pol No: xxx)" or similar
    let polMatch = line.match(/Pol\s*No\s*[:：]\s*([A-Z0-9\-/]+)/i);
    if (polMatch) return polMatch[1].trim();
    // Or look for a sequence of digits/letters that looks like a policy number
    const tokenMatch = line.match(/\b([A-Z0-9]{10,})\b/);
    if (tokenMatch) return tokenMatch[1];
  }
  // Fallback to other patterns
  let fallback = text.match(/Previous\s+Policy\s+Number\s*[:：]\s*([^\n]+)/i);
  if (fallback?.[1]) return fallback[1].trim();
  fallback = text.match(/Pol\s*No\s*[:：]\s*([A-Z0-9\/\-]+)/i);
  return fallback?.[1] || "-";
};

const extractPreviousInsurer = (text = "") => {
  if (!text) return "-";
  // Look for "Prev Policy" line
  const match = text.match(/Prev\s+Policy\s*[:：]\s*([^\n]+?)(?=\s*(?:Nominee|Financier|NOTE|$))/i);
  if (match) {
    const line = match[1].trim();
    // Extract insurer name: remove the part after " (Pol No:" or similar
    const namePart = line.replace(/\s*\(?\s*Pol\s*No\s*[:：][^)]*\)?\s*$/i, '').trim();
    // Also remove any trailing " (Pol No: ...)" that might be without parentheses
    const cleaned = namePart.replace(/\s*Pol\s*No\s*[:：].*$/i, '').trim();
    if (cleaned) return cleaned;
    // If we couldn't extract, return the whole line but it's not good, so fallback
  }
  // Try "Previous Insurer" label
  let insMatch = text.match(/Previous\s+Insurer\s*[:：]\s*([^\n]+?)(?=\s*(?:Nominee|Financier|NOTE|$))/i);
  if (insMatch?.[1]) return insMatch[1].trim();
  // Return "-" if nothing found
  return "-";
};

// ============================================================
// extractPremiumData with correct netPremium
// ============================================================
const extractPremiumData = (text) => {
  const result = {
    totalOdPremium: "-",
    totalTpPremium: "-",
    netPremium: "-",
    gst: "-",
    totalPayable: "-",
    calculatedOdPremium: "-",
    calculatedTpPremium: "-"
  };
  const cleanNumber = (value) => value ? value.replace(/,/g, "").trim() : "-";

  let match = text.match(/OD\s*Total\s*\(Rounded\s*Off\)\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (!match) match = text.match(/Own\s+Damage\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (match) result.totalOdPremium = cleanNumber(match[1]);

  match = text.match(/TP\s*Total\s*\(Rounded\s*Off\)\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (!match) match = text.match(/Legal\s+Liability\s+to\s+Third\s+Party\s*[-–]?\s*Liability\s+Only\s*([\d,]+(?:\.\d+)?)/i);
  if (!match) match = text.match(/Legal\s+Liability\s+Cover\s*([\d,]+(?:\.\d+)?)/i);
  if (match) result.totalTpPremium = cleanNumber(match[1]);

  // ============================================================
  // netPremium: look for TOTAL PREMIUM first
  // ============================================================
  let netMatch = text.match(/TOTAL\s+PREMIUM\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (!netMatch) netMatch = text.match(/(?:पीिमयम\s+)?Premium\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (!netMatch) netMatch = text.match(/Premium\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (netMatch) result.netPremium = cleanNumber(netMatch[1]);

  match = text.match(/GST\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (match) {
    result.gst = cleanNumber(match[1]);
  } else {
    const cgstMatch = text.match(/(?:सीजीएसटी\s*\/\s*)?CGST\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d{2})?)/i);
    const sgstMatch = text.match(/(?:एसजीएसटी\s*\/\s*यूटीजीएसटी\s*\/\s*)?SGST(?:\/UTGST)?\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d{2})?)/i);
    const igstMatch = text.match(/(?:आईजीएसटी\s*\/\s*)?IGST\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d{2})?)/i);
    if (cgstMatch || sgstMatch || igstMatch) {
      const c = cgstMatch ? parseFloat(cgstMatch[1].replace(/,/g, "")) : 0;
      const s = sgstMatch ? parseFloat(sgstMatch[1].replace(/,/g, "")) : 0;
      const i = igstMatch ? parseFloat(igstMatch[1].replace(/,/g, "")) : 0;
      result.gst = (c + s + i).toFixed(2);
    }
  }

  match = text.match(/(?:कुल\s+रािश\s+)?Total\s+Amount\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (!match) match = text.match(/NET\s+PAYABLE\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (!match) match = text.match(/Total\s+Invoice\s+Value\s*\(In\s*figures\)\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (match) result.totalPayable = cleanNumber(match[1]);

  result.calculatedOdPremium = result.totalOdPremium;
  result.calculatedTpPremium = result.totalTpPremium;

  return result;
};

const cleanRegistrationNumber = (regNo) => {
  if (!regNo || regNo === "-") return "-";
  return String(regNo).replace(/[\s-]/g, "").toUpperCase().trim();
};

const extractVehicleDetailsFromText = (text) => {
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
    regDistrict: "-",
    fuelType: "-"
  };

  const isCommercial = /Miscellaneous and Special Type|Goods Carrying|Passenger Carrying|Commercial Vehicle/i.test(text);

  if (isCommercial) {
    // --- Registration ---
    const regMatch = text.match(/Regn\.?\s*Number\s*[:：]?\s*([A-Z0-9\-]+)/i) ||
                     text.match(/पंजी\s*\.\s*संखया\s*Regn\.?\s*Number\s*[:：]?\s*([A-Z0-9\-]+)/i);
    if (regMatch) result.registrationNumber = cleanRegistrationNumber(regMatch[1]);

    // --- Engine ---
    const engineMatch = text.match(/Engine\s+(?:or\s+M\/c\s+)?No\.?\s*[:：]?\s*([A-Z0-9]+)/i) ||
                        text.match(/इंजन\s*व\s*एम\s*\/\s*सी\s*सं\s*Engine\s+or\s+M\/c\s+No\.?\s*[:：]?\s*([A-Z0-9]+)/i);
    if (engineMatch) result.engineNumber = engineMatch[1];

    // --- Chassis ---
    const chassisMatch = text.match(/Chassis\s+Number\s*[:：]?\s*([A-Z0-9]+)/i) ||
                         text.match(/चेिसस\s*संखया\s*Chassis\s+Number\s*[:：]?\s*([A-Z0-9]+)/i);
    if (chassisMatch) result.chassisNumber = chassisMatch[1];

    // --- Make ---
    const makeMatch = text.match(
      /Make\s*[:：]?\s*([\s\S]*?)(?=\s*(?:कुल\s*कीमत|Total\s+Value|मॉडल|Model|अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i
    ) || text.match(/बनावट\s*Make\s*[:：]?\s*([\s\S]*?)(?=\s*(?:कुल\s*कीमत|Total\s+Value|मॉडल|Model|अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i);
    if (makeMatch) {
      let raw = makeMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      raw = raw.replace(/\s*(कुल\s*कीमत|Total\s+Value|मॉडल|Model|अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg).*$/i, '');
      result.make = raw;
    }

    // --- Model ---
    const modelMatch = text.match(
      /Model\s*[:：]?\s*([\s\S]*?)(?=\s*(?:अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i
    ) || text.match(/मॉडल\s*Model\s*[:：]?\s*([\s\S]*?)(?=\s*(?:अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i);
    if (modelMatch) {
      let raw = modelMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      raw = raw.replace(/\s*(अित|A\s+ddl|वेिरएंट|Variant|सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg).*$/i, '');
      result.model = raw;
    }

    // --- Variant ---
    const variantMatch = text.match(
      /Variant\s*[:：]?\s*([\s\S]*?)(?=\s*(?:सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i
    ) || text.match(/वेिरएंट\s*Variant\s*[:：]?\s*([\s\S]*?)(?=\s*(?:सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg|$))/i);
    if (variantMatch) {
      let raw = variantMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      raw = raw.replace(/\s*(सी\s*\.\s*सी|CC\s*\/\s*GVW|वाहन\s*की\s*शेणी|Class\s+of\s+Vehicle|ईधन\s*का\s*पकार|Type\s+of\s+Fuel|लाइसेस|Licensed|ढाचा|Body\s+Type|िनमारण|Year\s+of\s+Mfg).*$/i, '');
      result.variant = raw;
    }

    // --- Year ---
    const yearMatch = text.match(/Year\s+of\s+Mfg\.?\s*[:：]?\s*(\d{4})/i) ||
                      text.match(/िनमारण\s*वषर\s*Year\s+of\s+Mfg\.?\s*[:：]?\s*(\d{4})/i);
    if (yearMatch) result.manufacturingYear = yearMatch[1];

    // --- Colour ---
    const bodyMatch = text.match(/Body\s+Type\s*\/\s*Color\s*[:：]?\s*([^\n]+)/i) ||
                      text.match(/ढाचा\s*का\s*पकार\s*\/\s*रंग\s*Body\s+Type\s*\/\s*Color\s*[:：]?\s*([^\n]+)/i) ||
                      text.match(/Type\s+of\s+Body\s*[:：]?\s*([A-Za-z\s&\/]+)(?=\s+\d+|$)/i);
    if (bodyMatch) {
      const bodyColor = bodyMatch[1].trim();
      const parts = bodyColor.split(/\s*\/\s*/);
      
      if (parts.length >= 2) {
        result.colour = parts[1].trim();
      }
    }

    // --- CC / GVW ---
    const ccMatch = text.match(/CC\s*\/\s*GVW\s*[:：]?\s*(\d+)/i) ||
                    text.match(/सी\s*\.\s*सी\s*–\s*जी\s*\.\s*भी\s*डबलयू\s*CC\s*\/\s*GVW\s*[:：]?\s*(\d+)/i);
    if (ccMatch) result.cubicCapacity = ccMatch[1];

    // --- Seating Capacity ---
    const seatingMatch = text.match(/Licensed\s+Seating\s*\/\s*Carrying\s+Capacity\s*[:：]?\s*(\d+)/i) ||
                         text.match(/लाइसेस\s*िसिटंग\s*\/\s*वहन\s*की\s*कमता\s*कमत\s*Licensed\s+Seating\s*\/\s*Carrying\s+Capacity\s*[:：]?\s*(\d+)/i);
    if (seatingMatch) result.seatingCapacity = seatingMatch[1];

    // --- Fuel Type ---
    const fuelMatch = text.match(/Type\s+of\s+Fuel\s*[:：]?\s*([A-Z\s]+)/i) ||
                      text.match(/ईधन\s*का\s*पकार\s*\/\s*Type\s+of\s+Fuel\s*[:：]?\s*([A-Z\s]+)/i);
    if (fuelMatch) result.fuelType = fuelMatch[1].trim();

    // --- Registration District ---
    const regDistrictMatch = text.match(/Regn\.?\s*Authority\s*[:：]?\s*([A-Z\s]+)/i) ||
                             text.match(/पंजीकरण\s*अिध\s*\.\s*Regn\.?\s*Authority\s*[:：]?\s*([A-Z\s]+)/i);
    if (regDistrictMatch) result.regDistrict = regDistrictMatch[1].trim();

  } else {
    // ============================================================
    // Two-wheeler / Private Car logic
    // ============================================================
    const makeModel = text.match(/Make\s*&\s*Model\s*[:：]?\s*(.+?)(?=\s*Reg\.\s*No\.|$)/is);
    if (makeModel) {
      let raw = makeModel[1].trim().replace(/^Private\s*Car\s+/i, ""); 
      const tokens = raw.split(/\s+/);

      // 1. Logic for Make: Always the first token
      result.make = tokens[0] || "-";

      // 2. Logic for Model: The second token
      result.model = tokens[1] || "-";

      // 3. Logic for Variant: All subsequent tokens, excluding unwanted technical suffixes
      if (tokens.length > 2) {
        const stopWords = /^(STR|BS-III|BS-IV|BS6|G|V|VX|ZX|LXI|VXI|ZXI|AT|MT|\d)$/i;
        
        result.variant = tokens.slice(2)
          .filter(t => !stopWords.test(t))
          .join(" ")
          .trim();
      } else {
        result.variant = "-";
      }
    }

    const dataRowRegex = /([A-Z]{2}[-]?\d{2}[-]?[A-Z]{1,3}[-]?\d{4})\s+([A-Z0-9]+)\s+([A-Z0-9]+)(?:\s+([A-Z]+))?\s+(\d+)\s+(\d{4})\s+([\d+]+)\s+([A-Z\s]+)/i;
    const match = text.match(dataRowRegex);
    if (match) {
      result.registrationNumber = cleanRegistrationNumber(match[1]);
      result.engineNumber = match[2];
      result.chassisNumber = match[3];
      result.cubicCapacity = match[5];
      result.manufacturingYear = match[6];
      result.seatingCapacity = match[7];
      result.regDistrict = match[8].trim();
    } else {
      const lines = text.split(/\r?\n/);
      const regPattern = /[A-Z]{2}\s*[-]?\s*\d{2}\s*[-]?\s*[A-Z]{1,3}\s*[-]?\s*\d{4}/i;
      let dataLine = null;
      for (const line of lines) {
        if (regPattern.test(line)) { dataLine = line.trim(); break; }
      }
      if (dataLine) {
        const tokens = dataLine.split(/\s+/);
        if (tokens.length >= 7) {
          result.registrationNumber = cleanRegistrationNumber(tokens[0]);
          result.engineNumber = tokens[1] || "-";
          result.chassisNumber = tokens[2] || "-";
          let idx = 3;
          while (idx < tokens.length && /^[A-Z]+$/.test(tokens[idx])) idx++;
          if (idx < tokens.length && /^\d+$/.test(tokens[idx])) result.cubicCapacity = tokens[idx++];
          if (idx < tokens.length && /^\d{4}$/.test(tokens[idx])) result.manufacturingYear = tokens[idx++];
          if (idx < tokens.length) result.seatingCapacity = tokens[idx++];
          if (idx < tokens.length) result.regDistrict = tokens.slice(idx).join(" ");
        }
      }
    }
  }

  // --- Common Fields for both Commercial and Private ---
  const geo = text.match(/Geographical\s+Area\s*[:：]?\s*([A-Z\s.]+)/i);
  if (geo) {
    let area = geo[1].trim();
    if (area.endsWith('.')) area = area.slice(0, -1);
    result.geographicalArea = area;
  }

  let fin = text.match(/HYPOTHECATION\s*[:：]?\s*([^\n\r]+)/i) || 
            text.match(/Hypothecated\s+To\s*[:：]?\s*([^\n\r]+)/i) ||
            text.match(/Financier\s*[:：]?\s*([^\n\r]+)/i);
  if (fin) {
    let financier = fin[1].trim();
    financier = financier.replace(/Prev\s+Policy.*$/i, "").replace(/Nominee.*$/i, "").replace(/[,;]+$/g, "").trim();
    if (financier && financier !== "-") {
      result.financierName = formatFinancierName(financier);
    }
  }

  return result;
};

// =======================================
// MAIN COMPONENT
// =======================================

function NationalPolicyCard({ item }) {
  const [copied, setCopied] = useState(false);
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};
  const fullText = item?.fullText || "";

  const policyNumber = extractPolicyNumber(fullText);
  const insuranceCompany = extractInsuranceCompany(fullText);
  const branchAddress = extractBranchAddress(fullText);
  const autoInsuredDetails = extractInsuredDetails(fullText);
  const policyDates = extractPolicyDates(fullText);
  const extractedVehicle = extractVehicleDetailsFromText(fullText);
  const autoPremium = extractPremiumData(fullText);
  const dateOfIssue = extractDateOfIssue(fullText);
  const totalValue = extractIDV(fullText);
  const previousPolicyNumber = extractPreviousPolicyNumber(fullText);
  const previousInsurer = extractPreviousInsurer(fullText);

  const insuredName = insured?.insuredName || autoInsuredDetails?.insuredName || "-";
  const insuredAddress = insured?.insuredAddress || autoInsuredDetails?.insuredAddress || "-";
  const panNumber = insured?.panNumber || autoInsuredDetails?.panNumber || "-";
  const contactNumber = insured?.contactNumber || autoInsuredDetails?.contactNumber || "-";
  const email = insured?.email || autoInsuredDetails?.email || "-";
  const gstin = autoInsuredDetails?.gstin || "-";
  
  // FIX: Make sure we actually grab the NCB we extracted!
  const ncb = autoInsuredDetails?.ncb || "-"; 

  const vehicleCategory = getVehicleCategory(policy?.policyType, fullText);
  const productType = getProductType(policy?.policyType, fullText);

  const finalPremium = {
    calculatedOdPremium: premium?.calculatedOdPremium || autoPremium?.calculatedOdPremium || "0",
    calculatedTpPremium: premium?.calculatedTpPremium || autoPremium?.calculatedTpPremium || "0",
    totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
    totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
    netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
    gst: premium?.gst || autoPremium?.gst || "0",
    totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
    // FIX: Pass NCB directly into final premium so your view template can display it
    ncb: premium?.ncb || ncb, 
  };

  if (productType === "Standalone OD Policy") {
    finalPremium.totalOdPremium = finalPremium.netPremium;
  } else if (productType === "Liability Policy") {
    finalPremium.totalTpPremium = finalPremium.netPremium;
  }

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

export default NationalPolicyCard;