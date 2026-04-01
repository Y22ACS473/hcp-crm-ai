from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class InteractionBase(BaseModel):
    doctor_name: str
    interaction_at: datetime
    interaction_type: str = Field(description="visit/call")
    notes: str = ""
    products_discussed: str = ""
    follow_up_actions: str = ""
    topic: Optional[str] = None
    intent: Optional[str] = None


class InteractionCreate(InteractionBase):
    pass


class InteractionUpdate(BaseModel):
    doctor_name: Optional[str] = None
    interaction_at: Optional[datetime] = None
    interaction_type: Optional[str] = None
    notes: Optional[str] = None
    products_discussed: Optional[str] = None
    follow_up_actions: Optional[str] = None
    topic: Optional[str] = None
    intent: Optional[str] = None


class InteractionOut(InteractionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChatInput(BaseModel):
    message: str


class ChatOutput(BaseModel):
    tool_used: str
    result: dict
