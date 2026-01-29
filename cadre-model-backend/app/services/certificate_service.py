# -*- coding: utf-8 -*-
from typing import List, Dict, Optional, Set
from app.models.certificate import Certificate
from app import db


class CertificateService:
    """证书业务服务类"""

    @staticmethod
    def get_certificate_tree() -> List[Dict]:
        """
        获取证书树形结构（两层结构：第一层证书类型，第二层证书名）

        Returns:
            证书树列表
        """
        # 查询所有启用的证书类型（parent_id为NULL）
        certificate_types = Certificate.query.filter_by(parent_id=None, status=1).order_by(
            Certificate.sort_order
        ).all()

        # 构建树形结构
        result = []
        for cert_type in certificate_types:
            cert_type_dict = {
                'id': cert_type.id,
                'name': cert_type.name,
                'parent_id': cert_type.parent_id,
                'sort_order': cert_type.sort_order,
                'status': cert_type.status,
                'description': cert_type.description,
                'children': []
            }

            # 查询该证书类型下的所有证书名
            certificates = Certificate.query.filter_by(parent_id=cert_type.id, status=1).order_by(
                Certificate.sort_order
            ).all()

            for cert in certificates:
                cert_dict = {
                    'id': cert.id,
                    'name': cert.name,
                    'parent_id': cert.parent_id,
                    'sort_order': cert.sort_order,
                    'status': cert.status,
                    'description': cert.description,
                    'children': []  # 固定两层，证书名下不再有子节点
                }
                cert_type_dict['children'].append(cert_dict)

            result.append(cert_type_dict)

        return result

    @staticmethod
    def get_certificate_list() -> List[Certificate]:
        """
        获取证书列表（扁平）

        Returns:
            证书列表
        """
        return Certificate.query.filter_by(status=1).order_by(
            Certificate.sort_order
        ).all()

    @staticmethod
    def get_certificate_by_id(certificate_id: int) -> Optional[Certificate]:
        """根据ID获取证书"""
        return Certificate.query.get(certificate_id)

    @staticmethod
    def create_certificate(data: Dict) -> Certificate:
        """
        创建证书

        Args:
            data: 证书数据

        Returns:
            创建的证书对象
        """
        parent_id = data.get('parent_id')

        # 如果有父ID，检查父节点是否存在
        if parent_id:
            parent = Certificate.query.get(parent_id)
            if not parent:
                raise ValueError('父节点不存在')
            # 检查父节点是否已经是第二层（证书名）
            if parent.parent_id is not None:
                raise ValueError('证书名下不能再创建子节点')

        # 自动计算 sort_order：同级节点最大值 + 1
        max_sort_order = db.session.query(db.func.max(Certificate.sort_order)).filter(
            Certificate.parent_id == parent_id
        ).scalar()
        data['sort_order'] = (max_sort_order or 0) + 1

        certificate = Certificate(**data)
        db.session.add(certificate)
        db.session.commit()
        db.session.refresh(certificate)
        return certificate

    @staticmethod
    def update_certificate(certificate_id: int, data: Dict) -> Optional[Certificate]:
        """
        更新证书信息

        Args:
            certificate_id: 证书ID
            data: 更新数据

        Returns:
            更新后的证书对象
        """
        certificate = Certificate.query.get(certificate_id)
        if not certificate:
            return None

        # 不能将自己设为父节点
        if data.get('parent_id') == certificate_id:
            raise ValueError('不能将自己设为父节点')

        # 如果有父ID，检查父节点是否存在
        if data.get('parent_id'):
            parent = Certificate.query.get(data['parent_id'])
            if not parent:
                raise ValueError('父节点不存在')
            # 检查父节点是否已经是第二层（证书名）
            if parent.parent_id is not None:
                raise ValueError('证书名下不能再创建子节点')
            # 检查是否会形成循环引用
            if parent.parent_id == certificate_id:
                raise ValueError('不能将子节点设为父节点')

        for key, value in data.items():
            if hasattr(certificate, key):
                setattr(certificate, key, value)

        db.session.commit()
        db.session.refresh(certificate)
        return certificate

    @staticmethod
    def _get_all_child_certificate_ids(certificate_id: int) -> Set[int]:
        """
        递归获取所有子证书ID

        Args:
            certificate_id: 证书ID

        Returns:
            所有子证书ID集合
        """
        # 一次性查询所有启用的证书
        all_certificates = Certificate.query.filter_by(status=1).all()

        # 构建 id -> 证书的映射
        certificate_map = {c.id: c for c in all_certificates}

        # 使用 BFS 遍历获取所有子证书ID（内存操作）
        child_ids = set()
        queue = [certificate_id]

        while queue:
            current_id = queue.pop(0)
            # 查找当前证书的所有子证书
            for cert in all_certificates:
                if cert.parent_id == current_id and cert.id not in child_ids:
                    child_ids.add(cert.id)
                    queue.append(cert.id)

        return child_ids

    @staticmethod
    def delete_certificate(certificate_id: int) -> Dict:
        """
        删除证书（级联删除子证书）

        Args:
            certificate_id: 证书ID

        Returns:
            删除结果信息
        """
        certificate = Certificate.query.get(certificate_id)
        if not certificate:
            return {'success': False, 'message': '证书不存在'}

        # 获取所有子证书ID
        child_ids = CertificateService._get_all_child_certificate_ids(certificate_id)
        all_certificate_ids = {certificate_id} | child_ids

        # 级联删除所有子证书
        for child_id in child_ids:
            child_certificate = Certificate.query.get(child_id)
            if child_certificate:
                db.session.delete(child_certificate)

        # 删除当前证书
        db.session.delete(certificate)
        db.session.commit()

        child_count = len(child_ids)
        if child_count > 0:
            return {
                'success': True,
                'message': f'删除成功（已删除 {child_count} 个子证书）',
                'deleted_children': child_count
            }

        return {'success': True, 'message': '删除成功'}
