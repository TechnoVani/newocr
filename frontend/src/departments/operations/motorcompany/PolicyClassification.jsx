// // src/components/PolicyClassification.jsx
// import { Chip } from "@mui/material";

// // =======================================
// // Helper: Extract first N words
// // =======================================
// const getFirstNWords = (text, wordCount) => {
//   if (!text) return "";
//   const words = text.trim().split(/\s+/);
//   return words.slice(0, wordCount).join(" ");
// };

// // =======================================
// // Helper: Progressive detection (Checks up to 3000 words)
// // =======================================
// const detectWithProgressiveWords = (
//   text,
//   keywords,
//   fallback,
//   wordCounts = [20, 50, 100, 150, 200, 500, 1000, 2000, 3000]
// ) => {
//   if (!text) return fallback;

//   for (const count of wordCounts) {
//     const snippet = getFirstNWords(text, count).toLowerCase();
//     for (const keyword of keywords) {
//       if (snippet.includes(keyword.toLowerCase())) {
//         return keyword;
//       }
//     }
//   }
//   return fallback;
// };

// // =======================================
// // Helper: Directly parse common patterns from the policy type string
// // =======================================
// const parseFromPolicyType = (policyType) => {
//   const lower = policyType.toLowerCase();
  
//   // Product type patterns - ORDERED BY SPECIFICITY
//   if (lower.includes("bundled") || lower.includes("new vehicle")) return "Bundled Policy";
//   if (lower.includes("standalone") || lower.includes("stand-alone")) return "Standalone OD Policy";
//   if (lower.includes("package") || lower.includes("comprehensive")) return "Package Policy";
//   if (lower.includes("liability only") || lower.includes("act policy")) return "Liability Policy";
  
//   // Generic fallbacks (Checked last so they don't override specific terms)
//   if (lower.includes("own damage") && lower.includes("third party")) return "Bundled Policy";
//   if (lower.includes("own damage")) return "Standalone OD Policy";
//   if (lower.includes("third party") || lower.includes("liability")) return "Liability Policy";

//   // Vehicle category patterns
//   if (lower.includes("private car")) return "Private Car";
//   if (lower.includes("two wheeler") || lower.includes("bike") || lower.includes("motorcycle"))
//     return "Two Wheeler";
//   if (lower.includes("commercial") || lower.includes("goods carrying") || lower.includes("truck") || lower.includes("carrying passengers"))
//     return "Commercial Vehicle";
    
//   return null;
// };

// // =======================================
// // Product Type (UPDATED WITH EXPLICIT TITLE CHECKS)
// // =======================================

// export const getProductType = (policyType = "", fullText = "") => {
//   if (!fullText && !policyType) return "-";

//   const combinedText = `${policyType} \n ${fullText}`.toLowerCase();

//   // 1. EXPLICIT DOCUMENT TITLES (Highest Priority)
//   // If the document explicitly states its type in the schedule title, trust it immediately.
//   if (
//     combinedText.includes("stand-alone own damage") ||
//     combinedText.includes("standalone own damage") ||
//     combinedText.includes("stand alone own damage")
//   ) {
//     return "Standalone OD Policy";
//   }

//   // ---> NEW LOGIC: Checks for "New Vehicle" or "Bundled"
//   if (combinedText.includes("bundled") || combinedText.includes("new vehicle")) {
//     return "Bundled Policy";
//   }

//   if (combinedText.includes("package policy") || combinedText.includes("comprehensive package")) {
//     return "Package Policy";
//   }

//   if (combinedText.includes("liability only") || combinedText.includes("act policy")) {
//     return "Liability Policy";
//   }

//   // 2. CONTEXTUAL INFERENCE (Fallback)
//   // If no explicit title is found, but it mentions BOTH "Own Damage" and "Third Party" coverages.
//   if (combinedText.includes("own damage") && combinedText.includes("third party")) {
//     // If it mentions "package" or "comprehensive", keep it as Package Policy
//     if (combinedText.includes("package") || combinedText.includes("comprehensive")) {
//       return "Package Policy";
//     }
//     // Otherwise, assume it's a Bundled Policy
//     return "Bundled Policy";
//   }

//   // 3. FIRST MATCH WINS (Lowest Priority Fallback)
//   // Keyword mapping for Product Types
//   const productMap = {
//     "Standalone OD Policy": ["standalone", "stand-alone", "stand alone", "own damage"],
//     "Package Policy": ["package", "comprehensive"],
//     "Liability Policy": ["third party liability", "third party", "liability"],
//   };

//   let earliestIndex = Infinity;
//   let matchedType = null;

//   // Scan the entire text and find which keyword appears FIRST (lowest index)
//   for (const [type, keywords] of Object.entries(productMap)) {
//     for (const keyword of keywords) {
//       const index = combinedText.indexOf(keyword.toLowerCase());
      
//       // If the keyword is found AND it appears earlier than the previous best match
//       if (index !== -1 && index < earliestIndex) {
//         earliestIndex = index;
//         matchedType = type;
//       }
//     }
//   }

//   if (matchedType) return matchedType;

//   // Fallback to strict policyType parsing if no keywords are found in the text
//   const parsed = parseFromPolicyType(policyType);
//   if (parsed && Object.keys(productMap).includes(parsed)) {
//     return parsed;
//   }

//   return policyType || "-";
// };

// /**
//  * Component that displays the product type as a chip.
//  */
// export const ProductType = ({ policyType, fullText, chipProps = {} }) => {
//   const productType = getProductType(policyType, fullText);
//   return (
//     <Chip
//       label={productType}
//       size="small"
//       color="secondary"
//       variant="outlined"
//       className="!text-xs !h-4"
//       {...chipProps}
//     />
//   );
// };

// // =======================================
// // Vehicle Category
// // =======================================

// export const getVehicleCategory = (policyType = "", vehicleType = "", fullText = "") => {
//   if (!fullText && !vehicleType && !policyType) return "-";

//   // Build keyword-to-category mapping
//   const categoryMap = {
//     "Private Car": ["private car", "private vehicle"],
//     "Two Wheeler": [
//       "two wheeler",
//       "bike",
//       "motorcycle",
//       "scooter",
//       "two- wheeler",
//       "two - wheeler",
//       "two-wheeler",
//     ],
//     "Commercial Vehicle": [
//       "commercial",
//       "goods carrying",
//       "commercial vehicles",
//       "truck",
//       "bus",
//       "taxi",
//       "carrying passengers",
//       "three wheelers"
//     ],
//   };

//   // Combine all sources
//   const combinedText = `${policyType} ${vehicleType} ${fullText}`;

//   // Progressive detection
//   let matchedCategory = null;
//   const allKeywords = Object.values(categoryMap).flat();
//   const matchedKeyword = detectWithProgressiveWords(combinedText, allKeywords, null);
  
//   if (matchedKeyword) {
//     for (const [category, keywords] of Object.entries(categoryMap)) {
//       if (keywords.some((k) => k.toLowerCase() === matchedKeyword.toLowerCase())) {
//         matchedCategory = category;
//         break;
//       }
//     }
//   }

//   // If still no match, try parsing the policyType directly
//   if (!matchedCategory) {
//     const parsed = parseFromPolicyType(policyType);
//     if (parsed && Object.keys(categoryMap).includes(parsed)) {
//       matchedCategory = parsed;
//     } else {
//       const lower = policyType.toLowerCase();
//       if (lower.includes("private car")) matchedCategory = "Private Car";
//       else if (lower.includes("two wheeler") || lower.includes("bike")) matchedCategory = "Two Wheeler";
//       else if (lower.includes("commercial") || lower.includes("goods carrying")) matchedCategory = "Commercial Vehicle";
//     }
//   }

//   return matchedCategory || "-";
// };

// /**
//  * Component that displays the vehicle category as a chip.
//  */
// export const VehicleCategory = ({ policyType, vehicleType, fullText, chipProps = {} }) => {
//   const category = getVehicleCategory(policyType, vehicleType, fullText);
//   return (
//     <Chip
//       label={category}
//       size="small"
//       color="primary"
//       variant="outlined"
//       className="!text-xs !h-4"
//       {...chipProps}
//     />
//   );
// };

// // Default export of both (optional)
// export default { ProductType, VehicleCategory, getProductType, getVehicleCategory };

// src/components/PolicyClassification.jsx
import { Chip } from "@mui/material";

// =======================================
// Helper: Extract first N words
// =======================================
const getFirstNWords = (text, wordCount) => {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  return words.slice(0, wordCount).join(" ");
};

// =======================================
// Helper: Progressive detection (Checks up to 3000 words)
// =======================================
const detectWithProgressiveWords = (
  text,
  keywords,
  fallback,
  wordCounts = [20, 50, 100, 150, 200, 500, 1000, 2000, 3000]
) => {
  if (!text) return fallback;

  for (const count of wordCounts) {
    const snippet = getFirstNWords(text, count).toLowerCase();
    for (const keyword of keywords) {
      // Direct check: If snippet contains the keyword, return it
      if (snippet.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
  }
  return fallback;
};

// =======================================
// Helper: Parsing patterns (Fallback mechanism)
// =======================================
const parseFromPolicyType = (policyType) => {
  const lower = policyType.toLowerCase();
  
  if (lower.includes("bundled") || lower.includes("new vehicle")) return "Bundled Policy";
  if (lower.includes("standalone") || lower.includes("stand-alone")) return "Standalone OD Policy";
  if (lower.includes("package") || lower.includes("comprehensive")) return "Package Policy";
  if (lower.includes("liability only") || lower.includes("act policy")) return "Liability Policy";
  
  if (lower.includes("own damage") && lower.includes("third party")) return "Bundled Policy";
  if (lower.includes("own damage")) return "Standalone OD Policy";
  if (lower.includes("third party") || lower.includes("liability")) return "Liability Policy";

  return null;
};

// =======================================
// Product Type (PROGRESSIVE WORD-COUNT FIRST)
// =======================================

export const getProductType = (policyType = "", fullText = "") => {
  if (!fullText && !policyType) return "-";

  const combinedText = `${policyType} \n ${fullText}`.toLowerCase();

  // 1. DEFINE PRODUCT MAPPING FOR PROGRESSIVE SEARCH
  const productMap = {
    "Standalone OD Policy": ["stand-alone own damage", "standalone", "stand-alone", "stand alone", "own damage"],
    "Bundled Policy": ["bundled", "new vehicle"],
    "Package Policy": ["package", "comprehensive"],
    "Liability Policy": ["liability only", "act policy", "third party liability", "third party", "liability"],
  };

  // Flatten keywords for the detector
  const allKeywords = Object.values(productMap).flat();

  // 2. RUN PROGRESSIVE DETECTION (Checks 20 words, then 50, etc.)
  const matchedKeyword = detectWithProgressiveWords(combinedText, allKeywords, null);

  if (matchedKeyword) {
    // Find the category that contains this keyword
    for (const [category, keywords] of Object.entries(productMap)) {
      if (keywords.includes(matchedKeyword.toLowerCase())) {
        return category;
      }
    }
  }

  // 3. FALLBACK: If nothing found in the first 3000 words, use the standard parser
  const parsed = parseFromPolicyType(policyType);
  if (parsed) return parsed;

  return policyType || "-";
};

/**
 * Component that displays the product type as a chip.
 */
export const ProductType = ({ policyType, fullText, chipProps = {} }) => {
  const productType = getProductType(policyType, fullText);
  return (
    <Chip
      label={productType}
      size="small"
      color="secondary"
      variant="outlined"
      className="!text-xs !h-4"
      {...chipProps}
    />
  );
};

// =======================================
// Vehicle Category
// =======================================

export const getVehicleCategory = (policyType = "", vehicleType = "", fullText = "") => {
  if (!fullText && !vehicleType && !policyType) return "-";

  const categoryMap = {
    "Private Car": ["private car", "private vehicle"],
    "Two Wheeler": [
      "two wheeler", "bike", "motorcycle", "scooter", 
      "two- wheeler", "two - wheeler", "two-wheeler"
    ],
    "Commercial Vehicle": [
      "commercial", "goods carrying", "commercial vehicles", 
      "truck", "bus", "taxi", "carrying passengers", "three wheelers"
    ],
  };

  const combinedText = `${policyType} ${vehicleType} ${fullText}`;

  // Use the progressive detector
  const allKeywords = Object.values(categoryMap).flat();
  const matchedKeyword = detectWithProgressiveWords(combinedText, allKeywords, null);
  
  if (matchedKeyword) {
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.includes(matchedKeyword.toLowerCase())) {
        return category;
      }
    }
  }

  // Fallback to strict policyType parsing
  const parsed = parseFromPolicyType(policyType);
  if (parsed && ["Private Car", "Two Wheeler", "Commercial Vehicle"].includes(parsed)) {
    return parsed;
  }

  return "-";
};

/**
 * Component that displays the vehicle category as a chip.
 */
export const VehicleCategory = ({ policyType, vehicleType, fullText, chipProps = {} }) => {
  const category = getVehicleCategory(policyType, vehicleType, fullText);
  return (
    <Chip
      label={category}
      size="small"
      color="primary"
      variant="outlined"
      className="!text-xs !h-4"
      {...chipProps}
    />
  );
};

export default { ProductType, VehicleCategory, getProductType, getVehicleCategory };