from datetime import datetime
from app import db


class WeeklyReport(db.Model):
    """公司周报表"""
    __tablename__ = 'weekly_report'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '公司周报表-保存公司周报信息'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    content = db.Column(db.Text, nullable=False, comment='周报内容')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
