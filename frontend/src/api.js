import axios from "axios";

/** Dev: same-origin `/api` via Vite proxy (avoids CORS / wrong-host issues). Prod: set VITE_API_BASE or default to local API. */
const baseURL =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? "/api" : "http://127.0.0.1:8000");

const api = axios.create({
  baseURL
});

export default api;
