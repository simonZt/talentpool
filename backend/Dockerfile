# 1. 使用一个更具体的 Python 版本作为基础镜像
FROM python:3.9-slim

# 2. 设置工作目录
WORKDIR /app

# 3. 先复制依赖定义文件
COPY pyproject.toml ./

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install -r requirements.txt

# 4. 安装依赖 (这是关键的修复步骤)
#    - 移除了 --break-system-packages
#    - 移除了 -e .，改为 pip install .
#    - 将安装依赖和复制代码分开，以利用 Docker 缓存
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# 5. 复制所有应用代码
COPY . .

# 6. 暴露端口 (假设您的 FastAPI 应用运行在 8000 端口)
EXPOSE 8000

# 7. 启动命令 (根据您的项目结构调整)
#    - 使用 uvicorn 运行 main.py 中的 app 实例
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
