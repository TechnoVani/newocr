// src/components/NationalPolicyCard.jsx

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
  if (!financier || financier === "-") return "-";
  return String(financier).replace(/\s+/g, " ").toUpperCase().trim();
};

const cleanRegistrationNumber = (regNo) => {
  if (!regNo || regNo === "-") return "-";
  return String(regNo).replace(/[\s-]/g, "").toUpperCase().trim();
};

const cleanFieldValue = (value) => {
  const cleaned = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:,-]+|[\s:,-]+$/g, "")
    .trim();
  return cleaned || "-";
};

const formatNationalModelName = (value) => {
  const cleaned = cleanFieldValue(value);
  if (cleaned === "-") return "-";
  if (/^HF\s+DELUXE$/i.test(cleaned)) return "HF Deluxe";
  return cleaned.toUpperCase();
};

const deriveNationalMakeModel = (description = "") => {
  const rawText = cleanFieldValue(description);
  const categoryMatch = rawText.match(
    /^(Two\s*Wheeler|Private\s*Car|Commercial\s*Vehicle|Goods\s*Carrying|Passenger\s*Carrying)\s+(.+)$/i
  );
  const vehicleClass = cleanFieldValue(categoryMatch?.[1] || "");
  const modelText = cleanFieldValue(categoryMatch?.[2] || rawText);

  if (!modelText || modelText === "-") {
    return { make: "-", model: "-", variant: "-" };
  }

  const tokens = modelText.split(/\s+/).filter(Boolean);
  const fuelTypes = new Set(["PETROL", "DIESEL", "CNG", "LPG", "ELECTRIC", "EV"]);
  const fuelType = fuelTypes.has(tokens[tokens.length - 1]?.toUpperCase())
    ? tokens.pop().toUpperCase()
    : "-";

  if (/^Two\s*Wheeler$/i.test(vehicleClass) && /^DELUXE$/i.test(tokens[1] || "") && tokens.length > 2) {
    return {
      make: "-",
      model: formatNationalModelName(tokens.slice(0, 2).join(" ")),
      variant: cleanFieldValue(tokens.slice(2).join(" ")),
      fuelType,
    };
  }

  if (/^Two\s*Wheeler$/i.test(vehicleClass) && /^SP$/i.test(tokens[0] || "") && /^125$/i.test(tokens[1] || "")) {
    return {
      make: "HONDA",
      model: "SP 125",
      variant: cleanFieldValue(tokens.slice(2).join(" ")),
      fuelType: fuelType !== "-" ? fuelType : "PETROL",
    };
  }

  if (/^Two\s*Wheeler$/i.test(vehicleClass) && /^SUPER$/i.test(tokens[0] || "") && /^SPLENDOR$/i.test(tokens[1] || "")) {
    return {
      make: "HERO",
      model: "SUPER SPLENDOR",
      variant: cleanFieldValue(tokens.slice(2).join(" ")),
      fuelType: fuelType !== "-" ? fuelType : "PETROL",
    };
  }

  if (
    /^Two\s*Wheeler$/i.test(vehicleClass) &&
    /^SCOOTY$/i.test(tokens[0] || "") &&
    /^PEP$/i.test(tokens[1] || "") &&
    /^PLUS$/i.test(tokens[2] || "")
  ) {
    return {
      make: "TVS",
      model: "SCOOTY PEP PLUS",
      variant: cleanFieldValue(tokens.slice(3).join(" ")),
      fuelType: fuelType !== "-" ? fuelType : "PETROL",
    };
  }

  if (
    /^Two\s*Wheeler$/i.test(vehicleClass) &&
    /^PULSAR$/i.test(tokens[0] || "") &&
    /^NS\s*400$/i.test(tokens.slice(1).join(" "))
  ) {
    return {
      make: "BAJAJ",
      model: "PULSAR",
      variant: "NS400",
      fuelType: fuelType !== "-" ? fuelType : "PETROL",
    };
  }

  const isVariantToken = (token) =>
    /^[A-Z]{2,4}$/i.test(token) ||
    /^(?:STD|STANDARD|DLX|DELUXE|LX|LXI|VX|VXI|ZXI|ZX|SPORT|SELF|SPOKE|DISC|DRUM|TREND|TITANIUM|AMBIENTE|STYLE)$/i.test(token);

  const variantStartIndex = tokens.findIndex((token, index) =>
    index > 0 && isVariantToken(token)
  );

  const limitedIndex = tokens.findIndex((token) => /^Limited$/i.test(token));
  const makeTokenCount = limitedIndex >= 1
    ? limitedIndex + 1
    : /^Private\s*Car$/i.test(vehicleClass) && tokens.length >= 4 && !isVariantToken(tokens[2])
    ? 2
    : /^Private\s*Car$/i.test(vehicleClass) && tokens.length >= 3
      ? 1
      : 0;
  const make = makeTokenCount ? cleanFieldValue(tokens.slice(0, makeTokenCount).join(" ")) : "-";
  const detailTokens = makeTokenCount ? tokens.slice(makeTokenCount) : tokens;
  const detailVariantStartIndex = variantStartIndex >= makeTokenCount
    ? variantStartIndex - makeTokenCount
    : -1;

  const modelTokens = detailVariantStartIndex > 0
    ? detailTokens.slice(0, detailVariantStartIndex)
    : detailTokens;
  const variantTokens = detailVariantStartIndex > 0
    ? detailTokens.slice(detailVariantStartIndex)
    : [];

  return {
    make,
    model: formatNationalModelName(modelTokens.join(" ")),
    variant: cleanFieldValue(variantTokens.join(" ")),
    fuelType,
  };
};

const extractNationalVehicleTable = (text = "") => {
  const normalizedText = normalizeText(text).replace(/\s+/g, " ");
  const tableMatch = normalizedText.match(
    /Vehicle\s+Details\s+Make\s*&\s*Model\s+(.+?)\s+Reg\.\s*No\.\s+Engine\s+No\.\s+Chassis\s+No\.\s+Type\s+of\s+Body\s+(CC|GVW)\s+Mfg\.\s*Year\s+Seat\s+Cap\.\s+Reg\.\s*District\s+(.+?)\s+Geographical\s+Area\s*:/i
  );

  if (!tableMatch) return null;

  const modelInfo = deriveNationalMakeModel(tableMatch[1]);
  const capacityType = tableMatch[2].toUpperCase();
  const rowText = tableMatch[3].trim();
  const rowMatch = rowText.match(
    /([A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{3,4})\s+([A-Z0-9]+)\s+([A-Z0-9]+)\s+([A-Z ]+?)\s+(\d{2,5})\s+(\d{4})\s+([\d+]+)\s+([A-Z ]+)$/i
  );

  if (!rowMatch) return { ...modelInfo };

  return {
    ...modelInfo,
    registrationNumber: cleanRegistrationNumber(rowMatch[1]),
    engineNumber: cleanFieldValue(rowMatch[2]),
    chassisNumber: cleanFieldValue(rowMatch[3]),
    typeOfBody: cleanFieldValue(rowMatch[4]),
    cubicCapacity: capacityType === "CC" ? cleanFieldValue(rowMatch[5]) : "-",
    gvw: capacityType === "GVW" ? cleanFieldValue(rowMatch[5]) : "-",
    manufacturingYear: cleanFieldValue(rowMatch[6]),
    seatingCapacity: cleanFieldValue(rowMatch[7]),
    regDistrict: cleanFieldValue(rowMatch[8]),
  };
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
    return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
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

  let panNumber = "-";
  const panMatch = normalizedText.match(/PAN\s*No\.?\s*[:：]?\s*([A-Z0-9]+)/i) ||
                   normalizedText.match(/पैन\s*PAN\s*[:：]?\s*([A-Z0-9]+)/i);
                   
  if (panMatch && panMatch[1]) {
    const extracted = panMatch[1].trim().toUpperCase();
    if (extracted && !extracted.includes("GSTIN")) { 
      panNumber = extracted;
    }
  }

  let contactMatch = normalizedText.match(/फोन\s*Phone\s*[:：]\s*([*\dXx-]+)/i);
  if (!contactMatch) contactMatch = normalizedText.match(/संपकर\s*संखया\s*\/\s*Contact\s+Number\s*[:：]\s*([*\dXx-]+)/i);
  if (!contactMatch) contactMatch = normalizedText.match(/सेल\s*\/\s*Cell\s*[:：]\s*([*\dXx-]+)/i);
  if (!contactMatch) contactMatch = normalizedText.match(/Contact\s+Number\s*[:：]\s*([*\dXx-]+)/i);
  if (!contactMatch) contactMatch = normalizedText.match(/Telephone\s*[:：]\s*([*\dXx-]+)/i);
  
  const contactNumber = contactMatch?.[1]?.trim() || "-";

  let emailMatch = normalizedText.match(/ई\s*-\s*मेल\s*E-Mail\s*[:：]\s*([^\s]+)/i);
  if (!emailMatch) emailMatch = normalizedText.match(/Email\s*[:：]\s*([^\s]+@[^\s]+)/i);
  const email = emailMatch?.[1]?.trim() || "-";

  let insuredAddress = "-";
  const englishInsuredAddressMatch = normalizedText.match(
    /IXI\s+Insured\s+Details[\s\S]*?Address\s*[:：]\s*([\s\S]*?)\s*Pincode\s*[:：]\s*(\d{6})/i
  );
  if (englishInsuredAddressMatch) {
    const addressPart = englishInsuredAddressMatch[1]
      .replace(/\n+/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .trim();
    insuredAddress = `${addressPart} ${englishInsuredAddressMatch[2]}`.trim();
  }

  const addressBlockMatch = insuredAddress === "-" && normalizedText.match(
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

  return { insuredName, insuredAddress, panNumber, contactNumber, email, gstin };
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
    return { startDate: match[1], odExpireDate: match[2], tpExpireDate: match[2] };
  }

  match = text.match(
    /from\s+.*?of\s+(\d{2}\/\d{2}\/\d{4})\s+to\s+.*?of\s+(\d{2}\/\d{2}\/\d{4})/i
  );
  if (match) {
    return { startDate: match[1], odExpireDate: match[2], tpExpireDate: match[2] };
  }

  match = text.match(/(\d{2}\/\d{2}\/\d{4})\s+to\s+(\d{2}\/\d{2}\/\d{4})/);
  if (match) {
    return { startDate: match[1], odExpireDate: match[2], tpExpireDate: match[2] };
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
  if (/Stand\s*Alone\s*OD|OD\s+Only/i.test(text)) {
    const odPolMatch = text.match(/OD\s+Pol\s+No\s*[:：]\s*([A-Z0-9\-/]+)/i);
    if (odPolMatch?.[1]) return odPolMatch[1].trim();
  }

  const match = text.match(/Prev\s+Policy\s*[:：]\s*([^\n]+?)(?=\s*(?:Nominee|Financier|NOTE|$))/i);
  if (match) {
    const line = match[1].trim();
    let polMatch = line.match(/Pol\s*No\s*[:：]\s*([A-Z0-9\-/]+)/i);
    if (polMatch) return polMatch[1].trim();
    const tokenMatch = line.match(/\b([A-Z0-9]{10,})\b/);
    if (tokenMatch) return tokenMatch[1];
  }
  let fallback = text.match(/Previous\s+Policy\s+Number\s*[:：]\s*([^\n]+)/i);
  if (fallback?.[1]) return fallback[1].trim();
  fallback = text.match(/Pol\s*No\s*[:：]\s*([A-Z0-9/-]+)/i);
  return fallback?.[1] || "-";
};

const extractPreviousInsurer = (text = "") => {
  if (!text) return "-";
  const odInsurerMatch = /Stand\s*Alone\s*OD|OD\s+Only/i.test(text)
    ? text.match(/OD\s+Insurer\s*[:：]\s*([^\n]+?)(?=\s*(?:Nominee|NOTE|$))/i)
    : null;
  if (odInsurerMatch?.[1]) {
    return odInsurerMatch[1].trim();
  }

  const match = text.match(/Prev\s+Policy\s*[:：]\s*([^\n]+?)(?=\s*(?:Nominee|Financier|NOTE|$))/i);
  if (match) {
    const line = match[1].trim();
    const namePart = line.replace(/\s*\(?\s*Pol\s*No\s*[:：][^)]*\)?\s*$/i, '').trim();
    const cleaned = namePart.replace(/\s*Pol\s*No\s*[:：].*$/i, '').trim();
    if (cleaned) return cleaned;
  }
  let insMatch = text.match(/Previous\s+Insurer\s*[:：]\s*([^\n]+?)(?=\s*(?:Nominee|Financier|NOTE|$))/i);
  if (!insMatch) {
    insMatch = text.match(/(?:TP\/Ref\.?|OD)\s+Insurer\s*[:：]\s*([^\n]+?)(?=\s*(?:OD\s+Insurer|Nominee|NOTE|$))/i);
  }
  if (insMatch?.[1]) return insMatch[1].trim();
  return "-";
};

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

  let netMatch = text.match(/TOTAL\s+PREMIUM\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (!netMatch) netMatch = text.match(/(?:पीिमयम\s+)?Premium\s*[`]?\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (!netMatch) netMatch = text.match(/Premium\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (netMatch) result.netPremium = cleanNumber(netMatch[1]);
  if (/Stand\s*Alone\s*OD|OD\s+Only/i.test(text) && result.netPremium !== "-") {
    result.totalOdPremium = result.netPremium;
    result.totalTpPremium = "0";
  }

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
  if (!match) match = text.match(/NET\s+PAYABLE(?:\s*\([^)]*\))?\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (!match) match = text.match(/Total\s+Invoice\s+Value\s*\(In\s*figures\)\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i);
  if (match) result.totalPayable = cleanNumber(match[1]);

  return result;
};

// =======================================
// EXACT MERGED VEHICLE EXTRACTION LOGIC
// =======================================

const extractVehicleDetailsFromText = (text) => {
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
    regDistrict: "-", 
    fuelType: "-",
    gvw: "-", 
    ncb: "0%"
  };

  if (!text) return result;

  // 1. MAKE, MODEL & VARIANT (YOUR EXACT ORIGINAL CODE FIRST)
  const makeModelMatch = text.match(/Make\s*&\s*Model\s+([A-Za-z\s]+Limited|[A-Za-z\s]+Ltd\.?|[A-Za-z\s]+Motors)\s+([A-Z0-9]+)\s+([^\n\r]+?)(?=\s+Reg\.\s*No\.|\s+Engine\s*No\.|$)/i);
  if (makeModelMatch) {
    result.make = makeModelMatch[1].trim();
    result.model = makeModelMatch[2].trim();
    result.variant = makeModelMatch[3].trim();
  } else {
    const genericMakeModel = text.match(/Make\s*&\s*Model\s*[:：]?\s*(.+?)(?=\s*Reg\.\s*No\.|$)/is);
    if (genericMakeModel) {
      let raw = genericMakeModel[1].trim().replace(/^Private\s*Car\s+/i, ""); 
      const tokens = raw.split(/\s+/);
      result.make = tokens[0] || "-";
      result.model = tokens[1] || "-";
      if (tokens.length > 2) {
        result.variant = tokens.slice(2).filter(t => !/^(|Stop|\d)$/i.test(t)).join(" ").trim();
      }
    }
  }

  // BILINGUAL FALLBACK FOR MAKE/MODEL (Runs ONLY if your code didn't find anything)
  if (result.make === "-" || result.make === "") {
     const normalizedText = text.replace(/\s+/g, " ");
     const biMakeMatch = normalizedText.match(/(?:बनावट\s*)?Make\s+(.*?)(?=\s*(?:कुल|Total\s+Value|मॉडल|Model|$))/i);
     if (biMakeMatch && biMakeMatch[1] && !biMakeMatch[1].includes("NA")) {
       result.make = biMakeMatch[1].trim();
       
       const biModelMatch = normalizedText.match(/(?:मॉडल\s*)?Model\s+(.*?)(?=\s*(?:अित|Addl\.|वेिरएंट|Variant|$))/i);
       if (biModelMatch) result.model = biModelMatch[1].trim();
       
       const biVariantMatch = normalizedText.match(/(?:वेिरएंट\s*)?Variant\s+(.*?)(?=\s*(?:सी\s*\.\s*सी|CC\s*\/|वाहन\s*की|Class|$))/i);
       if (biVariantMatch) result.variant = biVariantMatch[1].trim().replace(/\.$/, '');
     }
  }

  // 2. DETECT FUEL TYPE (YOUR EXACT ORIGINAL CODE FIRST)
  if (result.variant !== "-" && /CNG/i.test(result.variant)) {
    result.fuelType = "CNG";
  } else if (result.variant !== "-" && /PETROL/i.test(result.variant)) {
    result.fuelType = "PETROL";
  } else if (result.variant !== "-" && /DIESEL/i.test(result.variant)) {
    result.fuelType = "DIESEL";
  } else {
    const fuelMatch = text.match(/Type\s+of\s+Fuel\s*[:：]?\s*([A-Z\s]+)/i);
    if (fuelMatch) {
       result.fuelType = fuelMatch[1].trim();
    } else {
       // Bilingual Fallback for Fuel
       const biFuel = text.replace(/\s+/g, " ").match(/(?:ईधन\s*का\s*पकार\s*\/\s*)?Type\s*of\s*Fuel\s*([A-Z]+)/i) || 
                      text.match(/Fuel\s*Type\s*([A-Z]+)/i);
       if (biFuel) result.fuelType = biFuel[1].trim();
    }
  }

  // 3. TABULAR ROW DATA EXTRACTION (YOUR EXACT ORIGINAL CODE FIRST)
  const vehicleRowRegex = /([A-Z]{2}[-]?\d{2}[-]?[A-Z]{1,3}[-]?\d{4})\s+([A-Z0-9]+)\s+([A-Z0-9]+)\s+([A-Z\s]+?)\s+(\d{3,4})\s+(\d{4})\s+([\d+]+)\s+([A-Z\s]+?)(?=\s+Geographical|\s+Class|$)/i;
  const rowMatch = text.match(vehicleRowRegex);

  if (rowMatch) {
    result.registrationNumber = cleanRegistrationNumber(rowMatch[1]);
    result.engineNumber = rowMatch[2].trim();
    result.chassisNumber = rowMatch[3].trim();
    result.cubicCapacity = rowMatch[5].trim();
    result.manufacturingYear = rowMatch[6].trim();
    result.seatingCapacity = rowMatch[7].trim(); 
    result.regDistrict = rowMatch[8].trim();
  } else {
    // Individual Fallbacks (YOUR EXACT ORIGINAL CODE FIRST)
    const regMatch = text.match(/Regn?\.?\s*No\.?\s*[:：]?\s*([A-Z0-9-]+)/i);
    if (regMatch) result.registrationNumber = cleanRegistrationNumber(regMatch[1]);

    const engineMatch = text.match(/Engine\s+(?:or\s+M\/c\s+)?No\.?\s*[:：]?\s*([A-Z0-9]+)/i);
    if (engineMatch) result.engineNumber = engineMatch[1].trim();

    const chassisMatch = text.match(/Chassis\s+Number\s*[:：]?\s*([A-Z0-9]+)/i);
    if (chassisMatch) result.chassisNumber = chassisMatch[1].trim();

    const ccMatch = text.match(/CC\s*[:：]?\s*(\d+)/i);
    if (ccMatch) result.cubicCapacity = ccMatch[1];

    const yearMatch = text.match(/Mfg\.\s*Year\s*[:：]?\s*(\d{4})/i);
    if (yearMatch) result.manufacturingYear = yearMatch[1];

    const seatMatch = text.match(/Seat\s*Cap\.\s*[:：]?\s*([\d+]+)/i);
    if (seatMatch) result.seatingCapacity = seatMatch[1];

    // BILINGUAL FALLBACKS FOR MISSING DATA (Runs ONLY for fields still missing)
    const normalizedText = text.replace(/\s+/g, " ");

    if (result.registrationNumber === "-") {
      const biReg = normalizedText.match(/(?:पंजी\s*\.\s*संखया\s*)?Regn?\.?\s*Number\s*([A-Z0-9-]+)/i);
      if (biReg) result.registrationNumber = cleanRegistrationNumber(biReg[1]);
    }
    
    if (result.engineNumber === "-") {
      const biEng = normalizedText.match(/(?:इंजन\s*व\s*एम\s*\/\s*सी\s*सं\s*\.\s*)?Engine(?:\s*or\s*M\/c)?\s*No\.?\s*([A-Z0-9]+)/i);
      if (biEng) result.engineNumber = biEng[1].trim();
    }
    
    if (result.chassisNumber === "-") {
      const biChas = normalizedText.match(/(?:चेिसस\s*संखया\s*)?Chassis\s*Number\s*([A-Z0-9]+)/i);
      if (biChas) result.chassisNumber = biChas[1].trim();
    }
    
    if (result.cubicCapacity === "-" && result.gvw === "-") {
      const ccGvwMatch = normalizedText.match(/CC\s*\/\s*GVW\s*(\d+)/i);
      if (ccGvwMatch) {
         const val = parseInt(ccGvwMatch[1], 10);
         if (val > 1000) result.gvw = val.toString();
         else result.cubicCapacity = val.toString();
      } else {
         const gvwMatch = normalizedText.match(/GVW\s*[:：]?\s*(\d+)/i);
         if (gvwMatch) result.gvw = gvwMatch[1];
      }
    }
    
    if (result.manufacturingYear === "-") {
      const biYear = normalizedText.match(/(?:िनमारण\s*वषर\s*)?Year\s*of\s*Mfg\.?\s*(\d{4})/i);
      if (biYear) result.manufacturingYear = biYear[1];
    }
    
    if (result.seatingCapacity === "-") {
      const biSeat = normalizedText.match(/(?:Licensed\s*Seating\s*\/\s*Carrying\s*Capacity)\s*([\d+]+)/i);
      if (biSeat) result.seatingCapacity = biSeat[1];
    }
  }

  const nationalTable = extractNationalVehicleTable(text);
  if (nationalTable) {
    result.registrationNumber = nationalTable.registrationNumber || result.registrationNumber;
    result.engineNumber = nationalTable.engineNumber || result.engineNumber;
    result.chassisNumber = nationalTable.chassisNumber || result.chassisNumber;
    result.cubicCapacity = nationalTable.cubicCapacity || result.cubicCapacity;
    result.gvw = nationalTable.gvw || result.gvw;
    result.manufacturingYear = nationalTable.manufacturingYear || result.manufacturingYear;
    result.seatingCapacity = nationalTable.seatingCapacity || result.seatingCapacity;
    result.regDistrict = nationalTable.regDistrict || result.regDistrict;
    result.make = nationalTable.make && nationalTable.make !== "-" ? nationalTable.make : result.make;
    result.model = nationalTable.model && nationalTable.model !== "-" ? nationalTable.model : result.model;
    result.variant = nationalTable.variant && nationalTable.variant !== "-" ? nationalTable.variant : result.variant;
    result.fuelType = nationalTable.fuelType && nationalTable.fuelType !== "-" ? nationalTable.fuelType : result.fuelType;

    if (/^Two$/i.test(result.make) && /^Two\s*Wheeler/i.test(text.match(/Make\s*&\s*Model\s+(.+?)\s+Reg\.\s*No\./i)?.[1] || "")) {
      result.make = nationalTable.make && nationalTable.make !== "-" ? nationalTable.make : "-";
    }

    if (result.fuelType === "-" && /^Two\s*Wheeler/i.test(text.match(/Make\s*&\s*Model\s+(.+?)\s+Reg\.\s*No\./i)?.[1] || "")) {
      result.fuelType = "PETROL";
    }
  }

  const classOfVehicleMatch = text.match(/Class\s+of\s+Vehicle\s+(.+?)\s+FasTag\s+ID/i);
  if (classOfVehicleMatch) {
    result.commercialVehicleType = cleanFieldValue(classOfVehicleMatch[1]);
  }

  // 4. FINANCIER NAME (YOUR EXACT ORIGINAL CODE)
  let finMatch = text.match(/HYPOTHECATION\s*[:：]?\s*([^\n\r]+)/i) || 
                 text.match(/Hypothecated\s+To\s*[:：]?\s*([^\n\r]+)/i) ||
                 text.match(/Financier\s*[:：]?\s*([^\n\r]+)/i);
  if (finMatch) {
    let financier = finMatch[1].trim();
    financier = financier
      .replace(/Previous\s+Policy.*$/i, "")
      .replace(/Prev\s+Policy.*$/i, "")
      .replace(/TP\/Ref\..*$/i, "")
      .replace(/OD\s+Pol\s+No.*$/i, "")
      .replace(/Nominee.*$/i, "")
      .replace(/[,;]+$/g, "")
      .trim();
    if (financier && financier !== "-") {
      result.financierName = formatFinancierName(financier);
    }
  }

  // 5. GEOGRAPHICAL AREA (YOUR EXACT ORIGINAL CODE)
  const geoMatch = text.match(/Geographical\s+Area\s*[:：]?\s*([A-Z\s.]+)/i);
  if (geoMatch) {
    let area = geoMatch[1].trim();
    area = area.replace(/\s*FastTag\s+ID.*$/i, "").trim();
    if (area.endsWith('.')) area = area.slice(0, -1);
    result.geographicalArea = area;
  }

  // 6. NO CLAIM BONUS (NCB) (YOUR EXACT ORIGINAL CODE)
  const ncbPatterns = [
    /No\s*Claim\s*Bonus[\s:-]*(\d{1,2}(?:\.\d+)?)\s*%/i,
    /\bNCB(?:\s*(?:Discount|Percentage|Applicable))?[\s:-]*(\d{1,2}(?:\.\d+)?)\s*%/i,
    /\bNCB\s*\(\s*%\s*\)[\s:-]*(\d{1,2}(?:\.\d+)?)/i,
    /Deduct\s*(\d{1,2}(?:\.\d+)?)\s*%?\s*for\s*NCB/i
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

function NationalPolicyCard({ item }) {
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
 
  const vehicleCategory = getVehicleCategory(policy?.policyType, fullText);
  const productType = getProductType(policy?.policyType, fullText);

  const finalPremium = {
    calculatedOdPremium: "-",
    calculatedTpPremium: "-",
    totalOdPremium: premium?.totalOdPremium || autoPremium?.totalOdPremium || "0",
    totalTpPremium: premium?.totalTpPremium || autoPremium?.totalTpPremium || "0",
    netPremium: premium?.netPremium || autoPremium?.netPremium || "0",
    gst: premium?.gst || autoPremium?.gst || "0",
    totalPayable: premium?.totalPayable || autoPremium?.totalPayable || "0",
  };

  if (productType === "Standalone OD Policy") {
    finalPremium.totalOdPremium = finalPremium.netPremium;
  } else if (productType === "Liability Policy") {
    finalPremium.totalTpPremium = finalPremium.netPremium;
  }

  // Merge vehicle logic to prioritize dynamic extraction over fallback empty fields
  const mergedVehicle = {
    registrationNumber: extractedVehicle.registrationNumber !== "-" ? extractedVehicle.registrationNumber : (vehicle?.registrationNumber || "-"),
    chassisNumber: extractedVehicle.chassisNumber !== "-" ? extractedVehicle.chassisNumber : (vehicle?.chassisNumber || "-"),
    engineNumber: extractedVehicle.engineNumber !== "-" ? extractedVehicle.engineNumber : (vehicle?.engineNumber || "-"),
    make: extractedVehicle.make !== "-" ? extractedVehicle.make : (vehicle?.make || "-"),
    model: extractedVehicle.model !== "-" ? extractedVehicle.model : (vehicle?.model || "-"),
    variant: extractedVehicle.variant !== "-" ? extractedVehicle.variant : (vehicle?.variant || "-"),
    manufacturingYear: extractedVehicle.manufacturingYear !== "-" ? extractedVehicle.manufacturingYear : (vehicle?.manufacturingYear || "-"),
    cubicCapacity: extractedVehicle.cubicCapacity !== "-" ? extractedVehicle.cubicCapacity : (vehicle?.cubicCapacity || "-"),
    seatingCapacity: extractedVehicle.seatingCapacity !== "-" ? extractedVehicle.seatingCapacity : (vehicle?.seatingCapacity || "-"),
    fuelType: extractedVehicle.fuelType !== "-" ? extractedVehicle.fuelType : (vehicle?.fuelType || "-"),
    financierName: extractedVehicle.financierName !== "-" ? extractedVehicle.financierName : (vehicle?.financierName || "-"),
    gvw: extractedVehicle.gvw !== "-" ? extractedVehicle.gvw : (vehicle?.gvw || "-"),
    commercialVehicleType: extractedVehicle.commercialVehicleType || vehicle?.commercialVehicleType || "-",
    ncb: extractedVehicle.ncb || "0%",
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
      vehicle={mergedVehicle}
      extractedVehicle={extractedVehicle}
    />
  );
}

export default NationalPolicyCard;
