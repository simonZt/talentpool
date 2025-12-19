from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, cast, Date
from .. import models, auth
from ..database import get_db
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)

    # 1. 今日简历
    daily_resumes = db.query(func.count(models.Resume.id)).filter(
        cast(models.Resume.created_at, Date) == today
    ).scalar() or 0

    # 2. 本周面试
    weekly_interviews = db.query(func.count(models.Interview.id)).filter(
        models.Interview.interview_time >= week_ago,
        models.Interview.interview_time <= today + timedelta(days=1)
    ).scalar() or 0

    # 3. 简历趋势 (最近7天)
    resume_trend_data = db.query(
        func.date(models.Resume.created_at).label('date'),
        func.count(models.Resume.id).label('count')
    ).filter(
        cast(models.Resume.created_at, Date) >= week_ago
    ).group_by('date').all()
    resumes_trend = [{"date": str(r.date), "count": r.count} for r in resume_trend_data]

    # 4. HR上传量 Top 5
    hr_stats_data = db.query(
        models.User.name.label('hr_name'),
        func.count(models.Resume.id).label('count')
    ).join(models.Resume, models.Resume.owner_id == models.User.id).group_by(models.User.name).order_by(func.count(models.Resume.id).desc()).limit(5).all()
    hr_stats = [{"hr_name": r.hr_name, "count": r.count} for r in hr_stats_data]

    # 5. 面试状态分布
    status_data = db.query(
        models.Interview.status,
        func.count(models.Interview.id)
    ).group_by(models.Interview.status).all()
    interview_status_counts = [{"status": s, "count": c} for s, c in status_data]

    return {
        "daily_resumes": daily_resumes,
        "weekly_interviews": weekly_interviews,
        "resumes_trend": resumes_trend,
        "hr_stats": hr_stats,
        "interview_status_counts": interview_status_counts
    }
