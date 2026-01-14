# -*- coding: utf-8 -*-
from datetime import datetime
from app import db


class Department(db.Model):
    """部门表"""
    __tablename__ = 'department'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '部门表-存储组织架构的部门信息，支持树形结构'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, comment='部门名称')
    parent_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=True, comment='父部门ID')
    sort_order = db.Column(db.Integer, default=0, comment='排序')
    status = db.Column(db.Integer, default=1, comment='状态：1-启用，0-停用')
    description = db.Column(db.Text, comment='描述')
    employee_count = db.Column(db.Integer, default=0, comment='员工数量')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    create_by = db.Column(db.String(50), comment='创建人')
    update_by = db.Column(db.String(50), comment='更新人')
    remark = db.Column(db.String(500), comment='备注')

    # 自引用关系
    children = db.relationship(
        'Department',
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
            'employee_count': self.employee_count,
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
            for child in self.children.filter_by(status=1).order_by(Department.sort_order).all():
                children_list.append(child.to_tree_dict(include_children=True))
            result['children'] = children_list
        return result
