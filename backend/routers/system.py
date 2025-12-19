from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from .. import models, schemas, auth
from ..database import get_db
from typing import List

router = APIRouter()

# 获取当前用户信息
@router.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# 创建用户 (仅 Super Admin 和 Manager 可用，且 Manager 只能创建 User)
@router.post("/users", response_model=schemas.UserResponse)
async def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.role_required(['super_admin', 'manager']))
):
    # 检查用户名是否存在
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="用户名已存在")

    # 权限层级检查
    if current_user.role == 'manager':
        if user.role not in ['user']:
            raise HTTPException(status_code=403, detail="管理人员只能创建普通用户")
        # Manager 创建的用户归属 Manager 管理 (可选逻辑)

    hashed_password = auth.get_password_hash("123456") # 默认密码
    db_user = models.User(
        username=user.username,
        name=user.name,
        password_hash=hashed_password,
        role=user.role,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# 获取用户列表 (Super Admin 看所有，Manager 看自己创建的或普通用户)
@router.get("/users", response_model=List[schemas.UserResponse])
async def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.User).filter(models.User.is_active == True)
    if current_user.role == 'manager':
        query = query.filter(models.User.role == 'user') # 管理员只能看普通用户
    return query.all()

# 离职/删除用户 (Hard Delete for Super Admin)
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.role_required(['super_admin']))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 软删除或硬删除
    # db.delete(user) # 硬删除
    user.is_active = False # 软删除（离职）
    db.commit()
    return {"msg": "User deactivated"}

# 修改密码 (普通用户只能改自己)
@router.put("/users/{user_id}/password")
async def change_password(
    user_id: int,
    password: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.id != user_id and current_user.role != 'super_admin':
        raise HTTPException(status_code=403, detail="只能修改自己的密码")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = auth.get_password_hash(password)
    db.commit()
    return {"msg": "Password updated"}
