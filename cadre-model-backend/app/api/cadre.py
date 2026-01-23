from flask import request, jsonify
from marshmallow import ValidationError
from app.api import cadre_bp
from app.services.cadre_service import CadreService
from app.schemas.cadre_schema import (
    CadreSchema,
    CadreCreateSchema,
    CadreUpdateSchema,
    CadreTraitSchema,
    CadreAbilityScoreSchema,
    CadreDynamicInfoSchema
)
from app.utils.helpers import success_response, error_response, paginate_response
from app.utils.decorators import token_required, log_operation


@cadre_bp.route('/cadres', methods=['GET'])
@token_required
@log_operation('cadre', 'query')
def get_cadres():
    """获取干部列表"""
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
        name = request.args.get('name')
        status = int(request.args.get('status')) if request.args.get('status') else None
        department = request.args.get('department')

        result = CadreService.get_cadre_list(page, page_size, name, status, department)
        return paginate_response(**result)
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/<int:id>', methods=['GET'])
@token_required
@log_operation('cadre', 'query')
def get_cadre(id):
    """获取干部详情"""
    try:
        cadre = CadreService.get_cadre_by_id(id)
        if not cadre:
            return error_response('干部不存在', 404)
        return success_response(cadre.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres', methods=['POST'])
@token_required
@log_operation('cadre', 'create')
def create_cadre():
    """新增干部"""
    try:
        schema = CadreCreateSchema()
        data = schema.load(request.json)

        cadre = CadreService.create_cadre(data)
        return success_response(cadre.to_dict(), '创建成功', 201)
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/<int:id>', methods=['PUT'])
@token_required
@log_operation('cadre', 'update')
def update_cadre(id):
    """更新干部信息"""
    try:
        schema = CadreUpdateSchema()
        data = schema.load(request.json)

        cadre = CadreService.update_cadre(id, data)
        if not cadre:
            return error_response('干部不存在', 404)
        return success_response(cadre.to_dict())
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/<int:id>', methods=['DELETE'])
@token_required
@log_operation('cadre', 'delete')
def delete_cadre(id):
    """删除干部"""
    try:
        if not CadreService.delete_cadre(id):
            return error_response('干部不存在', 404)
        return success_response(None, '删除成功')
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/<int:id>/traits', methods=['GET'])
@token_required
@log_operation('cadre', 'query')
def get_cadre_traits(id):
    """获取干部特质"""
    try:
        traits = CadreService.get_cadre_traits(id)
        return success_response([t.to_dict() for t in traits])
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/<int:id>/traits', methods=['PUT'])
@token_required
@log_operation('cadre', 'update')
def update_cadre_traits(id):
    """更新干部特质"""
    try:
        schema = CadreTraitSchema(many=True)
        # 将cadre_id注入到每个特质对象中
        traits_data = request.json.get('traits', [])
        for trait_data in traits_data:
            trait_data['cadre_id'] = id
        data = schema.load(traits_data)

        CadreService.update_cadre_traits(id, data)
        return success_response(None, '更新成功')
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/<int:id>/abilities', methods=['GET'])
@token_required
@log_operation('cadre', 'query')
def get_cadre_abilities(id):
    """获取干部能力评分"""
    try:
        abilities = CadreService.get_cadre_abilities(id)
        return success_response([a.to_dict() for a in abilities])
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/<int:id>/abilities', methods=['PUT'])
@token_required
@log_operation('cadre', 'update')
def update_cadre_abilities(id):
    """更新干部能力评分"""
    try:
        from flask import g
        schema = CadreAbilityScoreSchema(many=True)
        # 将cadre_id注入到每个能力评分对象中
        abilities_data = request.json.get('abilities', [])
        for ability_data in abilities_data:
            ability_data['cadre_id'] = id
        data = schema.load(abilities_data)

        # 传递当前登录用户信息
        current_user = getattr(g, 'username', None)
        CadreService.update_cadre_abilities(id, data, current_user)
        return success_response(None, '更新成功')
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/<int:id>/dynamic-info', methods=['POST'])
@token_required
@log_operation('cadre', 'create')
def add_dynamic_info(id):
    """添加动态信息"""
    try:
        import logging
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        logger.info(f"收到动态信息创建请求，数据: {request.json}")

        schema = CadreDynamicInfoSchema()
        # 先将cadre_id添加到请求数据中
        data = request.json.copy() if request.json else {}
        data['cadre_id'] = id
        validated_data = schema.load(data)

        logger.info(f"Schema验证后的数据: {validated_data}")

        info = CadreService.add_dynamic_info(id, validated_data)
        return success_response(info.to_dict(), '添加成功', 201)
    except ValidationError as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"数据验证失败: {e.messages}")
        return error_response('数据验证失败', 400, e.messages)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"添加动态信息失败: {str(e)}")
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/<int:id>/dynamic-info', methods=['GET'])
@token_required
@log_operation('cadre', 'query')
def get_dynamic_info_list(id):
    """获取干部动态信息列表"""
    try:
        info_type = int(request.args.get('info_type')) if request.args.get('info_type') else None
        dynamic_infos = CadreService.get_cadre_dynamic_info(id, info_type)
        return success_response([info.to_dict() for info in dynamic_infos])
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/dynamic-info/<int:info_id>', methods=['PUT'])
@token_required
@log_operation('cadre', 'update')
def update_dynamic_info(info_id):
    """更新动态信息"""
    try:
        schema = CadreDynamicInfoSchema()
        data = schema.load(request.json, partial=True)

        info = CadreService.update_dynamic_info(info_id, data)
        if not info:
            return error_response('动态信息不存在', 404)
        return success_response(info.to_dict())
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/dynamic-info/<int:info_id>', methods=['DELETE'])
@token_required
@log_operation('cadre', 'delete')
def delete_dynamic_info(info_id):
    """删除动态信息"""
    try:
        if not CadreService.delete_dynamic_info(info_id):
            return error_response('动态信息不存在', 404)
        return success_response(None, '删除成功')
    except Exception as e:
        return error_response(str(e), 500)


@cadre_bp.route('/cadres/<int:id>/change-password', methods=['POST'])
@token_required
@log_operation('cadre', 'update')
def change_cadre_password(id):
    """修改人才密码"""
    try:
        from flask import g
        data = request.json
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not old_password or not new_password:
            return error_response('请输入原始密码和新密码', 400)

        # 获取人才信息
        from app.models.cadre import CadreBasicInfo
        from app import db

        cadre = CadreBasicInfo.query.get(id)
        if not cadre:
            return error_response('人才不存在', 404)

        # 验证原始密码
        if not cadre.password or not cadre.check_password(old_password):
            return error_response('原始密码错误', 400)

        # 验证新密码长度
        if len(new_password) < 6 or len(new_password) > 18:
            return error_response('新密码长度为6-18位', 400)

        # 验证新密码包含字母和数字
        import re
        if not re.search(r'[A-Za-z]', new_password) or not re.search(r'\d', new_password):
            return error_response('新密码需要包含字母和数字', 400)

        # 验证新密码不能与原始密码一致
        if old_password == new_password:
            return error_response('新密码不能与原始密码一致', 400)

        # 更新密码
        cadre.set_password(new_password)
        db.session.commit()

        return success_response(None, '密码修改成功')
    except Exception as e:
        return error_response(str(e), 500)
