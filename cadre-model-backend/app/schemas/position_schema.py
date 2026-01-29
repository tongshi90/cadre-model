from marshmallow import Schema, fields, validate, validates, ValidationError


class PositionAbilityWeightSchema(Schema):
    """岗位能力权重Schema"""
    id = fields.Int(dump_only=True)
    position_id = fields.Int(required=False)
    ability_dimension = fields.Str(required=True)
    weight = fields.Float(required=True, validate=validate.Range(min=0, max=100))


class PositionRequirementSchema(Schema):
    """岗位要求Schema"""
    id = fields.Int(dump_only=True)
    position_id = fields.Int(required=False)
    requirement_type = fields.Str(
        required=True,
        validate=validate.OneOf(['mandatory', 'bonus'])
    )
    indicator_type = fields.Str(
        required=True,
        validate=validate.OneOf(['education', 'major', 'certificate', 'experience', 'performance_avg', 'kpi_completion', 'avg_tenure', 'job_hopping_freq', 'project_count'])
    )
    operator = fields.Str(allow_none=True, validate=validate.OneOf(['>=', '<']))
    compare_value = fields.Str(allow_none=True)
    score_value = fields.Float(allow_none=True, validate=validate.Range(min=0))
    sort_order = fields.Int(allow_none=True)
    status = fields.Int(allow_none=True, validate=validate.OneOf([0, 1]))


class PositionSchema(Schema):
    """岗位信息Schema"""
    id = fields.Int(dump_only=True)
    position_code = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    position_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    responsibility = fields.Str(allow_none=True)
    is_key_position = fields.Bool(missing=False)
    status = fields.Int(missing=1, validate=validate.OneOf([0, 1]))
    remark = fields.Str(allow_none=True)

    # 关联数据
    ability_weights = fields.List(fields.Nested(PositionAbilityWeightSchema), dump_only=True)
    requirements = fields.List(fields.Nested(PositionRequirementSchema), dump_only=True)


class PositionCreateSchema(PositionSchema):
    """岗位创建Schema"""
    pass


class PositionUpdateSchema(Schema):
    """岗位更新Schema"""
    position_code = fields.Str(allow_none=True, validate=validate.Length(min=1, max=50))
    position_name = fields.Str(allow_none=True, validate=validate.Length(min=1, max=100))
    responsibility = fields.Str(allow_none=True)
    is_key_position = fields.Bool(allow_none=True)
    status = fields.Int(allow_none=True, validate=validate.OneOf([0, 1]))
    remark = fields.Str(allow_none=True)


# 指标类型配置
INDICATOR_TYPES = {
    'mandatory': [  # 硬性要求可选指标
        {'value': 'education', 'label': '学历'},
        {'value': 'major', 'label': '专业'},
        {'value': 'certificate', 'label': '证书'},
        {'value': 'experience', 'label': '岗位经验年限'},
    ],
    'bonus': [  # 加分项可选指标
        {'value': 'education', 'label': '学历'},
        {'value': 'major', 'label': '专业'},
        {'value': 'certificate', 'label': '证书'},
        {'value': 'experience', 'label': '岗位经验年限'},
        {'value': 'performance_avg', 'label': '最近三年绩效平均分'},
        {'value': 'kpi_completion', 'label': 'KPI达成率'},
        {'value': 'avg_tenure', 'label': '岗位平均任职年限'},
        {'value': 'job_hopping_freq', 'label': '跳槽频率'},
        {'value': 'project_count', 'label': '项目经验数'},
    ]
}

# 学历选项
EDUCATION_OPTIONS = [
    {'value': '博士', 'label': '博士'},
    {'value': '硕士', 'label': '硕士'},
    {'value': '本科', 'label': '本科'},
    {'value': '专科', 'label': '专科'},
    {'value': '高中', 'label': '高中'},
    {'value': '中专', 'label': '中专'},
]

# 操作符选项
OPERATOR_OPTIONS = [
    {'value': '>=', 'label': '大于等于'},
    {'value': '<', 'label': '小于'},
]
