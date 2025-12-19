from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db
from ..utils.resume_parser import extract_text_from_pdf, extract_text_from_docx, parse_resume_content
import os
import shutil
from datetime import datetime
from typing import List


router = APIRouter()
UPLOAD_DIR = "./static/resumes"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 1. 查重接口
@router.get("/resumes/check")
async def check_duplicate(phone: str, db: Session = Depends(get_db)):
    exists = db.query(models.Resume).filter(models.Resume.phone == phone).first() is not None
    return {"exists": exists}

# 2. 上传与解析
@router.post("/resumes/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 保存文件
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["pdf", "docx"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    file_path = os.path.join(UPLOAD_DIR, f"{datetime.now().timestamp()}_{file.filename}")
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

    # 返回给前端进行确认
    return {
        "code": 200,
        "data": {
            "parsed": parsed_data,
            "file_url": f"/static/resumes/{os.path.basename(file_path)}", # 假设前端能访问
            "raw_text_preview": text_content[:500] + "..." # 供调试
        }
    }

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
    # 普通用户只能看自己的？还是看所有？
    # 需求说：其他人可以查看是谁推荐过 -> 所有人可看列表
    # 但编辑权限可能受限。
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

    # 需求：普通HR可以查看和对所有简历的编辑权限，无删除权限
    # 所以这里不做角色拦截，只要登录即可编辑

    old_data = resume.to_dict() # 假设模型有此方法或手动获取
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
        resume.edit_logs.extend(changes)
        db.commit()

    return {"msg": "Updated", "changes": changes}

# 6. 回访记录 (所有人都可以编辑)
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
