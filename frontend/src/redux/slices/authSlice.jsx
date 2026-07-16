import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("authToken");
const user = JSON.parse(localStorage.getItem("user") || "null");

const initialState = {
  user: user || null,
  token: token || null,
  loading: false,
  error: null,
  isAuthenticated: !!token,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      const { token, user } = action.payload;
      state.loading = false;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      state.error = null;
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("rememberedIdentifier");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;
export default authSlice.reducer;