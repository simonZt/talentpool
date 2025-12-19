# 使用一个合适的 Python 基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制所有后端代码
COPY . .

# 暴露你的应用端口，例如 FastAPI/Flask 常用的 8000
EXPOSE 8000

# 启动命令，根据你的实际启动方式修改
# 例如：uvicorn main:app --host 0.0.0.0 --port 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
