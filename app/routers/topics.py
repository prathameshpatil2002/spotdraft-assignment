from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..schemas.schemas import Topic, TopicCreate
from ..models.models import Topic as TopicModel, User
from ..database.database import get_db
from ..auth.auth import get_current_active_user

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/", response_model=List[Topic])
async def get_topics(db: Session = Depends(get_db)):
    """Get all topics."""
    topics = db.query(TopicModel).all()
    return topics


@router.post("/", response_model=Topic, status_code=status.HTTP_201_CREATED)
async def create_topic(
    topic: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new topic."""
    # Check if topic already exists
    db_topic = db.query(TopicModel).filter(TopicModel.topic == topic.topic).first()
    if db_topic:
        return db_topic
    
    # Create new topic
    db_topic = TopicModel(topic=topic.topic)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic


@router.get("/{topic_id}", response_model=Topic)
async def get_topic(topic_id: int, db: Session = Depends(get_db)):
    """Get a specific topic by ID."""
    db_topic = db.query(TopicModel).filter(TopicModel.id == topic_id).first()
    if db_topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return db_topic 