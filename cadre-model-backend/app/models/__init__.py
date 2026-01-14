from app.models.cadre import (
    CadreBasicInfo,
    CadreDynamicInfo,
    CadreTrait,
    CadreAbilityScore
)
from app.models.position import (
    PositionInfo,
    PositionAbilityWeight,
    PositionRequirement
)
from app.models.match import (
    MatchResult,
    MatchReport
)
from app.models.system import (
    OperationLog,
    User
)
from app.models.department import Department
from app.models.ai_analysis import AIAnalysis

__all__ = [
    # 干部模型
    'CadreBasicInfo',
    'CadreDynamicInfo',
    'CadreTrait',
    'CadreAbilityScore',
    # 岗位模型
    'PositionInfo',
    'PositionAbilityWeight',
    'PositionRequirement',
    # 匹配模型
    'MatchResult',
    'MatchReport',
    # 系统模型
    'OperationLog',
    'User',
    # 部门模型
    'Department',
    # AI分析模型
    'AIAnalysis',
]
