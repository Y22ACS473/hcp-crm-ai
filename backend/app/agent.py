from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from . import models, schemas
from .config import settings


class RouterOutput(BaseModel):
    action: Literal[
        "log_interaction",
        "edit_interaction",
        "get_interaction_history",
        "suggest_next_action",
        "summarize_interactions",
    ]
    doctor_name: Optional[str] = None
    interaction_id: Optional[int] = None
    patch_json: Optional[dict] = None


class ExtractInteraction(BaseModel):
    doctor_name: str = Field(default="Unknown")
    interaction_type: str = Field(default="visit")
    topic: str = Field(default="")
    intent: str = Field(default="")
    notes: str = Field(default="")
    products_discussed: str = Field(default="")
    follow_up_actions: str = Field(default="")
    interaction_at_iso: Optional[str] = None
    attendees: str = Field(default="")
    topics_discussed: str = Field(default="")
    materials_shared: str = Field(default="")
    samples_distributed: str = Field(default="")
    sentiment: str = Field(default="neutral")
    outcomes: str = Field(default="")


class AgentState(TypedDict):
    user_message: str
    route: Dict[str, Any]
    result: Dict[str, Any]


def _llm() -> ChatGroq:
    return ChatGroq(model=settings.groq_model, api_key=settings.groq_api_key, temperature=0)


def _parse_datetime(dt_raw: Optional[str]) -> datetime:
    if not dt_raw:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(dt_raw.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return datetime.utcnow()


def build_agent(db: Session):
    llm = _llm()

    @tool
    def log_interaction_tool(message: str) -> Dict[str, Any]:
        """Extract interaction entities from free text, summarize, and store in DB."""
        extractor = llm.with_structured_output(ExtractInteraction)
        extracted = extractor.invoke(
            [
                SystemMessage(
                    content=(
                        "Extract HCP interaction details from text. "
                        "Use visit, call, or meeting for interaction_type when implied. "
                        "sentiment must be one of: positive, neutral, negative. "
                        "Keep concise and factual."
                    )
                ),
                HumanMessage(content=message),
            ]
        )
        itype = extracted.interaction_type.lower()
        if itype not in ("visit", "call", "meeting"):
            itype = "visit"
        sent = extracted.sentiment.lower() if extracted.sentiment else "neutral"
        if sent not in ("positive", "neutral", "negative"):
            sent = "neutral"
        topics = extracted.topics_discussed or extracted.topic or ""
        payload = schemas.InteractionCreate(
            doctor_name=extracted.doctor_name,
            interaction_at=_parse_datetime(extracted.interaction_at_iso),
            interaction_type=itype,
            notes=extracted.notes or message,
            products_discussed=extracted.products_discussed,
            follow_up_actions=extracted.follow_up_actions,
            topic=extracted.topic or None,
            intent=extracted.intent or None,
            attendees=extracted.attendees,
            topics_discussed=topics,
            materials_shared=extracted.materials_shared,
            samples_distributed=extracted.samples_distributed,
            sentiment=sent,
            outcomes=extracted.outcomes,
        )
        row = models.Interaction(**payload.model_dump())
        db.add(row)
        db.commit()
        db.refresh(row)
        return {
            "id": row.id,
            "hcp": row.doctor_name,
            "topic": row.topic,
            "type": row.interaction_type,
            "interaction_at": row.interaction_at.isoformat(),
        }

    @tool
    def edit_interaction_tool(interaction_id: int, patch_json: str) -> Dict[str, Any]:
        """Edit an existing interaction by interaction id with patch JSON."""
        row = db.get(models.Interaction, interaction_id)
        if not row:
            return {"error": "Interaction not found"}
        patch = json.loads(patch_json)
        for key, value in patch.items():
            if hasattr(row, key):
                if key == "interaction_at" and isinstance(value, str):
                    value = _parse_datetime(value)
                setattr(row, key, value)
        db.commit()
        db.refresh(row)
        return {"id": row.id, "updated": True}

    @tool
    def get_interaction_history_tool(doctor_name: str) -> Dict[str, Any]:
        """Fetch all past interactions for a doctor/HCP."""
        rows: List[models.Interaction] = (
            db.query(models.Interaction)
            .filter(models.Interaction.doctor_name.ilike(f"%{doctor_name}%"))
            .order_by(models.Interaction.interaction_at.desc())
            .all()
        )
        return {
            "doctor_name": doctor_name,
            "count": len(rows),
            "items": [
                {
                    "id": r.id,
                    "interaction_at": r.interaction_at.isoformat(),
                    "type": r.interaction_type,
                    "topic": r.topic,
                    "notes": r.notes,
                }
                for r in rows
            ],
        }

    @tool
    def suggest_next_action_tool(doctor_name: str) -> Dict[str, Any]:
        """Suggest recommended next action based on interaction history."""
        rows = (
            db.query(models.Interaction)
            .filter(models.Interaction.doctor_name.ilike(f"%{doctor_name}%"))
            .order_by(models.Interaction.interaction_at.desc())
            .limit(5)
            .all()
        )
        context = "\n".join(
            [f"- {r.interaction_at.date()} | {r.topic or 'General'} | {r.notes}" for r in rows]
        )
        completion = llm.invoke(
            [
                SystemMessage(
                    content=(
                        "You are a healthcare CRM assistant. Suggest next field action "
                        "for sales representative in one short paragraph and three bullets."
                    )
                ),
                HumanMessage(content=f"Doctor: {doctor_name}\nRecent interactions:\n{context}"),
            ]
        )
        return {"doctor_name": doctor_name, "suggestion": completion.content}

    @tool
    def summarize_interactions_tool(doctor_name: str) -> Dict[str, Any]:
        """Generate a concise summary report for an HCP."""
        rows = (
            db.query(models.Interaction)
            .filter(models.Interaction.doctor_name.ilike(f"%{doctor_name}%"))
            .order_by(models.Interaction.interaction_at.desc())
            .all()
        )
        context = "\n".join(
            [f"- {r.interaction_at.date()} | {r.interaction_type} | {r.topic or ''} | {r.notes}" for r in rows]
        )
        completion = llm.invoke(
            [
                SystemMessage(content="Summarize the HCP interactions in 5-7 lines."),
                HumanMessage(content=f"Doctor: {doctor_name}\nInteractions:\n{context}"),
            ]
        )
        return {"doctor_name": doctor_name, "summary": completion.content}

    tools = {
        "log_interaction": log_interaction_tool,
        "edit_interaction": edit_interaction_tool,
        "get_interaction_history": get_interaction_history_tool,
        "suggest_next_action": suggest_next_action_tool,
        "summarize_interactions": summarize_interactions_tool,
    }

    router = llm.with_structured_output(RouterOutput)

    def route_node(state: AgentState) -> AgentState:
        route = router.invoke(
            [
                SystemMessage(
                    content=(
                        "Classify user request to one action: log_interaction, edit_interaction, "
                        "get_interaction_history, suggest_next_action, summarize_interactions. "
                        "For edit requests, provide interaction_id if present and patch_json if inferable."
                    )
                ),
                HumanMessage(content=state["user_message"]),
            ]
        )
        return {**state, "route": route.model_dump()}

    def tool_node(state: AgentState) -> AgentState:
        action = state["route"]["action"]
        msg = state["user_message"]
        result: Dict[str, Any]
        if action == "log_interaction":
            result = tools[action].invoke({"message": msg})
        elif action == "edit_interaction":
            interaction_id = state["route"].get("interaction_id") or 0
            patch = state["route"].get("patch_json") or {}
            result = tools[action].invoke(
                {"interaction_id": interaction_id, "patch_json": json.dumps(patch)}
            )
        else:
            doctor_name = state["route"].get("doctor_name") or "Unknown"
            result = tools[action].invoke({"doctor_name": doctor_name})
        return {**state, "result": {"tool_used": action, "result": result}}

    graph = StateGraph(AgentState)
    graph.add_node("route", route_node)
    graph.add_node("tool", tool_node)
    graph.set_entry_point("route")
    graph.add_edge("route", "tool")
    graph.add_edge("tool", END)
    return graph.compile()
