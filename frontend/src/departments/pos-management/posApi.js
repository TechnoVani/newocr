import axiosInstance from "../../config/axios";

const read = response => response.data?.data ?? response.data;

export const posApi = {
  dashboard: async () => read(await axiosInstance.get("/pos-management/dashboard")),
  analytics: async () => read(await axiosInstance.get("/pos-management/analytics")),
  policies: async () => read(await axiosInstance.get("/pos-management/policies")),
  renewals: async (params = {}) => read(await axiosInstance.get("/pos-management/renewals", { params })),
  reports: async (year, month) => read(await axiosInstance.get("/pos-management/reports", { params: { year, month } })),
  payout: async (year, month) => read(await axiosInstance.get("/pos-management/payout", { params: { year, month } })),
  masters: async insurer => read(await axiosInstance.get("/pos-management/masters", { params: insurer ? { insurer } : {} })),
};
