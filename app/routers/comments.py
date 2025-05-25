from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..schemas.schemas import Comment, CommentCreate, CommentUpdate
from ..models.models import Comment as CommentModel, Feed, User
from ..database.database import get_db
from ..auth.auth import get_current_active_user

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("/", response_model=List[Comment])
async def get_comments(feed_id: int = None, db: Session = Depends(get_db)):
    """Get all comments, optionally filtered by feed."""
    query = db.query(CommentModel).options(joinedload(CommentModel.user))
    
    if feed_id:
        query = query.filter(CommentModel.feed_id == feed_id)
    
    comments = query.order_by(CommentModel.updated_at.desc(), CommentModel.created_at.desc()).all()
    return comments


@router.post("/", response_model=Comment, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new comment."""
    # Check if feed exists
    feed = db.query(Feed).filter(Feed.id == comment.feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # Create comment
    db_comment = CommentModel(
        user_id=current_user.id,
        feed_id=comment.feed_id,
        comment_body=comment.comment_body,
        commenter_name=current_user.username
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Fetch the comment with user relationship
    db_comment = db.query(CommentModel).options(joinedload(CommentModel.user)).filter(CommentModel.id == db_comment.id).first()
    return db_comment


@router.get("/{comment_id}", response_model=Comment)
async def get_comment(comment_id: int, db: Session = Depends(get_db)):
    """Get a specific comment by ID."""
    db_comment = db.query(CommentModel).filter(CommentModel.id == comment_id).first()
    if db_comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return db_comment


@router.put("/{comment_id}", response_model=Comment)
async def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a comment."""
    db_comment = db.query(CommentModel).filter(CommentModel.id == comment_id).first()
    if db_comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user is the owner
    if db_comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this comment")
    
    # Update comment
    update_data = comment_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_comment, key, value)
    
    db.commit()
    db.refresh(db_comment)
    return db_comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a comment."""
    db_comment = db.query(CommentModel).filter(CommentModel.id == comment_id).first()
    if db_comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user is the owner
    if db_comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    # Delete comment
    db.delete(db_comment)
    db.commit()
    
    return None 