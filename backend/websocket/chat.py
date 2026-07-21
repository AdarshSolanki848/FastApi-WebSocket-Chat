from fastapi import APIRouter, WebSocket,WebSocketDisconnect
from connection_manager import ConnectionManager
from auth import verify_access_token
import json
router=APIRouter()
manager=ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket:WebSocket):
    token=websocket.query_params.get("token")
    username=verify_access_token(token)
    if username is None:
        websocket.close(code=1008)
        return
    await manager.connect(websocket)
    await manager.register_user(websocket,username)
    try:
        while True:
            message=await websocket.receive_text()
            data=json.loads(message)
            await manager.broadcast_message(websocket,data)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        print("A user disconnected")