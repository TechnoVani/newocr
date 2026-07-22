import axiosInstance from "../../config/axios";

const readData = (response) => response.data?.data ?? response.data;

export const departmentApi = {
  dashboard: async (department) => readData(await axiosInstance.get(`/departments/${department}/dashboard`)),
  schema: async (department) => readData(await axiosInstance.get(`/departments/${department}/schema`)),
  createEntry: async (department, payload) => readData(await axiosInstance.post(`/departments/${department}/entries`, payload)),
  policies: async (department) => readData(await axiosInstance.get(`/departments/${department}/policies`)),
  renewals: async (department) => readData(await axiosInstance.get(`/departments/${department}/renewals`)),
  reports: async (department, params = {}) => readData(await axiosInstance.get(`/departments/${department}/reports`, { params })),
  masters: async (department) => readData(await axiosInstance.get(`/departments/${department}/masters`)),
};
