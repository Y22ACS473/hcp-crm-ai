from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from .database import Base


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    doctor_name = Column(String(255), nullable=False, index=True)
    interaction_at = Column(DateTime, nullable=False)
    interaction_type = Column(String(50), nullable=False)
    notes = Column(Text, nullable=False, default="")
    products_discussed = Column(Text, nullable=False, default="")
    follow_up_actions = Column(Text, nullable=False, default="")
    topic = Column(String(255), nullable=True)
    intent = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
