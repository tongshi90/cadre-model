# -*- coding: utf-8 -*-
from flask import request
from marshmallow import ValidationError
from app.api import system_bp
from app.services.department_service import DepartmentService
from app.utils.helpers import success_response, error_response
from app.utils.decorators import token_required, log_operation


@system_bp.route('/departments/tree', methods=['GET'])
@token_required
def get_department_tree():
    """获取部门树"""
    try:
        tree = DepartmentService.get_department_tree()
        return success_response(tree)
    except Exception as e:
        return error_response(str(e), 500)


@system_bp.route('/departments/list', methods=['GET'])
@token_required
def get_department_list():
    """获取部门列表"""
    try:
        departments = DepartmentService.get_department_list()
        return success_response([d.to_dict() for d in departments])
    except Exception as e:
        return error_response(str(e), 500)


@system_bp.route('/departments/<int:id>', methods=['GET'])
@token_required
def get_department(id):
    """获取部门详情"""
    try:
        department = DepartmentService.get_department_by_id(id)
        if not department:
            return error_response('部门不存在', 404)
        return success_response(department.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@system_bp.route('/departments', methods=['POST'])
@token_required
@log_operation('department', 'create')
def create_department():
    """新增部门"""
    try:
        data = request.get_json()
        department = DepartmentService.create_department(data)
        return success_response(department.to_dict(), '创建成功', 201)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@system_bp.route('/departments/<int:id>', methods=['PUT'])
@token_required
@log_operation('department', 'update')
def update_department(id):
    """更新部门"""
    try:
        data = request.get_json()
        department = DepartmentService.update_department(id, data)
        if not department:
            return error_response('部门不存在', 404)
        return success_response(department.to_dict())
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@system_bp.route('/departments/<int:id>', methods=['DELETE'])
@token_required
@log_operation('department', 'delete')
def delete_department(id):
    """删除部门（级联删除子部门）"""
    try:
        result = DepartmentService.delete_department(id)
        if not result['success']:
            return error_response(result['message'], 400)
        return success_response(result, result['message'])
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)
