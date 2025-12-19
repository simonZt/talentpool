# 使用一个合适的 Python 基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制项目配置和代码
# 注意：我们不再单独 COPY requirements.txt，而是 COPY 整个项目
COPY . .

# 安装项目及其依赖
# 1. 升级 pip
# 2. 使用 pip install -e . 来安装项目，这会解析 pyproject.toml 中的依赖并安装
# --break-system-packages 选项在基于 Debian/Ubuntu 的镜像中通常是必需的，以避免 pip 警告
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --break-system-packages -e .

# 暴露你的应用端口
EXPOSE 8000

# 启动命令
# 这个命令现在可以正常工作了，因为项目已经被正确安装到 Python 环境中
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
