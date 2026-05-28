import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppointmentSlot } from "@/types";

type AvailabilityState = {
  slots: AppointmentSlot[];
  loading: boolean;
  range: { startUtc: string; endUtc: string } | null;
};

const initialState: AvailabilityState = {
  slots: [],
  loading: false,
  range: null
};

const slice = createSlice({
  name: "availability",
  initialState,
  reducers: {
    setLoading: (s, a: PayloadAction<boolean>) => {
      s.loading = a.payload;
    },
    setSlots: (s, a: PayloadAction<AppointmentSlot[]>) => {
      s.slots = a.payload;
    },
    setRange: (s, a: PayloadAction<{ startUtc: string; endUtc: string } | null>) => {
      s.range = a.payload;
    }
  }
});

export const availabilityActions = slice.actions;
export default slice.reducer;
