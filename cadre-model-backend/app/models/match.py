from datetime import datetime
from app import db
import json


class MatchResult(db.Model):
    """匹配结果表"""
    __tablename__ = 'match_result'
    __table_args__ = (
        db.Index('idx_cadre_position', 'cadre_id', 'position_id'),
        db.Index('idx_create_time', 'create_time'),
        db.Index('idx_final_score', 'final_score'),
        db.Index('idx_match_level', 'match_level'),
        {'mysql_engine': 'InnoDB', 'mysql_comment': '匹配结果表-存储干部与岗位的匹配分析结果'}
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    position_id = db.Column(db.Integer, db.ForeignKey('position_info.id'), nullable=False, comment='岗位ID')
    cadre_id = db.Column(db.Integer, db.ForeignKey('cadre_basic_info.id'), nullable=False, comment='干部ID')
    base_score = db.Column(db.Float, comment='基础得分')
    deduction_score = db.Column(db.Float, default=0, comment='扣分分数')
    final_score = db.Column(db.Float, comment='最终得分')
    match_level = db.Column(db.String(20), comment='匹配等级：excellent-优质(>=80)，qualified-合格(>=60)，unqualified-不合格(<60)')
    is_meet_mandatory = db.Column(db.Integer, default=1, comment='是否满足硬性要求：1-是，0-否')
    match_detail = db.Column(db.Text, comment='匹配详情(JSON格式)')
    best_match_position_id = db.Column(db.Integer, db.ForeignKey('position_info.id'), comment='最高匹配岗位ID（干部当前岗位匹配时计算）')
    best_match_score = db.Column(db.Float, comment='最高匹配得分（干部当前岗位匹配时计算）')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')

    # 关系
    cadre = db.relationship('CadreBasicInfo', backref='match_results')
    position = db.relationship('PositionInfo', backref='match_results', foreign_keys=[position_id])
    best_match_position = db.relationship('PositionInfo', foreign_keys=[best_match_position_id])
    reports = db.relationship('MatchReport', backref='match_result', cascade='all, delete-orphan')

    def to_dict(self):
        # 优先使用缓存的关联数据（用于未保存到数据库的对象）
        cadre = getattr(self, '_cached_cadre', None) or self.cadre
        position = getattr(self, '_cached_position', None) or self.position

        return {
            'id': self.id,
            'position_id': self.position_id,
            'cadre_id': self.cadre_id,
            'base_score': self.base_score,
            'deduction_score': self.deduction_score,
            'final_score': self.final_score,
            'match_level': self.match_level,
            'is_meet_mandatory': self.is_meet_mandatory,
            'match_detail': json.loads(self.match_detail) if self.match_detail else None,
            'best_match_position_id': self.best_match_position_id,
            'best_match_score': self.best_match_score,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            # 关联数据
            'cadre': cadre.to_dict() if cadre else None,
            'position': position.to_dict() if position else None,
            'best_match_position': self.best_match_position.to_dict() if self.best_match_position else None
        }


class MatchReport(db.Model):
    """匹配分析报告表"""
    __tablename__ = 'match_report'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '匹配分析报告表-存储详细的匹配分析报告和雷达图数据'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    match_result_id = db.Column(db.Integer, db.ForeignKey('match_result.id'), nullable=False, comment='匹配结果ID')
    report_type = db.Column(db.String(50), comment='报告类型：detail-详细分析，compare-多岗位对比')
    advantage = db.Column(db.Text, comment='优势分析')
    weakness = db.Column(db.Text, comment='劣势分析')
    unmet_requirements = db.Column(db.Text, comment='未满足要求')
    suggestions = db.Column(db.Text, comment='建议')
    radar_data = db.Column(db.Text, comment='雷达图数据(JSON格式)')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    create_by = db.Column(db.String(50), comment='创建人')

    def to_dict(self):
        return {
            'id': self.id,
            'match_result_id': self.match_result_id,
            'report_type': self.report_type,
            'advantage': self.advantage,
            'weakness': self.weakness,
            'unmet_requirements': self.unmet_requirements,
            'suggestions': self.suggestions,
            'radar_data': json.loads(self.radar_data) if self.radar_data else None,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'create_by': self.create_by
        }
