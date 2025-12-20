from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# --- Token 相关的 Schema ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- User 相关的 Schema ---
# 这个 Schema 用于返回给客户端的用户信息，通常不包含密码哈希
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {  # 使用 model_config 替代 Config 类
        "from_attributes": True  # 替换 orm_mode
    }

# --- 用户与认证 ---
class UserBase(BaseModel):
    username: str
    name: str
    role: str

class UserCreate(UserBase):
    password: str = "123456" # 默认密码，实际输入由前端控制

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- 岗位管理 ---
class PositionBase(BaseModel):
    name: str
    description: Optional[str] = None
    age_req: Optional[str] = None
    city: str
    location_detail: Optional[str] = None
    duration: Optional[str] = None
    count: Optional[int] = 1
    education: Optional[str] = None
    salary_range: Optional[str] = None
    work_years: Optional[str] = None
    skills: Optional[str] = None

class PositionCreate(PositionBase):
    # 创建时不需要 status，由系统默认
    budget: Optional[float] = None # 预算字段

class PositionUpdate(BaseModel):
    # 仅允许修改的字段
    description: Optional[str] = None
    age_req: Optional[str] = None
    duration: Optional[str] = None
    count: Optional[int] = None
    education: Optional[str] = None
    salary_range: Optional[str] = None
    work_years: Optional[str] = None

class PositionResponse(PositionBase):
    id: int
    status: str
    budget: Optional[float] = None # 这里暴露，但要在路由层根据权限过滤
    created_at: datetime
    created_by: int

    class Config:
        from_attributes = True

# --- 简历管理 ---
class ResumeCreate(BaseModel):
    name: str
    phone: str
    education_info: Dict[str, Any] = Field(default_factory=dict)
    work_years: Optional[int] = None
    source: str
    file_url: str
    position_id: int
    details: Optional[str] = None # 解析的原始文本

class ResumeUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    education_info: Optional[Dict[str, Any]] = None
    work_years: Optional[int] = None
    source: Optional[str] = None

class CallbackCreate(BaseModel):
    content: str

class ResumeResponse(BaseModel):
    id: int
    name: str
    phone: str
    education_info: Dict[str, Any]
    work_years: Optional[int]
    source: str
    file_url: str
    position_id: int
    owner_id: int
    edit_logs: List[Dict[str, Any]] = []
    callbacks: List[Dict[str, Any]] = []
    created_at: datetime

    # 关联数据
    position: Optional[PositionResponse] = None
    owner: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- 面试管理 ---
class InterviewBase(BaseModel):
    resume_id: int
    position_id: int
    interview_time: datetime
    location: str
    meeting_code: Optional[str] = None
    interviewers: List[int] # User IDs
    type: str # 初面/复面/终面

class InterviewCreate(InterviewBase):
    pass

class InterviewStatusUpdate(BaseModel):
    status: str # 待面试、已面试、通过、未通过、取消面试

class InterviewFeedback(BaseModel):
    scores: Dict[str, int] = Field(default_factory=lambda: {"tech": 0, "comm": 0, "match": 0})
    comment: str

class InterviewResponse(BaseModel):
    id: int
    status: str
    feedback: Optional[Dict[str, Any]] = None
    # ... 其他字段同 base

    class Config:
        from_attributes = True

# --- Dashboard ---
class DashboardStats(BaseModel):
    daily_resumes: int
    weekly_interviews: int
    resumes_trend: List[Dict[str, Any]]
    hr_stats: List[Dict[str, Any]]
    interview_status_counts: List[Dict[str, Any]]
