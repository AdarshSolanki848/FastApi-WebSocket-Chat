from datetime import datetime, timedelta, UTC
from jose import JWTError, jwt
from pwdlib import PasswordHash

password_hash=PasswordHash.recommended()

SECRET_KEY = "your-super-secret-key-change-this-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

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
        return payload
    except JWTError:
        return None