from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import crud
from database import SessionLocal
from auth import get_current_user,get_db
from models import User
from websocket.chat import manager
from schemas import (
    ConversationResponse,
    MessageResponse,
    ConversationMemberResponse,
    CreatePrivateConversationRequest,
    CreateGroupConversationRequest,
    AddMembersRequest,
    MakeAdminRequest,
    CreateMessageRequest,
    ConversationListItem,
    ReadReceiptResponse,
    UserResponse,
    ConversationMemberInfoResponse,
    UpdateGroupNameRequest,
    HiddenMessageResponse,
    EditMessageRequest
)

from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile,File
from PIL import Image

UPLOAD_DIR = Path("uploads/images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_FORMATS = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}

router=APIRouter(prefix="/conversations",tags=["Conversations"])

@router.post("/private",response_model=ConversationListItem)
async def create_private_conversation(
        request:CreatePrivateConversationRequest, 
        db:Session=Depends(get_db), 
        current_user:User=Depends(get_current_user)
    ):
    try:
        conversation, response=crud.create_private_conversation(db,current_user.id,request.user_id)
        members = crud.get_conversation_members(db, conversation.id)
        for member in members:
            payload = {
                "type": "conversation_created",
                "conversation": crud.build_conversation_list_item(db,conversation,member.user_id)
            }
            await manager.send_to_user(member.user_id,payload)
        return response

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/group",response_model=ConversationListItem)
async def create_group_conversation(
        request:CreateGroupConversationRequest,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    
    try:
        conversation,response= crud.create_group_conversation(
            db,
            current_user.id,
            request.name,
            request.member_ids
        )
        members = crud.get_conversation_members(db, conversation.id)
        for member in members:
            payload = {
                "type": "conversation_created",
                "conversation": crud.build_conversation_list_item(db,conversation,member.user_id)
            }
            await manager.send_to_user(member.user_id,payload)
        return response

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.get("",response_model=list[ConversationListItem])
def get_user_conversations(
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    conversations = crud.get_user_conversations_list(
        db,
        current_user.id
    )
    return conversations
  
@router.get("/{conversation_id}",response_model=ConversationResponse)
def get_conversation(conversation_id:int,
                     db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    conversation=crud.get_conversation_by_id(
        db,
        conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation does not exist."
        )
    if not crud.is_member(db,conversation_id,current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this conversation."
        )
    return conversation

@router.delete("/{conversation_id}",response_model=ConversationResponse)
async def delete_conversation(
        conversation_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)):
    conversation=crud.get_conversation_by_id(db,conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation does not exist."
        )

    members = crud.get_conversation_members(db, conversation_id)
    try:
        crud.delete_conversation(db,conversation_id,current_user.id)
        payload={
            "type": "conversation_deleted",
            "conversation_id": conversation_id
        }
        for member in members:
            await manager.send_to_user(member.user_id,payload)
        return conversation
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.get("/{conversation_id}/messages",response_model=list[MessageResponse])
def get_conversation_messages(conversation_id:int,
                     db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    conversation=crud.get_conversation_by_id(
        db,
        conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation does not exist."
        )
    if not crud.is_member(db,conversation_id,current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this conversation."
        )
    messages=crud.get_conversation_messages(
        db,
        conversation_id,
        current_user.id
    )
    response=[]
    for message in messages:
        receipts=crud.get_message_read_receipts(db,message.id)
        response.append(
            MessageResponse(
                id=message.id,
                conversation_id=message.conversation_id,
                sender_id=message.sender_id,
                content=message.content,
                message_type=message.message_type,
                system_action=message.system_action,
                created_at=message.created_at,
                is_edited=message.is_edited,
                read_by=[
                    ReadReceiptResponse(
                        user_id=receipt.user.id,
                        username=receipt.user.username,
                        read_at=receipt.read_at
                    ) for receipt in receipts
                ]

            )
        )
    return response

@router.post("/{conversation_id}/messages",response_model=MessageResponse)
def create_messages(
        request:CreateMessageRequest,
        conversation_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    conversation=crud.get_conversation_by_id(
        db,
        conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation does not exist."
        )
    if not crud.is_member(db,conversation_id,current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this conversation."
        )
    try:
        message=crud.create_message(
            db,
            conversation_id,
            current_user.id,
            request.content
        )
        return message
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/{conversation_id}/images",response_model=MessageResponse)
async def upload_image(
    conversation_id:int,
    file:UploadFile=File(...),
    db:Session=Depends(get_db),
    current_user:User=Depends(get_current_user)
):
    conversation=crud.get_conversation_by_id(db,conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation does not exist."
        )
    if not crud.is_member(db,conversation_id,current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this conversation."
        )
    if file.content_type not in {"image/jpeg","image/png","image/webp",}:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed."
        )
    file_path=None
    try:
        image_bytes=file.file.read(MAX_IMAGE_SIZE+1)
        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image is empty."
            )
        if len(image_bytes) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Image size must not exceed 5 MB."
            )
        import io
        with Image.open(io.BytesIO(image_bytes)) as image:
            image_format = image.format
            image.verify()
        if image_format not in ALLOWED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail="Unsupported image format."
            )
        filename = f"{uuid4().hex}{ALLOWED_FORMATS[image_format]}"
        file_path = UPLOAD_DIR / filename
        file_path.write_bytes(image_bytes)
        image_url = f"/uploads/images/{filename}"

        message = crud.create_image_message(
            db,
            conversation_id,
            current_user.id,
            image_url,
        )
        members=crud.get_conversation_members(db,conversation_id)
        payload = {
            "type": "new_message",
            "message_id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "content": message.content,
            "message_type": message.message_type,
            "is_edited": message.is_edited,
            "created_at": message.created_at.isoformat(),
            "read_by": []
        }

        for member in members:
            await manager.send_to_user(member.user_id, payload)
        return message

    except HTTPException:
        if file_path and file_path.exists():
            file_path.unlink()
        raise
    except (Image.UnidentifiedImageError, OSError):
        if file_path and file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file."
        )
    except ValueError as e:
        if file_path and file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception:
        if file_path and file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=500,
            detail="Failed to upload image."
        )
    finally:
        file.file.close()


@router.delete("/{conversation_id}/messages/{message_id}/delete_for_me",response_model=HiddenMessageResponse)
async def delete_for_me(
    conversation_id:int,
    message_id:int,
    db:Session=Depends(get_db),
    current_user:User=Depends(get_current_user)
    ):
    message=crud.get_message_by_id(db,message_id)
    if not message:
        raise HTTPException(
            status_code=404,
            detail="Message does not exist."
        )
    if message.conversation_id != conversation_id:
        raise HTTPException(
            status_code=404,
            detail="Message does not belong to this conversation."
        )
    try:
        hidden_message = crud.delete_for_me(db, message_id, current_user.id)
        conversation = crud.get_conversation_by_id(db, conversation_id)

        payload = {
            "type": "message_deleted",
            "scope": "me",
            "conversation": crud.build_conversation_list_item(db,conversation,current_user.id),
            "message_id": message_id,
            "deleted_by": current_user.id
        }
        
        await manager.send_to_user(current_user.id,payload)
        return hidden_message

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{conversation_id}/messages/{message_id}/delete_for_everyone")
async def delete_for_everyone(
    conversation_id:int,
    message_id:int,
    db:Session=Depends(get_db),
    current_user:User=Depends(get_current_user)
    ):
    message=crud.get_message_by_id(db,message_id)
    if not message:
        raise HTTPException(
            status_code=404,
            detail="Message does not exist."
        )
    if message.conversation_id != conversation_id:
        raise HTTPException(
            status_code=404,
            detail="Message does not belong to this conversation."
        )
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own messages."
        )
    if message.message_type == "system" or message.sender_id is None:
        raise HTTPException(
            status_code=400,
            detail="System messages cannot be deleted."
        )
    try:
        message=crud.delete_message(db,message_id)
        conversation=crud.get_conversation_by_id(db,conversation_id)
        members=crud.get_conversation_members(db,conversation_id)
        for member in members:
            payload = {
                "type": "message_deleted",
                "scope": "everyone",
                "conversation": crud.build_conversation_list_item(db,conversation,member.user_id),
                "message_id": message_id,
                "deleted_by": current_user.id
            }
            await manager.send_to_user(member.user_id,payload)
        return {"detail": "Message deleted for everyone."}
    except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

@router.post("/{conversation_id}/members",response_model=list[ConversationMemberResponse])
async def add_members(
        request:AddMembersRequest,
        conversation_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    try:
        members=crud.add_multi_members(
            db,
            conversation_id,
            current_user.id,
            request.member_ids
        )
        conversation=crud.get_conversation_by_id(db,conversation_id)
        conversation_members = crud.get_conversation_members(db, conversation_id)
        for member_id in request.member_ids:
            payload = {
                "type": "conversation_created",
                "conversation": crud.build_conversation_list_item(db,conversation,member_id)
            }
            await manager.send_to_user(member_id,payload)
        for member in conversation_members:
            if member.user_id in request.member_ids:
                continue
            payload = {
                "type": "members_added",
                "conversation":crud.build_conversation_list_item(db,conversation,member_id),
                "member_ids": request.member_ids
            }
            await manager.send_to_user(member.user_id, payload)
        return members
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.get("/{conversation_id}/members",response_model=list[ConversationMemberInfoResponse])
async def get_members(
    conversation_id:int,
    db:Session=Depends(get_db),
    current_user:User=Depends(get_current_user)
):
    try:
        conversation_members=crud.get_conversation_members_with_username(db,conversation_id)
        return [
        {
            "conversation_id": member.conversation_id,
            "user_id": member.user_id,
            "username": username,
            "joined_at": member.joined_at,
            "role": member.role
        }
        for member,username in conversation_members
    ]
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.get("/{conversation_id}/availableusers",response_model=list[UserResponse])
def get_available_users(
        conversation_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    try:
        return crud.get_available_users(db,conversation_id,current_user.id)
    except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

@router.post("/{conversation_id}/make_admins",response_model=ConversationMemberResponse)
async def make_admin(
        request:MakeAdminRequest,
        conversation_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    try:
        conversation=crud.get_conversation_by_id(db,conversation_id)
        conversation_members=crud.get_conversation_members(db,conversation_id)
        admin=crud.make_admin(
            db,
            conversation_id,
            current_user.id,
            request.user_id
        )
        new_admin=crud.get_user_by_id(db,request.user_id)
        for member in conversation_members:
            payload={
                "type":"made_admin",
                "conversation":crud.build_conversation_list_item(db,conversation,member.user_id),
                "member_id":new_admin.id,
                "member_name":new_admin.username,
                "promoted_by_id":current_user.id,
                "promoted_by_name":current_user.username
            }
            await manager.send_to_user(member.user_id,payload)
        return admin
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/{conversation_id}/demote_admins",response_model=ConversationMemberResponse)
async def demote_admin(
        request:MakeAdminRequest,
        conversation_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    try:
        conversation=crud.get_conversation_by_id(db,conversation_id)
        conversation_members=crud.get_conversation_members(db,conversation_id)
        admin=crud.demote_admin(
            db,
            conversation_id,
            current_user.id,
            request.user_id
        )
        old_admin=crud.get_user_by_id(db,request.user_id)
        for member in conversation_members:
            payload={
                "type":"demoted_admin",
                "conversation":crud.build_conversation_list_item(db,conversation,member.user_id),
                "member_id":old_admin.id,
                "member_name":old_admin.username,
                "demoted_by_id":current_user.id,
                "demoted_by_name":current_user.username
            }
            await manager.send_to_user(member.user_id,payload)
        return admin
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    
@router.delete("/{conversation_id}/members/{member_id}",response_model=ConversationMemberResponse)
async def remove_member(
        conversation_id:int,
        member_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    try:
        conversation=crud.get_conversation_by_id(db,conversation_id)
        conversation_members=crud.get_conversation_members(db,conversation_id)
        removed_member=crud.remove_member(
            db,
            conversation_id,
            current_user.id,
            member_id
        )
        removed_user=crud.get_user_by_id(db,member_id)
        for member in conversation_members:
            payload={
                "type":"member_removed",
                "conversation":crud.build_conversation_list_item(db,conversation,member.user_id),
                "member_id":member_id,
                "member_name":removed_user.username,
                "removed_by_id":current_user.id,
                "removed_by_name":current_user.username
            }
            await manager.send_to_user(member.user_id,payload)

        return removed_member
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.delete("/{conversation_id}/leave",response_model=ConversationMemberResponse)
async def leave_group(
        conversation_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    try:
        conversation=crud.get_conversation_by_id(db,conversation_id)
        conversation_members=crud.get_conversation_members(db,conversation_id)
        leaving_user=crud.leave_group(db,conversation_id,current_user.id)
        for member in conversation_members:
            payload={
                "type":"member_left",
                "conversation":crud.build_conversation_list_item(db,conversation,member.user_id),
                "member_id":current_user.id,
                "member_name":current_user.username
            }
            await manager.send_to_user(member.user_id,payload)
        return leaving_user

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.patch("/{conversation_id}/name",response_model=ConversationListItem)
async def update_group_name(
        request:UpdateGroupNameRequest,
        conversation_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ):
    try:
        conversation=crud.update_group_name(db,conversation_id,current_user.id,request.name)
        members = crud.get_conversation_members(
            db,
            conversation_id
        )

        for member in members:
            payload = {
                "type": "group_name_changed",
                "conversation": crud.build_conversation_list_item(
                    db,
                    conversation,
                    member.user_id
                )
            }
            await manager.send_to_user(
                member.user_id,
                payload
            )
        response=crud.build_conversation_list_item(db,conversation,current_user.id)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.patch("/{conversation_id}/messages/{message_id}/edit_message",response_model=MessageResponse)
async def edit_message(
    request:EditMessageRequest,
    conversation_id:int,
    message_id:int,
    db:Session=Depends(get_db),
    current_user:User=Depends(get_current_user)
    ):
    message=crud.get_message_by_id(db,message_id)
    if not message:
        raise HTTPException(
            status_code=404,
            detail="Message does not exist."
        )
    if message.conversation_id != conversation_id:
        raise HTTPException(
            status_code=404,
            detail="Message does not belong to this conversation."
        )
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own messages."
        )
    if message.message_type == "system" or message.sender_id is None:
        raise HTTPException(
            status_code=400,
            detail="System messages cannot be edited."
        )
    try:
        message=crud.edit_message(db,message_id,request.content)
        conversation=crud.get_conversation_by_id(db,conversation_id)
        members=crud.get_conversation_members(db,conversation_id)
        for member in members:
            payload = {
                "type": "message_edited",
                "conversation": crud.build_conversation_list_item(db,conversation,member.user_id),
                "message_id": message_id,
                "edited_by": current_user.id
            }
            await manager.send_to_user(member.user_id,payload)
        receipts = crud.get_message_read_receipts(db, message.id)
        return MessageResponse(
            id=message.id,
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            content=message.content,
            message_type=message.message_type,
            system_action=message.system_action,
            created_at=message.created_at,
            is_edited=message.is_edited,
            read_by=[
                ReadReceiptResponse(
                    user_id=receipt.user.id,
                    username=receipt.user.username,
                    read_at=receipt.read_at
                )
                for receipt in receipts
            ]
        )
    except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))