# Mini CRM for HCP - Log Interaction Screen

This project implements a mini CRM focused on healthcare professionals (HCPs), with a **Log Interaction** workflow that works in two modes:

1. **Structured Form** for manual entry
2. **AI Chat Interface** powered by **LangGraph + Groq LLM**

## Stack Used

- Frontend: React, Redux Toolkit, Inter font
- Backend: FastAPI (Python)
- AI Agent: LangGraph + Groq (`llama-3.3-70b-versatile` by default; Groq retired `gemma2-9b-it`)
- Database: PostgreSQL

## Architecture

1. User logs interaction from form or chat UI
2. React app sends request to FastAPI
3. FastAPI calls LangGraph agent (`/agent/chat`) for chat requests
4. LangGraph routes request to one of 5 tools
5. Tool executes DB/LLM logic and returns output
6. Response is sent back and interaction list is refreshed

## Required 5 Tools Implemented

1. `log_interaction_tool`
2. `edit_interaction_tool`
3. `get_interaction_history_tool`
4. `suggest_next_action_tool`
5. `summarize_interactions_tool`

## Backend APIs

- `POST /log-interaction`
- `PUT /edit-interaction/{interaction_id}`
- `GET /interactions`
- `POST /agent/chat`
- `POST /ai/summarize-transcript` — summarize a pasted voice-note transcript into “Topics discussed” (does not save a row by itself)

## Run Instructions

### 1) Start PostgreSQL

```bash
docker compose up -d
```

### 2) Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `.env` with your Groq key:

```env
GROQ_API_KEY=your_real_key
```

Run API:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Environment variables (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Required for AI chat |
| `GROQ_MODEL` | Use `llama-3.3-70b-versatile` (Groq retired `gemma2-9b-it`) |
| `DATABASE_URL` | Must match your Postgres user/password (see `docker-compose.yml`) |

Copy from template: `copy .env.example .env` (Windows) or `cp .env.example .env` (Unix).

## Windows PowerShell (everyday run)

1. `docker compose up -d` (project root)  
2. Backend: `cd backend` → `.\.venv\Scripts\activate` → `uvicorn app.main:app --reload --port 8000`  
3. Frontend: `cd frontend` → `npm run dev`  

API docs: `http://localhost:8000/docs` · UI: `http://localhost:5173`

## Troubleshooting

- **HTTP 404 on `http://localhost:5173`:** Something else is often using port 5173, so Vite may be on another port (check the terminal for `Local: http://127.0.0.1:…`). Either use the URL Vite prints, or free 5173 (PowerShell: `Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess` then stop that PID in Task Manager), then run `npm run dev` again from `frontend`. This project uses `strictPort: true` so the dev server will error clearly if 5173 is taken. Alternate port: `npm run dev:5180` from `frontend`.
- **DB connection refused:** Docker Desktop running? `docker compose up -d` and `docker ps`.  
- **Groq / LLM errors:** Fix `GROQ_API_KEY` and `GROQ_MODEL`, restart backend.  
- **Chat or API fails:** Backend must be on port `8000`; frontend URL is whatever Vite prints (default `http://127.0.0.1:5173`).
