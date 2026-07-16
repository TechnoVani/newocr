// redux/slices/reportingSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  byBqpId: {},       // key: bqpId, value: array of reporting managers
  loading: false,
  error: null,
};

const reportingSlice = createSlice({
  name: 'reporting',
  initialState,
  reducers: {
    fetchReportingStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchReportingSuccess: (state, action) => {
      state.loading = false;
      const { bqpId, data } = action.payload;
      state.byBqpId[bqpId] = data;
      state.error = null;
    },
    fetchReportingFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearReporting: (state, action) => {
      const bqpId = action.payload;
      delete state.byBqpId[bqpId];
    },
  },
});

export const {
  fetchReportingStart,
  fetchReportingSuccess,
  fetchReportingFailure,
  clearReporting,
} = reportingSlice.actions;

export default reportingSlice.reducer;