from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    name = Column(String(50))
    password_hash = Column(String(255))
    role = Column(String(20)) # super_admin, manager, user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # 关联
    created_positions = relationship("Position", back_populates="created_user")
    owned_resumes = relationship("Resume", back_populates="owner")

class Position(Base):
    __tablename__ = "positions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    age_req = Column(String(50))
    city = Column(String(50))
    location_detail = Column(String(200))
    duration = Column(String(50))
    count = Column(Integer, default=1)
    education = Column(String(50))
    budget = Column(Float) # 仅特定权限可见
    salary_range = Column(String(50))
    work_years = Column(String(50))
    skills = Column(Text)
    status = Column(String(20), default='active') # active, inactive
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    created_user = relationship("User", back_populates="created_positions")
    resumes = relationship("Resume", back_populates="position")
    interviews = relationship("Interview", back_populates="position")

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    phone = Column(String(20), unique=True, nullable=False) # 查重键
    education_info = Column(JSON, default={})
    work_years = Column(Integer)
    source = Column(String(50))
    file_url = Column(String(255))
    position_id = Column(Integer, ForeignKey('positions.id'))
    owner_id = Column(Integer, ForeignKey('users.id'))
    details = Column(Text) # 原始文本
    edit_logs = Column(JSON, default=[]) # [{"field": "...", "old": "...", "new": "...", "author": "...", "time": "..."}]
    callbacks = Column(JSON, default=[]) # [{"content": "...", "author": "...", "time": "..."}]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    position = relationship("Position", back_populates="resumes")
    owner = relationship("User", back_populates="owned_resumes")
    interviews = relationship("Interview", back_populates="resume")

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey('resumes.id'))
    position_id = Column(Integer, ForeignKey('positions.id'))
    interview_time = Column(DateTime)
    location = Column(String(255))
    meeting_code = Column(String(50))
    interviewers = Column(JSON) # [id1, id2]
    type = Column(String(20))
    status = Column(String(20), default="待面试")
    status_changed_by = Column(Integer)
    status_changed_at = Column(DateTime)
    feedback = Column(JSON, default={
        "scores": {"tech": 0, "comm": 0, "match": 0},
        "comment": "",
        "author_id": None,
        "author_name": "",
        "time": None
    })

    resume = relationship("Resume", back_populates="interviews")
    position = relationship("Position", back_populates="interviews")
