from datetime import datetime,UTC
from sqlalchemy import DateTime,ForeignKey,String
from sqlalchemy.orm import Mapped,mapped_column,relationship
from database import Base

class Users(Base):
    __tablename__="users"
    id:Mapped[int]=mapped_column(primary_key=True)
    username:Mapped[str]=mapped_column(
        String(50),
        unique=True,
        nullable=False
    )
    created_at:Mapped[datetime]=mapped_column(
        DateTime(timezone=True),
        default=lambda:datetime.now(UTC)
    )
    messages:Mapped[list["Message"]]=relationship(
        back_populates="sender",
        cascade="all, delete-orphan"
    )

class Message(Base):
    __tablename__="messages"
    id:Mapped[int]=mapped_column(primary_key=True)
    message:Mapped[str]=mapped_column(
        String,
        nullable=False
    )
    created_at:Mapped[datetime]=mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )
    sender_id:Mapped[int]=mapped_column(
        ForeignKey("users.id")
    )
    sender:Mapped[list["Users"]]=relationship(
        back_populates="messages"
    )