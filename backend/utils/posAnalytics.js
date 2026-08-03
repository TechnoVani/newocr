const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const amount = value => Number(value) || 0;
const round = value => Number((Number(value) || 0).toFixed(2));
const asDate = value => {
    if (!value) return null;
    const normalized = String(value).slice(0, 10);
    const date = new Date(`${normalized}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
};
const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const getLob = policy =>
    policy.registration_number || policy.vehicle_category || policy.make_name
        ? "Motor"
        : policy.policy_type || "Other";
const getClassification = policy =>
    policy.commercial_vehicle_type ||
    policy.vehicle_category ||
    policy.sub_type ||
    "Unclassified";
const getExpiryDate = policy => {
    const dates = [asDate(policy.od_expiry), asDate(policy.tp_expiry)].filter(Boolean);
    return dates.length ? new Date(Math.min(...dates.map(date => date.getTime()))) : null;
};

const totalsFor = policies => policies.reduce((totals, policy) => {
    totals.policyCount += 1;
    totals.odPremium += amount(policy.total_od);
    totals.tpPremium += amount(policy.total_tp);
    totals.netPremium += amount(policy.net_premium);
    totals.grossPremium += amount(policy.total_payable);
    return totals;
}, { policyCount: 0, odPremium: 0, tpPremium: 0, netPremium: 0, grossPremium: 0 });

const finalizeAmounts = row => ({
    ...row,
    premium: round(row.premium),
    odPremium: round(row.odPremium),
    tpPremium: round(row.tpPremium),
    netPremium: round(row.netPremium)
});

export const buildPosAnalytics = (policies, now = new Date()) => {
    const today = startOfDay(now);
    const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    const fyStart = new Date(fyStartYear, 3, 1);
    const fyEnd = new Date(fyStartYear + 1, 3, 1);
    const previousFyStart = new Date(fyStartYear - 1, 3, 1);
    const next45Days = new Date(today);
    next45Days.setDate(today.getDate() + 45);

    const withDates = policies.map(policy => ({
        ...policy,
        parsedIssueDate: asDate(policy.issue_date),
        parsedExpiryDate: getExpiryDate(policy)
    }));
    const currentFyPolicies = withDates.filter(policy =>
        policy.parsedIssueDate >= fyStart && policy.parsedIssueDate < fyEnd
    );
    const previousFyPolicies = withDates.filter(policy =>
        policy.parsedIssueDate >= previousFyStart && policy.parsedIssueDate < fyStart
    );

    const businessGroups = new Map();
    const insurerGroups = new Map();
    const motorGroups = new Map();
    const categoryGroups = new Map();

    currentFyPolicies.forEach(policy => {
        const lob = getLob(policy);
        const business = businessGroups.get(lob) || {
            label: lob, policyCount: 0, premium: 0, odPremium: 0, tpPremium: 0, netPremium: 0
        };
        business.policyCount += 1;
        business.premium += amount(policy.net_premium);
        business.odPremium += amount(policy.total_od);
        business.tpPremium += amount(policy.total_tp);
        business.netPremium += amount(policy.net_premium);
        businessGroups.set(lob, business);

        const insurer = policy.insurance_company || "Unknown Insurer";
        const insurerRow = insurerGroups.get(insurer) || { label: insurer, policyCount: 0, premium: 0 };
        insurerRow.policyCount += 1;
        insurerRow.premium += amount(policy.net_premium);
        insurerGroups.set(insurer, insurerRow);

        if (lob === "Motor") {
            const classification = getClassification(policy);
            const motor = motorGroups.get(classification) || {
                label: classification, policyCount: 0, premium: 0, odPremium: 0, tpPremium: 0, netPremium: 0
            };
            motor.policyCount += 1;
            motor.premium += amount(policy.net_premium);
            motor.odPremium += amount(policy.total_od);
            motor.tpPremium += amount(policy.total_tp);
            motor.netPremium += amount(policy.net_premium);
            motorGroups.set(classification, motor);

            const category = policy.vehicle_category || "Unclassified";
            const categoryRow = categoryGroups.get(category) || { label: category, policyCount: 0, premium: 0 };
            categoryRow.policyCount += 1;
            categoryRow.premium += amount(policy.net_premium);
            categoryGroups.set(category, categoryRow);
        }
    });

    const monthlyComparison = MONTHS.map((month, index) => ({
        month,
        currentPolicies: 0,
        currentPremium: 0,
        previousPolicies: 0,
        previousPremium: 0,
        renewals: 0,
        renewalPremium: 0
    }));
    const fyMonthIndex = date => (date.getMonth() + 9) % 12;
    currentFyPolicies.forEach(policy => {
        const row = monthlyComparison[fyMonthIndex(policy.parsedIssueDate)];
        row.currentPolicies += 1;
        row.currentPremium += amount(policy.net_premium);
    });
    previousFyPolicies.forEach(policy => {
        const row = monthlyComparison[fyMonthIndex(policy.parsedIssueDate)];
        row.previousPolicies += 1;
        row.previousPremium += amount(policy.net_premium);
    });
    withDates.forEach(policy => {
        const expiry = policy.parsedExpiryDate;
        if (expiry && expiry >= fyStart && expiry < fyEnd) {
            const row = monthlyComparison[fyMonthIndex(expiry)];
            row.renewals += 1;
            row.renewalPremium += amount(policy.net_premium);
        }
    });

    const currentPolicyNumbers = new Set(
        withDates.map(policy => String(policy.previous_policy || "").trim()).filter(Boolean)
    );
    const upcomingRenewals = withDates
        .filter(policy => policy.parsedExpiryDate >= today && policy.parsedExpiryDate <= next45Days)
        .sort((a, b) => a.parsedExpiryDate - b.parsedExpiryDate)
        .slice(0, 100)
        .map(policy => ({
            ...policy,
            expiry_date: policy.parsedExpiryDate.toISOString().slice(0, 10),
            days_to_expiry: Math.ceil((policy.parsedExpiryDate - today) / 86400000),
            parsedIssueDate: undefined,
            parsedExpiryDate: undefined
        }));
    const expiredPolicies = withDates
        .filter(policy =>
            policy.parsedExpiryDate &&
            policy.parsedExpiryDate < today &&
            !currentPolicyNumbers.has(String(policy.policy_number || "").trim())
        )
        .sort((a, b) => b.parsedExpiryDate - a.parsedExpiryDate)
        .slice(0, 100)
        .map(policy => ({
            ...policy,
            expiry_date: policy.parsedExpiryDate.toISOString().slice(0, 10),
            days_expired: Math.ceil((today - policy.parsedExpiryDate) / 86400000),
            parsedIssueDate: undefined,
            parsedExpiryDate: undefined
        }));

    const currentTotals = totalsFor(currentFyPolicies);
    Object.keys(currentTotals).forEach(key => {
        if (key !== "policyCount") currentTotals[key] = round(currentTotals[key]);
    });
    const businessMix = [...businessGroups.values()].map(finalizeAmounts);
    const policyCount = currentTotals.policyCount || 1;
    businessMix.forEach(row => { row.percent = round(row.policyCount * 100 / policyCount); });

    return {
        period: {
            label: `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`,
            startDate: fyStart.toISOString().slice(0, 10),
            endDate: new Date(fyEnd.getTime() - 86400000).toISOString().slice(0, 10),
            previousLabel: `FY ${fyStartYear - 1}-${String(fyStartYear).slice(-2)}`
        },
        totals: currentTotals,
        businessMix,
        monthlyComparison: monthlyComparison.map(row => ({
            ...row,
            currentPremium: round(row.currentPremium),
            previousPremium: round(row.previousPremium),
            renewalPremium: round(row.renewalPremium)
        })),
        motorBreakdown: [...motorGroups.values()].map(finalizeAmounts).sort((a, b) => b.premium - a.premium),
        motorCategories: [...categoryGroups.values()].map(row => ({ ...row, premium: round(row.premium) })),
        insurerMix: [...insurerGroups.values()]
            .map(row => ({ ...row, premium: round(row.premium) }))
            .sort((a, b) => b.premium - a.premium),
        premiumMix: [
            { label: "OD Premium", value: currentTotals.odPremium },
            { label: "TP Premium", value: currentTotals.tpPremium },
            { label: "Net Premium", value: currentTotals.netPremium }
        ],
        upcomingRenewals,
        expiredPolicies
    };
};
