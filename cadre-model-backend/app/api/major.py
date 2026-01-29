# -*- coding: utf-8 -*-
from flask import request
from app.api import major_bp
from app.services.major_service import MajorService
from app.utils.helpers import success_response, error_response
from app.utils.decorators import token_required, log_operation


@major_bp.route('/major/tree', methods=['GET'])
@token_required
def get_major_tree():
    """获取专业树"""
    try:
        tree = MajorService.get_major_tree()
        return success_response(tree)
    except Exception as e:
        return error_response(str(e), 500)


@major_bp.route('/major', methods=['GET'])
@token_required
def get_major_list():
    """获取专业列表"""
    try:
        majors = MajorService.get_major_list()
        return success_response([m.to_dict() for m in majors])
    except Exception as e:
        return error_response(str(e), 500)


@major_bp.route('/major/<int:id>', methods=['GET'])
@token_required
def get_major(id):
    """获取专业详情"""
    try:
        major = MajorService.get_major_by_id(id)
        if not major:
            return error_response('专业不存在', 404)
        return success_response(major.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@major_bp.route('/major', methods=['POST'])
@token_required
@log_operation('major', 'create')
def create_major():
    """新增专业"""
    try:
        data = request.get_json()
        major = MajorService.create_major(data)
        return success_response(major.to_dict(), '创建成功', 201)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@major_bp.route('/major/<int:id>', methods=['PUT'])
@token_required
@log_operation('major', 'update')
def update_major(id):
    """更新专业"""
    try:
        data = request.get_json()
        major = MajorService.update_major(id, data)
        if not major:
            return error_response('专业不存在', 404)
        return success_response(major.to_dict())
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@major_bp.route('/major/<int:id>', methods=['DELETE'])
@token_required
@log_operation('major', 'delete')
def delete_major(id):
    """删除专业（级联删除子专业）"""
    try:
        result = MajorService.delete_major(id)
        if not result['success']:
            return error_response(result['message'], 400)
        return success_response(result, result['message'])
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)
