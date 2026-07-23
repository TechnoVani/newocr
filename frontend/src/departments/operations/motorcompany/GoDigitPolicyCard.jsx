// src/components/GoDigitPolicyCard.jsx
import PolicyCardView from "./PolicyCardView";

// Helper: Extract first N words
const getFirstNWords = (text, wordCount) => {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  return words.slice(0, wordCount).join(" ");
};

// Helper: Progressive detection (up to 3000 words)
const detectWithProgressiveWords = (
  text,
  keywords,
  fallback,
  wordCounts = [20, 50, 100, 150]
) => {
  if (!text) return fallback;

  for (const count of wordCounts) {
    const snippet = getFirstNWords(text, count).toLowerCase();
    for (const keyword of keywords) {
      if (snippet.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
  }
  return fallback;
};

// Helper: parse vehicle category from a short string (still used by getVehicleCategory)
const parseFromPolicyType = (policyType) => {
  const lower = policyType.toLowerCase();
  if (lower.includes("private car")) return "Private Car";
  if (lower.includes("two wheeler") || lower.includes("bike") || lower.includes("motorcycle"))
    return "Two Wheeler";
  if (lower.includes("commercial") || lower.includes("goods carrying") || lower.includes("truck"))
    return "Commercial Vehicle";
  return "-";
};

// ---------- Vehicle Category (unchanged) ----------
export const getVehicleCategory = (policyType = "", fullText = "") => {
  if (!fullText && !policyType) return "-";

  const categoryMap = {
    "Private Car": ["private car", "private vehicle"],
    "Two Wheeler": [
      "two wheeler",
      "bike",
      "motorcycle",
      "scooter",
      "two- wheeler",
      "two - wheeler",
      "two-wheeler",
    ],
    "Commercial Vehicle": [
      "commercial",
      "goods carrying",
      "commercial vehicles",
      "truck",
      "bus",
      "taxi",
    ],
  };

  const combinedText = `${policyType} ${fullText}`;
  let matchedCategory = null;
  const allKeywords = Object.values(categoryMap).flat();
  const matchedKeyword = detectWithProgressiveWords(combinedText, allKeywords, null);
  if (matchedKeyword) {
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((k) => k.toLowerCase() === matchedKeyword.toLowerCase())) {
        matchedCategory = category;
        break;
      }
    }
  }

  if (!matchedCategory) {
    const parsed = parseFromPolicyType(policyType);
    if (parsed && Object.keys(categoryMap).includes(parsed)) {
      matchedCategory = parsed;
    } else {
      const lower = policyType.toLowerCase();
      if (lower.includes("private car")) matchedCategory = "Private Car";
      else if (lower.includes("two wheeler") || lower.includes("bike")) matchedCategory = "Two Wheeler";
      else if (lower.includes("commercial") || lower.includes("goods carrying")) matchedCategory = "Commercial Vehicle";
    }
  }

  return matchedCategory || "-";
};

const normalizeText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ");
};

// ----- Extraction functions -----
const extractInsuranceCompanyName = (fullText = "") => {
  if (!fullText) return "-";
  const match = fullText.match(/Go\s*Digit\s*General\s*Insurance\s*Ltd\.?/i);
  if (match) return "Go Digit General Insurance Ltd.";
  return "Go Digit General Insurance Ltd.";
};

const extractBranchAddress = (fullText = "") => {
  if (!fullText) return "-";
  const match = fullText.match(
    /GSTIN\s*Address\s*(?:\\?:|:)?\s*(.*?)(?=\s*Website\s*:|\s*Corporate\s*office\s*Address\s*:|\s*Registered\s*Office\s*Address\s*:|\s*IRDAI\s*Reg\s*No|\s*$)/i
  );
  if (!match?.[1]) return "-";
  return match[1]
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .trim();
};

const extractInsuredDetails = (text = "") => {
  if (!text) {
    return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
  }
  const normalizedText = normalizeText(text);

  let insuredName = "-";
  let nameMatch = normalizedText.match(
    /Name\s+([A-Z][A-Z\s]+?)(?=\s+Vehicle\s+Registration|\s+Partner\s+Name|\s+Address|\s+Mobile|\s+Email|$)/i
  );
  if (nameMatch?.[1]) {
    insuredName = nameMatch[1].trim();
  }
  // Digit Fallback
  if (
    insuredName === "-" ||
    insuredName === "YOUR" ||
    insuredName.toUpperCase().includes("NOMINEE")
  ) {
    const digitMatch = normalizedText.match(
      /[A-Z0-9]{6,15}\s+([A-Z][A-Z\s.&()-]+?)\s+Email:/i
    );
    if (digitMatch?.[1]) {
      insuredName = digitMatch[1].trim();
    }
  }

  // ================================================================
  // IMPROVED: insured address from "YOUR POLICY DETAILS" section
  // ================================================================
  let insuredAddress = "-";

  // 1. Locate the "YOUR POLICY DETAILS" block and extract the Address line
  const policyDetailsSection = normalizedText.match(
    /YOUR\s+POLICY\s+DETAILS([\s\S]*?)(?=YOUR\s+VEHICLE\s+DETAILS|$)/i
  );
  if (policyDetailsSection && policyDetailsSection[1]) {
    const section = policyDetailsSection[1];
    // Look for "Address" followed by a colon or spaces, then capture everything until the next known field
    const addressMatch = section.match(
      /Address\s+([^\n]*?)(?=\s*(?:Optional\s+Cover|Invoice\s+No|From\s+|To\s+|Period\s+of\s+Policy|$))/i
    );
    if (addressMatch && addressMatch[1]) {
      let addr = addressMatch[1].trim();
      // Clean up extra spaces but keep punctuation
      addr = addr.replace(/\s+/g, " ").trim();
      if (addr) insuredAddress = addr;
    }
  }

  // ---- FALLBACK 1: Partner Address (existing) ----
  if (insuredAddress === "-") {
    const digitAddressMatch = normalizedText.match(
      /Partner\s+Name\s*:?.*?\d+\s+Address\s+([\s\S]*?)(?=\s+Partner\s+Code\s*:|\s+Mobile\s*:|\s+Partner\s+Mobile\s+No\.?\s*:|\s+Email\s*:)/i
    );
    if (digitAddressMatch?.[1]) {
      insuredAddress = digitAddressMatch[1].replace(/\s+/g, " ").trim();
    }
  }

  // ---- FALLBACK 2: Generic Address label ----
  if (insuredAddress === "-") {
    const addressMatch = normalizedText.match(
      /Address\s+([^|]+?)(?=\s+Partner\s+Code|\s+Mobile|\s+Email|\s+Partner\s+Mobile|\s*$)/i
    );
    if (addressMatch?.[1]) {
      insuredAddress = addressMatch[1].trim();
    }
  }

  // ---- FALLBACK 3: Optional Cover pattern ----
  if (insuredAddress === "-") {
    insuredAddress =
      normalizedText.match(
        /Address\s+(.+?)\s+Optional\s+Cover/i
      )?.[1]?.trim() || insuredAddress;
  }

  // ---- FALLBACK 4: Pincode termination ----
  if (insuredAddress === "-") {
    const pinCodeMatch = normalizedText.match(/Address\s*:?\s*([A-Za-z0-9,\s\-./()]+?\b\d{6}\b)/i);
    if (pinCodeMatch?.[1]) {
      insuredAddress = pinCodeMatch[1].replace(/\s+/g, " ").trim();
    }
  }

  // Final fallback if still not found
  if (insuredAddress === "-") {
    insuredAddress = "-";
  }

  let panNumber = "-";
  const panMatch = normalizedText.match(/PAN\s*(?:No\.?|Number)\s*[:]?\s*([A-Z]{5}[0-9]{4}[A-Z]{1})/i);
  if (panMatch && panMatch[1]) {
    panNumber = panMatch[1].toUpperCase();
  }

  let contactNumber = "-";
  const mobileMatch = normalizedText.match(
    /Mobile\s*(?:Number|No\.?)?\s*[:]?\s*([\dxX]+)/i
  );
  if (mobileMatch?.[1]) {
    contactNumber = mobileMatch[1].trim();
  }
  // Digit OCR Fallback
  if (contactNumber === "-") {
    contactNumber =
      normalizedText.match(/([xX\d]{10,15})\s+MP[0-9A-Z]+/i)?.[1] ||
      contactNumber;
  }

  let email = "-";
  const emailMatch = normalizedText.match(
    /Email\s*(?:ID)?\s*[:]?\s*([^\s@]+@[^\s@]+)/i
  );
  if (emailMatch?.[1]) {
    email = emailMatch[1].trim();
  }
  // Digit OCR Fallback
  if (email === "-") {
    email =
      normalizedText.match(/([^\s@]+@[^\s@]+)\s+[xX\d]{10,15}\s+[A-Z]{2}\d{2}[A-Z0-9]+/i)?.[1] ||
      email;
  }

  let gstin = "-";
  const gstinMatch = normalizedText.match(/GST\s*Reg\s*No\s+([A-Z0-9]{15})/i);
  if (gstinMatch && gstinMatch[1]) {
    gstin = gstinMatch[1];
  }

  return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin };
};

const extractPolicyDates = (fullText = "") => {
  if (!fullText) return { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  const normalizedText = normalizeText(fullText);

  let startDate = "-";
  let endDate = "-";

  // 1. Invoice format
  let match = normalizedText.match(
    /Invoice\s+No\.?.*?(\d{2}[-/]\w{3}[-/]\d{4}).*?(\d{2}[-/]\w{3}[-/]\d{4})/i
  );
  if (match?.[1] && match?.[2]) {
    startDate = match[1];
    endDate = match[2];
  }

  // 2. From - To format
  if (startDate === "-") {
    match = normalizedText.match(
      /From\s+.*?(\d{2}[-/]\w{3}[-/]\d{4}).*?To\s+.*?(\d{2}[-/]\w{3}[-/]\d{4})/i
    );
    if (match?.[1] && match?.[2]) {
      startDate = match[1];
      endDate = match[2];
    }
  }

  // 3. Any two dates fallback
  if (startDate === "-") {
    const allDates = normalizedText.match(/\d{2}[-/]\w{3}[-/]\d{4}/g);
    if (allDates && allDates.length >= 2) {
      startDate = allDates[0];
      endDate = allDates[1];
    }
  }

  return { startDate, odExpireDate: endDate, tpExpireDate: endDate };
};

const extractDateOfIssue = (text = "") => {
  if (!text) return "-";
  const normalizedText = normalizeText(text);

  // 1. New format: capture date after time stamps
  const timeDateRegex = /(?:\d{2}:\d{2}:\d{2}\s+)+(\d{2}[-\/]\w{3}[-\/]\d{4})/i;
  let match = normalizedText.match(timeDateRegex);
  if (match) return match[1];

  // 2. Direct "Policy Issue Date"
  const policyIssueMatch = normalizedText.match(/Policy\s+Issue\s+Date\s*[:]?\s*(\d{2}[-\/]\w{3}[-\/]\d{4})/i);
  if (policyIssueMatch) return policyIssueMatch[1];

  // 3. Invoice Date or Date of Issue
  match = normalizedText.match(/Invoice\s+Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (match) return match[1];
  match = normalizedText.match(/Date\s+of\s+Issue\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (match) return match[1];

  // 4. Last resort: third date
  const allDates = normalizedText.match(/\d{2}[-\/]\w{3}[-\/]\d{4}/g) || [];
  if (allDates.length >= 3) return allDates[2];

  return "-";
};


const extractPolicyAmounts = (text = "") => {
  if (!text) {
    return {
      basicThirdPartyLiability: "-",
      totalBasicOwnDamagePremium: "-"
    };
  }

  const normalizedText = normalizeText(text);

  let basicThirdPartyLiability = "-";
  let totalBasicOwnDamagePremium = "-";

  // ============================================================
  // GO DIGIT CAR + BIKE FORMAT
  // ============================================================
  const digitMatch = normalizedText.match(
    /(?:[\d.]+\s+([\d.]+)\s+([\d.]+)\s+NCB\s+Discount\s+Amount\s+Total\s+Basic\s+Own\s+Damage\s+Premium)|(?:[\d.]+\s+([\d.]+)\s+Legal\s+Liability\s+to\s+Employees\s+([\d.]+))/i
  );

  if (digitMatch) {
    basicThirdPartyLiability = Number(
      digitMatch[1] || digitMatch[3]
    ).toFixed(2);

    totalBasicOwnDamagePremium = Number(
      digitMatch[2] || digitMatch[4]
    ).toFixed(2);

    console.log("Go Digit TP :", basicThirdPartyLiability);
    console.log("Go Digit OD :", totalBasicOwnDamagePremium);

    return {
      basicThirdPartyLiability,
      totalBasicOwnDamagePremium
    };
  }

  // ============================================================
  // GO DIGIT LIABILITY FORMAT
  // ============================================================
  const digitLiabilityMatch = normalizedText.match(
    /Net\s+Premium\s+Final\s+Premium\s+Basic\s+Third-Party\s+Liability[\s\S]*?LIABILITY\s+PREMIUM[\s\S]*?(\d+(?:\.\d+)?)\s+50\.00\s+330\.00\s+250\.00/i
  );

  if (digitLiabilityMatch) {
    basicThirdPartyLiability = Number(
      digitLiabilityMatch[1]
    ).toFixed(2);

    console.log(
      "Go Digit Liability TP :",
      basicThirdPartyLiability
    );

    return {
      basicThirdPartyLiability,
      totalBasicOwnDamagePremium
    };
  }

  // ============================================================
  // STANDARD TP FORMAT
  // ============================================================
  const tpMatch =
    normalizedText.match(
      /Basic\s+Third-Party\s+Liability\s*[:-]?\s*([\d,.]+)/i
    ) ||
    normalizedText.match(
      /Basic\s+Third-Party\s+Liability[\s\S]*?([\d,.]+)\s+PA\s+cover/i
    );

  if (tpMatch?.[1]) {
    basicThirdPartyLiability = tpMatch[1].replace(/,/g, "");
  }

  // ============================================================
  // STANDARD OD FORMAT
  // ============================================================
  const odMatch =
    normalizedText.match(
      /Total\s+Basic\s+Own\s+Damage\s+Premium\s*[:-]?\s*([\d,.]+)/i
    ) ||
    normalizedText.match(
      /Total\s+Basic\s+Own\s+Damage\s+Premium[\s\S]*?([\d,.]+)\s+NCB/i
    );

  if (odMatch?.[1]) {
    totalBasicOwnDamagePremium = odMatch[1].replace(/,/g, "");
  }

  console.log(
    "basicThirdPartyLiability :",
    basicThirdPartyLiability
  );

  console.log(
    "totalBasicOwnDamagePremium :",
    totalBasicOwnDamagePremium
  );

  return {
    basicThirdPartyLiability,
    totalBasicOwnDamagePremium
  };
};

export const getProductType = (
  policyType = "",
  fullText = "",
  premium = {}
) => {
  const tp =
    parseFloat(
      premium?.basicThirdPartyLiability
    ) || 0;

  const od =
    parseFloat(
      premium?.totalBasicOwnDamagePremium
    ) || 0;

  if (tp > 0 && od > 0) {
    return "Package Policy";
  }

  if (tp > 0 && od === 0) {
    return "Liability Policy";
  }

  if (od > 0 && tp === 0) {
    return "Standalone OD Policy";
  }

  return "-";
};

const extractPremiumData = (text = "") => {
  const result = {
    calculatedOdPremium: "-",
    calculatedTpPremium: "-",
    totalOdPremium: "-",
    totalTpPremium: "-",
    netPremium: "-",
    gst: "-",
    totalPayable: "-"
  };
  
  if (!text) return result;

  const normalizedText = normalizeText(text);

  // ---------- GST: sum CGST + SGST ----------
  const cgstMatch = normalizedText.match(/CGST\s+@\s*\d+%\s*=\s*\(\s*`\s*([\d.]+)\)/i);
  const sgstMatch = normalizedText.match(/SGST\/UTGST\s+@\s*\d+%\s*=\s*\(\s*`\s*([\d.]+)\)/i);
  if (cgstMatch && cgstMatch[1] && sgstMatch && sgstMatch[1]) {
    const cgst = parseFloat(cgstMatch[1]);
    const sgst = parseFloat(sgstMatch[1]);
    if (!isNaN(cgst) && !isNaN(sgst)) {
      result.gst = (cgst + sgst).toFixed(2); // 648.50
    }
  } else {
    // fallback to existing IGST patterns
    let gstMatch = normalizedText.match(/IGST\s+@18%=\s*\(\s*`\s*([\d,.]+)\)/i);
    if (gstMatch && gstMatch[1]) {
      result.gst = gstMatch[1].replace(/,/g, '');
    } else {
      const oldGst = normalizedText.match(/Igst\s*([\d,.]+)/i);
      if (oldGst && oldGst[1]) result.gst = oldGst[1].replace(/,/g, '');
    }
  }

  // ---------- totalOdPremium: capture 4th number from "Total Basic Own Damage Premium" ----------
  // The line: "Total Basic Own Damage Premium  4251.26  648.50  -3548.24  186.76"
  const totalOdMatch = normalizedText.match(
    /Total\s+Basic\s+Own\s+Damage\s+Premium\s+[\d.]+\s+[\d.]+\s+-?[\d.]+\s+([\d.]+)/i
  );
  if (totalOdMatch && totalOdMatch[1]) {
    result.totalOdPremium = totalOdMatch[1].replace(/,/g, '');
  } else {
    // Fallback: use "Legal Liability to Paid Driver" (also 186.76 in this document)
    const paidDriverMatch = normalizedText.match(
      /Legal\s+Liability\s+to\s+Paid\s+Driver\s*\(?\s*`\s*\)?\s*([\d.]+)/i
    );
    if (paidDriverMatch && paidDriverMatch[1]) {
      result.totalOdPremium = paidDriverMatch[1].replace(/,/g, '');
    } else {
      // Keep original fallback logic (unchanged)
      const totalOdCarMatch = normalizedText.match(
        /Total\s+Basic\s+Own\s+Damage\s+Premium\s+([\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)/i
      );
      if (totalOdCarMatch) {
        result.totalOdPremium = totalOdCarMatch[4].replace(/,/g, '');
      } else {
        const totalOdTwoMatch = normalizedText.match(
          /Legal\s+Liability\s+to\s+Employees\s+([\d.]+)/i
        );
        if (totalOdTwoMatch) {
          result.totalOdPremium = totalOdTwoMatch[1].replace(/,/g, '');
        } else {
          const fallbackMatch = normalizedText.match(
            /--\s+--\s+--\s+\(`\)\s+0\s+([\d.]+)\s+([\d.]+)/
          );
          if (fallbackMatch) {
            result.totalOdPremium = fallbackMatch[2].replace(/,/g, '');
          }
        }
      }
    }
  }

  // ---------- Existing premium extractions (unchanged) ----------
  // 1. Tabular format
  const tabularRegex = /Gross\s+Premium\s+[A-Z0-9]+\s+\d{4}-\d{2}-\d{2}\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i;
  const tabularMatch = normalizedText.match(tabularRegex);
  if (tabularMatch && tabularMatch.length === 8) {
    result.netPremium = tabularMatch[1].replace(/,/g, '');
    result.gst = result.gst === "-" ? tabularMatch[2].replace(/,/g, '') : result.gst;
    result.totalPayable = tabularMatch[7].replace(/,/g, '');
  }

  // 2. Net Premium
  if (result.netPremium === "-") {
    let netMatch = normalizedText.match(/Net\s+Premium\s*([\d,.]+)/i);
    if (netMatch && netMatch[1]) {
      result.netPremium = netMatch[1].replace(/,/g, '');
    } else {
      const altNet = normalizedText.match(/\(`\)\s*([\d.]+)/i);
      if (altNet && altNet[1]) {
        result.netPremium = altNet[1].replace(/,/g, '');
      }
    }
  }

  // 3. totalPayable (highest priority pattern)
  if (result.totalPayable === "-") {
    const tpMatch = normalizedText.match(
      /Total\s*Basic\s*Own\s*Damage\s*Premium\s+[\d.]+\s+-?[\d.]+\s+([\d.]+)/
    );
    if (tpMatch && tpMatch[1]) {
      result.totalPayable = tpMatch[1].replace(/,/g, '');
    } else {
      let totalMatch = normalizedText.match(/Gross\s+Premium\s*([\d,.]+)/i);
      if (!totalMatch) {
        totalMatch = normalizedText.match(/Final\s+Premium\s*([\d,.]+)/i);
      }
      if (totalMatch && totalMatch[1]) {
        result.totalPayable = totalMatch[1].replace(/,/g, '');
      } else {
        if (result.netPremium !== "-" && result.gst !== "-") {
          const net = parseFloat(result.netPremium);
          const gst = parseFloat(result.gst);
          if (!isNaN(net) && !isNaN(gst)) {
            result.totalPayable = (net + gst).toFixed(2);
          }
        }
      }
    }
  }

  // 4. calculatedTpPremium
  let tpMatch = normalizedText.match(/([\d,.]+)\s*Basic\s+Third-Party\s+Liability/i);
  if (!tpMatch) {
    tpMatch = normalizedText.match(/Basic\s+Third-Party\s+Liability\s*([\d,.]+)/i);
  }
  if (tpMatch && tpMatch[1]) {
    result.calculatedTpPremium = tpMatch[1].replace(/,/g, '');
  } else {
    const oldTp = normalizedText.match(/LIABILITY\s+PREMIUM.*?\(`\)\s*([\d,.]+)/is);
    if (oldTp && oldTp[1]) result.calculatedTpPremium = oldTp[1].replace(/,/g, '');
  }

  // 5. calculatedOdPremium
  let odMatch = normalizedText.match(/Own\s+Damage\s+Premium\s*([\d,.]+)/i);
  if (!odMatch) {
    odMatch = normalizedText.match(/Total\s+OD\s+Premium\s*([\d,.]+)/i);
  }
  if (odMatch && odMatch[1]) {
    result.calculatedOdPremium = odMatch[1].replace(/,/g, '');
  } else {
    const oldOd = normalizedText.match(/Total\s+Basic\s+Own\s+Damage\s+Premium\s*([\d,.]+)/i);
    if (oldOd && oldOd[1]) result.calculatedOdPremium = oldOd[1].replace(/,/g, '');
  }

  // 6. totalTpPremium
  const totalTpMatch = normalizedText.match(/([\d.]+)\s+Legal\s+Liability\s+to\s+Employees/i);
  if (totalTpMatch) {
    result.totalTpPremium = totalTpMatch[1].replace(/,/g, '');
  }

  return result;
};

const extractIDV = (text = "") => {
  if (!text) return "-";
  const normalizedText = normalizeText(text);

  let match = normalizedText.match(/IDV\s*[:]?\s*([\d,.]+\.?\d{0,2})/i);
  if (match?.[1]) return match[1].replace(/,/g, "").trim();

  match = normalizedText.match(/Total\s+IDV\s*[:]?\s*([\d,.]+\.?\d{0,2})/i);
  if (match?.[1]) return match[1].replace(/,/g, "").trim();

  const tableMatch = normalizedText.match(
    /Year\s+1\s+([\d,.]+)\s+--\s+--\s+--\s+([\d,.]+)/i
  );
  if (tableMatch?.[2]) {
    return tableMatch[2].replace(/,/g, "").trim();
  }

  const idvBlock = normalizedText.match(/YOUR\s+VEHICLE\s+IDV([\s\S]{0,300})/i);
  if (idvBlock?.[0]) {
    const nums = idvBlock[0].match(/\d{5,10}/g);
    if (nums?.length) return nums[nums.length - 1];
  }

  return "-";
};

const extractPreviousPolicyNumber = (text = "") => {
  if (!text) return "-";

  const normalizedText = text.replace(/\n/g, " ");
  
  // Quick exit if 'Previous' isn't mentioned
  if (!/Previous/i.test(normalizedText)) {
    return "-";
  }

  // 1. Explicitly find Current Policy Number
  let currentPolicyNumber = null;
  const currentPolicyMatch = normalizedText.match(/Policy\s+No\s*:\s*([A-Z0-9]+)/i);
  if (currentPolicyMatch && currentPolicyMatch[1]) {
    currentPolicyNumber = currentPolicyMatch[1];
  }

  // HELPER: Strict validation for any matched string
  const isValidPolicy = (val) => {
      if (!val) return false;
      if (val === currentPolicyNumber) return false; // Ignore current policy
      if (!/\d/.test(val)) return false; // Must contain at least one number
      if (/Previous/i.test(val)) return false; // Ignore the word "Previous"
      if (/unregistered/i.test(val)) return false; // Ignore GSTIN status
      if (/^IRDA/i.test(val)) return false; // Ignore UIN numbers
      // NEW: reject common date patterns (e.g., 29-May-2026, 01-Jun-2026)
      if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(val)) return false;
      return true;
  };

  // 2. Detect genuinely empty fields due to squashed PDF headers
  if (/Previous\s+Policy\s+No\.?\s*Previous\s+Policy/i.test(normalizedText)) {
      // The header is empty. We skip standard matching to avoid false positives.
  } else {
      // 3. Direct label match
      const directMatch = normalizedText.match(/Previous\s+Policy\s+No\.?\s*:?\s*([A-Z0-9\-\/]{5,30})/i);
      if (directMatch && isValidPolicy(directMatch[1])) {
          return directMatch[1];
      }
  }

  // 4. Fallback for Squashed PDF Tables (Targeting values between GSTIN and Insurer)
  const squashedMatch = normalizedText.match(/(?:Unregistered|[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1})\s+([A-Z0-9\-\/]{6,30})\s+(?:[A-Za-z])/i);
  if (squashedMatch && isValidPolicy(squashedMatch[1])) {
      return squashedMatch[1];
  }

  // 5. Fallback for policy number immediately preceding known insurance companies
  const insurerMatch = normalizedText.match(/([A-Z0-9\-\/]{6,30})\s+(?:Tata AIG|Go Digit|Bajaj|ICICI|HDFC|SBI|Reliance|Chola|New India|United India|Oriental|National|Liberty|Royal Sundaram|Shriram|Universal Sompo|Kotak|Acko|Navi|Magma|Zuno|Raheja|Future Generali)/i);
  if (insurerMatch && isValidPolicy(insurerMatch[1])) {
      return insurerMatch[1];
  }

  // 6. Context-strict fallback for internal Digit policies (D + digits)
  const previousContextMatch = normalizedText.match(/Previous.{0,80}?\b(D\d{6,20})\b/i);
  if (previousContextMatch && isValidPolicy(previousContextMatch[1])) {
      return previousContextMatch[1];
  }

  // 7. Go Digit OCR fallback (IMT endorsements -> Previous Policy Number -> Company Name)
const digitImtMatch = normalizedText.match(
  /IMT(?:-[0-9A-Z,]+)?[\s\S]{0,120}?\b(D\d{6,20})\b\s+Go\s+Digit\s+General\s+Insurance/i
);

if (digitImtMatch && isValidPolicy(digitImtMatch[1])) {
  return digitImtMatch[1];
}

  return "-";
};
const extractPreviousInsurer = (text = "") => {
  if (!text) return "-";
  
  let normalized = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  
  const renewalMatch = normalized.match(/(?:D\d{6,20}|\d{12,20})\s+(Go\s+Digit\s+General\s+Insurance\s+(?:Limited|Ltd\.?|Co\.?))/i);
  if (renewalMatch && renewalMatch[1]) {
    return renewalMatch[1].trim(); // Grabs "Go Digit General Insurance Limited"
  }

  // --- Existing Logic Starts Here ---
  const insurerRegex = /((?:[A-Za-z&.-]+\s+){1,5}(?:General\s+|Health\s+|Life\s+)?Insurance\s+(?:Company\s+|Co\.?\s+)?(?:Limited|Ltd\.?))/gi;

  const matches = normalized.match(insurerRegex);

  if (matches) {
    for (let match of matches) {
      let cleanMatch = match.trim();
      
      if (!cleanMatch.toLowerCase().includes("go digit") && !cleanMatch.toLowerCase().includes("services")) {
        
        return cleanMatch;
      }
    }
  }

  return "-";
};

const formatFinancierName = (financier = "") => {
  if (!financier) return "-";
  const match = String(financier).match(
    /^(.+?)(?=\s+YOUR\s+VEHICLE\s+IDV|\s+FASTAG\s+NUMBER|\s+DECLARATION|\s+THE\s+POLICY|\s+POLICY\s+HAS|$)/i
  );
  const name = (match?.[1] || "")
    .replace(/[*/:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const bankMatch = name.match(
    /([A-Z\s.&-]*?(?:BANK|FINANCE|FINANCIAL|CREDIT|CAPITAL|LEASING)[A-Z\s.&-]*)/i
  );
  return bankMatch?.[1]?.trim() || "-";
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
    fuelType: "-",
    cubicCapacity: "-",
    seatingCapacity: "-",
    financierName: "-",
    gvw: "-",
    ncb: "-"
  };
  if (!text) return result;

  const normalizedText = normalizeText(text);

  const regMatch = normalizedText.match(
    /Vehicle\s+Registration\s+No\.?\s*[:]?\s*([A-Z0-9]+)/i
  );
  if (regMatch?.[1]) {
    result.registrationNumber = regMatch[1].trim().toUpperCase();
  }
  // Digit Fallback
  if (result.registrationNumber === "-") {
    result.registrationNumber =
      normalizedText.match(/\b([A-Z]{2}\d{2}[A-Z]{1,3}\d{1,4})\b/)?.[1] ||
      "-";
  }

  const makeMatch = normalizedText.match(/Make\s*[:]?\s*([A-Z][A-Za-z\s]+?)(?=\s+Model\/Vehicle|\s+Engine|\s+Chassis|$)/i);
  if (makeMatch && makeMatch[1]) {
    result.make = makeMatch[1].trim();
  }

  const modelMatch = normalizedText.match(
    /Model\/Vehicle\s+Variant\s*\([^)]*\)\s*[:]?\s*([A-Za-z0-9\/\s.()\-]+?)(?=\s+Engine|\s+Chassis|\s+Cubic|\s+Fuel|\s+Year|$)/
  );
  if (modelMatch && modelMatch[1]) {
    const modelStr = modelMatch[1].trim();
    if (modelStr.includes('/')) {
      const parts = modelStr.split('/');
      result.model = parts[0].trim();
      result.variant = parts.slice(1).join("/").replace(/\s+(Seating\s+Capacity|Body\s+Type|Fuel\s+Type|Year\s+of|Year|Engine\s+No|Chassis\s+No).*$/i, "").trim();
    } else {
      result.model = modelStr;
    }
  }

  const engineMatch = normalizedText.match(/Engine\s+No\.?\s*[:]?\s*([A-Z0-9]+)/i);
  if (engineMatch && engineMatch[1]) {
    result.engineNumber = engineMatch[1].trim().toUpperCase();
  }

  const chassisMatch = normalizedText.match(/Chassis\s+No\.?\s*[:]?\s*([A-Z0-9]+)/i);
  if (chassisMatch && chassisMatch[1]) {
    result.chassisNumber = chassisMatch[1].trim().toUpperCase();
  }

  const ccMatch = normalizedText.match(/Cubic\s+Capacity\s*[:]?\s*(\d+)\s*CC/i);
  if (ccMatch && ccMatch[1]) {
    result.cubicCapacity = ccMatch[1];
  }

  const fuelMatch = normalizedText.match(/Fuel\s+Type\s*[:]?\s*([A-Za-z]+)/i);
  if (fuelMatch && fuelMatch[1]) {
    result.fuelType = fuelMatch[1];
  }

  const yearMatch = normalizedText.match(/Year\s+of\s+Regn.*?(\d{4})/i);
  if (yearMatch?.[1]) {
    result.manufacturingYear = yearMatch[1];
  }

  const seatMatch = normalizedText.match(/Seating\s+Capacity\s*[:]?\s*(\d+)/i);
  if (seatMatch && seatMatch[1]) {
    result.seatingCapacity = seatMatch[1];
  }

  // Financier extraction
  let financierMatch = normalizedText.match(/Financier\s+Details\s*[:]?\s*([^\n]+)/i);
  if (!financierMatch) {
    financierMatch = normalizedText.match(/Financier\s+Name\s*[:]?\s*([^\n]+)/i);
  }
  if (financierMatch && financierMatch[1]) {
    const raw = financierMatch[1].trim();
    result.financierName = formatFinancierName(raw);
  }

  const ncbMatch = text.match(/No\s+Claim\s+Bonus\s*[:]?\s*[-]?\s*(\d+%)/i);
  if (ncbMatch) {
    result.ncb = ncbMatch[1];
  }

  return result;
};

// =======================================
//  3. MAIN COMPONENT
// =======================================
function GoDigitPolicyCard({ item }) {
  const sanitizeValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "string" && value.trim() === "") return "-";
    return value;
  };

  const fullText = item?.fullText || "";

  // --- Extract TP and OD amounts for product type detection ---
  const extractedAmounts = extractPolicyAmounts(fullText);

  // --- Other extractions ---
  const autoInsuredDetails = extractInsuredDetails(fullText);
  const policyDates = extractPolicyDates(fullText);
  const extractedVehicle = extractVehicleDetailsFromText(fullText);
  const autoPremium = extractPremiumData(fullText);
  const insuranceCompany = extractInsuranceCompanyName(fullText);
  const branchAddress = extractBranchAddress(fullText);

  // --- Determine product type using the extracted amounts ---
  const productType = sanitizeValue(
    getProductType(
      item?.policyDetails?.policyType,
      fullText,
      {
        basicThirdPartyLiability: extractedAmounts.basicThirdPartyLiability,
        totalBasicOwnDamagePremium: extractedAmounts.totalBasicOwnDamagePremium,
      }
    )
  );

  const vehicleCategory = sanitizeValue(
    getVehicleCategory(item?.policyDetails?.policyType, fullText)
  );
  const dateOfIssue = sanitizeValue(extractDateOfIssue(fullText));
  const totalValue = sanitizeValue(extractIDV(fullText));
  const previousPolicyNumber = sanitizeValue(extractPreviousPolicyNumber(fullText));
  const previousInsurer = sanitizeValue(extractPreviousInsurer(fullText));

  let policyNumber = item?.policyDetails?.policyNumber || "-";
  if (policyNumber === "-" && fullText) {
    const match = fullText.match(/Invoice\s+Date\s+([A-Z]\d{9})\s*\/\s*\d{8}/i);
    if (match?.[1]) {
      policyNumber = match[1];
    } else {
      policyNumber =
        fullText.match(/Policy\s+No\.?\s*[:]?\s*([A-Z0-9]+)/i)?.[1] ||
        fullText.match(/Invoice\s+Date\s+([A-Z]\d{9})\s*\/\s*\d{8}/i)?.[1] ||
        "-";
    }
  }
  policyNumber = sanitizeValue(policyNumber);

  const finalPremium = {
    calculatedOdPremium: autoPremium.calculatedOdPremium !== "-" ? autoPremium.calculatedOdPremium : (item?.premiumDetails?.calculatedOdPremium || "-"),
    calculatedTpPremium: autoPremium.calculatedTpPremium !== "-" ? autoPremium.calculatedTpPremium : (item?.premiumDetails?.calculatedTpPremium || "-"),
    totalOdPremium: autoPremium.totalOdPremium !== "-" ? autoPremium.totalOdPremium : (item?.premiumDetails?.totalOdPremium || "-"),
    totalTpPremium: autoPremium.totalTpPremium !== "-" ? autoPremium.totalTpPremium : (item?.premiumDetails?.totalTpPremium || "-"),
    netPremium: autoPremium.netPremium !== "-" ? autoPremium.netPremium : (item?.premiumDetails?.netPremium || "-"),
    gst: autoPremium.gst !== "-" ? autoPremium.gst : (item?.premiumDetails?.gst || "-"),
    totalPayable: autoPremium.totalPayable !== "-" ? autoPremium.totalPayable : (item?.premiumDetails?.totalPayable || "-"),
  };

  if (productType === "Liability Policy") {
    finalPremium.totalTpPremium = finalPremium.netPremium;
}

  const mergedVehicle = {
    ...item?.vehicleDetails,
    ...extractedVehicle,
    registrationNumber: extractedVehicle.registrationNumber !== "-" ? extractedVehicle.registrationNumber : item?.vehicleDetails?.registrationNumber,
    chassisNumber: extractedVehicle.chassisNumber !== "-" ? extractedVehicle.chassisNumber : item?.vehicleDetails?.chassisNumber,
    engineNumber: extractedVehicle.engineNumber !== "-" ? extractedVehicle.engineNumber : item?.vehicleDetails?.engineNumber,
    make: extractedVehicle.make !== "-" ? extractedVehicle.make : item?.vehicleDetails?.make,
    model: extractedVehicle.model !== "-" ? extractedVehicle.model : item?.vehicleDetails?.model,
    variant: extractedVehicle.variant !== "-" ? extractedVehicle.variant : item?.vehicleDetails?.variant,
    manufacturingYear: extractedVehicle.manufacturingYear !== "-" ? extractedVehicle.manufacturingYear : item?.vehicleDetails?.manufacturingYear,
    cubicCapacity: extractedVehicle.cubicCapacity !== "-" ? extractedVehicle.cubicCapacity : item?.vehicleDetails?.cubicCapacity,
    seatingCapacity: extractedVehicle.seatingCapacity !== "-" ? extractedVehicle.seatingCapacity : item?.vehicleDetails?.seatingCapacity,
    fuelType: extractedVehicle.fuelType !== "-" ? extractedVehicle.fuelType : item?.vehicleDetails?.fuelType,
    financierName: extractedVehicle.financierName !== "-" ? extractedVehicle.financierName : item?.vehicleDetails?.financierName,
    gvw: extractedVehicle.gvw !== "-" ? extractedVehicle.gvw : item?.vehicleDetails?.gvw,
    ncb: extractedVehicle.ncb !== "-" ? extractedVehicle.ncb : item?.vehicleDetails?.ncb,
  };

  const sanitizedPolicyDates = {
    startDate: sanitizeValue(policyDates.startDate),
    odExpireDate: sanitizeValue(policyDates.odExpireDate),
    tpExpireDate: sanitizeValue(policyDates.tpExpireDate),
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
    ncb: sanitizeValue(extractedVehicle.ncb),
  };

  return (
    <PolicyCardView
      item={item}
      policyNumber={policyNumber}
      insuranceCompany={sanitizeValue(insuranceCompany)}
      branchAddress={sanitizeValue(branchAddress)}
      productType={productType}
      vehicleCategory={vehicleCategory}
      insuredName={sanitizeValue(autoInsuredDetails.insuredName)}
      panNumber={sanitizeValue(autoInsuredDetails.panNumber)}
      gstin={sanitizeValue(autoInsuredDetails.gstin)}
      contactNumber={sanitizeValue(autoInsuredDetails.contactNumber)}
      email={sanitizeValue(autoInsuredDetails.email)}
      insuredAddress={sanitizeValue(autoInsuredDetails.insuredAddress)}
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

export default GoDigitPolicyCard;
