from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta
from ..database.database import get_db
from ..auth.auth import get_current_user
from ..models.models import FileShare, Feed, User, Comment, UserShare
from pydantic import BaseModel, EmailStr
from ..schemas.schemas import ShareCreate, ShareResponse, InvitedCommentCreate, InvitedCommentResponse, FeedWithComments, UserShareCreate, UserShareResponse

router = APIRouter(
    prefix="/share",
    tags=['Shares']
)

@router.post("/public", response_model=ShareResponse)
def create_share(share: ShareCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if feed exists and user has access
    feed = db.query(Feed).filter(Feed.id == share.feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    if feed.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to share this feed")
    
    # Create share
    expires_at = None
    if share.expires_in_days:
        expires_at = datetime.now(datetime.timezone.utc) + timedelta(days=share.expires_in_days)
    
    file_share = FileShare(
        feed_id=share.feed_id,
        created_by=current_user.id,
        expires_at=expires_at
    )
    
    db.add(file_share)
    db.commit()
    db.refresh(file_share)
    
    share_url = f"/view/shared/{file_share.share_token}"
    return ShareResponse(
        share_token=file_share.share_token,
        share_url=share_url,
        expires_at=file_share.expires_at
    )

@router.get("/public/{share_token}", response_model=FeedWithComments)
def get_shared_file(share_token: str, db: Session = Depends(get_db)):
    share = db.query(FileShare).filter(
        FileShare.share_token == share_token,
        FileShare.is_active == True
    ).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found or inactive")
    
    if share.expires_at and share.expires_at < datetime.now(datetime.timezone.utc):
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    
    db_feed = db.query(Feed).options(
        joinedload(Feed.host),
        joinedload(Feed.comments).joinedload(Comment.user),
    ).filter(Feed.id == share.feed_id).first()
    
    if db_feed is None:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # Calculate total comments
    db_feed.comment_count = len(db_feed.comments)
    
    return db_feed

@router.post("/public/{share_token}/comments", response_model=InvitedCommentResponse)
def create_invited_comment(
    share_token: str,
    comment: InvitedCommentCreate,
    db: Session = Depends(get_db)
):
    share = db.query(FileShare).filter(
        FileShare.share_token == share_token,
        FileShare.is_active == True
    ).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found or inactive")
    
    if share.expires_at and share.expires_at < datetime.now(datetime.timezone.utc):
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    # Create comment
    db_comment = Comment(
        feed_id=share.feed_id,
        comment_body=comment.comment_body,
        commenter_name=comment.commenter_name
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    return db_comment
    
@router.get("/public/{share_token}/comments", response_model=List[InvitedCommentResponse])
def get_invited_comments(share_token: str, db: Session = Depends(get_db)):
    share = db.query(FileShare).filter(
        FileShare.share_token == share_token,
        FileShare.is_active == True
    ).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found or inactive")
    
    if share.expires_at and share.expires_at < datetime.now(datetime.timezone.utc):
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    query = db.query(Comment).options(joinedload(Comment.user))
    
    if share.feed_id:
        query = query.filter(Comment.feed_id == share.feed_id)
    
    comments = query.order_by(Comment.updated_at.desc(), Comment.created_at.desc()).all()
    return comments

@router.post("/user")
def share_with_user(share: UserShareCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Share a PDF with another user by email."""
    # Check if feed exists and user has access
    feed = db.query(Feed).filter(Feed.id == share.feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # Check if current user is the owner or already has access
    if feed.host_id != current_user.id:
        # Check if the feed is shared with the current user
        is_shared_with_me = db.query(UserShare).filter(
            UserShare.feed_id == share.feed_id,
            UserShare.shared_with_id == current_user.id,
            UserShare.is_active == True
        ).first()
        
        if not is_shared_with_me:
            raise HTTPException(status_code=403, detail="Not authorized to share this feed")
    
    # Find the user to share with
    target_user = db.query(User).filter(User.email == share.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    
    # Check if already shared with this user
    existing_share = db.query(UserShare).filter(
        UserShare.feed_id == share.feed_id,
        UserShare.shared_with_id == target_user.id,
        UserShare.is_active == True
    ).first()
    
    if existing_share:
        raise HTTPException(status_code=400, detail="Feed already shared with this user")
    
    # Create the user share
    user_share = UserShare(
        feed_id=share.feed_id,
        shared_by_id=current_user.id,
        shared_with_id=target_user.id
    )
    
    db.add(user_share)
    db.commit()
    db.refresh(user_share)
    
    return {
            "success": True,
            "message": "PDF Shared Successfully"
        }


@router.get("/user", response_model=List[FeedWithComments])
def get_shared_with_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all feeds shared with the current user."""
    shared_feeds = db.query(Feed).join(
        UserShare, Feed.id == UserShare.feed_id
    ).options(
        joinedload(Feed.host),
        joinedload(Feed.comments).joinedload(Comment.user)
    ).filter(
        UserShare.shared_with_id == current_user.id,
        UserShare.is_active == True
    ).all()
    
    # Calculate total comments for each feed
    for feed in shared_feeds:
        feed.comment_count = len(feed.comments)
    
    return shared_feeds


@router.delete("/user/{share_id}", status_code=204)
def remove_user_share(share_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Remove a user share (unshare with a user)."""
    share = db.query(UserShare).filter(UserShare.id == share_id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    # Check if current user is authorized to remove this share
    if share.shared_by_id != current_user.id and share.shared_with_id != current_user.id:
        # Also check if the current user is the owner of the feed
        feed = db.query(Feed).filter(Feed.id == share.feed_id).first()
        if not feed or feed.host_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to remove this share")
    
    # Deactivate the share instead of deleting
    share.is_active = False
    db.commit()
    
    return None

@router.get("/user/feed/{feed_id}", response_model=List[UserShareResponse])
def get_feed_shared_users(feed_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all users who have been shared with a specific PDF."""
    # Check if the current user is the owner of the feed
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    if feed.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this information")
    
    # Get all users who have been shared with this feed
    shares = db.query(UserShare).options(
        joinedload(UserShare.shared_with_user),
        joinedload(UserShare.shared_by_user)
    ).filter(
        UserShare.feed_id == feed_id,
        UserShare.is_active == True
    ).all()
    
    return shares