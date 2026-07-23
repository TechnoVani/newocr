import axiosInstance from "../../config/axios";

const readData = (response) => response.data?.data ?? response.data;

export const accountsApi = {
  companies: async () => readData(await axiosInstance.get("/accounts/companies")),
  branches: async () => readData(await axiosInstance.get("/accounts/branches")),
  createCompany: async (payload) => readData(await axiosInstance.post("/accounts/companies", payload)),
  updateCompany: async (id, payload) => readData(await axiosInstance.put(`/accounts/companies/${id}`, payload)),
  updateCompanyStatus: async (id, status) => readData(await axiosInstance.patch(`/accounts/companies/${id}/status`, { status })),
  createBranch: async (payload) => readData(await axiosInstance.post("/accounts/branches", payload)),
  updateBranch: async (id, payload) => readData(await axiosInstance.put(`/accounts/branches/${id}`, payload)),
  updateBranchStatus: async (id, status) => readData(await axiosInstance.patch(`/accounts/branches/${id}/status`, { status })),
  monthlyPolicies: async (params) => readData(await axiosInstance.get("/policies/report/monthly", { params })),
};
