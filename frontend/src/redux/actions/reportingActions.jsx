import axiosInstance from '../../config/axios';
import {
  fetchReportingStart,
  fetchReportingSuccess,
  fetchReportingFailure,
} from '../slices/reportingSlice';

export const fetchReportingManagers = (bqpId) => async (dispatch) => {
  if (!bqpId) return;
  dispatch(fetchReportingStart());
  try {
    // Use path parameter: /reporting/{bqpId}
    const response = await axiosInstance.get(`/reporting/${bqpId}`);
    const data = response.data?.data ?? response.data ?? [];
    dispatch(fetchReportingSuccess({ bqpId, data }));
    return data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'Failed to load reporting managers';
    dispatch(fetchReportingFailure(msg));
    return [];
  }
};
