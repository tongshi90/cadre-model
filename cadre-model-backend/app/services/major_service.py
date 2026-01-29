# -*- coding: utf-8 -*-
from typing import List, Dict, Optional, Set
from app.models.major import Major
from app import db


class MajorService:
    """专业业务服务类"""

    @staticmethod
    def get_major_tree() -> List[Dict]:
        """
        获取专业树形结构（两层结构：第一层岗位类型，第二层专业类型）

        Returns:
            专业树列表
        """
        # 查询所有启用的岗位类型（parent_id为NULL）
        position_types = Major.query.filter_by(parent_id=None, status=1).order_by(
            Major.sort_order
        ).all()

        # 构建树形结构
        result = []
        for position_type in position_types:
            position_dict = {
                'id': position_type.id,
                'name': position_type.name,
                'parent_id': position_type.parent_id,
                'sort_order': position_type.sort_order,
                'status': position_type.status,
                'description': position_type.description,
                'children': []
            }

            # 查询该岗位类型下的所有专业类型
            major_types = Major.query.filter_by(parent_id=position_type.id, status=1).order_by(
                Major.sort_order
            ).all()

            for major_type in major_types:
                major_dict = {
                    'id': major_type.id,
                    'name': major_type.name,
                    'parent_id': major_type.parent_id,
                    'sort_order': major_type.sort_order,
                    'status': major_type.status,
                    'description': major_type.description,
                    'children': []  # 固定两层，专业类型下不再有子节点
                }
                position_dict['children'].append(major_dict)

            result.append(position_dict)

        return result

    @staticmethod
    def get_major_list() -> List[Major]:
        """
        获取专业列表（扁平）

        Returns:
            专业列表
        """
        return Major.query.filter_by(status=1).order_by(
            Major.sort_order
        ).all()

    @staticmethod
    def get_major_by_id(major_id: int) -> Optional[Major]:
        """根据ID获取专业"""
        return Major.query.get(major_id)

    @staticmethod
    def create_major(data: Dict) -> Major:
        """
        创建专业

        Args:
            data: 专业数据

        Returns:
            创建的专业对象
        """
        parent_id = data.get('parent_id')

        # 如果有父ID，检查父节点是否存在
        if parent_id:
            parent = Major.query.get(parent_id)
            if not parent:
                raise ValueError('父节点不存在')
            # 检查父节点是否已经是第二层（专业类型）
            if parent.parent_id is not None:
                raise ValueError('专业类型下不能再创建子节点')

        # 自动计算 sort_order：同级节点最大值 + 1
        max_sort_order = db.session.query(db.func.max(Major.sort_order)).filter(
            Major.parent_id == parent_id
        ).scalar()
        data['sort_order'] = (max_sort_order or 0) + 1

        major = Major(**data)
        db.session.add(major)
        db.session.commit()
        db.session.refresh(major)
        return major

    @staticmethod
    def update_major(major_id: int, data: Dict) -> Optional[Major]:
        """
        更新专业信息

        Args:
            major_id: 专业ID
            data: 更新数据

        Returns:
            更新后的专业对象
        """
        major = Major.query.get(major_id)
        if not major:
            return None

        # 不能将自己设为父节点
        if data.get('parent_id') == major_id:
            raise ValueError('不能将自己设为父节点')

        # 如果有父ID，检查父节点是否存在
        if data.get('parent_id'):
            parent = Major.query.get(data['parent_id'])
            if not parent:
                raise ValueError('父节点不存在')
            # 检查父节点是否已经是第二层（专业类型）
            if parent.parent_id is not None:
                raise ValueError('专业类型下不能再创建子节点')
            # 检查是否会形成循环引用
            if parent.parent_id == major_id:
                raise ValueError('不能将子节点设为父节点')

        for key, value in data.items():
            if hasattr(major, key):
                setattr(major, key, value)

        db.session.commit()
        db.session.refresh(major)
        return major

    @staticmethod
    def _get_all_child_major_ids(major_id: int) -> Set[int]:
        """
        递归获取所有子专业ID

        Args:
            major_id: 专业ID

        Returns:
            所有子专业ID集合
        """
        # 一次性查询所有启用的专业
        all_majors = Major.query.filter_by(status=1).all()

        # 构建 id -> 专业的映射
        major_map = {m.id: m for m in all_majors}

        # 使用 BFS 遍历获取所有子专业ID（内存操作）
        child_ids = set()
        queue = [major_id]

        while queue:
            current_id = queue.pop(0)
            # 查找当前专业的所有子专业
            for major in all_majors:
                if major.parent_id == current_id and major.id not in child_ids:
                    child_ids.add(major.id)
                    queue.append(major.id)

        return child_ids

    @staticmethod
    def delete_major(major_id: int) -> Dict:
        """
        删除专业（级联删除子专业）

        Args:
            major_id: 专业ID

        Returns:
            删除结果信息
        """
        major = Major.query.get(major_id)
        if not major:
            return {'success': False, 'message': '专业不存在'}

        # 获取所有子专业ID
        child_ids = MajorService._get_all_child_major_ids(major_id)
        all_major_ids = {major_id} | child_ids

        # 级联删除所有子专业
        for child_id in child_ids:
            child_major = Major.query.get(child_id)
            if child_major:
                db.session.delete(child_major)

        # 删除当前专业
        db.session.delete(major)
        db.session.commit()

        child_count = len(child_ids)
        if child_count > 0:
            return {
                'success': True,
                'message': f'删除成功（已删除 {child_count} 个子专业）',
                'deleted_children': child_count
            }

        return {'success': True, 'message': '删除成功'}
