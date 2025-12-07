import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # 数据库配置
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'root'
    MYSQL_PASSWORD = 'QAZxsw12345@@@'
    MYSQL_DB = 'talent_management'
    MYSQL_PORT = 3306
    
    # 文件上传
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads/resumes')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    # 允许的文件扩展名
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}