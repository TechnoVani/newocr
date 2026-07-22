import axiosInstance from "../../../config/axios";

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
  getReportingManagers: (bqpId) => getList(`/bqp/${bqpId}`, activeParams),
  getRelationshipManagers: (managerId, bqpId) =>
    getList(`/relationships/${managerId}`, { ...activeParams, bqpId }),
  getPosps: (relationshipId, bqpId, managerId, veri) =>
    getList(`/posp/${relationshipId}`, {
      ...activeParams,
      bqpId,
      managerId,
      ...(veri ? { veri } : {}),
    }),
  getReferences: (pospId) => getList(`/references/posp/${pospId}`),
};
