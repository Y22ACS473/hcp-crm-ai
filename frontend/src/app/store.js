import { configureStore } from "@reduxjs/toolkit";
import interactionsReducer from "../features/interactionsSlice";

export const store = configureStore({
  reducer: {
    interactions: interactionsReducer
  }
});
