import React from "react";
import NewIndiaPolicyCard from "./NewIndiaPolicyCard";
import IndusindPolicyCard from "./IndusindPolicyCard";
import UnitedPolicyCard from "./UnitedPolicyCard";
import ShriramPolicyCard from "./ShriramPolicyCard";
import LibertyPolicyCard from "./LibertyPolicyCard";
import SBIPolicyCard from "./SBIPolicyCard";
import TATAAIGPolicyCard from "./TATAAIGPolicyCard";
import RoyalSundaramPolicyCard from "./RoyalSundaramPolicyCard";
import GoDigitPolicyCard from "./GoDigitPolicyCard";
import ICICIPolicyCard from "./ICICIPolicyCard";
import NationalPolicyCard from "./NationalPolicyCard";
import BajajGeneralPolicyCard from "./BajajGeneralPolicyCard";
import OrientalPolicyCard from "./OrientalPolicyCard";

const UnknownProvider = () => <div>Unknown insurance provider</div>;

const companyMap = [
  {
    keywords: ["new india assurance", "the new india assurance", "new india assurance co. ltd"],
    component: NewIndiaPolicyCard,
  },
  {
    keywords: ["indusind general insurance", "indusind insurance"],
    component: IndusindPolicyCard,
  },
  {
    keywords: ["united india insurance", "united india"],
    component: UnitedPolicyCard,
  },
  {
    keywords: ["shriram general insurance", "shriram insurance"],
    component: ShriramPolicyCard,
  },
  {
    keywords: ["liberty insurance", "liberty general insurance"],
    component: LibertyPolicyCard,
  },
  {
    keywords: ["sbi general insurance", "sbi insurance"],
    component: SBIPolicyCard,
  },
  {
    keywords: ["tata aig", "tata aig general insurance"],
    component: TATAAIGPolicyCard,
  },
  {
    keywords: ["royal sundaram", "royal sundaram general insurance"],
    component: RoyalSundaramPolicyCard,
  },
  {
    keywords: ["go digit insurance", "go digit general insurance", "digit insurance", "go digit", "digit"],
    component: GoDigitPolicyCard,
  },
  {
    keywords: ["icici lombard", "icici lombard general insurance"],
    component: ICICIPolicyCard,
  },
  {
    keywords: ["national insurance", "national insurance company", "national insurance co"],
    component: NationalPolicyCard,
  },
  {
    keywords: ["oriental insurance", "oriental insurance company"],
    component: OrientalPolicyCard,
  },
  {
    keywords: [
      "bajaj general insurance limited",
      "bajaj general insurance",
      "bajaj general",
      "bajaj",
    ],
    component: BajajGeneralPolicyCard,
  },
];

// -------- ORIGINAL DETECTION --------
function detectInsuranceCompany(fullText = "") {
  if (!fullText) {
    return UnknownProvider;
  }

  const words = fullText.trim().split(/\s+/);
  const wordLimits = [50, 100, 150, 200, 250, 300, 350, 500, 1000, 1500, 2000, 5000, 10000];

  for (const limit of wordLimits) {
    const textToCheck = words.slice(0, limit).join(" ").toLowerCase();

    const match = companyMap.find(({ keywords }) =>
      keywords.some((keyword) => textToCheck.includes(keyword.toLowerCase()))
    );

    if (match) {
      return match.component;
    }
  }

  return UnknownProvider;
}

// -------- fallback detection using parsed data --------
function detectByParsedData(parsed) {
  // If we have parsed data with genuine Bajaj fields (not N/A), return Bajaj component
  if (parsed && parsed.proposerName && parsed.proposerName !== 'N/A' && parsed.registrationNumber && parsed.registrationNumber !== 'N/A') {
    return BajajGeneralPolicyCard;
  }
  return null;
}

function PolicyCardWrapper({ item, motorProps = {} }) {
  // 1. Try original detection (based on fullText)
  let PolicyComponent = detectInsuranceCompany(item?.fullText || "");

  // 2. If original returned unknown, try fallback using parsed data
  if (PolicyComponent === UnknownProvider) {
    const fallback = detectByParsedData(item?.parsed);
    if (fallback) {
      PolicyComponent = fallback;
    }
  }

  return <PolicyComponent item={{ ...item, motorProps }} />;
}

export default PolicyCardWrapper;
