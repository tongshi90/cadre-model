from marshmallow import Schema, fields, validate


class LoginSchema(Schema):
    """登录Schema"""
    username = fields.Str(required=True)
    password = fields.Str(required=True)


class UserSchema(Schema):
    """用户Schema"""
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True)
    real_name = fields.Str(allow_none=True)
    email = fields.Str(allow_none=True)
    phone = fields.Str(allow_none=True)
    department = fields.Str(allow_none=True)
    status = fields.Int(missing=1, validate=validate.OneOf([0, 1]))
    is_admin = fields.Int(missing=0, validate=validate.OneOf([0, 1]))


class UserCreateSchema(UserSchema):
    """用户创建Schema"""
    password = fields.Str(required=True, validate=validate.Length(min=6))


class UserUpdateSchema(Schema):
    """用户更新Schema"""
    real_name = fields.Str(allow_none=True)
    email = fields.Str(allow_none=True)
    phone = fields.Str(allow_none=True)
    department = fields.Str(allow_none=True)
    status = fields.Int(allow_none=True, validate=validate.OneOf([0, 1]))
    is_admin = fields.Int(allow_none=True, validate=validate.OneOf([0, 1]))
    password = fields.Str(allow_none=True, validate=validate.Length(min=6))
