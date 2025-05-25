from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from pydantic import validator


# User schemas
class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str
    email: EmailStr


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


# Topic schemas
class TopicBase(BaseModel):
    topic: str


class TopicCreate(TopicBase):
    pass


class Topic(TopicBase):
    id: int
    


# Comment schemas
class CommentBase(BaseModel):
    comment_body: str


class CommentCreate(CommentBase):
    feed_id: int
    commenter_name: Optional[str] = None


class CommentUpdate(BaseModel):
    comment_body: Optional[str] = None


class Comment(CommentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    commenter_name: Optional[str] = None  # Will be populated with user.username


# Invited Comment schemas
class InvitedCommentCreate(BaseModel):
    commenter_name: str
    comment_body: str


class InvitedCommentResponse(BaseModel):
    id: int
    commenter_name: str
    comment_body: str
    created_at: datetime


# Feed schemas
class FeedBase(BaseModel):
    title: str
    description: Optional[str] = None


class FeedCreate(FeedBase):
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None  # Alternative to topic_id


class FeedUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None  # Alternative to topic_id


class Feed(FeedBase):
    id: int
    host: UserBase
    file_path: str
    topic: Optional[Topic] = None
    comment_count: Optional[int] = 0


# Response models with relationships
class FeedWithComments(Feed):
    comments: List[Comment] = []


class UserWithDetails(User):
    feeds: List[Feed] = []
    comments: List[Comment] = [] 


# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    userid: Optional[int] = None
    username: Optional[str] = None
    email: Optional[str] = None


# Share schemas
class ShareCreate(BaseModel):
    feed_id: int
    expires_in_days: Optional[int] = None


class ShareResponse(BaseModel):
    share_token: str
    share_url: str
    expires_at: Optional[datetime]


# User Share schemas
class UserShareCreate(BaseModel):
    feed_id: int
    email: EmailStr


class UserShareResponse(BaseModel):
    id: int
    feed_id: int
    shared_by: UserBase
    shared_with: UserBase
    created_at: datetime
    is_active: bool

    class Config:
        orm_mode = True