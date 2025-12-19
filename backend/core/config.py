# backend/core/config.py

import os
from dotenv import load_dotenv

# 加载 .env 文件中的环境变量（如果存在）
# 您可以在项目根目录创建一个 .env 文件来存储敏感信息
# 例如:
# SECRET_KEY="your-super-secret-key-generated-by-python"
# DATABASE_URL="sqlite:///./talentpool.db"
load_dotenv()

# --- 数据库配置 ---
# 默认使用 SQLite，如果需要 PostgreSQL 或 MySQL，请修改 DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./talentpool.db")

# --- JWT (JSON Web Token) 配置 ---
# SECRET_KEY 是用于签名的密钥，必须保密。
# 在您的终端运行以下命令来生成一个安全的密钥：
# python -c "import secrets; print(secrets.token_urlsafe(32))"
# 强烈建议在生产环境中通过环境变量设置，而不是硬编码在这里。
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_long_and_random_string_for_jwt_signing_12345")

# JWT 签名算法，通常使用 HS256
ALGORITHM = "HS256"

# Token 默认有效期（分钟）
ACCESS_TOKEN_EXPIRE_MINUTES = 30

