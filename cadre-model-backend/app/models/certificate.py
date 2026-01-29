# -*- coding: utf-8 -*-
from datetime import datetime
from app import db


class Certificate(db.Model):
    """证书表 - 两层树形结构：第一层为证书类型，第二层为证书名"""
    __tablename__ = 'certificate'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '证书表-存储证书类型和证书名称信息，固定两层树形结构'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, comment='证书名称（证书类型或证书名）')
    parent_id = db.Column(db.Integer, db.ForeignKey('certificate.id'), nullable=True, comment='父级ID（NULL表示证书类型，非NULL表示证书名）')
    sort_order = db.Column(db.Integer, default=0, comment='排序')
    status = db.Column(db.Integer, default=1, comment='状态：1-启用，0-停用')
    description = db.Column(db.Text, comment='描述')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    create_by = db.Column(db.String(50), comment='创建人')
    update_by = db.Column(db.String(50), comment='更新人')
    remark = db.Column(db.String(500), comment='备注')

    # 自引用关系
    children = db.relationship(
        'Certificate',
        backref=db.backref('parent', remote_side=[id]),
        lazy='dynamic'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'parent_id': self.parent_id,
            'sort_order': self.sort_order,
            'status': self.status,
            'description': self.description,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
            'create_by': self.create_by,
            'update_by': self.update_by,
            'remark': self.remark
        }

    def to_tree_dict(self, include_children=True):
        """转换为树形结构字典"""
        result = self.to_dict()
        if include_children:
            children_list = []
            for child in self.children.filter_by(status=1).order_by(Certificate.sort_order).all():
                children_list.append(child.to_tree_dict(include_children=True))
            result['children'] = children_list
        return result
