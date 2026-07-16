import { loginStart, loginSuccess, loginFailure, logout } from "../slices/authSlice";
import axiosInstance, { setAuthToken } from "../../config/axios";
import toast from "react-hot-toast";

export const loginUser = (credentials, rememberMe) => async (dispatch) => {
  try {
    dispatch(loginStart());
    toast.loading("Authenticating...", { id: "auth" });

    const response = await axiosInstance.post("/auth/login", credentials);

    if (response.data?.success) {
      const { token, user } = response.data.data;
      
      setAuthToken(token);
      dispatch(loginSuccess({ token, user }));
      toast.success(`Welcome back, ${user.name}!`, { id: "auth" });

      if (rememberMe) {
        localStorage.setItem("rememberedIdentifier", credentials.personal_email || credentials.mobile);
      } else {
        localStorage.removeItem("rememberedIdentifier");
      }
      return { success: true };
    } else {
      throw new Error(response.data?.message || "Authentication failed");
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || "Failed to login";
    dispatch(loginFailure(errorMsg));
    toast.error(errorMsg, { id: "auth" });
    return { success: false, error: errorMsg };
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    setAuthToken(null);
    dispatch(logout());
    toast.success("Logged out successfully");
  } catch (err) {
    dispatch(logout());
  }
};