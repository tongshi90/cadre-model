# -*- coding: utf-8 -*-
"""
字典常量定义
用于干部信息中的各种下拉选项配置
"""

# 管理层级
MANAGEMENT_LEVEL = {
    '基层': '基层管理岗位，负责具体业务执行',
    '中层': '中层管理岗位，负责部门或团队管理',
    '经营层': '经营管理岗位，负责业务板块经营管理',
    '战略层': '战略管理岗位，负责企业战略规划与决策',
}

MANAGEMENT_LEVEL_LIST = list(MANAGEMENT_LEVEL.keys())

# 管理归属
MANAGEMENT_ATTRIBUTION = {
    '集团直管干部': '由集团直接管理的干部',
    '体系直管干部': '由各体系直接管理的干部',
}

MANAGEMENT_ATTRIBUTION_LIST = list(MANAGEMENT_ATTRIBUTION.keys())

# 学历
EDUCATION = {
    '大专': '大专学历',
    '本科': '本科学历',
    '硕士': '硕士学历',
    '博士': '博士学历',
}

EDUCATION_LIST = list(EDUCATION.keys())

# 政治面貌
POLITICAL_STATUS = {
    '中共党员': '中国共产党党员',
    '中共预备党员': '中国共产党预备党员',
    '共青团员': '中国共产主义青年团团员',
    '民主党派': '各民主党派成员',
    '群众': '无党派人士',
    '其他': '其他政治面貌',
}

POLITICAL_STATUS_LIST = list(POLITICAL_STATUS.keys())

# 获取管理层级描述
def get_management_level_desc(level: str) -> str:
    """获取管理层级的描述"""
    return MANAGEMENT_LEVEL.get(level, '')

# 获取管理归属描述
def get_management_attribution_desc(attribution: str) -> str:
    """获取管理归属的描述"""
    return MANAGEMENT_ATTRIBUTION.get(attribution, '')

# 获取学历描述
def get_education_desc(education: str) -> str:
    """获取学历的描述"""
    return EDUCATION.get(education, '')

# 获取政治面貌描述
def get_political_status_desc(status: str) -> str:
    """获取政治面貌的描述"""
    return POLITICAL_STATUS.get(status, '')
