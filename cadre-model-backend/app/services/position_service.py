from typing import List, Dict, Optional
from app.models.position import PositionInfo, PositionAbilityWeight, PositionRequirement
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
            包含硬性要求和建议要求的字典
        """
        requirements = PositionRequirement.query.filter_by(position_id=position_id).all()

        mandatory = [r for r in requirements if r.requirement_type == 'mandatory']
        suggested = [r for r in requirements if r.requirement_type == 'suggested']

        return {
            'mandatory': [r.to_dict() for r in mandatory],
            'suggested': [r.to_dict() for r in suggested]
        }

    @staticmethod
    def update_position_requirements(position_id: int, requirements: Dict) -> bool:
        """
        更新岗位要求

        Args:
            position_id: 岗位ID
            requirements: 包含mandatory和suggested的字典

        Returns:
            是否更新成功
        """
        # 删除原有要求
        PositionRequirement.query.filter_by(position_id=position_id).delete()

        # 添加新要求
        for req_type in ['mandatory', 'suggested']:
            if req_type in requirements:
                for req_data in requirements[req_type]:
                    req_data['requirement_type'] = req_type
                    req = PositionRequirement(position_id=position_id, **req_data)
                    db.session.add(req)

        db.session.commit()
        return True

    @staticmethod
    def get_all_positions() -> List[PositionInfo]:
        """获取所有启用的岗位"""
        return PositionInfo.query.filter_by(status=1).all()
