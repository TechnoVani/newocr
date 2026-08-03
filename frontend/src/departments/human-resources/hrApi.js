import axiosInstance from "../../config/axios";

const data = response => response.data?.data ?? response.data;
const base = "/departments/human-resources/hr";

export const hrApi = {
  overview: async () => data(await axiosInstance.get(`${base}/overview`)),
  options: async () => data(await axiosInstance.get(`${base}/options`)),
  organization: async () => data(await axiosInstance.get(`${base}/organization`)),
  employees: async () => data(await axiosInstance.get(`${base}/employees`)),
  createEmployee: async payload => data(await axiosInstance.post(`${base}/employees`, payload)),
  updateEmployeeStatus: async (id, status) => data(await axiosInstance.patch(`${base}/employees/${id}/status`, { status })),
  employeeProfile: async id => data(await axiosInstance.get(`${base}/employees/${id}/profile`)),
  updateEmployeeProfile: async (id, payload) => data(await axiosInstance.patch(`${base}/employees/${id}/profile`, payload)),
  createDepartment: async payload => data(await axiosInstance.post(`${base}/departments`, payload)),
  createDesignation: async payload => data(await axiosInstance.post(`${base}/designations`, payload)),
  documents: async () => data(await axiosInstance.get(`${base}/documents`)),
  createDocument: async payload => data(await axiosInstance.post(`${base}/documents`, payload)),
  updateDocumentStatus: async (id, status) => data(await axiosInstance.patch(`${base}/documents/${id}/status`, { status })),
  payroll: async () => data(await axiosInstance.get(`${base}/payroll`)),
  savePayroll: async payload => data(await axiosInstance.post(`${base}/payroll`, payload)),
  payouts: async () => data(await axiosInstance.get(`${base}/payouts`)),
  createPayout: async payload => data(await axiosInstance.post(`${base}/payouts`, payload)),
  updatePayoutStatus: async (id, payload) => data(await axiosInstance.patch(`${base}/payouts/${id}/status`, payload)),
  attendance: async month => data(await axiosInstance.get(`${base}/attendance`, { params: month ? { month } : {} })),
  saveAttendance: async payload => data(await axiosInstance.post(`${base}/attendance`, payload)),
  reports: async month => data(await axiosInstance.get(`${base}/reports`, { params: month ? { month } : {} })),
  workforceSetup: async () => data(await axiosInstance.get(`${base}/workforce-setup`)),
  createShift: async payload => data(await axiosInstance.post(`${base}/shifts`, payload)),
  assignShift: async payload => data(await axiosInstance.post(`${base}/shift-assignments`, payload)),
  createHoliday: async payload => data(await axiosInstance.post(`${base}/holidays`, payload)),
  performanceReviews: async () => data(await axiosInstance.get(`${base}/performance-reviews`)),
  savePerformanceReview: async payload => data(await axiosInstance.post(`${base}/performance-reviews`, payload)),
  updatePerformanceStatus: async (id, status) => data(await axiosInstance.patch(`${base}/performance-reviews/${id}/status`, { status })),
  increments: async () => data(await axiosInstance.get(`${base}/increments`)),
  createIncrement: async payload => data(await axiosInstance.post(`${base}/increments`, payload)),
  leaves: async () => data(await axiosInstance.get(`${base}/leaves`)),
  leaveBalances: async year => data(await axiosInstance.get(`${base}/leave-balances`, { params: year ? { year } : {} })),
  createLeave: async payload => data(await axiosInstance.post(`${base}/leaves`, payload)),
  decideLeave: async (id, status, note = "") => data(await axiosInstance.patch(`${base}/leaves/${id}/decision`, { status, note })),
  cancelLeave: async id => data(await axiosInstance.patch(`${base}/leaves/${id}/cancel`)),
  events: async () => data(await axiosInstance.get(`${base}/events`)),
  createEvent: async payload => data(await axiosInstance.post(`${base}/events`, payload)),
};

export default hrApi;
