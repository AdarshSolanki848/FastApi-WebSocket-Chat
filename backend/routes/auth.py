from fastapi import APIRouter, HTTPException
import auth
import crud
from database import SessionLocal
from schemas import RegisterRequest,LoginRequest,TokenResponse

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
def login(request:LoginRequest):
    db=SessionLocal()
    try:
        user=crud.get_user_by_username(db,request.username)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="invalid username or password"
            )
        if not auth.verify_password(request.password,user.hashed_password):
            raise HTTPException(
                status_code=401,
                detail="invalid username or password"
            )
        token=auth.create_access_token({"sub":user.username})
        return{
            "access_token":token,
            "token_type":"bearer"
        }
    finally:
        db.close()