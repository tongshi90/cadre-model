from marshmallow import Schema, fields, validate, validates, ValidationError


class PositionAbilityWeightSchema(Schema):
    """岗位能力权重Schema"""
    id = fields.Int(dump_only=True)
    position_id = fields.Int(required=False)  # 改为非必填，因为已经在URL路径中
    ability_dimension = fields.Str(required=True)
    weight = fields.Float(required=True, validate=validate.Range(min=0, max=100))


class PositionRequirementSchema(Schema):
    """岗位要求Schema"""
    id = fields.Int(dump_only=True)
    position_id = fields.Int(required=True)
    requirement_type = fields.Str(
        required=True,
        validate=validate.OneOf(['mandatory', 'suggested'])
    )
    requirement_item = fields.Str(required=True)
    requirement_value = fields.Str(allow_none=True)
    operator = fields.Str(allow_none=True, validate=validate.OneOf(['>=', '<=', '=', '包含', '不包含']))
    deduction_score = fields.Float(allow_none=True, validate=validate.Range(min=0))
    deduction_limit = fields.Float(allow_none=True, validate=validate.Range(min=0))


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
