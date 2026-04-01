import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

export const fetchInteractions = createAsyncThunk("interactions/fetch", async () => {
  const res = await api.get("/interactions");
  return res.data;
});

export const createInteraction = createAsyncThunk("interactions/create", async (payload) => {
  const res = await api.post("/log-interaction", payload);
  return res.data;
});

export const runAgentChat = createAsyncThunk(
  "interactions/chat",
  async (message, { rejectWithValue }) => {
    try {
      const res = await api.post("/agent/chat", { message });
      return res.data;
    } catch (err) {
      const detail = err.response?.data?.detail ?? err.message;
      return rejectWithValue(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  chatResult: null,
  error: null
};

const slice = createSlice({
  name: "interactions",
  initialState,
  reducers: {
    clearChatResult(state) {
      state.chatResult = null;
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchInteractions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(runAgentChat.fulfilled, (state, action) => {
        state.chatResult = action.payload;
      })
      .addCase(runAgentChat.rejected, (state, action) => {
        state.chatResult = {
          error: true,
          detail: action.payload || action.error?.message || "Chat request failed"
        };
      });
  }
});

export const { clearChatResult } = slice.actions;
export default slice.reducer;
