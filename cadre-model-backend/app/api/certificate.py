# -*- coding: utf-8 -*-
from flask import request
from app.api import certificate_bp
from app.services.certificate_service import CertificateService
from app.utils.helpers import success_response, error_response
from app.utils.decorators import token_required, log_operation


@certificate_bp.route('/certificate/tree', methods=['GET'])
@token_required
def get_certificate_tree():
    """获取证书树"""
    try:
        tree = CertificateService.get_certificate_tree()
        return success_response(tree)
    except Exception as e:
        return error_response(str(e), 500)


@certificate_bp.route('/certificate', methods=['GET'])
@token_required
def get_certificate_list():
    """获取证书列表"""
    try:
        certificates = CertificateService.get_certificate_list()
        return success_response([c.to_dict() for c in certificates])
    except Exception as e:
        return error_response(str(e), 500)


@certificate_bp.route('/certificate/<int:id>', methods=['GET'])
@token_required
def get_certificate(id):
    """获取证书详情"""
    try:
        certificate = CertificateService.get_certificate_by_id(id)
        if not certificate:
            return error_response('证书不存在', 404)
        return success_response(certificate.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@certificate_bp.route('/certificate', methods=['POST'])
@token_required
@log_operation('certificate', 'create')
def create_certificate():
    """新增证书"""
    try:
        data = request.get_json()
        certificate = CertificateService.create_certificate(data)
        return success_response(certificate.to_dict(), '创建成功', 201)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@certificate_bp.route('/certificate/<int:id>', methods=['PUT'])
@token_required
@log_operation('certificate', 'update')
def update_certificate(id):
    """更新证书"""
    try:
        data = request.get_json()
        certificate = CertificateService.update_certificate(id, data)
        if not certificate:
            return error_response('证书不存在', 404)
        return success_response(certificate.to_dict())
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@certificate_bp.route('/certificate/<int:id>', methods=['DELETE'])
@token_required
@log_operation('certificate', 'delete')
def delete_certificate(id):
    """删除证书（级联删除子证书）"""
    try:
        result = CertificateService.delete_certificate(id)
        if not result['success']:
            return error_response(result['message'], 400)
        return success_response(result, result['message'])
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)
