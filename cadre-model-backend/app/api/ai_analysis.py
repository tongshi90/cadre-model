from datetime import datetime
from flask import request, g
from app.api import ai_analysis_bp
from app import db
from app.models.ai_analysis import AIAnalysis
from app.utils.helpers import success_response, error_response
from app.utils.decorators import token_required, log_operation


@ai_analysis_bp.route('/ai-analysis/<int:cadre_id>', methods=['GET'])
def get_ai_analysis(cadre_id):
    """获取干部的AI分析结果"""
    from app.models.cadre import CadreBasicInfo

    # 检查干部是否存在
    cadre = CadreBasicInfo.query.get(cadre_id)
    if not cadre:
        return error_response('干部不存在', 404)

    # 获取最新的AI分析结果
    analysis = AIAnalysis.query.filter_by(cadre_id=cadre_id).order_by(
        AIAnalysis.created_at.desc()
    ).first()

    if not analysis:
        return error_response('未找到AI分析结果', 404)

    return success_response(analysis.to_dict(), '获取成功')


@ai_analysis_bp.route('/ai-analysis', methods=['POST'])
@token_required
@log_operation('ai_analysis', 'create')
def save_ai_analysis():
    """保存或更新干部的AI分析结果"""
    from app.models.cadre import CadreBasicInfo

    data = request.get_json()
    cadre_id = data.get('cadre_id')
    analysis_result = data.get('analysis_result')
    analysis_data = data.get('analysis_data')

    if not cadre_id or not analysis_result:
        return error_response('缺少必要参数', 400)

    # 检查干部是否存在
    cadre = CadreBasicInfo.query.get(cadre_id)
    if not cadre:
        return error_response('干部不存在', 404)

    # 查找是否已存在该干部的AI分析记录
    analysis = AIAnalysis.query.filter_by(cadre_id=cadre_id).first()

    if analysis:
        # 更新现有记录
        analysis.analysis_result = analysis_result
        analysis.analysis_data = analysis_data
        analysis.updated_at = datetime.now()
    else:
        # 创建新记录
        analysis = AIAnalysis(
            cadre_id=cadre_id,
            analysis_result=analysis_result,
            analysis_data=analysis_data
        )
        db.session.add(analysis)

    try:
        db.session.commit()
        return success_response(analysis.to_dict(), '保存成功', 201)
    except Exception as e:
        db.session.rollback()
        return error_response(f'保存失败: {str(e)}', 500)
