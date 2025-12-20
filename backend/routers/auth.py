# backend/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

# 从 schemas 和其他模块导入
# 注意：根据您提供的代码，您使用了 crud 和 auth 模块
from schemas import Token, UserResponse
from database import get_db
import crud, auth

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 使用 crud 模块获取用户，并使用 auth 模块验证密码
    user = crud.get_user_by_username(db, form_data.username)

    # 假设您的 User 模型密码字段是 password_hash
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # 关键修复：这里调用的 auth.create_access_token 函数现在可以正常工作了
    # 因为它内部已经能正确访问到 ACCESS_TOKEN_EXPIRE_MINUTES
    access_token = auth.create_access_token(
        data={"sub": user.username},
        # 这一行之前会报错，现在不会了
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: auth.User = Depends(auth.get_current_user)):
    # 这里的 current_user 是由上面定义的 get_current_user 函数返回的
    # 假设 UserResponse schema 能够处理这个 user 对象
    return current_user
