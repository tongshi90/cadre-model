# -*- coding: utf-8 -*-
from typing import List, Dict, Optional, Set
from app.models.department import Department
from app.models.cadre import CadreBasicInfo
from app import db


class DepartmentService:
    """部门业务服务类"""

    @staticmethod
    def get_department_tree() -> List[Dict]:
        """
        获取部门树形结构（性能优化版本）

        Returns:
            部门树列表
        """
        # 一次性查询所有启用的部门，避免 N+1 查询问题
        all_departments = Department.query.filter_by(status=1).order_by(
            Department.sort_order
        ).all()

        # 将所有部门转换为字典，并按 parent_id 分组
        dept_map = {}
        dept_children_map = {}

        for dept in all_departments:
            dept_dict = {
                'id': dept.id,
                'name': dept.name,
                'parent_id': dept.parent_id,
                'sort_order': dept.sort_order,
                'status': dept.status,
                'description': dept.description,
            }
            dept_map[dept.id] = dept_dict

            # 按 parent_id 分组
            parent_id = dept.parent_id or 'root'
            if parent_id not in dept_children_map:
                dept_children_map[parent_id] = []
            dept_children_map[parent_id].append(dept_dict)

        # 递归构建树形结构（内存操作，不再查询数据库）
        def build_tree(parent_id=None):
            children = []
            parent_key = parent_id or 'root'
            if parent_key in dept_children_map:
                for child_dict in dept_children_map[parent_key]:
                    # 递归获取子部门
                    child_dict['children'] = build_tree(child_dict['id'])
                    children.append(child_dict)
            return children

        return build_tree()

    @staticmethod
    def get_department_list() -> List[Department]:
        """
        获取部门列表（扁平）

        Returns:
            部门列表
        """
        return Department.query.filter_by(status=1).order_by(
            Department.sort_order
        ).all()

    @staticmethod
    def get_department_by_id(dept_id: int) -> Optional[Department]:
        """根据ID获取部门"""
        return Department.query.get(dept_id)

    @staticmethod
    def create_department(data: Dict) -> Department:
        """
        创建部门

        Args:
            data: 部门数据

        Returns:
            创建的部门对象
        """
        # 如果有父部门ID，检查父部门是否存在
        if data.get('parent_id'):
            parent = Department.query.get(data['parent_id'])
            if not parent:
                raise ValueError('父部门不存在')

        department = Department(**data)
        db.session.add(department)
        db.session.commit()
        db.session.refresh(department)
        return department

    @staticmethod
    def update_department(dept_id: int, data: Dict) -> Optional[Department]:
        """
        更新部门信息

        Args:
            dept_id: 部门ID
            data: 更新数据

        Returns:
            更新后的部门对象
        """
        department = Department.query.get(dept_id)
        if not department:
            return None

        # 不能将自己设为父部门
        if data.get('parent_id') == dept_id:
            raise ValueError('不能将自己设为父部门')

        # 如果有父部门ID，检查父部门是否存在
        if data.get('parent_id'):
            parent = Department.query.get(data['parent_id'])
            if not parent:
                raise ValueError('父部门不存在')
            # 检查是否会形成循环引用
            current = parent
            while current.parent_id:
                if current.parent_id == dept_id:
                    raise ValueError('不能将部门设为自己的子部门')
                current = Department.query.get(current.parent_id)

        for key, value in data.items():
            if hasattr(department, key):
                setattr(department, key, value)

        db.session.commit()
        db.session.refresh(department)
        return department

    @staticmethod
    def _get_all_child_department_ids(dept_id: int) -> Set[int]:
        """
        递归获取所有子部门ID（性能优化版本）

        Args:
            dept_id: 部门ID

        Returns:
            所有子部门ID集合
        """
        # 一次性查询所有启用的部门
        all_departments = Department.query.filter_by(status=1).all()

        # 构建 id -> 部门的映射
        dept_map = {d.id: d for d in all_departments}

        # 使用 BFS 遍历获取所有子部门ID（内存操作）
        child_ids = set()
        queue = [dept_id]

        while queue:
            current_id = queue.pop(0)
            # 查找当前部门的所有子部门
            for dept in all_departments:
                if dept.parent_id == current_id and dept.id not in child_ids:
                    child_ids.add(dept.id)
                    queue.append(dept.id)

        return child_ids

    @staticmethod
    def _check_department_has_cadres(dept_id: int) -> bool:
        """
        检查部门及其所有子部门是否有干部

        Args:
            dept_id: 部门ID

        Returns:
            是否有干部
        """
        all_dept_ids = {dept_id}
        all_dept_ids.update(DepartmentService._get_all_child_department_ids(dept_id))

        cadre_count = CadreBasicInfo.query.filter(
            CadreBasicInfo.department_id.in_(all_dept_ids)
        ).count()

        return cadre_count > 0

    @staticmethod
    def delete_department(dept_id: int) -> Dict:
        """
        删除部门（级联删除子部门）

        Args:
            dept_id: 部门ID

        Returns:
            删除结果信息
        """
        department = Department.query.get(dept_id)
        if not department:
            return {'success': False, 'message': '部门不存在'}

        # 获取所有子部门ID
        child_ids = DepartmentService._get_all_child_department_ids(dept_id)
        all_dept_ids = {dept_id} | child_ids

        # 检查是否有干部
        has_cadres = DepartmentService._check_department_has_cadres(dept_id)
        if has_cadres:
            return {
                'success': False,
                'message': '该部门或其子部门下已有干部，无法删除',
                'has_cadres': True
            }

        # 级联删除所有子部门
        for child_id in child_ids:
            child_dept = Department.query.get(child_id)
            if child_dept:
                db.session.delete(child_dept)

        # 删除当前部门
        db.session.delete(department)
        db.session.commit()

        child_count = len(child_ids)
        if child_count > 0:
            return {
                'success': True,
                'message': f'删除成功（已删除 {child_count} 个子部门）',
                'deleted_children': child_count
            }

        return {'success': True, 'message': '删除成功'}
