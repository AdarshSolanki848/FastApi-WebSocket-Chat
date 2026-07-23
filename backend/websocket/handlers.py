from fastapi import WebSocket
import connection_manager as ConnectionManager
from database import SessionLocal
import crud
from datetime import datetime,UTC
async def handle_send_message(websocket:WebSocket,manager:ConnectionManager,data:dict):
    conversation_id=data.get("conversation_id")
    content=data.get("content")
    sender_id=manager.get_user_id(websocket)
    db=SessionLocal()
    try:
        try:
            message = crud.create_message(db,conversation_id,sender_id,content)
        except ValueError as e:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
            return
        members=crud.get_conversation_members(db,conversation_id)
        payload = {
            "type": "new_message",
            "temp_id":data.get("temp_id"),
            "message_id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "read_by":[]
        }
        for member in members:
            await manager.send_to_user(member.user_id,payload)
    finally:
        db.close()


async def handle_typing(websocket:WebSocket,manager:ConnectionManager,data:dict):
    conversation_id=data.get("conversation_id")
    sender_id=manager.get_user_id(websocket)
    db=SessionLocal()
    try:
        members=crud.get_conversation_members(db,conversation_id)
        user=crud.get_user_by_id(db,sender_id)
        payload = {
            "type": "typing",
            "conversation_id":conversation_id,
            "sender_id":sender_id,
            "display_name":user.username
        }
        for member in members:
            if member.user_id==sender_id:
                continue
            await manager.send_to_user(member.user_id,payload)
    finally:
        db.close()


async def handle_stop_typing(websocket:WebSocket,manager:ConnectionManager,data:dict):
    conversation_id=data.get("conversation_id")
    sender_id=manager.get_user_id(websocket)
    db=SessionLocal()
    try:
        members=crud.get_conversation_members(db,conversation_id)
        user=crud.get_user_by_id(db,sender_id)
        payload = {
            "type": "stop_typing",
            "conversation_id":conversation_id,
            "sender_id":sender_id,
            "display_name":user.username
        }
        for member in members:
            if member.user_id==sender_id:
                continue
            await manager.send_to_user(member.user_id,payload)
    finally:
        db.close()

async def handle_mark_read(websocket:WebSocket,manager:ConnectionManager,data:dict):
    conversation_id=data.get("conversation_id")
    user_id=manager.get_user_id(websocket)
    db=SessionLocal()
    try:
        try:
            messages=crud.mark_conversation_read(db,conversation_id,user_id)
        except ValueError as e:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
            return
        if not messages:
            return
        members=crud.get_conversation_members(db,conversation_id)
        payload = {
            "type": "messages_read",
            "conversation_id":conversation_id,
            "user_id":user_id,
            "message_ids":[message.id for message in messages],
            "read_at": datetime.now(UTC).isoformat()
        }
        for member in members:
            if member.user_id==user_id:
                continue
            await manager.send_to_user(member.user_id,payload)
    finally:
        db.close()
