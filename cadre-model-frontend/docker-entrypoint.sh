#!/bin/sh
set -e

# 设置默认值
BACKEND_HOST=${BACKEND_HOST:-192.168.18.77}
BACKEND_PORT=${BACKEND_PORT:-5000}

echo "Backend configuration: $BACKEND_HOST:$BACKEND_PORT"

# 生成运行时配置文件
cat > /usr/share/nginx/html/config.js <<EOF
window.config = {
  API_BASE_URL: 'http://${BACKEND_HOST}:${BACKEND_PORT}/api'
};
EOF

echo "Generated config.js with API_BASE_URL=http://${BACKEND_HOST}:${BACKEND_PORT}/api"

# 启动 nginx
exec nginx -g 'daemon off;'
