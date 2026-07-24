from fastapi import APIRouter, HTTPException,Depends
import crud
from schemas import UserResponse
from sqlalchemy.orm import Session
from models import User
from auth import get_db,get_current_user

router=APIRouter(prefix="/users",tags=["Users"])

@router.get("/",response_model=list[UserResponse])
def get_users(
    db:Session=Depends(get_db),
    current_user:User=Depends(get_current_user)):
    return crud.get_all_other_users(db, current_user.id)