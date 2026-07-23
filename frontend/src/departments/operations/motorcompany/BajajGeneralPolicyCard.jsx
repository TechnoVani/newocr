// src/components/BajajGeneralPolicyCard.jsx

import { useState } from "react";
import PolicyCardView from "./PolicyCardView";
import { getProductType, getVehicleCategory } from "./PolicyClassification";

// =======================================
// UTILITY FUNCTIONS
// =======================================

const cleanValue = (value) => {
  if (!value) return "-";
  return String(value).replace(/\s+/g, " ").replace(/[\n\r]+/g, " ").trim();
};

const formatFinancierName = (financier) => {
  if (!financier || financier === "-") return "-";
  return String(financier).replace(/\s+/g, " ").toUpperCase().trim();
};

const cleanAlphaNumeric = (val) => {
  if (!val || val === "-") return "-";
  return String(val).replace(/[\s-]/g, "").toUpperCase().trim();
};

// =======================================
// EXTRACTION FUNCTIONS
// =======================================

const extractInsuranceCompany = (text = "") => "Bajaj General Insurance Limited";

const extractPolicyNumber = (text = "") => {
  let m = text.match(/Policy\s*Number\s*[']?\s*([A-Z0-9-]+)/i);
  if (!m) m = text.match(/OG-\d{2}-\d{4}-\d{4}-\d+/i);
  return m ? m[1].replace(/[']/g, '') : "-";
};

const extractBranchAddress = (text = "") => {
  const match = text.match(/Contact our policy servicing branch at\s*[:]?\s*([\s\S]+?Phone\s*No\s*[:]\s*[\d-]+)/i) ||
                text.match(/Policy issuing office and Correspondence address.*?\n([\s\S]+?Phone\s*No\s*[:]\s*[\d-]+)/i);
  return match ? match[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim() : "-";
};

const extractInsuredDetails = (text = "") => {
  const result = { insuredName: "-", insuredAddress: "-", panNumber: "-", contactNumber: "-", email: "-", gstin: "-" };
  const nameMatch = text.match(/1\.\s*Proposer\s*Name\s*[:]\s*(.+?)(?=\s*2\.\s*Proposer\s*Address)/is);
  if (nameMatch) result.insuredName = nameMatch[1].replace(/\s*$/i, "").trim();

  const addrMatch = text.match(/2\.\s*Proposer\s*Address\s*[:]\s*(.+?)(?=\s*3\.\s*Proposer\s*Mobile\s*Number)/is);
  if (addrMatch) result.insuredAddress = addrMatch[1].replace(/\s+/g, " ").trim();

  const mobMatch = text.match(/3\.\s*Proposer\s*Mobile\s*Number\s*[:]\s*([\d-]+)/i);
  if (mobMatch) result.contactNumber = mobMatch[1].replace(/^[0-9]-/, '').replace(/-/g, '').trim();

  const emailMatch = text.match(/5\.\s*Proposer\s*e-mail\s*id\s*[:]\s*([^\s]+)/i);
  if (emailMatch) result.email = emailMatch[1].trim();

  return result;
};

const extractPolicyDates = (text = "") => {
  const result = { startDate: "-", odExpireDate: "-", tpExpireDate: "-" };
  const dateMatch = text.match(/From[:\s]*(\d{2}-[A-Za-z]{3}-\d{4})[\s\S]*?To[:\s]*(\d{2}-[A-Za-z]{3}-\d{4})/i);
  if (dateMatch) {
    result.startDate = dateMatch[1];
    result.odExpireDate = dateMatch[2];
    result.tpExpireDate = dateMatch[2];
  }
  return result;
};

const extractDateOfIssue = (text = "") => {
  const match = text.match(/Policy issued on\s*(\d{2}-[A-Za-z]{3}-\d{4})/i) || text.match(/Receipt Date\s*(\d{2}\/\d{2}\/\d{4})/i);
  return match ? match[1] : "-";
};

const extractPreviousPolicyData = (text = "") => {
  const result = { previousInsurer: "-", previousPolicyNumber: "-" };
  const insMatch = text.match(/Previous Insurer\s*-\s*([A-Za-z\s]+(?:Limited|Ltd\.?))/i);
  if (insMatch) result.previousInsurer = insMatch[1].trim();
  const polMatch = text.match(/Previous Policy No\s*-\s*([0-9A-Z\/\-]+)/i);
  if (polMatch) result.previousPolicyNumber = polMatch[1].trim();
  return result;
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
  const premiumSection = text.match(/SCHEDULE OF PREMIUM([\s\S]*?)(?=Total Payable|Limitation as to use|$)/i);
  if (premiumSection) {
    const premiumText = premiumSection[1];
    const calcOdMatch = premiumText.match(/Calculated OD Premium\s*([\d.]+)/i);
    if (calcOdMatch) result.calculatedOdPremium = calcOdMatch[1];
    const calcTpMatch = premiumText.match(/Calculated TP Premium\s*([\d.]+)/i);
    if (calcTpMatch) result.calculatedTpPremium = calcTpMatch[1];    
    const totalOdMatch = premiumText.match(/Total OD Premium\s*([\d.]+)/i) || text.match(/Total OD Premium in Rs\s*([\d.]+)/i);
    if (totalOdMatch) result.totalOdPremium = totalOdMatch[1]; 
    const totalTpMatch = premiumText.match(/Total TP Premium\s*([\d.]+)/i) || text.match(/Total TP Premium\s*\(Rs\)\s*([\d.]+)/i);
    if (totalTpMatch) result.totalTpPremium = totalTpMatch[1];
  }
  
  // First year OD/TP from simple patterns
  let firstYearOdMatch = text.match(/Total\s+Own\s+Damage\s+Premium:\s*([\d,]+)/i);
  if (firstYearOdMatch) result.firstYearOd = firstYearOdMatch[1].replace(/,/g, "");
  else result.firstYearOd = "0";
  let firstYearTpMatch = text.match(/Total\s+Liability\s+Premium:\s*([\d,]+)/i);
  if (firstYearTpMatch) result.firstYearTp = firstYearTpMatch[1].replace(/,/g, "");
  else result.firstYearTp = "0";
  
  if (!result.totalOdPremium || result.totalOdPremium === "0") result.totalOdPremium = result.firstYearOd;
  if (!result.totalTpPremium || result.totalTpPremium === "0") result.totalTpPremium = result.firstYearTp;
  
  let netMatch = text.match(/Special\s+Discount\s+Net\s+Premium\s*([\d,]+)/i);
  if (!netMatch) netMatch = text.match(/Total\s+premium\s*([\d,]+)/i);
  if (!netMatch) netMatch = text.match(/Net\s+Premium\s*\(Rs\)\s*([\d,]+)/i);
  if (!netMatch) netMatch = text.match(/Net Premium in Rs\s*[\s:]*([\d,]+)/i);
  if (netMatch) result.netPremium = netMatch[1].replace(/,/g, "");
  
  let gstMatch = text.match(/Integrated\s+GST\s*\([\d.]+%\)\s*([\d,]+)/i);
  if (!gstMatch) gstMatch = text.match(/GST\s*\(Rs\)\s*([\d,]+)/i);
  if (!gstMatch) gstMatch = text.match(/GST in Rs\s*[\s:]*([\d,]+)/i);
  if (gstMatch) result.gst = gstMatch[1].replace(/,/g, "");
  
  let totalMatch = text.match(/Final\s+Premium\s+Rs\.?\s*([\d,]+)/i);
  if (!totalMatch) totalMatch = text.match(/Total\s+Payable\s*\(Rs\)\s*([\d,]+)/i);
  if (!totalMatch) totalMatch = text.match(/Total Payable in Rs\s*[\s:]*([\d,]+)/i);
  if (totalMatch) result.totalPayable = totalMatch[1].replace(/,/g, "");
  
  return { ...defaultResult, ...result };
};

// =======================================
// VEHICLE EXTRACTION
// =======================================

// const extractVehicleDetailsFromText = (text = "") => {
//   const result = {
//     registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-",
//     model: "-", variant: "-", manufacturingYear: "-",
//     cubicCapacity: "-", seatingCapacity: "-", financierName: "-", fuelType: "-", idv: "-"
//   };

//   // Improved Pattern: Anchored specifically to the vehicle table rows
//   const tablePattern = /Registration\s*No\.?[\s\S]*?([A-Z0-9]{10,12})\s+([A-Za-z]+)\s+(.+?)\s+(\d{4})\s+(\d{4})\s+(\d{1,3})\s+([A-Z0-9\s]{15,22})\s+([A-Z0-9\s]{10,22})/i;
  
//   const tableMatch = text.match(tablePattern);
  
//   if (tableMatch) {
//     result.registrationNumber = tableMatch[1].replace(/[\s-]/g, "").toUpperCase().trim();
//     result.make = tableMatch[2].trim();
    
//     // Model & Variant extraction
//     let rawModel = tableMatch[3].trim(); // "STARBUS SKOOL BUS (51+1) LP 812"
    
//     // Logic: Look for "LP" pattern as the variant indicator
//     const lpMatch = rawModel.match(/(.*)\s+(LP\s*\d+)$/i);
    
//     if (lpMatch) {
//         // Model: "STARBUS SKOOL BUS (51+1)"
//         result.model = lpMatch[1].trim(); 
//         // Variant: "LP 812"
//         result.variant = lpMatch[2].trim();
//     } else {
//         result.model = rawModel;
//         result.variant = "-";
//     }

//     result.cubicCapacity = tableMatch[4];
//     result.manufacturingYear = tableMatch[5];
//     result.seatingCapacity = tableMatch[6];
//     result.chassisNumber = cleanAlphaNumeric(tableMatch[7]); 
//     result.engineNumber = cleanAlphaNumeric(tableMatch[8]); 
//   }

//   // Fuel & IDV extraction
//   const fuelIdvMatch = text.match(/(DIESEL|PETROL|CNG|EV|ELECTRIC|LPG)\s+([\d,]+)\s+/i);
//   if (fuelIdvMatch) {
//     result.fuelType = fuelIdvMatch[1].trim();
//     result.idv = fuelIdvMatch[2].replace(/,/g, '');
//   }

//   // Financier extraction
//   const hypMatch = text.match(/HYPOTHECATED\s*WITH\s*[:]?\s*([^\n\r]+?)(?=\s*\d+\.\s*Add\s+on)/i) || 
//                   text.match(/Hypothecated\s+To\s*[:]?\s*([^\n\r]+?)(?=\s*\d+\.\s*Add\s+on)/i);

//   if (hypMatch) {
//       result.financierName = formatFinancierName(hypMatch[1].trim());
//   }

//   return result;
// };

const extractVehicleDetailsFromText = (text = "") => {
  const result = {
    registrationNumber: "-", chassisNumber: "-", engineNumber: "-", make: "-",
    model: "-", variant: "-", manufacturingYear: "-",
    cubicCapacity: "-", seatingCapacity: "-", financierName: "-", fuelType: "-", idv: "-"
  };

  // Helper to remove all non-alphanumeric characters (including spaces)
  const cleanAlphaNumeric = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

  // Updated regex: engine number group (8) now stops before "Fuel"
  const tablePattern = /Registration\s*No\.?[\s\S]*?([A-Z0-9]{10,12})\s+([A-Za-z]+)\s+(.+?)\s+(\d{4})\s+(\d{4})\s+(\d{1,3})\s+([A-Z0-9\s]{15,22})\s+([A-Z0-9\s]+?)\s+Fuel/i;
  
  const tableMatch = text.match(tablePattern);
  
  if (tableMatch) {
    result.registrationNumber = cleanAlphaNumeric(tableMatch[1]); // optional, already alnum
    result.make = tableMatch[2].trim();
    
    let rawModel = tableMatch[3].trim();
    const lpMatch = rawModel.match(/(.*)\s+(LP\s*\d+)$/i);
    if (lpMatch) {
        result.model = lpMatch[1].trim();
        result.variant = lpMatch[2].trim();
    } else {
        result.model = rawModel;
        result.variant = "-";
    }

    result.cubicCapacity = tableMatch[4];
    result.manufacturingYear = tableMatch[5];
    result.seatingCapacity = tableMatch[6];
    result.chassisNumber = cleanAlphaNumeric(tableMatch[7]);
    // Engine number: remove all spaces and any trailing text that might have been captured
    result.engineNumber = cleanAlphaNumeric(tableMatch[8]); // now gives "4SPCR19BUX605221"
  }

  // Fuel & IDV extraction (unchanged)
  const fuelIdvMatch = text.match(/(DIESEL|PETROL|CNG|EV|ELECTRIC|LPG)\s+([\d,]+)\s+/i);
  if (fuelIdvMatch) {
    result.fuelType = fuelIdvMatch[1].trim();
    result.idv = fuelIdvMatch[2].replace(/,/g, '');
  }

  // Financier extraction (unchanged)
  const hypMatch = text.match(/HYPOTHECATED\s*WITH\s*[:]?\s*([^\n\r]+?)(?=\s*\d+\.\s*Add\s+on)/i) || 
                  text.match(/Hypothecated\s+To\s*[:]?\s*([^\n\r]+?)(?=\s*\d+\.\s*Add\s+on)/i);
  if (hypMatch) {
      result.financierName = formatFinancierName(hypMatch[1].trim());
  }

  return result;
};

// =======================================
// MAIN COMPONENT
// =======================================

function BajajGeneralPolicyCard({ item }) {
  const fullText = item?.fullText || "";
  const insured = item?.insuredDetails || {};
  const policy = item?.policyDetails || {};
  const vehicle = item?.vehicleDetails || {};
  const premium = item?.premiumDetails || {};

  const autoInsuredDetails = extractInsuredDetails(fullText);
  const policyDates = extractPolicyDates(fullText);
  const extractedVehicle = extractVehicleDetailsFromText(fullText);
  const autoPremium = extractPremiumData(fullText);

  return (
    <PolicyCardView
      item={item}
      policyNumber={extractPolicyNumber(fullText)}
      insuranceCompany={extractInsuranceCompany(fullText)}
      branchAddress={extractBranchAddress(fullText)}
      productType={getProductType(policy?.policyType, fullText)}
      vehicleCategory={getVehicleCategory(policy?.policyType, fullText)}
      insuredName={autoInsuredDetails.insuredName}
      panNumber={autoInsuredDetails.panNumber}
      gstin={autoInsuredDetails.gstin}
      contactNumber={autoInsuredDetails.contactNumber}
      email={autoInsuredDetails.email}
      insuredAddress={autoInsuredDetails.insuredAddress}
      policyDates={policyDates}
      dateOfIssue={extractDateOfIssue(fullText)}
      totalValue={extractedVehicle.idv || "0"}
      previousInsurer={extractPreviousPolicyData(fullText).previousInsurer}
      previousPolicyNumber={extractPreviousPolicyData(fullText).previousPolicyNumber}
      finalPremium={autoPremium}
      vehicle={{ ...vehicle, ...extractedVehicle }}
      extractedVehicle={extractedVehicle}
    />
  );
}

export default BajajGeneralPolicyCard;
