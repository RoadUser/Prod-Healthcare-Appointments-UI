import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AuditLogItem = {
  id: string;
  actorRole: string;
  actorId: string;
  action: string;
  targetId?: string | null;
  timestampUtc: string;
  metadata?: unknown;
};

type AuditState = {
  items: AuditLogItem[];
  loading: boolean;
  supportedByContract: boolean;
};

const initialState: AuditState = {
  items: [],
  loading: false,
  supportedByContract: false
};

const slice = createSlice({
  name: "audit",
  initialState,
  reducers: {
    setLoading: (s, a: PayloadAction<boolean>) => {
      s.loading = a.payload;
    },
    setItems: (s, a: PayloadAction<AuditLogItem[]>) => {
      s.items = a.payload;
    },
    setSupported: (s, a: PayloadAction<boolean>) => {
      s.supportedByContract = a.payload;
    }
  }
});

export const auditActions = slice.actions;
export default slice.reducer;
