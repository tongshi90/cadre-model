# -*- coding: utf-8 -*-
"""
能力维度和标签常量定义
根据干部全量模型需求规划文档中的能力维度映射表定义
"""

# 能力维度和标签映射表
ABILITY_DIMENSIONS = {
    '政治素养': ['政治判断力', '政策执行力', '廉洁自律'],
    '职业素养': ['责任心', '敬业度', '保密意识'],
    '领导力': ['战略思维', '团队建设', '跨部门协同'],
    '专业能力': ['业务精通度', '数字化能力', '创新突破'],
    '执行力': ['任务完成率', '应急处突', '成本控制'],
    '个性特质': ['抗压能力', '情绪稳定性', '适应性'],
    '潜力': ['学习敏锐度', '成长意愿', '未来胜任力'],
    '履历与业绩': ['行业经验', '管理年限', '重大项目经验', '业绩贡献'],
}

# 获取所有能力维度列表
ABILITY_DIMENSION_LIST = list(ABILITY_DIMENSIONS.keys())

# 根据维度获取标签列表
def get_tags_by_dimension(dimension: str) -> list:
    """根据能力维度获取对应的标签列表"""
    return ABILITY_DIMENSIONS.get(dimension, [])

# 获取所有标签列表
def get_all_tags() -> list:
    """获取所有能力标签列表"""
    all_tags = []
    for tags in ABILITY_DIMENSIONS.values():
        all_tags.extend(tags)
    return all_tags
