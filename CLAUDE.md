# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

干部全量模型平台是一个面向企业干部管理的综合信息系统，实现干部信息管理、岗位画像管理、干部岗位匹配度分析等核心功能。

**技术栈：**
- 后端：Python Flask + SQLAlchemy + MySQL
- 前端：React 18 + TypeScript + Ant Design + Vite
- 状态管理：Redux Toolkit
- 路由：React Router v6
- API规范：RESTful API

**UI设计风格：**
- 采用玻璃态（Glassmorphism）设计风格
- 暗色主题，使用半透明背景和模糊效果
- 下拉组件使用玻璃态样式，与项目整体风格一致

---

## 快速开始

### 环境准备

**数据库要求：**
- MySQL 5.7+
- 通过环境变量配置连接信息

**后端依赖：**
- Python 3.8+
- Flask + SQLAlchemy + Marshmallow + JWT

**前端依赖：**
- Node.js 16+
- React 18 + TypeScript + Vite

### 后端开发

```bash
# 进入后端目录
cd cadre-model-backend

# 安装依赖
pip install -r requirements.txt

# 初始化数据库（首次运行时执行）
python init_db.py

# 强制重新初始化数据库（删除所有表并重建）
python init_db.py --force

# 启动开发服务器
python run.py
# 服务器运行在 http://localhost:5000
```

**数据库初始化说明：**
- 首次运行时自动创建数据库和表
- 如果数据库已存在且有数据，会跳过初始化
- 默认管理员账号：`admin` / `Aa123456`
- 会创建示例部门、岗位和干部数据
- 强制重新初始化会删除所有现有数据

### 前端开发

```bash
# 进入前端目录
cd cadre-model-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 服务器运行在 http://localhost:5173

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

### 环境变量配置

**MySQL连接配置：**
- `MYSQL_HOST` - MySQL服务器地址（默认：192.168.18.77）
- `MYSQL_PORT` - MySQL端口（默认：13306）
- `MYSQL_USER` - MySQL用户名（默认：root）
- `MYSQL_PASSWORD` - MySQL密码
- `MYSQL_DATABASE` - 数据库名（默认：cadre_model）

---

## 架构说明

### 整体架构

项目采用前后端分离架构：

```
前端 (React + TypeScript)
    ↓ HTTP/JSON (RESTful API)
后端 (Python Flask)
    ↓ SQLAlchemy ORM
数据库 (MySQL)
```

### 后端架构

后端采用经典的分层架构：

```
app/
├── api/           # API 路由层 - 定义 RESTful API 端点
│   ├── cadre.py       # 干部管理 API
│   ├── position.py    # 岗位管理 API
│   ├── match.py       # 匹配分析 API
│   ├── system.py      # 系统管理 API
│   └── department.py  # 部门管理 API
│
├── services/      # 服务层 - 业务逻辑
│   ├── cadre_service.py    # 干部业务服务
│   ├── position_service.py # 岗位业务服务
│   └── match_service.py    # 匹配计算服务
│
├── models/        # 数据模型层 - SQLAlchemy ORM 模型
│   ├── cadre.py        # 干部相关模型
│   ├── position.py     # 岗位相关模型
│   ├── match.py        # 匹配相关模型
│   ├── system.py       # 系统配置模型
│   └── department.py   # 部门模型
│
├── schemas/       # 数据验证层 - Marshmallow 序列化/验证
│   ├── cadre_schema.py    # 干部数据结构
│   ├── position_schema.py # 岗位数据结构
│   └── match_schema.py    # 匹配数据结构
│
└── utils/         # 工具层 - 辅助功能
    ├── decorators.py  # 装饰器（token_required, log_operation）
    ├── helpers.py     # 响应辅助函数
    └── handlers.py    # 错误处理器
```

### 前端架构

前端采用模块化组件架构：

```
src/
├── pages/         # 页面层 - 功能页面组件
│   ├── Login/         # 登录页
│   ├── Home/          # 首页
│   ├── Cadre/         # 干部管理页面
│   ├── Position/      # 岗位管理页面
│   ├── Department/    # 部门管理页面
│   └── Match/         # 匹配分析页面
│
├── components/    # 组件层 - 通用 UI 组件
│   ├── Header/        # 头部导航
│   ├── Sidebar/       # 侧边栏
│   └── ScrollToTop/   # 滚动位置重置组件
│
├── router/        # 路由配置
│   └── index.tsx      # React Router 配置
│
├── store/         # 状态管理
│   └── slices/
│       └── authSlice.ts   # 认证状态（持久化到 localStorage）
│
└── assets/
    └── styles/
        └── antd-overrides.css  # Ant Design 组件样式覆盖（玻璃态主题）
```

### 数据模型关系

```
Department (部门) 1:N CadreBasicInfo (干部)
PositionInfo (岗位) 1:N PositionAbilityWeight (能力权重)
PositionInfo (岗位) 1:N PositionRequirement (岗位要求)
CadreBasicInfo (干部) N:1 PositionInfo (岗位) - position_id 可为空
CadreBasicInfo (干部) 1:N CadreAbilityScore (能力评分)
CadreBasicInfo (干部) 1:N CadreDynamicInfo (动态信息)
CadreBasicInfo (干部) 1:N CadreTrait (特质)
CadreBasicInfo + PositionInfo N:1 MatchResult (匹配结果)
```

### 数据库表说明

所有表都配置了 MySQL 注释（COMMENT）：

1. **operation_log** - 操作日志表：记录系统操作日志用于审计和追溯
2. **user** - 用户表：存储系统用户信息和认证信息
3. **position_info** - 岗位信息表：存储岗位的基本信息、编制、职责等
4. **position_ability_weight** - 岗位能力权重配置表：配置各岗位在不同能力维度上的权重
5. **position_requirement** - 岗位要求配置表：配置岗位的硬性要求和建议要求
6. **cadre_basic_info** - 干部基础信息表：存储干部的基本信息、部门岗位关联等
7. **cadre_dynamic_info** - 干部动态信息表：存储培训、项目、绩效、奖惩、职务变更等动态信息
8. **cadre_trait** - 干部特质表：存储干部的性格特质、管理风格、沟通风格、决策偏向等特质分析
9. **cadre_ability_score** - 干部能力评分表：存储干部在各能力维度上的评分情况
10. **department** - 部门表：存储组织架构的部门信息，支持树形结构
11. **match_result** - 匹配结果表：存储干部与岗位的匹配分析结果
12. **match_report** - 匹配分析报告表：存储详细的匹配分析报告和雷达图数据

---

## API文档

### 认证机制

所有 API（除登录外）都需要在请求头中携带 JWT token：
```
Authorization: Bearer <token>
```

### 干部管理 API

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/cadres` | 获取干部列表（分页，支持 name、status、department 筛选） |
| GET | `/api/cadres/<id>` | 获取干部详情（包含岗位信息） |
| POST | `/api/cadres` | 新增干部 |
| PUT | `/api/cadres/<id>` | 更新干部信息 |
| DELETE | `/api/cadres/<id>` | 删除干部 |
| GET | `/api/cadres/<id>/traits` | 获取干部特质 |
| PUT | `/api/cadres/<id>/traits` | 更新干部特质 |
| GET | `/api/cadres/<id>/abilities` | 获取干部能力评分 |
| PUT | `/api/cadres/<id>/abilities` | 更新干部能力评分 |
| GET | `/api/cadres/<id>/dynamic-info` | 获取动态信息列表 |
| POST | `/api/cadres/<id>/dynamic-info` | 添加动态信息 |
| PUT | `/api/cadres/dynamic-info/<info_id>` | 更新动态信息 |
| DELETE | `/api/cadres/dynamic-info/<info_id>` | 删除动态信息 |

**干部数据包含岗位信息：**
- `position_id` - 岗位ID（可为空）
- `position` - 岗位详情对象（包含 position_code, position_name 等）

### 岗位管理 API

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/positions` | 获取岗位列表（分页） |
| GET | `/api/positions/all` | 获取所有启用的岗位（用于下拉选择） |
| GET | `/api/positions/<id>` | 获取岗位详情 |
| POST | `/api/positions` | 新增岗位 |
| PUT | `/api/positions/<id>` | 更新岗位信息 |
| DELETE | `/api/positions/<id>` | 删除岗位 |
| GET | `/api/positions/<id>/weights` | 获取岗位能力权重 |
| PUT | `/api/positions/<id>/weights` | 更新岗位能力权重 |
| GET | `/api/positions/<id>/requirements` | 获取岗位要求 |
| PUT | `/api/positions/<id>/requirements` | 更新岗位要求 |

### 匹配分析 API

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/match/calculate` | 计算单个干部与岗位的匹配度 |
| POST | `/api/match/batch-calculate` | 批量计算匹配度（岗位 vs 所有干部） |
| GET | `/api/match/results` | 获取匹配结果列表 |
| GET | `/api/match/results/<id>` | 获取匹配结果详情 |
| GET | `/api/match/results/<id>/report` | 生成分析报告 |
| POST | `/api/match/compare` | 多岗位对比分析 |

**匹配分析页面交互逻辑：**
- 部门选择和干部选择分离
- 干部选择支持多选
- 如果选择了干部，则只分析选中的干部
- 如果只选择了部门，则分析该部门下的所有干部
- 干部选择的优先级高于部门选择

### 系统管理 API

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/system/login` | 用户登录 |
| GET | `/api/system/departments` | 获取部门列表 |

### 匹配度计算算法

匹配度计算是系统的核心功能，位于 `app/services/match_service.py`：

1. **基础得分计算**：`Σ(干部某能力维度得分 × 该维度岗位权重)`
   - 干部能力评分为 1-5 分
   - 岗位权重为 0-100
   - 公式：`(score / 5) * weight`

2. **硬性要求检查**：任一硬性要求不满足则直接不合格

3. **建议要求扣分**：不满足建议要求时扣分（有扣分上限）

4. **最终得分**：`基础得分 - 扣分`

5. **匹配等级**：
   - `excellent` - 优质匹配 (>=80 分)
   - `qualified` - 合格匹配 (>=60 分)
   - `unqualified` - 不合格匹配 (<60 分)

---

## 配置说明

### 后端配置 (`cadre-model-backend/config.py`)

**基础配置：**
- `SECRET_KEY` - Flask 密钥
- `JWT_SECRET_KEY` - JWT 签名密钥
- `CORS_ORIGINS` - 允许的跨域来源

**MySQL数据库配置（通过环境变量）：**
- `MYSQL_HOST` - MySQL服务器地址
- `MYSQL_PORT` - MySQL端口
- `MYSQL_USER` - MySQL用户名
- `MYSQL_PASSWORD` - MySQL密码
- `MYSQL_DATABASE` - 数据库名
- `SQLALCHEMY_DATABASE_URI` - 自动根据以上配置生成连接字符串

**匹配度阈值配置：**
- `MATCH_LEVEL_EXCELLENT` - 优质匹配阈值（默认 80）
- `MATCH_LEVEL_QUALIFIED` - 合格匹配阈值（默认 60）

### 前端配置 (`cadre-model-frontend/vite.config.ts`)

- 开发服务器端口：5173
- API 代理：`/api` -> `http://localhost:5000`
- 路径别名：`@` -> `./src`

**全局消息提示配置 (`main.tsx`)：**
- 显示时长：1.5秒
- 显示位置：距离顶部 55px

### 主题配置

**Ant Design 主题配置：**
- 使用 `darkAlgorithm` 暗色算法
- 自定义 CSS 变量支持玻璃态效果：
  - `--color-glass-surface` - 玻璃态表面颜色
  - `--color-glass-border` - 玻璃态边框颜色
  - `--backdrop-blur` - 背景模糊程度

---

## 开发注意事项

### 通用规范

1. **认证机制**
   - 用户信息保存在 Redux 和 localStorage 中
   - 页面刷新后自动从 localStorage 恢复用户信息
   - 前端 axios 拦截器会处理 401 自动跳转登录

2. **错误处理**
   - 后端使用统一的响应格式：`{ code, message, data }`

3. **数据验证**
   - 后端使用 Marshmallow schema 进行数据验证
   - 前端使用 Ant Design 表单验证

4. **日志记录**
   - 使用 `@log_operation` 装饰器记录操作日志

### 分页参数

- `page` - 页码（从 1 开始）
- `page_size` - 每页数量（默认 20）

### 前端开发规范

1. **页面导航**
   - 所有页面切换时自动滚动到顶部（ScrollToTop 组件）
   - 详情页面的返回按钮根据来源智能导航

2. **下拉组件样式**
   - 所有 Select、TreeSelect 等下拉组件使用玻璃态样式
   - 样式定义在 `antd-overrides.css` 中

### 后端开发规范

1. **数据库表注释**
   - 所有数据表都配置了 `mysql_comment` 注释
   - 使用 `__table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '...'}` 格式

2. **常量定义**
   - 能力维度和标签使用常量文件定义（后端：`app/utils/ability_constants.py`，前端：`src/utils/abilityConstants.ts`）
   - 特质类型和值使用常量文件定义（后端：`app/utils/trait_constants.py`，前端：`src/utils/traitConstants.ts`）
   - 不再使用数据库字典表（ability_tag_dict 和 trait_dict 已删除）
