# -*- coding: utf-8 -*-
from datetime import datetime
from app import db


class OperationLog(db.Model):
    """操作日志表"""
    __tablename__ = 'operation_log'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '操作日志表-记录系统操作日志用于审计和追溯'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    module = db.Column(db.String(50), nullable=False, comment='模块')
    operation_type = db.Column(db.String(50), nullable=False, comment='操作类型：create-新增，update-修改，delete-删除，query-查询')
    operation_desc = db.Column(db.String(500), comment='操作描述')
    request_method = db.Column(db.String(10), comment='请求方法')
    request_url = db.Column(db.String(500), comment='请求URL')
    request_param = db.Column(db.Text, comment='请求参数')
    response_result = db.Column(db.Text, comment='响应结果')
    operator = db.Column(db.String(100), comment='操作人')
    operation_ip = db.Column(db.String(50), comment='操作IP')
    operation_time = db.Column(db.DateTime, default=datetime.now, comment='操作时间')
    cost_time = db.Column(db.Integer, comment='耗时(ms)')

    def to_dict(self):
        return {
            'id': self.id,
            'module': self.module,
            'operation_type': self.operation_type,
            'operation_desc': self.operation_desc,
            'request_method': self.request_method,
            'request_url': self.request_url,
            'request_param': self.request_param,
            'response_result': self.response_result,
            'operator': self.operator,
            'operation_ip': self.operation_ip,
            'operation_time': self.operation_time.isoformat() if self.operation_time else None,
            'cost_time': self.cost_time
        }


class User(db.Model):
    """用户表"""
    __tablename__ = 'user'
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_comment': '用户表-存储系统用户信息和认证信息'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), nullable=False, unique=True, comment='用户名')
    password_hash = db.Column(db.String(255), nullable=False, comment='密码哈希')
    real_name = db.Column(db.String(100), comment='真实姓名')
    email = db.Column(db.String(100), comment='邮箱')
    phone = db.Column(db.String(20), comment='手机号')
    department = db.Column(db.String(100), comment='部门')
    status = db.Column(db.Integer, default=1, comment='状态：1-启用，0-停用')
    is_admin = db.Column(db.Integer, default=0, comment='是否管理员：1-是，0-否')
    create_time = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    last_login_time = db.Column(db.DateTime, comment='最后登录时间')
    last_login_ip = db.Column(db.String(50), comment='最后登录IP')

    def set_password(self, password):
        """设置密码"""
        import bcrypt
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        """验证密码"""
        import bcrypt
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'real_name': self.real_name,
            'email': self.email,
            'phone': self.phone,
            'department': self.department,
            'status': self.status,
            'is_admin': self.is_admin,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
            'last_login_time': self.last_login_time.isoformat() if self.last_login_time else None,
            'last_login_ip': self.last_login_ip
        }
