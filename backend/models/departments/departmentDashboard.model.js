import db from "../../config/database.js";
import { STATUS_TRANSITIONS } from "./departmentWorkflowConfig.js";
import { departmentWorkScope, employeeVisibilityFilter, hasMinimumRole, ACCESS_ROLES } from "../../utils/roleAccess.js";
import { getPolicyReadScope, policyOwnershipFilter } from "../../utils/dataScope.js";
import { POLICY_REPORT_JOINS, POLICY_REPORT_SELECT } from "../../utils/policyReportQuery.js";

const LABELS = Object.freeze({
  sales: "Sales", "pos-management": "POS Management", operations: "Operations",
  underwriting: "Underwriting", claims: "Claims", "customer-support": "Customer Support",
  renewal: "Renewal", finance: "Finance", accounts: "Accounts",
  "human-resources": "Human Resources (HR)", administration: "Administration",
  "information-technology": "Information Technology (IT)", marketing: "Marketing",
  compliance: "Compliance", legal: "Legal", training: "Training",
  "business-development": "Business Development", audit: "Audit",
  "risk-management": "Risk Management", crm: "CRM (Customer Relationship Management)",
});
const labelFor = (slug) => LABELS[slug] || slug.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const slugForLabel = (label) => Object.entries(LABELS).find(([, value]) => value === label)?.[0] || "";
const displayDate = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const number = (value) => Number(value) || 0;
const cleanText = (value, limit = 255) => String(value || "").trim().slice(0, limit);
const businessRow = (row) => {
  const odIncome = number(row.od_income);
  const tpIncome = number(row.tp_income);
  const netIncome = number(row.net_income);
  return {
    ...row,
    pos_count: number(row.pos_count),
    policy_count: number(row.policy_count),
    cancelled_count: number(row.cancelled_count),
    total_od: number(row.total_od),
    total_tp: number(row.total_tp),
    net_premium: number(row.net_premium),
    gross_premium: number(row.gross_premium),
    od_income: odIncome,
    tp_income: tpIncome,
    net_income: netIncome,
    total_income: odIncome + tpIncome + netIncome,
  };
};
const businessSummary = (rows) => rows.reduce((summary, row) => {
  summary.policy_count += row.policy_count;
  summary.cancelled_count += row.cancelled_count;
  summary.total_od += row.total_od;
  summary.total_tp += row.total_tp;
  summary.net_premium += row.net_premium;
  summary.gross_premium += row.gross_premium;
  summary.od_income += row.od_income;
  summary.tp_income += row.tp_income;
  summary.net_income += row.net_income;
  summary.total_income += row.total_income;
  return summary;
}, {
  policy_count: 0, cancelled_count: 0, total_od: 0, total_tp: 0, net_premium: 0,
  gross_premium: 0, od_income: 0, tp_income: 0, net_income: 0, total_income: 0,
});

const getAdministrationBusinessReports = async (user, requestedMonth = "") => {
  const ownership = policyOwnershipFilter(getPolicyReadScope(user), "p.created_by");
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = String(requestedMonth || currentMonth).trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    const error = new Error("Month must use YYYY-MM format");
    error.statusCode = 400;
    throw error;
  }
  const [year, monthNumber] = month.split("-").map(Number);
  const startDate = `${month}-01`;
  const endDateValue = new Date(Date.UTC(year, monthNumber, 1));
  const endDate = `${endDateValue.getUTCFullYear()}-${String(endDateValue.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const periodWhere = `${ownership.sql} AND p.issue_date >= ? AND p.issue_date < ?`;
  const periodParams = [...ownership.params, startDate, endDate];
  const fiscalStartYear = monthNumber >= 4 ? year : year - 1;
  const fiscalStartDate = `${fiscalStartYear}-04-01`;
  const fiscalEndDate = `${fiscalStartYear + 1}-04-01`;
  const fiscalParams = [...ownership.params, fiscalStartDate, fiscalEndDate];
  const fiscalMonths = Array.from({ length: 12 }, (_, index) => {
    const value = new Date(Date.UTC(fiscalStartYear, 3 + index, 1));
    return {
      key: `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-IN", { month: "long" }).format(value),
    };
  });
  const incomeColumns = `
    COALESCE(SUM(COALESCE(p.total_od, 0) *
      COALESCE(CAST(NULLIF(REPLACE(p.pos_od, '%', ''), '') AS DECIMAL(10,4)), 0) / 100), 0) AS od_income,
    COALESCE(SUM(COALESCE(p.total_tp, 0) *
      COALESCE(CAST(NULLIF(REPLACE(p.pos_tp, '%', ''), '') AS DECIMAL(10,4)), 0) / 100), 0) AS tp_income,
    COALESCE(SUM(COALESCE(p.net_premium, 0) *
      COALESCE(CAST(NULLIF(REPLACE(p.pos_net, '%', ''), '') AS DECIMAL(10,4)), 0) / 100), 0) AS net_income`;
  const [[posRows], [employeeRows], [allPosRows], [posMonthRows]] = await Promise.all([
    db.query(`
      SELECT p.pos_id,
        COALESCE(NULLIF(TRIM(pos.name), ''), 'Unassigned POS') pos_name,
        COALESCE(NULLIF(TRIM(pos.pos_code), ''), CAST(p.pos_id AS CHAR), 'Unassigned') pos_code,
        COALESCE(NULLIF(TRIM(manager.name), ''), 'Unassigned Relationship Manager') relationship_manager,
        COUNT(*) policy_count,
        SUM(CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END) cancelled_count,
        COALESCE(SUM(p.total_od), 0) total_od,
        COALESCE(SUM(p.total_tp), 0) total_tp,
        COALESCE(SUM(p.net_premium), 0) net_premium,
        COALESCE(SUM(p.total_payable), 0) gross_premium,
        ${incomeColumns}
      FROM policies_motor p
      LEFT JOIN employee_pos pos ON pos.id = p.pos_id
      LEFT JOIN employees manager ON manager.id = pos.relationship_manager
      LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
      WHERE ${periodWhere}
      GROUP BY p.pos_id, pos.name, pos.pos_code, manager.name
      ORDER BY net_premium DESC, policy_count DESC, pos_name`, periodParams),
    db.query(`
      SELECT pos.relationship_manager employee_id,
        COALESCE(NULLIF(TRIM(manager.employee_code), ''), 'Unassigned') employee_code,
        COALESCE(NULLIF(TRIM(manager.name), ''), 'Unassigned Relationship Manager') employee_name,
        COUNT(DISTINCT p.pos_id) pos_count,
        COUNT(*) policy_count,
        SUM(CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END) cancelled_count,
        COALESCE(SUM(p.total_od), 0) total_od,
        COALESCE(SUM(p.total_tp), 0) total_tp,
        COALESCE(SUM(p.net_premium), 0) net_premium,
        COALESCE(SUM(p.total_payable), 0) gross_premium,
        ${incomeColumns}
      FROM policies_motor p
      LEFT JOIN employee_pos pos ON pos.id = p.pos_id
      LEFT JOIN employees manager ON manager.id = pos.relationship_manager
      LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
      WHERE ${periodWhere}
      GROUP BY pos.relationship_manager, manager.employee_code, manager.name
      ORDER BY net_premium DESC, policy_count DESC, employee_name`, periodParams),
    db.query(`
      SELECT pos.id pos_id,
        COALESCE(NULLIF(TRIM(pos.name), ''), 'Unnamed POS') pos_name,
        COALESCE(NULLIF(TRIM(pos.pos_code), ''), CAST(pos.id AS CHAR)) pos_code,
        COALESCE(NULLIF(TRIM(pos.mobile), ''), '—') mobile,
        COALESCE(NULLIF(TRIM(pos.email), ''), '—') email,
        COALESCE(NULLIF(TRIM(pos.status), ''), 'Unassigned') pos_status,
        COALESCE(NULLIF(TRIM(manager.name), ''), 'Unassigned Relationship Manager') relationship_manager
      FROM employee_pos pos
      LEFT JOIN employees manager ON manager.id = pos.relationship_manager
      ${ownership.scope.all ? "" : `INNER JOIN policies_motor p ON p.pos_id = pos.id AND ${ownership.sql}`}
      GROUP BY pos.id, pos.name, pos.pos_code, pos.mobile, pos.email, pos.status, manager.name
      ORDER BY pos.name, pos.pos_code`, ownership.scope.all ? [] : ownership.params),
    db.query(`
      SELECT p.pos_id, DATE_FORMAT(p.issue_date, '%Y-%m') month_key,
        COUNT(*) policy_count,
        SUM(CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END) cancelled_count,
        COALESCE(SUM(p.total_od), 0) total_od,
        COALESCE(SUM(p.total_tp), 0) total_tp,
        COALESCE(SUM(p.net_premium), 0) net_premium,
        COALESCE(SUM(p.total_payable), 0) gross_premium,
        ${incomeColumns}
      FROM policies_motor p
      LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
      WHERE ${ownership.sql} AND p.issue_date >= ? AND p.issue_date < ?
        AND p.pos_id IS NOT NULL
      GROUP BY p.pos_id, DATE_FORMAT(p.issue_date, '%Y-%m')
      ORDER BY p.pos_id, month_key`, fiscalParams),
  ]);
  const pos = posRows.map(businessRow);
  const employees = employeeRows.map(businessRow);
  const posMonthMap = new Map(posMonthRows.map((row) => [`${row.pos_id}:${row.month_key}`, businessRow(row)]));
  const allPos = allPosRows.map((row) => {
    const months = Object.fromEntries(
      fiscalMonths.map(({ key }) => [key, posMonthMap.get(`${row.pos_id}:${key}`) || null]),
    );
    const fiscalBusiness = businessSummary(Object.values(months).filter(Boolean));
    return {
      ...row,
      months,
      has_business: fiscalBusiness.policy_count > 0,
      fiscal_policy_count: fiscalBusiness.policy_count,
      fiscal_net_premium: fiscalBusiness.net_premium,
      fiscal_gross_premium: fiscalBusiness.gross_premium,
      fiscal_total_income: fiscalBusiness.total_income,
    };
  }).sort((left, right) =>
    Number(right.has_business) - Number(left.has_business)
    || right.fiscal_net_premium - left.fiscal_net_premium
    || right.fiscal_policy_count - left.fiscal_policy_count
    || left.pos_name.localeCompare(right.pos_name)
  );
  const businessPosCount = allPos.filter((row) => row.has_business).length;
  return {
    period: {
      key: month,
      label: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, monthNumber - 1, 1)),
      fiscal_label: `FY ${fiscalStartYear}-${String(fiscalStartYear + 1).slice(-2)}`,
      months: fiscalMonths,
    },
    summary: {
      ...businessSummary(pos),
      pos_count: pos.length,
      all_pos_count: allPos.length,
      business_pos_count: businessPosCount,
      no_business_pos_count: allPos.length - businessPosCount,
      employee_count: employees.length,
    },
    pos,
    all_pos: allPos,
    employees,
  };
};

class DepartmentDashboardModel {
  static async getDashboard(department, user, filters = {}) {
    const scope = departmentWorkScope(user, "wi");
    if (department === "human-resources") {
      const employeeScope = employeeVisibilityFilter(user, "e.id");
      const [[employeeCounts], [caseCounts], [recent]] = await Promise.all([
        db.query(`SELECT COUNT(*) total,
          SUM(e.status = 'Active') active,
          SUM(e.joining_date >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')) new_joiners,
          SUM(e.status != 'Active' OR e.relieving_date IS NOT NULL) inactive
          FROM employees e WHERE ${employeeScope.sql}`, employeeScope.params),
        db.query(`SELECT SUM(work_type = 'Leave' AND status IN ('Open','Pending')) pending_leave,
          SUM(work_type = 'Exit' AND status NOT IN ('Completed','Rejected')) pending_exit
          FROM department_work_items wi WHERE department_slug = ? AND ${scope.sql}`, [department, ...scope.params]),
        db.query(`SELECT wi.id, wi.title, wi.status, wi.updated_at,
          COALESCE(e.name, 'HR Team') owner
          FROM department_work_items wi LEFT JOIN employees e ON wi.assigned_to = e.id
          WHERE wi.department_slug = ? AND ${scope.sql}
          ORDER BY wi.updated_at DESC LIMIT 8`, [department, ...scope.params]),
      ]);
      return {
        department, label: labelFor(department),
        summary: [
          { label: "Active Employees", value: Number(employeeCounts[0]?.active) || 0, trend: `${Number(employeeCounts[0]?.total) || 0} total` },
          { label: "New Joiners", value: Number(employeeCounts[0]?.new_joiners) || 0, trend: "This Month" },
          { label: "Pending Leave", value: Number(caseCounts[0]?.pending_leave) || 0, trend: "Needs Review" },
          { label: "Exit Cases", value: Number(caseCounts[0]?.pending_exit) || 0, trend: `${Number(employeeCounts[0]?.inactive) || 0} inactive` },
        ],
        recentActivity: recent.map((row) => ({ id: row.id, title: row.title, owner: row.owner, status: row.status })),
      };
    }

    if (department === "renewal") {
      const ownership = policyOwnershipFilter(getPolicyReadScope(user), "p.created_by");
      const expiryDate = "LEAST(COALESCE(p.od_expiry, '9999-12-31'), COALESCE(p.tp_expiry, '9999-12-31'))";
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const currentMonthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
      const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const currentMonthEnd = `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`;
      const [[counts], [recent]] = await Promise.all([
        db.query(`SELECT
          COUNT(DISTINCT CASE
            WHEN ${expiryDate} >= CURRENT_DATE()
              AND ${expiryDate} <= DATE_ADD(CURRENT_DATE(), INTERVAL 45 DAY)
            THEN p.id END) upcoming_count,
          COUNT(DISTINCT CASE
            WHEN ${expiryDate} >= ?
              AND ${expiryDate} < ?
              AND ${expiryDate} < CURRENT_DATE()
              AND NOT EXISTS (
                SELECT 1 FROM policies_motor renewed
                WHERE TRIM(renewed.previous_policy) = TRIM(p.policy_number)
                  AND renewed.issue_date >= ?
                  AND renewed.issue_date < ?
              )
            THEN p.id END) lapsed_count,
          COUNT(DISTINCT CASE WHEN pf.followup_date = CURRENT_DATE() THEN pf.id END) today_followups,
          COUNT(DISTINCT CASE WHEN pf.status = 'Closed' OR pf.disposition = 'Renewed' THEN pf.id END) closed_followups
         FROM department_work_items wi
         INNER JOIN policies_motor p ON wi.policy_id = p.id
         LEFT JOIN policy_followup pf ON pf.policy_id = p.id
         WHERE wi.department_slug = ? AND ${scope.sql} AND ${ownership.sql}`, [
          currentMonthStart,
          currentMonthEnd,
          currentMonthStart,
          currentMonthEnd,
          department,
          ...scope.params,
          ...ownership.params,
        ]),
        db.query(`SELECT DISTINCT CONCAT('policy-', p.id) id,
          CONCAT('Entry · ', p.policy_number) title,
          CASE
            WHEN pc.id IS NOT NULL THEN 'Cancelled'
            ELSE 'Active'
          END status,
          'Normal' priority,
          p.policy_number,
          COALESCE(e.name, 'Renewal Team') owner
         FROM department_work_items wi
         INNER JOIN policies_motor p ON wi.policy_id = p.id
         LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
         LEFT JOIN employees e ON e.id = p.created_by
         WHERE wi.department_slug = ? AND ${scope.sql} AND ${ownership.sql}
         ORDER BY p.created_at DESC, p.id DESC LIMIT 8`, [department, ...scope.params, ...ownership.params]),
      ]);
      const row = counts[0] || {};
      return {
        department, label: labelFor(department),
        summary: [
          { label: "Upcoming Policy", value: Number(row.upcoming_count) || 0, trend: "Next 45 Days" },
          { label: "Lapsed Policy", value: Number(row.lapsed_count) || 0, trend: "Current Month" },
          { label: "Follow-ups Today", value: Number(row.today_followups) || 0, trend: "Today" },
          { label: "Closed Follow-ups", value: Number(row.closed_followups) || 0, trend: "Converted / Closed" },
        ],
        recentActivity: recent,
      };
    }

    const allDepartments = department === "administration";
    const departmentWhere = allDepartments ? "1 = 1" : "wi.department_slug = ?";
    const where = `${departmentWhere} AND ${scope.sql}`;
    const params = [...(allDepartments ? [] : [department]), ...scope.params];
    const [[counts], [recent]] = await Promise.all([
      db.query(`SELECT COUNT(*) total,
        SUM(status = 'Open') open_count,
        SUM(status IN ('In Progress','Pending')) pending_count,
        SUM(status IN ('Approved','Completed')) completed_count,
        SUM(due_date < CURRENT_DATE() AND status NOT IN ('Completed','Rejected')) overdue_count
        FROM department_work_items wi WHERE ${where}`, params),
      db.query(`SELECT wi.id, wi.title, wi.status, wi.priority, wi.policy_number,
        COALESCE(e.name, 'Department Team') owner
        FROM department_work_items wi LEFT JOIN employees e ON wi.assigned_to = e.id
        WHERE ${where} ORDER BY wi.updated_at DESC LIMIT 8`, params),
    ]);
    const row = counts[0] || {};
    const businessReports = allDepartments ? await getAdministrationBusinessReports(user, filters.month) : null;
    return {
      department, label: labelFor(department),
      summary: [
        { label: "Total Work Items", value: Number(row.total) || 0, trend: "All Records" },
        { label: "Open", value: Number(row.open_count) || 0, trend: "New Work" },
        { label: "In Progress", value: Number(row.pending_count) || 0, trend: "Action Required" },
        { label: "Overdue", value: Number(row.overdue_count) || 0, trend: `${Number(row.completed_count) || 0} completed` },
      ],
      recentActivity: recent,
      ...(businessReports ? { businessReports } : {}),
    };
  }

  static async getReports(department, filters = {}, user) {
    const scope = departmentWorkScope(user, "wi");
    const conditions = [];
    const params = [];
    if (department !== "administration") {
      conditions.push("wi.department_slug = ?");
      params.push(department);
    } else if (filters.department && filters.department !== "All") {
      const selectedSlug = slugForLabel(filters.department);
      if (selectedSlug) {
        conditions.push("wi.department_slug = ?");
        params.push(selectedSlug);
      }
    }
    if (department === "administration" && filters.month) {
      const month = String(filters.month).trim();
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        const error = new Error("Month must use YYYY-MM format");
        error.statusCode = 400;
        throw error;
      }
      const [year, monthNumber] = month.split("-").map(Number);
      const endDateValue = new Date(Date.UTC(year, monthNumber, 1));
      conditions.push("wi.created_at >= ? AND wi.created_at < ?");
      params.push(
        `${month}-01`,
        `${endDateValue.getUTCFullYear()}-${String(endDateValue.getUTCMonth() + 1).padStart(2, "0")}-01`,
      );
    }
    if (filters.status && filters.status !== "All") {
      conditions.push("wi.status = ?");
      params.push(filters.status);
    }
    if (filters.product && filters.product !== "All") {
      conditions.push("wi.work_type = ?");
      params.push(filters.product);
    }
    if (filters.priority && filters.priority !== "All") {
      conditions.push("wi.priority = ?");
      params.push(filters.priority);
    }
    if (filters.search) {
      conditions.push("(wi.title LIKE ? OR wi.policy_number LIKE ? OR wi.customer_name LIKE ?)");
      const search = `%${String(filters.search).trim()}%`;
      params.push(search, search, search);
    }
    conditions.push(scope.sql);
    params.push(...scope.params);
    const [rows] = await db.query(
      `SELECT wi.id, wi.department_slug departmentSlug, wi.title name,
        wi.work_type product, wi.status, wi.priority,
        wi.policy_number policyNumber, wi.customer_name subjectName,
        DATE_FORMAT(wi.due_date, '%Y-%m-%d') dueDate,
        DATE_FORMAT(wi.created_at, '%Y-%m-%d') createdAt,
        COALESCE(e.name, 'Unassigned') assignee,
        CASE WHEN wi.due_date < CURRENT_DATE() AND wi.status NOT IN ('Completed','Rejected')
          THEN 'Overdue' ELSE 'On Track' END dueState
       FROM department_work_items wi
       LEFT JOIN employees e ON wi.assigned_to = e.id
       ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
       ORDER BY wi.updated_at DESC LIMIT 1000`,
      params,
    );
    return rows.map((row) => ({
      ...row,
      department: labelFor(row.departmentSlug),
      allowedTransitions: STATUS_TRANSITIONS[row.status] || [],
    }));
  }

  static async getPolicies(department, user) {
    const scope = departmentWorkScope(user, "wi");
    if (department === "human-resources") {
      const employeeScope = employeeVisibilityFilter(user, "e.id");
      const [rows] = await db.query(
        `SELECT e.id, e.employee_code policyNumber, e.name employeeName,
          COALESCE(dsg.designation_name, 'Unassigned') product,
          COALESCE(dep.department_name, 'Unassigned') premium, e.status
         FROM employees e
         LEFT JOIN departments dep ON e.department = dep.id
         LEFT JOIN designations dsg ON e.designation = dsg.id
         WHERE ${employeeScope.sql}
         ORDER BY e.name LIMIT 2000`,
        employeeScope.params,
      );
      return rows;
    }
    const departmentFilter = department === "administration" ? "1 = 1" : "wi.department_slug = ?";
    const departmentParams = department === "administration" ? [] : [department];
    const ownership = policyOwnershipFilter(getPolicyReadScope(user), "p.created_by");
    const [policyRows] = await db.query(
      `SELECT DISTINCT CONCAT('policy-', p.id) id,
        DATE_FORMAT(p.issue_date, '%Y-%m-%d') reportDate,
        p.policy_number policyNumber, p.insured_name insuredName,
        CONCAT_WS(' · ', p.insurance_company, p.policy_type) product,
        p.total_payable premium,
        CASE
          WHEN p.tp_expiry < CURRENT_DATE() THEN 'Expired'
          ELSE 'Active'
        END status,
        DATE_FORMAT(pc.cancellation_date, '%Y-%m-%d') cancellationDate
       FROM department_work_items wi
       INNER JOIN policies_motor p ON wi.policy_id = p.id
       LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
       WHERE ${departmentFilter}
         AND ${scope.sql}
         AND ${ownership.sql}
       ORDER BY p.created_at DESC LIMIT 2000`,
      [...departmentParams, ...scope.params, ...ownership.params],
    );
    const [cancellationRows] = await db.query(
      `SELECT DISTINCT CONCAT('cancelled-', pc.id) id,
        DATE_FORMAT(pc.created_at, '%Y-%m-%d') reportDate,
        p.policy_number policyNumber, p.insured_name insuredName,
        CONCAT_WS(' · ', p.insurance_company, p.policy_type) product,
        -ABS(COALESCE(p.total_payable, 0)) premium,
        'Cancelled' status,
        DATE_FORMAT(pc.cancellation_date, '%Y-%m-%d') cancellationDate
       FROM department_work_items wi
       INNER JOIN policies_motor p ON wi.policy_id = p.id
       INNER JOIN policies_cancelled pc ON pc.policy_id = p.id
       WHERE ${departmentFilter}
         AND ${scope.sql}
         AND ${ownership.sql}
       ORDER BY pc.created_at DESC, pc.id DESC LIMIT 2000`,
      [...departmentParams, ...scope.params, ...ownership.params],
    );
    return [...policyRows, ...cancellationRows].sort((left, right) =>
      new Date(right.reportDate || 0).getTime() - new Date(left.reportDate || 0).getTime()
    );
  }

  static async getRenewals(department, user, filters = {}) {
    const scope = departmentWorkScope(user, "wi");
    if (department === "human-resources") {
      const [rows] = await db.query(
        `SELECT id, CONCAT('HR-', id) policyNumber,
          customer_name employeeName, due_date renewalDate,
          work_type premium, status
         FROM department_work_items wi
         WHERE department_slug = ? AND work_type IN ('Leave','Exit','Joining')
           AND ${scope.sql}
         ORDER BY due_date IS NULL, due_date, updated_at DESC LIMIT 1000`,
        [department, ...scope.params],
      );
      return rows;
    }
    const departmentFilter = department === "administration" ? "1 = 1" : "wi.department_slug = ?";
    const departmentParams = department === "administration" ? [] : [department];
    const ownership = policyOwnershipFilter(getPolicyReadScope(user), "p.created_by");
    const expiryDate = "LEAST(COALESCE(p.od_expiry, '9999-12-31'), COALESCE(p.tp_expiry, '9999-12-31'))";
    const type = String(filters.type || "").trim().toLowerCase();
    const renewalConditions = [];
    const renewalParams = [];
    const pad = (value) => String(value).padStart(2, "0");
    if (department === "renewal" && type === "upcoming") {
      renewalConditions.push(`${expiryDate} >= CURRENT_DATE() AND ${expiryDate} <= DATE_ADD(CURRENT_DATE(), INTERVAL 45 DAY)`);
    }
    if (department === "renewal" && type === "lapsed") {
      const now = new Date();
      const numericYear = Number(filters.year || now.getFullYear());
      const numericMonth = Number(filters.month || now.getMonth() + 1);
      if (!Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2100 ||
        !Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
        const error = new Error("A valid lapsed policy month and year are required");
        error.statusCode = 400;
        throw error;
      }
      const startDate = `${numericYear}-${pad(numericMonth)}-01`;
      const nextYear = numericMonth === 12 ? numericYear + 1 : numericYear;
      const nextMonth = numericMonth === 12 ? 1 : numericMonth + 1;
      const endDate = `${nextYear}-${pad(nextMonth)}-01`;
      renewalConditions.push(`${expiryDate} >= ? AND ${expiryDate} < ? AND ${expiryDate} < CURRENT_DATE()`);
      renewalConditions.push(`NOT EXISTS (
        SELECT 1 FROM policies_motor renewed
        WHERE TRIM(renewed.previous_policy) = TRIM(p.policy_number)
          AND renewed.issue_date >= ?
          AND renewed.issue_date < ?
      )`);
      renewalParams.push(startDate, endDate, startDate, endDate);
    }
    if (filters.insurance_company && filters.insurance_company !== "All") {
      renewalConditions.push("p.insurance_company = ?");
      renewalParams.push(filters.insurance_company);
    }
    const [renewalRows] = await db.query(
      `SELECT DISTINCT CONCAT('policy-renewal-', p.id) id,
        p.id policyId,
        ${POLICY_REPORT_SELECT},
        DATE_FORMAT(LEAST(COALESCE(p.od_expiry, '9999-12-31'), COALESCE(p.tp_expiry, '9999-12-31')), '%Y-%m-%d') reportDate,
        p.policy_number policyNumber, p.insured_name insuredName,
        p.contact contact,
        p.email email,
        CONCAT_WS(' · ', p.insurance_company, p.policy_type) product,
        LEAST(COALESCE(p.od_expiry, '9999-12-31'), COALESCE(p.tp_expiry, '9999-12-31')) renewalDate,
        p.total_payable premium,
        CASE
          WHEN LEAST(COALESCE(p.od_expiry, '9999-12-31'), COALESCE(p.tp_expiry, '9999-12-31')) < CURRENT_DATE() THEN 'Lapsed'
          ELSE 'Upcoming'
        END status,
        latest_followup.followup_date latestFollowupDate,
        latest_followup.next_followup_date nextFollowupDate,
        latest_followup.disposition followupDisposition,
        latest_followup.status followupStatus,
        latest_followup.remarks followupRemarks,
        DATE_FORMAT(pc.cancellation_date, '%Y-%m-%d') cancellationDate
       FROM department_work_items wi INNER JOIN policies_motor p ON wi.policy_id = p.id
       LEFT JOIN policies_cancelled pc ON pc.policy_id = p.id
       ${POLICY_REPORT_JOINS}
       LEFT JOIN (
         SELECT pf.*
         FROM policy_followup pf
         INNER JOIN (
           SELECT policy_id, MAX(id) id
           FROM policy_followup
           GROUP BY policy_id
         ) latest ON latest.id = pf.id
       ) latest_followup ON latest_followup.policy_id = p.id
       WHERE ${departmentFilter}
         AND ${scope.sql}
         AND ${ownership.sql}
         ${renewalConditions.length ? `AND ${renewalConditions.join(" AND ")}` : ""}
       ORDER BY renewalDate LIMIT 1000`,
      [...departmentParams, ...scope.params, ...ownership.params, ...renewalParams],
    );

    const cancellationConditions = [];
    const cancellationParams = [];
    if (filters.insurance_company && filters.insurance_company !== "All") {
      cancellationConditions.push("p.insurance_company = ?");
      cancellationParams.push(filters.insurance_company);
    }
    const [cancellationRows] = await db.query(
      `SELECT DISTINCT CONCAT('cancelled-renewal-', pc.id) id,
        DATE_FORMAT(pc.created_at, '%Y-%m-%d') reportDate,
        p.policy_number policyNumber, p.insured_name insuredName,
        pc.created_at renewalDate,
        -ABS(COALESCE(p.total_payable, 0)) premium,
        'Cancelled' status,
        DATE_FORMAT(pc.cancellation_date, '%Y-%m-%d') cancellationDate
       FROM department_work_items wi
       INNER JOIN policies_motor p ON wi.policy_id = p.id
       INNER JOIN policies_cancelled pc ON pc.policy_id = p.id
       WHERE ${departmentFilter}
         AND ${scope.sql}
         AND ${ownership.sql}
         ${cancellationConditions.length ? `AND ${cancellationConditions.join(" AND ")}` : ""}
       ORDER BY pc.created_at DESC, pc.id DESC LIMIT 1000`,
      [...departmentParams, ...scope.params, ...ownership.params, ...cancellationParams],
    );
    const rows = department === "renewal" && type ? renewalRows : [...renewalRows, ...cancellationRows];
    return rows
      .map((row) => ({
        ...row,
        renewalDate: displayDate(row.renewalDate),
        latestFollowupDate: displayDate(row.latestFollowupDate),
        nextFollowupDate: displayDate(row.nextFollowupDate),
      }))
      .sort((left, right) => new Date(right.reportDate || 0).getTime() - new Date(left.reportDate || 0).getTime());
  }

  static async createPolicyFollowup(department, payload = {}, user) {
    if (department !== "renewal") {
      const error = new Error("Policy follow-up is available only in the renewal department");
      error.statusCode = 404;
      throw error;
    }
    const policyId = Number(payload.policyId || payload.policy_id);
    const policyNumber = cleanText(payload.policyNumber || payload.policy_number, 150);
    const followupDate = cleanText(payload.followupDate || payload.followup_date, 10);
    const nextFollowupDate = cleanText(payload.nextFollowupDate || payload.next_followup_date, 10) || null;
    const contactMode = cleanText(payload.contactMode || payload.contact_mode, 30) || "Call";
    const disposition = cleanText(payload.disposition, 40) || "Contacted";
    const status = cleanText(payload.status, 30) || (nextFollowupDate ? "Scheduled" : "Open");
    const remarks = cleanText(payload.remarks, 1000) || null;
    if ((!Number.isInteger(policyId) || policyId <= 0) && !policyNumber) {
      const error = new Error("Policy is required for follow-up");
      error.statusCode = 400;
      throw error;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(followupDate)) {
      const error = new Error("Follow-up date must use YYYY-MM-DD format");
      error.statusCode = 400;
      throw error;
    }
    if (nextFollowupDate && !/^\d{4}-\d{2}-\d{2}$/.test(nextFollowupDate)) {
      const error = new Error("Next follow-up date must use YYYY-MM-DD format");
      error.statusCode = 400;
      throw error;
    }
    const scope = departmentWorkScope(user, "wi");
    const ownership = policyOwnershipFilter(getPolicyReadScope(user), "p.created_by");
    const lookupWhere = Number.isInteger(policyId) && policyId > 0 ? "p.id = ?" : "p.policy_number = ?";
    const lookupParam = Number.isInteger(policyId) && policyId > 0 ? policyId : policyNumber;
    const [policies] = await db.query(
      `SELECT p.id, p.policy_number, p.insured_name,
        LEAST(COALESCE(p.od_expiry, '9999-12-31'), COALESCE(p.tp_expiry, '9999-12-31')) renewal_date
       FROM policies_motor p
       INNER JOIN department_work_items wi ON wi.policy_id = p.id
       WHERE wi.department_slug = ? AND ${lookupWhere} AND ${scope.sql} AND ${ownership.sql}
       LIMIT 1`,
      [department, lookupParam, ...scope.params, ...ownership.params],
    );
    if (!policies.length) {
      const error = new Error("Policy was not found in the renewal book");
      error.statusCode = 404;
      throw error;
    }
    const policy = policies[0];
    const [result] = await db.query(
      `INSERT INTO policy_followup
       (policy_id, policy_number, insured_name, renewal_date, followup_date, next_followup_date,
        contact_mode, disposition, status, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        policy.id,
        policy.policy_number,
        policy.insured_name || null,
        displayDate(policy.renewal_date) || null,
        followupDate,
        nextFollowupDate,
        contactMode,
        disposition,
        status,
        remarks,
        Number(user.id),
      ],
    );
    return { id: result.insertId, policyId: policy.id, policyNumber: policy.policy_number };
  }

  static async getPolicyFollowups(department, user, filters = {}) {
    if (department !== "renewal") return [];
    const scope = departmentWorkScope(user, "wi");
    const ownership = policyOwnershipFilter(getPolicyReadScope(user), "p.created_by");
    const conditions = ["wi.department_slug = ?", scope.sql, ownership.sql];
    const params = [department, ...scope.params, ...ownership.params];
    if (filters.insurance_company && filters.insurance_company !== "All") {
      conditions.push("p.insurance_company = ?");
      params.push(filters.insurance_company);
    }
    const [rows] = await db.query(
      `SELECT pf.id, pf.policy_id policyId, pf.policy_number policyNumber,
        pf.insured_name insuredName, DATE_FORMAT(pf.renewal_date, '%Y-%m-%d') renewalDate,
        DATE_FORMAT(pf.followup_date, '%Y-%m-%d') followupDate,
        DATE_FORMAT(pf.next_followup_date, '%Y-%m-%d') nextFollowupDate,
        pf.contact_mode contactMode, pf.disposition, pf.status, pf.remarks,
        COALESCE(e.name, 'Renewal Team') createdBy,
        DATE_FORMAT(pf.created_at, '%Y-%m-%d') createdAt
       FROM policy_followup pf
       INNER JOIN department_work_items wi ON wi.policy_id = pf.policy_id
       INNER JOIN policies_motor p ON p.id = pf.policy_id
       LEFT JOIN employees e ON e.id = pf.created_by
       WHERE ${conditions.join(" AND ")}
       ORDER BY pf.created_at DESC, pf.id DESC LIMIT 2000`,
      params,
    );
    return rows;
  }

  static async getMasters(department, user) {
    const scope = departmentWorkScope(user, "wi");
    if (department === "human-resources") {
      if (!hasMinimumRole(user, ACCESS_ROLES.MANAGER)) return [];
      const employeeScope = employeeVisibilityFilter(user, "e.id");
      const [rows] = await db.query(
        `SELECT dep.id, dep.department_name name, COUNT(e.id) count,
          MAX(e.updated_at) updatedAt
         FROM departments dep LEFT JOIN employees e ON e.department = dep.id AND ${employeeScope.sql}
         GROUP BY dep.id, dep.department_name ORDER BY dep.department_name`,
        employeeScope.params,
      );
      return rows.map((row) => ({ ...row, updatedAt: displayDate(row.updatedAt) }));
    }
    if (department === "administration") {
      const [rows] = await db.query(
        `SELECT MIN(id) id, department_slug name, COUNT(*) count, MAX(updated_at) updatedAt
         FROM department_work_items wi WHERE ${scope.sql}
         GROUP BY department_slug ORDER BY department_slug`,
        scope.params,
      );
      return rows.map((row) => ({
        ...row,
        name: labelFor(row.name),
        updatedAt: displayDate(row.updatedAt),
      }));
    }
    const [rows] = await db.query(
      `SELECT MIN(id) id, work_type name, COUNT(*) count, MAX(updated_at) updatedAt
       FROM department_work_items wi WHERE department_slug = ? AND ${scope.sql}
       GROUP BY work_type ORDER BY work_type`,
      [department, ...scope.params],
    );
    return rows.map((row) => ({ ...row, updatedAt: displayDate(row.updatedAt) }));
  }
}

export default DepartmentDashboardModel;
