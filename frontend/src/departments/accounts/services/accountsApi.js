import axiosInstance from "../../../config/axios";

const readData = (response) => response.data?.data ?? response.data;

export const accountsApi = {
  dashboard: async () => readData(await axiosInstance.get("/accounts/dashboard")),
  posWiseReport: async (params = {}) => readData(await axiosInstance.get("/accounts/reports/pos-wise", { params })),
  posWisePolicies: async (posId, params = {}) => readData(await axiosInstance.get(`/accounts/reports/pos-wise/${posId}/policies`, { params })),
  cancelledPolicies: async (params = {}) => readData(await axiosInstance.get("/accounts/reports/cancelled-policies", { params })),
  saveCancelledPolicy: async (payload) => readData(await axiosInstance.post("/accounts/reports/cancelled-policies", payload)),
  companies: async () => readData(await axiosInstance.get("/accounts/companies")),
  branches: async () => readData(await axiosInstance.get("/accounts/branches")),
  createCompany: async (payload) => readData(await axiosInstance.post("/accounts/companies", payload)),
  updateCompany: async (id, payload) => readData(await axiosInstance.put(`/accounts/companies/${id}`, payload)),
  updateCompanyStatus: async (id, status) => readData(await axiosInstance.patch(`/accounts/companies/${id}/status`, { status })),
  createBranch: async (payload) => readData(await axiosInstance.post("/accounts/branches", payload)),
  updateBranch: async (id, payload) => readData(await axiosInstance.put(`/accounts/branches/${id}`, payload)),
  updateBranchStatus: async (id, status) => readData(await axiosInstance.patch(`/accounts/branches/${id}/status`, { status })),
  monthlyPolicies: async (params) => readData(await axiosInstance.get("/policies/report/monthly", { params })),
  reconciliationReport: async (params) => readData(await axiosInstance.get("/accounts/reconciliation", { params })),
  importReconciliation: async (payload) => readData(await axiosInstance.post("/accounts/reconciliation/import", payload)),
  payoutGridReport: async (params = {}) => readData(await axiosInstance.get("/accounts/payout-grid", { params })),
  payoutGridBatches: async () => readData(await axiosInstance.get("/accounts/payout-grid/batches")),
  importPayoutGrid: async (payload) => readData(await axiosInstance.post("/accounts/payout-grid/import", payload)),
};
