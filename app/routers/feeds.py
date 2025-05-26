from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os
import shutil
from sqlalchemy import or_, and_

from ..schemas.schemas import Feed, FeedCreate, FeedUpdate, FeedWithComments
from ..models.models import Feed as FeedModel, User, Topic, Comment, UserShare
from ..database.database import get_db
from ..auth.auth import get_current_active_user

router = APIRouter(prefix="/feeds", tags=["feeds"])

UPLOAD_DIR = "app/media/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/search", response_model=List[FeedWithComments])
async def get_feeds(
    q: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all feeds with optional filtering, including those shared with the user."""
    # Main query for feeds
    main_query = db.query(FeedModel).options(
        joinedload(FeedModel.host),
        joinedload(FeedModel.comments).joinedload(Comment.user),
    )
    
    # Filter to include only feeds owned by the user or shared with them
    main_query = main_query.filter(
        or_(
            # Feeds owned by the user
            FeedModel.host_id == current_user.id,
            # Feeds shared with the user
            FeedModel.id.in_(
                db.query(UserShare.feed_id).filter(
                    and_(
                        UserShare.shared_with_id == current_user.id,
                        UserShare.is_active == True
                    )
                )
            )
        )
    )
    
    # Apply additional filters
    if q:
        main_query = main_query.filter(
            or_(
                FeedModel.title.icontains(q),
                FeedModel.description.icontains(q),
                FeedModel.topic.has(Topic.topic.icontains(q))
            )
        )
    
    feeds = main_query.order_by(FeedModel.updated_at.desc(), FeedModel.created_at.desc()).all()
    
    # Calculate total comments for each feed
    for feed in feeds:
        feed.comment_count = len(feed.comments)
    
    return feeds

@router.get("/", response_model=List[FeedWithComments])
async def get_feeds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all feeds with optional filtering, including those shared with the user."""
    # Main query for feeds
    main_query = db.query(FeedModel).options(
        joinedload(FeedModel.host),
        joinedload(FeedModel.comments).joinedload(Comment.user),
    )
    
    # Filter to include only feeds owned by the user or shared with them
    main_query = main_query.filter(
        or_(
            # Feeds owned by the user
            FeedModel.host_id == current_user.id,
            # Feeds shared with the user
            FeedModel.id.in_(
                db.query(UserShare.feed_id).filter(
                    and_(
                        UserShare.shared_with_id == current_user.id,
                        UserShare.is_active == True
                    )
                )
            )
        )
    )
    
    feeds = main_query.order_by(FeedModel.updated_at.desc(), FeedModel.created_at.desc()).all()
    
    # Calculate total comments for each feed
    for feed in feeds:
        feed.comment_count = len(feed.comments)
    
    return feeds


@router.post("/", response_model=FeedWithComments, status_code=status.HTTP_201_CREATED)
async def create_feed(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    topic_name: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new feed with file upload."""
    # Validate file is a PDF
    if not file.content_type == "application/pdf":
        raise HTTPException(
            status_code=400, detail="Only PDF files are allowed."
        )
    
    # Handle topic
    topic = None
    if topic_name:
        topic = db.query(Topic).filter(Topic.topic == topic_name).first()
        if not topic:
            topic = Topic(topic=topic_name)
            db.add(topic)
            db.commit()
            db.refresh(topic)
    
    # Save file
    file_path = f"{UPLOAD_DIR}/{current_user.username}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create feed
    db_feed = FeedModel(
        host_id=current_user.id,
        topic_id=topic.id if topic else None,
        title=title,
        description=description,
        file_path=file_path,
    )
    db.add(db_feed)
    db.commit()
    db.refresh(db_feed)
    
    # Reload feed with relationships
    db_feed = db.query(FeedModel).options(
        joinedload(FeedModel.host),
        joinedload(FeedModel.comments).joinedload(Comment.user),
        joinedload(FeedModel.invited_user_comments)
    ).filter(FeedModel.id == db_feed.id).first()
    
    return db_feed


@router.get("/{feed_id}", response_model=FeedWithComments)
async def get_feed(feed_id: int, db: Session = Depends(get_db)):
    """Get a specific feed by ID with its comments."""
    db_feed = db.query(FeedModel).options(
        joinedload(FeedModel.host),
        joinedload(FeedModel.comments).joinedload(Comment.user),
    ).filter(FeedModel.id == feed_id).first()
    
    if db_feed is None:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # Calculate total comments
    db_feed.comment_count = len(db_feed.comments)
    
    return db_feed


@router.put("/{feed_id}", response_model=FeedWithComments)
async def update_feed(
    feed_id: int,
    feed_update: FeedUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a feed."""
    db_feed = db.query(FeedModel).filter(FeedModel.id == feed_id).first()
    if db_feed is None:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # Check if user is the owner
    if db_feed.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this feed")
    
    # Handle topic
    if feed_update.topic_name:
        topic = db.query(Topic).filter(Topic.topic == feed_update.topic_name).first()
        if not topic:
            topic = Topic(topic=feed_update.topic_name)
            db.add(topic)
            db.commit()
            db.refresh(topic)
        feed_update.topic_id = topic.id
    
    # Update feed fields
    update_data = feed_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key != "topic_name" and value is not None:
            setattr(db_feed, key, value)
    
    db.commit()
    db.refresh(db_feed)
    
    # Reload feed with relationships
    db_feed = db.query(FeedModel).options(
        joinedload(FeedModel.host),
        joinedload(FeedModel.comments).joinedload(Comment.user),
    ).filter(FeedModel.id == db_feed.id).first()
    
    return db_feed


@router.delete("/{feed_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feed(
    feed_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a feed."""
    db_feed = db.query(FeedModel).filter(FeedModel.id == feed_id).first()
    if db_feed is None:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # Check if user is the owner
    if db_feed.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this feed")
    
    # Delete file if exists
    if os.path.exists(db_feed.file_path):
        os.remove(db_feed.file_path)
    
    # Delete feed
    db.delete(db_feed)
    db.commit()
    
    return None


@router.get("/{feed_id}/download")
async def download_feed(feed_id: int, db: Session = Depends(get_db)):
    """Download the PDF file for a feed."""
    db_feed = db.query(FeedModel).filter(FeedModel.id == feed_id).first()
    if db_feed is None:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    if not os.path.exists(db_feed.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=db_feed.file_path, 
        filename=os.path.basename(db_feed.file_path),
        media_type="application/pdf"
    ) 
