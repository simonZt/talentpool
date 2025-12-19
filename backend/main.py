from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base, get_db
from .models import User
from .auth import get_password_hash, role_required, get_current_user
import os

# 创建表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="HR管理系统")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录 (用于存放上传的简历)
os.makedirs("static/resumes", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 包含路由
from .routers import auth, dashboard, positions, resumes, interviews, system
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(positions.router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(resumes.router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(interviews.router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(system.router, prefix="/api", dependencies=[Depends(get_current_user)])

@app.on_event("startup")
async def create_default_admin():
    db = next(get_db())
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        hashed = get_password_hash("admin")
        db.add(User(username="admin", name="系统管理员", password_hash=hashed, role="super_admin"))
        db.commit()
        print("Default Admin Created: admin / admin123")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
