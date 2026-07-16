import axiosInstance from "../config/axios";

const readList = (response) => {
  const data = response.data?.data ?? response.data;
  if (!Array.isArray(data)) {
    throw new Error(response.data?.message || "Invalid hierarchy API response");
  }
  return data;
};

const getList = async (url) => readList(await axiosInstance.get(url));

export const hierarchyApi = {
  getBqps: () => getList("/bqp"),
  getReportingManagers: (bqpId) => getList(`/reporting/${bqpId}`),
  getRelationshipManagers: (managerId) => getList(`/relationships/${managerId}`),
  getPosps: (relationshipId) => getList(`/posp/${relationshipId}`),
  getReferences: (pospId) => getList(`/references/posp/${pospId}`),
};
