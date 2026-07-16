import axios from "../../config/axios";
import { bqpStart, bqpSuccess, bqpFailure } from "../slices/bqpSlice";

export const fetchBqp = () => async (dispatch, getState) => {
  dispatch(bqpStart());
  try {
    const { token } = getState().auth;
    const response = await axios.get("/bqp", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.success) {
      dispatch(bqpSuccess(response.data.data));
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch BQPs");
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Something went wrong";
    dispatch(bqpFailure(errorMessage));
    return [];
  }
};
