from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .agent import build_agent
from .config import settings
from .database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
