from datetime import datetime
from app import db


class CadreBasicInfo(db.Model):
    """干部基础信息表"""
    __tablename__ = 'cadre_basic_info'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '干部基础信息表-存储干部的基本信息'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    employee_no = db.Column(db.String(50), nullable=False, unique=True, comment='工号')
    name = db.Column(db.String(100), nullable=False, comment='姓名')
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'), comment='部门ID')
    position_id = db.Column(db.Integer, db.ForeignKey('position_info.id'), comment='岗位ID')
    job_grade = db.Column(db.Integer, comment='岗级')
    management_level = db.Column(db.String(20), comment='管理层级：基层、中层、经营层、战略层')
    management_attribution = db.Column(db.String(50), comment='管理归属：集团直管干部、体系直管干部')
    gender = db.Column(db.String(10), comment='性别')
    birth_date = db.Column(db.Date, comment='出生日期')
    graduated_school = db.Column(db.String(200), comment='毕业院校')
    education = db.Column(db.String(50), comment='学历：大专、本科、硕士、博士')
    political_status = db.Column(db.String(50), comment='政治面貌')
    entry_date = db.Column(db.Date, comment='入职时间')
    work_province = db.Column(db.String(100), comment='工作省份')
    student_soldier_class = db.Column(db.Integer, comment='学生兵级届')
    is_dispatched = db.Column(db.Boolean, default=False, comment='是否外派')
    status = db.Column(db.Integer, default=1, comment='状态：1-在职，2-离职，3-退休')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')

    # 关系
    department = db.relationship('Department', backref='cadres')
    position = db.relationship('PositionInfo', backref='cadres')
    dynamic_infos = db.relationship('CadreDynamicInfo', backref='cadre', cascade='all, delete-orphan')
    traits = db.relationship('CadreTrait', backref='cadre', cascade='all, delete-orphan')
    ability_scores = db.relationship('CadreAbilityScore', backref='cadre', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'employee_no': self.employee_no,
            'name': self.name,
            'department_id': self.department_id,
            'department': self.department.to_dict() if self.department else None,
            'position_id': self.position_id,
            'position': self.position.to_dict() if self.position else None,
            'job_grade': self.job_grade,
            'management_level': self.management_level,
            'management_attribution': self.management_attribution,
            'gender': self.gender,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'graduated_school': self.graduated_school,
            'education': self.education,
            'political_status': self.political_status,
            'entry_date': self.entry_date.isoformat() if self.entry_date else None,
            'work_province': self.work_province,
            'student_soldier_class': self.student_soldier_class,
            'is_dispatched': self.is_dispatched,
            'status': self.status,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None
        }


class CadreDynamicInfo(db.Model):
    """干部动态信息表"""
    __tablename__ = 'cadre_dynamic_info'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '干部动态信息表-存储培训、项目、绩效、奖惩、职务变更等动态信息'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cadre_id = db.Column(db.Integer, db.ForeignKey('cadre_basic_info.id'), nullable=False, comment='干部ID')
    info_type = db.Column(db.Integer, nullable=False, comment='信息类型：1-培训记录，2-项目经历，3-绩效数据，4-奖惩记录，5-职务变更，6-工作经历')

    # 工作经历字段
    work_start_date = db.Column(db.Date, comment='工作开始日期')
    work_end_date = db.Column(db.Date, comment='工作结束日期')
    work_company = db.Column(db.String(200), comment='工作单位')
    work_position = db.Column(db.String(100), comment='工作岗位')

    # 培训记录字段
    training_name = db.Column(db.String(200), comment='培训名称')
    training_date = db.Column(db.Date, comment='培训日期')
    training_content = db.Column(db.Text, comment='培训内容')
    training_result = db.Column(db.String(100), comment='培训结果')

    # 项目经历字段
    project_no = db.Column(db.String(50), comment='项目编号')
    project_name = db.Column(db.String(200), comment='项目名称')
    project_role = db.Column(db.String(100), comment='项目角色')
    project_start_date = db.Column(db.Date, comment='项目开始日期')
    project_end_date = db.Column(db.Date, comment='项目结束日期')
    project_result = db.Column(db.Text, comment='项目结果')
    project_rating = db.Column(db.String(50), comment='项目评级')
    is_core_project = db.Column(db.Boolean, default=False, comment='是否核心项目')

    # 绩效数据字段
    assessment_cycle = db.Column(db.String(50), comment='考核周期')
    assessment_dimension = db.Column(db.String(200), comment='考核维度')
    assessment_grade = db.Column(db.String(10), comment='考核等级：S、A、B+、B、B-、C')
    assessment_comment = db.Column(db.Text, comment='考核评价')

    # 奖惩记录字段
    reward_type = db.Column(db.String(50), comment='奖惩类型')
    reward_reason = db.Column(db.Text, comment='奖惩原因')
    reward_date = db.Column(db.Date, comment='奖惩日期')

    # 职务变更字段
    position_name = db.Column(db.String(100), comment='职务名称')
    responsibility = db.Column(db.Text, comment='职责描述')
    appointment_type = db.Column(db.String(50), comment='任命类型')
    term_start_date = db.Column(db.Date, comment='任期开始日期')
    term_end_date = db.Column(db.Date, comment='任期结束日期')
    approval_record = db.Column(db.Text, comment='审批记录')

    # 通用字段
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    remark = db.Column(db.String(500), comment='备注')

    def to_dict(self):
        return {
            'id': self.id,
            'cadre_id': self.cadre_id,
            'info_type': self.info_type,
            'work_start_date': self.work_start_date.isoformat() if self.work_start_date else None,
            'work_end_date': self.work_end_date.isoformat() if self.work_end_date else None,
            'work_company': self.work_company,
            'work_position': self.work_position,
            'training_name': self.training_name,
            'training_date': self.training_date.isoformat() if self.training_date else None,
            'training_content': self.training_content,
            'training_result': self.training_result,
            'project_no': self.project_no,
            'project_name': self.project_name,
            'project_role': self.project_role,
            'project_start_date': self.project_start_date.isoformat() if self.project_start_date else None,
            'project_end_date': self.project_end_date.isoformat() if self.project_end_date else None,
            'project_result': self.project_result,
            'project_rating': self.project_rating,
            'is_core_project': self.is_core_project,
            'assessment_cycle': self.assessment_cycle,
            'assessment_dimension': self.assessment_dimension,
            'assessment_grade': self.assessment_grade,
            'assessment_comment': self.assessment_comment,
            'reward_type': self.reward_type,
            'reward_reason': self.reward_reason,
            'reward_date': self.reward_date.isoformat() if self.reward_date else None,
            'position_name': self.position_name,
            'responsibility': self.responsibility,
            'appointment_type': self.appointment_type,
            'term_start_date': self.term_start_date.isoformat() if self.term_start_date else None,
            'term_end_date': self.term_end_date.isoformat() if self.term_end_date else None,
            'approval_record': self.approval_record,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'remark': self.remark
        }


class CadreTrait(db.Model):
    """干部特质表"""
    __tablename__ = 'cadre_trait'
    __table_args__ = (
        db.UniqueConstraint('cadre_id', 'trait_type', name='uq_cadre_trait'),
        {'mysql_engine': 'InnoDB', 'mysql_comment': '干部特质表-存储干部的性格特质、管理风格、沟通风格、决策偏向等特质分析'}
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cadre_id = db.Column(db.Integer, db.ForeignKey('cadre_basic_info.id'), nullable=False, comment='干部ID')
    trait_type = db.Column(db.String(50), nullable=False, comment='特质类型：性格特质、管理风格、沟通风格、决策偏向')
    trait_value = db.Column(db.String(50), nullable=False, comment='特质值')
    trait_desc = db.Column(db.String(200), comment='特质描述')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    update_by = db.Column(db.String(50), comment='更新人')

    def to_dict(self):
        return {
            'id': self.id,
            'cadre_id': self.cadre_id,
            'trait_type': self.trait_type,
            'trait_value': self.trait_value,
            'trait_desc': self.trait_desc,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
            'update_by': self.update_by
        }


class CadreAbilityScore(db.Model):
    """干部能力评分表"""
    __tablename__ = 'cadre_ability_score'
    __table_args__ = (
        db.UniqueConstraint('cadre_id', 'ability_tag', name='uq_cadre_ability'),
        {'mysql_engine': 'InnoDB', 'mysql_comment': '干部能力评分表-存储干部在各能力维度上的评分情况'}
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cadre_id = db.Column(db.Integer, db.ForeignKey('cadre_basic_info.id'), nullable=False, comment='干部ID')
    ability_dimension = db.Column(db.String(100), nullable=False, comment='能力维度')
    ability_tag = db.Column(db.String(100), nullable=False, comment='能力标签')
    score = db.Column(db.Float, nullable=False, comment='评分(1-5，支持小数)')
    assessor = db.Column(db.String(100), comment='评估人')
    assessment_date = db.Column(db.Date, comment='评估日期')
    comment = db.Column(db.Text, comment='评估意见')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    update_by = db.Column(db.String(50), comment='更新人')

    def to_dict(self):
        return {
            'id': self.id,
            'cadre_id': self.cadre_id,
            'ability_dimension': self.ability_dimension,
            'ability_tag': self.ability_tag,
            'score': self.score,
            'assessor': self.assessor,
            'assessment_date': self.assessment_date.isoformat() if self.assessment_date else None,
            'comment': self.comment,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
            'update_by': self.update_by
        }
