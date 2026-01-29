from datetime import datetime
from app import db


class PositionInfo(db.Model):
    """岗位信息表"""
    __tablename__ = 'position_info'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '岗位信息表-存储岗位的基本信息、编制、职责等'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    position_code = db.Column(db.String(50), nullable=False, comment='岗位编码')
    position_name = db.Column(db.String(100), nullable=False, comment='岗位名称')
    responsibility = db.Column(db.Text, comment='岗位职责')
    is_key_position = db.Column(db.Boolean, default=False, comment='是否关键岗位：0-否，1-是')
    status = db.Column(db.Integer, default=1, comment='状态：1-启用，0-停用')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    create_by = db.Column(db.String(50), comment='创建人')
    update_by = db.Column(db.String(50), comment='更新人')
    remark = db.Column(db.String(500), comment='备注')

    # 关系
    ability_weights = db.relationship('PositionAbilityWeight', backref='position', cascade='all, delete-orphan')
    requirements = db.relationship('PositionRequirement', backref='position', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'position_code': self.position_code,
            'position_name': self.position_name,
            'responsibility': self.responsibility,
            'is_key_position': self.is_key_position,
            'status': self.status,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
            'create_by': self.create_by,
            'update_by': self.update_by,
            'remark': self.remark
        }


class PositionAbilityWeight(db.Model):
    """岗位能力权重配置表"""
    __tablename__ = 'position_ability_weight'
    __table_args__ = (
        db.UniqueConstraint('position_id', 'ability_dimension', name='uq_position_dimension'),
        {'mysql_engine': 'InnoDB', 'mysql_comment': '岗位能力权重配置表-配置各岗位在不同能力维度上的权重'}
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    position_id = db.Column(db.Integer, db.ForeignKey('position_info.id'), nullable=False, comment='岗位ID')
    ability_dimension = db.Column(db.String(100), nullable=False, comment='能力维度')
    weight = db.Column(db.Float, nullable=False, comment='权重(0-100)')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    update_by = db.Column(db.String(50), comment='更新人')

    def to_dict(self):
        return {
            'id': self.id,
            'position_id': self.position_id,
            'ability_dimension': self.ability_dimension,
            'weight': self.weight,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
            'update_by': self.update_by
        }


class PositionRequirement(db.Model):
    """岗位要求配置表"""
    __tablename__ = 'position_requirement'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '岗位要求配置表-配置岗位的硬性要求和加分项'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    position_id = db.Column(db.Integer, db.ForeignKey('position_info.id'), nullable=False, comment='岗位ID')
    requirement_type = db.Column(db.String(20), nullable=False, comment='要求分类：mandatory-硬性要求，bonus-加分项')
    indicator_type = db.Column(db.String(50), nullable=False, comment='指标类型：education-学历，major-专业，certificate-证书，experience-岗位经验年限，performance_avg-最近三年绩效平均分，kpi_completion-KPI达成率，avg_tenure-岗位平均任职年限，job_hopping_freq-跳槽频率，project_count-项目经验数')
    operator = db.Column(db.String(10), default='>=', comment='操作符：>= 或 <')
    compare_value = db.Column(db.String(500), comment='比较值（用于数值比较或存储ID列表，JSON格式）')
    score_value = db.Column(db.Float, comment='分值（仅加分项使用）')
    sort_order = db.Column(db.Integer, default=0, comment='排序')
    status = db.Column(db.Integer, default=1, comment='状态：1-启用，0-停用')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    update_by = db.Column(db.String(50), comment='更新人')

    def to_dict(self):
        return {
            'id': self.id,
            'position_id': self.position_id,
            'requirement_type': self.requirement_type,
            'indicator_type': self.indicator_type,
            'operator': self.operator,
            'compare_value': self.compare_value,
            'score_value': self.score_value,
            'sort_order': self.sort_order,
            'status': self.status,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
            'update_by': self.update_by
        }
