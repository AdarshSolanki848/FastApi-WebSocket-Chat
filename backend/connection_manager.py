from fastapi import WebSocket,WebSocketDisconnect
import json
from database import SessionLocal
import crud
class ConnectionManager:
    def __init__(self):
        self.active_connections={}

    async def connect(self, websocket:WebSocket):
        await websocket.accept()
        # self.active_connections.append(websocket)
    async def disconnect(self,websocket:WebSocket):
        try:
            username=self.active_connections[websocket]
            del self.active_connections[websocket]
            await self.broadcast_online_count()
            data={"type":"user_left","username":username}
            await self.broadcast(json.dumps(data))
        except KeyError:
            print("No User registered")

    async def broadcast(self,message:str):
        dead_connections=[]
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                dead_connections.append(connection)
        for connection in dead_connections:
            await self.disconnect(connection)

    async def broadcast_online_count(self):
        data={"type":"online_count","count":len(self.active_connections)}
        await self.broadcast(json.dumps(data))

    async def broadcast_message(self,websocket:WebSocket,data:dict):
        if websocket not in self.active_connections:
            return
        data["username"]=self.active_connections[websocket]
        await self.broadcast(json.dumps(data))
        
    async def send_to_client(self,websocket:WebSocket,data:dict):
        await websocket.send_text(json.dumps(data))
    
    # async def broadcast_typing_state(self,websocket:WebSocket,data:dict):
    #     data["username"]=self.active_connections[websocket]
    #     await self.broadcast(self,json.dumps(data))


    async def register_user(self,websocket:WebSocket,username:str):
            self.active_connections[websocket]=username

            await self.broadcast_online_count()
            
            await self.broadcast(json.dumps({
                "type":"user_joined",
                "username":username
            }))

    