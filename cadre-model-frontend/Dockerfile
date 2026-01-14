# ==================== 第一阶段：构建阶段 ====================
# 使用 Node.js 镜像进行构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# ==================== 第二阶段：生产运行阶段 ====================
# 使用 nginx 镜像提供静态文件服务
FROM nginx:alpine

# 从构建阶段复制构建产物到 nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh

# 转换换行符并设置执行权限
RUN sed -i 's/\r$//' /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 80

# 使用启动脚本
CMD ["/docker-entrypoint.sh"]
