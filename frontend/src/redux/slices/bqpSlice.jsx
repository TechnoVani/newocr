import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: [],
  loading: false,
  error: null,
};

const bqpSlice = createSlice({
  name: "bqp",
  initialState,
  reducers: {
    bqpStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    bqpSuccess: (state, action) => {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },
    bqpFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.data = [];
    },
  },
});

export const { bqpStart, bqpSuccess, bqpFailure } = bqpSlice.actions;
export default bqpSlice.reducer;