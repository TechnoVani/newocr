import axiosInstance from "../config/axios";

const readList = (response) => {
  const data = response.data?.data ?? response.data;
  if (!Array.isArray(data)) {
    throw new Error(response.data?.message || "Invalid hierarchy API response");
  }
  return data;
};

const getList = async (url, params) =>
  readList(await axiosInstance.get(url, { params }));

const activeParams = { status: "Active" };

export const hierarchyApi = {
  getBqp: (status = "Active", isBqp = "Yes") =>
    getList("/bqp", { status, is_bqp: isBqp }),
  getReportingManagers: (bqpId) => getList(`/reporting/${bqpId}`, activeParams),
  getRelationshipManagers: (managerId) => getList(`/relationships/${managerId}`, activeParams),
  getPosps: (relationshipId) => getList(`/posp/${relationshipId}`, activeParams),
  getReferences: (pospId) => getList(`/references/posp/${pospId}`),
};
