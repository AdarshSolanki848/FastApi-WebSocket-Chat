from fastapi import APIRouter, HTTPException,Depends
import auth
import crud
from database import SessionLocal
from schemas import RegisterRequest,TokenResponse,UserResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from models import User

router=APIRouter(prefix="/auth",tags=["Authentication"])

@router.post("/register")
def register(request:RegisterRequest):
    db=SessionLocal()
    try:
        existing_user=crud.get_user_by_username(db,request.username)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username already exist"
            )
        hashed_password=auth.hash_password(request.password)
        crud.create_user(db,request.username,hashed_password)
        
        return {
            "message":"User Registered Successfully"
        }
    finally:
        db.close()

@router.post("/login",response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(),db:Session=Depends(auth.get_db)):
    
    user=crud.get_user_by_username(db,form_data.username)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="invalid username or password"
        )
    if not auth.verify_password(form_data.password,user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="invalid username or password"
        )
    token=auth.create_access_token({"sub":str(user.id)})
    return{
        "access_token":token,
        "token_type":"bearer"
    }

@router.get("/me",response_model=UserResponse)
def read_current_user(current_user:User=Depends(auth.get_current_user)):
    return current_user
        