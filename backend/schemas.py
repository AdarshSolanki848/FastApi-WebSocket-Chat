from pydantic import BaseModel,ConfigDict
from enums import ConversationType,MemberRole
from datetime import datetime

class RegisterRequest(BaseModel):
    username:str
    password:str

class LoginRequest(BaseModel):
    username:str
    password:str

class TokenResponse(BaseModel):
    access_token:str
    token_type:str

class CreatePrivateConversationRequest(BaseModel):
    user_id: int

class CreateGroupConversationRequest(BaseModel):
    name: str
    member_ids: list[int]

class ConversationResponse(BaseModel):
    id: int
    type: ConversationType
    name: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AddMemberRequest(BaseModel):
    user_id: int

class MakeAdminRequest(BaseModel):
    user_id: int

class CreateMessageRequest(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    content: str
    conversation_id: int
    sender_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationMemberResponse(BaseModel):
    conversation_id: int
    user_id: int
    joined_at: datetime
    role: MemberRole

    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    id:int
    username:str
    model_config = ConfigDict(from_attributes=True)

class ConversationListItem(BaseModel):
    id: int
    type: ConversationType
    display_name: str
    avatar: str
    last_message: str | None
    last_message_time: datetime | None
    unread_count: int
    model_config = ConfigDict(from_attributes=True)