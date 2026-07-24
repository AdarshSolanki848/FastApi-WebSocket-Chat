from fastapi import FastAPI
from database import Base, engine
from routes.auth import router as auth_router
from routes.conversation import router as conversation_router
from routes.users import router as users_router
from websocket.chat import router as chat_router
from pathlib import Path
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent.parent
app=FastAPI(
    title="Chat Application API",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)
app.include_router(auth_router)
app.include_router(conversation_router)
app.include_router(chat_router)
app.include_router(users_router)

app.mount(
    "/frontend",
    StaticFiles(directory=BASE_DIR / "frontend"),
    name="frontend"
)
from fastapi.responses import RedirectResponse

@app.get("/")
def root():
    return RedirectResponse(url="/frontend/login.html")

        
    