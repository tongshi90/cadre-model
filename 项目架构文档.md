# 干部全量模型平台 - 开发架构说明

## 一、项目概述

干部全量模型平台是一个面向企业干部管理的综合信息系统，实现干部信息管理、岗位画像管理、干部岗位匹配度分析等核心功能。

**技术栈：**
- 后端框架：Python Flask
- 前端框架：React 18 + TypeScript
- UI组件库：Ant Design
- 状态管理：Redux Toolkit + RTK Query
- 路由：React Router v6
- 数据库：SQLite
- ORM：SQLAlchemy
- API规范：RESTful API

## 二、技术架构

### 2.1 整体架构（前后端分离）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           前端 (Frontend)                                    │
│                         React + TypeScript                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                         视图层 (Views)                                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │  │
│  │  │ 干部管理   │  │ 岗位管理   │  │ 匹配分析   │  │ 系统管理   │       │  │
│  │  │   页面     │  │   页面     │  │   页面     │  │   页面     │       │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                     ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                       组件层 (Components)                                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │  │
│  │  │ 通用组件   │  │ 业务组件   │  │ 表单组件   │  │ 图表组件   │       │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                     ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                       状态管理层 (State)                                  │  │
│  │  ┌────────────────────┐              ┌────────────────────┐             │  │
│  │  │   Redux Store      │              │    RTK Query       │             │  │
│  │  │  (全局状态)        │              │   (API数据)        │             │  │
│  │  └────────────────────┘              └────────────────────┘             │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                     ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                       API服务层 (Services)                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │  │                    axios + API拦截器                            │    │  │
│  │  └─────────────────────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │ HTTP/JSON
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          后端 (Backend)                                      │
│                          Python Flask                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                        API路由层 (Routes)                                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │  │
│  │  │ 干部API    │  │ 岗位API    │  │ 匹配API    │  │ 系统API    │       │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                     ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                      控制器层 (Controllers)                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                        │  │
│  │  │ 干部控制   │  │ 岗位控制   │  │ 匹配控制   │                        │  │
│  │  └────────────┘  └────────────┘  └────────────┘                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                     ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                       服务层 (Services)                                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                        │  │
│  │  │ 干部服务   │  │ 岗位服务   │  │ 匹配服务   │                        │  │
│  │  └────────────┘  └────────────┘  └────────────┘                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                     ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                      数据访问层 (Models)                                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                        │  │
│  │  │ 干部模型   │  │ 岗位模型   │  │ 匹配模型   │                        │  │
│  │  └────────────┘  └────────────┘  └────────────┘                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SQLite 数据库文件                                      │
│                      (data/cadre_model.db)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 项目目录结构

```
cadre-model/
├── cadre-model-backend/        # 后端项目目录
│   ├── app/                    # 应用主目录
│   │   ├── __init__.py         # 应用工厂，初始化Flask、数据库等
│   │   ├── config.py           # 配置文件
│   │   ├── models/             # 数据模型层 (SQLAlchemy)
│   │   │   ├── __init__.py
│   │   │   ├── cadre.py        # 干部相关模型
│   │   │   ├── position.py     # 岗位相关模型
│   │   │   ├── match.py        # 匹配相关模型
│   │   │   └── system.py       # 系统配置模型
│   │   ├── services/           # 业务逻辑层
│   │   │   ├── __init__.py
│   │   │   ├── cadre_service.py    # 干部业务服务
│   │   │   ├── position_service.py # 岗位业务服务
│   │   │   └── match_service.py    # 匹配计算服务
│   │   ├── controllers/        # API控制器层
│   │   │   ├── __init__.py
│   │   │   ├── cadre_controller.py # 干部API控制器
│   │   │   ├── position_controller.py # 岗位API控制器
│   │   │   └── match_controller.py # 匹配API控制器
│   │   ├── schemas/            # 数据序列化/反序列化
│   │   │   ├── __init__.py
│   │   │   ├── cadre_schema.py # 干部数据结构
│   │   │   ├── position_schema.py # 岗位数据结构
│   │   │   └── match_schema.py # 匹配数据结构
│   │   ├── utils/              # 工具函数
│   │   │   ├── __init__.py
│   │   │   ├── decorators.py   # 装饰器
│   │   │   ├── helpers.py      # 辅助函数
│   │   │   ├── validators.py   # 数据验证器
│   │   │   └── constants.py    # 常量定义
│   │   └── api/                # API蓝图
│   │       ├── __init__.py
│   │       ├── cadre.py        # 干部API路由
│   │       ├── position.py     # 岗位API路由
│   │       ├── match.py        # 匹配API路由
│   │       └── system.py       # 系统API路由
│   │
│   ├── migrations/             # 数据库迁移文件 (Flask-Migrate)
│   │
│   ├── data/                   # 数据目录
│   │   ├── cadre_model.db      # SQLite数据库文件
│   │   └── uploads/            # 上传文件目录
│   │
│   ├── tests/                  # 测试目录
│   │   ├── __init__.py
│   │   ├── test_models.py
│   │   ├── test_services.py
│   │   └── test_api.py
│   │
│   ├── requirements.txt        # Python依赖
│   ├── config.py               # 应用配置
│   ├── init_db.py              # 数据库初始化脚本（重复执行会重新初始化，初始管理员：admin/Aa123456）
│   ├── run.py                  # 应用启动入口
│   └── .env.example            # 环境变量示例
│
├── cadre-model-frontend/       # 前端项目目录
│   ├── public/                 # 静态资源
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/                    # 源代码目录
│   │   ├── index.tsx           # 应用入口
│   │   ├── App.tsx             # 根组件
│   │   ├── vite-env.d.ts       # Vite类型声明
│   │   │
│   │   ├── pages/              # 页面组件
│   │   │   ├── Home/           # 首页
│   │   │   ├── Cadre/          # 干部管理页面
│   │   │   │   ├── List.tsx    # 干部列表
│   │   │   │   ├── Detail.tsx  # 干部详情
│   │   │   │   ├── Create.tsx  # 新增干部
│   │   │   │   ├── Edit.tsx    # 编辑干部
│   │   │   │   ├── Trait.tsx   # 特质管理
│   │   │   │   └── Ability.tsx # 能力评估
│   │   │   ├── Position/       # 岗位管理页面
│   │   │   │   ├── List.tsx    # 岗位列表
│   │   │   │   ├── Detail.tsx  # 岗位详情
│   │   │   │   ├── Create.tsx  # 新增岗位
│   │   │   │   ├── Edit.tsx    # 编辑岗位
│   │   │   │   └── Weight.tsx  # 权重配置
│   │   │   └── Match/          # 匹配分析页面
│   │   │       ├── Analysis.tsx    # 匹配分析
│   │   │       ├── Result.tsx      # 匹配结果
│   │   │       ├── Report.tsx      # 分析报告
│   │   │       └── Compare.tsx     # 多岗位对比
│   │   │
│   │   ├── components/         # 通用组件
│   │   │   ├── Layout/         # 布局组件
│   │   │   ├── Header/         # 头部组件
│   │   │   ├── Sidebar/        # 侧边栏组件
│   │   │   ├── Table/          # 表格组件
│   │   │   ├── Form/           # 表单组件
│   │   │   └── Charts/         # 图表组件
│   │   │
│   │   ├── services/           # API服务
│   │   │   ├── api.ts          # API客户端配置
│   │   │   ├── cadreApi.ts     # 干部API
│   │   │   ├── positionApi.ts  # 岗位API
│   │   │   └── matchApi.ts     # 匹配API
│   │   │
│   │   ├── store/              # Redux状态管理
│   │   │   ├── index.ts        # Store配置
│   │   │   ├── slices/         # Redux Slices
│   │   │   │   ├── cadreSlice.ts
│   │   │   │   ├── positionSlice.ts
│   │   │   │   └── matchSlice.ts
│   │   │   └── hooks.ts        # Redux Hooks
│   │   │
│   │   ├── types/              # TypeScript类型定义
│   │   │   ├── cadre.ts
│   │   │   ├── position.ts
│   │   │   └── match.ts
│   │   │
│   │   ├── utils/              # 工具函数
│   │   │   ├── request.ts      # 请求封装
│   │   │   ├── helpers.ts      # 辅助函数
│   │   │   └── constants.ts    # 常量定义
│   │   │
│   │   ├── hooks/              # 自定义Hooks
│   │   │   ├── useTable.ts     # 表格Hook
│   │   │   └── useForm.ts      # 表单Hook
│   │   │
│   │   └── assets/             # 资源文件
│   │       ├── styles/         # 样式文件
│   │       └── images/         # 图片资源
│   │
│   ├── package.json            # 依赖配置
│   ├── tsconfig.json           # TypeScript配置
│   ├── vite.config.ts          # Vite配置
│   ├── .env.example            # 环境变量示例
│   └── .env.development        # 开发环境变量
│
├── docs/                       # 文档目录
│   ├── db/                     # 数据库文档
│   │   └── schema.sql          # 建表SQL脚本
│   └── api/                    # 接口文档
│       └── api.md
│
├── .gitignore
└── README.md                   # 项目说明
```

## 三、数据库设计

### 3.1 干部信息相关表

#### 3.1.1 干部基础信息表 (cadre_basic_info)

```sql
CREATE TABLE cadre_basic_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    age INTEGER,
    entry_date DATE,
    gender VARCHAR(10),
    native_place VARCHAR(200),
    education VARCHAR(50),
    major VARCHAR(100),
    qualifications TEXT,
    political_status VARCHAR(50),
    status INTEGER DEFAULT 1,  -- 1-在职，2-离职，3-退休
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(50),
    update_by VARCHAR(50),
    remark VARCHAR(500)
);

CREATE INDEX idx_cadre_employee_no ON cadre_basic_info(employee_no);
CREATE INDEX idx_cadre_name ON cadre_basic_info(name);
CREATE INDEX idx_cadre_status ON cadre_basic_info(status);
```

#### 3.1.2 干部动态信息表 (cadre_dynamic_info)

```sql
CREATE TABLE cadre_dynamic_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cadre_id INTEGER NOT NULL,
    info_type INTEGER NOT NULL,  -- 1-培训记录，2-项目经历，3-绩效数据，4-奖惩记录，5-职务变更
    training_name VARCHAR(200),
    training_date DATE,
    training_content TEXT,
    training_result VARCHAR(100),

    project_no VARCHAR(50),
    project_name VARCHAR(200),
    project_role VARCHAR(100),
    project_start_date DATE,
    project_end_date DATE,
    project_result TEXT,
    project_rating VARCHAR(50),

    assessment_cycle VARCHAR(50),
    assessment_dimension VARCHAR(200),
    assessment_score REAL,
    assessment_comment TEXT,

    reward_type VARCHAR(50),
    reward_reason TEXT,
    reward_date DATE,
    reward_level VARCHAR(50),

    position_name VARCHAR(100),
    responsibility TEXT,
    appointment_type VARCHAR(50),
    term_start_date DATE,
    term_end_date DATE,
    approval_record TEXT,

    start_date DATE,
    end_date DATE,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(50),
    remark VARCHAR(500),
    FOREIGN KEY (cadre_id) REFERENCES cadre_basic_info(id)
);

CREATE INDEX idx_dynamic_cadre_id ON cadre_dynamic_info(cadre_id);
CREATE INDEX idx_dynamic_info_type ON cadre_dynamic_info(info_type);
CREATE INDEX idx_dynamic_start_date ON cadre_dynamic_info(start_date);
```

#### 3.1.3 干部特质表 (cadre_trait)

```sql
CREATE TABLE cadre_trait (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cadre_id INTEGER NOT NULL,
    trait_type VARCHAR(50) NOT NULL,  -- personality-性格特质，management-管理风格，communication-沟通风格，decision-决策偏向
    trait_value VARCHAR(50) NOT NULL,
    trait_desc VARCHAR(200),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(50),
    UNIQUE (cadre_id, trait_type),
    FOREIGN KEY (cadre_id) REFERENCES cadre_basic_info(id)
);

CREATE INDEX idx_trait_cadre_id ON cadre_trait(cadre_id);
CREATE INDEX idx_trait_type ON cadre_trait(trait_type);
```

#### 3.1.4 干部能力评分表 (cadre_ability_score)

```sql
CREATE TABLE cadre_ability_score (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cadre_id INTEGER NOT NULL,
    ability_layer VARCHAR(50) NOT NULL,  -- quality-素质层，capability-能力层，trait-特质层，experience-经验层
    ability_dimension VARCHAR(100) NOT NULL,
    ability_tag VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,  -- 评分(1-5)
    assessor VARCHAR(100),
    assessment_date DATE,
    comment TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(50),
    UNIQUE (cadre_id, ability_tag),
    FOREIGN KEY (cadre_id) REFERENCES cadre_basic_info(id)
);

CREATE INDEX idx_ability_cadre_id ON cadre_ability_score(cadre_id);
CREATE INDEX idx_ability_layer ON cadre_ability_score(ability_layer);
CREATE INDEX idx_assessment_date ON cadre_ability_score(assessment_date);
```

### 3.2 岗位信息相关表

#### 3.2.1 岗位信息表 (position_info)

```sql
CREATE TABLE position_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_code VARCHAR(50) NOT NULL UNIQUE,
    position_name VARCHAR(100) NOT NULL,
    position_level VARCHAR(50),  -- 基层-1，中层-2，高层-3
    department VARCHAR(100),
    headcount INTEGER,
    responsibility TEXT,
    status INTEGER DEFAULT 1,  -- 1-启用，0-停用
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(50),
    update_by VARCHAR(50),
    remark VARCHAR(500)
);

CREATE INDEX idx_position_code ON position_info(position_code);
CREATE INDEX idx_position_level ON position_info(position_level);
CREATE INDEX idx_department ON position_info(department);
CREATE INDEX idx_position_status ON position_info(status);
```

#### 3.2.2 岗位能力权重配置表 (position_ability_weight)

```sql
CREATE TABLE position_ability_weight (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL,
    ability_dimension VARCHAR(100) NOT NULL,
    ability_tag VARCHAR(100) NOT NULL,
    weight REAL NOT NULL,  -- 权重(0-100)
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(50),
    FOREIGN KEY (position_id) REFERENCES position_info(id)
);

CREATE INDEX idx_weight_position_id ON position_ability_weight(position_id);
CREATE INDEX idx_ability_dimension ON position_ability_weight(ability_dimension);
```

#### 3.2.3 岗位要求配置表 (position_requirement)

```sql
CREATE TABLE position_requirement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL,
    requirement_type VARCHAR(20) NOT NULL,  -- mandatory-硬性要求，suggested-建议要求
    requirement_item VARCHAR(100) NOT NULL,
    requirement_value VARCHAR(200),
    operator VARCHAR(20),  -- >=, <=, =, 包含
    deduction_score REAL,  -- 扣分值(仅建议要求)
    deduction_limit REAL,  -- 扣分上限(仅建议要求)
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(50),
    FOREIGN KEY (position_id) REFERENCES position_info(id)
);

CREATE INDEX idx_requirement_position_id ON position_requirement(position_id);
CREATE INDEX idx_requirement_type ON position_requirement(requirement_type);
```

### 3.3 匹配分析相关表

#### 3.3.1 匹配结果表 (match_result)

```sql
CREATE TABLE match_result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL,
    cadre_id INTEGER NOT NULL,
    base_score REAL,
    deduction_score REAL DEFAULT 0,
    final_score REAL,
    match_level VARCHAR(20),  -- excellent-优质(>=80)，qualified-合格(>=60)，unqualified-不合格(<60)
    is_meet_mandatory INTEGER DEFAULT 1,  -- 1-是，0-否
    match_detail TEXT,  -- JSON格式
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES position_info(id),
    FOREIGN KEY (cadre_id) REFERENCES cadre_basic_info(id)
);

CREATE INDEX idx_match_position_id ON match_result(position_id);
CREATE INDEX idx_match_cadre_id ON match_result(cadre_id);
CREATE INDEX idx_final_score ON match_result(final_score);
CREATE INDEX idx_match_create_time ON match_result(create_time);
```

#### 3.3.2 匹配分析报告表 (match_report)

```sql
CREATE TABLE match_report (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_result_id INTEGER NOT NULL,
    report_type VARCHAR(50),  -- detail-详细分析，compare-多岗位对比
    advantage TEXT,
    weakness TEXT,
    unmet_requirements TEXT,
    suggestions TEXT,
    radar_data TEXT,  -- JSON格式
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(50),
    FOREIGN KEY (match_result_id) REFERENCES match_result(id)
);

CREATE INDEX idx_report_match_result_id ON match_report(match_result_id);
```

### 3.4 系统配置表

#### 3.4.1 能力标签字典表 (ability_tag_dict)

```sql
CREATE TABLE ability_tag_dict (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_layer VARCHAR(50) NOT NULL,  -- quality-素质层，capability-能力层，trait-特质层，experience-经验层
    tag_dimension VARCHAR(100) NOT NULL,
    tag_code VARCHAR(50) NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    tag_desc TEXT,
    score_standard TEXT,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,  -- 1-启用，0-停用
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tag_layer ON ability_tag_dict(tag_layer);
CREATE INDEX idx_tag_dimension ON ability_tag_dict(tag_dimension);
CREATE INDEX idx_dict_status ON ability_tag_dict(status);
```

#### 3.4.2 特质字典表 (trait_dict)

```sql
CREATE TABLE trait_dict (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trait_type VARCHAR(50) NOT NULL,  -- personality-性格特质，management-管理风格，communication-沟通风格，decision-决策偏向
    trait_code VARCHAR(50) NOT NULL,
    trait_name VARCHAR(100) NOT NULL,
    trait_desc VARCHAR(500),
    applicable_scene TEXT,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,  -- 1-启用，0-停用
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dict_trait_type ON trait_dict(trait_type);
CREATE INDEX idx_trait_dict_status ON trait_dict(status);
```

#### 3.4.3 操作日志表 (operation_log)

```sql
CREATE TABLE operation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module VARCHAR(50) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,  -- create-新增，update-修改，delete-删除，query-查询
    operation_desc VARCHAR(500),
    request_method VARCHAR(10),
    request_url VARCHAR(500),
    request_param TEXT,
    response_result TEXT,
    operator VARCHAR(100),
    operation_ip VARCHAR(50),
    operation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    cost_time INTEGER
);

CREATE INDEX idx_log_module ON operation_log(module);
CREATE INDEX idx_log_operation_type ON operation_log(operation_type);
CREATE INDEX idx_log_operation_time ON operation_log(operation_time);
CREATE INDEX idx_log_operator ON operation_log(operator);
```

## 四、核心功能模块

### 4.1 干部信息管理模块

**功能描述：**
- 干部基础信息的CRUD操作
- 干部动态信息（培训、项目、绩效、奖惩、职务变更）管理
- 干部特质标注与管理
- 干部能力评估与打分
- 干部信息导入导出

**REST API接口：**
```python
# 干部管理API (app/api/cadre.py)

# 获取干部列表
GET /api/cadres
Query参数: page, page_size, name, status, department
Response: { code, message, data: { items, total, page, page_size } }

# 获取干部详情
GET /api/cadres/<int:id>
Response: { code, message, data: { ... } }

# 新增干部
POST /api/cadres
Request Body: { employee_no, name, birth_date, gender, ... }
Response: { code, message, data: { id, ... } }

# 更新干部信息
PUT /api/cadres/<int:id>
Request Body: { name, birth_date, gender, ... }
Response: { code, message, data: { ... } }

# 删除干部
DELETE /api/cadres/<int:id>
Response: { code, message }

# 获取干部特质
GET /api/cadres/<int:id>/traits
Response: { code, message, data: [ ... ] }

# 更新干部特质
PUT /api/cadres/<int:id>/traits
Request Body: { traits: [ { trait_type, trait_value, ... } ] }
Response: { code, message }

# 获取干部能力评分
GET /api/cadres/<int:id>/abilities
Response: { code, message, data: [ ... ] }

# 更新干部能力评分
PUT /api/cadres/<int:id>/abilities
Request Body: { abilities: [ { ability_tag, score, ... } ] }
Response: { code, message }

# 批量导入干部
POST /api/cadres/import
Request Body: multipart/form-data (file)
Response: { code, message, data: { success_count, error_count, errors } }

# 导出干部信息
GET /api/cadres/export
Query参数: format (xlsx/csv)
Response: 文件流
```

### 4.2 岗位画像管理模块

**功能描述：**
- 岗位信息的CRUD操作
- 岗位能力权重配置
- 岗位硬性要求与建议要求配置
- 岗位信息变更历史记录

**REST API接口：**
```python
# 岗位管理API (app/api/position.py)

# 获取岗位列表
GET /api/positions
Query参数: page, page_size, position_level, department, status
Response: { code, message, data: { items, total, page, page_size } }

# 获取岗位详情
GET /api/positions/<int:id>
Response: { code, message, data: { ... } }

# 新增岗位
POST /api/positions
Request Body: { position_code, position_name, position_level, ... }
Response: { code, message, data: { id, ... } }

# 更新岗位信息
PUT /api/positions/<int:id>
Request Body: { position_name, position_level, ... }
Response: { code, message, data: { ... } }

# 删除岗位
DELETE /api/positions/<int:id>
Response: { code, message }

# 获取岗位能力权重
GET /api/positions/<int:id>/weights
Response: { code, message, data: [ ... ] }

# 更新岗位能力权重
PUT /api/positions/<int:id>/weights
Request Body: { weights: [ { ability_dimension, ability_tag, weight } ] }
Response: { code, message }

# 获取岗位要求
GET /api/positions/<int:id>/requirements
Response: { code, message, data: { mandatory: [ ... ], suggested: [ ... ] } }

# 更新岗位要求
PUT /api/positions/<int:id>/requirements
Request Body: { mandatory: [ ... ], suggested: [ ... ] }
Response: { code, message }
```

### 4.3 干部岗位匹配分析模块

**功能描述：**
- 自动计算干部与岗位的匹配度
- 生成匹配度排名
- 生成详细匹配分析报告
- 多岗位对比分析

**REST API接口：**
```python
# 匹配分析API (app/api/match.py)

# 计算单个干部与岗位的匹配度
POST /api/match/calculate
Request Body: { cadre_id, position_id }
Response: { code, message, data: { match_result, score, level, ... } }

# 批量计算匹配度（岗位 vs 所有干部）
POST /api/match/batch-calculate
Request Body: { position_id }
Response: { code, message, data: { position_id, results: [ ... ] } }

# 获取岗位的匹配结果列表
GET /api/match/results
Query参数: position_id, cadre_id, match_level, page, page_size
Response: { code, message, data: { items, total, page, page_size } }

# 获取匹配结果详情
GET /api/match/results/<int:id>
Response: { code, message, data: { ... } }

# 生成分析报告
GET /api/match/results/<int:id>/report
Response: { code, message, data: { advantage, weakness, suggestions, ... } }

# 多岗位对比分析
POST /api/match/compare
Request Body: { cadre_id, position_ids: [ ... ] }
Response: { code, message, data: { comparison: [ ... ], ranking: [ ... ] } }

# 导出匹配结果
POST /api/match/export
Request Body: { position_id, format }
Response: 文件流
```

### 4.4 前端路由配置

```typescript
// src/router/index.tsx - React Router配置
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'cadre',
        children: [
          { index: true, element: <CadreList /> },
          { path: 'create', element: <CadreCreate /> },
          { path: ':id', element: <CadreDetail /> },
          { path: ':id/edit', element: <CadreEdit /> },
          { path: ':id/trait', element: <CadreTrait /> },
          { path: ':id/ability', element: <CadreAbility /> },
        ],
      },
      {
        path: 'position',
        children: [
          { index: true, element: <PositionList /> },
          { path: 'create', element: <PositionCreate /> },
          { path: ':id', element: <PositionDetail /> },
          { path: ':id/edit', element: <PositionEdit /> },
          { path: ':id/weight', element: <PositionWeight /> },
        ],
      },
      {
        path: 'match',
        children: [
          { index: true, element: <MatchAnalysis /> },
          { path: 'results', element: <MatchResult /> },
          { path: 'results/:id', element: <MatchReport /> },
          { path: 'compare', element: <MatchCompare /> },
        ],
      },
    ],
  },
]);

export default router;
```

## 五、关键技术说明

### 5.1 匹配度计算算法

```python
# cadre-model-backend/app/services/match_service.py

from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.cadre import CadreAbilityScore
from app.models.position import PositionAbilityWeight
from app.models.match import MatchResult

class MatchCalculateService:

    def calculate(self, cadre_id: int, position_id: int, db: Session) -> MatchResult:
        """
        计算干部与岗位的匹配度

        Args:
            cadre_id: 干部ID
            position_id: 岗位ID
            db: 数据库会话

        Returns:
            匹配结果对象
        """
        # 1. 获取干部能力评分
        cadre_scores = self._get_cadre_ability_scores(cadre_id, db)

        # 2. 获取岗位能力权重
        position_weights = self._get_position_weights(position_id, db)

        # 3. 计算基础得分 = Σ(干部某能力维度得分 × 该维度岗位权重)
        base_score = self._calculate_base_score(cadre_scores, position_weights)

        # 4. 检查硬性要求
        meet_mandatory = self._check_mandatory_requirements(cadre_id, position_id, db)

        # 5. 计算建议要求扣分
        deduction_score = self._calculate_deduction(cadre_id, position_id, db)

        # 6. 计算最终得分
        final_score = base_score - deduction_score

        # 7. 确定匹配等级
        match_level = self._determine_match_level(final_score)

        # 8. 构建匹配结果
        return MatchResult(
            cadre_id=cadre_id,
            position_id=position_id,
            base_score=base_score,
            deduction_score=deduction_score,
            final_score=final_score,
            match_level=match_level,
            is_meet_mandatory=1 if meet_mandatory else 0
        )

    def _determine_match_level(self, score: float) -> str:
        """
        确定匹配等级

        Args:
            score: 最终得分

        Returns:
            匹配等级字符串
        """
        if score >= 80:
            return "excellent"  # 优质匹配
        elif score >= 60:
            return "qualified"  # 合格匹配
        else:
            return "unqualified"  # 不合格匹配

    def _calculate_base_score(
        self,
        cadre_scores: List[CadreAbilityScore],
        position_weights: List[PositionAbilityWeight]
    ) -> float:
        """
        计算基础得分

        Args:
            cadre_scores: 干部能力评分列表
            position_weights: 岗位能力权重列表

        Returns:
            基础得分
        """
        # 构建干部能力评分字典 {ability_tag: score}
        cadre_score_dict = {score.ability_tag: score.score for score in cadre_scores}

        # 计算加权得分
        total_score = 0.0
        for weight in position_weights:
            cadre_score = cadre_score_dict.get(weight.ability_tag, 0)
            # 将1-5分转换为百分制 (score/5 * 100 * weight/100)
            weighted_score = (cadre_score / 5) * weight.weight
            total_score += weighted_score

        return round(total_score, 2)

    def _check_mandatory_requirements(
        self,
        cadre_id: int,
        position_id: int,
        db: Session
    ) -> bool:
        """
        检查是否满足硬性要求

        Args:
            cadre_id: 干部ID
            position_id: 岗位ID
            db: 数据库会话

        Returns:
            是否满足硬性要求
        """
        # TODO: 实现硬性要求检查逻辑
        # 1. 获取岗位的硬性要求
        # 2. 获取干部的相关信息
        # 3. 逐一验证是否满足
        return True

    def _calculate_deduction(
        self,
        cadre_id: int,
        position_id: int,
        db: Session
    ) -> float:
        """
        计算建议要求扣分

        Args:
            cadre_id: 干部ID
            position_id: 岗位ID
            db: 数据库会话

        Returns:
            扣分分数
        """
        # TODO: 实现建议要求扣分逻辑
        # 1. 获取岗位的建议要求
        # 2. 检查干部是否满足
        # 3. 计算累计扣分（不超过扣分上限）
        return 0.0

    def _get_cadre_ability_scores(
        self,
        cadre_id: int,
        db: Session
    ) -> List[CadreAbilityScore]:
        """获取干部能力评分"""
        return db.query(CadreAbilityScore).filter(
            CadreAbilityScore.cadre_id == cadre_id
        ).all()

    def _get_position_weights(
        self,
        position_id: int,
        db: Session
    ) -> List[PositionAbilityWeight]:
        """获取岗位能力权重"""
        return db.query(PositionAbilityWeight).filter(
            PositionAbilityWeight.position_id == position_id
        ).all()
```

### 5.2 数据校验规则

- **硬性要求校验**：任一硬性要求不满足则返回不符合
- **权重总和校验**：岗位能力权重总和必须为100%
- **评分范围校验**：能力评分为1-5分
- **数据完整性校验**：必填字段不能为空

## 六、安全与权限

### 6.1 数据权限

- 按部门控制数据可见范围
- 敏感信息加密存储（如身份证号）
- 操作日志完整记录

### 6.2 认证与授权

**后端认证：**
- JWT (JSON Web Token) 用户认证
- 基于装饰器的权限控制
- CORS跨域配置
- API请求频率限制

```python
# cadre-model-backend/app/utils/decorators.py
from functools import wraps
from flask import request, jsonify
import jwt

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'code': 401, 'message': '缺少认证token'}), 401

        try:
            data = jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=['HS256'])
        except:
            return jsonify({'code': 401, 'message': 'token无效'}), 401

        return f(*args, **kwargs)
    return decorated_function
```

**前端认证：**
- Token存储在localStorage
- axios拦截器自动添加token
- 路由守卫保护需要登录的页面
- 401自动跳转登录页

### 6.3 数据验证

**后端验证：**
- 使用Marshmallow进行数据序列化和验证
- 请求参数验证
- 字段级验证规则
- 自定义验证器

```python
# cadre-model-backend/app/schemas/cadre_schema.py
from marshmallow import Schema, fields, validate, validates, ValidationError

class CadreSchema(Schema):
    id = fields.Int(dump_only=True)
    employee_no = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    birth_date = fields.Date(allow_none=True)
    age = fields.Int(allow_none=True, validate=validate.Range(min=0, max=100))
    gender = fields.Str(allow_none=True, validate=validate.OneOf(['男', '女']))
    status = fields.Int(missing=1, validate=validate.OneOf([1, 2, 3]))

    @validates('employee_no')
    def validate_employee_no(self, value):
        # 检查工号唯一性
        from app.models.cadre import CadreBasicInfo
        if CadreBasicInfo.query.filter_by(employee_no=value).first():
            raise ValidationError('工号已存在')
```

**前端验证：**
- Ant Design表单验证
- TypeScript类型检查
- 自定义验证规则
- 实时验证反馈

```typescript
// cadre-model-frontend/src/utils/validators.ts
export const validators = {
  required: (message: string) => ({
    required: true,
    message,
  }),

  employeeNo: () => ({
    pattern: /^[A-Z0-9]{4,20}$/,
    message: '工号为4-20位大写字母或数字',
  }),

  phone: () => ({
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入正确的手机号',
  }),

  email: () => ({
    type: 'email' as const,
    message: '请输入正确的邮箱地址',
  }),
};
```

## 七、部署架构

### 7.1 开发环境

```
┌─────────────────────────────────────────────────────────────────┐
│                     前端开发服务器                              │
│                  (Vite Dev Server)                              │
│                   http://localhost:5173                         │
│      热更新(HMR) + 代理到后端 API                               │
└─────────────────────────────────────────────────────────────────┘
                              │ Proxy
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     后端开发服务器                              │
│                    (Flask Dev Server)                           │
│                   http://localhost:5000                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SQLite 数据库文件                             │
│                (cadre-model-backend/data/cadre_model.db)                    │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 生产环境

```
┌─────────────────────────────────────────────────────────────────┐
│                      Nginx 反向代理                             │
│                     (静态资源服务)                               │
│                   https://example.com                           │
│   │                                                              │
│   ├── /static/*     → 前端构建产物 (React静态文件)              │
│   │                                                              │
│   └── /api/*        → 反向代理到后端                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Gunicorn/WSGI                              │
│                   后端应用服务器                                 │
│                   http://127.0.0.1:8000                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SQLite 数据库文件                             │
│                /var/data/cadre_model.db                         │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 前端环境变量配置

```bash
# frontend/.env.development
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_TITLE=干部全量模型平台

# frontend/.env.production
VITE_API_BASE_URL=https://example.com/api
VITE_APP_TITLE=干部全量模型平台
```

### 7.4 后端环境变量配置

```bash
# backend/.env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=sqlite:///data/cadre_model.db

# CORS配置 (开发环境允许前端跨域)
FRONTEND_URL=http://localhost:5173
```

## 八、开发环境配置

### 8.1 后端Python依赖 (cadre-model-backend/requirements.txt)

```
# Web框架
Flask==3.0.0
Werkzeug==3.0.1
Flask-CORS==4.0.0

# 数据库
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.5

# 数据验证
marshmallow==3.20.1

# 其他工具
python-dotenv==1.0.0
openpyxl==3.1.2
```

### 8.2 后端配置 (cadre-model-backend/config.py)

```python
import os
from datetime import timedelta

class Config:
    """基础配置"""
    # 密钥配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    # 数据库配置
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(BASE_DIR, 'data', 'cadre_model.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # CORS配置
    CORS_ORIGINS = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    # 文件上传配置
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'data', 'uploads')

    # 分页配置
    ITEMS_PER_PAGE = 20

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

### 8.3 后端应用工厂 (cadre-model-backend/app/__init__.py)

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name='default'):
    """应用工厂函数"""
    app = Flask(__name__)

    # 加载配置
    from config import config
    app.config.from_object(config[config_name])

    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)

    # 配置CORS
    CORS(app, origins=app.config['CORS_ORIGINS'])

    # 注册API蓝图
    from app.api import cadre_bp, position_bp, match_bp
    app.register_blueprint(cadre_bp, url_prefix='/api')
    app.register_blueprint(position_bp, url_prefix='/api')
    app.register_blueprint(match_bp, url_prefix='/api')

    # 注册错误处理器
    from app.utils.handlers import register_error_handlers
    register_error_handlers(app)

    # 创建必要目录
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app
```

### 8.4 前端依赖 (cadre-model-frontend/package.json)

```json
{
  "name": "cadre-model-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^2.0.1",
    "react-redux": "^9.0.4",
    "antd": "^5.12.0",
    "@ant-design/icons": "^5.2.6",
    "axios": "^1.6.2",
    "dayjs": "^1.11.10",
    "echarts": "^5.4.3",
    "echarts-for-react": "^3.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

### 8.5 前端Vite配置 (cadre-model-frontend/vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

### 8.6 前端API客户端配置 (cadre-model-frontend/src/services/api.ts)

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 跳转登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 8.7 前端RTK Query API配置 (cadre-model-frontend/src/store/services/api.ts)

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Cadre', 'Position', 'Match'],
  endpoints: () => ({}),
});
```

### 8.8 后端应用入口 (cadre-model-backend/run.py)

```python
import os
from app import create_app

# 从环境变量获取配置环境，默认为development
config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config_name)

if __name__ == '__main__':
    # 开发环境使用内置服务器
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 8.9 前端应用入口 (cadre-model-frontend/src/main.tsx)

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from './store';
import router from './router';
import { RouterProvider } from 'react-router-dom';
import './assets/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);
```

### 8.10 前端根组件 (cadre-model-frontend/src/App.tsx)

```typescript
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

const { Content } = Layout;

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Layout>
        <Sidebar />
        <Content style={{ padding: '24px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
```

### 8.11 开发启动命令

**后端启动：**
```bash
# 进入后端目录
cd cadre-model-backend

# 安装依赖
pip install -r requirements.txt

# 初始化数据库（首次运行或需要重置数据库时执行）
python init_db.py

# 启动开发服务器
python run.py
# 或使用 flask 命令
flask run
```

**前端启动：**
```bash
# 进入前端目录
cd cadre-model-frontend

# 安装依赖
npm install
# 或使用 pnpm
pnpm install

# 启动开发服务器
npm run dev
```

**生产构建：**
```bash
# 前端构建
cd cadre-model-frontend
npm run build

# 后端启动 (使用gunicorn)
cd cadre-model-backend
gunicorn -w 4 -b 0.0.0.0:8000 run:app
```

### 8.12 数据库初始化脚本 (cadre-model-backend/init_db.py)

**功能说明：**
- 初始化数据库表结构
- 创建初始管理员账号（账号：admin，密码：Aa123456）
- 初始化系统基础数据（能力标签字典、特质字典等）
- 支持重复执行，每次执行会重新初始化数据库

**使用方法：**
```bash
# 进入后端目录
cd cadre-model-backend

# 执行数据库初始化
python init_db.py
```

**注意事项：**
- 执行此脚本会清空并重建所有数据表，请谨慎使用
- 仅在首次部署或需要完全重置数据库时使用
- 生产环境使用前请备份重要数据

## 九、附录

### 9.1 能力维度映射表

| 能力层级 | 维度 | 标签示例 |
|---------|------|---------|
| 素质层 | 政治素养 | 政治判断力、政策执行力、廉洁自律 |
| 素质层 | 职业素养 | 责任心、敬业度、保密意识 |
| 能力层 | 领导力 | 战略思维、团队建设、跨部门协同 |
| 能力层 | 专业能力 | 业务精通度、数字化能力、创新突破 |
| 能力层 | 执行力 | 任务完成率、应急处突、成本控制 |
| 特质层 | 个性特质 | 抗压能力、情绪稳定性、责任心、适应性 |
| 特质层 | 潜力 | 学习敏锐度、成长意愿、未来胜任力 |
| 经验层 | 履历与业绩 | 行业经验、管理年限、重大项目经验、业绩贡献 |

### 9.2 特质类型映射表

| 特质类型 | 说明 | 可选值 |
|---------|------|--------|
| 性格特质 | 反映内在心理倾向 | 沉稳型、积极型、坚韧型、细致型、开拓型 |
| 管理风格 | 反映带领团队的方式 | 指令型、赋能型、协作型、结果导向型、教练型 |
| 沟通风格 | 反映信息传递方式 | 直接型、委婉型、综合型、数据型、故事型 |
| 决策偏向 | 反映制定决策的思维倾向 | 稳健型、果断型、谨慎型、创新型、务实型 |

---

**文档版本：** v2.0
**创建日期：** 2026-01-05
**更新日期：** 2026-01-06
**架构变更：** 前后端分离架构（React + Flask + SQLite）
**维护者：** 开发团队
