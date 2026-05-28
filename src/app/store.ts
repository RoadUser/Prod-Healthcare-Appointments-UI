import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import snackbarReducer from "@/features/snackbar/snackbarSlice";
import clinicsReducer from "@/features/clinics/clinicsSlice";
import doctorsReducer from "@/features/doctors/doctorsSlice";
import availabilityReducer from "@/features/availability/availabilitySlice";
import appointmentsReducer from "@/features/appointments/appointmentsSlice";
import policyReducer from "@/features/policy/policySlice";
import eventsReducer from "@/features/events/eventsSlice";
import auditReducer from "@/features/audit/auditSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    snackbar: snackbarReducer,
    clinics: clinicsReducer,
    doctors: doctorsReducer,
    availability: availabilityReducer,
    appointments: appointmentsReducer,
    policy: policyReducer,
    events: eventsReducer,
    audit: auditReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
