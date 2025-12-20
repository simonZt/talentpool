from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth
from database import get_db
from typing import List, Optional

router = APIRouter()

# 获取岗位列表 (包含过滤)
@router.get("/positions", response_model=List[schemas.PositionResponse])
async def get_positions(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Position)
    if status:
        query = query.filter(models.Position.status == status)

    positions = query.order_by(models.Position.created_at.desc()).all()

    # 前端根据权限显示预算，后端不传可能不安全，这里在 Schema 层控制
    return positions

# 创建岗位 (需要权限)
@router.post("/positions", response_model=schemas.PositionResponse)
async def create_position(
    position: schemas.PositionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.role_required(['super_admin', 'manager']))
):
    db_position = models.Position(**position.dict(), created_by=current_user.id)
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    return db_position

# 修改岗位 (特定字段限制)
@router.put("/positions/{pos_id}", response_model=schemas.PositionResponse)
async def update_position(
    pos_id: int,
    position: schemas.PositionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.role_required(['super_admin', 'manager']))
):
    db_position = db.query(models.Position).filter(models.Position.id == pos_id).first()
    if not db_position:
        raise HTTPException(status_code=404, detail="Position not found")

    # 只允许修改特定字段
    update_data = position.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_position, key, value)

    db.commit()
    db.refresh(db_position)
    return db_position

# 下架/开启岗位
@router.patch("/positions/{pos_id}/status")
async def toggle_status(
    pos_id: int,
    status: str, # 'active' or 'inactive'
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.role_required(['super_admin', 'manager']))
):
    db_position = db.query(models.Position).filter(models.Position.id == pos_id).first()
    if not db_position:
        raise HTTPException(status_code=404, detail="Position not found")

    db_position.status = status
    db.commit()
    return {"msg": f"Position is now {status}"}
