from fastapi import FastAPI, WebSocket,WebSocketDisconnect
from manager import ConnectionManager
import json
from database import Base, engine
import models
app=FastAPI()

Base.metadata.create_all(bind=engine)

manager=ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket:WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            message=await websocket.receive_text()
            data=json.loads(message)
            if(data["type"]=="user_joined"):
                await manager.register_user(websocket,data)
            else:
                await manager.broadcast_message(websocket,data)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        print("A user disconnected")
        
    