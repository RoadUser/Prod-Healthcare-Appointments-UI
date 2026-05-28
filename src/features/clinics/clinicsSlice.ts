import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Clinic } from "@/types";

type ClinicsState = {
  clinics: Clinic[];
  loading: boolean;
};

const initialState: ClinicsState = {
  clinics: [],
  loading: false
};

const slice = createSlice({
  name: "clinics",
  initialState,
  reducers: {
    setLoading: (s, a: PayloadAction<boolean>) => {
      s.loading = a.payload;
    },
    setClinics: (s, a: PayloadAction<Clinic[]>) => {
      s.clinics = a.payload;
    }
  }
});

export const clinicsActions = slice.actions;
export default slice.reducer;
