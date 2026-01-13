from flask import request
from marshmallow import ValidationError
from app.api import match_bp
from app.services.match_service import MatchService
from app.schemas.match_schema import (
    MatchCalculateSchema,
    BatchMatchCalculateSchema,
    BatchCadreMatchCalculateSchema,
    MatchCompareSchema
)
from app.utils.helpers import success_response, error_response, paginate_response
from app.utils.decorators import token_required, log_operation


@match_bp.route('/match/calculate', methods=['POST'])
@token_required
@log_operation('match', 'create')
def calculate_match():
    """计算单个干部与岗位的匹配度"""
    try:
        schema = MatchCalculateSchema()
        data = schema.load(request.json)

        result = MatchService.calculate(
            data['cadre_id'],
            data['position_id'],
            data.get('save_to_db', True)
        )
        return success_response(result.to_dict(), '计算成功')
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/batch-calculate', methods=['POST'])
@token_required
@log_operation('match', 'create')
def batch_calculate_match():
    """批量计算匹配度（岗位 vs 所有干部）"""
    try:
        schema = BatchMatchCalculateSchema()
        data = schema.load(request.json)

        results = MatchService.batch_calculate(data['position_id'])
        return success_response({
            'position_id': data['position_id'],
            'results': [r.to_dict() for r in results]
        }, '计算成功')
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/batch-calculate-cadres', methods=['POST'])
@token_required
@log_operation('match', 'create')
def batch_calculate_cadres():
    """批量计算多个干部与岗位的匹配度（自定义匹配，不保存到数据库，只返回必要字段）"""
    try:
        schema = BatchCadreMatchCalculateSchema()
        data = schema.load(request.json)

        results = MatchService.batch_calculate_cadres(data['position_id'], data['cadre_ids'])
        return success_response({
            'position_id': data['position_id'],
            'results': results  # 已经是字典列表，不需要再调用 to_dict()
        }, '计算成功')
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/results', methods=['GET'])
@token_required
@log_operation('match', 'query')
def get_match_results():
    """获取匹配结果列表"""
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
        position_id = int(request.args.get('position_id')) if request.args.get('position_id') else None
        cadre_id = int(request.args.get('cadre_id')) if request.args.get('cadre_id') else None
        match_level = request.args.get('match_level')

        result = MatchService.get_match_results(position_id, cadre_id, match_level, page, page_size)
        return paginate_response(**result)
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/results/<int:id>', methods=['GET'])
@token_required
@log_operation('match', 'query')
def get_match_result(id):
    """获取匹配结果详情"""
    try:
        result = MatchService.get_match_result_by_id(id)
        if not result:
            return error_response('匹配结果不存在', 404)
        return success_response(result.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/results/current-position', methods=['GET'])
@token_required
@log_operation('match', 'query')
def get_current_position_match_results():
    """获取干部当前岗位匹配结果（优化查询）"""
    try:
        results = MatchService.get_current_position_match_results()
        return success_response(results, '获取成功')
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/results/<int:id>/report', methods=['GET'])
@token_required
@log_operation('match', 'create')
def generate_match_report(id):
    """生成分析报告"""
    try:
        report = MatchService.generate_report(id)
        return success_response(report.to_dict(), '生成成功')
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/compare', methods=['POST'])
@token_required
@log_operation('match', 'create')
def compare_positions():
    """多岗位对比分析"""
    try:
        schema = MatchCompareSchema()
        data = schema.load(request.json)

        result = MatchService.compare_positions(data['cadre_id'], data['position_ids'])
        return success_response(result, '对比成功')
    except ValidationError as e:
        return error_response('数据验证失败', 400, e.messages)
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/batch-calculate-current', methods=['POST'])
@token_required
@log_operation('match', 'create')
def batch_calculate_current_position():
    """批量计算干部当前岗位匹配度"""
    try:
        results = MatchService.batch_calculate_current_position()
        return success_response({
            'total': len(results),
            'results': [r.to_dict() for r in results]
        }, '计算成功')
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/statistics', methods=['GET'])
@token_required
@log_operation('match', 'query')
def get_match_statistics():
    """获取匹配度统计数据"""
    try:
        statistics = MatchService.get_match_statistics()
        return success_response(statistics, '获取成功')
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/age-structure', methods=['GET'])
@token_required
@log_operation('match', 'query')
def get_age_structure_statistics():
    """获取年龄段统计数据"""
    try:
        statistics = MatchService.get_age_structure_statistics()
        return success_response(statistics, '获取成功')
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/age-structure-details', methods=['GET'])
@token_required
@log_operation('match', 'query')
def get_age_structure_details():
    """获取年龄段详情数据（包含人员信息）"""
    try:
        details = MatchService.get_age_structure_details()
        return success_response(details, '获取成功')
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/position-risk', methods=['GET'])
@token_required
@log_operation('match', 'query')
def get_position_risk():
    """获取关键岗位风险数据"""
    try:
        risk_data = MatchService.get_position_risk()
        return success_response(risk_data, '获取成功')
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/quality-portrait', methods=['GET'])
@token_required
@log_operation('match', 'query')
def get_quality_portrait():
    """获取干部质量画像数据"""
    try:
        quality_data = MatchService.get_quality_portrait()
        return success_response(quality_data, '获取成功')
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/source-and-flow', methods=['GET'])
@token_required
@log_operation('match', 'query')
def get_source_and_flow_statistics():
    """获取干部来源与流动情况统计数据"""
    try:
        statistics = MatchService.get_source_and_flow_statistics()
        return success_response(statistics, '获取成功')
    except Exception as e:
        return error_response(str(e), 500)


@match_bp.route('/match/flow-cadres-details', methods=['GET'])
@token_required
@log_operation('match', 'query')
def get_flow_cadres_details():
    """获取流动干部详情列表"""
    try:
        year = int(request.args.get('year')) if request.args.get('year') else None
        source_type = request.args.get('source_type')

        result = MatchService.get_flow_cadres_details(year, source_type)
        return success_response(result, '获取成功')
    except Exception as e:
        return error_response(str(e), 500)
