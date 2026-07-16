import axiosInstance from "../../config/axios";
import {
  fetchRelationshipStart,
  fetchRelationshipSuccess,
  fetchRelationshipFailure,
} from "../slices/relationshipSlice";

export const fetchRelationshipManagers = (managerId) => async (dispatch) => {
  if (!managerId) return;
  dispatch(fetchRelationshipStart());
  try {
    // Using path parameter as configured in backend
    const response = await axiosInstance.get(`/relationships/${managerId}`);
    const data = response.data?.data ?? response.data ?? [];
    dispatch(fetchRelationshipSuccess({ managerId, data }));
    return data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to load relationship managers";
    dispatch(fetchRelationshipFailure(msg));
    return [];
  }
};
