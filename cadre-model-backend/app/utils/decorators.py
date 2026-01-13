import functools
import time
import json
from flask import request, g, jsonify
from flask import current_app
import jwt


def token_required(f):
    """Token认证装饰器"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'code': 401, 'message': '缺少认证token'}), 401

        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            data = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            g.user_id = data.get('user_id')
            g.username = data.get('username')
            g.is_admin = data.get('is_admin', 0)
        except jwt.ExpiredSignatureError:
            return jsonify({'code': 401, 'message': 'token已过期'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'code': 401, 'message': 'token无效'}), 401
        except Exception as e:
            return jsonify({'code': 401, 'message': f'token验证失败: {str(e)}'}), 401

        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """管理员权限装饰器"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if not getattr(g, 'is_admin', 0):
            return jsonify({'code': 403, 'message': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated_function


def log_operation(module, operation_type):
    """操作日志装饰器"""
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = time.time()

            # 执行原函数
            response = f(*args, **kwargs)

            # 计算耗时
            cost_time = int((time.time() - start_time) * 1000)

            # TODO: 调试阶段暂时禁用日志保存到数据库，正式上线时启用
            # # 记录日志（异步处理，不影响接口响应）
            # try:
            #     from app import db
            #     from app.models.system import OperationLog
            #
            #     # 获取请求参数（安全处理）
            #     request_params = {}
            #     try:
            #         if request.args:
            #             request_params.update(request.args.to_dict())
            #         if request.is_json:
            #             if request.json:
            #                 request_params.update(request.json)
            #     except:
            #         pass
            #
            #     # 获取响应数据（安全处理）
            #     response_data = None
            #     try:
            #         if hasattr(response, 'data'):
            #             response_data = json.dumps(response.data)
            #         elif isinstance(response, tuple) and len(response) > 0:
            #             # 尝试获取响应的 JSON 数据
            #             resp_obj = response[0]
            #             if hasattr(resp_obj, 'json'):
            #                 response_data = json.dumps(resp_obj.json)
            #     except:
            #         pass
            #
            #     log = OperationLog(
            #         module=module,
            #         operation_type=operation_type,
            #         operation_desc=f.__doc__ or f.__name__,
            #         request_method=request.method,
            #         request_url=request.path,
            #         request_param=json.dumps(request_params, ensure_ascii=False),
            #         response_result=response_data,
            #         operator=getattr(g, 'username', None),
            #         operation_ip=request.remote_addr,
            #         cost_time=cost_time
            #     )
            #     db.session.add(log)
            #     db.session.commit()
            # except Exception as e:
            #     # 日志记录失败不影响业务
            #     db.session.rollback()

            return response
        return decorated_function
    return decorator
