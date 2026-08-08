import axiosInstance from "../../config/axios";

const readData = (response) => response.data?.data ?? response.data;

export const departmentApi = {
  dashboard: async (department, params = {}) => readData(await axiosInstance.get(`/departments/${department}/dashboard`, { params })),
  schema: async (department) => readData(await axiosInstance.get(`/departments/${department}/schema`)),
  createEntry: async (department, payload) => readData(await axiosInstance.post(`/departments/${department}/entries`, payload)),
  updateEntryStatus: async (department, id, status, note = "") => readData(await axiosInstance.patch(`/departments/${department}/entries/${id}/status`, { status, note })),
  entryHistory: async (department, id) => readData(await axiosInstance.get(`/departments/${department}/entries/${id}/history`)),
  policies: async (department) => readData(await axiosInstance.get(`/departments/${department}/policies`)),
  renewals: async (department, params = {}) => readData(await axiosInstance.get(`/departments/${department}/renewals`, { params })),
  followups: async (department, params = {}) => readData(await axiosInstance.get(`/departments/${department}/followups`, { params })),
  createFollowup: async (department, payload) => readData(await axiosInstance.post(`/departments/${department}/followups`, payload)),
  reports: async (department, params = {}) => readData(await axiosInstance.get(`/departments/${department}/reports`, { params })),
  masters: async (department) => readData(await axiosInstance.get(`/departments/${department}/masters`)),
  hrEmployees: async () => readData(await axiosInstance.get("/departments/human-resources/policies")),
  hrOptions: async () => readData(await axiosInstance.get("/departments/human-resources/hr-options")),
  createEmployee: async (payload) => readData(await axiosInstance.post("/departments/human-resources/employees", payload)),
  updateEmployeeStatus: async (id, status) => readData(await axiosInstance.patch(`/departments/human-resources/employees/${id}/status`, { status })),
};
