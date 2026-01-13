from marshmallow import Schema, fields, validate


class MatchReportSchema(Schema):
    """匹配分析报告Schema"""
    id = fields.Int(dump_only=True)
    match_result_id = fields.Int(required=True)
    report_type = fields.Str(allow_none=True, validate=validate.OneOf(['detail', 'compare']))
    advantage = fields.Str(allow_none=True)
    weakness = fields.Str(allow_none=True)
    unmet_requirements = fields.Str(allow_none=True)
    suggestions = fields.Str(allow_none=True)
    radar_data = fields.Str(allow_none=True)


class MatchResultSchema(Schema):
    """匹配结果Schema"""
    id = fields.Int(dump_only=True)
    position_id = fields.Int(required=True)
    cadre_id = fields.Int(required=True)
    base_score = fields.Float(allow_none=True)
    deduction_score = fields.Float(allow_none=True)
    final_score = fields.Float(allow_none=True)
    match_level = fields.Str(
        allow_none=True,
        validate=validate.OneOf(['excellent', 'qualified', 'unqualified'])
    )
    is_meet_mandatory = fields.Int(allow_none=True, validate=validate.OneOf([0, 1]))
    match_detail = fields.Str(allow_none=True)

    # 关联数据
    reports = fields.List(fields.Nested(MatchReportSchema), dump_only=True)


class MatchCalculateSchema(Schema):
    """匹配计算请求Schema"""
    cadre_id = fields.Int(required=True)
    position_id = fields.Int(required=True)
    save_to_db = fields.Bool(missing=True)  # 默认为True，保持向后兼容


class BatchMatchCalculateSchema(Schema):
    """批量匹配计算请求Schema"""
    position_id = fields.Int(required=True)


class BatchCadreMatchCalculateSchema(Schema):
    """批量干部匹配计算请求Schema（自定义匹配）"""
    position_id = fields.Int(required=True)
    cadre_ids = fields.List(fields.Int(), required=True)


class MatchCompareSchema(Schema):
    """多岗位对比请求Schema"""
    cadre_id = fields.Int(required=True)
    position_ids = fields.List(fields.Int(), required=True)
