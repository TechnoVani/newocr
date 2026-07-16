import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  error: null,
  success: false,
  data: null,
  lastSubmittedAt: null,
};

const motorSlice = createSlice({
  name: "motor",
  initialState,
  reducers: {
    submitMotorStart: (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    },
    submitMotorSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.error = null;
      state.data = action.payload;
      state.lastSubmittedAt = new Date().toISOString();
    },
    submitMotorFailure: (state, action) => {
      state.loading = false;
      state.success = false;
      state.error = action.payload;
    },
    resetMotorState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
      state.lastSubmittedAt = null;
    },
  },
});

export const {
  submitMotorStart,
  submitMotorSuccess,
  submitMotorFailure,
  resetMotorState,
} = motorSlice.actions;

export default motorSlice.reducer;
