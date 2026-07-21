from sqlalchemy.orm import Session,aliased
from sqlalchemy import select,func

from models import (
    User,
    Conversation,
    ConversationMember,
    Message
)

from enums import ConversationType, MemberRole


#============================================
# USER CRUD
#============================================
def get_user_by_username(db:Session,username:str):
    query=(
        select(User)
        .where(
            User.username==username
        )
    )
    return db.scalar(query)

def create_user(db:Session,username:str,hashed_password:str):
    user=User(username=username,hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_id(db:Session,user_id:int):
    query = (
        select(User)
        .where(User.id == user_id)
    )
    return db.scalar(query)

#============================================
# CONVERSATION CRUD
#============================================

def get_private_conversation(db:Session,user1_id:int,user2_id:int):
    cm1=aliased(ConversationMember)
    cm2=aliased(ConversationMember)
    query=(
        select(Conversation)
        .join(
            cm1,
            Conversation.id==cm1.conversation_id
        )
        .join(
            cm2,
            Conversation.id==cm2.conversation_id
        )
        .where(Conversation.type==ConversationType.PRIVATE,
            cm1.user_id==user1_id,
            cm2.user_id==user2_id
        )
    )
    return db.scalar(query)

def create_private_conversation(db:Session,user1_id:int,user2_id:int):
    if user1_id == user2_id:
        raise ValueError("A user cannot create a private conversation with themselves.")
    conversation=get_private_conversation(db,user1_id,user2_id)
    if conversation:
        return conversation
    try:
        conversation=Conversation(type=ConversationType.PRIVATE)

        db.add(conversation)
        db.flush()

        member1=ConversationMember(
            conversation_id=conversation.id,
            user_id=user1_id,
            role=MemberRole.MEMBER
        )
        member2=ConversationMember(
            conversation_id=conversation.id,
            user_id=user2_id,
            role=MemberRole.MEMBER
        )

        db.add_all([member1,member2])
        db.commit()
        db.refresh(conversation)
        return conversation
    except Exception:
        db.rollback()
        raise
    
def get_conversation_by_id(db: Session,conversation_id: int):
    query = (
        select(Conversation)
        .where(
            Conversation.id == conversation_id
        )
    )
    return db.scalar(query)

def get_user_conversations(db:Session, user_id:int):
    query=(
        select(Conversation)
        .join(
            ConversationMember,
            Conversation.id==ConversationMember.conversation_id
        )
        .where(
            ConversationMember.user_id==user_id
        )
    )
    return db.scalars(query).all()

def create_group_conversation(db:Session,creator_id:int,name:str,member_ids:list[int]):
    name=name.strip()
    member_ids=list(set(member_ids))

    if creator_id in member_ids:
        member_ids.remove(creator_id)
    if not name:
        raise ValueError("Group cannot be empty.")
    if not member_ids:
        raise ValueError("A group must have at least one other member.")
    if not get_user_by_id(db,creator_id):
        raise ValueError("Creator does not exist.")
    for member_id in member_ids:
        if not get_user_by_id(db, member_id):
            raise ValueError(f"User {member_id} does not exist.")
    try:
        conversation=Conversation(
            type=ConversationType.GROUP,
            name=name
        )
        db.add(conversation)
        db.flush()

        members=[
            ConversationMember(
                conversation_id=conversation.id,
                user_id=creator_id,
                role=MemberRole.ADMIN
            )
        ]
        
        for member_id in member_ids:
            members.append(
                ConversationMember(
                    conversation_id=conversation.id,
                    user_id=member_id,
                    role=MemberRole.MEMBER
                )
            )
        db.add_all(members)
        db.commit()
        db.refresh(conversation)
        return conversation
    except Exception:
        db.rollback()
        raise

#============================================
# CONVERSATION-MEMBER CRUD
#============================================

def is_member(db:Session, conversation_id:int, user_id:int):
    query=(
        select(ConversationMember)
        .where(
            ConversationMember.conversation_id==conversation_id,
            ConversationMember.user_id==user_id
        )
    )

    member=db.scalar(query)
    return member is not None

def is_admin(db:Session, conversation_id:int, user_id:int):
    query=(
        select(ConversationMember)
        .where(
            ConversationMember.conversation_id==conversation_id,
            ConversationMember.user_id==user_id,
            ConversationMember.role==MemberRole.ADMIN
        )
    )
    admin=db.scalar(query)
    return admin is not None

def add_member(db:Session, conversation_id:int, requester_id:int, new_member_id:int):
    conversation=get_conversation_by_id(db,conversation_id)
    if not conversation:
        raise ValueError("Conversation does not exist.")
    
    if conversation.type==ConversationType.PRIVATE:
        raise ValueError("Cannot add member to private conversation.")
    
    if not is_member(db,conversation_id,requester_id):
        raise ValueError("Requester is not a member of conversation.")
    
    if not is_admin(db,conversation_id,requester_id):
        raise ValueError("Only admins can add other member.")
    
    if not get_user_by_id(db,new_member_id):
        raise ValueError(f"User {new_member_id} does not exist.")
    
    if is_member(db,conversation_id,new_member_id):
        raise ValueError(f"User {new_member_id} is already a part of conversation.")
    
    try:
        member=ConversationMember(
            conversation_id=conversation_id,
            user_id=new_member_id,
            role=MemberRole.MEMBER
        )

        db.add(member)
        db.commit()
        db.refresh(member)
        return member
    except Exception:
        db.rollback()
        raise


def make_admin(db:Session,conversation_id:int,requester_id:int,member_id:int):
    conversation=get_conversation_by_id(db,conversation_id)
    if not conversation:
        raise ValueError("Conversation does not exist.")
    if conversation.type==ConversationType.PRIVATE:
        raise ValueError("Cannot make admin in private conversation.")
    
    if not is_member(db,conversation_id,requester_id):
        raise ValueError("Requester is not a member of conversation.")
    
    if not is_admin(db,conversation_id,requester_id):
        raise ValueError("Only admins can promote other members.")
    if not get_user_by_id(db,member_id):
        raise ValueError(f"User {member_id} does not exist.")
    
    if not is_member(db,conversation_id,member_id):
        raise ValueError(f"User {member_id} is not a member of conversation.")
    try:
        membership=db.scalar(
                select(ConversationMember)
                .where(
                    ConversationMember.conversation_id==conversation_id,
                    ConversationMember.user_id==member_id
                )
            )
        if membership.role==MemberRole.ADMIN:
            raise ValueError(f"User {member_id} is already a admin of conversation.")
        membership.role=MemberRole.ADMIN
        db.commit()
        db.refresh(membership)
        return membership
    except Exception:
        db.rollback()
        raise
    
def get_member_count(db:Session, conversation_id:int):
    query=(
        select(func.count())
        .select_from(ConversationMember)
        .where(
            ConversationMember.conversation_id==conversation_id
        )
    )
    return db.scalar(query)

def get_admin_count(db:Session, conversation_id:int):
    query=(
        select(func.count())
        .select_from(ConversationMember)
        .where(
            ConversationMember.conversation_id==conversation_id,
            ConversationMember.role==MemberRole.ADMIN
        )
    )
    return db.scalar(query)


def remove_member(db:Session,conversation_id:int,requester_id:int,member_id:int):
    conversation=get_conversation_by_id(db,conversation_id)
    if not conversation:
        raise ValueError("Conversation does not exist.")
    if conversation.type==ConversationType.PRIVATE:
        raise ValueError("Cannot remove a member from private conversation.")
    
    if not is_member(db,conversation_id,requester_id):
        raise ValueError("Requester is not a member of conversation.")
    
    if not is_admin(db,conversation_id,requester_id):
        raise ValueError("Only admins can remove members.")
    
    if not is_member(db,conversation_id,member_id):
        raise ValueError(f"{member_id} is not a member of conversation.")
    
    try:
        membership=db.scalar(
            select(ConversationMember)
            .where(
                ConversationMember.conversation_id==conversation_id,
                ConversationMember.user_id==member_id
            )
        )

        db.delete(membership)
        db.flush()
        if get_member_count(db,conversation_id)==0:
            db.delete(conversation)
            db.commit()
            return True
        if get_admin_count(db,conversation_id)==0:
            new_admin=db.scalar(select(ConversationMember).where(ConversationMember.conversation_id==conversation_id))
            new_admin.role=MemberRole.ADMIN
        db.commit()
        db.refresh(conversation)
        return conversation
    except Exception:
        db.rollback()
        raise


#============================================
# MESSAGE CRUD
#============================================

def create_message(db:Session,conversation_id:int,sender_id:int,content:str):
    if not get_conversation_by_id(db,conversation_id):
        raise ValueError("Conversation does not exist.")
    if not get_user_by_id(db,sender_id):
        raise ValueError("Sender does not exist.")
    if not is_member(db,conversation_id,sender_id):
        raise ValueError("Sender is not a member of conversation.")
    content=content.strip()
    if content=="":
        raise ValueError("Content cannot be empty.")
    try:
        message=Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message
    except Exception:
        db.rollback()
        raise

def get_message_by_id(db:Session,message_id:int):
    return db.scalar(
        select(Message)
        .where(
            Message.id==message_id
        )
    )

def get_conversation_messages(db:Session,conversation_id:int):
    query=(
        select(Message)
        .where(
            Message.conversation_id==conversation_id
        )
        .order_by(Message.created_at)
    )
    return db.scalars(query).all()

def delete_message(db:Session,message_id):
    message=get_message_by_id(db,message_id)
    if not message:
        raise ValueError("Message does not exist.")
    try:
        db.delete(message)
        db.commit()
        return message
    except Exception:
        db.rollback()
        raise