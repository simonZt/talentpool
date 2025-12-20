from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth
from database import get_db
from datetime import datetime
from typing import List

router = APIRouter()

@router.get("/interviews", response_model=List[schemas.InterviewResponse])
async def get_interviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 普通用户只能看自己的简历面试，管理员看所有
    query = db.query(models.Interview)
    if current_user.role == 'user':
        # 这里的逻辑比较复杂：用户只能看到自己上传的简历的面试
        resume_ids = [r.id for r in db.query(models.Resume.id).filter(models.Resume.owner_id == current_user.id).all()]
        query = query.filter(models.Interview.resume_id.in_(resume_ids))

    return query.order_by(models.Interview.interview_time.desc()).all()

@router.post("/interviews", response_model=schemas.InterviewResponse)
async def create_interview(
    interview: schemas.InterviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 校验关联数据
    resume = db.query(models.Resume).filter(models.Resume.id == interview.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # 确保岗位匹配
    if resume.position_id != interview.position_id:
        raise HTTPException(status_code=400, detail="Position mismatch")

    db_interview = models.Interview(
        **interview.dict(),
        status="待面试",
        feedback={} # 初始化
    )
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
    return db_interview

@router.patch("/interviews/{interview_id}/status")
async def update_status(
    interview_id: int,
    update: schemas.InterviewStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    old_status = interview.status
    interview.status = update.status
    interview.status_changed_by = current_user.id
    interview.status_changed_at = datetime.now()

    # 记录日志（可选，这里简单处理）
    db.commit()
    return {"msg": "Status updated", "old": old_status, "new": update.status}

@router.post("/interviews/{interview_id}/feedback")
async def submit_feedback(
    interview_id: int,
    feedback: schemas.InterviewFeedback,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # 只有面试官可以评价 (这里简化为：所有登录用户可评价)
    # 如果需要严格控制，可判断 interview.interviewers 包含 current_user.id

    interview.feedback = {
        "scores": feedback.scores,
        "comment": feedback.comment,
        "author_id": current_user.id,
        "author_name": current_user.name,
        "time": datetime.now().isoformat()
    }

    db.commit()

    # 可选：同步反馈到简历的 details 或 edit_logs
    # resume = interview.resume
    # resume.details += f"\n[Interview Feedback] {current_user.name}: {feedback.comment}"

    return {"msg": "Feedback submitted"}
