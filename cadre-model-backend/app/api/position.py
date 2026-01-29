from flask import request
from marshmallow import ValidationError
from app.api import position_bp
from app.services.position_service import PositionService
from app.schemas.position_schema import (
    PositionSchema,
    PositionCreateSchema,
    PositionUpdateSchema,
    PositionAbilityWeightSchema,
    PositionRequirementSchema,
    INDICATOR_TYPES,
    EDUCATION_OPTIONS,
    OPERATOR_OPTIONS
)
from app.utils.helpers import success_response, error_response, paginate_response
from app.utils.decorators import token_required, log_operation


@position_bp.route('/positions', methods=['GET'])
@token_required
@log_operation('position', 'query')
def get_positions():
    """获取岗位列表"""
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
        position_name = request.args.get('position_name')
        position_level = request.args.get('position_level')
        status = int(request.args.get('status')) if request.args.get('status') else None

        result = PositionService.get_position_list(page, page_size, position_name, position_level, status)
        return paginate_response(**result)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/positions/all', methods=['GET'])
@token_required
@log_operation('position', 'query')
def get_all_positions():
    """获取所有启用的岗位"""
    try:
        positions = PositionService.get_all_positions()
        # 返回包含权重信息的岗位数据
        result = []
        for p in positions:
            position_dict = p.to_dict()
            # 添加权重信息
            weights = PositionService.get_position_weights(p.id)
            position_dict['ability_weights'] = [w.to_dict() for w in weights]
            result.append(position_dict)
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/positions/<int:id>', methods=['GET'])
@token_required
@log_operation('position', 'query')
def get_position(id):
    """获取岗位详情"""
    try:
        position = PositionService.get_position_by_id(id)
        if not position:
            return error_response('岗位不存在', 404)
        return success_response(position.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/positions', methods=['POST'])
@token_required
@log_operation('position', 'create')
def create_position():
    """新增岗位"""
    try:
        schema = PositionCreateSchema()
        data = schema.load(request.json)

        position = PositionService.create_position(data)
        return success_response(position.to_dict(), '创建成功', 201)
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/positions/<int:id>', methods=['PUT'])
@token_required
@log_operation('position', 'update')
def update_position(id):
    """更新岗位信息"""
    try:
        schema = PositionUpdateSchema()
        data = schema.load(request.json)

        position = PositionService.update_position(id, data)
        if not position:
            return error_response('岗位不存在', 404)
        return success_response(position.to_dict())
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/positions/<int:id>', methods=['DELETE'])
@token_required
@log_operation('position', 'delete')
def delete_position(id):
    """删除岗位"""
    try:
        if not PositionService.delete_position(id):
            return error_response('岗位不存在', 404)
        return success_response(None, '删除成功')
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/positions/<int:id>/weights', methods=['GET'])
@token_required
@log_operation('position', 'query')
def get_position_weights(id):
    """获取岗位能力权重"""
    try:
        weights = PositionService.get_position_weights(id)
        return success_response([w.to_dict() for w in weights])
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/positions/<int:id>/weights', methods=['PUT'])
@token_required
@log_operation('position', 'update')
def update_position_weights(id):
    """更新岗位能力权重"""
    try:
        weights_data = request.json.get('weights', [])

        # 添加position_id到每条记录
        for weight_data in weights_data:
            weight_data['position_id'] = id

        schema = PositionAbilityWeightSchema(many=True)
        data = schema.load(weights_data)

        PositionService.update_position_weights(id, data)
        return success_response(None, '更新成功')
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/positions/<int:id>/requirements', methods=['GET'])
@token_required
@log_operation('position', 'query')
def get_position_requirements(id):
    """获取岗位要求"""
    try:
        requirements = PositionService.get_position_requirements(id)
        return success_response(requirements)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/positions/<int:id>/requirements', methods=['PUT'])
@token_required
@log_operation('position', 'update')
def update_position_requirements(id):
    """更新岗位要求"""
    try:
        requirements = request.json.get('requirements', [])
        PositionService.update_position_requirements(id, requirements)
        return success_response(None, '更新成功')
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/metadata/majors', methods=['GET'])
@token_required
def get_majors():
    """获取专业列表（用于岗位要求配置）"""
    try:
        majors = PositionService.get_major_list()
        return success_response(majors)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/metadata/certificates', methods=['GET'])
@token_required
def get_certificates():
    """获取证书列表（用于岗位要求配置）"""
    try:
        certificates = PositionService.get_certificate_list()
        return success_response(certificates)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/metadata/indicator-types', methods=['GET'])
@token_required
def get_indicator_types():
    """获取指标类型配置"""
    try:
        return success_response(INDICATOR_TYPES)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/metadata/education-options', methods=['GET'])
@token_required
def get_education_options():
    """获取学历选项"""
    try:
        return success_response(EDUCATION_OPTIONS)
    except Exception as e:
        return error_response(str(e), 500)


@position_bp.route('/metadata/operator-options', methods=['GET'])
@token_required
def get_operator_options():
    """获取操作符选项"""
    try:
        return success_response(OPERATOR_OPTIONS)
    except Exception as e:
        return error_response(str(e), 500)
