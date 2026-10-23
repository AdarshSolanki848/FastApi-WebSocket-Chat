from fastapi import WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections:dict[int,WebSocket]={}
        self.websocket_users:dict[WebSocket,int]={}

    async def connect(self, websocket:WebSocket):
        await websocket.accept()

    async def disconnect(self,websocket:WebSocket):
        user_id = self.websocket_users.pop(websocket, None)
        if user_id is None:
            return
        if self.active_connections.get(user_id) is websocket:
            del self.active_connections[user_id]
    async def send_to_user(self,user_id:int,data:dict):
        websocket=self.active_connections.get(user_id)
        if websocket is None:
            return False
        try:
            await websocket.send_json(data)
            return True
        except Exception as e:
            # print(f"WebSocket send failed for user_id={user_id}: {e}")

            # Remove the connection only if it is still the same one.
            if self.active_connections.get(user_id) is websocket:
                self.active_connections.pop(user_id, None)

            self.websocket_users.pop(websocket, None)
            return False
    
    async def register_user(self,websocket:WebSocket,user_id:int):
            self.active_connections[user_id]=websocket
            self.websocket_users[websocket]=user_id
    def get_user_id(self,websocket:WebSocket):
        return self.websocket_users.get(websocket)

    