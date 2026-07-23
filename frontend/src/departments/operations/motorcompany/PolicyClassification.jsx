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
//   wordCounts = [20, 50, 100, 150, 200, 500, 1000, 2000, 3000],
//   parseSnippet = null
// ) => {
//   if (!text) return fallback;

//   let progressiveResult = fallback;

//   for (const count of wordCounts) {
//     const snippet = getFirstNWords(text, count).toLowerCase();
//     if (parseSnippet) {
//       const parsed = parseSnippet(snippet);
//       if (parsed) progressiveResult = parsed;
//       continue;
//     }

//     for (const keyword of keywords) {
//       if (snippet.includes(keyword.toLowerCase())) {
//         return keyword;
//       }
//     }
//   }

//   return progressiveResult;
// };

// // =======================================
// // Helper: Parsing patterns (Fallback mechanism)
// // =======================================
// const parseFromPolicyType = (policyType) => {
//   if (!policyType) return null;

//   const lower = policyType.toLowerCase();
  
//   if (lower.includes("bundled") || lower.includes("new vehicle")) return "Bundled Policy";
//   if (lower.includes("standalone") || lower.includes("stand-alone") || lower.includes("STAND-ALONE")) return "Standalone OD Policy";
//   if (lower.includes("package") || lower.includes("comprehensive")) return "Package Policy";
//   if (lower.includes("liability only") || lower.includes("act policy")) return "Liability Policy";
  
//   if (lower.includes("own damage") && lower.includes("third party")) return "Bundled Policy";
//   if (lower.includes("own damage")) return "Standalone OD Policy";
//   if (lower.includes("third party") || lower.includes("liability")) return "Liability Policy";

//   return null;
// };

// // =======================================
// // Product Type (PROGRESSIVE WORD-COUNT FIRST)
// // =======================================

// export const getProductType = (policyType = "", fullText = "") => {
//   if (!fullText && !policyType) return "-";

//   const combinedText = `${policyType} \n ${fullText}`.toLowerCase();

//   // 1. PARSE EACH PROGRESSIVELY LARGER WORD WINDOW.
//   // Do not stop at the first partial match: a later window may turn
//   // "own damage" into the more accurate bundled-policy combination.
//   const progressivelyParsed = detectWithProgressiveWords(
//     combinedText,
//     [],
//     null,
//     undefined,
//     parseFromPolicyType
//   );

//   if (progressivelyParsed) return progressivelyParsed;

//   // 2. DEFINE PRODUCT MAPPING FOR KEYWORD FALLBACK
//   const productMap = {
//     "Standalone OD Policy": ["stand-alone own damage", "standalone", "stand-alone", "stand alone", "own damage"],
//     "Bundled Policy": ["bundled", "new vehicle"],
//     "Package Policy": ["package", "comprehensive"],
//     "Liability Policy": ["liability only", "act policy", "third party liability", "third party", "liability"],
//   };

//   // Flatten keywords for the detector
//   const allKeywords = Object.values(productMap).flat();

//   // 3. RUN PROGRESSIVE KEYWORD DETECTION
//   const matchedKeyword = detectWithProgressiveWords(combinedText, allKeywords, null);

//   if (matchedKeyword) {
//     // Find the category that contains this keyword
//     for (const [category, keywords] of Object.entries(productMap)) {
//       if (keywords.includes(matchedKeyword.toLowerCase())) {
//         return category;
//       }
//     }
//   }

//   // 4. FINAL FALLBACK
//   const parsed = parseFromPolicyType(policyType);
//   if (parsed) return parsed;

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

// export const getVehicleCategory = (policyType = "", fullText = "") => {
//   if (!fullText && !policyType) return "-";

//   const categoryMap = {
//     "Private Car": ["private car", "private vehicle"],
//     "Two Wheeler": [
//       "two wheeler", "bike", "motorcycle", "scooter", 
//       "two- wheeler", "two - wheeler", "two-wheeler"
//     ],
//     "Commercial Vehicle": [
//       "commercial", "goods carrying", "commercial vehicles", 
//       "truck", "bus", "taxi", "carrying passengers", "three wheelers"
//     ],
//   };

//   const combinedText = `${policyType} ${fullText}`;

//   // Use the progressive detector
//   const allKeywords = Object.values(categoryMap).flat();
//   const matchedKeyword = detectWithProgressiveWords(combinedText, allKeywords, null);
  
//   if (matchedKeyword) {
//     for (const [category, keywords] of Object.entries(categoryMap)) {
//       if (keywords.includes(matchedKeyword.toLowerCase())) {
//         return category;
//       }
//     }
//   }

//   // Fallback to strict policyType parsing
//   const parsed = parseFromPolicyType(policyType);
//   if (parsed && ["Private Car", "Two Wheeler", "Commercial Vehicle"].includes(parsed)) {
//     return parsed;
//   }

//   return "-";
// };

// /**
//  * Component that displays the vehicle category as a chip.
//  */
// export const VehicleCategory = ({ policyType, fullText, chipProps = {} }) => {
//   const category = getVehicleCategory(policyType, fullText);
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

// export default { ProductType, VehicleCategory, getProductType, getVehicleCategory };


// src/components/PolicyClassification.jsx

import { Chip } from "@mui/material";

// =======================================
// Helper: Extract first N words
// =======================================
const getFirstNWords = (text = "", wordCount = 20) => {
  if (!text) return "";

  return String(text)
    .trim()
    .split(/\s+/)
    .slice(0, wordCount)
    .join(" ");
};

// =======================================
// Helper: Progressive detection
// Checks 20 words first, then 50, 100, etc.
// Returns immediately when the first match is found.
// =======================================
const detectWithProgressiveWords = (
  text,
  keywords = [],
  fallback = null,
  wordCounts = [20, 50, 100, 150, 200, 500, 1000, 2000, 3000],
  parseSnippet = null
) => {
  if (!text) return fallback;

  for (const count of wordCounts) {
    const snippet = getFirstNWords(text, count).toLowerCase();

    // Custom parsing logic
    if (typeof parseSnippet === "function") {
      const parsedResult = parseSnippet(snippet);

      // Important: return first detected result immediately
      if (parsedResult) {
        return parsedResult;
      }

      continue;
    }

    // Keyword detection
    for (const keyword of keywords) {
      if (snippet.includes(String(keyword).toLowerCase())) {
        return keyword;
      }
    }
  }

  return fallback;
};

// =======================================
// Helper: Product Type Parsing
// Priority order is important.
// =======================================
const parseFromPolicyType = (policyType = "") => {
  if (!policyType) return null;

  const lower = String(policyType)
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  // 1. Standalone must be checked first.
  // This prevents later "third party" wording from changing it to Bundled.
  if (
    lower.includes("standalone") ||
    lower.includes("stand-alone") ||
    lower.includes("stand alone") ||
    lower.includes("stand-alone own damage") ||
    lower.includes("standalone own damage") ||
    lower.includes("stand alone own damage")
  ) {
    return "Standalone OD Policy";
  }

  // 2. Explicit bundled wording
  if (
    lower.includes("bundled policy") ||
    lower.includes("bundled") ||
    lower.includes("new vehicle")
  ) {
    return "Bundled Policy";
  }

  // 3. Package policy
  if (
    lower.includes("package policy") ||
    lower.includes("package") ||
    lower.includes("comprehensive")
  ) {
    return "Package Policy";
  }

  // 4. Liability policy
  if (
    lower.includes("liability only") ||
    lower.includes("act policy") ||
    lower.includes("third party liability only")
  ) {
    return "Liability Policy";
  }

  /*
   * Generic checks are kept after explicit policy names.
   *
   * Do not classify as Bundled only because both "own damage"
   * and "third party" occur somewhere in a large policy document.
   * Standalone OD policies can also mention third-party cover.
   */
  if (
    lower.includes("own damage") &&
    !lower.includes("third party")
  ) {
    return "Standalone OD Policy";
  }

  if (
    lower.includes("third party") ||
    lower.includes("liability")
  ) {
    return "Liability Policy";
  }

  return null;
};

// =======================================
// Product Type
// =======================================
export const getProductType = (policyType = "", fullText = "") => {
  if (!policyType && !fullText) return "-";

  /*
   * Keep policyType first because it is normally a smaller and more
   * reliable source than the complete policy PDF text.
   */
  const combinedText = `${policyType}\n${fullText}`;

  // 1. Check each word window progressively.
  // First detected result wins.
  const progressivelyParsed = detectWithProgressiveWords(
    combinedText,
    [],
    null,
    [20, 50, 100, 150, 200, 500, 1000, 2000, 3000],
    parseFromPolicyType
  );

  if (progressivelyParsed) {
    return progressivelyParsed;
  }

  // 2. Keyword fallback with priority order
  const productMap = {
    "Standalone OD Policy": [
      "stand-alone own damage",
      "standalone own damage",
      "stand alone own damage",
      "stand-alone",
      "standalone",
      "stand alone"
    ],

    "Bundled Policy": [
      "bundled policy",
      "bundled",
      "new vehicle"
    ],

    "Package Policy": [
      "package policy",
      "package",
      "comprehensive"
    ],

    "Liability Policy": [
      "liability only",
      "act policy",
      "third party liability only",
      "third party liability"
    ]
  };

  /*
   * Search category by category instead of flattening everything.
   * This keeps the priority:
   * Standalone → Bundled → Package → Liability
   */
  for (const [category, keywords] of Object.entries(productMap)) {
    const matchedKeyword = detectWithProgressiveWords(
      combinedText,
      keywords,
      null
    );

    if (matchedKeyword) {
      return category;
    }
  }

  // 3. Parse only the supplied policyType as final fallback
  const parsedPolicyType = parseFromPolicyType(policyType);

  if (parsedPolicyType) {
    return parsedPolicyType;
  }

  return policyType || "-";
};

/**
 * Component that displays the product type.
 */
export const ProductType = ({
  policyType,
  fullText,
  chipProps = {}
}) => {
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
export const getVehicleCategory = (
  policyType = "",
  fullText = ""
) => {
  if (!policyType && !fullText) return "-";

  const categoryMap = {
    "Private Car": [
      "private car",
      "private vehicle"
    ],

    "Two Wheeler": [
      "two wheeler",
      "two-wheeler",
      "two- wheeler",
      "two - wheeler",
      "bike",
      "motorcycle",
      "scooter"
    ],

    "Commercial Vehicle": [
      "commercial vehicle",
      "commercial vehicles",
      "commercial",
      "goods carrying",
      "truck",
      "bus",
      "taxi",
      "carrying passengers",
      "three wheeler",
      "three wheelers"
    ]
  };

  const combinedText = `${policyType}\n${fullText}`;

  /*
   * Check categories separately so an early and higher-priority
   * category match is returned correctly.
   */
  for (const [category, keywords] of Object.entries(categoryMap)) {
    const matchedKeyword = detectWithProgressiveWords(
      combinedText,
      keywords,
      null
    );

    if (matchedKeyword) {
      return category;
    }
  }

  return "-";
};

/**
 * Component that displays the vehicle category.
 */
export const VehicleCategory = ({
  policyType,
  fullText,
  chipProps = {}
}) => {
  const category = getVehicleCategory(policyType, fullText);

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

export default {
  ProductType,
  VehicleCategory,
  getProductType,
  getVehicleCategory
};