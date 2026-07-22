from fastapi import WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections:dict[int,WebSocket]={}
        self.websocket_users:dict[WebSocket,int]={}

    async def connect(self, websocket:WebSocket):
        await websocket.accept()

    async def disconnect(self,websocket:WebSocket):
        user_id=self.websocket_users.get(websocket)
        if user_id is None:
            return
        del self.active_connections[user_id]
        del self.websocket_users[websocket]
    
    async def send_to_user(self,user_id:int,data:dict):
        websocket=self.active_connections.get(user_id)
        if websocket is None:
            return
        await websocket.send_json(data)
    
    async def register_user(self,websocket:WebSocket,user_id:int):
            self.active_connections[user_id]=websocket
            self.websocket_users[websocket]=user_id
    def get_user_id(self,websocket:WebSocket):
        return self.websocket_users.get(websocket)

    