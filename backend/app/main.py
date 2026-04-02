from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from sqlalchemy import text
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .agent import build_agent
from .config import settings
from .database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

if engine.dialect.name == "postgresql":
    _pg_alters = [
        "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS attendees TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS topics_discussed TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS materials_shared TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS samples_distributed TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS sentiment VARCHAR(32) NOT NULL DEFAULT 'neutral'",
        "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS outcomes TEXT NOT NULL DEFAULT ''",
    ]
    with engine.begin() as conn:
        for stmt in _pg_alters:
            conn.execute(text(stmt))

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/log-interaction", response_model=schemas.InteractionOut)
def log_interaction(payload: schemas.InteractionCreate, db: Session = Depends(get_db)):
    return crud.create_interaction(db, payload)


@app.put("/edit-interaction/{interaction_id}", response_model=schemas.InteractionOut)
def edit_interaction(
    interaction_id: int, payload: schemas.InteractionUpdate, db: Session = Depends(get_db)
):
    item = crud.update_interaction(db, interaction_id, payload)
    if not item:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return item


@app.get("/interactions", response_model=list[schemas.InteractionOut])
def get_interactions(doctor_name: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.list_interactions(db, doctor_name)


@app.post("/ai/summarize-transcript", response_model=schemas.TranscriptOut)
def summarize_transcript(payload: schemas.TranscriptIn):
    """Summarize a voice-note transcript into topics text (does not persist)."""
    if not settings.groq_api_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY is not configured")
    llm = ChatGroq(model=settings.groq_model, api_key=settings.groq_api_key, temperature=0)
    out = llm.invoke(
        [
            SystemMessage(
                content=(
                    "Summarize the field rep's voice note into clear bullet points suitable for "
                    "'Topics discussed' in a CRM. Be concise. No preamble."
                )
            ),
            HumanMessage(content=payload.text),
        ]
    )
    return schemas.TranscriptOut(summary=(out.content or "").strip())


@app.post("/agent/chat", response_model=schemas.ChatOutput)
def chat_with_agent(payload: schemas.ChatInput, db: Session = Depends(get_db)):
    try:
        graph = build_agent(db)
        result = graph.invoke({"user_message": payload.message, "route": {}, "result": {}})
        return result["result"]
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Agent failed: {exc!s}. Check GROQ_MODEL is a current model (see Groq deprecations).",
        ) from exc
