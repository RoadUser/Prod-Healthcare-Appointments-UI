import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SnackbarKind = "success" | "error" | "info";

export type SnackbarItem = {
  id: string;
  kind: SnackbarKind;
  title: string;
  message?: string;
};

type SnackbarState = {
  items: SnackbarItem[];
};

const initialState: SnackbarState = {
  items: []
};

const slice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    push: (state, action: PayloadAction<SnackbarItem>) => {
      state.items.unshift(action.payload);
      state.items = state.items.slice(0, 5);
    },
    remove: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    clear: state => {
      state.items = [];
    }
  }
});

export const snackbarActions = slice.actions;
export default slice.reducer;
