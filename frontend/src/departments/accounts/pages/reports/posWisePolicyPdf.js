// posCommissionPdf.js – Executive Layout with Auto‑Fitting Dynamic Watermark
// Customer name now wraps up to 4 lines for better readability

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

const LEFT = 26;
const RIGHT = 26;
const TOP = 816;
const BOTTOM = 34;
const FULL_WIDTH = PAGE_WIDTH - LEFT - RIGHT; // 543 pt

// ============================================================
// MODERN ELEVATED COLOR PALETTE (HIGH CONTRAST, EXECUTIVE FINISH)
// ============================================================
const colors = {
  primary: "0.060 0.110 0.200",      // Deep Executive Navy
  primaryLight: "0.930 0.950 0.980", // Very soft indigo fill
  accent: "0.100 0.400 0.850",       // Vibrant Royal Blue
  accentLight: "0.920 0.950 0.990",  // Soft blue tint
  
  headerBg: "0.960 0.970 0.985",     // Sleek header bar fill
  sky: "0.975 0.985 0.995",          // Card fill
  pale: "0.985 0.990 0.995",         // Table zebra row fill
  white: "1 1 1",
  transparent: "transparent",        // For truly clear backgrounds

  green: "0.920 0.975 0.940",        // Success fill
  darkGreen: "0.050 0.500 0.300",    // Emerald green text
  
  red: "0.990 0.930 0.930",          // Warning / Cancelled fill
  darkRed: "0.750 0.150 0.150",      // Dark Crimson text
  
  yellow: "0.995 0.970 0.890",       // Soft warning fill
  darkYellow: "0.650 0.450 0.050",   // Dark Amber text

  border: "0.860 0.880 0.910",       // Crisp container border
  softBorder: "0.910 0.930 0.950",   // Subtle divider line
  shadow: "0.880 0.900 0.920",       // Drop shadow color
  watermark: "0.060 0.110 0.200",    // Matches primary, uses ExtGState for transparency

  text: "0.150 0.160 0.180",         // Main body text
  muted: "0.400 0.420 0.460",        // Secondary / label text
  headerText: "0.040 0.060 0.090",   // Bold title text
  black: "0 0 0",
};

const FONT_NORMAL = "F1";
const FONT_BOLD = "F2";
const FONT_SERIF = "F3";

// ============================================================
// GENERAL & TEXT FORMATTING HELPERS
// ============================================================

const escapePdfText = (value) =>
  String(value ?? "-")
    .replace(/[^\x20-\x7E]/g, "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n\t]+/g, " ");

const normalizeText = (value, fallback = "-") => {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
};

const compactText = (value, length = 18) => {
  const text = normalizeText(value);
  if (text.length <= length) return text;
  return `${text.slice(0, Math.max(1, length - 3)).trim()}...`;
};

const numberValue = (value) => {
  const parsed = Number(
    String(value ?? 0)
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "")
  );
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value) =>
  numberValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const percentNumber = (value) =>
  numberValue(String(value ?? "").replace("%", ""));

const percentage = (value) => `${percentNumber(value).toFixed(2)}%`;

const formatDate = (value) => {
  if (!value) return "-";
  const stringValue = String(value).trim();
  const isoMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date).replaceAll("/", "-");
};

const formatMonthYear = (month) => {
  const match = String(month ?? "").match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return normalizeText(month, "-");

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return normalizeText(month, "-");
  }

  return new Date(year, monthIndex, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const posIncome = (policy) => {
  const odCommission = (numberValue(policy.total_od) * percentNumber(policy.pos_od)) / 100;
  const tpCommission = (numberValue(policy.total_tp) * percentNumber(policy.pos_tp)) / 100;
  const netCommission = (numberValue(policy.net_premium) * percentNumber(policy.pos_net)) / 100;
  return odCommission + tpCommission + netCommission;
};

const policyTypeLabel = (policy) => {
  const policyStatus = String(policy.policy_status || "").toLowerCase();
  if (policyStatus === "cancelled") return "Cancelled Motor";
  const businessType = String(policy.business_type || "").toLowerCase();
  if (businessType.includes("renewal")) return "Renewal Motor";
  return "New Motor";
};

const getPolicyDisplayDate = (policy) => {
  const status = String(policy.policy_status || "").toLowerCase();
  if (status === "cancelled") {
    return formatDate(policy.cancellation_date || policy.cancelled_at || policy.cancellation_created_at);
  }
  return formatDate(policy.policy_issue_date || policy.issue_date || policy.date_of_issue || policy.od_expiry || policy.tp_expiry);
};

// ============================================================
// INDIAN CURRENCY NUMBER TO WORDS CONVERTER
// ============================================================

const oneToNineteen = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tensWords = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const convertBelowHundred = (number) => {
  const value = Math.floor(number);
  if (value < 20) return oneToNineteen[value];
  const tens = Math.floor(value / 10);
  const units = value % 10;
  return `${tensWords[tens]}${units ? ` ${oneToNineteen[units]}` : ""}`;
};

const convertBelowThousand = (number) => {
  const value = Math.floor(number);
  const hundred = Math.floor(value / 100);
  const remainder = value % 100;
  const words = [];
  if (hundred) words.push(`${oneToNineteen[hundred]} Hundred`);
  if (remainder) words.push(convertBelowHundred(remainder));
  return words.join(" ");
};

const numberToIndianWords = (number) => {
  let value = Math.floor(Math.abs(numberValue(number)));
  if (value === 0) return "Zero";

  const words = [];
  const crore = Math.floor(value / 10000000);
  value %= 10000000;
  const lakh = Math.floor(value / 100000);
  value %= 100000;
  const thousand = Math.floor(value / 1000);
  value %= 1000;
  const hundredPart = value;

  if (crore) words.push(`${numberToIndianWords(crore)} Crore`);
  if (lakh) words.push(`${convertBelowThousand(lakh)} Lakh`);
  if (thousand) words.push(`${convertBelowThousand(thousand)} Thousand`);
  if (hundredPart) words.push(convertBelowThousand(hundredPart));

  return words.join(" ").replace(/\s+/g, " ").trim();
};

const amountWords = (value) => {
  const amount = Math.max(0, numberValue(value));
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = `Rupees ${numberToIndianWords(rupees)}`;
  if (paise > 0) result += ` and ${numberToIndianWords(paise)} Paise`;
  return `${result} Only`;
};

// ============================================================
// RAW PDF FILE BUILDER (PDF 1.4 COMPLIANT WITH TRANSPARENCY)
// ============================================================

const makePdfBlob = (pages) => {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  ];

  pages.forEach((pageContent, index) => {
    const pageObject = 3 + index * 2;
    const contentObject = pageObject + 1;
    objects.push(
      [
        "<< /Type /Page", "/Parent 2 0 R",
        `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
        "/Resources <<",
          "/Font <<",
            "/F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            "/F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
            "/F3 << /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>",
          ">>",
          "/ExtGState <<",
            "/GS1 << /Type /ExtGState /ca 0.08 /CA 0.08 /BM /Normal >>", // 8% transparency
          ">>",
        ">>", 
        `/Contents ${contentObject} 0 R`, ">>",
      ].join(" ")
    );
    objects.push(`<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const crossReferenceOffset = pdf.length;

  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf += ["trailer", `<< /Size ${objects.length + 1} /Root 1 0 R >>`, "startxref", crossReferenceOffset, "%%EOF"].join("\n");
  return new Blob([pdf], { type: "application/pdf" });
};

// ============================================================
// AGGREGATIONS & TOTAL CALCULATIONS
// ============================================================

const buildTotals = (policies) =>
  policies.reduce(
    (result, policy) => {
      const type = policyTypeLabel(policy);
      const grouped = result.byType.get(type) || {
        count: 0, od: 0, tp: 0, net: 0, odAmount: 0, tpAmount: 0, netAmount: 0, commission: 0,
      };

      const od = numberValue(policy.total_od);
      const tp = numberValue(policy.total_tp);
      const net = numberValue(policy.net_premium);

      const odAmount = (od * percentNumber(policy.pos_od)) / 100;
      const tpAmount = (tp * percentNumber(policy.pos_tp)) / 100;
      const netAmount = (net * percentNumber(policy.pos_net)) / 100;
      const commission = odAmount + tpAmount + netAmount;

      result.od += od;
      result.tp += tp;
      result.net += net;

      result.odAmount += odAmount;
      result.tpAmount += tpAmount;
      result.netAmount += netAmount;

      result.advance += numberValue(policy.advance ?? policy.advanced_amount ?? policy.advance_amount);

      grouped.count += 1;
      grouped.od += od;
      grouped.tp += tp;
      grouped.net += net;
      grouped.odAmount += odAmount;
      grouped.tpAmount += tpAmount;
      grouped.netAmount += netAmount;
      grouped.commission += commission;

      result.byType.set(type, grouped);

      const policyStatus = String(policy.policy_status || "").toLowerCase();
      if (policyStatus === "cancelled") {
        result.cancelled += 1;
        result.recovery += Math.abs(commission);
      } else {
        result.motor += 1;
        result.activePayout += commission;
      }

      return result;
    },
    {
      od: 0, tp: 0, net: 0, odAmount: 0, tpAmount: 0, netAmount: 0,
      activePayout: 0, advance: 0, recovery: 0, motor: 0, cancelled: 0,
      byType: new Map(),
    }
  );

// ============================================================
// MAIN GENERATOR FUNCTION
// ============================================================

export function downloadPosWiseSelectedPoliciesPdf({ policies, pos, month, posId }) {
  const selectedPolicies = Array.isArray(policies) ? policies : [];

  if (!selectedPolicies.length) {
    window.alert("Please select at least one policy before generating the PDF.");
    return;
  }

  const formattedMonthYear = formatMonthYear(month);
  const totals = buildTotals(selectedPolicies);
  const totalPayout = totals.odAmount + totals.tpAmount + totals.netAmount;
  const tds = Math.max(0, totalPayout * 0.02);
  const afterTds = totalPayout - tds;
  const advancedAmount = totals.advance;
  const recoveryAmount = totals.recovery;
  const amountPayable = afterTds - advancedAmount - recoveryAmount;
  const finalPayableAmount = Math.max(0, amountPayable);

  const pages = [];
  let content = "";
  let cursorY = TOP;
  let pageNumber = 0;

  // ==========================================================
  // LOW-LEVEL DRAWING PRIMITIVES
  // ==========================================================

  const textWidth = (value, size = 7, bold = false) => {
    const textValue = String(value ?? "");
    const averageFactor = bold ? 0.55 : 0.5;
    return textValue.length * size * averageFactor;
  };

  const drawText = (value, x, baselineY, { size = 7, bold = false, color = colors.text, font = FONT_NORMAL } = {}) => {
    const selectedFont = bold ? FONT_BOLD : font;
    content += [
      "BT", `${color} rg`, `/${selectedFont} ${size} Tf`,
      `${x.toFixed(2)} ${baselineY.toFixed(2)} Td`,
      `(${escapePdfText(value)}) Tj`, "ET", "",
    ].join(" ");
  };

  const drawRightText = (value, rightX, baselineY, options = {}) => {
    const size = options.size || 7;
    const width = textWidth(value, size, options.bold);
    drawText(value, rightX - width, baselineY, options);
  };

  const drawCenteredText = (value, centerX, baselineY, options = {}) => {
    const size = options.size || 7;
    const width = textWidth(value, size, options.bold);
    drawText(value, centerX - width / 2, baselineY, options);
  };

  const drawFilledBox = (x, topY, width, height, fillColor = colors.transparent) => {
    if (!fillColor || fillColor === "transparent") return;
    const bottomY = topY - height;
    content += ["q", `${fillColor} rg`, `${x.toFixed(2)} ${bottomY.toFixed(2)}`, `${width.toFixed(2)} ${height.toFixed(2)} re`, "f", "Q", ""].join(" ");
  };

  const drawBorderBox = (x, topY, width, height, borderColor = colors.border, lineWidth = 0.25) => {
    const bottomY = topY - height;
    content += ["q", `${lineWidth} w`, `${borderColor} RG`, `${x.toFixed(2)} ${bottomY.toFixed(2)}`, `${width.toFixed(2)} ${height.toFixed(2)} re`, "S", "Q", ""].join(" ");
  };

  const drawBox = (x, topY, width, height, { fill = colors.transparent, border = colors.border, lineWidth = 0.25, shadow = false } = {}) => {
    if (shadow) {
      drawFilledBox(x + 2, topY - 2, width, height, colors.shadow);
    }
    drawFilledBox(x, topY, width, height, fill);
    if (border && border !== "transparent") {
      drawBorderBox(x, topY, width, height, border, lineWidth);
    }
  };

  const drawLine = (x1, y1, x2, y2, { color = colors.border, width = 0.25 } = {}) => {
    content += ["q", `${width} w`, `${color} RG`, `${x1.toFixed(2)} ${y1.toFixed(2)} m`, `${x2.toFixed(2)} ${y2.toFixed(2)} l`, "S", "Q", ""].join(" ");
  };

  const drawDashedLine = (x1, y1, x2, y2, { color = colors.border, width = 0.25, dash = [1, 2] } = {}) => {
    content += [
      "q",
      `${width} w`,
      `${color} RG`,
      `[${dash.join(" ")}] 0 d`,
      `${x1.toFixed(2)} ${y1.toFixed(2)} m`,
      `${x2.toFixed(2)} ${y2.toFixed(2)} l`,
      "S",
      "Q",
      "",
    ].join(" ");
  };

  // ==========================================================
  // DYNAMIC WATERMARK – FULLY INSIDE PAGE, AUTO‑ADJUSTING
  // ==========================================================

  const drawWatermark = (pageNum) => {
    let text = "NOTION INSURANCE BROKER PVT. LTD.";
    let fontSize = 38;

    const seed = pageNum * 12345 + 6789;
    const angleDeg = ((seed * 12345 + 6789) % 233280) / 233280 * 50 - 25;
    const angleRad = angleDeg * Math.PI / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    let tWidth, tHeight;
    let centerX, centerY;
    let fitted = false;

    const margin = 20;

    while (fontSize > 10) {
      tWidth = textWidth(text, fontSize, true);
      tHeight = fontSize * 1.2;

      const bbWidth = tWidth * Math.abs(cos) + tHeight * Math.abs(sin);
      const bbHeight = tWidth * Math.abs(sin) + tHeight * Math.abs(cos);

      if (bbWidth < PAGE_WIDTH - 2 * margin && bbHeight < PAGE_HEIGHT - 2 * margin) {
        const maxOffsetX = (PAGE_WIDTH - 2 * margin - bbWidth) / 2;
        const maxOffsetY = (PAGE_HEIGHT - 2 * margin - bbHeight) / 2;
        const rawOffsetX = ((seed * 9301 + 49297) % 233280) / 233280 * 2 * maxOffsetX - maxOffsetX;
        const rawOffsetY = ((seed * 49297 + 9301) % 233280) / 233280 * 2 * maxOffsetY - maxOffsetY;

        centerX = PAGE_WIDTH / 2 + rawOffsetX;
        centerY = PAGE_HEIGHT / 2 + rawOffsetY - 20;

        const halfW = tWidth / 2;
        const halfH = tHeight / 2;
        const corners = [
          { x: -halfW, y: -halfH },
          { x:  halfW, y: -halfH },
          { x:  halfW, y:  halfH },
          { x: -halfW, y:  halfH }
        ];
        let allInside = true;
        for (const corner of corners) {
          const rx = corner.x * cos - corner.y * sin;
          const ry = corner.x * sin + corner.y * cos;
          const absX = centerX + rx;
          const absY = centerY + ry;
          if (absX < margin || absX > PAGE_WIDTH - margin || absY < margin || absY > PAGE_HEIGHT - margin) {
            allInside = false;
            break;
          }
        }
        if (allInside) {
          fitted = true;
          break;
        }
      }
      fontSize -= 2;
    }

    if (!fitted) {
      fontSize = 24;
      tWidth = textWidth(text, fontSize, true);
      tHeight = fontSize * 1.2;
      centerX = PAGE_WIDTH / 2;
      centerY = PAGE_HEIGHT / 2 - 20;
    }

    const cosStr = cos.toFixed(4);
    const sinStr = sin.toFixed(4);
    const minusSinStr = (-sin).toFixed(4);

    content += [
      "q",
      "/GS1 gs",
      `${colors.watermark} rg`,
      "BT",
      `/${FONT_BOLD} ${fontSize} Tf`,
      `${cosStr} ${sinStr} ${minusSinStr} ${cosStr} ${centerX.toFixed(2)} ${centerY.toFixed(2)} Tm`,
      `${(-tWidth / 2).toFixed(2)} ${(-fontSize / 3).toFixed(2)} Td`,
      `(${escapePdfText(text)}) Tj`,
      "ET",
      "Q",
      "\n"
    ].join(" ");
  };

  // ==========================================================
  // TEXT WRAPPING & CELL LAYOUT ENGINE
  // ==========================================================

  const splitLongWord = (word, maxWidth, fontSize, bold = false) => {
    const parts = [];
    let current = "";
    for (const character of word) {
      const candidate = `${current}${character}`;
      if (current && textWidth(candidate, fontSize, bold) > maxWidth) {
        parts.push(current);
        current = character;
      } else {
        current = candidate;
      }
    }
    if (current) parts.push(current);
    return parts;
  };

  const wrapText = (value, maxWidth, fontSize = 7, { bold = false, maxLines = null } = {}) => {
    const originalText = normalizeText(value);
    const originalWords = originalText.split(" ");
    const words = [];

    originalWords.forEach((word) => {
      if (textWidth(word, fontSize, bold) > maxWidth) {
        words.push(...splitLongWord(word, maxWidth, fontSize, bold));
      } else {
        words.push(word);
      }
    });

    const lines = [];
    let line = "";

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && textWidth(candidate, fontSize, bold) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });

    if (line) lines.push(line);

    if (maxLines && lines.length > maxLines) {
      const limitedLines = lines.slice(0, maxLines);
      const lastIndex = limitedLines.length - 1;
      let lastLine = limitedLines[lastIndex];

      while (lastLine.length > 1 && textWidth(`${lastLine}...`, fontSize, bold) > maxWidth) {
        lastLine = lastLine.slice(0, -1);
      }
      limitedLines[lastIndex] = `${lastLine.trim()}...`;
      return limitedLines;
    }
    return lines.length ? lines : ["-"];
  };

  const drawWrappedText = (value, x, topY, maxWidth, { size = 7, bold = false, color = colors.text, font = FONT_NORMAL, lineHeight = size + 2, maxLines = null, align = "left" } = {}) => {
    const lines = wrapText(value, maxWidth, size, { bold, maxLines });

    lines.forEach((line, index) => {
      const baselineY = topY - size - index * lineHeight;
      if (align === "right") {
        drawRightText(line, x + maxWidth, baselineY, { size, bold, color, font });
      } else if (align === "center") {
        drawCenteredText(line, x + maxWidth / 2, baselineY, { size, bold, color, font });
      } else {
        drawText(line, x, baselineY, { size, bold, color, font });
      }
    });
    return lines.length;
  };

  // ==========================================================
  // PAGE HEADER & FOOTER
  // ==========================================================

  const drawFooter = () => {
    const footerLineY = 28;
    drawLine(LEFT, footerLineY, PAGE_WIDTH - RIGHT, footerLineY, { color: colors.border, width: 0.4 });
    drawText(`POS Commission Statement | ${formattedMonthYear}`, LEFT, 16, { size: 5.8, color: colors.muted });
    drawCenteredText(`Confidential - For Internal Use Only`, PAGE_WIDTH / 2, 16, { size: 5.5, color: colors.muted });
    drawRightText(`Page ${pageNumber}`, PAGE_WIDTH - RIGHT, 16, { size: 6, bold: true, color: colors.primary });
  };

  const finishCurrentPage = () => {
    if (!content || content.trim() === "0.25 w") return;
    drawWatermark(pageNumber);
    drawFooter();
    pages.push(content);
    content = "";
  };

  const drawPrimaryHeader = () => {
    const headerHeight = 44;

    drawFilledBox(LEFT + 2, TOP - 2, FULL_WIDTH, headerHeight, colors.shadow); 
    drawFilledBox(LEFT, TOP, FULL_WIDTH, headerHeight, colors.headerBg);
    drawBorderBox(LEFT, TOP, FULL_WIDTH, headerHeight, colors.border, 0.4);
    
    drawFilledBox(LEFT, TOP, 5, headerHeight, colors.primary);

    drawText("NOTION INSURANCE BROKER PVT. LTD.", LEFT + 14, TOP - 16, { size: 8, bold: true, color: colors.accent });
    drawText("POS COMMISSION STATEMENT", LEFT + 14, TOP - 30, { size: 12, bold: true, color: colors.primary });
    
    drawRightText(formattedMonthYear, PAGE_WIDTH - RIGHT - 14, TOP - 18, { size: 9.5, bold: true, color: colors.primary });
    drawRightText(`POS Code: ${normalizeText(pos?.pos_code || `POS ${posId}`)}`, PAGE_WIDTH - RIGHT - 14, TOP - 31, { size: 7, bold: true, color: colors.muted });

    cursorY = TOP - headerHeight - 14;

    const cardHeight = 76;
    drawBox(LEFT, cursorY, FULL_WIDTH, cardHeight, { fill: colors.transparent, border: colors.border, shadow: false });

    const cardTop = cursorY - 14;
    const colGap = 24;
    const colWidth = (FULL_WIDTH - 28 - colGap) / 2;

    const col1X = LEFT + 14;
    const col2X = col1X + colWidth + colGap;

    drawLine(col1X + colWidth + colGap / 2, cursorY - 10, col1X + colWidth + colGap / 2, cursorY - cardHeight + 10, { color: colors.softBorder, width: 0.4 });

    const rowGap = 11.5;

    const drawDetailInline = (label, value, startX, y) => {
      const labelStr = String(label).toUpperCase();
      const valStr = compactText(value, 42);

      drawText(labelStr, startX, y, { size: 5.6, bold: true, color: colors.muted });
      drawRightText(valStr, startX + colWidth, y, { size: 6.4, bold: true, color: colors.text });

      const labelWidth = textWidth(labelStr, 5.6, true);
      const valWidth = textWidth(valStr, 6.4, true);

      const leaderStartX = startX + labelWidth + 4;
      const leaderEndX = startX + colWidth - valWidth - 4;

      if (leaderEndX > leaderStartX) {
        drawDashedLine(leaderStartX, y + 2, leaderEndX, y + 2, { color: colors.softBorder, width: 0.4, dash: [1, 2] });
      }
    };

    drawDetailInline("POS Name", pos?.pos_name, col1X, cardTop);
    drawDetailInline("POS Code", pos?.pos_code || posId, col1X, cardTop - rowGap);
    drawDetailInline("Email", pos?.email, col1X, cardTop - rowGap * 2);
    drawDetailInline("Mobile", pos?.mobile, col1X, cardTop - rowGap * 3);
    drawDetailInline("Address", pos?.address, col1X, cardTop - rowGap * 4);

    drawDetailInline("Bank Name", pos?.bank_name, col2X, cardTop);
    drawDetailInline("Account No.", pos?.account_no || pos?.bank_account_number, col2X, cardTop - rowGap);
    drawDetailInline("IFSC Code", pos?.ifsc_code, col2X, cardTop - rowGap * 2);
    drawDetailInline("PAN Number", pos?.pan_no || pos?.pan_number, col2X, cardTop - rowGap * 3);
    drawDetailInline("Statement Date", formatDate(new Date()), col2X, cardTop - rowGap * 4);

    cursorY -= cardHeight + 16;
  };

  const startNewPage = ({ primary = false } = {}) => {
    if (content) finishCurrentPage();
    pageNumber += 1;
    content = "0.25 w\n";

    if (primary) {
      drawPrimaryHeader();
    } else {
      cursorY = TOP - 20;
    }
  };

  const ensureSpace = (requiredHeight) => {
    if (cursorY - requiredHeight < BOTTOM + 24) {
      startNewPage();
      return true;
    }
    return false;
  };

  // ==========================================================
  // SECTION HEADERS & COMPONENT CARDS
  // ==========================================================

  const drawSectionTitle = (title) => {
    ensureSpace(24);
    const height = 15;

    drawFilledBox(LEFT, cursorY, 3, height, colors.accent);
    drawText(String(title).toUpperCase(), LEFT + 9, cursorY - 11, { size: 7.8, bold: true, color: colors.primary });
    drawLine(LEFT + 9, cursorY - 14, PAGE_WIDTH - RIGHT, cursorY - 14, { color: colors.border, width: 0.5 });

    cursorY -= height + 6;
  };

  const drawStatCards = (cards) => {
    const gap = 12;
    const height = 50;
    const width = (FULL_WIDTH - gap * (cards.length - 1)) / cards.length;

    ensureSpace(height + 12);

    cards.forEach((card, index) => {
      const x = LEFT + index * (width + gap);

      drawBox(x, cursorY, width, height, { fill: card.fill || colors.transparent, border: card.border || colors.border, shadow: true });
      drawFilledBox(x, cursorY, width, 2.5, card.valueColor || colors.primary);

      drawText(String(card.label).toUpperCase(), x + 9, cursorY - 14, { size: 5.2, bold: true, color: colors.muted });
      drawWrappedText(card.value, x + 9, cursorY - 22, width - 18, { size: card.valueSize || 9.5, bold: true, color: card.valueColor || colors.primary, maxLines: 1 });

      if (card.subValue) {
        drawWrappedText(card.subValue, x + 9, cursorY - 37, width - 18, { size: 5.5, color: colors.muted, maxLines: 1 });
      }
    });

    cursorY -= height + 16;
  };

  // ==========================================================
  // ADVANCED TABLE ENGINE
  // ==========================================================

  const prepareColumns = (columns, targetWidth = FULL_WIDTH) => {
    const totalBaseWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const scale = totalBaseWidth > 0 ? targetWidth / totalBaseWidth : 1;
    const result = columns.map((column) => ({
      ...column,
      calculatedWidth: Math.floor(column.width * scale * 100) / 100,
    }));
    const calculatedTotal = result.reduce((sum, column) => sum + column.calculatedWidth, 0);
    if (result.length) result[result.length - 1].calculatedWidth += targetWidth - calculatedTotal;
    return result;
  };

  const calculateCellLines = (cellValue, column, bodySize) => {
    const padding = column.padding ?? 2.5; 
    const availableWidth = column.calculatedWidth - padding * 2;
    return wrapText(normalizeText(cellValue), Math.max(4, availableWidth), column.fontSize || bodySize, { bold: Boolean(column.bold), maxLines: column.maxLines || 1 });
  };

  const calculateRowHeight = (row, columns, { bodySize = 6.2, minRowHeight = 16, lineHeight = 8.5, verticalPadding = 3 } = {}) => {
    const maximumLines = columns.reduce((maximum, column, index) => {
      const cellLines = calculateCellLines(row[index], column, bodySize);
      return Math.max(maximum, cellLines.length);
    }, 1);
    return Math.max(minRowHeight, maximumLines * lineHeight + verticalPadding * 2);
  };

  const drawTableHeader = (x, columns, { headerHeight = 19, headerSize = 6, headerFill = colors.headerBg, headerColor = colors.headerText } = {}) => {
    let currentX = x;
    columns.forEach((column) => {
      drawBox(currentX, cursorY, column.calculatedWidth, headerHeight, { fill: column.headerFill || headerFill, border: colors.border });
      const padding = column.padding ?? 2.5;
      const label = normalizeText(column.label);
      const labelLines = wrapText(label, column.calculatedWidth - padding * 2, column.headerSize || headerSize, { bold: true, maxLines: 2 });
      
      const effectiveLineHeight = (column.headerSize || headerSize) + 1.5;
      const totalTextHeight = labelLines.length * effectiveLineHeight;
      const firstBaseline = cursorY - (headerHeight - totalTextHeight) / 2 - (column.headerSize || headerSize) + 1;

      labelLines.forEach((line, lineIndex) => {
        const baselineY = firstBaseline - lineIndex * effectiveLineHeight;
        // Always default table headers to CENTER alignment
        const alignment = column.headerAlign || "center";
        
        if (alignment === "right") {
          drawRightText(line, currentX + column.calculatedWidth - padding, baselineY, { size: column.headerSize || headerSize, bold: true, color: headerColor });
        } else if (alignment === "center") {
          drawCenteredText(line, currentX + column.calculatedWidth / 2, baselineY, { size: column.headerSize || headerSize, bold: true, color: headerColor });
        } else {
          drawText(line, currentX + padding, baselineY, { size: column.headerSize || headerSize, bold: true, color: headerColor });
        }
      });
      currentX += column.calculatedWidth;
    });
    cursorY -= headerHeight;
  };

  const drawTableRow = (x, row, columns, rowHeight, { rowFill = colors.transparent, bodySize = 6, bodyColor = colors.text, lineHeight = 8 } = {}) => {
    let currentX = x;
    columns.forEach((column, index) => {
      const cellValue = normalizeText(row[index]);
      drawBox(currentX, cursorY, column.calculatedWidth, rowHeight, { fill: column.fill || rowFill, border: colors.softBorder }); 
      const padding = column.padding ?? 2.5;
      const fontSize = column.fontSize || bodySize;
      const lines = calculateCellLines(cellValue, column, bodySize);
      const effectiveLineHeight = column.lineHeight || lineHeight;
      const totalTextHeight = lines.length * effectiveLineHeight;
      const firstBaseline = cursorY - (rowHeight - totalTextHeight) / 2 - fontSize + 1;

      lines.forEach((line, lineIndex) => {
        const baselineY = firstBaseline - lineIndex * effectiveLineHeight;
        const alignment = column.align || "left";
        const textOptions = { size: fontSize, bold: Boolean(column.bold), color: column.color || bodyColor, font: column.font || FONT_NORMAL };

        if (alignment === "right") {
          drawRightText(line, currentX + column.calculatedWidth - padding, baselineY, textOptions);
        } else if (alignment === "center") {
          drawCenteredText(line, currentX + column.calculatedWidth / 2, baselineY, textOptions);
        } else {
          drawText(line, currentX + padding, baselineY, textOptions);
        }
      });
      currentX += column.calculatedWidth;
    });
    drawBorderBox(x, cursorY + rowHeight, FULL_WIDTH, rowHeight, colors.border, 0.4);
    cursorY -= rowHeight;
  };

  const drawTable = ({ x = LEFT, width = FULL_WIDTH, columns, rows, rowFills = [], options = {} }) => {
    const preparedColumns = prepareColumns(columns, width);
    const headerHeight = options.headerHeight || 19;
    const minRowHeight = options.minRowHeight || 16;

    ensureSpace(headerHeight + minRowHeight + 8);
    drawTableHeader(x, preparedColumns, options);

    rows.forEach((row, rowIndex) => {
      const rowHeight = calculateRowHeight(row, preparedColumns, options);
      if (cursorY - rowHeight < BOTTOM + 18) {
        startNewPage();
        drawTableHeader(x, preparedColumns, options);
      }
      const fill = rowFills[rowIndex] || (options.zebra && rowIndex % 2 === 1 ? colors.pale : colors.transparent);
      drawTableRow(x, row, preparedColumns, rowHeight, { ...options, rowFill: fill });
    });
    cursorY -= options.afterSpacing ?? 12;
  };

  // ==========================================================
  // DOCUMENT CONTENT GENERATION
  // ==========================================================

  startNewPage({ primary: true });

  drawStatCards([
    {
      label: "Selected Policies",
      value: String(selectedPolicies.length),
      subValue: `${totals.motor} active, ${totals.cancelled} cancelled`,
      fill: colors.transparent,
      valueColor: colors.primary,
    },
    {
      label: "Total Premium",
      value: `Rs. ${money(totals.od + totals.tp + totals.net)}`,
      subValue: "OD + TP + Net Premium",
      valueSize: 9,
      fill: colors.transparent,
      valueColor: colors.primary,
    },
    {
      label: "Gross Commission",
      value: `Rs. ${money(totalPayout)}`,
      subValue: "Before TDS & deductions",
      valueSize: 9,
      fill: colors.transparent,
      valueColor: colors.accent,
    },
    {
      label: "Net Amount Payable",
      value: `Rs. ${money(finalPayableAmount)}`,
      subValue: "Final payable payout",
      valueSize: 9,
      fill: finalPayableAmount > 0 ? colors.green : colors.yellow,
      valueColor: finalPayableAmount > 0 ? colors.darkGreen : colors.darkRed,
      border: finalPayableAmount > 0 ? "0.7 0.9 0.75" : "0.9 0.8 0.5"
    },
  ]);

  drawSectionTitle("Premium Summary");

  const premiumRows = [...totals.byType.entries()].map(([type, value]) => [
    type, value.count, money(value.od), money(value.tp), money(value.net),
  ]);

  drawTable({
    columns: [
      { label: "Business Type", width: 175, align: "left", maxLines: 2 },
      { label: "NOP", width: 50, align: "center" },
      { label: "OD Premium", width: 106, align: "right" },
      { label: "TP Premium", width: 106, align: "right" },
      { label: "Net Premium", width: 106, align: "right" },
    ],
    rows: premiumRows,
    options: { bodySize: 6.2, minRowHeight: 18, headerHeight: 20, zebra: true },
  });

  drawSectionTitle("Commission Summary");

  const commissionRows = [...totals.byType.entries()].map(([type, value]) => [
    `${type} Commission`, value.count, money(value.odAmount), money(value.tpAmount), money(value.netAmount), money(value.commission),
  ]);
  commissionRows.push(["Total Commission", selectedPolicies.length, money(totals.odAmount), money(totals.tpAmount), money(totals.netAmount), money(totalPayout)]);

  drawTable({
    columns: [
      { label: "Commission Type", width: 155, maxLines: 2 },
      { label: "NOP", width: 42, align: "center" },
      { label: "OD Comm", width: 84, align: "right" },
      { label: "TP Comm", width: 84, align: "right" },
      { label: "Net Comm", width: 84, align: "right" },
      { label: "Final Comm", width: 94, align: "right", bold: true, color: colors.primary },
    ],
    rows: commissionRows,
    rowFills: commissionRows.map((_, index) => index === commissionRows.length - 1 ? colors.primaryLight : undefined),
    options: { bodySize: 6.2, minRowHeight: 18, headerHeight: 20, zebra: true },
  });

  drawSectionTitle("Commission Calculation Ledger");

  const calculationRows = [
    ["Gross Commission", "-", money(totalPayout), money(totalPayout)],
    ["TDS Deduction (2%)", money(tds), "-", money(afterTds)],
    ["Already Paid / Advance", money(advancedAmount), "-", money(afterTds - advancedAmount)],
    ["Cancelled Policy Recovery", money(recoveryAmount), "-", money(amountPayable)],
    [amountPayable < 0 ? "Excess Recovery Amount" : "Net Final Amount Payable", amountPayable < 0 ? money(Math.abs(amountPayable)) : "-", amountPayable >= 0 ? money(finalPayableAmount) : "-", money(amountPayable)],
  ];

  drawTable({
    columns: [
      { label: "Calculation Phase", width: 205, bold: true },
      { label: "Debit (Rs.)", width: 110, align: "right" },
      { label: "Credit (Rs.)", width: 110, align: "right" },
      { label: "Running Balance (Rs.)", width: 118, align: "right", bold: true, color: colors.primary },
    ],
    rows: calculationRows,
    rowFills: [colors.transparent, colors.transparent, colors.yellow, recoveryAmount > 0 ? colors.red : colors.transparent, amountPayable >= 0 ? colors.green : colors.red],
    options: { bodySize: 6.5, minRowHeight: 18, headerHeight: 20 },
  });

  ensureSpace(70);

  const amountBoxHeight = 56;
  const labelWidth = 340;

  drawFilledBox(LEFT + 2, cursorY - 2, FULL_WIDTH, amountBoxHeight, colors.shadow);

  drawBox(LEFT, cursorY, labelWidth, amountBoxHeight, { fill: colors.transparent, border: colors.border });
  drawText(amountPayable >= 0 ? "FINAL AMOUNT PAYABLE" : "EXCESS RECOVERY AMOUNT", LEFT + 14, cursorY - 19, { size: 9, bold: true, color: colors.primary });
  drawWrappedText(amountWords(Math.abs(amountPayable)), LEFT + 14, cursorY - 30, labelWidth - 28, { size: 6.5, color: colors.muted, maxLines: 2, lineHeight: 9 });

  drawBox(LEFT + labelWidth, cursorY, FULL_WIDTH - labelWidth, amountBoxHeight, { fill: amountPayable >= 0 ? colors.green : colors.red, border: amountPayable >= 0 ? colors.darkGreen : colors.darkRed });
  drawCenteredText("INR", LEFT + labelWidth + (FULL_WIDTH - labelWidth) / 2, cursorY - 17, { size: 6.5, bold: true, color: amountPayable >= 0 ? colors.darkGreen : colors.darkRed });
  drawCenteredText(money(Math.abs(amountPayable)), LEFT + labelWidth + (FULL_WIDTH - labelWidth) / 2, cursorY - 38, { size: 14, bold: true, color: amountPayable >= 0 ? colors.darkGreen : colors.darkRed });

  cursorY -= amountBoxHeight + 20;

  drawSectionTitle("Grouped Business Summary");

  const classMap = selectedPolicies.reduce((map, policy) => {
    const key = normalizeText(policy.vehicle_category || policy.commercial_vehicle_type || policy.policy_type, "Motor");
    const value = map.get(key) || { count: 0, od: 0, tp: 0, net: 0, commission: 0 };
    value.count += 1;
    value.od += numberValue(policy.total_od);
    value.tp += numberValue(policy.total_tp);
    value.net += numberValue(policy.net_premium);
    value.commission += posIncome(policy);
    map.set(key, value);
    return map;
  }, new Map());

  const groupedRows = [...classMap.entries()].map(([category, value]) => [
    category, value.count, money(value.od), money(value.tp), money(value.net), money(value.commission),
  ]);
  groupedRows.push(["Grand Total", selectedPolicies.length, money(totals.od), money(totals.tp), money(totals.net), money(totalPayout)]);

  drawTable({
    columns: [
      { label: "Vehicle Category", width: 145, maxLines: 2 },
      { label: "NOP", width: 42, align: "center" },
      { label: "OD Premium", width: 82, align: "right" },
      { label: "TP Premium", width: 82, align: "right" },
      { label: "Net Premium", width: 82, align: "right" },
      { label: "Commission", width: 110, align: "right", bold: true, color: colors.primary },
    ],
    rows: groupedRows,
    rowFills: groupedRows.map((_, index) => index === groupedRows.length - 1 ? colors.primaryLight : undefined),
    options: { bodySize: 6.2, minRowHeight: 18, headerHeight: 20, zebra: true },
  });

  ensureSpace(18);
  drawWrappedText("This statement is generated based on selected POS-linked policy records.", LEFT + 2, cursorY, FULL_WIDTH - 4, { size: 5.8, color: colors.muted, maxLines: 2 });
  cursorY -= 20;

  if (cursorY < TOP - 40) {
    startNewPage();
  }

  drawSectionTitle("Selected Motor Policy Details");

  drawBox(LEFT, cursorY, FULL_WIDTH, 18, { fill: colors.red, border: colors.red });
  drawText("Cancelled policies are highlighted in soft red background. Displayed date represents cancellation date for cancelled policies.", LEFT + 10, cursorY - 11.5, { size: 5.6, bold: true, color: colors.darkRed });
  cursorY -= 24;

  // ============================================================
  // EXACT COLUMN WIDTH ALLOCATION – Customer now wraps up to 4 lines
  // ============================================================
  const policyColumns = [
    { label: "S.No.", width: 18, align: "center", maxLines: 1, fontSize: 5.2, padding: 2 },
    { label: "Customer", width: 60, align: "left", maxLines: 4, fontSize: 5.2, padding: 2.5 },   // up to 4 lines
    { label: "Insurer", width: 60, align: "left", maxLines: 2, fontSize: 5.2, padding: 2.5 },
    { label: "Policy Number", width: 64, align: "left", maxLines: 2, fontSize: 5.1, padding: 2.5 },
    { label: "Date", width: 44, align: "center", maxLines: 1, fontSize: 5.1, padding: 2 },
    { label: "Product", width: 42, align: "left", maxLines: 2, fontSize: 5.1, padding: 2 },
    { label: "OD", width: 45, align: "right", maxLines: 1, fontSize: 5.2, padding: 2.5 },
    { label: "TP", width: 42, align: "right", maxLines: 1, fontSize: 5.2, padding: 2.5 },
    { label: "Net", width: 45, align: "right", maxLines: 1, fontSize: 5.2, padding: 2.5 },
    { label: "OD %", width: 24, align: "right", maxLines: 1, fontSize: 5.0, padding: 2 },
    { label: "TP %", width: 24, align: "right", maxLines: 1, fontSize: 5.0, padding: 2 },
    { label: "Net %", width: 24, align: "right", maxLines: 1, fontSize: 5.0, padding: 2 },
    { label: "Comm", width: 43, align: "right", maxLines: 1, fontSize: 5.2, bold: true, color: colors.primary, padding: 2.5 },
  ];
  // Sum = 18+72+60+64+44+42+45+42+45+24+24+24+43 = 543

  const policyRows = selectedPolicies.map((policy, index) => [
    index + 1,
    normalizeText(policy.insured_name || policy.customer_name),
    normalizeText(policy.insurance_company || policy.insurer_name),
    normalizeText(policy.policy_number || policy.policy_no),
    getPolicyDisplayDate(policy),
    normalizeText(policy.vehicle_category || policy.commercial_vehicle_type || policy.policy_type, "Motor"),
    money(policy.total_od), money(policy.total_tp), money(policy.net_premium),
    percentage(policy.pos_od), percentage(policy.pos_tp), percentage(policy.pos_net),
    money(posIncome(policy)),
  ]);

  const policyRowFills = selectedPolicies.map((policy, index) => {
    const cancelled = String(policy.policy_status || "").toLowerCase() === "cancelled";
    if (cancelled) return colors.red;
    return index % 2 === 1 ? colors.pale : colors.transparent;
  });

  drawTable({
    columns: policyColumns, rows: policyRows, rowFills: policyRowFills,
    options: { bodySize: 5.2, headerSize: 5.4, headerHeight: 20, minRowHeight: 16, lineHeight: 6.5, verticalPadding: 2.5, afterSpacing: 12 },
  });

  drawTable({
    columns: [
      { label: "Total Premium Summary", width: 145, bold: true },
      { label: "NOP", width: 43, align: "center" },
      { label: "OD", width: 78, align: "right" },
      { label: "TP", width: 78, align: "right" },
      { label: "Net", width: 78, align: "right" },
      { label: "Final Commission", width: 121, align: "right", bold: true, color: colors.primary },
    ],
    rows: [["Selected Motor Policies", selectedPolicies.length, money(totals.od), money(totals.tp), money(totals.net), money(totalPayout)]],
    rowFills: [colors.primaryLight],
    options: { bodySize: 6.2, minRowHeight: 18, headerHeight: 20, afterSpacing: 18 },
  });

  drawSectionTitle("Important Notes & Statutory Guidance");

  const importantNotes = [
    "The payout statement is prepared based on the official policy issue date.",
    "For cancelled policies, the cancellation-created date is used for payout month selection.",
    "Only issued policies are included. Pending policies will be carried forward to the next eligible cycle.",
    "Any premium, commission, or policy mismatch may be adjusted in the next payout cycle.",
    "For payout-related clarification, please contact the assigned Relationship Manager.",
    "For long-term Motor policies, Own Damage commission is payable according to the applicable yearly payout cycle.",
    "TDS has been calculated at 2%. The applicable tax rate may be revised according to statutory requirements.",
  ];

  importantNotes.forEach((note, index) => {
    const numberLabel = `${index + 1}.`;
    const noteWidth = FULL_WIDTH - 28;
    const noteLines = wrapText(note, noteWidth, 6.2, { maxLines: 3 });
    const noteHeight = Math.max(14, noteLines.length * 8.5 + 4);

    ensureSpace(noteHeight + 2);
    
    drawFilledBox(LEFT, cursorY, FULL_WIDTH, noteHeight, index % 2 === 1 ? colors.pale : colors.transparent);
    
    drawText(numberLabel, LEFT + 8, cursorY - 10, { size: 6.4, bold: true, color: colors.primary });
    noteLines.forEach((line, lineIndex) => {
      drawText(line, LEFT + 22, cursorY - 10 - lineIndex * 8.5, { size: 6.2, color: colors.text });
    });
    cursorY -= noteHeight;
  });

  cursorY -= 14;

  ensureSpace(60);

  const declarationHeight = 48;
  drawBox(LEFT, cursorY, FULL_WIDTH, declarationHeight, { fill: colors.transparent, border: colors.border, shadow: false });

  drawText("SYSTEM-GENERATED STATEMENT", LEFT + 14, cursorY - 15, { size: 7.2, bold: true, color: colors.primary });
  drawWrappedText("This is an electronically generated POS commission statement from Notion Insurance Broker Pvt. Ltd. and does not require a physical signature.", LEFT + 14, cursorY - 25, FULL_WIDTH - 28, { size: 6, color: colors.muted, maxLines: 2, lineHeight: 8.5 });
  drawRightText(`Generated Date: ${formatDate(new Date())}`, PAGE_WIDTH - RIGHT - 14, cursorY - 38, { size: 6, bold: true, color: colors.muted });

  cursorY -= declarationHeight + 16;

  // ==========================================================
  // FINISH & EXPORT PDF
  // ==========================================================
  finishCurrentPage();

  const blob = makePdfBlob(pages);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const safePosId = String(pos?.pos_code || posId || "POS").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeMonth = String(month || "statement").replace(/[^a-zA-Z0-9_-]/g, "_");

  link.href = url;
  link.download = `POS_Commission_Statement_${safePosId}_${safeMonth}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}