import { HrModel } from "../../models/human-resources/hr.model.js";
import { successResponse } from "../../utils/response.js";
import { ACCESS_ROLES, hasMinimumRole } from "../../utils/roleAccess.js";

const badRequest = message => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};
const text = value => String(value ?? "").trim();
const positiveId = value => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};
const money = value => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
};
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) ? text(value) : "";
const managerView = user => hasMinimumRole(user, ACCESS_ROLES.MANAGER);

const DOCUMENT_TYPES = [
  "Offer Letter", "Appointment Letter", "Confirmation Letter", "Increment Letter",
  "Promotion Letter", "Transfer Letter", "Probation Extension Letter",
  "Experience Certificate", "Relieving Letter", "Termination Letter",
  "Salary Certificate", "Employment Certificate", "Warning Letter",
  "Show Cause Notice", "Appreciation Letter", "Internship Offer",
  "Internship Completion Certificate", "Full and Final Settlement", "NOC", "Other",
];
const EVENT_TYPES = [
  "Onboarding", "Probation", "Confirmation", "Transfer", "Promotion",
  "Resignation", "Termination", "Relieving", "Retirement", "Other",
];

export default class HrController {
  static async overview(req, res, next) {
    try {
      return successResponse(res, "HR overview retrieved", await HrModel.overview(req.user, managerView(req.user)));
    } catch (error) { next(error); }
  }

  static async options(req, res, next) {
    try {
      return successResponse(res, "HR options retrieved", await HrModel.getOptions(req.user, managerView(req.user)));
    } catch (error) { next(error); }
  }

  static async organization(req, res, next) {
    try {
      return successResponse(res, "Organization hierarchy retrieved", await HrModel.getOrganization());
    } catch (error) { next(error); }
  }

  static async createDepartment(req, res, next) {
    try {
      const name = text(req.body.name);
      if (name.length < 2 || name.length > 100) throw badRequest("Department name must be 2 to 100 characters");
      return successResponse(res, "Department created", await HrModel.createDepartment(name, Number(req.user.id)), 201);
    } catch (error) { next(error); }
  }

  static async createDesignation(req, res, next) {
    try {
      const data = {
        name: text(req.body.name),
        department_id: positiveId(req.body.department_id),
        parent_designation_id: positiveId(req.body.parent_designation_id) || null,
      };
      if (data.name.length < 2 || !data.department_id) throw badRequest("Designation name and department are required");
      return successResponse(res, "Designation created", await HrModel.createDesignation(data, Number(req.user.id)), 201);
    } catch (error) { next(error); }
  }

  static async employees(req, res, next) {
    try {
      return successResponse(res, "Employees retrieved", await HrModel.getEmployees(req.user, managerView(req.user)));
    } catch (error) { next(error); }
  }

  static async createEmployee(req, res, next) {
    try {
      const data = {
        name: text(req.body.name),
        personal_email: text(req.body.personal_email).toLowerCase(),
        mobile: text(req.body.mobile),
        password: String(req.body.password || ""),
        user_type: text(req.body.user_type) || "Employee",
        status: text(req.body.status) || "Active",
        department: positiveId(req.body.department),
        designation: positiveId(req.body.designation),
        joining_date: date(req.body.joining_date),
        reporting_manager: positiveId(req.body.reporting_manager) || null,
        relationship_manager: positiveId(req.body.relationship_manager) || null,
        gender: text(req.body.gender),
        date_of_birth: date(req.body.date_of_birth),
        emergency_contact: text(req.body.emergency_contact),
        current_address: text(req.body.current_address),
        state: text(req.body.state),
        city: text(req.body.city),
        pin_code: text(req.body.pin_code),
      };
      if (data.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personal_email) ||
          !/^\d{10}$/.test(data.mobile) || data.password.length < 8 ||
          !data.department || !data.designation || !data.joining_date ||
          !data.state || !data.city ||
          !["Employee", "Manager"].includes(data.user_type) ||
          !["Active", "Inactive"].includes(data.status) ||
          (data.gender && !["Male", "Female", "Other"].includes(data.gender)) ||
          (data.emergency_contact && !/^\d{10}$/.test(data.emergency_contact)) ||
          (data.pin_code && !/^\d{6}$/.test(data.pin_code))) {
        throw badRequest("Name, email, mobile, password, department, designation, joining date, state and city are required");
      }
      return successResponse(res, "Employee created", await HrModel.createEmployee(data, Number(req.user.id)), 201);
    } catch (error) { next(error); }
  }

  static async employeeStatus(req, res, next) {
    try {
      const status = text(req.body.status);
      if (!["Active", "Inactive"].includes(status)) throw badRequest("Employee status must be Active or Inactive");
      if (Number(req.params.id) === Number(req.user.id) && status === "Inactive") {
        throw badRequest("You cannot deactivate your own account");
      }
      return successResponse(res, "Employee status updated", await HrModel.updateStatus(positiveId(req.params.id), status, req.user));
    } catch (error) { next(error); }
  }

  static async employeeProfile(req, res, next) {
    try {
      return successResponse(res, "Employee profile retrieved", await HrModel.getEmployeeProfile(
        positiveId(req.params.id), req.user, managerView(req.user),
      ));
    } catch (error) { next(error); }
  }

  static async updateEmployeeProfile(req, res, next) {
    try {
      const data = {
        name: text(req.body.name),
        personal_email: text(req.body.personal_email).toLowerCase(),
        mobile: text(req.body.mobile),
        gender: text(req.body.gender),
        date_of_birth: date(req.body.date_of_birth),
        emergency_contact: text(req.body.emergency_contact),
        current_address: text(req.body.current_address),
        state: text(req.body.state),
        city: text(req.body.city),
        pin_code: text(req.body.pin_code),
        department: positiveId(req.body.department),
        designation: positiveId(req.body.designation),
        joining_date: date(req.body.joining_date),
        reporting_manager: positiveId(req.body.reporting_manager) || null,
        relationship_manager: positiveId(req.body.relationship_manager) || null,
      };
      if (data.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personal_email) ||
          !/^\d{10}$/.test(data.mobile) || !data.department || !data.designation ||
          !data.joining_date || (data.gender && !["Male", "Female", "Other"].includes(data.gender)) ||
          (data.emergency_contact && !/^\d{10}$/.test(data.emergency_contact)) ||
          (data.pin_code && !/^\d{6}$/.test(data.pin_code))) {
        throw badRequest("Enter valid employee, contact, department, designation and joining details");
      }
      return successResponse(res, "Employee profile updated", await HrModel.updateEmployeeProfile(
        positiveId(req.params.id), data, req.user,
      ));
    } catch (error) { next(error); }
  }

  static async attendance(req, res, next) {
    try {
      return successResponse(res, "Attendance retrieved", await HrModel.getAttendance(
        req.user, managerView(req.user), req.query.month,
      ));
    } catch (error) { next(error); }
  }

  static async saveAttendance(req, res, next) {
    try {
      const data = {
        employee_id: positiveId(req.body.employee_id),
        attendance_date: date(req.body.attendance_date),
        attendance_status: text(req.body.attendance_status) || "Present",
        check_in: text(req.body.check_in),
        check_out: text(req.body.check_out),
        notes: text(req.body.notes),
      };
      const statuses = ["Present", "Absent", "Half Day", "Leave", "Week Off", "Holiday", "Work From Home"];
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!data.employee_id || !data.attendance_date || !statuses.includes(data.attendance_status) ||
          (data.check_in && !timePattern.test(data.check_in)) ||
          (data.check_out && !timePattern.test(data.check_out)) ||
          Boolean(data.check_in) !== Boolean(data.check_out)) {
        throw badRequest("Employee, attendance date, status, and a complete valid check-in/check-out pair are required");
      }
      return successResponse(res, "Attendance saved", await HrModel.saveAttendance(data, Number(req.user.id), req.user), 201);
    } catch (error) { next(error); }
  }

  static async payouts(req, res, next) {
    try {
      return successResponse(res, "Employee payouts retrieved", await HrModel.getPayouts(
        req.user, managerView(req.user),
      ));
    } catch (error) { next(error); }
  }

  static async createPayout(req, res, next) {
    try {
      const data = {
        employee_id: positiveId(req.body.employee_id),
        payout_month: text(req.body.payout_month),
        payout_type: text(req.body.payout_type),
        amount: money(req.body.amount),
        payout_status: text(req.body.payout_status) || "Draft",
        payout_date: date(req.body.payout_date),
        reference_number: text(req.body.reference_number),
        notes: text(req.body.notes),
      };
      if (!data.employee_id || !/^\d{4}-\d{2}$/.test(data.payout_month) ||
          !["Salary", "Incentive", "Bonus", "Reimbursement", "Settlement", "Other"].includes(data.payout_type) ||
          Number.isNaN(data.amount) || data.amount <= 0 ||
          !["Draft", "Approved", "Paid", "On Hold", "Cancelled"].includes(data.payout_status) ||
          (data.payout_status === "Paid" && !data.payout_date)) {
        throw badRequest("Employee, month, payout type, positive amount and valid payout status are required");
      }
      return successResponse(res, "Employee payout created", await HrModel.createPayout(data, Number(req.user.id), req.user), 201);
    } catch (error) { next(error); }
  }

  static async payoutStatus(req, res, next) {
    try {
      const data = {
        payout_status: text(req.body.payout_status),
        payout_date: date(req.body.payout_date),
        reference_number: text(req.body.reference_number),
        notes: text(req.body.notes),
      };
      if (!["Draft", "Approved", "Paid", "On Hold", "Cancelled"].includes(data.payout_status) ||
          (data.payout_status === "Paid" && !data.payout_date)) {
        throw badRequest("Valid payout status and payment date for a paid payout are required");
      }
      return successResponse(res, "Employee payout status updated", await HrModel.updatePayoutStatus(
        positiveId(req.params.id), data, req.user,
      ));
    } catch (error) { next(error); }
  }

  static async reports(req, res, next) {
    try {
      return successResponse(res, "HR report retrieved", await HrModel.getReports(req.user, req.query.month));
    } catch (error) { next(error); }
  }

  static async workforceSetup(req, res, next) {
    try {
      return successResponse(res, "HR workforce setup retrieved", await HrModel.getWorkforceSetup(req.user));
    } catch (error) { next(error); }
  }

  static async createShift(req, res, next) {
    try {
      const data = {
        shift_name: text(req.body.shift_name),
        start_time: text(req.body.start_time),
        end_time: text(req.body.end_time),
        grace_minutes: Number(req.body.grace_minutes || 0),
        minimum_hours: Number(req.body.minimum_hours || 0),
        working_days: Array.isArray(req.body.working_days)
          ? req.body.working_days.map(text).filter(Boolean).join(",")
          : text(req.body.working_days),
        status: text(req.body.status) || "Active",
      };
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (data.shift_name.length < 2 || !timePattern.test(data.start_time) ||
          !timePattern.test(data.end_time) || !Number.isInteger(data.grace_minutes) ||
          data.grace_minutes < 0 || data.grace_minutes > 180 ||
          !Number.isFinite(data.minimum_hours) || data.minimum_hours <= 0 ||
          data.minimum_hours > 24 || !data.working_days ||
          !["Active", "Inactive"].includes(data.status)) {
        throw badRequest("Enter a valid shift name, times, grace period, minimum hours and working days");
      }
      return successResponse(res, "Shift created", await HrModel.createShift(data, Number(req.user.id)), 201);
    } catch (error) { next(error); }
  }

  static async assignShift(req, res, next) {
    try {
      const data = {
        employee_id: positiveId(req.body.employee_id),
        shift_id: positiveId(req.body.shift_id),
        effective_from: date(req.body.effective_from),
        effective_to: date(req.body.effective_to),
      };
      if (!data.employee_id || !data.shift_id || !data.effective_from ||
          (data.effective_to && data.effective_to < data.effective_from)) {
        throw badRequest("Employee, active shift and a valid effective date range are required");
      }
      return successResponse(res, "Employee shift assigned", await HrModel.assignShift(data, Number(req.user.id), req.user), 201);
    } catch (error) { next(error); }
  }

  static async createHoliday(req, res, next) {
    try {
      const data = {
        holiday_date: date(req.body.holiday_date),
        holiday_name: text(req.body.holiday_name),
        holiday_type: text(req.body.holiday_type) || "Company",
        notes: text(req.body.notes),
      };
      if (!data.holiday_date || data.holiday_name.length < 2 ||
          !["National", "Company", "Optional"].includes(data.holiday_type)) {
        throw badRequest("Holiday date, name and valid holiday type are required");
      }
      return successResponse(res, "Holiday created", await HrModel.createHoliday(data, Number(req.user.id)), 201);
    } catch (error) { next(error); }
  }

  static async performanceReviews(req, res, next) {
    try {
      return successResponse(res, "Performance reviews retrieved", await HrModel.getPerformanceReviews(
        req.user, managerView(req.user),
      ));
    } catch (error) { next(error); }
  }

  static async savePerformanceReview(req, res, next) {
    try {
      const data = {
        employee_id: positiveId(req.body.employee_id),
        review_period: text(req.body.review_period),
        rating: Number(req.body.rating),
        goals: text(req.body.goals),
        achievements: text(req.body.achievements),
        strengths: text(req.body.strengths),
        improvement_areas: text(req.body.improvement_areas),
        reviewer_feedback: text(req.body.reviewer_feedback),
        status: text(req.body.status) || "Draft",
      };
      if (!data.employee_id || !/^\d{4}-\d{2}$/.test(data.review_period) ||
          !Number.isFinite(data.rating) || data.rating < 1 || data.rating > 5 ||
          !["Draft", "Submitted"].includes(data.status)) {
        throw badRequest("Employee, review month, rating from 1 to 5 and valid review status are required");
      }
      return successResponse(res, "Performance review saved", await HrModel.savePerformanceReview(
        data, Number(req.user.id), req.user,
      ), 201);
    } catch (error) { next(error); }
  }

  static async performanceStatus(req, res, next) {
    try {
      const status = text(req.body.status);
      const allowed = managerView(req.user)
        ? ["Draft", "Submitted", "Acknowledged", "Closed"]
        : ["Acknowledged"];
      if (!allowed.includes(status)) throw badRequest("Invalid performance review status");
      return successResponse(res, "Performance review status updated", await HrModel.updatePerformanceStatus(
        positiveId(req.params.id), status, req.user, managerView(req.user),
      ));
    } catch (error) { next(error); }
  }

  static async documents(req, res, next) {
    try {
      return successResponse(res, "HR documents retrieved", await HrModel.getDocuments(req.user, managerView(req.user)));
    } catch (error) { next(error); }
  }

  static async createDocument(req, res, next) {
    try {
      const data = {
        employee_id: positiveId(req.body.employee_id),
        document_type: text(req.body.document_type),
        document_number: text(req.body.document_number),
        issue_date: date(req.body.issue_date),
        effective_date: date(req.body.effective_date),
        subject: text(req.body.subject),
        body: text(req.body.body),
        status: text(req.body.status) || "Draft",
      };
      if (!data.employee_id || !DOCUMENT_TYPES.includes(data.document_type) || !data.issue_date ||
          data.subject.length < 3 || data.body.length < 10 ||
          !["Draft", "Issued"].includes(data.status)) {
        throw badRequest("Employee, valid document type, issue date, subject and document body are required");
      }
      return successResponse(res, "HR document created", await HrModel.createDocument(data, Number(req.user.id), req.user), 201);
    } catch (error) { next(error); }
  }

  static async documentStatus(req, res, next) {
    try {
      const status = text(req.body.status);
      if (!["Draft", "Issued", "Acknowledged", "Revoked"].includes(status)) throw badRequest("Invalid document status");
      return successResponse(res, "Document status updated", await HrModel.updateDocumentStatus(
        positiveId(req.params.id), status, req.user,
      ));
    } catch (error) { next(error); }
  }

  static async payroll(req, res, next) {
    try {
      return successResponse(res, "Payroll retrieved", await HrModel.getPayroll(req.user, managerView(req.user)));
    } catch (error) { next(error); }
  }

  static async savePayroll(req, res, next) {
    try {
      const data = {
        employee_id: positiveId(req.body.employee_id),
        payroll_month: text(req.body.payroll_month),
        basic: money(req.body.basic), hra: money(req.body.hra),
        allowances: money(req.body.allowances), bonus: money(req.body.bonus),
        deductions: money(req.body.deductions), tax: money(req.body.tax),
        payment_status: text(req.body.payment_status) || "Draft",
        payment_date: date(req.body.payment_date),
        notes: text(req.body.notes),
      };
      if (!data.employee_id || !/^\d{4}-\d{2}$/.test(data.payroll_month) ||
          [data.basic, data.hra, data.allowances, data.bonus, data.deductions, data.tax].some(Number.isNaN) ||
          !["Draft", "Processed", "Paid", "On Hold"].includes(data.payment_status) ||
          (data.payment_status === "Paid" && !data.payment_date)) {
        throw badRequest("Employee, payroll month and valid non-negative salary values are required");
      }
      return successResponse(res, "Payroll saved", await HrModel.savePayroll(data, Number(req.user.id), req.user), 201);
    } catch (error) { next(error); }
  }

  static async increments(req, res, next) {
    try {
      return successResponse(res, "Increments retrieved", await HrModel.getIncrements(req.user, managerView(req.user)));
    } catch (error) { next(error); }
  }

  static async createIncrement(req, res, next) {
    try {
      const data = {
        employee_id: positiveId(req.body.employee_id),
        effective_date: date(req.body.effective_date),
        previous_ctc: money(req.body.previous_ctc),
        revised_ctc: money(req.body.revised_ctc),
        reason: text(req.body.reason),
        status: text(req.body.status) || "Proposed",
      };
      if (!data.employee_id || !data.effective_date || Number.isNaN(data.previous_ctc) ||
          Number.isNaN(data.revised_ctc) || data.revised_ctc < data.previous_ctc ||
          !["Proposed", "Approved", "Effective", "Rejected"].includes(data.status)) {
        throw badRequest("Employee, effective date and a revised CTC not below previous CTC are required");
      }
      return successResponse(res, "Increment created", await HrModel.createIncrement(data, Number(req.user.id), req.user), 201);
    } catch (error) { next(error); }
  }

  static async leaves(req, res, next) {
    try {
      return successResponse(res, "Leave requests retrieved", await HrModel.getLeaves(req.user, managerView(req.user)));
    } catch (error) { next(error); }
  }

  static async leaveBalances(req, res, next) {
    try {
      return successResponse(res, "Leave balances retrieved", await HrModel.getLeaveBalances(req.user, managerView(req.user), req.query.year));
    } catch (error) { next(error); }
  }

  static async createLeave(req, res, next) {
    try {
      const data = {
        employee_id: positiveId(req.body.employee_id),
        leave_type_id: positiveId(req.body.leave_type_id),
        from_date: date(req.body.from_date),
        to_date: date(req.body.to_date),
        reason: text(req.body.reason),
      };
      if (!data.leave_type_id || !data.from_date || !data.to_date ||
          data.to_date < data.from_date || data.reason.length < 3) {
        throw badRequest("Leave type, valid date range and reason are required");
      }
      return successResponse(res, "Leave request submitted", await HrModel.createLeave(data, req.user, managerView(req.user)), 201);
    } catch (error) { next(error); }
  }

  static async decideLeave(req, res, next) {
    try {
      const data = { status: text(req.body.status), note: text(req.body.note) };
      if (!["Approved", "Rejected"].includes(data.status)) throw badRequest("Leave decision must be Approved or Rejected");
      return successResponse(res, "Leave request updated", await HrModel.decideLeave(
        positiveId(req.params.id), data, Number(req.user.id), req.user,
      ));
    } catch (error) { next(error); }
  }

  static async cancelLeave(req, res, next) {
    try {
      return successResponse(res, "Leave request cancelled", await HrModel.cancelLeave(
        positiveId(req.params.id), req.user, managerView(req.user),
      ));
    } catch (error) { next(error); }
  }

  static async events(req, res, next) {
    try {
      return successResponse(res, "Employee lifecycle retrieved", await HrModel.getEvents(req.user, managerView(req.user)));
    } catch (error) { next(error); }
  }

  static async createEvent(req, res, next) {
    try {
      const data = {
        employee_id: positiveId(req.body.employee_id),
        event_type: text(req.body.event_type),
        event_date: date(req.body.event_date),
        status: text(req.body.status) || "Planned",
        notes: text(req.body.notes),
        document_id: positiveId(req.body.document_id) || null,
      };
      if (!data.employee_id || !EVENT_TYPES.includes(data.event_type) || !data.event_date ||
          !["Planned", "In Progress", "Completed", "Cancelled"].includes(data.status)) {
        throw badRequest("Employee, lifecycle event, event date and valid status are required");
      }
      return successResponse(res, "Lifecycle event created", await HrModel.createEvent(data, Number(req.user.id), req.user), 201);
    } catch (error) { next(error); }
  }
}
