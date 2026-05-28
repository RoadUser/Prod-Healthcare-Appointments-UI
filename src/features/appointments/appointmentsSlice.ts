import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Appointment } from "@/types";

type AppointmentsState = {
  items: Appointment[];
  loading: boolean;
};

const initialState: AppointmentsState = {
  items: [],
  loading: false
};

const slice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    setLoading: (s, a: PayloadAction<boolean>) => {
      s.loading = a.payload;
    },
    setAppointments: (s, a: PayloadAction<Appointment[]>) => {
      s.items = a.payload;
    }
  }
});

export const appointmentsActions = slice.actions;
export default slice.reducer;
