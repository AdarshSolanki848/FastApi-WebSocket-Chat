from sqlalchemy.orm import Session
from models import User, Message

def get_user_by_username(db:Session,username:str):
    return db.query(User).filter(User.username==username).first()

def create_user(db:Session,username:str):
    user=User(username=username)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user