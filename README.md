# cadre-model

#### 介绍
干部全量模型平台是一个面向企业干部管理的综合信息系统，实现干部信息管理、岗位画像管理、干部岗位匹配度分析等核心功能。

#### 软件架构
项目采用前后端分离架构：

```
前端 (React 18 + TypeScript + Vite + Ant Design)
    ↓ RESTful API
后端 (Python Flask + SQLAlchemy + Marshmallow)
    ↓ ORM
数据库 (MySQL 5.7+)
```

**技术栈：**
- 后端：Python Flask + SQLAlchemy + MySQL
- 前端：React 18 + TypeScript + Ant Design + Vite
- 状态管理：Redux Toolkit
- 路由：React Router v6

#### 安装教程

**环境准备：**
- Python 3.8+
- Node.js 16+
- MySQL 5.7+

**1. 克隆项目**
```bash
git clone <repository-url>
cd cadre-model
```

**2. 后端安装**
```bash
cd cadre-model-backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量（可选）
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=cadre_model

# 初始化数据库
python init_db.py

# 启动开发服务器
python run.py
```

**3. 前端安装**
```bash
cd cadre-model-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

**4. 访问应用**
- 前端地址：http://localhost:5173
- 后端地址：http://localhost:5000
- 默认账号：admin / Aa123456

#### 使用说明

**主要功能模块：**

1. **干部管理**
   - 干部信息录入与管理
   - 干部能力评分
   - 干部特质分析
   - 动态信息记录（培训、项目、绩效等）

2. **岗位管理**
   - 岗位信息维护
   - 岗位能力权重配置
   - 岗位要求设置

3. **匹配分析**
   - 人岗匹配度计算
   - 匹配结果分析报告
   - 多岗位对比分析

4. **数据大屏**
   - 匹配态势分析
   - 梯队与年龄结构
   - 岗位风险分析
   - 干部质量画像
   - 来源与流动趋势

**匹配度计算规则：**
- 基础得分 = Σ(能力维度得分 × 岗位权重)
- 硬性要求不满足则直接不合格
- 建议要求不满足则扣分
- 最终得分 = 基础得分 - 扣分
- 匹配等级：优质(≥80分)、合格(≥60分)、不合格(<60分)

#### 性能优化

为确保查询性能，首次部署后需要创建数据库索引：

```sql
-- match_result 表索引
ALTER TABLE match_result ADD INDEX idx_cadre_position (cadre_id, position_id);
ALTER TABLE match_result ADD INDEX idx_create_time (create_time);
ALTER TABLE match_result ADD INDEX idx_final_score (final_score);
ALTER TABLE match_result ADD INDEX idx_match_level (match_level);

-- cadre_dynamic_info 表索引
ALTER TABLE cadre_dynamic_info ADD INDEX idx_cadre_info_type (cadre_id, info_type);
ALTER TABLE cadre_dynamic_info ADD INDEX idx_cadre_info_type_time (cadre_id, info_type, create_time);
ALTER TABLE cadre_dynamic_info ADD INDEX idx_cadre_type_grade (cadre_id, info_type, assessment_grade);

-- cadre_basic_info 表索引
ALTER TABLE cadre_basic_info ADD INDEX idx_status_position (status, position_id);
ALTER TABLE cadre_basic_info ADD INDEX idx_status_department (status, department_id);
ALTER TABLE cadre_basic_info ADD INDEX idx_management_level (management_level);
```

#### 目录结构

```
cadre-model/
├── cadre-model-backend/          # 后端项目
│   ├── app/
│   │   ├── api/                 # API 路由层
│   │   ├── services/            # 业务逻辑层
│   │   ├── models/              # 数据模型层
│   │   ├── schemas/             # 数据验证层
│   │   └── utils/               # 工具层
│   ├── config.py                # 配置文件
│   ├── init_db.py               # 数据库初始化
│   └── run.py                   # 启动文件
│
└── cadre-model-frontend/         # 前端项目
    ├── src/
    │   ├── pages/               # 页面组件
    │   ├── components/          # 通用组件
    │   ├── services/            # API 服务
    │   ├── store/               # 状态管理
    │   └── router/              # 路由配置
    ├── public/                  # 静态资源
    └── vite.config.ts           # Vite 配置
```

#### 参与贡献

1. Fork 本仓库
2. 新建 Feat_xxx 分支
3. 提交代码
4. 新建 Pull Request

#### 开发规范

**后端开发：**
- 遵循 PEP 8 代码规范
- 使用 Marshmallow 进行数据验证
- 避免N+1查询，使用批量查询优化性能
- 为常用查询字段添加索引

**前端开发：**
- 使用 TypeScript 类型声明
- 遵循 React Hooks 最佳实践
- 组件使用函数式组件
- 统一使用 Ant Design 组件库

#### 许可证

[MIT License](LICENSE)
