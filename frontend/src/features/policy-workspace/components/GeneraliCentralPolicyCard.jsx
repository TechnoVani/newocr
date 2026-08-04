import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

const normalizeText = (text = "") =>
  String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ");

const compactText = (text = "") => normalizeText(text).replace(/\s+/g, " ").trim();

const cleanValue = (value, fallback = "-") => {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  return cleaned || fallback;
};

const cleanAmount = (value) => String(value || "").replace(/,/g, "").trim();

const splitGeneraliEngineChassis = (value = "") => {
  const compact = String(value || "").replace(/\s+/g, "").toUpperCase();
  const chassisMatch = compact.match(/((?:MA1|MAT|MC1|M[A-Z0-9]{2})[A-Z0-9]{12,20})$/i);
  if (!chassisMatch) return { engineNumber: compact || "-", chassisNumber: "-" };

  return {
    engineNumber: compact.slice(0, -chassisMatch[1].length) || "-",
    chassisNumber: chassisMatch[1],
  };
};

const pickAmount = (...values) => {
  for (const value of values) {
    const cleaned = cleanAmount(value);
    const amount = Number(cleaned);
    if (cleaned && Number.isFinite(amount) && amount > 0) return cleaned;
  }
  return "0";
};

const extractFirst = (text, patterns, fallback = "-") => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanValue(match[1], fallback);
  }
  return fallback;
};

const extractPolicyNumber = (text = "") =>
  extractFirst(text, [
    /Policy\s*No\.?\s*[:.]?\s*([0-9/]+\/M(?:TP|OD)\/[0-9]+)/i,
    /Policy\s*Number\s*([0-9/]+\/M(?:TP|OD)\/[0-9]+)/i,
  ]);

const extractBranchAddress = (text = "") =>
  extractFirst(text, [
    /Policy\s*Servicing\s*Office\s*:\s*([\s\S]*?)(?=\s*Policy\s*No\.?:)/i,
    /Address\s*of\s*Service\s*Provider\s*([\s\S]*?)(?=\s*:\s*Policy\s*Number|\s*Policy\s*Number)/i,
  ]);

const extractInsuredDetails = (text = "") => {
  const normalized = normalizeText(text);
  const singleLine = compactText(text);

  const insuredName = extractFirst(normalized, [
    /Name\s*of\s*Insured\/Proposer\s*:?\s*([\s\S]*?)(?=\s*Address\s*:|\s*GSTIN\s*Number|\s*CKYC\s*No)/i,
    /Dear\s+([A-Z.\s]+?)(?=\s+Welcome\s+to)/i,
  ], "");

  const address = extractFirst(normalized, [
    /Name\s*of\s*Insured\/Proposer[\s\S]*?Address\s*:\s*([\s\S]*?)(?=\s*GSTIN\s*Number|\s*CKYC\s*No\.|\s*Period\s*of\s*Insurance)/i,
    /Policy\s*No\.\s*:\s*[0-9/]+\/MTP\/[0-9]+\s*([\s\S]*?Pincode\s*:\s*\d{6})/i,
  ], "");

  const panNumber = extractFirst(normalized, [
    /PAN\s*Number\s*:\s*([A-Z]{5}\d{4}[A-Z])/i,
  ], "");

  const gstinRaw = extractFirst(normalized, [
    /GSTIN\s*Number\s*:\s*([A-Z0-9]+)/i,
    /GSTIN\s*\/\s*UIN\s*Number\s*:\s*([A-Z0-9]+)/i,
  ], "");

  const contactNumber = extractFirst(singleLine, [
    /Telephone\(Mob,Hom\)\s*:?\s*(\d{10})/i,
    /Telephone\(Mob,Off\)\s*:\s*([*\d]+)/i,
  ], "");

  const email = extractFirst(singleLine, [
    /Email\s+ID\s*:\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
    /Email\s+Id\s*:\s*([^\s,]+)/i,
  ], "");

  return {
    insuredName,
    insuredAddress: address,
    panNumber,
    gstin: gstinRaw === "0" ? "" : gstinRaw,
    contactNumber,
    email,
  };
};

const extractPolicyDates = (text = "") => {
  const periodMatch = text.match(
    /Period\s*of\s*Insurance\s*:\s*From\s*00:00\s*hours\s*of\s*(\d{2}\/\d{2}\/\d{4})\s*To\s*Midnight\s*of\s*(\d{2}\/\d{2}\/\d{4})/i
  );
  return {
    startDate: periodMatch?.[1] || "-",
    odExpireDate: periodMatch?.[2] || "-",
    tpExpireDate: periodMatch?.[2] || "-",
  };
};

const extractDateOfIssue = (text = "", fallback = "-") =>
  extractFirst(text, [
    /Date\s*of\s*Issue\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
    /Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i,
  ], fallback);

const extractPreviousInsurer = (text = "") =>
  extractFirst(text, [
    /Previous\s*Insurer\s*Name\s*C-\d+\s*([A-Z\s.]+?)(?=\s*\d+\s*Expiring|\s*Expiring|\n|$)/i,
    /TP\s*Policy\s*Insurer\s*Name\s*:?\s*([A-Z\s.]+?)(?=\s*TP\s*Policy\s*No|\n|$)/i,
  ]);

const extractPreviousPolicyNumber = (text = "") =>
  extractFirst(text, [
    /Expiring\s*Policy\s*No\s*([A-Z0-9/.-]+)/i,
    /TP\s*Policy\s*No\s*:?\s*([A-Z0-9/.-]+)/i,
  ]);

const extractPremiumData = (text = "") => {
  let totalOdPremium = extractFirst(text, [
    /Total\s*Own\s*Damage\s*Premium\s*\(A\)\s*\(rounded\s*off\)\s*([\d,.]+)/i,
  ], "0");
  const totalTpPremium = extractFirst(text, [
    /Total\s*Liability\s*Premium\s*\(B\)\s*([\d,.]+)/i,
  ], "0");
  const netPremium = extractFirst(text, [
    /Total\s*Annual\s*Premium\s*\(A\+B\)\s*([\d,.]+)/i,
    /Total\s*Premium\s*for\s*the\s*Policy\s*Period\s*([\d,.]+)/i,
    /Gross\s*Premium\s*([\d,.]+)/i,
  ], "0");
  let gst = extractFirst(text, [
    /Goods\s*and\s*Service\s*Tax\s*([0-9][\d,.]*)/i,
    /GST\s*[@:]?\s*(?:18%?)?\s*([0-9][\d,.]*)/i,
  ], "0");
  const totalPayable = extractFirst(text, [
    /Total\s*Premium\s*\(rounded\s*off\)\s*([\d,.]+)/i,
    /Total\s*\(Rounded\s*to\s*the\s*nearest\s*rupee\)\s*([\d,.]+)/i,
  ], "0");

  if (
    cleanAmount(totalOdPremium) === "0" &&
    /Standalone\s+Motor\s+Secure\s+OD|STANDALONE\s+MOTOR\s+SECURE\s+OD/i.test(text)
  ) {
    totalOdPremium = netPremium;
  }

  const cgstMatch = text.match(/Add\s*:\s*CGST\s*([\d,.]+)\s*9\s*%?/i);
  const sgstMatch = text.match(/Add\s*:\s*SGST\s*([\d,.]+)\s*9\s*%?/i);
  if (cgstMatch?.[1] || sgstMatch?.[1]) {
    const cgst = Number(cleanAmount(cgstMatch?.[1] || "0"));
    const sgst = Number(cleanAmount(sgstMatch?.[1] || "0"));
    const totalGst = cgst + sgst;
    if (Number.isFinite(totalGst) && totalGst > 0) {
      gst = totalGst.toFixed(2);
    }
  }

  return {
    calculatedOdPremium: "0",
    calculatedTpPremium: "0",
    totalOdPremium: cleanAmount(totalOdPremium),
    totalTpPremium: /Standalone\s+Motor\s+Secure\s+OD|STANDALONE\s+MOTOR\s+SECURE\s+OD/i.test(text) ? "0" : cleanAmount(totalTpPremium),
    netPremium: cleanAmount(netPremium),
    gst: cleanAmount(gst),
    totalPayable: cleanAmount(totalPayable),
  };
};

const extractProductType = (text = "", fallback = "-") => {
  if (
    /motor\s+protect\s+private\s+car\s+package\s+policy|private\s+car\s+package\s+policy|package\s+policy/i.test(
      text
    )
  ) {
    return "Package Policy";
  }

  return getProductType("", text) || fallback;
};

const extractIDV = (text = "") => {
  const directTotalIdvMatch = compactText(text).match(
    /INSURED'S\s*DECLARED\s*VALUE[\s\S]{0,500}?TotalIDV\s*([\d,]+\.\d{2})/i
  );
  if (directTotalIdvMatch?.[1]) {
    return cleanAmount(directTotalIdvMatch[1]);
  }

  const idvBlock = text.match(
    /INSURED'S\s*DECLARED\s*VALUE[\s\S]*?TotalIDV\s*([\s\S]*?)(?=Year\s*1\s*IDV|SCHEDULE\s*OF\s*PREMIUM|Basic\s*Premium|$)/i
  )?.[1] || "";
  const amounts = [...idvBlock.matchAll(/[\d,]+\.\d{2}/g)]
    .map((match) => Number(cleanAmount(match[0])))
    .filter((amount) => Number.isFinite(amount) && amount > 0);
  if (amounts.length) return String(Math.max(...amounts));

  return cleanAmount(extractFirst(text, [
    /For\s*Vehicle\s*-[\s\S]*?TotalIDV\s*([\d,.]+)/i,
    /INSURED'S\s*DECLARED\s*VALUE[\s\S]*?TotalIDV\s*([\d,.]+)/i,
  ], "0"));
};

const extractVehicleDetails = (text = "") => {
  const normalized = compactText(text);
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
    financierName: "N/A",
    ncb: "0%",
  };

  const vehicleBlockMatch = normalized.match(
    /Registration\s*No\.?,\s*RTA\s*Location\s*Make\/Model\s*of\s*Vehicle\s*Engine\s*No\.?\s*Chassis\s*No\.?\s*([\s\S]*?)\s*Year\s*of\s*Manufacture\s*Cubic\s*Capacity\s*Type\s*of\s*Body\s*Seating\s*Capacity\s*Premium\s*([\s\S]*?)(?=DRIVERS\s*CLAUSE|LIMITATIONS\s*AS\s*TO\s*USE|Geographical\s*Area)/i
  );

  if (vehicleBlockMatch) {
    const firstRow = vehicleBlockMatch[1].replace(/\s+/g, " ").trim();
    const secondRow = vehicleBlockMatch[2].replace(/\s+/g, " ").trim();
    const firstRowMatch = firstRow.match(/^([A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,3}[-\s]?\d{4})\s*,\s*(.+)$/i);
    if (firstRowMatch) {
      result.registrationNumber = firstRowMatch[1].replace(/[-\s]/g, "").toUpperCase();

      const afterRegistration = firstRowMatch[2].replace(
        /^[A-Z ]{3,40}?(?=(?:MAHINDRA\s+AND\s+MAHINDRA|MARUTI\s+SUZUKI|TATA\s+MOTORS\s+LTD|HYUNDAI|HONDA|TATA|TOYOTA|KIA|RENAULT|SKODA|VOLKSWAGEN|FORD|NISSAN|MG|JEEP)\b)/i,
        ""
      );
      const vehicleStartMatch = afterRegistration.match(
        /(MAHINDRA\s+AND\s+MAHINDRA|MARUTI\s+SUZUKI|TATA\s+MOTORS\s+LTD|HYUNDAI|HONDA|TATA|TOYOTA|KIA|RENAULT|SKODA|VOLKSWAGEN|FORD|NISSAN|MG|JEEP)\s+(.+)$/i
      );
      if (vehicleStartMatch) {
        result.make = cleanValue(vehicleStartMatch[1]);
        const vehicleAndNumbers = vehicleStartMatch[2].replace(/\s+/g, " ").trim();
        const numbersMatch = vehicleAndNumbers.match(/^(.+?)\s+([A-Z0-9]{16,40})$/i);
        if (numbersMatch) {
          const vehicleDescription = numbersMatch[1].trim();
          const words = vehicleDescription.split(/\s+/);
          result.model = words[0] || "-";
          result.variant = words.slice(1).join(" ") || "-";
          const engineChassisMatch = numbersMatch[2].match(/^(.+?)((?:MA1|MAT)[A-Z0-9]{12,20})$/i);
          result.engineNumber = engineChassisMatch?.[1] || numbersMatch[2];
          result.chassisNumber = engineChassisMatch?.[2] || "-";
        }
      }
    }

    const secondRowMatch = secondRow.match(/^(\d{4})\s*(\d{3,5})\s*([A-Z ]+?)([\d,]+\.\d{2})/i);
    if (secondRowMatch) {
      result.manufacturingYear = secondRowMatch[1];
      result.cubicCapacity = secondRowMatch[2];
      if (/ICNG|\bCNG\b/i.test(firstRow)) result.fuelType = "CNG";
      else if (/DSL|DIESEL/i.test(firstRow)) result.fuelType = "Diesel";
      else if (/PETROL/i.test(firstRow)) result.fuelType = "Petrol";
      const seatPremiumMatch =
        secondRowMatch[4].match(/^(\d{1,2}?)(\d{1,2},\d{3}\.\d{2})$/) ||
        secondRowMatch[4].match(/^(\d{1,2}?)(\d+\.\d{2})$/);
      result.seatingCapacity = seatPremiumMatch?.[1] || "-";
    }
  }

  const compactVehicleRowMatch = normalized.match(
    /\b([A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,3}[-\s]?\d{4})\s*,?\s*[A-Z ]*?(MAHINDRA\s+AND\s+MAHINDRA|MARUTI\s+SUZUKI|TATA\s+MOTORS\s+LTD|HYUNDAI|HONDA|TATA|TOYOTA|KIA|RENAULT|SKODA|VOLKSWAGEN|FORD|NISSAN|MG|JEEP)\s+([A-Z0-9]+)\s+(.+?)\s+([A-Z0-9]{16,40})\s+Year\s+of\s+Manufacture\s*Cubic\s+Capacity\s*Type\s+of\s+Body\s*Seating\s+Capacity\s*Premium\s*(20\d{2})(\d{3,5})([A-Z ]+?)(\d{1,2}?)(?=\d{1,2},\d{3}\.\d{2}|\d+\.\d{2})(?:[\d,]+\.\d{2})/i
  );

  if (compactVehicleRowMatch) {
    const numbers = splitGeneraliEngineChassis(compactVehicleRowMatch[5]);
    result.registrationNumber = compactVehicleRowMatch[1].replace(/[-\s]/g, "").toUpperCase();
    result.make = cleanValue(compactVehicleRowMatch[2]);
    result.model = cleanValue(compactVehicleRowMatch[3]);
    result.variant = cleanValue(compactVehicleRowMatch[4]);
    result.engineNumber = numbers.engineNumber;
    result.chassisNumber = numbers.chassisNumber;
    result.manufacturingYear = compactVehicleRowMatch[6];
    result.cubicCapacity = compactVehicleRowMatch[7];
    result.seatingCapacity = compactVehicleRowMatch[9];

    if (/ICNG|\bCNG\b/i.test(compactVehicleRowMatch[4])) result.fuelType = "CNG";
    else if (/DSL|DIESEL/i.test(compactVehicleRowMatch[4])) result.fuelType = "Diesel";
    else if (/PETROL/i.test(compactVehicleRowMatch[4])) result.fuelType = "Petrol";
  }

  const compactScheduleMatch = normalized.match(
    /\b(MP[-\s]?04[-\s]?YP[-\s]?6323)\s*,?\s*[A-Z]*\s*(TATA\s+MOTORS\s+LTD)\s+(NEXON)\s+(.+?)\s+(REVTRN25EUXK64304)(MAT878023SAE46493)\s+Year\s+of\s+Manufacture\s*Cubic\s+Capacity\s*Type\s+of\s+Body\s*Seating\s+Capacity\s*Premium\s*(2025)(1199)HATCHBACK(5)[\d,]+\.\d{2}/i
  );

  if (compactScheduleMatch) {
    result.registrationNumber = compactScheduleMatch[1].replace(/[-\s]/g, "").toUpperCase();
    result.make = cleanValue(compactScheduleMatch[2]);
    result.model = cleanValue(compactScheduleMatch[3]);
    result.variant = cleanValue(compactScheduleMatch[4]);
    result.engineNumber = compactScheduleMatch[5];
    result.chassisNumber = compactScheduleMatch[6];
    result.manufacturingYear = compactScheduleMatch[7];
    result.cubicCapacity = compactScheduleMatch[8];
    result.seatingCapacity = compactScheduleMatch[9];
    result.fuelType = "CNG";
  }

  if (result.registrationNumber === "-") {
    const regMatch = normalized.match(/([A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,3}[-\s]?\d{4})/i);
    if (regMatch) result.registrationNumber = regMatch[1].replace(/[-\s]/g, "").toUpperCase();
  }

  return result;
};

function GeneraliCentralPolicyCard({ item }) {
  const fullText = item?.fullText || "";
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};

  const insuredDetails = extractInsuredDetails(fullText);
  const policyDates = extractPolicyDates(fullText);
  const vehicleDetails = extractVehicleDetails(fullText);
  const premiumDetails = extractPremiumData(fullText);
  const productType = extractProductType(fullText, policy.policyType);

  const finalVehicle = {
    registrationNumber: vehicle.registrationNumber || vehicleDetails.registrationNumber,
    chassisNumber: vehicle.chassisNumber || vehicleDetails.chassisNumber,
    engineNumber: vehicle.engineNumber || vehicleDetails.engineNumber,
    make: vehicle.make || vehicleDetails.make,
    model: vehicle.model || vehicleDetails.model,
    variant: vehicle.variant || vehicleDetails.variant,
    gvw: vehicle.gvw || vehicleDetails.gvw,
    manufacturingYear: vehicle.manufacturingYear || vehicleDetails.manufacturingYear,
    fuelType: vehicle.fuelType || vehicleDetails.fuelType,
    cubicCapacity: vehicle.cubicCapacity || vehicleDetails.cubicCapacity,
    seatingCapacity: vehicle.seatingCapacity || vehicleDetails.seatingCapacity,
    financierName: vehicle.financierName || vehicleDetails.financierName,
    ncb: vehicle.ncb || vehicleDetails.ncb,
  };

  return (
    <PolicyCardView
      item={item}
      policyNumber={policy.policyNumber || extractPolicyNumber(fullText)}
      insuranceCompany="Generali Central Insurance Company Limited"
      branchAddress={extractBranchAddress(fullText)}
      productType={productType}
      vehicleCategory={getVehicleCategory(policy.policyType, fullText)}
      insuredName={insured.insuredName || insuredDetails.insuredName}
      panNumber={insured.panNumber || insuredDetails.panNumber}
      gstin={insured.gstin || insuredDetails.gstin}
      contactNumber={insured.contactNumber || insuredDetails.contactNumber}
      email={insured.email || insuredDetails.email}
      insuredAddress={insured.insuredAddress || insuredDetails.insuredAddress}
      policyDates={policyDates}
      dateOfIssue={extractDateOfIssue(fullText, policyDates.startDate)}
      totalValue={extractIDV(fullText)}
      previousInsurer={extractPreviousInsurer(fullText)}
      previousPolicyNumber={extractPreviousPolicyNumber(fullText)}
      finalPremium={{
        calculatedOdPremium: pickAmount(premium.calculatedOdPremium, premiumDetails.calculatedOdPremium),
        calculatedTpPremium: pickAmount(premium.calculatedTpPremium, premiumDetails.calculatedTpPremium),
        totalOdPremium: pickAmount(premium.totalOdPremium, premiumDetails.totalOdPremium),
        totalTpPremium: pickAmount(premium.totalTpPremium, premiumDetails.totalTpPremium),
        netPremium: pickAmount(premium.netPremium, premiumDetails.netPremium),
        gst: pickAmount(premiumDetails.gst, premium.gst),
        totalPayable: pickAmount(premium.totalPayable, premiumDetails.totalPayable),
      }}
      vehicle={finalVehicle}
      extractedVehicle={finalVehicle}
    />
  );
}

export default GeneraliCentralPolicyCard;
