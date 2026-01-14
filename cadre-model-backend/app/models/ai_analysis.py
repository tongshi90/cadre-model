from datetime import datetime
from app import db
from sqlalchemy.orm import relationship


class AIAnalysis(db.Model):
    """干部AI智能分析结果表"""
    __tablename__ = 'ai_analysis'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '干部AI智能分析结果表'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    cadre_id = db.Column(db.Integer, db.ForeignKey('cadre_basic_info.id', ondelete='CASCADE'), nullable=False, comment='干部ID')
    analysis_result = db.Column(db.Text, nullable=False, comment='AI分析结果')
    analysis_data = db.Column(db.Text, nullable=True, comment='分析时使用的干部数据JSON')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='分析时间')
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')

    # 关系
    cadre = relationship('CadreBasicInfo', backref='ai_analyses')

    def to_dict(self):
        return {
            'id': self.id,
            'cadre_id': self.cadre_id,
            'analysis_result': self.analysis_result,
            'analysis_data': self.analysis_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
