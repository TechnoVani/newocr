// src/components/PolicyClassification.jsx

import { Chip } from "@mui/material";

// =======================================
// Helper: Extract and normalize first N words
// =======================================
const getFirstNWords = (text = "", wordCount = 20) => {
  if (!text) return "";

  return String(text)
    .toLowerCase()
    .replace(/[–—]/g, "-") // Normalize hyphens/dashes
    .replace(/\s+/g, " ")  // Remove extra whitespace
    .trim()
    .split(" ")
    .slice(0, wordCount)
    .join(" ");
};

// =======================================
// Helper: Progressive detection
// Checks small snippets first, checking all categories before expanding.
// =======================================
const detectWithProgressiveWords = (
  text,
  keywordMap = {},
  fallback = null,
  wordCounts = [20, 50, 100, 150, 200, 500, 1000, 2000, 3000],
  customRuleEval = null
) => {
  if (!text) return fallback;

  for (const count of wordCounts) {
    const snippet = getFirstNWords(text, count);

    // 1. Check keyword map in priority order
    for (const [category, keywords] of Object.entries(keywordMap)) {
      for (const keyword of keywords) {
        if (snippet.includes(String(keyword).toLowerCase())) {
          return category;
        }
      }
    }

    // 2. Evaluate any complex/conditional rules that can't be mapped directly
    if (typeof customRuleEval === "function") {
      const parsedResult = customRuleEval(snippet);
      if (parsedResult) return parsedResult;
    }
  }

  return fallback;
};

// =======================================
// Product Type
// =======================================
export const getProductType = (policyType = "", fullText = "") => {
  if (!policyType && !fullText) return "-";

  const combinedText = `${policyType}\n${fullText}`;

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
      "Bundled",
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
      "third party liability",
      "third party", 
      "liability" 
    ]
  };

  // Complex rule for edge cases that a simple keyword array can't handle
  const evaluateComplexRules = (snippet) => {
    if (snippet.includes("own damage") && !snippet.includes("third party")) {
      return "Standalone OD Policy";
    }
    return null;
  };

  const productType = detectWithProgressiveWords(
    combinedText,
    productMap,
    null,
    [20, 50, 100, 150, 200, 500, 1000, 2000, 3000],
    evaluateComplexRules
  );

  return productType || policyType || "-";
};

/**
 * Component that displays the product type.
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
export const getVehicleCategory = (policyType = "", fullText = "") => {
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

  return detectWithProgressiveWords(combinedText, categoryMap, "-");
};

/**
 * Component that displays the vehicle category.
 */
export const VehicleCategory = ({ policyType, fullText, chipProps = {} }) => {
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