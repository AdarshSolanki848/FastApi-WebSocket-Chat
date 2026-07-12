from fastapi import WebSocket
import json
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
        for connection in self.active_connections:
            await connection.send_text(message)
        
    async def broadcast_online_count(self):
        data={"type":"online_count","count":len(self.active_connections)}
        await self.broadcast(json.dumps(data))

    async def broadcast_message(self,websocket:WebSocket,data:dict):
        data["username"]=self.active_connections[websocket]
        await self.broadcast(json.dumps(data))
        
    async def register_user(self,websocket:WebSocket,data:dict):
        self.active_connections[websocket]=data["username"]
        await self.broadcast_online_count()
        await self.broadcast(json.dumps(data))

    