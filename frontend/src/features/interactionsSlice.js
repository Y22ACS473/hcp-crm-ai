import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

export const defaultDraft = () => ({
  doctor_name: "",
  interaction_at: new Date().toISOString().slice(0, 16),
  interaction_type: "meeting",
  attendees: "",
  topics_discussed: "",
  notes: "",
  products_discussed: "",
  materials_shared: "",
  samples_distributed: "",
  sentiment: "neutral",
  outcomes: "",
  follow_up_actions: "",
  topic: "",
  intent: ""
});

export const fetchInteractions = createAsyncThunk("interactions/fetch", async () => {
  const res = await api.get("/interactions");
  return res.data;
});

export const createInteraction = createAsyncThunk("interactions/create", async (payload) => {
  const res = await api.post("/log-interaction", payload);
  return res.data;
});

export const summarizeTranscript = createAsyncThunk(
  "interactions/summarizeTranscript",
  async (text, { rejectWithValue }) => {
    try {
      const res = await api.post("/ai/summarize-transcript", { text });
      return res.data.summary;
    } catch (err) {
      const detail = err.response?.data?.detail ?? err.message;
      return rejectWithValue(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  }
);

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
  error: null,
  draft: defaultDraft()
};

const slice = createSlice({
  name: "interactions",
  initialState,
  reducers: {
    clearChatResult(state) {
      state.chatResult = null;
    },
    updateDraft(state, action) {
      state.draft = { ...state.draft, ...action.payload };
    },
    setDraftField(state, action) {
      const { name, value } = action.payload;
      state.draft[name] = value;
    },
    resetDraft(state) {
      state.draft = defaultDraft();
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
      .addCase(summarizeTranscript.fulfilled, (state, action) => {
        const summary = action.payload;
        if (summary) {
          state.draft.topics_discussed = state.draft.topics_discussed
            ? `${state.draft.topics_discussed}\n\n${summary}`
            : summary;
        }
      })
      .addCase(runAgentChat.fulfilled, (state, action) => {
        state.chatResult = action.payload;
        const p = action.payload;
        if (p.tool_used === "log_interaction" && p.result && typeof p.result === "object") {
          const r = p.result;
          if (r.hcp) state.draft.doctor_name = r.hcp;
          if (r.topic) {
            state.draft.topics_discussed = state.draft.topics_discussed
              ? `${state.draft.topics_discussed}\n${r.topic}`
              : r.topic;
            state.draft.topic = r.topic;
          }
          if (r.type) {
            const t = String(r.type).toLowerCase();
            if (["visit", "call", "meeting"].includes(t)) state.draft.interaction_type = t;
          }
          if (r.interaction_at) {
            try {
              state.draft.interaction_at = new Date(r.interaction_at).toISOString().slice(0, 16);
            } catch {
              /* ignore */
            }
          }
        }
      })
      .addCase(runAgentChat.rejected, (state, action) => {
        state.chatResult = {
          error: true,
          detail: action.payload || action.error?.message || "Chat request failed"
        };
      });
  }
});

export const { clearChatResult, updateDraft, setDraftField, resetDraft } = slice.actions;
export default slice.reducer;
