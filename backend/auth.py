from datetime import datetime, timedelta, UTC
from jose import JWTError, jwt
from pwdlib import PasswordHash
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from database import SessionLocal
from sqlalchemy.orm import Session
import crud

password_hash=PasswordHash.recommended()

SECRET_KEY = "your-super-secret-key-change-this-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme=OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password:str)->str:
    return password_hash.hash(password)

def verify_password(password:str,hashed_password:str)->bool:
    return password_hash.verify(password,hashed_password)

def create_access_token(data:dict):
    to_encode=data.copy();
    expire=datetime.now(UTC)+timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp":expire})
    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def verify_access_token(token:str):
    try:
        payload=jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except (JWTError,ValueError):
        return None
    
def get_current_user(token:str=Depends(oauth2_scheme),db:Session=Depends(get_db)):
    user_id=verify_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )
    user=crud.get_user_by_id(db,user_id)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User does not exist."
        )
    return user