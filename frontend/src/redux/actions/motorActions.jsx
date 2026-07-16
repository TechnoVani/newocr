import {
  submitMotorStart,
  submitMotorSuccess,
  submitMotorFailure,
} from "../slices/motorSlice";
import { submitPolicyData } from "../../config/axios";
import toast from "react-hot-toast";

/**
 * Submit a new motor policy with all data (OCR, motor dropdowns, files)
 */
export const submitMotorPolicy = (rawFile, formDataObject, onSuccessCallback) => async (dispatch) => {
  try {
    dispatch(submitMotorStart());
    toast.loading("Uploading policy documents...", { id: "motor-submit" });

    const response = await submitPolicyData(rawFile, formDataObject);

    if (response?.success) {
      dispatch(submitMotorSuccess(response.data));
      toast.success("Policy documents saved successfully!", { id: "motor-submit" });
      if (onSuccessCallback) onSuccessCallback(response.data);
      return { success: true, data: response.data };
    } else {
      throw new Error(response?.message || "Failed to submit policy data");
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || "Failed to submit";
    dispatch(submitMotorFailure(errorMsg));
    toast.error(errorMsg, { id: "motor-submit" });
    return { success: false, error: errorMsg };
  }
};
