from marshmallow import Schema, fields, validate, EXCLUDE


class MajorSchema(Schema):
    """专业Schema"""
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    parent_id = fields.Int(allow_none=True)
    sort_order = fields.Int(allow_none=True)
    status = fields.Int(allow_none=True)
    description = fields.Str(allow_none=True)

    # 关联数据
    children = fields.List(fields.Nested('self'), dump_only=True)


class MajorCreateSchema(MajorSchema):
    """专业创建Schema"""
    pass


class MajorUpdateSchema(MajorSchema):
    """专业更新Schema"""
    class Meta:
        unknown = EXCLUDE

    name = fields.Str(allow_none=True, validate=validate.Length(min=1, max=100))
    parent_id = fields.Int(allow_none=True)
    sort_order = fields.Int(allow_none=True)
    status = fields.Int(allow_none=True)
    description = fields.Str(allow_none=True)
