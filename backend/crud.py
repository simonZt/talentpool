from sqlalchemy.orm import Session
from models import User, Position, Resume, Interview
from schemas import UserCreate, PositionCreate, PositionUpdate, ResumeCreate, ResumeUpdate
from auth import get_password_hash
from datetime import datetime

# User
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate, creator_role: str):
    if creator_role == 'manager' and user.role != 'user':
        return None # 权限拦截
    db_user = User(
        username=user.username,
        name=user.name,
        password_hash=get_password_hash(user.password),
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Position
def create_position(db: Session, position: PositionCreate, user_id: int):
    db_pos = Position(**position.dict(), created_by=user_id)
    db.add(db_pos)
    db.commit()
    db.refresh(db_pos)
    return db_pos

def update_position(db: Session, pos_id: int, update_data: PositionUpdate):
    db_pos = db.query(Position).filter(Position.id == pos_id).first()
    if not db_pos: return None
    update_dict = update_data.dict(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(db_pos, k, v)
    db.commit()
    db.refresh(db_pos)
    return db_pos

# Resume
def create_resume(db: Session, resume: ResumeCreate, owner_id: int):
    db_resume = Resume(
        **resume.dict(),
        owner_id=owner_id,
        edit_logs=[{"op": "create", "author": owner_id, "time": datetime.now().isoformat()}]
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume

def update_resume_with_log(db: Session, db_resume: Resume, update_data: dict, author_name: str):
    changes = []
    for key, value in update_data.items():
        old_val = getattr(db_resume, key)
        if str(old_val) != str(value):
            changes.append({
                "field": key,
                "old": str(old_val),
                "new": str(value),
                "author": author_name,
                "time": datetime.now().isoformat()
            })
            setattr(db_resume, key, value)
    if changes:
        db_resume.edit_logs.extend(changes)
        db.commit()
    return changes
