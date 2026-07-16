import axiosInstance from "../../config/axios";
import {
  setCountStart,
  fetchSetCountSuccess,
  saveSetCountSuccess,
  deleteSetCountSuccess,
  setCountFailure,
} from "../slices/setCountSlice";

/**
 * Fetch Set Count list with optional filters
 */
export const fetchSetCounts = (params = {}) => async (dispatch) => {
  dispatch(setCountStart());
  try {
    const response = await axiosInstance.get("/setcount", { params });
    if (response.data.success) {
      dispatch(fetchSetCountSuccess(response.data.data));
      return { success: true, data: response.data.data };
    } else {
      throw new Error(response.data.message || "Failed to fetch Set Count records");
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || "Something went wrong";
    dispatch(setCountFailure(errorMsg));
    return { success: false, error: errorMsg };
  }
};

/**
 * Create a new Set Count record
 */
export const createSetCount = (formData, onSuccess) => async (dispatch) => {
  dispatch(setCountStart());
  try {
    const response = await axiosInstance.post("/setcount", formData);
    if (response.data.success) {
      dispatch(saveSetCountSuccess(response.data.data));
      if (onSuccess) onSuccess(response.data.data);
      return { success: true, data: response.data.data };
    } else {
      throw new Error(response.data.message || "Failed to save record");
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || "Failed to save record";
    dispatch(setCountFailure(errorMsg));
    return { success: false, error: errorMsg };
  }
};

/**
 * Update an existing Set Count record
 */
export const updateSetCount = (id, formData, onSuccess) => async (dispatch) => {
  dispatch(setCountStart());
  try {
    const response = await axiosInstance.put(`/setcount/${id}`, formData);
    if (response.data.success) {
      dispatch(saveSetCountSuccess(response.data.data));
      if (onSuccess) onSuccess(response.data.data);
      return { success: true, data: response.data.data };
    } else {
      throw new Error(response.data.message || "Failed to update record");
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || "Failed to update record";
    dispatch(setCountFailure(errorMsg));
    return { success: false, error: errorMsg };
  }
};

/**
 * Delete a Set Count record
 */
export const deleteSetCount = (id, onSuccess) => async (dispatch) => {
  dispatch(setCountStart());
  try {
    const response = await axiosInstance.delete(`/setcount/${id}`);
    if (response.data.success) {
      dispatch(deleteSetCountSuccess());
      if (onSuccess) onSuccess();
      return { success: true };
    } else {
      throw new Error(response.data.message || "Failed to delete record");
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || "Failed to delete record";
    dispatch(setCountFailure(errorMsg));
    return { success: false, error: errorMsg };
  }
};
