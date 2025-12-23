from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import models, schemas, auth
from database import get_db
from utils.resume_parser import extract_text_from_pdf, extract_text_from_docx, parse_resume_content
import os
import shutil
from datetime import datetime
from typing import List

router = APIRouter()

# ✅ 关键修复 1：使用绝对路径，确保目录存在
UPLOAD_DIR = "/app/static/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 1. 查重接口
@router.get("/resumes/check")
async def check_duplicate(phone: str, db: Session = Depends(get_db)):
    exists = db.query(models.Resume).filter(models.Resume.phone == phone).first() is not None
    return {"exists": exists}

# 2. 上传与解析 (修复版)
@router.post("/resumes/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        # ✅ 关键修复 2：检查文件大小 (限制 10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件不能超过10MB")

        # ✅ 关键修复 3：重置文件指针
        await file.seek(0)

        # 保存文件
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ["pdf", "docx"]:
            raise HTTPException(status_code=400, detail="仅支持 PDF 或 DOCX 格式")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 解析文本
        text_content = ""
        if file_ext == "pdf":
            text_content = extract_text_from_pdf(file_path)
        else:
            text_content = extract_text_from_docx(file_path)

        # 解析结构化数据
        parsed_data = parse_resume_content(text_content)

        # ✅ 关键修复 4：立即返回响应，不阻塞
        return {
            "code": 200,
            "message": "上传成功",
            "data": {
                "parsed": parsed_data,
                "file_url": f"/api/resumes/preview/{safe_filename}",
                "raw_text_preview": text_content[:500] + "..." if text_content else "无法解析文本"
            }
        }

    except Exception as e:
        # 确保异常能被正确返回，而不是一直等待
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")

# 3. 保存简历 (关联岗位)
@router.post("/resumes", response_model=schemas.ResumeResponse)
async def save_resume(
    resume_data: schemas.ResumeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 再次查重
    if db.query(models.Resume).filter(models.Resume.phone == resume_data.phone).first():
        raise HTTPException(status_code=400, detail="简历已存在")

    # 检查岗位是否存在且活跃
    position = db.query(models.Position).filter(models.Position.id == resume_data.position_id).first()
    if not position or position.status != 'active':
        raise HTTPException(status_code=400, detail="岗位不存在或已下架，无法关联")

    db_resume = models.Resume(
        **resume_data.dict(),
        owner_id=current_user.id,
        edit_logs=[{"op": "create", "author": current_user.name, "time": datetime.now().isoformat()}]
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume

# 4. 获取简历列表
@router.get("/resumes", response_model=List[schemas.ResumeResponse])
async def get_resumes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Resume).all()

# 5. 编辑简历信息 (留痕)
@router.put("/resumes/{resume_id}")
async def update_resume_info(
    resume_id: int,
    update_data: schemas.ResumeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # 修复：手动获取字典，避免 to_dict() 方法不存在
    old_data = {c.name: getattr(resume, c.name) for c in resume.__table__.columns}
    changes = []

    for key, value in update_data.dict(exclude_unset=True).items():
        old_val = getattr(resume, key)
        if str(old_val) != str(value):
            changes.append({
                "field": key,
                "old": str(old_val),
                "new": str(value),
                "author": current_user.name,
                "time": datetime.now().isoformat()
            })
            setattr(resume, key, value)

    if changes:
        if not resume.edit_logs:
            resume.edit_logs = []
        resume.edit_logs.extend(changes)
        db.commit()

    return {"msg": "Updated", "changes": changes}

# 6. 回访记录
@router.post("/resumes/{resume_id}/callback")
async def add_callback(
    resume_id: int,
    callback: schemas.CallbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.callbacks:
        resume.callbacks = []

    resume.callbacks.append({
        "content": callback.content,
        "author": current_user.name,
        "time": datetime.now().isoformat()
    })
    db.commit()
    return {"msg": "Callback added"}

# 7. 在线预览
@router.get("/resumes/preview/{filename}")
async def preview_resume(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(path=file_path, media_type='application/pdf')
    raise HTTPException(status_code=404, detail="File not found")
