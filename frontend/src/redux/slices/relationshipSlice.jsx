import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  byManagerId: {},   // key: managerId (string), value: array
  loading: false,
  error: null,
};

const relationshipSlice = createSlice({
  name: "relationship",
  initialState,
  reducers: {
    fetchRelationshipStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchRelationshipSuccess: (state, action) => {
      state.loading = false;
      const { managerId, data } = action.payload;
      state.byManagerId[managerId] = data;
      state.error = null;
    },
    fetchRelationshipFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearRelationship: (state, action) => {
      const managerId = action.payload;
      delete state.byManagerId[managerId];
    },
  },
});

export const {
  fetchRelationshipStart,
  fetchRelationshipSuccess,
  fetchRelationshipFailure,
  clearRelationship,
} = relationshipSlice.actions;

export default relationshipSlice.reducer;