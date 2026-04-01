from typing import List, Optional

from sqlalchemy.orm import Session

from . import models, schemas


def create_interaction(db: Session, data: schemas.InteractionCreate) -> models.Interaction:
    interaction = models.Interaction(**data.model_dump())
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


def update_interaction(
    db: Session, interaction_id: int, data: schemas.InteractionUpdate
) -> Optional[models.Interaction]:
    item = db.get(models.Interaction, interaction_id)
    if not item:
        return None
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


def list_interactions(db: Session, doctor_name: Optional[str] = None) -> List[models.Interaction]:
    query = db.query(models.Interaction).order_by(models.Interaction.interaction_at.desc())
    if doctor_name:
        query = query.filter(models.Interaction.doctor_name.ilike(f"%{doctor_name}%"))
    return query.all()
