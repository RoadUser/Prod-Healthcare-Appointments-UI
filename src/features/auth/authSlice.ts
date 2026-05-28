import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SessionRole } from "@/services/contract-service";

export type AuthState = {
  initialized: boolean;
  pubKeyHex: string;
  role: SessionRole;
  doctorId?: string;
};

const initialState: AuthState = {
  initialized: false,
  pubKeyHex: "",
  role: "patient"
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
    setIdentity: (
      state,
      action: PayloadAction<{ pubKeyHex: string; role: SessionRole; doctorId?: string }>
    ) => {
      state.pubKeyHex = action.payload.pubKeyHex;
      state.role = action.payload.role;
      state.doctorId = action.payload.doctorId;
    }
  }
});

export const authActions = slice.actions;
export default slice.reducer;
