from flask import jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError


def register_error_handlers(app):
    """注册错误处理器"""

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'code': 400, 'message': '请求参数错误'}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'code': 401, 'message': '未授权访问'}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'code': 403, 'message': '禁止访问'}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'code': 404, 'message': '资源不存在'}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({'code': 405, 'message': '请求方法不允许'}), 405

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({'code': 500, 'message': '服务器内部错误'}), 500

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({'code': 400, 'message': '数据验证失败', 'errors': error.messages}), 400

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        return jsonify({'code': 400, 'message': '数据完整性错误，可能存在重复数据'}), 400

    @app.errorhandler(Exception)
    def handle_exception(error):
        import traceback
        app.logger.error(f'Unhandled exception: {str(error)}\n{traceback.format_exc()}')
        return jsonify({'code': 500, 'message': f'服务器错误: {str(error)}'}), 500
