from marshmallow import Schema, fields, validate, validates, ValidationError, EXCLUDE
from app.utils.ability_constants import ABILITY_DIMENSION_LIST, get_all_tags, get_tags_by_dimension
from app.utils.dict_constants import MANAGEMENT_LEVEL_LIST, MANAGEMENT_ATTRIBUTION_LIST, EDUCATION_LIST, POLITICAL_STATUS_LIST
from app.utils.trait_constants import TRAIT_TYPE_LIST


class CadreDynamicInfoSchema(Schema):
    """干部动态信息Schema"""
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(dump_only=True)
    cadre_id = fields.Int(required=True)
    info_type = fields.Int(required=True, validate=validate.OneOf([1, 2, 3, 4, 5, 6]))

    # 工作经历字段
    work_start_date = fields.Date(allow_none=True)
    work_end_date = fields.Date(allow_none=True)
    work_company = fields.Str(allow_none=True)
    work_position = fields.Str(allow_none=True)

    # 培训记录字段
    training_name = fields.Str(allow_none=True)
    training_date = fields.Date(allow_none=True)
    training_content = fields.Str(allow_none=True)
    training_result = fields.Str(allow_none=True)

    # 项目经历字段
    project_no = fields.Str(allow_none=True)
    project_name = fields.Str(allow_none=True)
    project_role = fields.Str(allow_none=True)
    project_start_date = fields.Date(allow_none=True)
    project_end_date = fields.Date(allow_none=True)
    project_result = fields.Str(allow_none=True)
    project_rating = fields.Str(allow_none=True)
    is_core_project = fields.Bool(allow_none=True)

    # 绩效数据字段
    assessment_cycle = fields.Str(allow_none=True)
    assessment_dimension = fields.Str(allow_none=True)
    assessment_grade = fields.Str(allow_none=True, validate=validate.OneOf(['S', 'A', 'B+', 'B', 'B-', 'C']))
    assessment_comment = fields.Str(allow_none=True)

    # 奖惩记录字段
    reward_type = fields.Str(allow_none=True)
    reward_reason = fields.Str(allow_none=True)
    reward_date = fields.Date(allow_none=True)

    # 职务变更字段
    position_name = fields.Str(allow_none=True)
    responsibility = fields.Str(allow_none=True)
    appointment_type = fields.Str(allow_none=True)
    term_start_date = fields.Date(allow_none=True)
    term_end_date = fields.Date(allow_none=True)
    approval_record = fields.Str(allow_none=True)

    # 通用字段
    remark = fields.Str(allow_none=True)


class CadreTraitSchema(Schema):
    """干部特质Schema"""
    id = fields.Int(dump_only=True)
    cadre_id = fields.Int(required=True)
    trait_type = fields.Str(
        required=True,
        validate=validate.OneOf(TRAIT_TYPE_LIST)
    )
    trait_value = fields.Str(required=True)
    trait_desc = fields.Str(allow_none=True)


class CadreAbilityScoreSchema(Schema):
    """干部能力评分Schema"""
    id = fields.Int(dump_only=True)
    cadre_id = fields.Int(required=True)
    ability_dimension = fields.Str(required=True)
    ability_tag = fields.Str(required=True)
    score = fields.Float(required=True, validate=validate.Range(min=1, max=5))
    assessor = fields.Str(allow_none=True)
    assessment_date = fields.Date(allow_none=True)
    comment = fields.Str(allow_none=True)

    @validates('ability_dimension')
    def validate_ability_dimension(self, value):
        """验证能力维度是否在固定列表中"""
        if value not in ABILITY_DIMENSION_LIST:
            raise ValidationError(f'能力维度必须是以下之一：{", ".join(ABILITY_DIMENSION_LIST)}')

    @validates('ability_tag')
    def validate_ability_tag(self, value):
        """验证能力标签是否在固定列表中"""
        all_tags = get_all_tags()
        if value not in all_tags:
            raise ValidationError(f'能力标签无效')


class CadreSchema(Schema):
    """干部基础信息Schema"""
    id = fields.Int(dump_only=True)
    employee_no = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    phone = fields.Str(allow_none=True, validate=validate.Length(max=20))
    department_id = fields.Int(allow_none=True)
    position_id = fields.Int(allow_none=True)
    job_grade = fields.Int(allow_none=True)
    management_level = fields.Str(allow_none=True, validate=validate.OneOf(MANAGEMENT_LEVEL_LIST))
    management_attribution = fields.Str(allow_none=True, validate=validate.OneOf(MANAGEMENT_ATTRIBUTION_LIST))
    gender = fields.Str(allow_none=True)
    birth_date = fields.Date(allow_none=True)
    graduated_school = fields.Str(allow_none=True)
    education = fields.Str(allow_none=True, validate=validate.OneOf(EDUCATION_LIST))
    political_status = fields.Str(allow_none=True, validate=validate.OneOf(POLITICAL_STATUS_LIST))
    entry_date = fields.Date(allow_none=True)
    work_province = fields.Str(allow_none=True)
    student_soldier_class = fields.Int(allow_none=True)
    is_dispatched = fields.Bool(allow_none=True)
    status = fields.Int(missing=1, validate=validate.OneOf([1, 2, 3]))

    # 关联数据
    department = fields.Dict(allow_none=True)
    position = fields.Dict(allow_none=True)
    dynamic_infos = fields.List(fields.Nested(CadreDynamicInfoSchema), dump_only=True)
    traits = fields.List(fields.Nested(CadreTraitSchema), dump_only=True)
    ability_scores = fields.List(fields.Nested(CadreAbilityScoreSchema), dump_only=True)


class CadreCreateSchema(CadreSchema):
    """干部创建Schema"""
    pass


class CadreUpdateSchema(Schema):
    """干部更新Schema"""
    class Meta:
        unknown = EXCLUDE

    name = fields.Str(allow_none=True, validate=validate.Length(min=1, max=100))
    phone = fields.Str(allow_none=True, validate=validate.Length(max=20))
    department_id = fields.Int(allow_none=True)
    position_id = fields.Int(allow_none=True)
    job_grade = fields.Int(allow_none=True)
    management_level = fields.Str(allow_none=True, validate=validate.OneOf(MANAGEMENT_LEVEL_LIST))
    management_attribution = fields.Str(allow_none=True, validate=validate.OneOf(MANAGEMENT_ATTRIBUTION_LIST))
    gender = fields.Str(allow_none=True)
    birth_date = fields.Date(allow_none=True)
    graduated_school = fields.Str(allow_none=True)
    education = fields.Str(allow_none=True, validate=validate.OneOf(EDUCATION_LIST))
    political_status = fields.Str(allow_none=True, validate=validate.OneOf(POLITICAL_STATUS_LIST))
    entry_date = fields.Date(allow_none=True)
    work_province = fields.Str(allow_none=True)
    student_soldier_class = fields.Int(allow_none=True)
    is_dispatched = fields.Bool(allow_none=True)
    status = fields.Int(allow_none=True, validate=validate.OneOf([1, 2, 3]))
