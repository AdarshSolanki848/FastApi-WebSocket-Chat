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
    AddMemberRequest,
    MakeAdminRequest,
    CreateMessageRequest,
    ConversationListItem,
    ReadReceiptResponse
)

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
                created_at=message.created_at,
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
#jjnjfrn
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
      
@router.post("/{conversation_id}/members",response_model=ConversationMemberResponse)
def add_member(
        request:AddMemberRequest,
        conversation_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    try:
        member=crud.add_member(
            db,
            conversation_id,
            current_user.id,
            request.user_id
        )
        return member
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    
@router.post("/{conversation_id}/admins",response_model=ConversationMemberResponse)
def make_admin(
        request:MakeAdminRequest,
        conversation_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    try:
        admin=crud.make_admin(
            db,
            conversation_id,
            current_user.id,
            request.user_id
        )
        return admin
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    
@router.delete("/{conversation_id}/members/{member_id}",response_model=ConversationMemberResponse)
def remove_member(
        conversation_id:int,
        member_id:int,
        db:Session=Depends(get_db),
        current_user:User=Depends(get_current_user)
    ):
    try:
        member=crud.remove_member(
            db,
            conversation_id,
            current_user.id,
            member_id
        )
        return member
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )