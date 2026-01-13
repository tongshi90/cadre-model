from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import date
from app.models.cadre import CadreBasicInfo, CadreDynamicInfo, CadreTrait, CadreAbilityScore
from app import db


class CadreService:
    """干部业务服务类"""

    @staticmethod
    def get_cadre_list(
        page: int = 1,
        page_size: int = 20,
        name: Optional[str] = None,
        status: Optional[int] = None,
        department: Optional[str] = None
    ) -> Dict:
        """
        获取干部列表

        Args:
            page: 页码
            page_size: 每页数量
            name: 姓名筛选
            status: 状态筛选
            department: 部门ID筛选（包含子部门）

        Returns:
            分页结果
        """
        query = CadreBasicInfo.query

        # 筛选条件
        if name:
            query = query.filter(CadreBasicInfo.name.like(f'%{name}%'))
        if status is not None:
            query = query.filter(CadreBasicInfo.status == status)

        # 部门筛选（包含子部门）
        if department:
            from app.services.department_service import DepartmentService
            try:
                dept_id = int(department)
                # 获取该部门及所有子部门ID
                child_ids = DepartmentService._get_all_child_department_ids(dept_id)
                all_dept_ids = {dept_id} | child_ids
                query = query.filter(CadreBasicInfo.department_id.in_(all_dept_ids))
            except (ValueError, TypeError):
                pass

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
    def get_cadre_by_id(cadre_id: int) -> Optional[CadreBasicInfo]:
        """根据ID获取干部"""
        return CadreBasicInfo.query.get(cadre_id)

    @staticmethod
    def create_cadre(data: Dict) -> CadreBasicInfo:
        """
        创建干部

        Args:
            data: 干部数据

        Returns:
            创建的干部对象
        """
        # 检查工号是否存在
        if CadreBasicInfo.query.filter_by(employee_no=data['employee_no']).first():
            raise ValueError(f'工号 {data["employee_no"]} 已存在')

        cadre = CadreBasicInfo(**data)
        db.session.add(cadre)
        db.session.commit()
        db.session.refresh(cadre)
        return cadre

    @staticmethod
    def update_cadre(cadre_id: int, data: Dict) -> Optional[CadreBasicInfo]:
        """
        更新干部信息

        Args:
            cadre_id: 干部ID
            data: 更新数据

        Returns:
            更新后的干部对象
        """
        cadre = CadreBasicInfo.query.get(cadre_id)
        if not cadre:
            return None

        # 如果更新工号，检查是否存在
        if 'employee_no' in data and data['employee_no'] != cadre.employee_no:
            if CadreBasicInfo.query.filter_by(employee_no=data['employee_no']).first():
                raise ValueError(f'工号 {data["employee_no"]} 已存在')

        for key, value in data.items():
            if hasattr(cadre, key):
                setattr(cadre, key, value)

        db.session.commit()
        db.session.refresh(cadre)
        return cadre

    @staticmethod
    def delete_cadre(cadre_id: int) -> bool:
        """
        删除干部

        Args:
            cadre_id: 干部ID

        Returns:
            是否删除成功
        """
        cadre = CadreBasicInfo.query.get(cadre_id)
        if not cadre:
            return False

        db.session.delete(cadre)
        db.session.commit()
        return True

    @staticmethod
    def get_cadre_traits(cadre_id: int) -> List[CadreTrait]:
        """获取干部特质列表"""
        return CadreTrait.query.filter_by(cadre_id=cadre_id).all()

    @staticmethod
    def update_cadre_traits(cadre_id: int, traits: List[Dict]) -> bool:
        """
        更新干部特质

        Args:
            cadre_id: 干部ID
            traits: 特质列表

        Returns:
            是否更新成功
        """
        from app.utils.trait_constants import get_trait_value_description

        # 删除原有特质
        CadreTrait.query.filter_by(cadre_id=cadre_id).delete()

        # 添加新特质 (trait_data已包含cadre_id)
        for trait_data in traits:
            # 如果没有提供 trait_desc，自动填充
            if 'trait_desc' not in trait_data or not trait_data['trait_desc']:
                trait_type = trait_data.get('trait_type')
                trait_value = trait_data.get('trait_value')
                trait_data['trait_desc'] = get_trait_value_description(trait_type, trait_value)

            trait = CadreTrait(**trait_data)
            db.session.add(trait)

        db.session.commit()
        return True

    @staticmethod
    def get_cadre_abilities(cadre_id: int) -> List[CadreAbilityScore]:
        """获取干部能力评分列表"""
        return CadreAbilityScore.query.filter_by(cadre_id=cadre_id).all()

    @staticmethod
    def get_cadre_dynamic_info(cadre_id: int, info_type: int = None) -> List[CadreDynamicInfo]:
        """获取干部动态信息列表"""
        query = CadreDynamicInfo.query.filter_by(cadre_id=cadre_id)
        if info_type is not None:
            query = query.filter_by(info_type=info_type)
        # 按创建时间降序排序
        return query.order_by(CadreDynamicInfo.create_time.desc()).all()

    @staticmethod
    def update_cadre_abilities(cadre_id: int, abilities: List[Dict], current_user: str = None) -> bool:
        """
        更新干部能力评分

        Args:
            cadre_id: 干部ID
            abilities: 能力评分列表
            current_user: 当前登录用户名

        Returns:
            是否更新成功
        """
        # 删除原有评分
        CadreAbilityScore.query.filter_by(cadre_id=cadre_id).delete()

        # 添加新评分 (ability_data已包含cadre_id)
        today = date.today()
        for ability_data in abilities:
            # 自动设置评估人和评估日期
            if current_user and 'assessor' not in ability_data:
                ability_data['assessor'] = current_user
            if 'assessment_date' not in ability_data or not ability_data['assessment_date']:
                ability_data['assessment_date'] = today
            ability = CadreAbilityScore(**ability_data)
            db.session.add(ability)

        db.session.commit()
        return True

    @staticmethod
    def add_dynamic_info(cadre_id: int, info_data: Dict) -> CadreDynamicInfo:
        """
        添加动态信息

        Args:
            cadre_id: 干部ID
            info_data: 动态信息数据

        Returns:
            创建的动态信息对象
        """
        # info_data已包含cadre_id，直接使用避免重复传递
        info = CadreDynamicInfo(**info_data)
        db.session.add(info)
        db.session.commit()
        db.session.refresh(info)
        return info

    @staticmethod
    def update_dynamic_info(info_id: int, data: Dict) -> Optional[CadreDynamicInfo]:
        """更新动态信息"""
        info = CadreDynamicInfo.query.get(info_id)
        if not info:
            return None

        for key, value in data.items():
            if hasattr(info, key):
                setattr(info, key, value)

        db.session.commit()
        db.session.refresh(info)
        return info

    @staticmethod
    def delete_dynamic_info(info_id: int) -> bool:
        """删除动态信息"""
        info = CadreDynamicInfo.query.get(info_id)
        if not info:
            return False

        db.session.delete(info)
        db.session.commit()
        return True
