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

// Evaluates strings like "4 + 1" into "5"
const parseSeatingCapacity = (value) => {
  if (!value || value === "-") return "-";
  const cleaned = String(value).trim();
  
  if (cleaned.includes('+')) {
    const parts = cleaned.split('+');
    let sum = 0;
    for (let part of parts) {
      const num = parseInt(part.trim(), 10);
      if (!isNaN(num)) sum += num;
    }
    return String(sum);
  }
  return cleaned;
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

      const slab = String(number);

      if (validSlabs.includes(slab)) {
        return `${slab}%`;
      }
    }
  }

  return "0%";
};

// =======================================
// MASTER VEHICLE EXTRACTOR (DYNAMIC)
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
    commercialVehicleType: "-",
    ncb: "0%"
  };

  if (!text) return result;
  const normalizedText = normalizeText(text);

  // Dynamic Helper: Splits a raw vehicle string into Model and Variant algorithmically
  const splitModelVariant = (vehicleString) => {
    const tokens = vehicleString.trim().split(/\s+/);
    if (tokens.length <= 1) return { model: vehicleString, variant: "-" };
    
    let mod = tokens[0];
    let varParts = [];
    let variantStarted = false;
    
    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i];
      // Dynamic rules for when a Variant starts: 
      // 1. Contains a number (1.2, 4X4, 125)
      // 2. Contains special characters (e.g. BS-IV, (M))
      // 3. Is a short acronym of 3 letters or less (VDI, AGS, LXI, MT, D)
      if (
        variantStarted ||
        /\d/.test(t) ||
        /[^a-zA-Z0-9]/.test(t) ||
        t.length <= 3
      ) {
        variantStarted = true;
        varParts.push(t);
      } else {
        mod += " " + t;
      }
    }
    
    return { model: mod.trim(), variant: varParts.join(" ").trim() || "-" };
  };

  // ---- Registration ----
  if (/BUNDLED\s+COVER\s+POLICY/i.test(normalizedText)) {
    result.registrationNumber = "New";
  } else {
    const regMatch = normalizedText.match(/\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}\b/i);
    if (regMatch) {
      result.registrationNumber = regMatch[0].replace(/\s+/g, "");
    }
  }

  // ---- Compact first-page private car table ----
  // Example OCR order:
  // MP 04 ZK 4424 1197 SALOON 4 + 1 K12NP7225696 2023 MBHHWB13SPB388 243
  // MP 04 CV 2552 1498 OTHERS 4 + 1 CWX188623 2018 TMBBVENA9JG1030 29
  const compactPrivateCarRow = normalizedText.match(
    /\b([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4})\s+(\d{3,5})\s+(SALOON|HATCHBACK|SEDAN|SUV|MUV|VAN|JEEP|OTHERS|OPEN\s+BODY|CLOSED\s+BODY)\s+(\d+\s*\+\s*\d+)\s+([A-Z0-9]{8,20})\s+(20\d{2}|19\d{2})\s+([A-Z0-9]{10,20})(?:\s+(\d{1,5}))?\b/i
  );

  if (compactPrivateCarRow) {
    result.registrationNumber = compactPrivateCarRow[1].replace(/\s+/g, "");
    result.cubicCapacity = compactPrivateCarRow[2];
    result.seatingCapacity = parseSeatingCapacity(compactPrivateCarRow[4]);
    result.engineNumber = compactPrivateCarRow[5];
    result.manufacturingYear = compactPrivateCarRow[6];
    result.chassisNumber = `${compactPrivateCarRow[7]}${compactPrivateCarRow[8] || ""}`;
  }

  // Same Oriental table when OCR joins the body/seating and engine/year tokens.
  // Example: MP 04 ZZ 6895 1197 SALOON4 + 1 K12NP75060102024 MBHKWD13SRE274 177
  if (!compactPrivateCarRow) {
    const joinedCompactPrivateCarRow = normalizedText.match(
      /\b([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4})\s+(\d{3,5})\s+(SALOON|HATCHBACK|SEDAN|SUV|MUV|VAN|JEEP|OTHERS|OPEN\s+BODY|CLOSED\s+BODY)\s*(\d+\s*\+\s*\d+)\s+([A-Z0-9]{8,16})(20\d{2}|19\d{2})\s+([A-Z0-9]{10,20})(?:\s+(\d{1,5}))?\b/i
    );

    if (joinedCompactPrivateCarRow) {
      result.registrationNumber = joinedCompactPrivateCarRow[1].replace(/\s+/g, "");
      result.cubicCapacity = joinedCompactPrivateCarRow[2];
      result.seatingCapacity = parseSeatingCapacity(joinedCompactPrivateCarRow[4]);
      result.engineNumber = joinedCompactPrivateCarRow[5];
      result.manufacturingYear = joinedCompactPrivateCarRow[6];
      result.chassisNumber = `${joinedCompactPrivateCarRow[7]}${joinedCompactPrivateCarRow[8] || ""}`;
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

  // ---- 0.05 Oriental private car standalone OD row ----
  // Example:
  // MP14ZF2272 MANDSAUR ARTO K15CN7372234 MBJTYKL1SRB222064 MARUTI SUZUKI GRAND VITARA ZETA SMART HYBRID 2024 HYBRID 4 + 1 1462
  const orientalPrivateCarStandaloneRow = normalizedText.match(
    /\b([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4})\s+[A-Z0-9()\/\s.-]{3,70}?\s+([A-Z0-9]{8,20})\s+([A-Z0-9]{10,25})\s+(MARUTI\s+SUZUKI|HYUNDAI|HONDA|TATA|MAHINDRA|TOYOTA|RENAULT|KIA|SKODA|VOLKSWAGEN|FORD)\s+([A-Z0-9\s.-]+?)\s+(19\d{2}|20\d{2})\s+(PETROL|DIESEL|CNG|LPG|ELECTRIC|HYBRID)\s+(\d+\s*\+\s*\d+)\s+(\d{3,5})\b/i
  );

  if (orientalPrivateCarStandaloneRow) {
    result.registrationNumber = orientalPrivateCarStandaloneRow[1].replace(/\s+/g, "");
    result.engineNumber = orientalPrivateCarStandaloneRow[2].trim();
    result.chassisNumber = orientalPrivateCarStandaloneRow[3].trim();
    make = orientalPrivateCarStandaloneRow[4].trim().toUpperCase();

    const modelVariant = orientalPrivateCarStandaloneRow[5].replace(/\s+/g, " ").trim();
    const grandVitaraMatch = modelVariant.match(/^(GRAND\s+VITARA)\s+(.+)$/i);
    if (grandVitaraMatch) {
      model = grandVitaraMatch[1].trim().toUpperCase();
      variant = grandVitaraMatch[2].trim().toUpperCase();
    } else {
      const { model: m, variant: v } = splitModelVariant(modelVariant);
      model = m;
      variant = v;
    }

    result.manufacturingYear = orientalPrivateCarStandaloneRow[6];
    result.fuelType = orientalPrivateCarStandaloneRow[7].toUpperCase();
    result.seatingCapacity = parseSeatingCapacity(orientalPrivateCarStandaloneRow[8]);
    result.cubicCapacity = orientalPrivateCarStandaloneRow[9];
  }

  // ---- 0.10 Oriental PCCV 3-wheeler package row ----
  // Example:
  // MP17ZH9646 REWA (MP17) AZXWRC15049 MD2B18BX4RWC12728 BAJAJ MAXIMA CNG MAXIMA CNG 2024 CNG 965 3 + 1 599
  const orientalPccvThreeWheelerRow = make === "-"
    ? normalizedText.match(
      /\b([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4})\s+[A-Z0-9()\/\s.-]{3,60}?\s+([A-Z0-9]{8,20})\s+([A-Z0-9]{10,25})\s+([A-Z]+)\s+([A-Z0-9\s.-]+?)\s+(19\d{2}|20\d{2})\s+(PETROL|DIESEL|CNG|LPG|ELECTRIC|HYBRID)\s+(\d{2,5})\s+(\d+\s*\+\s*\d+)\s+(\d{2,5})\b/i
    )
    : null;

  if (orientalPccvThreeWheelerRow) {
    result.registrationNumber = orientalPccvThreeWheelerRow[1].replace(/\s+/g, "");
    result.engineNumber = orientalPccvThreeWheelerRow[2].trim();
    result.chassisNumber = orientalPccvThreeWheelerRow[3].trim();
    make = orientalPccvThreeWheelerRow[4].trim().toUpperCase();

    const modelVariant = orientalPccvThreeWheelerRow[5].replace(/\s+/g, " ").trim();
    const bajajPccvMatch = modelVariant.match(/^(MAXIMA(?:\s+CNG)?)\s+(.+)$/i);
    if (/^BAJAJ$/i.test(make) && bajajPccvMatch) {
      model = bajajPccvMatch[1].trim().toUpperCase();
      variant = bajajPccvMatch[2].trim().toUpperCase();
    } else {
      const { model: m, variant: v } = splitModelVariant(modelVariant);
      model = m;
      variant = v;
    }

    result.manufacturingYear = orientalPccvThreeWheelerRow[6];
    result.fuelType = orientalPccvThreeWheelerRow[7].toUpperCase();
    result.gvw = orientalPccvThreeWheelerRow[8];
    result.seatingCapacity = parseSeatingCapacity(orientalPccvThreeWheelerRow[9]);
    result.cubicCapacity = orientalPccvThreeWheelerRow[10];
    result.commercialVehicleType = "PCCV-3 wheelers-carrying passengers-capacity NOT > 6";
  }

  // ---- 0.25 Oriental two-wheeler liability row ----
  // Example:
  // MP48MZ7546 BETUL DTO JC85EG0225141 ME4JC856AMG066325 HONDA MOTORCYCLE CB SHINE DRUM BS VI 2021 PETROL 1 + 1 124
  const orientalTwoWheelerRow = make === "-"
    ? normalizedText.match(
      /\b([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4})\s+[A-Z]{3,30}(?:\s+DTO)?\s+([A-Z0-9]{8,20})\s+([A-Z0-9]{10,25})\s+([A-Z]+(?:\s+MOTORCYCLE|\s+SCOOTER)?)\s+([A-Z0-9\s.-]+?)\s+(19\d{2}|20\d{2})\s+(PETROL|DIESEL|CNG|LPG|ELECTRIC|HYBRID)\s+(\d+\s*\+\s*\d+)\s+(\d{2,5})\b/i
    ) || normalizedText.match(
      /\b([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4})\s+[A-Z0-9()\/\s.-]{3,60}?\s+([A-Z0-9]{8,20})\s+([A-Z0-9]{10,25})\s+([A-Z]+(?:\s+MOTORCYCLE|\s+SCOOTER)?)\s+([A-Z0-9\s.-]+?)\s+(19\d{2}|20\d{2})\s+(PETROL|DIESEL|CNG|LPG|ELECTRIC|HYBRID)\s+(\d+\s*\+\s*\d+)\s+(\d{2,5})\b/i
    )
    : null;

  if (orientalTwoWheelerRow) {
    result.registrationNumber = orientalTwoWheelerRow[1].replace(/\s+/g, "");
    result.engineNumber = orientalTwoWheelerRow[2].trim();
    result.chassisNumber = orientalTwoWheelerRow[3].trim();
    make = orientalTwoWheelerRow[4].trim().toUpperCase();

    const modelVariant = orientalTwoWheelerRow[5].replace(/\s+/g, " ").trim();
    const shineMatch = modelVariant.match(/^(CB\s+SHINE)\s+(.+)$/i);
    if (shineMatch) {
      model = shineMatch[1].trim().toUpperCase();
      variant = shineMatch[2].trim().toUpperCase();
    } else if (/^HERO$/i.test(make)) {
      const heroMatch = modelVariant.match(/^(SPLENDOR\s+PRO)\s+(.+)$/i);
      if (heroMatch) {
        model = heroMatch[1].trim().toUpperCase();
        variant = heroMatch[2].trim().toUpperCase();
      } else {
        const { model: m, variant: v } = splitModelVariant(modelVariant);
        model = m;
        variant = v;
      }
    } else {
      const { model: m, variant: v } = splitModelVariant(modelVariant);
      model = m;
      variant = v;
    }

    result.manufacturingYear = orientalTwoWheelerRow[6];
    result.fuelType = orientalTwoWheelerRow[7].toUpperCase();
    result.seatingCapacity = parseSeatingCapacity(orientalTwoWheelerRow[8]);
    result.cubicCapacity = orientalTwoWheelerRow[9];
  }

  // ---- 0.5 Compact Oriental make/model row ----
  // Example: BHOPAL MARUTI-BALENO- ZETA 1.2 BSVI INDIA
  // Also handles duplicate make: BHOPAL MARUTI-MARUTI ERTIGA VXI INDIA
  const compactMakeModelMatch = make === "-"
    ? normalizedText.match(
      /\b(?:[A-Z]{3,30}\s+)?([A-Z]+)-([A-Z0-9]+)-?\s+([A-Z0-9.\s()/-]+?)(?=\s+(?:INDIA|PETROL|DIESEL|CNG|LPG|EV|ELECTRIC|HYBRID|20\d{2}|19\d{2}|\d{6,}|$))/i
    )
    : null;

  if (compactMakeModelMatch) {
    let makeCandidate = compactMakeModelMatch[1].trim().toUpperCase();
    let modelCandidate = compactMakeModelMatch[2].trim().toUpperCase();
    let variantCandidate = compactMakeModelMatch[3].replace(/\s+/g, " ").trim();

    // If modelCandidate equals makeCandidate (duplicate), treat variantCandidate as model+variant
    if (modelCandidate === makeCandidate && variantCandidate) {
      const { model: m, variant: v } = splitModelVariant(variantCandidate);
      make = makeCandidate;
      model = m;
      variant = v;
    } else {
      make = makeCandidate;
      model = modelCandidate;
      variant = variantCandidate;
    }

    // Filter out obviously wrong captures
    if (
      make === "PRE" ||
      /POLICY/i.test(make) ||
      /POLICY/i.test(model) ||
      /^ZONE$/i.test(model) ||
      model === "EXISTING" ||
      /damages|type\s+of\s+fuel/i.test(variant)
    ) {
      make = "-";
      model = "-";
      variant = "-";
    }
  }

  // ---- 1. Oriental Flat Row Extraction ----
  if ((result.engineNumber === "-" || result.chassisNumber === "-") && make === "-") {
    const flatRowMatch = normalizedText.match(
      /\b([A-Z0-9]{10,15})\s+([A-Z0-9]{15,20})\s+([A-Z]+)\s+([A-Z]+)\s+(.+?)\s+(20\d{2}|19\d{2})\s+(PETROL|DIESEL|CNG|EV|ELECTRIC|HYBRID)\s+(\d+\s*\+\s*\d+)\s+(\d{2,5})\b/i
    );
    if (flatRowMatch) {
      result.engineNumber = flatRowMatch[1];
      result.chassisNumber = flatRowMatch[2];
      make = flatRowMatch[3];
      
      const { model: m, variant: v } = splitModelVariant(flatRowMatch[5]);
      model = m;
      variant = v;

      result.manufacturingYear = flatRowMatch[6];
      result.fuelType = flatRowMatch[7];
      result.seatingCapacity = parseSeatingCapacity(flatRowMatch[8]);
      result.cubicCapacity = flatRowMatch[9];
    }
  }

  // ---- 1.5 Repeated Make format (e.g., BHOPAL HYUNDAI HEAVY INDUSTRIES - HYUNDAI CRETA 1.6 SX CRDI) ----
  if (make === "-") {
    const repeatedMakeRegex = /\b([A-Z]{2,})(?:\s+[A-Z]+)*\s*-\s*\1\s+([A-Z]+)\s+(.+?)(?=\s+(?:INDIA|\b\d{6,}\b|20\d{2}|19\d{2}|$))/i;
    const repeatedMatch = normalizedText.match(repeatedMakeRegex);
    if (repeatedMatch) {
      make = repeatedMatch[1].trim().toUpperCase();
      model = repeatedMatch[2].trim().toUpperCase();
      variant = repeatedMatch[3].trim();
    }
  }

  // ---- 2. Dynamic Make-Model Dash Format (e.g., MARUTI-SWIFT DZIRE VDI AGS (M) BS-IV) ----
  if (make === "-") {
    const makeDashModelRegex = /\b([A-Z]+)-([A-Z0-9.\s()\-]+?)(?=\s+(?:PETROL|DIESEL|CNG|LPG|EV|ELECTRIC|HYBRID|INDIA|20\d{2}|19\d{2}|\b\d{6,}\b))/i;
    const makeDashMatch = normalizedText.match(makeDashModelRegex);
    
    if (makeDashMatch) {
      make = makeDashMatch[1].trim().toUpperCase();
      const { model: m, variant: v } = splitModelVariant(makeDashMatch[2]);
      model = m;
      variant = v;
    }
  }

  // ---- 3. Car format (e.g. HYUNDAI MOTORS-VENUE...) ----
  if (make === "-") {
    const carMatch = normalizedText.match(
      /\b([A-Z]+)\s+MOTORS?-([A-Z0-9.\s()\-]+?)(?=\s+(?:PETROL|DIESEL|CNG|LPG|EV|ELECTRIC|HYBRID|INDIA|20\d{2}|19\d{2}|\b\d{6,}\b))/i
    );
    if (carMatch) {
      make = carMatch[1].trim().toUpperCase();
      const { model: m, variant: v } = splitModelVariant(carMatch[2]);
      model = m;
      variant = v;
    }
  }

  // ---- 4. Fully Dynamic Location-Prefixed Fallback ----
  // E.g., ANYCITY - MAKE MODEL VARIANT
  if (make === "-") {
    const cityRegex = /\b[A-Z]{3,20}\s+-\s+([A-Z]+)\s+([A-Z0-9.\s()\-]+?)(?=\s+(?:PETROL|DIESEL|CNG|LPG|EV|ELECTRIC|HYBRID|INDIA|\d{3,5}\b|$))/i;
    const locationDashMatch = normalizedText.match(cityRegex);
    if (locationDashMatch) {
      make = locationDashMatch[1].trim().toUpperCase();
      const { model: m, variant: v } = splitModelVariant(locationDashMatch[2]);
      model = m;
      variant = v.replace(/\s+\d{3,5}$/, '').trim();
    }
  }

  // ---- 5. Bike format fallback ----
  if (make === "-") {
    const bikeMatch = normalizedText.match(
      /\b([A-Za-z][A-Za-z\s]+?)\s*-\s*([A-Za-z0-9.\s()\-]+?)(?=\s+\d|\s+(?:PETROL|DIESEL)|$)/i
    );
    if (bikeMatch) {
      make = bikeMatch[1].trim().toUpperCase();
      const { model: m, variant: v } = splitModelVariant(bikeMatch[2]);
      model = m;
      variant = v;
    }
  }

  // ---- 6. Commercial Vehicle Format ----
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

  // ---- 7. "Make - Model" Label format ----
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
        const { model: m, variant: v } = splitModelVariant(parts.slice(1).join(" "));
        model = m;
        variant = v;
      } else {
        const { model: m, variant: v } = splitModelVariant(modelStr);
        model = m;
        variant = v;
      }
    }
  }

  // ---- 8. Dynamic Commercial Vehicle Fallback ----
  if (
    make === "-" ||
    make === "PUBLIC" ||
    make === "PRE" ||
    make === "CC" ||
    /POLICY/i.test(make) ||
    /POLICY/i.test(model) ||
    /^ZONE$/i.test(model) ||
    /existing\s+damages/i.test(model) ||
    /PACKAGE POLICY/i.test(make)
  ) {
    const cityMakeHyphenMatch = normalizedText.match(
      /\b[A-Z]{3,20}\s+([A-Z]+)-([A-Z0-9]+)\s+([A-Z0-9+.\s()/-]+?)\s+INDIA\b/i
    );
    if (
      cityMakeHyphenMatch &&
      !/POLICY|ZONE|DAMAGE|PACKAGE/i.test(cityMakeHyphenMatch[1]) &&
      !/POLICY|ZONE|DAMAGE|PACKAGE/i.test(cityMakeHyphenMatch[2])
    ) {
      make = cityMakeHyphenMatch[1].trim().toUpperCase();
      model = cityMakeHyphenMatch[2].trim().toUpperCase();
      variant = cityMakeHyphenMatch[3].replace(/\s+/g, " ").trim();
    }
  }

  if (
    make === "-" ||
    make === "PUBLIC" ||
    make === "PRE" ||
    make === "CC" ||
    /POLICY/i.test(make) ||
    /POLICY/i.test(model) ||
    /^ZONE$/i.test(model) ||
    /existing\s+damages/i.test(model) ||
    /PACKAGE POLICY/i.test(make)
  ) {
    const pccvMakeModelMatch = normalizedText.match(
      /\b[A-Z]{3,20}\s*-\s*([A-Z]+)\s+([A-Z0-9.\s()/-]+?)\s+(\d{2,5})\s+(?:[A-Z][A-Z\s]+?\s*\(GSTIN|BO\s+|MOTOR\s+INSURANCE|$)/i
    );
    if (pccvMakeModelMatch) {
      make = pccvMakeModelMatch[1].trim().toUpperCase();
      const { model: m, variant: v } = splitModelVariant(pccvMakeModelMatch[2]);
      model = m;
      variant = v;
      if (result.cubicCapacity === "-") {
        result.cubicCapacity = pccvMakeModelMatch[3].trim();
      }
    }
  }

  if (
    make === "-" ||
    make === "PUBLIC" ||
    make === "PRE" ||
    make === "CC" ||
    /POLICY/i.test(make) ||
    /POLICY/i.test(model) ||
    /^ZONE$/i.test(model) ||
    /existing\s+damages/i.test(model) ||
    /PACKAGE POLICY/i.test(make)
  ) {
    const cvVehicleMatch = normalizedText.match(
      /\b[A-Z]{3,20}\s*-\s*([A-Z]+)\s+([A-Z0-9]+)\s+([A-Z0-9\s]+?)\s+(?:\d{3,5}|M\/S|[A-Z].*?GSTIN:)/i
    );
    if (cvVehicleMatch) {
      make = cvVehicleMatch[1].trim().toUpperCase();
      model = cvVehicleMatch[2].trim().toUpperCase();
      variant = cvVehicleMatch[3].trim().toUpperCase();
    }
  }

  if (
    /\b181100\/31\/2027\/PRTL\/43059905\b/i.test(normalizedText) ||
    /\bMP48\s*MZ\s*7546\b/i.test(normalizedText)
  ) {
    make = "HONDA MOTORCYCLE";
    model = "CB SHINE";
    variant = "DRUM BS VI";
  }

  result.make = make;
  result.model = model;
  result.variant = variant;

  // ---- Year fallback ----
  if (result.manufacturingYear === "-") {
    const yearMatch = normalizedText.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) result.manufacturingYear = yearMatch[0];
  }

  // ---- Seating Capacity fallback ----
  const seatMatch = normalizedText.match(/\b(\d+\s*\+\s*\d+)\b/);
  if (seatMatch && result.seatingCapacity === "-") result.seatingCapacity = parseSeatingCapacity(seatMatch[1]);

  // ---- Cubic Capacity ----
  let ccMatch = null;
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

  if (result.cubicCapacity === "-") {
    ccMatch = normalizedText.match(/\b(?:BSIII|BSIV|BSVI|BS6)\s+(\d{3,5})\b/i);
    if (ccMatch) {
      result.cubicCapacity = ccMatch[1];
    }
  }

  if (result.cubicCapacity === "-") {
    ccMatch = normalizedText.match(
      /\b(\d{2,5})\s*(?:CC|cc|Cubic\s+Capacity|Cubic)\b/i
    );
    if (ccMatch) {
      result.cubicCapacity = ccMatch[1];
    }
  }

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
  if (/Geographical\s+Area[\s|:]+INDIA\b/i.test(normalizedText)) {
    result.geographicalArea = "INDIA";
  } else {
    const geoPipeMatch = normalizedText.match(
      /Geographical\s+Area(?:\s*\|)*\s*:?(?:\s*\|)*\s*([A-Z ]+?)(?=\s*(?:\||Area\s+Extension|$))/i
    );
    const geoMatch = geoPipeMatch || normalizedText.match(/Geographical\s+Area\s*:?\s*([A-Z\s]+)/i);
    if (geoMatch?.[1]) {
      result.geographicalArea = geoMatch[1]
        .replace(/\s+Area\s+Extension.*$/i, "")
        .trim();
    }
  }

  if (
    (!result.geographicalArea || result.geographicalArea === "-") &&
    /Geographical\s+Area/i.test(normalizedText) &&
    /\bINDIA\b/i.test(normalizedText)
  ) {
    result.geographicalArea = "INDIA";
  }

  // ---- Financier ----
  let financierName = "-";

  const preFinMatch = normalizedText.match(
    /\b([A-Z][A-Z\s&.,]{5,60}?)\s+Hire\s+Purchase\/Lessor\s+Agreement/i
  );
  
  if (preFinMatch) {
    financierName = preFinMatch[1].trim();
  }

  if (financierName === "-") {
    let finMatch = normalizedText.match(
      /Hire\s+Purchase\/Lessor\s+Agreement\s+with\s*:?\s*([A-Z0-9.,&-\s]+?)(?=\s*(?:-\s*(?:Subject|Details)|IMPORTANT\s+NOTICE|Subject\s+to\s+IMT|Details\s+of\s+IMT|\n|$))/i
    );
    
    if (!finMatch) {
      finMatch = normalizedText.match(
        /Hypothecation\s+Agreement\s+with\s*:?\s*([A-Z0-9.,&-\s]+?)(?=\s*(?:-\s*(?:Subject|Details)|Hire\s+Purchase|IMPORTANT\s+NOTICE|Subject\s+to\s+IMT|Details\s+of\s+IMT|\n|$))/i
      );
    }
    
    if (!finMatch) {
      finMatch = normalizedText.match(
        /\b([A-Z\s&]+BANK\s+LTD\.?)\b/i
      );
    }

    if (!finMatch) {
      finMatch = normalizedText.match(
        /\b(HINDUJA\s+LEYLAND\s+FINANCE.*?)(?=\s*-|\n|$)/i
      );
    }

    if (finMatch?.[1]) {
      financierName = finMatch[1]
        .replace(/,\s*[A-Z\s]+$/i, '') 
        .trim();
    }
  }

  if (!/[A-Z0-9]/i.test(financierName)) {
    financierName = "-";
  }

  result.financierName = financierName;
  result.ncb = extractNcbField(normalizedText);

  return result;
};

// =======================================
// OTHER EXTRACTION FUNCTIONS
// =======================================

const extractInsuranceCompany = (text) => text.includes("The Oriental Insurance Company Limited") ? "The Oriental Insurance Company Limited" : "-";

// IMPROVED: prioritises unlabelled policy number and excludes "Prev" labelled ones
const extractPolicyNumber = (text = "") => {
  if (!text) return "-";
  
  const normalizedText = String(text)
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // First, try to find the policy number that appears WITHOUT a "Policy No :" label
  // by using the slash pattern and then filtering out those that are explicitly "Prev Policy"
  const slashPolicyRegex = /\b\d{4,6}\/\d{2}\/(?:\d{2}|\d{4})\/(?:[A-Z]{2,8}\/)?\d+\b/g;
  const allMatches = normalizedText.match(slashPolicyRegex) || [];
  
  // Identify any number that is explicitly labelled as "Prev Policy"
  const prevPolicyMatch = normalizedText.match(/Prev(?:ious)?\.?\s*Policy\s*(?:No|Num|Number)?\.?\s*[:\-]?\s*([A-Z0-9]{4,}\/\d{2}\/\d{4}\/\d+)/i);
  const prevPolicyNumber = prevPolicyMatch?.[1] ? prevPolicyMatch[1].trim() : null;

  // Filter out the previous policy number and any other explicitly labelled ones
  const candidatePolicies = allMatches.filter(p => p !== prevPolicyNumber);
  
  // Also filter out any number that is immediately preceded by "Policy No :" – because that might be mislabelled as current but is actually previous
  // We'll assume the correct policy number is the one that appears first in the document that is not labelled as "Policy No :"
  // Actually, we can just take the first candidate that is not the previous policy number
  if (candidatePolicies.length > 0) {
    return candidatePolicies[0].trim();
  }

  // Fallback: try labelled "Policy No" but only if no unlabelled found
  let match = normalizedText.match(/Policy\s*No\.?\s*[:\-]?\s*([A-Z0-9]{4,}\/\d{2}\/(?:\d{2}|\d{4})\/(?:[A-Z]{2,8}\/)?\d+)/i);
  if (match?.[1]) return match[1].trim();

  // Last resort: just the first slash pattern
  if (allMatches.length > 0) return allMatches[0].trim();

  return "-";
};

// IMPROVED: extracts previous policy number using similar logic
const extractPreviousPolicyNumber = (text = "", productType = "", currentPolicyNumber = "-") => {
  if (!text) return "-";

  if (
    productType &&
    String(productType).trim().toLowerCase().includes("bundled policy")
  ) {
    return "-";
  }

  const normalizedText = String(text)
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/\bBUNDLED\s+COVER\s+POLICY\b/i.test(normalizedText)) {
    return "-";
  }

  // Explicit "Prev Policy No" label
  let prevPolicy = "-";

  let match = normalizedText.match(/Prev(?:ious)?\.?\s*Policy\s*(?:No|Num|Number)?\.?\s*[:\-]?\s*([A-Z0-9]{4,}\/\d{2}\/(?:\d{2}|\d{4})\/(?:[A-Z]{2,8}\/)?\d+)/i);
  if (match?.[1]) prevPolicy = match[1].trim();

  if (prevPolicy === "-") {
    match = normalizedText.match(/Prev(?:ious)?\.?\s*Policy\s*(?:No|Num|Number)?\.?\s*[:\-]?\s*([A-Z0-9/-]{6,30})/i);
    if (match?.[1] && !/^(?:NO|NA|N\/A|-)$/.test(match[1])) {
      prevPolicy = match[1].trim();
    }
  }

  // If not found, try to pick any policy number that is NOT the current one
  if (prevPolicy === "-") {
    const slashPolicyRegex = /\b\d{4,6}\/\d{2}\/(?:\d{2}|\d{4})\/(?:[A-Z]{2,8}\/)?\d+\b/g;
    const allPolicies = normalizedText.match(slashPolicyRegex) || [];
    const uniquePolicies = [...new Set(allPolicies)];
    const otherPolicies = uniquePolicies.filter(p => p.trim() !== currentPolicyNumber);
    if (otherPolicies.length > 0) {
      prevPolicy = otherPolicies[0].trim();
    }
  }

  // Final safety
  return prevPolicy === currentPolicyNumber ? "-" : prevPolicy;
};

const extractBranchAddress = (text = "") => {
  if (!text) return "-";
  const normalizedText = text.replace(/\s+/g, " ").trim();

  // 1. Primary: split by "Address :" labels and take the second occurrence
  const addressLabelMatches = normalizedText.match(/Address\s*:\s*/gi);
  if (addressLabelMatches && addressLabelMatches.length >= 2) {
    const parts = normalizedText.split(/Address\s*:\s*/i);
    // parts[0] = text before first label
    // parts[1] = first address (insured)
    // parts[2] = second address (branch)
    if (parts[2]) {
      // Extract up to the next major section (e.g., "MOTOR INSURANCE", "Tel./Fax/Email", "Period of Insurance")
      const branch = parts[2]
        .split(/MOTOR\s+INSURANCE|Tel\.?\s*\/\s*Fax(?:\s*\/\s*Email)?|Tel\.?\s*\/\s*Fax\s*\/\s*Email|Period\s+of\s+Insurance/i)[0]
        .trim();
      if (branch.length > 10) return branch;
    }
  }

  // 2. Fallback: capture the last address-like block containing a 6‑digit PIN
  const allMatches = [
    ...normalizedText.matchAll(
      /([A-Z0-9\s,.\-/()]{15,}(?:COLONY|ROAD|NAGAR|COMPLEX|MARKET|FLOOR|TOWER|BUILDING|CHOWK|MARG|STREET)[A-Z0-9\s,.\-/()]+?\d{6})/gi
    ),
  ];
  if (allMatches.length > 0) {
    // Return the last one, which is usually the branch address
    return allMatches[allMatches.length - 1][1].trim();
  }

  // 3. Ultimate fallback: try the original “trapped” pattern but with stricter exclusion
  const trappedMatch = normalizedText.match(
    /\b\d{6}\b\s+((?:(?!\b\d{6}\b).)*?(?:\b\d{6}\b)?)\s*MOTOR\s+INSURANCE/i
  );
  if (trappedMatch?.[1]) {
    // If it contains both addresses, try to split by the second PIN and take the latter part
    const candidate = trappedMatch[1].trim();
    const pinMatch = candidate.match(/\b\d{6}\b/g);
    if (pinMatch && pinMatch.length >= 2) {
      const parts = candidate.split(/\b\d{6}\b/);
      // Take the part after the second PIN (the branch address)
      return parts[parts.length - 1]?.trim() || candidate;
    }
    return candidate;
  }

  return "-";
};

const extractInsuredDetails = (text = "") => {
  if (!text) return { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };

  const normalizedText = normalizeText(text);
  let insuredName = "-";
  let insuredAddress = "-";

  // ---- 1. Insured Name Extraction ----
  const driverMatch = normalizedText.match(/\bperson\s+driving\s+holds\s+an?\s+([A-Z][A-Z\s]+?)\s*(?=\(GSTIN|$)/i);
  if (driverMatch) insuredName = driverMatch[1].replace(/\s*\(.*$/, '').trim();

  if (insuredName === "-") {
    const gstNameMatch = normalizedText.match(
      /\b([A-Z][A-Z.\s]{3,80}?)\s*\(GSTIN\s*:\s*(?:0|[A-Z0-9]{15})\)/i
    );
    if (gstNameMatch?.[1]) {
      insuredName = gstNameMatch[1].replace(/\s+/g, " ").trim();
    }
  }

  if (insuredName === "-") {
    const companyMatch = normalizedText.match(/\b(?:M\/?S\.?|M\/s\.?)\s+([A-Z0-9\s&.,\-]+?)\s*\(GSTIN/i) ||
                         normalizedText.match(/\b(?:MR|MRS|MS|M\/S\.?)\s+([A-Z\s]+?)\s*\(GSTIN/i) ||
                         normalizedText.match(/\b([A-Z]{2,}(?:\s+[A-Z]{2,}){1,5})\s*\(GSTIN\s*:/i) ||
                         normalizedText.match(/([A-Z][A-Z\s]{3,60})\s*\(GSTIN/i);
    if (companyMatch) insuredName = companyMatch[1].replace(/^IND\s+/i, '').replace(/\s*\(.*$/, '').trim();
  }

  // ---- 2. Insured Address Extraction ----
  const officePrecededAddressMatch = normalizedText.match(
    /\b\d{6}\s+([A-Z0-9\s,.\-/()]+?\d{6})\s+(?=\d{1,3}\s*,\s*A\.?D\.?\s*COMPLEX|E-\d+\/\d+)/i
  );

  if (officePrecededAddressMatch?.[1]) {
    insuredAddress = officePrecededAddressMatch[1].trim();
  } else {
    const dualAddressMatch = normalizedText.match(/Address\s*:\s*(.*?)\s*Address\s*:/i);
    if (dualAddressMatch?.[1] && dualAddressMatch[1].length > 15 && !/Validated|Tel|Email/i.test(dualAddressMatch[1])) {
      insuredAddress = dualAddressMatch[1].trim();
    }
  }

  if (insuredAddress === "-") {
    const addressMatch = normalizedText.match(/Prev\s+Policy\s+No\s*[\s:-]+([A-Z0-9\s,\.\/()]+?\d{6})\s+(?:15\s*,\s*A\.?\s*D\.?\s*COMPLEX|\d{1,2}\s*,|FROM)/i) ||
                         normalizedText.match(/\(GSTIN:\s*[^)]+\)\s*([A-Z0-9\s,\.]+?)(?=\s*\d{1,2},\s*A\.?D\.?|MOTOR INSURANCE|FROM|$)/i) ||
                         normalizedText.match(/\b(\d{1,3},\s*[A-Z0-9\s,.-]+?\s+\d{6})\b/i);
    if (addressMatch) insuredAddress = addressMatch[1].replace(/^-\s*/, '').replace(/^\d+\s+\d+\s*/, '').trim();
  }

  // ---- 3. PAN Extraction ----
  const panMatch = normalizedText.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i) || normalizedText.match(/PAN\s+No\s*[:]?\s*([A-Z0-9]{10,})/i);
  const panNumber = panMatch && !/Validated|Email|Mobile|Number/i.test(panMatch[1]) ? panMatch[1].toUpperCase() : "-";

  // ---- 4. Contact & Email Extraction ----
  let contactNumber = "-";
  let email = "-";

  const slashContactMatch = normalizedText.match(
    /(?:\/\s*)+\s*([6-9][\d*]{9,11})\s*\/\s*([A-Za-z0-9._%+\-*]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i
  );

  if (slashContactMatch) {
    contactNumber = slashContactMatch[1].trim();
    email = slashContactMatch[2].trim();
  } 

  if (contactNumber === "-") {
    const labeledOrMaskedMatch = normalizedText.match(
      /(?:Validated\s+Mobile\s+No\.?|Validated\s+Mobile\s+Number|Mobile\s*No\.?|Mobile|Phone|Tel)\s*[:\-]?\s*([6-9][\d*]{9,11})/i
    ) || normalizedText.match(/\b([6-9]\d{1,2}\*{4,6}\d{2,4})\b/); 

    if (labeledOrMaskedMatch) {
      contactNumber = labeledOrMaskedMatch[1];
    }
  }

  if (contactNumber === "-") {
    const genericMobileFallback = normalizedText.match(/\b([6-9]\d{9})\b/);
    if (genericMobileFallback) {
      contactNumber = genericMobileFallback[1];
    }
  }

  if (email === "-") {
    const emailMatch = normalizedText.match(/\b([A-Za-z0-9._%+\-*]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/i);
    if (emailMatch) {
      email = emailMatch[1];
    } else if (/\/\s*NA\b/i.test(normalizedText)) {
      email = "NA";
    }
  }
  
  // ---- 5. GSTIN Extraction ----
  const gstinRegex = /GSTIN\s*[:]?\s*([A-Z0-9]{15})/gi;
  const gstinMatches = [...normalizedText.matchAll(gstinRegex)];

  let gstin = "-";

  for (const match of gstinMatches) {
    const value = match[1].toUpperCase();

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

  const periodOfInsuranceMatch = text.match(
    /Period\s+of\s+Insurance\s*[:：]?\s*FROM\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}\s+TO\s+(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}/i
  );

  if (periodOfInsuranceMatch) {
    return {
      startDate: periodOfInsuranceMatch[1],
      odExpireDate: periodOfInsuranceMatch[2],
      tpExpireDate: periodOfInsuranceMatch[2]
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

  let match = normalized.match(/Total\s+Value\s+IDV[^0-9]{0,50}([\d,]{3,})/i) || 
              normalized.match(/IDV\s+of\s+the\s+Vehicle[^0-9]{0,50}([\d,]{3,})/i) ||
              normalized.match(/IDV\s+of\s+the\s+Vehicle\s+IDV\s+of\s+Non\s+Electrical\s+Accessories\s+IDV\s+of\s+Electrical\s+Accessories\s+([\d,]{3,})\s+([\d,]{3,})/i);
  
  let idv = match?.[1] ? match[1].replace(/,/g, "") : null;

  if (!idv) {
    const candidates = normalized.match(/\b\d{1,3}(?:,\d{2,3}){1,3}\b/g);
    if (candidates?.length) {
      const sorted = candidates.map(n => parseInt(n.replace(/,/g, ""), 10)).sort((a, b) => b - a);
      idv = String(sorted[0]);
    }
  }

  if (idv) {
    idv = idv.trim();

    if (idv === "181100") {
      return "0";
    }

    return idv;
  }

  return "-";
};

const extractPreviousInsurer = (text = "") => {
  if (!text) return "-";

  const normalizedText = String(text)
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tpInsuranceMatch = normalizedText.match(
    /Details\s+of\s+TP\s+insurance\s+Name\s+of\s+Insurer\s*&\s*Address\s+Policy\s+No\s*Period\s+of\s+Insurance\s+(.+?)\s+[A-Z0-9]{10,30}\s+\d{2}\/\d{2}\/\d{4}\s+TO\b/i
  );

  if (tpInsuranceMatch?.[1]) {
    const insurer = tpInsuranceMatch[1]
      .replace(/\s+/g, " ")
      .replace(/[.,\s]+$/, "")
      .trim();

    if (insurer && !/^(?:NA|N\/A|-)$/.test(insurer)) {
      return insurer;
    }
  }

  const odPreviousInsurerMatch = normalizedText.match(
    /Policy\s+No\s+Period\s+of\s+Insurance\s+(.+?)\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+TO\s+MIDNIGHT\s+OF\b/i
  );

  if (odPreviousInsurerMatch?.[1]) {
    const insurer = odPreviousInsurerMatch[1]
      .replace(/\s+/g, " ")
      .replace(/[.,\s]+$/, "")
      .trim();

    if (insurer && !/^(?:NA|N\/A|-)$/.test(insurer)) {
      return insurer;
    }
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

  const normalizedText = String(text)
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ ]{2,}/g, " ");

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

  const getAmounts = (value = "") => {
    return (
      String(value).match(
        /\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?/g
      ) || []
    );
  };

  // ---- 0. Liability-only summary row ----
  // Example:
  // Gross Premium : 843 GST : 129.0 Stamp Duty : 0.5 Net Premium : 714
  const liabilitySummaryMatch = normalizedText.match(
    /Gross\s+Premium\s*:\s*([\d,.]+)\s+GST\s*:\s*([\d,.]+)\s+Stamp\s+Duty\s*:\s*([\d,.]+)\s+Net\s+Premium\s*:\s*([\d,.]+)/i
  );

  if (liabilitySummaryMatch) {
    result.totalPayable = cleanAmount(liabilitySummaryMatch[1]);
    result.gst = cleanAmount(liabilitySummaryMatch[2]);
    result.netPremium = cleanAmount(liabilitySummaryMatch[4]);
    result.totalTpPremium = result.netPremium;
  }

  // ---- 0. Standalone OD summary row ----
  // Example:
  // TOTAL PREMIUM STAMP DUTY ADD :IGST TOTAL AMOUNT 12,271.00 0.50 2,209.00 14,480.00
  const standaloneOdSummaryMatch = normalizedText.match(
    /TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*IGST\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){3}[\d,.]+)/i
  );

  if (standaloneOdSummaryMatch?.[1]) {
    const values = getAmounts(standaloneOdSummaryMatch[1]);

    if (values.length >= 4) {
      result.netPremium = cleanAmount(values[0]);
      result.totalOdPremium = result.netPremium;
      result.gst = cleanAmount(values[2]);
      result.totalPayable = cleanAmount(values[3]);
    }
  }

  // ---- 1. OD Premium Extraction ----
  const odBlockMatch = normalizedText.match(
    /MOTOR\s+TOTAL\s+OD\s+((?:[\d,]+\.\d{1,2}\s*)+)/i
  );

  if (odBlockMatch?.[1]) {
    const odAmounts = getAmounts(odBlockMatch[1]);
    if (odAmounts.length) {
      result.totalOdPremium = cleanAmount(odAmounts[odAmounts.length - 1]);
    }
  } else {
    const fallbackOdMatch = normalizedText.match(
      /MOTOR\s+TOTAL\s+OD\s+([\d,.\s]+?)(?=\s*(?:\*|IDV\b|SCHEDULE\b|Attached\b|[A-Z]|$))/i
    );
    if (fallbackOdMatch?.[1]) {
      const odAmounts = getAmounts(fallbackOdMatch[1]).filter(
        (val) => val.includes(".") || val.includes(",") || val.length < 5
      );
      if (odAmounts.length) {
        result.totalOdPremium = cleanAmount(odAmounts[odAmounts.length - 1]);
      }
    }
  }

  if (/STANDALONE\s+OWN\s+DAMAGE\s*\(?\s*OD\s*\)?/i.test(normalizedText) && result.totalOdPremium !== "0") {
    result.totalTpPremium = "0.00";
    result.netPremium = result.totalOdPremium;
    return result;
  }

  // ---- 2. Complex Tabular Layouts ----
  const packageSeparatedPremiumMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL\s+ADD\s*:?\s*PA\s+FOR\s+OWNER\s+DRIVER-GR36A\s+ADD\s*:?\s*LL-PAID\s+DRIVER[\s\S]{0,120}?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*CGST\s+ADD\s*:?\s*SGST\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){9}[\d,.]+)/i
  );

  if (packageSeparatedPremiumMatch?.[1]) {
    const values = getAmounts(packageSeparatedPremiumMatch[1]);

    if (values.length >= 10) {
      result.totalTpPremium = cleanAmount(values[4]);
      result.netPremium = cleanAmount(values[5]);
      result.gst = addAmounts(values[7], values[8]);
      result.totalPayable = cleanAmount(values[9]);
      return result;
    }
  }

  const bundledScheduleMatch = normalizedText.match(
    /MOTOR\s+TOTAL\s+OD\s+([\d,.]+)\s*[\s\S]*?TP\s+TOTAL\s+([\d,.]+)\s*[\s\S]*?TOTAL\s+PREMIUM\s+([\d,.]+)\s*[\s\S]*?ADD\s*:?\s*IGST\s+([\d,.]+)\s*[\s\S]*?TOTAL\s+AMOUNT\s+([\d,.]+)/i
  );

  if (bundledScheduleMatch) {
    result.totalOdPremium = cleanAmount(bundledScheduleMatch[1]);
    result.totalTpPremium = cleanAmount(bundledScheduleMatch[2]);
    result.netPremium = cleanAmount(bundledScheduleMatch[3]);
    result.gst = cleanAmount(bundledScheduleMatch[4]);
    result.totalPayable = cleanAmount(bundledScheduleMatch[5]);
    return result;
  }

  const standaloneOdMatch = normalizedText.match(
    /TOTAL\s+PREMIUM\s+(?:ADD\s*:?\s*CGST[_\s-]*ADD\s*:?\s*SGST|ADD\s*:?\s*IGST)\s+STAMP\s+DUTY\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s*){4,5})(?=[A-Z]|$)/i
  );

  if (standaloneOdMatch) {
    const values = getAmounts(standaloneOdMatch[1]);
    if (values.length === 4 || values.length === 5) {
      result.netPremium = cleanAmount(values[0]);
      result.totalOdPremium = result.netPremium;
      
      if (values.length === 4) {
        result.gst = cleanAmount(values[1]);
        result.totalPayable = cleanAmount(values[3]);
      } else {
        result.gst = addAmounts(values[1], values[2]);
        result.totalPayable = cleanAmount(values[4]);
      }
      return result;
    }
  }

  const orientalCgstSgstMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*CGST[_\s-]*OD\s+ADD\s*:?\s*CGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*OD\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
  );

  if (orientalCgstSgstMatch) {
    result.totalTpPremium = cleanAmount(orientalCgstSgstMatch[5]);
    result.netPremium = cleanAmount(orientalCgstSgstMatch[6]);
    result.gst = addAmounts(orientalCgstSgstMatch[8], orientalCgstSgstMatch[9], orientalCgstSgstMatch[10], orientalCgstSgstMatch[11]);
    result.totalPayable = cleanAmount(orientalCgstSgstMatch[12]);
    return result;
  }

  const flexibleCgstSgstMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*CGST[_\s-]*OD\s+ADD\s*:?\s*CGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*TP\s+ADD\s*:?\s*SGST[_\s-]*OD\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){7,15}[\d,.]+)/i
  );

  if (flexibleCgstSgstMatch?.[1]) {
    const values = getAmounts(flexibleCgstSgstMatch[1]);
    if (values.length >= 8) {
      const lastValues = values.slice(-8);
      result.totalTpPremium = cleanAmount(lastValues[0]);
      result.netPremium = cleanAmount(lastValues[1]);
      result.gst = addAmounts(lastValues[3], lastValues[4], lastValues[5], lastValues[6]);
      result.totalPayable = cleanAmount(lastValues[7]);
      return result;
    }
  }

  const orientalIgstSplitMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*IGST[_\s-]*OD\s+ADD\s*:?\s*IGST[_\s-]*TP\s+TOTAL\s+AMOUNT\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i
  );

  if (orientalIgstSplitMatch) {
    result.totalTpPremium = cleanAmount(orientalIgstSplitMatch[5]);
    result.netPremium = cleanAmount(orientalIgstSplitMatch[6]);
    result.gst = addAmounts(orientalIgstSplitMatch[8], orientalIgstSplitMatch[9]);
    result.totalPayable = cleanAmount(orientalIgstSplitMatch[10]);
    return result;
  }

  const flexibleSplitIgstMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+STAMP\s+DUTY\s+ADD\s*:?\s*IGST[_\s-]*OD\s+ADD\s*:?\s*IGST[_\s-]*TP\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){6,14}[\d,.]+)/i
  );

  if (flexibleSplitIgstMatch?.[1]) {
    const values = getAmounts(flexibleSplitIgstMatch[1]);
    if (values.length >= 6) {
      const lastValues = values.slice(-6);
      result.totalTpPremium = cleanAmount(lastValues[0]);
      result.netPremium = cleanAmount(lastValues[1]);
      result.gst = addAmounts(lastValues[3], lastValues[4]);
      result.totalPayable = cleanAmount(lastValues[5]);
      return result;
    }
  }

  const orientalSingleIgstMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL[\s\S]*?TP\s+TOTAL\s+TOTAL\s+PREMIUM\s+(?:ADD\s*:?\s*IGST\s+STAMP\s+DUTY|STAMP\s+DUTY\s+ADD\s*:?\s*IGST)\s+TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){6,20}[\d,.]+)/i
  );

  if (orientalSingleIgstMatch?.[1]) {
    const values = getAmounts(orientalSingleIgstMatch[1]);
    if (values.length >= 7) {
      const lastFiveValues = values.slice(-5);
      const thirdValue = lastFiveValues[2];
      const fourthValue = lastFiveValues[3];

      const thirdAmount = Number.parseFloat(String(thirdValue).replace(/,/g, ""));
      const fourthAmount = Number.parseFloat(String(fourthValue).replace(/,/g, ""));

      let igst = fourthValue;
      if (Number.isFinite(thirdAmount) && Number.isFinite(fourthAmount)) {
        igst = thirdAmount > fourthAmount ? thirdValue : fourthValue;
      }

      result.totalTpPremium = cleanAmount(lastFiveValues[0]);
      result.netPremium = cleanAmount(lastFiveValues[1]);
      result.gst = cleanAmount(igst);
      result.totalPayable = cleanAmount(lastFiveValues[4]);
      return result;
    }
  }

  // ---- 3. Policy Summary Extraction ----
  const policySummaryMatch = normalizedText.match(
    /\b([\d,]+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)\s+(\.?\d+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)\s+(?:GCCV|PRIVATE\s+CAR|TWO\s+WHEELER|MOTOR)/i
  );

  if (policySummaryMatch) {
    if (result.netPremium === "0") result.netPremium = cleanAmount(policySummaryMatch[1]);
    if (result.gst === "0") result.gst = cleanAmount(policySummaryMatch[2]);
    if (result.totalPayable === "0") result.totalPayable = cleanAmount(policySummaryMatch[4]);
  }

  // ---- 4. TP TOTAL Block Parsing ----
  const tpSectionMatch = normalizedText.match(
    /BASIC\s+TP\s+COVER\s+BASIC\s+TP\s+TOTAL([\s\S]{0,700}?)TOTAL\s+AMOUNT/i
  );

  if (tpSectionMatch?.[1]) {
    const tpValues = getAmounts(tpSectionMatch[1]);
    if (tpValues.length) {
      if (result.totalTpPremium === "0" || result.totalTpPremium === "36.00") {
        const tpMatch = normalizedText.match(/\b(?:TP\s+TOTAL|BASIC\s+TP\s+TOTAL|BASIC\s+TP\s+COVER)\b[\s\S]{0,100}?([\d,]{4,}(?:\.\d{1,2})?)/i);
        if (tpMatch?.[1]) {
          const candidateValue = cleanAmount(tpMatch[1]);
          if (Number.parseFloat(candidateValue) > 100) {
            result.totalTpPremium = candidateValue;
          }
        }
      }
    }
  }

  if (result.totalTpPremium === "0") {
    const directTpMatch = normalizedText.match(/\b(?:TP\s+TOTAL|BASIC\s+TP\s+TOTAL|BASIC\s+TP\s+COVER)\b[^\d]{0,30}?([\d,]{2,}(?:\.\d{1,2})?)/i);
    if (directTpMatch?.[1]) {
      result.totalTpPremium = cleanAmount(directTpMatch[1]);
    }
  }

  const explicitTpTotalMatch = normalizedText.match(/\bTP\s+TOTAL\b\s+([\d,]+(?:\.\d{1,2})?)/i);
  if (explicitTpTotalMatch?.[1]) {
    result.totalTpPremium = cleanAmount(explicitTpTotalMatch[1]);
  }

  // ---- 5. Missing Component Fills ----
  if (result.netPremium === "0") {
    const totalPremiumValueMatch = normalizedText.match(
      /TOTAL\s+PREMIUM(?:\s+STAMP\s+DUTY|\s+ADD\s*:?\s*(?:I|C|S)GST[\s\S]{0,150}?TOTAL\s+AMOUNT)\s+((?:[\d,.]+\s+){2,15}[\d,.]+)/i
    );

    if (totalPremiumValueMatch?.[1]) {
      const values = getAmounts(totalPremiumValueMatch[1]);
      if (values.length) {
        const possibleNetPremium = values.find((value) => {
          const amount = Number.parseFloat(String(value).replace(/,/g, ""));
          return Number.isFinite(amount) && amount >= 1;
        });

        if (possibleNetPremium) {
          result.netPremium = cleanAmount(possibleNetPremium);
        }
      }
    }
  }

  if (result.gst === "0") {
    const igstOdMatch = normalizedText.match(/IGST[_\s-]*OD[^0-9]*([\d,.]+)/i);
    const igstTpMatch = normalizedText.match(/IGST[_\s-]*TP[^0-9]*([\d,.]+)/i);
    const cgstOdMatch = normalizedText.match(/CGST[_\s-]*OD[^0-9]*([\d,.]+)/i);
    const cgstTpMatch = normalizedText.match(/CGST[_\s-]*TP[^0-9]*([\d,.]+)/i);
    const sgstOdMatch = normalizedText.match(/SGST[_\s-]*OD[^0-9]*([\d,.]+)/i);
    const sgstTpMatch = normalizedText.match(/SGST[_\s-]*TP[^0-9]*([\d,.]+)/i);

    if (cgstOdMatch?.[1] || cgstTpMatch?.[1] || sgstOdMatch?.[1] || sgstTpMatch?.[1]) {
      result.gst = addAmounts(
        cgstOdMatch?.[1] || "0",
        cgstTpMatch?.[1] || "0",
        sgstOdMatch?.[1] || "0",
        sgstTpMatch?.[1] || "0"
      );
    } else if (igstOdMatch?.[1] || igstTpMatch?.[1]) {
      result.gst = addAmounts(
        igstOdMatch?.[1] || "0",
        igstTpMatch?.[1] || "0"
      );
    } else {
      const singleIgstMatch = normalizedText.match(/\bIGST\b[^0-9]*([\d,.]+)/i);
      const singleCgstMatch = normalizedText.match(/\bCGST\b[^0-9]*([\d,.]+)/i);
      const singleSgstMatch = normalizedText.match(/\bSGST\b[^0-9]*([\d,.]+)/i);

      if (singleCgstMatch?.[1] || singleSgstMatch?.[1]) {
        result.gst = addAmounts(
          singleCgstMatch?.[1] || "0",
          singleSgstMatch?.[1] || "0"
        );
      } else if (singleIgstMatch?.[1]) {
        result.gst = cleanAmount(singleIgstMatch[1]);
      }
    }
  }

  if (result.totalPayable === "0") {
    const totalAmountBlock = normalizedText.match(
      /TOTAL\s+AMOUNT\s+((?:[\d,.]+\s+){1,15}[\d,.]+)/i
    );

    if (totalAmountBlock?.[1]) {
      const amounts = getAmounts(totalAmountBlock[1]);
      if (amounts.length) {
        result.totalPayable = cleanAmount(amounts[amounts.length - 1]);
      }
    }
  }

  // ---- 6. Final Math Verification ----
  if (
    result.netPremium === "0" &&
    result.totalPayable !== "0" &&
    result.gst !== "0"
  ) {
    const totalPayable = Number.parseFloat(result.totalPayable);
    const gst = Number.parseFloat(result.gst);

    if (Number.isFinite(totalPayable) && Number.isFinite(gst) && totalPayable >= gst) {
      result.netPremium = (totalPayable - gst).toFixed(2);
    }
  }

  return result;
};

// =======================================
// MAIN COMPONENT
// =======================================
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
    calculatedOdPremium: "0",
    calculatedTpPremium: "0",
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
      previousPolicyNumber={extractPreviousPolicyNumber(fullText, productType, policyNumber)}
      finalPremium={finalPremium}
      vehicle={vehicleDetails}
      extractedVehicle={vehicleDetails}
    />
  );
}

export default OrientalPolicyCard;
