import { useEffect, useMemo, useState } from "react";
import { Check, FileBadge, Printer, Save, X } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../components/reusable/ReusableForm";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import ReusableTable from "../../components/reusable/ReusableTable";
import useAuth from "../../hooks/useAuth";
import { ACCESS_ROLES, hasMinimumRole } from "../../config/roleAccess";
import { hrApi } from "./hrApi";

const TYPES = [
  "Offer Letter","Appointment Letter","Confirmation Letter","Increment Letter",
  "Promotion Letter","Transfer Letter","Probation Extension Letter",
  "Experience Certificate","Relieving Letter","Termination Letter",
  "Salary Certificate","Employment Certificate","Warning Letter","Show Cause Notice",
  "Appreciation Letter","Internship Offer","Internship Completion Certificate",
  "Full and Final Settlement","NOC","Other",
];
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { employee_id: "", document_type: "Offer Letter", document_number: "", issue_date: today(), effective_date: "", subject: "", body: "", status: "Draft" };
const formatDate = value => {
  if (!value) return "[Effective Date]";
  const normalized = String(value).slice(0, 10);
  const parsed = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric" }).format(parsed);
};
const templateFor = (type, employee, document) => {
  const name = employee?.name || "[Employee Name]";
  const code = employee?.employee_code || "[Employee Code]";
  const designation = employee?.designation || "[Designation]";
  const department = employee?.department || "[Department]";
  const reportingManager = employee?.reporting_manager_name || "[Reporting Manager]";
  const joiningDate = formatDate(employee?.joining_date);
  const effectiveDate = formatDate(document?.effective_date);
  const salutation = `Dear ${name},\n\n`;
  const signature = "\n\nFor the Company\n\nAuthorized Signatory\nHuman Resources";
  const certificateSignature = "\n\nFor the Company\n\nAuthorized Signatory\nHuman Resources\n[Company Seal]";
  const subjects = {
    "Offer Letter": `Offer of Employment – ${designation}`,
    "Appointment Letter": `Appointment as ${designation}`,
    "Confirmation Letter": "Confirmation of Employment",
    "Increment Letter": "Revision of Compensation",
    "Promotion Letter": `Promotion to ${designation}`,
    "Transfer Letter": `Transfer to ${department}`,
    "Probation Extension Letter": "Extension of Probation Period",
    "Experience Certificate": "Experience Certificate",
    "Relieving Letter": "Relieving from Employment",
    "Termination Letter": "Termination of Employment",
    "Salary Certificate": "Salary Certificate",
    "Employment Certificate": "Employment Certificate",
    "Warning Letter": "Formal Warning",
    "Show Cause Notice": "Show Cause Notice",
    "Appreciation Letter": "Letter of Appreciation",
    "Internship Offer": `Internship Offer – ${department}`,
    "Internship Completion Certificate": "Internship Completion Certificate",
    "Full and Final Settlement": "Full and Final Settlement",
    NOC: "No Objection Certificate",
    Other: "Official HR Communication",
  };
  const templates = {
    "Offer Letter": `${salutation}We are pleased to offer you employment as ${designation} in the ${department} department, subject to the following terms and the policies of the Company:\n\n1. Proposed joining date: ${effectiveDate}\n2. Reporting manager: ${reportingManager}\n3. Work location: [Work Location]\n4. Annual compensation: ₹[Annual CTC]\n5. Probation period: [Number] months\n6. Working hours and weekly offs will follow the assigned shift and Company policy.\n7. This offer is subject to verification of your identity, education, experience and other submitted documents.\n8. You must maintain confidentiality, protect Company information and comply with the code of conduct and applicable policies.\n9. Detailed employment conditions will be stated in your appointment letter.\n\nPlease sign and return a copy of this letter by [Acceptance Date] as confirmation of your acceptance. We look forward to welcoming you to the team.${signature}`,
    "Appointment Letter": `${salutation}With reference to your acceptance of our employment offer, we are pleased to appoint you as ${designation} in the ${department} department with effect from ${effectiveDate}.\n\nEmployee Code: ${code}\nReporting Manager: ${reportingManager}\nWork Location: [Work Location]\nAnnual Compensation: ₹[Annual CTC]\nProbation Period: [Number] months\n\nYour duties will include the responsibilities assigned to your role and any related work reasonably entrusted by the Company. Your employment is governed by the Company's working hours, attendance, leave, confidentiality, information-security, conduct, performance, transfer and separation policies, as amended from time to time.\n\nYou are expected to maintain integrity, professional conduct and confidentiality throughout and after your employment. Either party may end the employment relationship in accordance with the applicable notice period, employment terms and law.\n\nPlease sign and return a copy of this letter as acknowledgement and acceptance of these terms.${signature}`,
    "Confirmation Letter": `${salutation}We are pleased to confirm that you have successfully completed your probation period. Your employment as ${designation} in the ${department} department is confirmed with effect from ${effectiveDate}.\n\nYour performance, conduct and attendance will continue to be governed by Company policies and the terms of your appointment. All other employment terms remain unchanged.\n\nWe appreciate your contribution and look forward to your continued association with the Company.${signature}`,
    "Increment Letter": `${salutation}Based on the review of your performance and contribution, your compensation has been revised with effect from ${effectiveDate}.\n\nCurrent Annual CTC: ₹[Current Annual CTC]\nRevised Annual CTC: ₹[Revised Annual CTC]\nIncrement Percentage: [Increment %]\n\nA detailed compensation structure may be issued separately. Statutory deductions and taxes will apply as required. This revision is confidential, and all other employment terms remain unchanged.\n\nWe appreciate your contribution and look forward to your continued performance.${signature}`,
    "Promotion Letter": `${salutation}We are pleased to confirm your promotion to ${designation} in the ${department} department with effect from ${effectiveDate}.\n\nYou will report to ${reportingManager} and assume the responsibilities, performance expectations and authority applicable to the promoted role. Your revised compensation, if applicable, will be communicated separately.\n\nAll other employment terms remain unchanged. Congratulations on this achievement.${signature}`,
    "Transfer Letter": `${salutation}This letter confirms your transfer to the ${department} department with effect from ${effectiveDate}.\n\nNew Designation: ${designation}\nNew Reporting Manager: ${reportingManager}\nNew Work Location: [Work Location]\n\nPlease complete the required handover and report to the new department on the effective date. Unless separately communicated, your existing compensation and other employment terms remain unchanged.${signature}`,
    "Probation Extension Letter": `${salutation}Following a review of your probation, the Company has decided to extend your probation period until ${effectiveDate}.\n\nThe extension will allow further assessment in the following areas:\n• [Performance Area 1]\n• [Performance Area 2]\n• [Attendance / Conduct, if applicable]\n\nYour reporting manager will communicate the expected improvements and review milestones. Confirmation of employment will remain subject to satisfactory performance during the extended period. All other employment terms remain unchanged.${signature}`,
    "Experience Certificate": `TO WHOM IT MAY CONCERN\n\nThis is to certify that ${name} (Employee Code: ${code}) was employed with the Company as ${designation} in the ${department} department from ${joiningDate} to ${effectiveDate}.\n\nDuring this period, the employee performed the responsibilities assigned to the role. To the best of our records, the employee's conduct was satisfactory.\n\nThis certificate is issued upon the employee's request without any financial or legal obligation on the Company.${certificateSignature}`,
    "Relieving Letter": `${salutation}This is to confirm that your resignation has been accepted and that you are relieved from your duties as ${designation} in the ${department} department with effect from the close of business on ${effectiveDate}.\n\nThis relieving is subject to completion of handover, return of Company property, access closure and applicable clearance requirements. Any remaining dues will be handled through the full and final settlement process.\n\nWe thank you for your contribution and wish you success in your future endeavours.${signature}`,
    "Termination Letter": `${salutation}This letter confirms the termination of your employment as ${designation} with effect from ${effectiveDate}.\n\nReason / Reference: [State the approved reason and relevant communication]\n\nYou must complete the required handover, return all Company property and protect confidential information. Access to Company systems may be withdrawn in accordance with security procedures. Salary and other eligible dues, if any, will be processed according to applicable employment terms, Company policy and law.\n\nPlease contact Human Resources for the clearance and settlement process.${signature}`,
    "Salary Certificate": `TO WHOM IT MAY CONCERN\n\nThis is to certify that ${name} (Employee Code: ${code}) is employed with the Company as ${designation} in the ${department} department from ${joiningDate}.\n\nAs per Company records, the employee's current gross monthly salary is ₹[Gross Monthly Salary] and net monthly salary is approximately ₹[Net Monthly Salary], subject to statutory and other applicable deductions.\n\nThis certificate is issued at the employee's request for [Purpose] and does not create any financial guarantee or liability on the Company.${certificateSignature}`,
    "Employment Certificate": `TO WHOM IT MAY CONCERN\n\nThis is to certify that ${name} (Employee Code: ${code}) is currently employed with the Company as ${designation} in the ${department} department and joined on ${joiningDate}.\n\nAs of the date of issue, the employee's status is active in our records. This certificate is issued upon request for [Purpose].${certificateSignature}`,
    "Warning Letter": `${salutation}This letter serves as a formal warning regarding the following matter:\n\nIncident / Concern: [Describe the incident or performance concern]\nDate(s): [Relevant Date]\nPrevious Discussion / Notice: [Details, if any]\n\nThe above conduct or performance does not meet the standards expected under Company policy. You are required to take the following corrective action by [Correction Deadline]:\n\n1. [Required Action]\n2. [Required Action]\n3. [Required Action]\n\nFailure to demonstrate sustained improvement may result in further disciplinary action in accordance with Company policy and applicable law. Please sign a copy of this letter as acknowledgement of receipt.${signature}`,
    "Show Cause Notice": `${salutation}It has been reported that:\n\n[Describe the allegation, incident, dates and relevant policy]\n\nYou are directed to submit a written explanation, together with any supporting information, within [Number] working days of receiving this notice. Your response will be reviewed before any decision is taken.\n\nIf no response is received within the stated period, the matter may be considered based on the available records and handled in accordance with Company policy and applicable law.${signature}`,
    "Appreciation Letter": `${salutation}We are pleased to recognize and appreciate your contribution toward [Project / Achievement] during [Period].\n\nYour commitment, professionalism and efforts have positively supported your team and the Company. In particular, we acknowledge:\n\n• [Achievement / Contribution]\n• [Achievement / Contribution]\n• [Positive Impact]\n\nThank you for your valuable contribution. We look forward to your continued success.${signature}`,
    "Internship Offer": `${salutation}We are pleased to offer you an internship in the ${department} department on the following terms:\n\nInternship Role: ${designation}\nStart Date: ${effectiveDate}\nEnd Date: [Internship End Date]\nReporting Manager: ${reportingManager}\nWork Location: [Work Location]\nStipend: ₹[Monthly Stipend] / [Unpaid]\n\nThe internship is intended for learning and practical exposure. You must follow Company working hours, conduct, confidentiality, information-security and safety requirements. This offer does not guarantee permanent employment.\n\nPlease sign and return a copy of this letter as acceptance.${signature}`,
    "Internship Completion Certificate": `TO WHOM IT MAY CONCERN\n\nThis is to certify that ${name} successfully completed an internship with the ${department} department from ${joiningDate} to ${effectiveDate} in the role of ${designation}.\n\nDuring the internship, the intern worked on [Project / Responsibilities] and demonstrated satisfactory conduct and participation.\n\nWe wish ${name} success in future endeavours.${certificateSignature}`,
    "Full and Final Settlement": `${salutation}This letter records the full and final settlement of your employment following your last working date of ${effectiveDate}.\n\nSettlement Summary:\nSalary / Wages Payable: ₹[Amount]\nLeave Encashment: ₹[Amount]\nBonus / Incentive: ₹[Amount]\nReimbursements: ₹[Amount]\nNotice Pay Adjustment: ₹[Amount]\nRecoveries / Deductions: ₹[Amount]\nNet Settlement Amount: ₹[Amount]\nPayment Reference: [Reference Number]\n\nThe settlement is subject to clearance, return of Company property, statutory deductions and reconciliation of Company records. Please sign the acknowledgement below after verifying the details.\n\nEmployee Acknowledgement:\nI, ${name}, confirm receipt and acceptance of the settlement stated above, subject to realization of payment.\n\nEmployee Signature: ____________________    Date: ____________________${signature}`,
    NOC: `TO WHOM IT MAY CONCERN\n\nThis is to certify that the Company has no objection to ${name} (Employee Code: ${code}), currently working as ${designation} in the ${department} department, for the following purpose:\n\nPurpose: [State the purpose clearly]\nValidity / Applicable Period: [Period]\n\nThis No Objection Certificate is issued upon the employee's request. It does not create any financial obligation, guarantee or liability on the Company and remains subject to applicable Company policies.${certificateSignature}`,
    Other: `${salutation}This communication is regarding:\n\n[Enter the purpose and complete details of the communication]\n\nRequired Action: [Action, if any]\nCompletion Date: ${effectiveDate}\nContact Person: [Name / Department]\n\nPlease acknowledge receipt of this communication.${signature}`,
  };
  return {
    subject: subjects[type] || subjects.Other,
    body: templates[type] || templates.Other,
  };
};
const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[char]));
const printDocument = row => {
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) return;
  popup.document.write(`<html><head><title>${escapeHtml(row.document_number)}</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:50px auto;color:#1e293b;line-height:1.7}header{border-bottom:2px solid #1e88e5;padding-bottom:18px;margin-bottom:35px}h1{font-size:22px}pre{white-space:pre-wrap;font:inherit}footer{margin-top:60px;border-top:1px solid #cbd5e1;padding-top:18px}</style></head><body><header><h1>${escapeHtml(row.document_type)}</h1><div>${escapeHtml(row.document_number)} · ${escapeHtml(row.issue_date)}</div></header><h2>${escapeHtml(row.subject)}</h2><pre>${escapeHtml(row.body)}</pre><footer>Authorized by Human Resources</footer><script>window.onload=()=>window.print()</script></body></html>`);
  popup.document.close();
};

export default function Documents({ options, refresh }) {
  const { user } = useAuth();
  const canManage = hasMinimumRole(user, ACCESS_ROLES.MANAGER);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ type: "", text: "" });
  const load = () => hrApi.documents().then(setRows).catch((error) => {
    setMessage({ type: "error", text: error.response?.data?.message || "Unable to load HR documents." });
  });
  useEffect(() => { load(); }, []);
  const employee = useMemo(() => (options.employees || []).find(item => String(item.id) === String(form.employee_id)), [options.employees, form.employee_id]);
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const applyTemplate = () => setForm(current => {
    const template = templateFor(current.document_type, employee, current);
    return { ...current, subject: template.subject, body: template.body };
  });
  const submit = async event => {
    event.preventDefault(); setMessage({ type: "", text: "" });
    try {
      await hrApi.createDocument(form); setForm(EMPTY); await load(); refresh();
      setMessage({ type: "success", text: "HR document saved successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save HR document." });
    }
  };
  const updateStatus = async (id, status) => {
    setMessage({ type: "", text: "" });
    try {
      await hrApi.updateDocumentStatus(id, status); await load(); refresh();
      setMessage({ type: "success", text: `Document marked ${status}.` });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to update document." });
    }
  };
  return <div className="space-y-5">
    {canManage && <ReusableForm title="Create Letter or Certificate" icon={FileBadge} onSubmit={submit} showActions={false} gridClassName="sm:grid-cols-2 xl:grid-cols-4">
      <label className={formLabelClass}><span className={formLabelTextClass}>Employee *</span><ReusableSelect name="employee_id" value={form.employee_id} onChange={change} required><option value="">Select employee</option>{(options.employees || []).map(item => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Document Type *</span><ReusableSelect name="document_type" value={form.document_type} onChange={change}>{TYPES.map(type => <option key={type}>{type}</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Issue Date *</span><input name="issue_date" type="date" value={form.issue_date} onChange={change} className={formControlClass} required/></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Effective Date</span><input name="effective_date" type="date" value={form.effective_date} onChange={change} className={formControlClass}/></label>
      <label className={`${formLabelClass} sm:col-span-2`}><span className={formLabelTextClass}>Subject *</span><input name="subject" value={form.subject} onChange={change} className={formControlClass} required/></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Status *</span><ReusableSelect name="status" value={form.status} onChange={change}><option>Draft</option><option>Issued</option></ReusableSelect></label>
      <button type="button" onClick={applyTemplate} className="h-11 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-bold uppercase text-blue-700">Load Document Template</button>
      <label className={`${formLabelClass} sm:col-span-2 xl:col-span-4`}><span className={formLabelTextClass}>Document Body *</span><textarea name="body" value={form.body} onChange={change} rows={10} className={`${formControlClass} h-auto py-4`} required/></label>
      <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-bold uppercase text-white"><Save size={15}/>Save Document</button>
    </ReusableForm>}
    {message.text && <p role={message.type === "error" ? "alert" : "status"} className={`text-xs font-bold ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
    <ReusableTable title="Letters and Certificates Register" rows={rows} columns={[
      { key: "document_number", label: "Document No." }, { key: "employee_name", label: "Employee" },
      { key: "document_type", label: "Document Type" }, { key: "issue_date", label: "Issue Date" },
      { key: "status", label: "Status" }, { key: "action", label: "Actions", render: (_, row) => <div className="flex gap-1">
        <button onClick={() => printDocument(row)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title="Print document"><Printer size={16}/></button>
        {canManage && row.status === "Draft" && <button onClick={() => updateStatus(row.id, "Issued")} className="rounded-lg bg-emerald-50 p-2 text-emerald-600" title="Issue document"><Check size={16}/></button>}
        {canManage && row.status === "Issued" && <button onClick={() => updateStatus(row.id, "Revoked")} className="rounded-lg bg-red-50 p-2 text-red-600" title="Revoke document"><X size={16}/></button>}
      </div> },
    ]} pageSize={20} pageSizeOptions={[20,50,100]} emptyMessage="No HR documents created."/>
  </div>;
}
