from datetime import datetime,UTC
from sqlalchemy import DateTime,ForeignKey,String,Enum
from sqlalchemy.orm import Mapped,mapped_column,relationship
from database import Base
from enums import MemberRole,ConversationType

class User(Base):
    __tablename__="users"
    id:Mapped[int]=mapped_column(primary_key=True)
    username:Mapped[str]=mapped_column(
        String(50),
        unique=True,
        nullable=False
    )
    hashed_password:Mapped[str]=mapped_column(
        String,
        nullable=False
    )
    created_at:Mapped[datetime]=mapped_column(
        DateTime(timezone=True),
        default=lambda:datetime.now(UTC)
    )
    messages: Mapped[list["Message"]] = relationship(
    back_populates="sender",
    cascade="all, delete-orphan",
    lazy="selectin"
    )
    conversation_memberships: Mapped[list["ConversationMember"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

class Conversation(Base):
    __tablename__="conversations"
    id:Mapped[int]=mapped_column(primary_key=True)
    type:Mapped[ConversationType]=mapped_column(
        Enum(ConversationType,name="conversation_type"),
        nullable=False
    )
    name:Mapped[str | None]=mapped_column(
        String(100),
        nullable=True
    )
    created_at:Mapped[datetime]=mapped_column(
        DateTime(timezone=True),
        default=lambda:datetime.now(UTC)
    )
    members: Mapped[list["ConversationMember"]] = relationship(
    back_populates="conversation",
    cascade="all, delete-orphan",
    lazy="selectin"
    )

    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class ConversationMember(Base):
    __tablename__ = "conversation_members"
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id"),
        primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        primary_key=True
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )
    role: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole,name="member_role"),
        default=MemberRole.MEMBER,
        nullable=False
    )
    user: Mapped["User"] = relationship(
    back_populates="conversation_memberships",
    lazy="selectin"
    )

    conversation: Mapped["Conversation"] = relationship(
        back_populates="members",
        lazy="selectin"
    )

class Message(Base):
    __tablename__="messages"
    id:Mapped[int]=mapped_column(primary_key=True)
    content:Mapped[str]=mapped_column(
        String,
        nullable=False
    )
    created_at:Mapped[datetime]=mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id"),
        nullable=False
    )
    sender_id:Mapped[int]=mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )
    sender: Mapped["User"] = relationship(
    back_populates="messages",
    lazy="selectin"
    )
    conversation: Mapped["Conversation"] = relationship(
        back_populates="messages",
        lazy="selectin"
    )
    