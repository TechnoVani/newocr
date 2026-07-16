import axiosInstance from "../../config/axios";
import {
  fetchPospStart,
  fetchPospSuccess,
  fetchPospFailure,
} from "../slices/posSlice";

export const fetchPospByRelationshipManager = (relationshipId) => async (dispatch) => {
  if (!relationshipId) return;
  dispatch(fetchPospStart());
  try {
    // Path parameter: /posp/{relationshipId}
    const response = await axiosInstance.get(`/posp/${relationshipId}`);
    const data = response.data?.data ?? response.data ?? [];
    dispatch(fetchPospSuccess({ relationshipId, data }));
    return data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to load POSP data";
    dispatch(fetchPospFailure(msg));
    return [];
  }
};
