# cadre-model

#### Introduction
Cadre Full Model Platform is a comprehensive information system for enterprise cadre management, implementing core functions such as cadre information management, position profiling, and cadre-position matching analysis.

#### Software Architecture
The project adopts a frontend-backend separation architecture:

```
Frontend (React 18 + TypeScript + Vite + Ant Design)
    ↓ RESTful API
Backend (Python Flask + SQLAlchemy + Marshmallow)
    ↓ ORM
Database (MySQL 5.7+)
```

**Tech Stack:**
- Backend: Python Flask + SQLAlchemy + MySQL
- Frontend: React 18 + TypeScript + Ant Design + Vite
- State Management: Redux Toolkit
- Routing: React Router v6

#### Installation

**Prerequisites:**
- Python 3.8+
- Node.js 16+
- MySQL 5.7+

**1. Clone the repository**
```bash
git clone <repository-url>
cd cadre-model
```

**2. Backend setup**
```bash
cd cadre-model-backend

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (optional)
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=cadre_model

# Initialize database
python init_db.py

# Start development server
python run.py
```

**3. Frontend setup**
```bash
cd cadre-model-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**4. Access the application**
- Frontend URL: http://localhost:5173
- Backend URL: http://localhost:5000
- Default account: admin / Aa123456

#### Usage

**Main Features:**

1. **Cadre Management**
   - Cadre information entry and management
   - Cadre ability scoring
   - Cadre trait analysis
   - Dynamic information recording (training, projects, performance, etc.)

2. **Position Management**
   - Position information maintenance
   - Position ability weight configuration
   - Position requirement settings

3. **Matching Analysis**
   - Cadre-position matching calculation
   - Matching result analysis report
   - Multi-position comparison analysis

4. **Data Dashboard**
   - Matching trend analysis
   - Team and age structure
   - Position risk analysis
   - Cadre quality portrait
   - Source and flow trends

**Matching Calculation Rules:**
- Base Score = Σ(Ability Dimension Score × Position Weight)
- Unmet mandatory requirements result in direct disqualification
- Unmet suggested requirements result in point deduction
- Final Score = Base Score - Deduction
- Matching Levels: Excellent(≥80), Qualified(≥60), Unqualified(<60)

#### Performance Optimization

To ensure query performance, create database indexes after initial deployment:

```sql
-- match_result table indexes
ALTER TABLE match_result ADD INDEX idx_cadre_position (cadre_id, position_id);
ALTER TABLE match_result ADD INDEX idx_create_time (create_time);
ALTER TABLE match_result ADD INDEX idx_final_score (final_score);
ALTER TABLE match_result ADD INDEX idx_match_level (match_level);

-- cadre_dynamic_info table indexes
ALTER TABLE cadre_dynamic_info ADD INDEX idx_cadre_info_type (cadre_id, info_type);
ALTER TABLE cadre_dynamic_info ADD INDEX idx_cadre_info_type_time (cadre_id, info_type, create_time);
ALTER TABLE cadre_dynamic_info ADD INDEX idx_cadre_type_grade (cadre_id, info_type, assessment_grade);

-- cadre_basic_info table indexes
ALTER TABLE cadre_basic_info ADD INDEX idx_status_position (status, position_id);
ALTER TABLE cadre_basic_info ADD INDEX idx_status_department (status, department_id);
ALTER TABLE cadre_basic_info ADD INDEX idx_management_level (management_level);
```

#### Directory Structure

```
cadre-model/
├── cadre-model-backend/          # Backend project
│   ├── app/
│   │   ├── api/                 # API routing layer
│   │   ├── services/            # Business logic layer
│   │   ├── models/              # Data model layer
│   │   ├── schemas/             # Data validation layer
│   │   └── utils/               # Utility layer
│   ├── config.py                # Configuration file
│   ├── init_db.py               # Database initialization
│   └── run.py                   # Startup file
│
└── cadre-model-frontend/         # Frontend project
    ├── src/
    │   ├── pages/               # Page components
    │   ├── components/          # Common components
    │   ├── services/            # API services
    │   ├── store/               # State management
    │   └── router/              # Routing configuration
    ├── public/                  # Static assets
    └── vite.config.ts           # Vite configuration
```

#### Contributing

1. Fork this repository
2. Create Feat_xxx branch
3. Commit your changes
4. Create Pull Request

#### Development Guidelines

**Backend Development:**
- Follow PEP 8 coding standards
- Use Marshmallow for data validation
- Avoid N+1 queries, use batch queries for performance optimization
- Add indexes for frequently queried fields

**Frontend Development:**
- Use TypeScript type declarations
- Follow React Hooks best practices
- Use functional components
- Consistently use Ant Design component library

#### License

[MIT License](LICENSE)
