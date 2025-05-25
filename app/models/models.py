from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc), onupdate=datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    feeds = relationship("Feed", back_populates="host")
    comments = relationship("Comment", back_populates="user")
    shared_with_me = relationship("UserShare", foreign_keys="UserShare.shared_with_id", back_populates="shared_with_user")
    shared_by_me = relationship("UserShare", foreign_keys="UserShare.shared_by_id", back_populates="shared_by_user")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(150), unique=True, index=True)
    
    # Relationships
    feeds = relationship("Feed", back_populates="topic")


class Feed(Base):
    __tablename__ = "feeds"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), index=True)
    description = Column(Text, nullable=True)
    file_path = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc), onupdate=datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    host = relationship("User", back_populates="feeds")
    topic = relationship("Topic", back_populates="feeds")
    comments = relationship("Comment", back_populates="feed", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    feed_id = Column(Integer, ForeignKey("feeds.id", ondelete="CASCADE"))
    comment_body = Column(Text)
    commenter_name = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc), onupdate=datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    user = relationship("User", back_populates="comments")
    feed = relationship("Feed", back_populates="comments")


class FileShare(Base):
    __tablename__ = "file_shares"

    id = Column(Integer, primary_key=True, index=True)
    feed_id = Column(Integer, ForeignKey("feeds.id", ondelete="CASCADE"))
    share_token = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    feed = relationship("Feed", backref="shares")
    creator = relationship("User")


class UserShare(Base):
    __tablename__ = "user_shares"

    id = Column(Integer, primary_key=True, index=True)
    feed_id = Column(Integer, ForeignKey("feeds.id", ondelete="CASCADE"))
    shared_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    shared_with_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    is_active = Column(Boolean, default=True)

    # Relationships
    feed = relationship("Feed", backref="user_shares")
    shared_by_user = relationship("User", foreign_keys=[shared_by_id], back_populates="shared_by_me")
    shared_with_user = relationship("User", foreign_keys=[shared_with_id], back_populates="shared_with_me")
