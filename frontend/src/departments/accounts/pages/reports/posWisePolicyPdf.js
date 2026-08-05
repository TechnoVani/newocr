// posCommissionPdf.js

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

const LEFT = 26;
const RIGHT = 26;
const TOP = 816;
const BOTTOM = 34;
const FULL_WIDTH = PAGE_WIDTH - LEFT - RIGHT;

const colors = {
  navy: "0.039 0.157 0.294",
  blue: "0.047 0.192 0.361",
  accent: "0.000 0.416 0.639",
  sky: "0.871 0.929 0.973",
  pale: "0.969 0.984 0.996",
  lightBlue: "0.941 0.969 0.992",

  green: "0.886 0.969 0.922",
  darkGreen: "0.082 0.451 0.267",

  red: "1 0.925 0.906",
  darkRed: "0.741 0.200 0.200",

  yellow: "1 0.961 0.765",

  border: "0.650 0.725 0.820",
  softBorder: "0.820 0.855 0.902",

  text: "0.075 0.098 0.145",
  muted: "0.360 0.412 0.490",
  white: "1 1 1",
  black: "0 0 0",
};

const FONT_NORMAL = "F1";
const FONT_BOLD = "F2";
const FONT_SERIF = "F3";

// ============================================================
// GENERAL HELPERS
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

  if (text.length <= length) {
    return text;
  }

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
  if (!value) {
    return "-";
  }

  // Handles YYYY-MM-DD without timezone conversion problems.
  const stringValue = String(value).trim();
  const isoMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replaceAll("/", "-");
};

const formatMonthYear = (month) => {
  const match = String(month ?? "").match(/^(\d{4})-(\d{1,2})$/);

  if (!match) {
    return normalizeText(month, "-");
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return normalizeText(month, "-");
  }

  return new Date(year, monthIndex, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const posIncome = (policy) => {
  const odCommission =
    (numberValue(policy.total_od) * percentNumber(policy.pos_od)) / 100;

  const tpCommission =
    (numberValue(policy.total_tp) * percentNumber(policy.pos_tp)) / 100;

  const netCommission =
    (numberValue(policy.net_premium) *
      percentNumber(policy.pos_net)) /
    100;

  return odCommission + tpCommission + netCommission;
};

const policyTypeLabel = (policy) => {
  const policyStatus = String(policy.policy_status || "").toLowerCase();

  if (policyStatus === "cancelled") {
    return "Cancelled Motor";
  }

  const businessType = String(policy.business_type || "").toLowerCase();

  if (businessType.includes("renewal")) {
    return "Renewal Motor";
  }

  return "New Motor";
};

const getPolicyDisplayDate = (policy) => {
  const status = String(policy.policy_status || "").toLowerCase();

  if (status === "cancelled") {
    return formatDate(
      policy.cancellation_date ||
        policy.cancelled_at ||
        policy.cancellation_created_at
    );
  }

  return formatDate(
    policy.policy_issue_date ||
      policy.issue_date ||
      policy.date_of_issue ||
      policy.od_expiry ||
      policy.tp_expiry
  );
};

// ============================================================
// INDIAN AMOUNT IN WORDS
// ============================================================

const oneToNineteen = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tensWords = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const convertBelowHundred = (number) => {
  const value = Math.floor(number);

  if (value < 20) {
    return oneToNineteen[value];
  }

  const tens = Math.floor(value / 10);
  const units = value % 10;

  return `${tensWords[tens]}${units ? ` ${oneToNineteen[units]}` : ""}`;
};

const convertBelowThousand = (number) => {
  const value = Math.floor(number);
  const hundred = Math.floor(value / 100);
  const remainder = value % 100;

  const words = [];

  if (hundred) {
    words.push(`${oneToNineteen[hundred]} Hundred`);
  }

  if (remainder) {
    words.push(convertBelowHundred(remainder));
  }

  return words.join(" ");
};

const numberToIndianWords = (number) => {
  let value = Math.floor(Math.abs(numberValue(number)));

  if (value === 0) {
    return "Zero";
  }

  const words = [];

  const crore = Math.floor(value / 10000000);
  value %= 10000000;

  const lakh = Math.floor(value / 100000);
  value %= 100000;

  const thousand = Math.floor(value / 1000);
  value %= 1000;

  const hundredPart = value;

  if (crore) {
    words.push(`${numberToIndianWords(crore)} Crore`);
  }

  if (lakh) {
    words.push(`${convertBelowThousand(lakh)} Lakh`);
  }

  if (thousand) {
    words.push(`${convertBelowThousand(thousand)} Thousand`);
  }

  if (hundredPart) {
    words.push(convertBelowThousand(hundredPart));
  }

  return words.join(" ").replace(/\s+/g, " ").trim();
};

const amountWords = (value) => {
  const amount = Math.max(0, numberValue(value));
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = `Rupees ${numberToIndianWords(rupees)}`;

  if (paise > 0) {
    result += ` and ${numberToIndianWords(paise)} Paise`;
  }

  return `${result} Only`;
};

// ============================================================
// PDF FILE BUILDER
// ============================================================

const makePdfBlob = (pages) => {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",

    `<< /Type /Pages /Kids [${pages
      .map((_, index) => `${3 + index * 2} 0 R`)
      .join(" ")}] /Count ${pages.length} >>`,
  ];

  pages.forEach((pageContent, index) => {
    const pageObject = 3 + index * 2;
    const contentObject = pageObject + 1;

    objects.push(
      [
        "<< /Type /Page",
        "/Parent 2 0 R",
        `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
        "/Resources <<",
        "/Font <<",
        "/F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "/F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        "/F3 << /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>",
        ">>",
        ">>",
        `/Contents ${contentObject} 0 R`,
        ">>",
      ].join(" ")
    );

    objects.push(
      `<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream`
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const crossReferenceOffset = pdf.length;

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf += [
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    crossReferenceOffset,
    "%%EOF",
  ].join("\n");

  return new Blob([pdf], {
    type: "application/pdf",
  });
};

// ============================================================
// TOTAL CALCULATIONS
// ============================================================

const buildTotals = (policies) =>
  policies.reduce(
    (result, policy) => {
      const type = policyTypeLabel(policy);

      const grouped = result.byType.get(type) || {
        count: 0,
        od: 0,
        tp: 0,
        net: 0,
        odAmount: 0,
        tpAmount: 0,
        netAmount: 0,
        commission: 0,
      };

      const od = numberValue(policy.total_od);
      const tp = numberValue(policy.total_tp);
      const net = numberValue(policy.net_premium);

      const odAmount =
        (od * percentNumber(policy.pos_od)) / 100;

      const tpAmount =
        (tp * percentNumber(policy.pos_tp)) / 100;

      const netAmount =
        (net * percentNumber(policy.pos_net)) / 100;

      const commission = odAmount + tpAmount + netAmount;

      result.od += od;
      result.tp += tp;
      result.net += net;

      result.odAmount += odAmount;
      result.tpAmount += tpAmount;
      result.netAmount += netAmount;

      result.advance += numberValue(
        policy.advance ??
          policy.advanced_amount ??
          policy.advance_amount
      );

      grouped.count += 1;
      grouped.od += od;
      grouped.tp += tp;
      grouped.net += net;

      grouped.odAmount += odAmount;
      grouped.tpAmount += tpAmount;
      grouped.netAmount += netAmount;
      grouped.commission += commission;

      result.byType.set(type, grouped);

      const policyStatus = String(
        policy.policy_status || ""
      ).toLowerCase();

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
      od: 0,
      tp: 0,
      net: 0,

      odAmount: 0,
      tpAmount: 0,
      netAmount: 0,

      activePayout: 0,
      advance: 0,
      recovery: 0,

      motor: 0,
      cancelled: 0,

      byType: new Map(),
    }
  );

// ============================================================
// MAIN PDF FUNCTION
// ============================================================

export function downloadPosWiseSelectedPoliciesPdf({
  policies,
  pos,
  month,
  posId,
}) {
  const selectedPolicies = Array.isArray(policies)
    ? policies
    : [];

  if (!selectedPolicies.length) {
    window.alert(
      "Please select at least one policy before generating the PDF."
    );
    return;
  }

  const formattedMonthYear = formatMonthYear(month);
  const totals = buildTotals(selectedPolicies);

  const totalPayout =
    totals.odAmount +
    totals.tpAmount +
    totals.netAmount;

  const tds = Math.max(0, totalPayout * 0.02);
  const afterTds = totalPayout - tds;
  const advancedAmount = totals.advance;
  const recoveryAmount = totals.recovery;

  const amountPayable =
    afterTds - advancedAmount - recoveryAmount;

  const finalPayableAmount = Math.max(0, amountPayable);

  const pages = [];

  let content = "";
  let cursorY = TOP;
  let pageNumber = 0;

  // ==========================================================
  // LOW-LEVEL DRAWING HELPERS
  // ==========================================================

  const textWidth = (value, size = 7, bold = false) => {
    const textValue = String(value ?? "");
    const averageFactor = bold ? 0.55 : 0.5;

    return textValue.length * size * averageFactor;
  };

  const drawText = (
    value,
    x,
    baselineY,
    {
      size = 7,
      bold = false,
      color = colors.text,
      font = FONT_NORMAL,
    } = {}
  ) => {
    const selectedFont = bold ? FONT_BOLD : font;

    content += [
      "BT",
      `${color} rg`,
      `/${selectedFont} ${size} Tf`,
      `${x.toFixed(2)} ${baselineY.toFixed(2)} Td`,
      `(${escapePdfText(value)}) Tj`,
      "ET",
      "",
    ].join(" ");
  };

  const drawRightText = (
    value,
    rightX,
    baselineY,
    options = {}
  ) => {
    const size = options.size || 7;
    const width = textWidth(value, size, options.bold);

    drawText(value, rightX - width, baselineY, options);
  };

  const drawCenteredText = (
    value,
    centerX,
    baselineY,
    options = {}
  ) => {
    const size = options.size || 7;
    const width = textWidth(value, size, options.bold);

    drawText(value, centerX - width / 2, baselineY, options);
  };

  const drawFilledBox = (
    x,
    topY,
    width,
    height,
    fillColor = colors.white
  ) => {
    const bottomY = topY - height;

    content += [
      "q",
      `${fillColor} rg`,
      `${x.toFixed(2)} ${bottomY.toFixed(2)}`,
      `${width.toFixed(2)} ${height.toFixed(2)} re`,
      "f",
      "Q",
      "",
    ].join(" ");
  };

  const drawBorderBox = (
    x,
    topY,
    width,
    height,
    borderColor = colors.border,
    lineWidth = 0.45
  ) => {
    const bottomY = topY - height;

    content += [
      "q",
      `${lineWidth} w`,
      `${borderColor} RG`,
      `${x.toFixed(2)} ${bottomY.toFixed(2)}`,
      `${width.toFixed(2)} ${height.toFixed(2)} re`,
      "S",
      "Q",
      "",
    ].join(" ");
  };

  const drawBox = (
    x,
    topY,
    width,
    height,
    {
      fill = colors.white,
      border = colors.border,
      lineWidth = 0.45,
    } = {}
  ) => {
    drawFilledBox(x, topY, width, height, fill);
    drawBorderBox(
      x,
      topY,
      width,
      height,
      border,
      lineWidth
    );
  };

  const drawLine = (
    x1,
    y1,
    x2,
    y2,
    {
      color = colors.border,
      width = 0.45,
    } = {}
  ) => {
    content += [
      "q",
      `${width} w`,
      `${color} RG`,
      `${x1.toFixed(2)} ${y1.toFixed(2)} m`,
      `${x2.toFixed(2)} ${y2.toFixed(2)} l`,
      "S",
      "Q",
      "",
    ].join(" ");
  };

  // ==========================================================
  // TEXT WRAPPING
  // ==========================================================

  const splitLongWord = (
    word,
    maxWidth,
    fontSize,
    bold = false
  ) => {
    const parts = [];
    let current = "";

    for (const character of word) {
      const candidate = `${current}${character}`;

      if (
        current &&
        textWidth(candidate, fontSize, bold) > maxWidth
      ) {
        parts.push(current);
        current = character;
      } else {
        current = candidate;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  };

  const wrapText = (
    value,
    maxWidth,
    fontSize = 7,
    {
      bold = false,
      maxLines = null,
    } = {}
  ) => {
    const originalText = normalizeText(value);
    const originalWords = originalText.split(" ");

    const words = [];

    originalWords.forEach((word) => {
      if (textWidth(word, fontSize, bold) > maxWidth) {
        words.push(
          ...splitLongWord(
            word,
            maxWidth,
            fontSize,
            bold
          )
        );
      } else {
        words.push(word);
      }
    });

    const lines = [];
    let line = "";

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;

      if (
        line &&
        textWidth(candidate, fontSize, bold) > maxWidth
      ) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });

    if (line) {
      lines.push(line);
    }

    if (
      maxLines &&
      lines.length > maxLines
    ) {
      const limitedLines = lines.slice(0, maxLines);
      const lastIndex = limitedLines.length - 1;
      let lastLine = limitedLines[lastIndex];

      while (
        lastLine.length > 1 &&
        textWidth(
          `${lastLine}...`,
          fontSize,
          bold
        ) > maxWidth
      ) {
        lastLine = lastLine.slice(0, -1);
      }

      limitedLines[lastIndex] = `${lastLine.trim()}...`;

      return limitedLines;
    }

    return lines.length ? lines : ["-"];
  };

  const drawWrappedText = (
    value,
    x,
    topY,
    maxWidth,
    {
      size = 7,
      bold = false,
      color = colors.text,
      font = FONT_NORMAL,
      lineHeight = size + 2,
      maxLines = null,
      align = "left",
    } = {}
  ) => {
    const lines = wrapText(value, maxWidth, size, {
      bold,
      maxLines,
    });

    lines.forEach((line, index) => {
      const baselineY =
        topY - size - index * lineHeight;

      if (align === "right") {
        drawRightText(line, x + maxWidth, baselineY, {
          size,
          bold,
          color,
          font,
        });
      } else if (align === "center") {
        drawCenteredText(
          line,
          x + maxWidth / 2,
          baselineY,
          {
            size,
            bold,
            color,
            font,
          }
        );
      } else {
        drawText(line, x, baselineY, {
          size,
          bold,
          color,
          font,
        });
      }
    });

    return lines.length;
  };

  // ==========================================================
  // PAGE HEADER AND FOOTER
  // ==========================================================

  const drawFooter = () => {
    const footerLineY = 29;

    drawLine(
      LEFT,
      footerLineY,
      PAGE_WIDTH - RIGHT,
      footerLineY,
      {
        color: colors.softBorder,
        width: 0.4,
      }
    );

    drawText(
      `POS Commission Statement | ${formattedMonthYear}`,
      LEFT,
      16,
      {
        size: 5.8,
        color: colors.muted,
      }
    );

    drawCenteredText(
      normalizeText(pos?.pos_code || `POS ${posId}`),
      PAGE_WIDTH / 2,
      16,
      {
        size: 5.8,
        color: colors.muted,
      }
    );

    drawRightText(
      `Page ${pageNumber}`,
      PAGE_WIDTH - RIGHT,
      16,
      {
        size: 6,
        bold: true,
        color: colors.muted,
      }
    );
  };

  const finishCurrentPage = () => {
    if (!content) {
      return;
    }

    drawFooter();
    pages.push(content);
    content = "";
  };

  const drawPrimaryHeader = () => {
    const stripHeight = 36;

    drawFilledBox(
      LEFT,
      TOP,
      FULL_WIDTH,
      stripHeight,
      colors.navy
    );

    drawText(
      "POS COMMISSION STATEMENT",
      LEFT + 14,
      TOP - 22,
      {
        size: 12,
        bold: true,
        color: colors.white,
      }
    );

    drawRightText(
      formattedMonthYear,
      PAGE_WIDTH - RIGHT - 14,
      TOP - 17,
      {
        size: 8.5,
        bold: true,
        color: colors.white,
      }
    );

    drawRightText(
      normalizeText(pos?.pos_code || `POS ${posId}`),
      PAGE_WIDTH - RIGHT - 14,
      TOP - 29,
      {
        size: 6.8,
        color: colors.sky,
      }
    );

    cursorY = TOP - stripHeight - 10;

    const cardHeight = 106;

    drawBox(
      LEFT,
      cursorY,
      FULL_WIDTH,
      cardHeight,
      {
        fill: colors.pale,
        border: colors.softBorder,
      }
    );

    drawText(
      normalizeText(pos?.pos_name, "POS Policies"),
      LEFT + 14,
      cursorY - 18,
      {
        size: 10.5,
        bold: true,
        color: colors.blue,
      }
    );

    drawRightText(
      `Payout Period: ${formattedMonthYear}`,
      PAGE_WIDTH - RIGHT - 14,
      cursorY - 18,
      {
        size: 7.5,
        bold: true,
        color: colors.accent,
      }
    );

    drawLine(
      LEFT + 14,
      cursorY - 28,
      PAGE_WIDTH - RIGHT - 14,
      cursorY - 28,
      {
        color: colors.softBorder,
      }
    );

    const cardTop = cursorY - 38;
    const columnGap = 14;
    const usableWidth = FULL_WIDTH - 28;
    const columnWidth =
      (usableWidth - columnGap * 2) / 3;

    const column1X = LEFT + 14;
    const column2X =
      column1X + columnWidth + columnGap;
    const column3X =
      column2X + columnWidth + columnGap;

    const labelSize = 5.7;
    const valueSize = 7;
    const rowGap = 24;

    const drawDetail = (
      label,
      value,
      x,
      topY,
      maxLines = 1
    ) => {
      drawText(label.toUpperCase(), x, topY, {
        size: labelSize,
        bold: true,
        color: colors.muted,
      });

      drawWrappedText(
        normalizeText(value),
        x,
        topY - 4,
        columnWidth - 4,
        {
          size: valueSize,
          bold: false,
          color: colors.text,
          lineHeight: 8,
          maxLines,
        }
      );
    };

    drawDetail(
      "Name",
      pos?.pos_name,
      column1X,
      cardTop
    );

    drawDetail(
      "POS Code",
      pos?.pos_code || posId,
      column1X,
      cardTop - rowGap
    );

    drawDetail(
      "Email",
      pos?.email,
      column1X,
      cardTop - rowGap * 2,
      2
    );

    drawDetail(
      "Mobile",
      pos?.mobile,
      column2X,
      cardTop
    );

    drawDetail(
      "PAN Number",
      pos?.pan_no || pos?.pan_number,
      column2X,
      cardTop - rowGap
    );

    drawDetail(
      "Address",
      pos?.address,
      column2X,
      cardTop - rowGap * 2,
      2
    );

    drawDetail(
      "Bank Name",
      pos?.bank_name,
      column3X,
      cardTop,
      2
    );

    drawDetail(
      "Account Number",
      pos?.account_no ||
        pos?.bank_account_number,
      column3X,
      cardTop - rowGap
    );

    drawDetail(
      "IFSC Code",
      pos?.ifsc_code,
      column3X,
      cardTop - rowGap * 2
    );

    cursorY -= cardHeight + 14;
  };

  const drawContinuationHeader = () => {
    const headerHeight = 46;

    drawBox(
      LEFT,
      TOP,
      FULL_WIDTH,
      headerHeight,
      {
        fill: colors.navy,
        border: colors.navy,
      }
    );

    drawText(
      "POS COMMISSION STATEMENT",
      LEFT + 13,
      TOP - 19,
      {
        size: 10,
        bold: true,
        color: colors.white,
      }
    );

    drawText(
      normalizeText(pos?.pos_name, "POS Policies"),
      LEFT + 13,
      TOP - 33,
      {
        size: 6.8,
        color: colors.sky,
      }
    );

    drawRightText(
      formattedMonthYear,
      PAGE_WIDTH - RIGHT - 13,
      TOP - 19,
      {
        size: 7.4,
        bold: true,
        color: colors.white,
      }
    );

    drawRightText(
      normalizeText(pos?.pos_code || `POS ${posId}`),
      PAGE_WIDTH - RIGHT - 13,
      TOP - 33,
      {
        size: 6.4,
        color: colors.sky,
      }
    );

    cursorY = TOP - headerHeight - 14;
  };

  const startNewPage = ({
    primary = false,
  } = {}) => {
    if (content) {
      finishCurrentPage();
    }

    pageNumber += 1;
    content = "0.45 w\n";

    if (primary) {
      drawPrimaryHeader();
    } else {
      drawContinuationHeader();
    }
  };

  const ensureSpace = (
    requiredHeight,
    {
      continuationTitle = null,
    } = {}
  ) => {
    if (
      cursorY - requiredHeight <
      BOTTOM + 18
    ) {
      startNewPage();

      if (continuationTitle) {
        drawSectionTitle(
          `${continuationTitle} - Continued`
        );
      }

      return true;
    }

    return false;
  };

  // ==========================================================
  // SECTION HELPERS
  // ==========================================================

  const drawSectionTitle = (title) => {
    ensureSpace(30);

    const height = 22;

    drawBox(
      LEFT,
      cursorY,
      FULL_WIDTH,
      height,
      {
        fill: colors.blue,
        border: colors.blue,
      }
    );

    drawText(
      String(title).toUpperCase(),
      LEFT + 10,
      cursorY - 14,
      {
        size: 7.6,
        bold: true,
        color: colors.white,
      }
    );

    cursorY -= height + 8;
  };

  const drawStatCards = (cards) => {
    const gap = 8;
    const height = 52;
    const width =
      (FULL_WIDTH - gap * (cards.length - 1)) /
      cards.length;

    ensureSpace(height + 10);

    cards.forEach((card, index) => {
      const x = LEFT + index * (width + gap);

      drawBox(
        x,
        cursorY,
        width,
        height,
        {
          fill: card.fill || colors.pale,
          border: card.border || colors.softBorder,
        }
      );

      drawText(
        String(card.label).toUpperCase(),
        x + 9,
        cursorY - 14,
        {
          size: 5.7,
          bold: true,
          color: colors.muted,
        }
      );

      drawWrappedText(
        card.value,
        x + 9,
        cursorY - 19,
        width - 18,
        {
          size: card.valueSize || 10,
          bold: true,
          color: card.valueColor || colors.blue,
          maxLines: 1,
        }
      );

      if (card.subValue) {
        drawWrappedText(
          card.subValue,
          x + 9,
          cursorY - 38,
          width - 18,
          {
            size: 5.6,
            color: colors.muted,
            maxLines: 1,
          }
        );
      }
    });

    cursorY -= height + 12;
  };

  // ==========================================================
  // ADVANCED TABLE ENGINE
  // ==========================================================

  const prepareColumns = (
    columns,
    targetWidth = FULL_WIDTH
  ) => {
    const totalBaseWidth = columns.reduce(
      (sum, column) => sum + column.width,
      0
    );

    const scale =
      totalBaseWidth > 0
        ? targetWidth / totalBaseWidth
        : 1;

    const result = columns.map((column) => ({
      ...column,
      calculatedWidth:
        Math.floor(
          column.width * scale * 100
        ) / 100,
    }));

    const calculatedTotal = result.reduce(
      (sum, column) =>
        sum + column.calculatedWidth,
      0
    );

    if (result.length) {
      result[result.length - 1].calculatedWidth +=
        targetWidth - calculatedTotal;
    }

    return result;
  };

  const calculateCellLines = (
    cellValue,
    column,
    bodySize
  ) => {
    const padding = column.padding ?? 4;
    const availableWidth =
      column.calculatedWidth - padding * 2;

    return wrapText(
      normalizeText(cellValue),
      Math.max(4, availableWidth),
      column.fontSize || bodySize,
      {
        bold: Boolean(column.bold),
        maxLines: column.maxLines || 1,
      }
    );
  };

  const calculateRowHeight = (
    row,
    columns,
    {
      bodySize = 6.2,
      minRowHeight = 22,
      lineHeight = 8,
      verticalPadding = 6,
    } = {}
  ) => {
    const maximumLines = columns.reduce(
      (maximum, column, index) => {
        const cellLines = calculateCellLines(
          row[index],
          column,
          bodySize
        );

        return Math.max(
          maximum,
          cellLines.length
        );
      },
      1
    );

    return Math.max(
      minRowHeight,
      maximumLines * lineHeight +
        verticalPadding * 2
    );
  };

  const drawTableHeader = (
    x,
    columns,
    {
      headerHeight = 24,
      headerSize = 6.2,
      headerFill = colors.sky,
      headerColor = colors.text,
    } = {}
  ) => {
    let currentX = x;

    columns.forEach((column) => {
      drawBox(
        currentX,
        cursorY,
        column.calculatedWidth,
        headerHeight,
        {
          fill:
            column.headerFill ||
            headerFill,
          border: colors.border,
        }
      );

      const padding = column.padding ?? 4;
      const label = normalizeText(
        column.label
      );

      const labelLines = wrapText(
        label,
        column.calculatedWidth -
          padding * 2,
        column.headerSize || headerSize,
        {
          bold: true,
          maxLines: 2,
        }
      );

      const effectiveLineHeight =
        (column.headerSize ||
          headerSize) + 1;

      const totalTextHeight =
        labelLines.length *
        effectiveLineHeight;

      const firstBaseline =
        cursorY -
        (headerHeight -
          totalTextHeight) /
          2 -
        (column.headerSize ||
          headerSize);

      labelLines.forEach(
        (line, lineIndex) => {
          const baselineY =
            firstBaseline -
            lineIndex *
              effectiveLineHeight;

          const alignment =
            column.headerAlign ||
            column.align ||
            "left";

          if (alignment === "right") {
            drawRightText(
              line,
              currentX +
                column.calculatedWidth -
                padding,
              baselineY,
              {
                size:
                  column.headerSize ||
                  headerSize,
                bold: true,
                color: headerColor,
              }
            );
          } else if (
            alignment === "center"
          ) {
            drawCenteredText(
              line,
              currentX +
                column.calculatedWidth /
                  2,
              baselineY,
              {
                size:
                  column.headerSize ||
                  headerSize,
                bold: true,
                color: headerColor,
              }
            );
          } else {
            drawText(
              line,
              currentX + padding,
              baselineY,
              {
                size:
                  column.headerSize ||
                  headerSize,
                bold: true,
                color: headerColor,
              }
            );
          }
        }
      );

      currentX +=
        column.calculatedWidth;
    });

    cursorY -= headerHeight;
  };

  const drawTableRow = (
    x,
    row,
    columns,
    rowHeight,
    {
      rowFill = colors.white,
      bodySize = 6.2,
      bodyColor = colors.text,
      lineHeight = 8,
    } = {}
  ) => {
    let currentX = x;

    columns.forEach((column, index) => {
      const cellValue = normalizeText(
        row[index]
      );

      drawBox(
        currentX,
        cursorY,
        column.calculatedWidth,
        rowHeight,
        {
          fill:
            column.fill ||
            rowFill,
          border: colors.border,
        }
      );

      const padding =
        column.padding ?? 4;

      const fontSize =
        column.fontSize || bodySize;

      const lines = calculateCellLines(
        cellValue,
        column,
        bodySize
      );

      const effectiveLineHeight =
        column.lineHeight ||
        lineHeight;

      const totalTextHeight =
        lines.length *
        effectiveLineHeight;

      const firstBaseline =
        cursorY -
        (rowHeight -
          totalTextHeight) /
          2 -
        fontSize +
        1;

      lines.forEach(
        (line, lineIndex) => {
          const baselineY =
            firstBaseline -
            lineIndex *
              effectiveLineHeight;

          const alignment =
            column.align || "left";

          const textOptions = {
            size: fontSize,
            bold:
              Boolean(column.bold),
            color:
              column.color ||
              bodyColor,
            font:
              column.font ||
              FONT_NORMAL,
          };

          if (alignment === "right") {
            drawRightText(
              line,
              currentX +
                column.calculatedWidth -
                padding,
              baselineY,
              textOptions
            );
          } else if (
            alignment === "center"
          ) {
            drawCenteredText(
              line,
              currentX +
                column.calculatedWidth /
                  2,
              baselineY,
              textOptions
            );
          } else {
            drawText(
              line,
              currentX + padding,
              baselineY,
              textOptions
            );
          }
        }
      );

      currentX +=
        column.calculatedWidth;
    });

    cursorY -= rowHeight;
  };

  const drawTable = ({
    x = LEFT,
    width = FULL_WIDTH,
    columns,
    rows,
    rowFills = [],
    options = {},
  }) => {
    const preparedColumns =
      prepareColumns(columns, width);

    const headerHeight =
      options.headerHeight || 24;

    const tableTitle =
      options.tableTitle || null;

    ensureSpace(
      headerHeight +
        (options.minRowHeight || 22) +
        8,
      {
        continuationTitle: tableTitle,
      }
    );

    drawTableHeader(
      x,
      preparedColumns,
      options
    );

    rows.forEach((row, rowIndex) => {
      const rowHeight =
        calculateRowHeight(
          row,
          preparedColumns,
          options
        );

      if (
        cursorY - rowHeight <
        BOTTOM + 18
      ) {
        startNewPage();

        if (tableTitle) {
          drawSectionTitle(
            `${tableTitle} - Continued`
          );
        }

        drawTableHeader(
          x,
          preparedColumns,
          options
        );
      }

      const fill =
        rowFills[rowIndex] ||
        (options.zebra &&
        rowIndex % 2 === 1
          ? colors.pale
          : colors.white);

      drawTableRow(
        x,
        row,
        preparedColumns,
        rowHeight,
        {
          ...options,
          rowFill: fill,
        }
      );
    });

    cursorY -= options.afterSpacing ?? 12;
  };

  // ==========================================================
  // PDF GENERATION START
  // ==========================================================

  startNewPage({
    primary: true,
  });

  // ----------------------------------------------------------
  // Overview cards
  // ----------------------------------------------------------

  drawStatCards([
    {
      label: "Selected Policies",
      value: String(selectedPolicies.length),
      subValue: `${totals.motor} active, ${totals.cancelled} cancelled`,
      fill: colors.lightBlue,
    },
    {
      label: "Total Premium",
      value: `Rs. ${money(
        totals.od + totals.tp + totals.net
      )}`,
      subValue: "OD + TP + Net Premium",
      valueSize: 8.7,
      fill: colors.pale,
    },
    {
      label: "Gross Commission",
      value: `Rs. ${money(totalPayout)}`,
      subValue: "Before TDS and recovery",
      valueSize: 8.7,
      fill: colors.green,
      valueColor: colors.darkGreen,
    },
    {
      label: "Amount Payable",
      value: `Rs. ${money(
        finalPayableAmount
      )}`,
      subValue: "Final payable amount",
      valueSize: 8.7,
      fill:
        finalPayableAmount > 0
          ? colors.green
          : colors.yellow,
      valueColor:
        finalPayableAmount > 0
          ? colors.darkGreen
          : colors.darkRed,
    },
  ]);

  // ----------------------------------------------------------
  // Premium summary
  // ----------------------------------------------------------

  drawSectionTitle("Premium Summary");

  const premiumRows = [
    ...totals.byType.entries(),
  ].map(([type, value]) => [
    type,
    value.count,
    money(value.od),
    money(value.tp),
    money(value.net),
    money(
      value.od + value.tp + value.net
    ),
  ]);

  premiumRows.push([
    "Total Premium",
    selectedPolicies.length,
    money(totals.od),
    money(totals.tp),
    money(totals.net),
    money(
      totals.od +
        totals.tp +
        totals.net
    ),
  ]);

  drawTable({
    columns: [
      {
        label: "Business Type",
        width: 155,
        align: "left",
        maxLines: 2,
      },
      {
        label: "NOP",
        width: 42,
        align: "center",
      },
      {
        label: "OD Premium",
        width: 84,
        align: "right",
      },
      {
        label: "TP Premium",
        width: 84,
        align: "right",
      },
      {
        label: "Net Premium",
        width: 84,
        align: "right",
      },
      {
        label: "Total Premium",
        width: 94,
        align: "right",
      },
    ],
    rows: premiumRows,
    rowFills: premiumRows.map(
      (_, index) =>
        index === premiumRows.length - 1
          ? colors.green
          : undefined
    ),
    options: {
      bodySize: 6.2,
      minRowHeight: 23,
      zebra: true,
      tableTitle: "Premium Summary",
    },
  });

  // ----------------------------------------------------------
  // Commission summary
  // ----------------------------------------------------------

  drawSectionTitle(
    "Commission Summary"
  );

  const commissionRows = [
    ...totals.byType.entries(),
  ].map(([type, value]) => [
    `${type} Commission`,
    value.count,
    money(value.odAmount),
    money(value.tpAmount),
    money(value.netAmount),
    money(value.commission),
  ]);

  commissionRows.push([
    "Total Commission",
    selectedPolicies.length,
    money(totals.odAmount),
    money(totals.tpAmount),
    money(totals.netAmount),
    money(totalPayout),
  ]);

  drawTable({
    columns: [
      {
        label: "Commission Type",
        width: 155,
        maxLines: 2,
      },
      {
        label: "NOP",
        width: 42,
        align: "center",
      },
      {
        label: "OD Commission",
        width: 84,
        align: "right",
      },
      {
        label: "TP Commission",
        width: 84,
        align: "right",
      },
      {
        label: "Net Commission",
        width: 84,
        align: "right",
      },
      {
        label: "Final Commission",
        width: 94,
        align: "right",
      },
    ],
    rows: commissionRows,
    rowFills: commissionRows.map(
      (_, index) =>
        index ===
        commissionRows.length - 1
          ? colors.green
          : undefined
    ),
    options: {
      bodySize: 6.1,
      minRowHeight: 23,
      zebra: true,
      tableTitle:
        "Commission Summary",
    },
  });

  // ----------------------------------------------------------
  // Commission calculation
  // ----------------------------------------------------------

  drawSectionTitle(
    "Commission Calculation"
  );

  const calculationRows = [
    [
      "Gross Commission",
      "-",
      money(totalPayout),
      money(totalPayout),
    ],
    [
      "TDS Deduction (2%)",
      money(tds),
      "-",
      money(afterTds),
    ],
    [
      "Already Paid / Advance",
      money(advancedAmount),
      "-",
      money(
        afterTds - advancedAmount
      ),
    ],
    [
      "Cancelled Policy Recovery",
      money(recoveryAmount),
      "-",
      money(amountPayable),
    ],
    [
      amountPayable < 0
        ? "Excess Recovery"
        : "Final Amount Payable",
      amountPayable < 0
        ? money(Math.abs(amountPayable))
        : "-",
      amountPayable >= 0
        ? money(finalPayableAmount)
        : "-",
      money(amountPayable),
    ],
  ];

  drawTable({
    columns: [
      {
        label: "Calculation",
        width: 205,
        bold: true,
      },
      {
        label: "Debit",
        width: 110,
        align: "right",
      },
      {
        label: "Credit",
        width: 110,
        align: "right",
      },
      {
        label: "Running Balance",
        width: 118,
        align: "right",
        bold: true,
      },
    ],
    rows: calculationRows,
    rowFills: [
      colors.white,
      colors.white,
      colors.yellow,
      recoveryAmount > 0
        ? colors.red
        : colors.white,
      amountPayable >= 0
        ? colors.green
        : colors.red,
    ],
    options: {
      bodySize: 6.7,
      minRowHeight: 25,
      tableTitle:
        "Commission Calculation",
    },
  });

  // ----------------------------------------------------------
  // Final amount box
  // ----------------------------------------------------------

  ensureSpace(70);

  const amountBoxHeight = 58;
  const labelWidth = 350;

  drawBox(
    LEFT,
    cursorY,
    labelWidth,
    amountBoxHeight,
    {
      fill: colors.navy,
      border: colors.navy,
    }
  );

  drawText(
    amountPayable >= 0
      ? "FINAL AMOUNT PAYABLE"
      : "EXCESS RECOVERY AMOUNT",
    LEFT + 14,
    cursorY - 20,
    {
      size: 9.5,
      bold: true,
      color: colors.white,
    }
  );

  drawWrappedText(
    amountWords(
      Math.abs(amountPayable)
    ),
    LEFT + 14,
    cursorY - 28,
    labelWidth - 28,
    {
      size: 6.2,
      color: colors.sky,
      maxLines: 2,
      lineHeight: 8,
    }
  );

  drawBox(
    LEFT + labelWidth,
    cursorY,
    FULL_WIDTH - labelWidth,
    amountBoxHeight,
    {
      fill:
        amountPayable >= 0
          ? colors.green
          : colors.red,
      border:
        amountPayable >= 0
          ? colors.darkGreen
          : colors.darkRed,
    }
  );

  drawCenteredText(
    "INR",
    LEFT +
      labelWidth +
      (FULL_WIDTH - labelWidth) /
        2,
    cursorY - 16,
    {
      size: 5.7,
      bold: true,
      color: colors.muted,
    }
  );

  drawCenteredText(
    money(Math.abs(amountPayable)),
    LEFT +
      labelWidth +
      (FULL_WIDTH - labelWidth) /
        2,
    cursorY - 37,
    {
      size: 13.5,
      bold: true,
      color:
        amountPayable >= 0
          ? colors.darkGreen
          : colors.darkRed,
    }
  );

  cursorY -= amountBoxHeight + 16;

  // ----------------------------------------------------------
  // Grouped business summary
  // ----------------------------------------------------------

  drawSectionTitle(
    "Grouped Business Summary"
  );

  const classMap =
    selectedPolicies.reduce(
      (map, policy) => {
        const key = normalizeText(
          policy.vehicle_category ||
            policy.commercial_vehicle_type ||
            policy.policy_type,
          "Motor"
        );

        const value =
          map.get(key) || {
            count: 0,
            od: 0,
            tp: 0,
            net: 0,
            commission: 0,
          };

        value.count += 1;
        value.od += numberValue(
          policy.total_od
        );
        value.tp += numberValue(
          policy.total_tp
        );
        value.net += numberValue(
          policy.net_premium
        );
        value.commission +=
          posIncome(policy);

        map.set(key, value);

        return map;
      },
      new Map()
    );

  const groupedRows = [
    ...classMap.entries(),
  ].map(([category, value]) => [
    category,
    value.count,
    money(value.od),
    money(value.tp),
    money(value.net),
    money(value.commission),
  ]);

  groupedRows.push([
    "Grand Total",
    selectedPolicies.length,
    money(totals.od),
    money(totals.tp),
    money(totals.net),
    money(totalPayout),
  ]);

  drawTable({
    columns: [
      {
        label: "Vehicle Category",
        width: 145,
        maxLines: 2,
      },
      {
        label: "NOP",
        width: 42,
        align: "center",
      },
      {
        label: "OD Premium",
        width: 82,
        align: "right",
      },
      {
        label: "TP Premium",
        width: 82,
        align: "right",
      },
      {
        label: "Net Premium",
        width: 82,
        align: "right",
      },
      {
        label: "Commission",
        width: 110,
        align: "right",
      },
    ],
    rows: groupedRows,
    rowFills: groupedRows.map(
      (_, index) =>
        index === groupedRows.length - 1
          ? colors.green
          : undefined
    ),
    options: {
      bodySize: 6.1,
      minRowHeight: 23,
      zebra: true,
      tableTitle:
        "Grouped Business Summary",
    },
  });

  ensureSpace(18);

  drawWrappedText(
    "This summary is generated from the selected POS-dependent policy records.",
    LEFT + 4,
    cursorY,
    FULL_WIDTH - 8,
    {
      size: 6,
      color: colors.muted,
      maxLines: 2,
    }
  );

  cursorY -= 22;

  // ----------------------------------------------------------
  // Selected policy details
  // ----------------------------------------------------------

  drawSectionTitle(
    "Selected Motor Policies"
  );

  ensureSpace(24);

  drawBox(
    LEFT,
    cursorY,
    FULL_WIDTH,
    22,
    {
      fill: colors.red,
      border: colors.softBorder,
    }
  );

  drawText(
    "Cancelled policies are highlighted in red. The displayed date is the cancellation date for cancelled policies.",
    LEFT + 8,
    cursorY - 14,
    {
      size: 5.7,
      bold: true,
      color: colors.darkRed,
    }
  );

  cursorY -= 30;

  const policyColumns = [
    {
      label: "S.No.",
      width: 24,
      align: "center",
      headerAlign: "center",
      maxLines: 1,
      fontSize: 5.2,
    },
    {
      label: "Customer",
      width: 66,
      align: "left",
      maxLines: 2,
      fontSize: 5.1,
    },
    {
      label: "Insurer",
      width: 58,
      align: "left",
      maxLines: 2,
      fontSize: 5,
    },
    {
      label: "Policy Number",
      width: 75,
      align: "left",
      maxLines: 2,
      fontSize: 4.9,
    },
    {
      label: "Issue / Cancel Date",
      width: 50,
      align: "center",
      headerAlign: "center",
      maxLines: 1,
      fontSize: 4.9,
    },
    {
      label: "Product",
      width: 49,
      align: "left",
      maxLines: 2,
      fontSize: 4.9,
    },
    {
      label: "OD",
      width: 44,
      align: "right",
      maxLines: 1,
      fontSize: 5,
    },
    {
      label: "TP",
      width: 44,
      align: "right",
      maxLines: 1,
      fontSize: 5,
    },
    {
      label: "Net",
      width: 44,
      align: "right",
      maxLines: 1,
      fontSize: 5,
    },
    {
      label: "OD %",
      width: 31,
      align: "right",
      maxLines: 1,
      fontSize: 4.8,
    },
    {
      label: "TP %",
      width: 31,
      align: "right",
      maxLines: 1,
      fontSize: 4.8,
    },
    {
      label: "Net %",
      width: 33,
      align: "right",
      maxLines: 1,
      fontSize: 4.8,
    },
    {
      label: "Commission",
      width: 61,
      align: "right",
      maxLines: 1,
      fontSize: 5,
      bold: true,
    },
  ];

  const policyRows =
    selectedPolicies.map(
      (policy, index) => [
        index + 1,

        normalizeText(
          policy.insured_name ||
            policy.customer_name
        ),

        normalizeText(
          policy.insurance_company ||
            policy.insurer_name
        ),

        normalizeText(
          policy.policy_number ||
            policy.policy_no
        ),

        getPolicyDisplayDate(policy),

        normalizeText(
          policy.vehicle_category ||
            policy.commercial_vehicle_type ||
            policy.policy_type,
          "Motor"
        ),

        money(policy.total_od),

        money(policy.total_tp),

        money(policy.net_premium),

        percentage(policy.pos_od),

        percentage(policy.pos_tp),

        percentage(policy.pos_net),

        money(posIncome(policy)),
      ]
    );

  const policyRowFills =
    selectedPolicies.map(
      (policy, index) => {
        const cancelled =
          String(
            policy.policy_status || ""
          ).toLowerCase() ===
          "cancelled";

        if (cancelled) {
          return colors.red;
        }

        return index % 2 === 1
          ? colors.pale
          : colors.white;
      }
    );

  drawTable({
    columns: policyColumns,
    rows: policyRows,
    rowFills: policyRowFills,
    options: {
      bodySize: 5,
      headerSize: 4.9,
      headerHeight: 27,
      minRowHeight: 23,
      lineHeight: 6.4,
      verticalPadding: 4,
      afterSpacing: 10,
      tableTitle:
        "Selected Motor Policies",
    },
  });

  // Policy total row
  drawTable({
    columns: [
      {
        label: "Total Premium",
        width: 145,
        bold: true,
      },
      {
        label: "NOP",
        width: 43,
        align: "center",
      },
      {
        label: "OD",
        width: 78,
        align: "right",
      },
      {
        label: "TP",
        width: 78,
        align: "right",
      },
      {
        label: "Net",
        width: 78,
        align: "right",
      },
      {
        label: "Final Commission",
        width: 121,
        align: "right",
        bold: true,
      },
    ],
    rows: [
      [
        "Selected Motor Policies",
        selectedPolicies.length,
        money(totals.od),
        money(totals.tp),
        money(totals.net),
        money(totalPayout),
      ],
    ],
    rowFills: [colors.green],
    options: {
      bodySize: 6.2,
      minRowHeight: 25,
      afterSpacing: 14,
      tableTitle:
        "Selected Motor Policies Total",
    },
  });

  // ----------------------------------------------------------
  // Important notes
  // ----------------------------------------------------------

  drawSectionTitle("Important Notes");

  const importantNotes = [
    "The payout statement is prepared using the policy issue date.",
    "For cancelled policies, the cancellation-created date is used for payout month selection.",
    "Only issued policies are included. Pending policies will be carried forward to the next eligible cycle.",
    "Any premium, commission or policy mismatch may be adjusted in the next payout cycle.",
    "For payout-related clarification, please contact the assigned Relationship Manager.",
    "For long-term Motor policies, Own Damage commission is payable according to the applicable yearly payout cycle.",
    "TDS has been calculated at 2%. The applicable tax rate may be changed according to statutory requirements.",
  ];

  importantNotes.forEach(
    (note, index) => {
      const numberLabel = `${index + 1}.`;
      const noteWidth = FULL_WIDTH - 30;

      const noteLines = wrapText(
        note,
        noteWidth,
        6.4,
        {
          maxLines: 3,
        }
      );

      const noteHeight = Math.max(
        17,
        noteLines.length * 8 + 6
      );

      ensureSpace(noteHeight, {
        continuationTitle:
          "Important Notes",
      });

      drawFilledBox(
        LEFT,
        cursorY,
        FULL_WIDTH,
        noteHeight,
        index % 2 === 1
          ? colors.pale
          : colors.white
      );

      drawText(
        numberLabel,
        LEFT + 7,
        cursorY - 11,
        {
          size: 6.3,
          bold: true,
          color: colors.blue,
        }
      );

      noteLines.forEach(
        (line, lineIndex) => {
          drawText(
            line,
            LEFT + 24,
            cursorY -
              11 -
              lineIndex * 8,
            {
              size: 6.4,
              color: colors.text,
            }
          );
        }
      );

      cursorY -= noteHeight;
    }
  );

  cursorY -= 10;

  // ----------------------------------------------------------
  // Declaration
  // ----------------------------------------------------------

  ensureSpace(62);

  const declarationHeight = 54;

  drawBox(
    LEFT,
    cursorY,
    FULL_WIDTH,
    declarationHeight,
    {
      fill: colors.lightBlue,
      border: colors.softBorder,
    }
  );

  drawText(
    "SYSTEM-GENERATED STATEMENT",
    LEFT + 12,
    cursorY - 17,
    {
      size: 7,
      bold: true,
      color: colors.blue,
    }
  );

  drawWrappedText(
    "This is a system-generated POS commission statement and does not require a physical signature.",
    LEFT + 12,
    cursorY - 23,
    FULL_WIDTH - 24,
    {
      size: 6.2,
      color: colors.muted,
      maxLines: 2,
      lineHeight: 8,
    }
  );

  drawRightText(
    `Generated: ${formatDate(new Date())}`,
    PAGE_WIDTH - RIGHT - 12,
    cursorY - 43,
    {
      size: 5.8,
      color: colors.muted,
    }
  );

  cursorY -= declarationHeight + 10;

  // ==========================================================
  // FINISH PDF
  // ==========================================================

  finishCurrentPage();

  const blob = makePdfBlob(pages);
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  const safePosId = String(
    pos?.pos_code || posId || "POS"
  ).replace(/[^a-zA-Z0-9_-]/g, "_");

  const safeMonth = String(
    month || "statement"
  ).replace(/[^a-zA-Z0-9_-]/g, "_");

  link.href = url;
  link.download =
    `POS_Commission_Statement_${safePosId}_${safeMonth}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}