from fastapi import FastAPI
from database import Base, engine
from routes.auth import router as auth_router
from routes.conversation import router as conversation_router
from websocket.chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware
app=FastAPI(
    title="Chat Application API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:62308",
        "http://localhost:62308",
        "http://127.0.0.1:56639",
        "http://127.0.0.1:57779",
        "http://127.0.0.1:59614",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)
app.include_router(auth_router)
app.include_router(conversation_router)
app.include_router(chat_router)


        
    