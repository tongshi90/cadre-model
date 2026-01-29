from typing import List, Dict, Optional
from app.models.position import PositionInfo, PositionAbilityWeight, PositionRequirement
from app.models.major import Major
from app.models.certificate import Certificate
from app import db


class PositionService:
    """岗位业务服务类"""

    @staticmethod
    def get_position_list(
        page: int = 1,
        page_size: int = 20,
        position_name: Optional[str] = None,
        position_level: Optional[str] = None,
        status: Optional[int] = None
    ) -> Dict:
        """
        获取岗位列表

        Args:
            page: 页码
            page_size: 每页数量
            position_name: 岗位名称模糊搜索
            position_level: 岗位层级筛选
            status: 状态筛选

        Returns:
            分页结果
        """
        query = PositionInfo.query

        # 筛选条件
        if position_name:
            query = query.filter(PositionInfo.position_name.like(f'%{position_name}%'))
        if position_level:
            query = query.filter(PositionInfo.position_level == position_level)
        if status is not None:
            query = query.filter(PositionInfo.status == status)

        # 总数
        total = query.count()

        # 分页查询
        items = query.offset((page - 1) * page_size).limit(page_size).all()

        return {
            'items': [item.to_dict() for item in items],
            'total': total,
            'page': page,
            'page_size': page_size
        }

    @staticmethod
    def get_position_by_id(position_id: int) -> Optional[PositionInfo]:
        """根据ID获取岗位"""
        return PositionInfo.query.get(position_id)

    @staticmethod
    def create_position(data: Dict) -> PositionInfo:
        """
        创建岗位

        Args:
            data: 岗位数据

        Returns:
            创建的岗位对象
        """
        position = PositionInfo(**data)
        db.session.add(position)
        db.session.commit()
        db.session.refresh(position)
        return position

    @staticmethod
    def update_position(position_id: int, data: Dict) -> Optional[PositionInfo]:
        """
        更新岗位信息

        Args:
            position_id: 岗位ID
            data: 更新数据

        Returns:
            更新后的岗位对象
        """
        position = PositionInfo.query.get(position_id)
        if not position:
            return None

        for key, value in data.items():
            if hasattr(position, key):
                setattr(position, key, value)

        db.session.commit()
        db.session.refresh(position)
        return position

    @staticmethod
    def delete_position(position_id: int) -> bool:
        """
        删除岗位

        Args:
            position_id: 岗位ID

        Returns:
            是否删除成功
        """
        position = PositionInfo.query.get(position_id)
        if not position:
            return False

        db.session.delete(position)
        db.session.commit()
        return True

    @staticmethod
    def get_position_weights(position_id: int) -> List[PositionAbilityWeight]:
        """获取岗位能力权重列表"""
        return PositionAbilityWeight.query.filter_by(position_id=position_id).all()

    @staticmethod
    def update_position_weights(position_id: int, weights: List[Dict]) -> bool:
        """
        更新岗位能力权重

        Args:
            position_id: 岗位ID
            weights: 权重列表（每个维度一条记录）

        Returns:
            是否更新成功
        """
        # 验证权重总和
        total_weight = sum(w.get('weight', 0) for w in weights)
        if abs(total_weight - 100) > 0.01:
            raise ValueError(f'权重总和必须为100%，当前为{total_weight}%')

        # 删除原有权重
        PositionAbilityWeight.query.filter_by(position_id=position_id).delete()

        # 添加新权重（每个维度一条记录）
        for weight_data in weights:
            weight = PositionAbilityWeight(
                position_id=position_id,
                ability_dimension=weight_data['ability_dimension'],
                weight=weight_data['weight']
            )
            db.session.add(weight)

        db.session.commit()
        return True

    @staticmethod
    def get_position_requirements(position_id: int) -> Dict:
        """
        获取岗位要求

        Returns:
            包含硬性要求和加分项的字典
        """
        requirements = PositionRequirement.query.filter_by(
            position_id=position_id,
            status=1
        ).order_by(PositionRequirement.sort_order).all()

        mandatory = [r for r in requirements if r.requirement_type == 'mandatory']
        bonus = [r for r in requirements if r.requirement_type == 'bonus']

        return {
            'mandatory': [r.to_dict() for r in mandatory],
            'bonus': [r.to_dict() for r in bonus]
        }

    @staticmethod
    def update_position_requirements(position_id: int, requirements: List[Dict]) -> bool:
        """
        更新岗位要求

        Args:
            position_id: 岗位ID
            requirements: 岗位要求列表

        Returns:
            是否更新成功
        """
        # 删除原有要求
        PositionRequirement.query.filter_by(position_id=position_id).delete()

        # 添加新要求
        for idx, req_data in enumerate(requirements):
            req = PositionRequirement(
                position_id=position_id,
                requirement_type=req_data.get('requirement_type'),
                indicator_type=req_data.get('indicator_type'),
                operator=req_data.get('operator', '>='),
                compare_value=req_data.get('compare_value'),
                score_value=req_data.get('score_value'),
                sort_order=idx + 1,
                status=1
            )
            db.session.add(req)

        db.session.commit()
        return True

    @staticmethod
    def get_all_positions() -> List[PositionInfo]:
        """获取所有启用的岗位"""
        return PositionInfo.query.filter_by(status=1).all()

    @staticmethod
    def get_major_list() -> List[Dict]:
        """获取专业列表（用于下拉选择）"""
        majors = Major.query.filter_by(status=1).order_by(Major.sort_order).all()
        # 返回扁平列表，包含层级信息
        result = []
        for major in majors:
            result.append({
                'id': major.id,
                'name': major.name,
                'parent_id': major.parent_id,
                'level': 1 if major.parent_id is None else 2
            })
        return result

    @staticmethod
    def get_certificate_list() -> List[Dict]:
        """获取证书列表（用于下拉选择）"""
        certificates = Certificate.query.filter_by(status=1).order_by(Certificate.sort_order).all()
        # 返回扁平列表，包含层级信息
        result = []
        for cert in certificates:
            result.append({
                'id': cert.id,
                'name': cert.name,
                'parent_id': cert.parent_id,
                'level': 1 if cert.parent_id is None else 2
            })
        return result
