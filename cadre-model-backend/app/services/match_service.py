from typing import List, Dict, Tuple
from datetime import datetime, date
import json
from sqlalchemy import func
from app.models.cadre import CadreBasicInfo, CadreAbilityScore
from app.models.position import PositionInfo, PositionAbilityWeight, PositionRequirement
from app.models.match import MatchResult, MatchReport
from app.models.department import Department
from app import db


class MatchService:
    """匹配计算服务类"""

    @staticmethod
    def calculate(cadre_id: int, position_id: int, save_to_db: bool = True) -> MatchResult:
        """
        计算干部与岗位的匹配度

        Args:
            cadre_id: 干部ID
            position_id: 岗位ID
            save_to_db: 是否保存到数据库，默认为True

        Returns:
            匹配结果对象
        """
        # 1. 获取干部能力评分
        cadre_scores = MatchService._get_cadre_ability_scores(cadre_id)

        # 2. 获取岗位能力权重
        position_weights = MatchService._get_position_weights(position_id)

        # 3. 计算基础得分
        base_score = MatchService._calculate_base_score(cadre_scores, position_weights)

        # 4. 检查硬性要求
        meet_mandatory, mandatory_details = MatchService._check_mandatory_requirements(cadre_id, position_id)

        # 5. 计算建议要求扣分
        deduction_score, deduction_details = MatchService._calculate_deduction(cadre_id, position_id)

        # 6. 计算最终得分
        final_score = max(0, base_score - deduction_score)

        # 7. 确定匹配等级
        match_level = MatchService._determine_match_level(final_score)

        # 8. 如果不满足硬性要求，标记为不合格
        if not meet_mandatory:
            match_level = 'unqualified'

        # 9. 构建匹配详情
        match_detail = {
            'base_score': base_score,
            'base_score_details': MatchService._build_base_score_details(cadre_scores, position_weights),
            'mandatory_check': {
                'is_meet': meet_mandatory,
                'details': mandatory_details
            },
            'deduction': {
                'total_deduction': deduction_score,
                'details': deduction_details
            }
        }

        # 10. 创建匹配结果
        match_result = MatchResult(
            cadre_id=cadre_id,
            position_id=position_id,
            base_score=base_score,
            deduction_score=deduction_score,
            final_score=final_score,
            match_level=match_level,
            is_meet_mandatory=1 if meet_mandatory else 0,
            match_detail=json.dumps(match_detail, ensure_ascii=False)
        )

        if save_to_db:
            db.session.add(match_result)
            db.session.commit()
            db.session.refresh(match_result)
        else:
            # 不保存到数据库时，手动加载关联数据并附加到对象上
            from app.models.cadre import CadreBasicInfo
            from app.models.position import PositionInfo
            cadre = CadreBasicInfo.query.get(cadre_id)
            position = PositionInfo.query.get(position_id)
            # 将关联数据附加到对象上，供 to_dict 使用
            match_result._cached_cadre = cadre
            match_result._cached_position = position

        return match_result

    @staticmethod
    def batch_calculate(position_id: int) -> List[MatchResult]:
        """
        批量计算岗位与所有在职干部的匹配度

        Args:
            position_id: 岗位ID

        Returns:
            匹配结果列表
        """
        # 获取所有在职干部
        cadres = CadreBasicInfo.query.filter_by(status=1).all()

        results = []
        for cadre in cadres:
            try:
                result = MatchService.calculate(cadre.id, position_id)
                results.append(result)
            except Exception as e:
                # 记录错误但继续处理其他干部
                db.session.rollback()
                continue

        # 按最终得分降序排序
        results.sort(key=lambda x: x.final_score or 0, reverse=True)

        return results

    @staticmethod
    def batch_calculate_cadres(position_id: int, cadre_ids: List[int]) -> List[Dict]:
        """
        批量计算多个干部与指定岗位的匹配度（不保存到数据库，只返回必要字段）

        Args:
            position_id: 岗位ID
            cadre_ids: 干部ID列表

        Returns:
            匹配结果字典列表（只包含必要字段）
        """
        from app.models.department import Department

        # 先查询所有需要的干部数据
        cadres = CadreBasicInfo.query.filter(
            CadreBasicInfo.id.in_(cadre_ids),
            CadreBasicInfo.status == 1
        ).all()

        # 构建 cadre 字典 {id: cadre_obj}
        cadre_dict = {c.id: c for c in cadres}

        results = []
        for cadre_id in cadre_ids:
            try:
                # 计算匹配度，不保存到数据库
                result = MatchService.calculate(cadre_id, position_id, save_to_db=False)

                # 获取干部对象
                cadre = cadre_dict.get(cadre_id)
                if not cadre:
                    continue

                # 构建简化的结果字典
                results.append({
                    'id': result.id,
                    'cadre_id': result.cadre_id,
                    'position_id': result.position_id,
                    'base_score': result.base_score,
                    'deduction_score': result.deduction_score,
                    'final_score': result.final_score,
                    'match_level': result.match_level,
                    'is_meet_mandatory': result.is_meet_mandatory,
                    'cadre': {
                        'id': cadre.id,
                        'employee_no': cadre.employee_no,
                        'name': cadre.name,
                        'position_id': cadre.position_id,
                        'position': {
                            'id': cadre.position.id,
                            'position_name': cadre.position.position_name
                        } if cadre.position else None,
                        'department': {
                            'id': cadre.department.id,
                            'name': cadre.department.name
                        } if cadre.department else None
                    }
                })
            except Exception as e:
                # 记录错误但继续处理其他干部
                continue

        # 按最终得分降序排序
        results.sort(key=lambda x: x.get('final_score') or 0, reverse=True)

        return results

    @staticmethod
    def get_match_results(
        position_id: int = None,
        cadre_id: int = None,
        match_level: str = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict:
        """获取匹配结果列表"""
        query = MatchResult.query

        if position_id:
            query = query.filter_by(position_id=position_id)
        if cadre_id:
            query = query.filter_by(cadre_id=cadre_id)
        if match_level:
            query = query.filter_by(match_level=match_level)

        # 总数
        total = query.count()

        # 分页查询，按最终得分降序
        items = query.order_by(MatchResult.final_score.desc()) \
            .offset((page - 1) * page_size) \
            .limit(page_size) \
            .all()

        return {
            'items': [item.to_dict() for item in items],
            'total': total,
            'page': page,
            'page_size': page_size
        }

    @staticmethod
    def get_match_result_by_id(result_id: int) -> MatchResult:
        """获取匹配结果详情"""
        return MatchResult.query.get(result_id)

    @staticmethod
    def get_current_position_match_results() -> List[Dict]:
        """
        获取干部当前岗位匹配结果（优化查询，只选择必要字段）

        Returns:
            匹配结果字典列表（只包含必要字段）
        """
        from sqlalchemy.orm import joinedload

        # 查询干部当前岗位的匹配结果，只选择必要字段
        # 使用 join 来一次性获取关联数据
        query = db.session.query(
            MatchResult.id,
            MatchResult.cadre_id,
            MatchResult.position_id,
            MatchResult.base_score,
            MatchResult.deduction_score,
            MatchResult.final_score,
            MatchResult.match_level,
            CadreBasicInfo.id.label('cadre_info_id'),
            CadreBasicInfo.employee_no,
            CadreBasicInfo.name,
            CadreBasicInfo.position_id.label('cadre_position_id'),
            PositionInfo.id.label('position_info_id'),
            PositionInfo.position_name,
            Department.id.label('department_id'),
            Department.name.label('department_name')
        ).join(
            CadreBasicInfo, MatchResult.cadre_id == CadreBasicInfo.id
        ).join(
            PositionInfo, MatchResult.position_id == PositionInfo.id
        ).outerjoin(
            Department, CadreBasicInfo.department_id == Department.id
        ).filter(
            # 只获取有岗位的在职干部的匹配结果
            CadreBasicInfo.position_id.isnot(None),
            CadreBasicInfo.status == 1,
            # 只获取干部当前岗位的匹配结果
            MatchResult.position_id == CadreBasicInfo.position_id
        ).order_by(
            MatchResult.final_score.desc()
        ).all()

        # 构建结果字典
        results = []
        for row in query:
            results.append({
                'id': row.id,
                'cadre_id': row.cadre_id,
                'position_id': row.position_id,
                'base_score': row.base_score,
                'deduction_score': row.deduction_score,
                'final_score': row.final_score,
                'match_level': row.match_level,
                'cadre': {
                    'id': row.cadre_info_id,
                    'employee_no': row.employee_no,
                    'name': row.name,
                    'position_id': row.cadre_position_id,
                    'position': {
                        'id': row.position_info_id,
                        'position_name': row.position_name
                    } if row.position_info_id else None,
                    'department': {
                        'id': row.department_id,
                        'name': row.department_name
                    } if row.department_id else None
                },
                'position': {
                    'id': row.position_info_id,
                    'position_name': row.position_name
                }
            })

        return results

    @staticmethod
    def generate_report(result_id: int) -> MatchReport:
        """
        生成分析报告

        Args:
            result_id: 匹配结果ID

        Returns:
            分析报告对象
        """
        match_result = MatchResult.query.get(result_id)
        if not match_result:
            raise ValueError('匹配结果不存在')

        # 解析匹配详情
        match_detail = json.loads(match_result.match_detail) if match_result.match_detail else {}

        # 生成优势和劣势分析
        advantage, weakness = MatchService._analyze_advantage_weakness(match_detail)

        # 获取未满足的要求
        unmet_requirements = MatchService._get_unmet_requirements(match_detail)

        # 生成建议
        suggestions = MatchService._generate_suggestions(match_result, match_detail)

        # 生成雷达图数据
        radar_data = MatchService._generate_radar_data(match_detail)

        report = MatchReport(
            match_result_id=result_id,
            report_type='detail',
            advantage=advantage,
            weakness=weakness,
            unmet_requirements=unmet_requirements,
            suggestions=suggestions,
            radar_data=json.dumps(radar_data, ensure_ascii=False)
        )
        db.session.add(report)
        db.session.commit()
        db.session.refresh(report)

        return report

    @staticmethod
    def compare_positions(cadre_id: int, position_ids: List[int]) -> Dict:
        """
        多岗位对比分析

        Args:
            cadre_id: 干部ID
            position_ids: 岗位ID列表

        Returns:
            对比结果
        """
        comparison = []
        for position_id in position_ids:
            # 查找是否已有匹配结果
            existing = MatchResult.query.filter_by(
                cadre_id=cadre_id,
                position_id=position_id
            ).first()

            if existing:
                result = existing
            else:
                result = MatchService.calculate(cadre_id, position_id)

            comparison.append({
                'position_id': position_id,
                'position_name': result.position.position_name if result.position else '',
                'final_score': result.final_score,
                'match_level': result.match_level
            })

        # 按得分排序
        comparison.sort(key=lambda x: x['final_score'] or 0, reverse=True)

        return {
            'cadre_id': cadre_id,
            'comparison': comparison,
            'ranking': [c['position_id'] for c in comparison]
        }

    # ============ 私有辅助方法 ============

    @staticmethod
    def _get_cadre_ability_scores(cadre_id: int) -> List[CadreAbilityScore]:
        """获取干部能力评分"""
        return CadreAbilityScore.query.filter_by(cadre_id=cadre_id).all()

    @staticmethod
    def _get_position_weights(position_id: int) -> List[PositionAbilityWeight]:
        """获取岗位能力权重"""
        return PositionAbilityWeight.query.filter_by(position_id=position_id).all()

    @staticmethod
    def _calculate_base_score(
        cadre_scores: List[CadreAbilityScore],
        position_weights: List[PositionAbilityWeight]
    ) -> float:
        """
        计算基础得分

        计算逻辑：
        1. 按维度聚合干部能力评分，计算每个维度下所有标签的总分（维度总分）
        2. 计算每个维度的满分（维度下标签数量 × 5分）
        3. 将维度总分换算成百分制：维度总分 / 维度满分 × 100
        4. 按维度权重计算原始匹配分：所有维度的（百分制分数 × 权重%）相加
        5. 四舍五入保留两位小数
        """
        # 按维度聚合干部能力评分
        from collections import defaultdict
        dimension_scores = defaultdict(list)
        for score in cadre_scores:
            dimension_scores[score.ability_dimension].append(score.score)

        # 计算原始匹配分
        final_score = 0.0
        for weight in position_weights:
            dimension = weight.ability_dimension
            scores = dimension_scores.get(dimension, [])

            if len(scores) == 0:
                continue

            # 维度总分 = 该维度下所有标签分数相加
            dimension_total_score = sum(scores)

            # 维度满分 = 该维度下标签数量 × 5分
            dimension_max_score = len(scores) * 5

            # 换算成百分制
            dimension_percentage = (dimension_total_score / dimension_max_score) * 100

            # 按权重计算该维度对最终分数的贡献
            final_score += dimension_percentage * (weight.weight / 100)

        # 四舍五入保留两位小数
        return round(final_score, 2)

    @staticmethod
    def _build_base_score_details(
        cadre_scores: List[CadreAbilityScore],
        position_weights: List[PositionAbilityWeight]
    ) -> List[Dict]:
        """构建基础得分详情"""
        # 按维度聚合干部能力评分
        from collections import defaultdict
        dimension_scores = defaultdict(list)
        for score in cadre_scores:
            dimension_scores[score.ability_dimension].append(score.score)

        # 计算每个维度的详情
        dimension_details = {}
        for weight in position_weights:
            dimension = weight.ability_dimension
            scores = dimension_scores.get(dimension, [])

            if len(scores) == 0:
                continue

            # 维度总分
            total_score = sum(scores)
            # 维度满分
            max_score = len(scores) * 5
            # 百分制分数
            percentage_score = (total_score / max_score) * 100
            # 加权后的分数贡献
            weighted_contribution = percentage_score * (weight.weight / 100)

            dimension_details[dimension] = {
                'dimension': dimension,
                'weight': weight.weight,
                'scores': scores,
                'total_score': total_score,
                'max_score': max_score,
                'percentage_score': round(percentage_score, 2),
                'weighted_contribution': round(weighted_contribution, 2)
            }

        # 构建详情列表
        details = []
        for dimension, detail in dimension_details.items():
            details.append({
                'ability_dimension': detail['dimension'],
                'weight': detail['weight'],
                'scores': detail['scores'],
                'total_score': detail['total_score'],
                'max_score': detail['max_score'],
                'percentage_score': detail['percentage_score'],
                'weighted_contribution': detail['weighted_contribution']
            })

        return details

    @staticmethod
    def _check_mandatory_requirements(cadre_id: int, position_id: int) -> tuple:
        """检查硬性要求"""
        cadre = CadreBasicInfo.query.get(cadre_id)
        if not cadre:
            return False, []

        requirements = PositionRequirement.query.filter_by(
            position_id=position_id,
            requirement_type='mandatory'
        ).all()

        details = []
        all_meet = True

        for req in requirements:
            is_meet = MatchService._check_requirement(cadre, req)
            details.append({
                'requirement_item': req.requirement_item,
                'requirement_value': req.requirement_value,
                'is_meet': is_meet
            })
            if not is_meet:
                all_meet = False

        return all_meet, details

    @staticmethod
    def _check_requirement(cadre: CadreBasicInfo, requirement: PositionRequirement) -> bool:
        """检查单个要求是否满足"""
        # 简化实现，实际需要根据不同要求项进行验证
        # 这里只做示例
        return True

    @staticmethod
    def _calculate_deduction(cadre_id: int, position_id: int) -> tuple:
        """计算建议要求扣分"""
        cadre = CadreBasicInfo.query.get(cadre_id)
        if not cadre:
            return 0, []

        requirements = PositionRequirement.query.filter_by(
            position_id=position_id,
            requirement_type='suggested'
        ).all()

        total_deduction = 0
        details = []

        for req in requirements:
            # 检查是否满足
            is_meet = MatchService._check_requirement(cadre, req)

            if not is_meet:
                deduction = min(req.deduction_score or 0, req.deduction_limit or 0)
                total_deduction += deduction

                details.append({
                    'requirement_item': req.requirement_item,
                    'deduction_score': deduction,
                    'is_meet': is_meet
                })

        return round(total_deduction, 2), details

    @staticmethod
    def _determine_match_level(score: float) -> str:
        """确定匹配等级"""
        if score >= 80:
            return 'excellent'
        elif score >= 60:
            return 'qualified'
        else:
            return 'unqualified'

    @staticmethod
    def _analyze_advantage_weakness(match_detail: Dict) -> tuple:
        """分析优势和劣势"""
        base_details = match_detail.get('base_score_details', [])

        advantages = []
        weaknesses = []

        for detail in base_details:
            dimension = detail['ability_dimension']
            total_score = detail['total_score']
            max_score = detail['max_score']

            if max_score > 0:
                avg_score = total_score / len(detail['scores'])
                # 判断是否为优势或劣势
                if avg_score >= 4:
                    advantages.append(f"{dimension}：平均得分 {avg_score:.1f}/5，总分 {total_score}/{max_score}")
                elif avg_score <= 2:
                    weaknesses.append(f"{dimension}：平均得分 {avg_score:.1f}/5，总分 {total_score}/{max_score}，建议加强")

        return '\n'.join(advantages) if advantages else '各项能力均衡', '\n'.join(weaknesses) if weaknesses else '无明显短板'

    @staticmethod
    def _get_unmet_requirements(match_detail: Dict) -> str:
        """获取未满足的要求"""
        mandatory = match_detail.get('mandatory_check', {})
        if not mandatory.get('is_meet', True):
            unmet = [d['requirement_item'] for d in mandatory.get('details', []) if not d.get('is_meet', True)]
            return '、'.join(unmet)
        return ''

    @staticmethod
    def _generate_suggestions(match_result: MatchResult, match_detail: Dict) -> str:
        """生成建议"""
        suggestions = []

        if match_result.match_level == 'excellent':
            suggestions.append('该干部与岗位匹配度优质，建议优先考虑。')
        elif match_result.match_level == 'qualified':
            suggestions.append('该干部与岗位匹配度合格，建议根据实际情况综合考虑。')
        else:
            suggestions.append('该干部与岗位匹配度不合格，建议考虑其他候选人。')

        # 根据扣分项给出建议
        deduction_details = match_detail.get('deduction', {}).get('details', [])
        if deduction_details:
            suggestions.append('建议关注以下方面：' +
                '、'.join([d['requirement_item'] for d in deduction_details]))

        return '\n'.join(suggestions)

    @staticmethod
    def _generate_radar_data(match_detail: Dict) -> Dict:
        """生成雷达图数据"""
        base_details = match_detail.get('base_score_details', [])

        # 按维度聚合
        dimension_scores = {}
        for detail in base_details:
            dim = detail['ability_dimension']
            if dim not in dimension_scores:
                dimension_scores[dim] = []
            dimension_scores[dim].append(detail['cadre_score'])

        # 计算各维度平均分
        radar_data = {
            'dimensions': [],
            'scores': []
        }

        for dim, scores in dimension_scores.items():
            avg_score = sum(scores) / len(scores) if scores else 0
            radar_data['dimensions'].append(dim)
            radar_data['scores'].append(round(avg_score, 2))

        return radar_data

    @staticmethod
    def batch_calculate_current_position() -> List[MatchResult]:
        """
        批量计算干部当前所在岗位的匹配度

        获取所有有岗位的在职干部，计算每个干部与其当前岗位的匹配度，
        删除旧匹配结果并保存新的结果到数据库。

        Returns:
            匹配结果列表
        """
        # 获取所有有岗位的在职干部
        cadres = CadreBasicInfo.query.filter(
            CadreBasicInfo.status == 1,
            CadreBasicInfo.position_id.isnot(None)
        ).all()

        results = []
        for cadre in cadres:
            try:
                # 删除该干部与该岗位的旧匹配结果（如果存在）
                old_results = MatchResult.query.filter_by(
                    cadre_id=cadre.id,
                    position_id=cadre.position_id
                ).all()

                for old_result in old_results:
                    # 同时删除关联的报告
                    MatchReport.query.filter_by(match_result_id=old_result.id).delete()
                    db.session.delete(old_result)

                db.session.commit()

                # 计算新的匹配度并保存到数据库
                result = MatchService.calculate(cadre.id, cadre.position_id, save_to_db=True)
                results.append(result)
            except Exception as e:
                # 记录错误但继续处理其他干部
                db.session.rollback()
                continue

        # 按最终得分降序排序
        results.sort(key=lambda x: x.final_score or 0, reverse=True)

        return results

    @staticmethod
    def get_match_statistics() -> Dict:
        """
        获取匹配度统计数据

        Returns:
            包含全员和关键岗位匹配度统计的字典
        """
        # 获取干部当前岗位的匹配结果（使用优化的查询方式）
        # 查询所有有岗位的在职干部的匹配结果
        all_matches = db.session.query(
            MatchResult.final_score,
            MatchResult.match_level,
            PositionInfo.is_key_position
        ).join(
            CadreBasicInfo, MatchResult.cadre_id == CadreBasicInfo.id
        ).join(
            PositionInfo, MatchResult.position_id == PositionInfo.id
        ).filter(
            CadreBasicInfo.position_id.isnot(None),
            CadreBasicInfo.status == 1,
            MatchResult.position_id == CadreBasicInfo.position_id
        ).all()

        if not all_matches:
            return {
                'overall': {
                    'total_count': 0,
                    'avg_score': 0,
                    'level_distribution': {
                        'excellent': {'count': 0, 'percentage': 0},
                        'qualified': {'count': 0, 'percentage': 0},
                        'unqualified': {'count': 0, 'percentage': 0}
                    }
                },
                'key_position': {
                    'total_count': 0,
                    'avg_score': 0,
                    'level_distribution': {
                        'excellent': {'count': 0, 'percentage': 0},
                        'qualified': {'count': 0, 'percentage': 0},
                        'unqualified': {'count': 0, 'percentage': 0}
                    }
                }
            }

        # 分离全员和关键岗位的数据
        all_scores = []
        key_position_scores = []

        level_counts = {'excellent': 0, 'qualified': 0, 'unqualified': 0}
        key_position_level_counts = {'excellent': 0, 'qualified': 0, 'unqualified': 0}

        for match in all_matches:
            score = match.final_score or 0
            level = match.match_level or 'unqualified'
            is_key = match.is_key_position or False

            all_scores.append(score)
            level_counts[level] = level_counts.get(level, 0) + 1

            if is_key:
                key_position_scores.append(score)
                key_position_level_counts[level] = key_position_level_counts.get(level, 0) + 1

        # 计算全员统计
        overall_total = len(all_scores)
        overall_avg = sum(all_scores) / overall_total if overall_total > 0 else 0

        # 计算关键岗位统计
        key_position_total = len(key_position_scores)
        key_position_avg = sum(key_position_scores) / key_position_total if key_position_total > 0 else 0

        return {
            'overall': {
                'total_count': overall_total,
                'avg_score': round(overall_avg, 2),
                'level_distribution': {
                    'excellent': {
                        'count': level_counts.get('excellent', 0),
                        'percentage': round(level_counts.get('excellent', 0) / overall_total * 100, 2) if overall_total > 0 else 0
                    },
                    'qualified': {
                        'count': level_counts.get('qualified', 0),
                        'percentage': round(level_counts.get('qualified', 0) / overall_total * 100, 2) if overall_total > 0 else 0
                    },
                    'unqualified': {
                        'count': level_counts.get('unqualified', 0),
                        'percentage': round(level_counts.get('unqualified', 0) / overall_total * 100, 2) if overall_total > 0 else 0
                    }
                }
            },
            'key_position': {
                'total_count': key_position_total,
                'avg_score': round(key_position_avg, 2),
                'level_distribution': {
                    'excellent': {
                        'count': key_position_level_counts.get('excellent', 0),
                        'percentage': round(key_position_level_counts.get('excellent', 0) / key_position_total * 100, 2) if key_position_total > 0 else 0
                    },
                    'qualified': {
                        'count': key_position_level_counts.get('qualified', 0),
                        'percentage': round(key_position_level_counts.get('qualified', 0) / key_position_total * 100, 2) if key_position_total > 0 else 0
                    },
                    'unqualified': {
                        'count': key_position_level_counts.get('unqualified', 0),
                        'percentage': round(key_position_level_counts.get('unqualified', 0) / key_position_total * 100, 2) if key_position_total > 0 else 0
                    }
                }
            }
        }

    @staticmethod
    def get_age_structure_statistics() -> Dict:
        """
        获取干部梯队与年龄结构统计数据

        按管理层级（战略层、经营层、中层、基层）统计，每个层级内部按年龄段分段
        Returns:
            包含各管理层级年龄结构统计的字典
        """
        today = date.today()

        # 定义管理层级顺序（从上到下）
        management_levels = ['战略层', '经营层', '中层', '基层']

        # 定义年龄段
        age_ranges = [
            {'key': 'le_35', 'label': '≤35岁', 'color': '#4ade80'},
            {'key': '36_45', 'label': '36-45岁', 'color': '#60a5fa'},
            {'key': '46_55', 'label': '46-55岁', 'color': '#fbbf24'},
            {'key': 'ge_56', 'label': '≥56岁', 'color': '#f87171'}
        ]

        # 获取所有在职干部
        cadres = CadreBasicInfo.query.filter_by(status=1).all()

        # 初始化统计数据结构
        pyramid_data = {}
        total_count = 0

        for level in management_levels:
            pyramid_data[level] = {
                'label': level,
                'total': 0,
                'age_distribution': {}
            }
            for age_range in age_ranges:
                pyramid_data[level]['age_distribution'][age_range['key']] = {
                    'label': age_range['label'],
                    'color': age_range['color'],
                    'count': 0,
                    'percentage': 0
                }

        # 统计数据
        for cadre in cadres:
            level = cadre.management_level
            if not level:
                continue

            if level not in pyramid_data:
                continue

            total_count += 1
            pyramid_data[level]['total'] += 1

            # 计算年龄
            if cadre.birth_date:
                birth = cadre.birth_date
                age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))

                # 分类到对应年龄段
                if age <= 35:
                    age_key = 'le_35'
                elif 36 <= age <= 45:
                    age_key = '36_45'
                elif 46 <= age <= 55:
                    age_key = '46_55'
                else:
                    age_key = 'ge_56'

                pyramid_data[level]['age_distribution'][age_key]['count'] += 1

        # 计算每个层级的年龄段百分比
        for level_data in pyramid_data.values():
            level_total = level_data['total']
            for age_data in level_data['age_distribution'].values():
                if level_total > 0:
                    age_data['percentage'] = round(age_data['count'] / level_total * 100, 2)

        # 返回按层级顺序排列的数据
        result = {
            'levels': management_levels,
            'data': pyramid_data,
            'total_count': total_count
        }

        return result

    @staticmethod
    def get_age_structure_details() -> Dict:
        """
        获取干部梯队与年龄结构详情数据

        按管理层级（战略层、经营层、中层、基层）统计，每个层级内部按年龄段分段
        同时返回每个层级-年龄段组合的具体人员信息

        Returns:
            包含各管理层级年龄结构统计和人员详情的字典
        """
        from app.models.department import Department

        today = date.today()

        # 定义管理层级顺序（从上到下）
        management_levels = ['战略层', '经营层', '中层', '基层']

        # 定义年龄段
        age_ranges = [
            {'key': 'le_35', 'label': '≤35岁', 'color': '#4ade80'},
            {'key': '36_45', 'label': '36-45岁', 'color': '#60a5fa'},
            {'key': '46_55', 'label': '46-55岁', 'color': '#fbbf24'},
            {'key': 'ge_56', 'label': '≥56岁', 'color': '#f87171'}
        ]

        # 获取所有在职干部及关联数据
        cadres_query = CadreBasicInfo.query.filter_by(status=1).all()

        # 初始化统计数据结构
        pyramid_data = {}
        total_count = 0

        for level in management_levels:
            pyramid_data[level] = {
                'label': level,
                'total': 0,
                'age_distribution': {}
            }
            for age_range in age_ranges:
                pyramid_data[level]['age_distribution'][age_range['key']] = {
                    'label': age_range['label'],
                    'color': age_range['color'],
                    'count': 0,
                    'percentage': 0,
                    'personnel': []  # 人员详情列表
                }

        # 统计数据并收集人员信息
        for cadre in cadres_query:
            level = cadre.management_level
            if not level:
                continue

            if level not in pyramid_data:
                continue

            # 计算年龄
            age = None
            age_key = None
            if cadre.birth_date:
                birth = cadre.birth_date
                age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))

                # 分类到对应年龄段
                if age <= 35:
                    age_key = 'le_35'
                elif 36 <= age <= 45:
                    age_key = '36_45'
                elif 46 <= age <= 55:
                    age_key = '46_55'
                else:
                    age_key = 'ge_56'

            if age_key:
                total_count += 1
                pyramid_data[level]['total'] += 1
                pyramid_data[level]['age_distribution'][age_key]['count'] += 1

                # 添加人员详情
                pyramid_data[level]['age_distribution'][age_key]['personnel'].append({
                    'id': cadre.id,
                    'employee_no': cadre.employee_no,
                    'name': cadre.name,
                    'gender': cadre.gender,
                    'age': age,
                    'birth_date': cadre.birth_date.isoformat() if cadre.birth_date else None,
                    'department': {
                        'id': cadre.department.id,
                        'name': cadre.department.name
                    } if cadre.department else None,
                    'position': {
                        'id': cadre.position.id,
                        'code': cadre.position.position_code,
                        'name': cadre.position.position_name
                    } if cadre.position else None,
                    'job_grade': cadre.job_grade,
                    'education': cadre.education,
                    'political_status': cadre.political_status,
                    'entry_date': cadre.entry_date.isoformat() if cadre.entry_date else None,
                    'management_attribution': cadre.management_attribution
                })

        # 计算每个层级的年龄段百分比
        for level_data in pyramid_data.values():
            level_total = level_data['total']
            for age_data in level_data['age_distribution'].values():
                if level_total > 0:
                    age_data['percentage'] = round(age_data['count'] / level_total * 100, 2)

        # 返回按层级顺序排列的数据
        result = {
            'levels': management_levels,
            'data': pyramid_data,
            'total_count': total_count
        }

        return result

    @staticmethod
    def get_position_risk() -> List[Dict]:
        """
        获取关键岗位风险数据

        风险因子：
        - 匹配度低：人岗匹配度 < 70
        - 年龄风险：任职者年龄 > 55
        - 单点任职：无后备干部
        - 培养缺失：3年无培养记录
        - 任期过长：任期 > 6年

        风险等级：
        - 高风险：>= 3个风险因子
        - 中风险：2个风险因子
        - 低风险：<= 1个风险因子

        Returns:
            岗位风险数据列表
        """
        from sqlalchemy import and_
        from app.models.cadre import CadreDynamicInfo

        # 获取所有关键岗位
        positions = db.session.query(PositionInfo).filter(
            PositionInfo.status == 1
        ).all()

        risk_results = []
        today = datetime.now().date()
        three_years_ago = today.replace(year=today.year - 3)

        for position in positions:
            # 获取当前任职者
            incumbent = db.session.query(CadreBasicInfo).filter(
                and_(
                    CadreBasicInfo.position_id == position.id,
                    CadreBasicInfo.status == 1
                )
            ).first()

            # 初始化风险因子
            risks = {
                'low_match': False,
                'age_risk': False,
                'single_point': False,
                'no_training': False,
                'long_term': False
            }

            # 检查是否有任职者
            if incumbent:
                # 1. 检查匹配度 < 70
                match_result = db.session.query(MatchResult).filter(
                    and_(
                        MatchResult.cadre_id == incumbent.id,
                        MatchResult.position_id == position.id
                    )
                ).order_by(MatchResult.create_time.desc()).first()

                if match_result and match_result.final_score < 70:
                    risks['low_match'] = True

                # 2. 检查年龄 > 55
                if incumbent.birth_date:
                    age = today.year - incumbent.birth_date.year - (
                        (today.month, today.day) < (incumbent.birth_date.month, incumbent.birth_date.day)
                    )
                    if age > 55:
                        risks['age_risk'] = True

                # 3. 检查单点任职（无后备）
                # 查找是否有其他干部可以接替（同一部门、相近能力）
                potential_successors = db.session.query(CadreBasicInfo).filter(
                    and_(
                        CadreBasicInfo.department_id == incumbent.department_id,
                        CadreBasicInfo.id != incumbent.id,
                        CadreBasicInfo.status == 1
                    )
                ).count()

                if potential_successors == 0:
                    risks['single_point'] = True

                # 4. 检查培养缺失（3年无培养记录）
                training_count = db.session.query(CadreDynamicInfo).filter(
                    and_(
                        CadreDynamicInfo.cadre_id == incumbent.id,
                        CadreDynamicInfo.info_type == 1,  # 培训记录
                        CadreDynamicInfo.create_time >= three_years_ago
                    )
                ).count()

                if training_count == 0:
                    risks['no_training'] = True

                # 5. 检查任期过长 > 6年
                if incumbent.entry_date:
                    entry_years = today.year - incumbent.entry_date.year - (
                        (today.month, today.day) < (incumbent.entry_date.month, incumbent.entry_date.day)
                    )
                    if entry_years > 6:
                        risks['long_term'] = True

            else:
                # 岗位空缺，算作单点任职风险
                risks['single_point'] = True

            # 计算风险数量
            risk_count = sum(1 for v in risks.values() if v)

            # 确定风险等级
            if risk_count >= 3:
                risk_level = 'high'
            elif risk_count >= 2:
                risk_level = 'medium'
            else:
                risk_level = 'low'

            # 构建结果
            result = {
                'position_id': position.id,
                'position_code': position.position_code,
                'position_name': position.position_name,
                'department': '未分配',
                'incumbent': None,
                'risks': risks,
                'risk_count': risk_count,
                'risk_level': risk_level
            }

            # 添加任职者信息
            if incumbent:
                result['incumbent'] = {
                    'id': incumbent.id,
                    'name': incumbent.name,
                    'age': today.year - incumbent.birth_date.year - (
                        (today.month, today.day) < (incumbent.birth_date.month, incumbent.birth_date.day)
                    ) if incumbent.birth_date else None
                }

                # 添加匹配度分数
                if match_result:
                    result['incumbent']['match_score'] = match_result.final_score

            risk_results.append(result)

        # 按风险等级和数量排序
        risk_order = {'high': 0, 'medium': 1, 'low': 2}
        risk_results.sort(key=lambda x: (risk_order[x['risk_level']], -x['risk_count']))

        return risk_results

    @staticmethod
    def get_quality_portrait() -> List[Dict]:
        """
        获取干部质量画像数据

        分析规则：
        - 明星干部：高绩效(近3年≥2次A) + 高匹配(≥80)
        - 潜力干部：高绩效(≥2次A) + 中匹配(60-79) 或 中绩效(1次A) + 高匹配(≥80)
        - 稳健干部：中绩效(1次A) + 中匹配(60-79)
        - 需调整：低绩效(0次A) 或 低匹配(<60)

        Returns:
            干部质量画像数据列表
        """
        from sqlalchemy import and_
        from app.models.cadre import CadreDynamicInfo

        # 获取所有在职干部
        cadres = db.session.query(CadreBasicInfo).filter(
            CadreBasicInfo.status == 1
        ).all()

        quality_results = []
        today = datetime.now().date()
        three_years_ago = today.replace(year=today.year - 3)

        for cadre in cadres:
            # 1. 计算绩效A次数（近3年，S等级也计入A）
            performance_count = db.session.query(CadreDynamicInfo).filter(
                and_(
                    CadreDynamicInfo.cadre_id == cadre.id,
                    CadreDynamicInfo.info_type == 3,  # 绩效数据
                    CadreDynamicInfo.assessment_grade.in_(['A', 'S']),  # S等级比A更优秀，也计入
                    CadreDynamicInfo.create_time >= three_years_ago
                )
            ).count()

            # 2. 获取匹配度分数
            match_score = 0
            if cadre.position_id:
                match_result = db.session.query(MatchResult).filter(
                    and_(
                        MatchResult.cadre_id == cadre.id,
                        MatchResult.position_id == cadre.position_id
                    )
                ).order_by(MatchResult.create_time.desc()).first()
                if match_result:
                    match_score = match_result.final_score

            # 3. 计算核心项目数
            core_project_count = db.session.query(CadreDynamicInfo).filter(
                and_(
                    CadreDynamicInfo.cadre_id == cadre.id,
                    CadreDynamicInfo.info_type == 2,  # 项目经历
                    CadreDynamicInfo.is_core_project == True
                )
            ).count()

            # 4. 确定质量类型
            is_high_performance = performance_count >= 2
            is_medium_performance = performance_count >= 1
            is_high_match = match_score >= 80
            is_medium_match = match_score >= 60

            if is_high_performance and is_high_match:
                quality_type = 'star'  # 明星干部：高绩效+高匹配
            elif is_high_performance and is_medium_match:
                quality_type = 'potential'  # 潜力干部：高绩效+中匹配
            elif is_medium_performance and is_high_match:
                quality_type = 'potential'  # 潜力干部：中绩效+高匹配
            elif is_medium_performance and is_medium_match:
                quality_type = 'stable'  # 稳健干部：中绩效+中匹配
            else:
                quality_type = 'adjust'  # 需调整

            # 构建结果
            result = {
                'id': cadre.id,
                'name': cadre.name,
                'employee_no': cadre.employee_no,
                'department': cadre.department.name if cadre.department else '未分配',
                'position': cadre.position.position_name if cadre.position else '未分配',
                'match_score': match_score,
                'performance_score': performance_count,
                'core_project_count': core_project_count,
                'quality_type': quality_type
            }

            quality_results.append(result)

        # 按质量类型和绩效排序
        quality_order = {'star': 0, 'potential': 1, 'stable': 2, 'adjust': 3}
        quality_results.sort(key=lambda x: (quality_order[x['quality_type']], -x['performance_score']))

        return quality_results

    @staticmethod
    def get_source_and_flow_statistics() -> Dict:
        """
        获取干部来源与流动情况统计数据

        判断逻辑：
        - 外部引进：直接任职当前岗位，没有内部任岗记录（职务变更记录）
        - 内部培养：有任岗记录，从其他岗位调动到当前岗位

        Returns:
            包含来源占比和流动趋势的字典
        """
        from sqlalchemy import and_
        from app.models.cadre import CadreDynamicInfo

        # 获取所有在职干部
        cadres = db.session.query(CadreBasicInfo).filter(
            CadreBasicInfo.status == 1
        ).all()

        # 统计数据
        internal_count = 0  # 内部培养
        external_count = 0  # 外部引进

        # 按年份统计流动情况（最近5年）
        current_year = datetime.now().year
        flow_by_year = {}
        for year in range(current_year - 5, current_year + 1):
            flow_by_year[year] = {
                'internal': 0,  # 内部调动到当前岗位
                'external': 0   # 外部入职
            }

        # 按管理层级统计来源分布
        source_by_level = {
            '战略层': {'internal': 0, 'external': 0},
            '经营层': {'internal': 0, 'external': 0},
            '中层': {'internal': 0, 'external': 0},
            '基层': {'internal': 0, 'external': 0}
        }

        for cadre in cadres:
            # 查询干部的职务变更记录
            appointment_records = db.session.query(CadreDynamicInfo).filter(
                and_(
                    CadreDynamicInfo.cadre_id == cadre.id,
                    CadreDynamicInfo.info_type == 5  # 职务变更
                )
            ).order_by(CadreDynamicInfo.create_time.asc()).all()

            # 判断来源：如果有职务变更记录，且第一条记录的岗位不是当前岗位，则为内部培养
            # 如果没有职务变更记录，或者第一条记录的岗位就是当前岗位，则为外部引进
            is_internal = False

            if appointment_records and len(appointment_records) > 1:
                # 有多次职务变更记录，说明是从其他岗位调来的
                is_internal = True

            # 统计来源
            if is_internal:
                internal_count += 1
                # 按管理层级统计
                if cadre.management_level in source_by_level:
                    source_by_level[cadre.management_level]['internal'] += 1
            else:
                external_count += 1
                # 按管理层级统计
                if cadre.management_level in source_by_level:
                    source_by_level[cadre.management_level]['external'] += 1

            # 统计流动趋势：根据入职时间或首次职务变更时间
            # 如果是外部引进，使用入职时间；如果是内部培养，使用首次职务变更时间
            flow_year = None
            if is_internal and appointment_records:
                # 内部培养：使用首次职务变更的年份
                if appointment_records[0].term_start_date:
                    flow_year = appointment_records[0].term_start_date.year
            elif cadre.entry_date:
                # 外部引进：使用入职年份
                flow_year = cadre.entry_date.year

            if flow_year and flow_year in flow_by_year:
                if is_internal:
                    flow_by_year[flow_year]['internal'] += 1
                else:
                    flow_by_year[flow_year]['external'] += 1

        # 计算总数和占比
        total_count = internal_count + external_count

        # 构建结果
        result = {
            'total_count': total_count,
            'source_distribution': {
                'internal': {
                    'count': internal_count,
                    'percentage': round(internal_count / total_count * 100, 2) if total_count > 0 else 0,
                    'label': '内部培养'
                },
                'external': {
                    'count': external_count,
                    'percentage': round(external_count / total_count * 100, 2) if total_count > 0 else 0,
                    'label': '外部引进'
                }
            },
            'source_by_level': [],
            'flow_trend': []
        }

        # 构建按管理层级的来源分布
        level_order = ['战略层', '经营层', '中层', '基层']
        for level in level_order:
            level_data = source_by_level[level]
            level_total = level_data['internal'] + level_data['external']
            result['source_by_level'].append({
                'level': level,
                'total': level_total,
                'internal': level_data['internal'],
                'external': level_data['external'],
                'internal_percentage': round(level_data['internal'] / level_total * 100, 2) if level_total > 0 else 0,
                'external_percentage': round(level_data['external'] / level_total * 100, 2) if level_total > 0 else 0
            })

        # 构建流动趋势数据
        for year in sorted(flow_by_year.keys()):
            year_data = flow_by_year[year]
            year_total = year_data['internal'] + year_data['external']
            result['flow_trend'].append({
                'year': str(year),
                'total': year_total,
                'internal': year_data['internal'],
                'external': year_data['external']
            })

        return result

    @staticmethod
    def get_flow_cadres_details(year: int = None, source_type: str = None) -> Dict:
        """
        获取流动干部详情列表

        Args:
            year: 年份筛选（近5年）
            source_type: 来源类型筛选（internal-内部培养，external-外部引进）

        Returns:
            包含流动干部详情列表的字典
        """
        from sqlalchemy import and_
        from app.models.cadre import CadreDynamicInfo
        from app.models.position import PositionInfo

        # 获取所有在职干部
        cadres = db.session.query(CadreBasicInfo).filter(
            CadreBasicInfo.status == 1
        ).all()

        # 流动干部详情列表
        flow_cadres = []
        current_year = datetime.now().year

        for cadre in cadres:
            # 查询干部的职务变更记录
            appointment_records = db.session.query(CadreDynamicInfo).filter(
                and_(
                    CadreDynamicInfo.cadre_id == cadre.id,
                    CadreDynamicInfo.info_type == 5  # 职务变更
                )
            ).order_by(CadreDynamicInfo.create_time.asc()).all()

            # 判断来源和流动年份
            is_internal = False
            flow_year = None

            if appointment_records and len(appointment_records) > 1:
                # 有多次职务变更记录，说明是从其他岗位调来的
                is_internal = True
                if appointment_records[0].term_start_date:
                    flow_year = appointment_records[0].term_start_date.year
            elif cadre.entry_date:
                # 外部引进：使用入职年份
                flow_year = cadre.entry_date.year

            # 获取当前岗位信息
            position = None
            if cadre.position_id:
                position = db.session.query(PositionInfo).filter(
                    PositionInfo.id == cadre.position_id
                ).first()

            # 计算年龄
            age = None
            if cadre.birth_date:
                today = datetime.now().date()
                birth_date = cadre.birth_date
                age = today.year - birth_date.year - (
                    (today.month, today.day) < (birth_date.month, birth_date.day)
                )

            # 构建干部详情
            cadre_info = {
                'id': cadre.id,
                'name': cadre.name,
                'gender': cadre.gender,
                'age': age,
                'management_level': cadre.management_level,
                'position': position.position_name if position else None,
                'department': cadre.department.name if cadre.department else None,
                'source_type': 'internal' if is_internal else 'external',
                'source_type_name': '内部培养' if is_internal else '外部引进',
                'flow_year': flow_year,
                'entry_date': cadre.entry_date.isoformat() if cadre.entry_date else None,
            }

            # 按年份和来源类型筛选
            if year and flow_year != year:
                continue
            if source_type and cadre_info['source_type'] != source_type:
                continue

            # 只统计近5年的数据
            if flow_year and flow_year >= current_year - 5:
                flow_cadres.append(cadre_info)

        # 按年份倒序排序
        flow_cadres.sort(key=lambda x: (x['flow_year'] or 0), reverse=True)

        return {
            'total': len(flow_cadres),
            'cadres': flow_cadres
        }
