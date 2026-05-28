import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Policy } from "@/types";

type PolicyState = {
  policy: Policy | null;
  loading: boolean;
};

const initialState: PolicyState = {
  policy: null,
  loading: false
};

const slice = createSlice({
  name: "policy",
  initialState,
  reducers: {
    setLoading: (s, a: PayloadAction<boolean>) => {
      s.loading = a.payload;
    },
    setPolicy: (s, a: PayloadAction<Policy | null>) => {
      s.policy = a.payload;
    }
  }
});

export const policyActions = slice.actions;
export default slice.reducer;
