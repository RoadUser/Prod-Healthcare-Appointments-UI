import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Doctor, DoctorDetail } from "@/types";

type DoctorsState = {
  doctors: Doctor[];
  selectedDoctor: DoctorDetail | null;
  loading: boolean;
};

const initialState: DoctorsState = {
  doctors: [],
  selectedDoctor: null,
  loading: false
};

const slice = createSlice({
  name: "doctors",
  initialState,
  reducers: {
    setLoading: (s, a: PayloadAction<boolean>) => {
      s.loading = a.payload;
    },
    setDoctors: (s, a: PayloadAction<Doctor[]>) => {
      s.doctors = a.payload;
    },
    setSelectedDoctor: (s, a: PayloadAction<DoctorDetail | null>) => {
      s.selectedDoctor = a.payload;
    }
  }
});

export const doctorsActions = slice.actions;
export default slice.reducer;
