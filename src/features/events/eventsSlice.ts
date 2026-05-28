import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type EventItem = {
  id: string;
  type: string;
  ts: string;
  data: unknown;
};

type EventsState = {
  items: EventItem[];
};

const initialState: EventsState = {
  items: []
};

const slice = createSlice({
  name: "events",
  initialState,
  reducers: {
    pushEvent: (s, a: PayloadAction<EventItem>) => {
      s.items.unshift(a.payload);
      s.items = s.items.slice(0, 50);
    },
    clear: s => {
      s.items = [];
    }
  }
});

export const eventsActions = slice.actions;
export default slice.reducer;
