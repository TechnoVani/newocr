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

const normalizePolicyText = (text = "") =>
  String(text || "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const hasPackagePolicySignal = (text = "") => {
  const normalized = normalizePolicyText(text);
  if (!normalized) return false;

  return [
    /(?:passenger\s+carrying\s+vehicles?|private\s+car|two\s+wheeler|commercial\s+vehicle)?\s*package\s+policy/i,
    /total\s+package\s+premium\s*\(\s*a\s*\+\s*b\s*\)/i,
    /total\s+own\s+damage\s+premium\s*\(\s*a\s*\)[\s\S]{0,250}total\s+liability\s+premium\s*\(\s*b\s*\)/i,
    /own\s+damage\s*\(\s*a\s*\)[\s\S]{0,250}liability\s*\(\s*b\s*\)/i
  ].some((pattern) => pattern.test(normalized));
};

const hasActLiabilityOnlySignal = (text = "") => {
  const normalized = normalizePolicyText(text);
  if (!normalized) return false;

  return (
    /act\s+liability\s+insurance/i.test(normalized) &&
    /total\s+own\s+damage\s+premium\s*0(?:\.00)?/i.test(normalized)
  );
};

const hasLongTermOdTpSignal = (text = "") => {
  const normalized = normalizePolicyText(text);
  if (!normalized) return false;

  return /long\s+term\s*\(\s*1\s*yr\s*od\s*\+\s*3\s*yr\s*tp\s*\)/i.test(normalized);
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

  if (hasActLiabilityOnlySignal(combinedText)) {
    return "Liability Policy";
  }

  if (hasLongTermOdTpSignal(combinedText)) {
    return "Bundled Policy";
  }

  if (hasPackagePolicySignal(combinedText)) {
    return "Package Policy";
  }

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
// Categories
// =======================================
export const getVehicleCategory = (policyType = "", fullText = "") => {
  if (!policyType && !fullText) return "-";

  const categoryMap = {
    "Private Car": [
      "private car", 
      "private vehicle",
      "pvt car"
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
    ],
    "Miscellaneous": [
      "miscellaneous",
      "special yype of vehicle",
      "misc"
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
