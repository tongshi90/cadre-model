from flask import request, g
import jwt
from datetime import datetime, timedelta
from marshmallow import ValidationError
from app.api import system_bp
from app import db
from app.models.system import User
from app.models.cadre import CadreBasicInfo
from app.schemas.system_schema import LoginSchema, UserCreateSchema
from app.utils.helpers import success_response, error_response
from app.utils.decorators import log_operation, token_required
from flask import current_app
import re


@system_bp.route('/auth/login', methods=['POST'])
@log_operation('system', 'create')
def login():
    """用户登录 - 支持管理员登录和人才登录"""
    try:
        schema = LoginSchema()
        data = schema.load(request.json)

        # 先尝试管理员登录
        user = User.query.filter_by(username=data['username']).first()

        if user and user.check_password(data['password']):
            if user.status != 1:
                return error_response('账号已被停用', 403)

            # 更新登录信息
            user.last_login_time = datetime.now()
            user.last_login_ip = request.remote_addr
            db.session.commit()

            # 生成token - 管理员用户
            token = jwt.encode({
                'user_id': user.id,
                'username': user.username,
                'is_admin': user.is_admin,
                'user_type': 'admin',
                'exp': datetime.now() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
            }, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

            user_dict = user.to_dict()
            user_dict['user_type'] = 'admin'

            return success_response({
                'token': token,
                'user': user_dict
            }, '登录成功')

        # 再尝试人才登录（手机号作为账号）
        cadre = CadreBasicInfo.query.filter_by(phone=data['username']).first()

        if cadre and cadre.password and cadre.check_password(data['password']):
            if cadre.status != 1:
                return error_response('账号已被停用', 403)

            # 生成token - 人才用户
            token = jwt.encode({
                'user_id': cadre.id,
                'username': cadre.name,
                'user_type': 'cadre',
                'cadre_id': cadre.id,
                'exp': datetime.now() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
            }, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

            # 构造人才用户信息
            cadre_user_info = {
                'id': cadre.id,
                'username': cadre.phone,
                'real_name': cadre.name,
                'user_type': 'cadre',
                'cadre_id': cadre.id
            }

            return success_response({
                'token': token,
                'user': cadre_user_info
            }, '登录成功')

        return error_response('用户名或密码错误', 401)

    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except Exception as e:
        return error_response(str(e), 500)


@system_bp.route('/auth/user', methods=['GET'])
def get_current_user():
    """获取当前用户信息"""
    try:
        token = request.headers.get('Authorization')
        if not token:
            return error_response('未登录', 401)

        if token.startswith('Bearer '):
            token = token.split(' ')[1]

        data = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )

        user = User.query.get(data['user_id'])
        if not user:
            return error_response('用户不存在', 404)

        return success_response(user.to_dict())
    except jwt.ExpiredSignatureError:
        return error_response('token已过期', 401)
    except jwt.InvalidTokenError:
        return error_response('token无效', 401)
    except Exception as e:
        return error_response(str(e), 500)


@system_bp.route('/users', methods=['POST'])
def create_user():
    """创建用户"""
    try:
        schema = UserCreateSchema()
        data = schema.load(request.json)

        # 检查用户名是否存在
        if User.query.filter_by(username=data['username']).first():
            return error_response('用户名已存在', 400)

        user = User()
        user.username = data['username']
        user.set_password(data['password'])
        user.real_name = data.get('real_name')
        user.email = data.get('email')
        user.phone = data.get('phone')
        user.department = data.get('department')
        user.is_admin = data.get('is_admin', 0)

        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)

        return success_response(user.to_dict(), '创建成功', 201)
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except Exception as e:
        return error_response(str(e), 500)


@system_bp.route('/auth/change-password', methods=['POST'])
@token_required
@log_operation('system', 'update')
def change_password():
    """修改密码"""
    try:
        data = request.json
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not old_password or not new_password:
            return error_response('请输入原始密码和新密码', 400)

        # 获取当前用户
        user = User.query.get(g.user_id)
        if not user:
            return error_response('用户不存在', 404)

        # 验证原始密码
        if not user.check_password(old_password):
            return error_response('原始密码错误', 400)

        # 验证新密码长度
        if len(new_password) < 6 or len(new_password) > 18:
            return error_response('新密码长度为6-18位', 400)

        # 验证新密码包含字母和数字
        if not re.search(r'[A-Za-z]', new_password) or not re.search(r'\d', new_password):
            return error_response('新密码需要包含字母和数字', 400)

        # 验证新密码不能与原始密码一致
        if old_password == new_password:
            return error_response('新密码不能与原始密码一致', 400)

        # 更新密码
        user.set_password(new_password)
        db.session.commit()

        return success_response(None, '密码修改成功')
    except Exception as e:
        return error_response(str(e), 500)
