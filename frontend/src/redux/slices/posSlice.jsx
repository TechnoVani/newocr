import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  byRelationshipId: {},  // key: relationshipId (string), value: array of POSP
  loading: false,
  error: null,
};

const posSlice = createSlice({
  name: "pos",
  initialState,
  reducers: {
    fetchPospStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPospSuccess: (state, action) => {
      state.loading = false;
      const { relationshipId, data } = action.payload;
      state.byRelationshipId[relationshipId] = data;
      state.error = null;
    },
    fetchPospFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearPosp: (state, action) => {
      const relationshipId = action.payload;
      delete state.byRelationshipId[relationshipId];
    },
  },
});

export const {
  fetchPospStart,
  fetchPospSuccess,
  fetchPospFailure,
  clearPosp,
} = posSlice.actions;

export default posSlice.reducer;