# 第一阶段：构建阶段
# 使用官方 Node.js 镜像作为构建环境
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (如果存在)
COPY package*.json ./

# 设置国内 npm 镜像源以加速下载
RUN npm config set registry https://registry.npmmirror.com

# 安装项目依赖
# 使用这个命令可以更好地利用 Docker 缓存
RUN npm ci

# 复制所有源代码
COPY . .

# 运行构建命令
# 可以在这里设置 Node 内存限制，双重保险
RUN chmod +x ./node_modules/.bin/vite && export NODE_OPTIONS="--max-old-space-size=1024" && npm run build

# 第二阶段：生产阶段
# 使用 Nginx 镜像来托管构建好的静态文件
FROM nginx:alpine

# 从构建阶段复制打包好的文件到 Nginx 的默认网站目录
COPY --from=builder /app/dist /usr/share/nginx/html

#将您刚刚创建的自定义 nginx.conf 复制到容器中，覆盖默认配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# Nginx 容器会自动启动
CMD ["nginx", "-g", "daemon off;"]
