from fastapi import APIRouter, WebSocket,WebSocketDisconnect
from connection_manager import ConnectionManager
from auth import verify_access_token
import json
from websocket.handlers import(
    handle_mark_read,
    handle_send_message,
    handle_stop_typing,
    handle_typing
)

router=APIRouter()
manager=ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket:WebSocket):
    token=websocket.query_params.get("token")
    if token is None:
        await websocket.close(code=1008)
        return
    
    user_id=verify_access_token(token)
    if user_id is None:
        await websocket.close(code=1008)
        return
    await manager.connect(websocket)
    await manager.register_user(websocket,user_id)
    try:
        while True:
            message=await websocket.receive_text()
            try:
                request_data = json.loads(message)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON"
                })
                continue
            event=request_data.get("type")
            if event=="send_message":
                await handle_send_message(websocket,manager,request_data)
            elif event=="typing":
                await handle_typing(websocket,manager,request_data)
            elif event=="stop_typing":
                await handle_stop_typing(websocket,manager,request_data)
            elif event=="mark_read":
                await handle_mark_read(websocket,manager,request_data)
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": "Unknown event type"
                })
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        print("A user disconnected")