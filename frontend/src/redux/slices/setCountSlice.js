import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: [],
  total: 0,
  page: 1,
  limit: 10,
  pages: 1,
  loading: false,
  error: null,
  success: false,
  currentRecord: null,
  posIds: [],
  insurers: [],
};

const setCountSlice = createSlice({
  name: "setCount",
  initialState,
  reducers: {
    setCountStart: (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    },
    fetchSetCountSuccess: (state, action) => {
      state.loading = false;
      state.data = action.payload.rows || [];
      state.total = action.payload.total || 0;
      state.page = action.payload.page || 1;
      state.limit = action.payload.limit || 10;
      state.pages = action.payload.pages || 1;
      state.posIds = action.payload.posIds || [];
      state.insurers = action.payload.insurers || [];
    },
    saveSetCountSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.error = null;
      // We'll refetch lists in actions, but update local state just in case
      state.currentRecord = action.payload;
    },
    deleteSetCountSuccess: (state) => {
      state.loading = false;
      state.success = true;
      state.error = null;
    },
    setCountFailure: (state, action) => {
      state.loading = false;
      state.success = false;
      state.error = action.payload;
    },
    clearSetCountErrors: (state) => {
      state.error = null;
      state.success = false;
    },
    resetSetCountState: (state) => {
      return initialState;
    },
  },
});

export const {
  setCountStart,
  fetchSetCountSuccess,
  saveSetCountSuccess,
  deleteSetCountSuccess,
  setCountFailure,
  clearSetCountErrors,
  resetSetCountState,
} = setCountSlice.actions;

export default setCountSlice.reducer;
