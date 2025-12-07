import os

class ProductionConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    
    # 生产环境数据库
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.environ.get('MYSQL_USER')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'talent_management')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
    
    # 生产环境上传路径
    UPLOAD_FOLDER = '/var/www/talentpool/uploads/resumes'
    
    # 关闭调试模式
    DEBUG = False