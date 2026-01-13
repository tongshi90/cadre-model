# -*- coding: utf-8 -*-
"""
Database initialization script for MySQL
"""
import os
import sys
from datetime import date, timedelta
import random

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pymysql
from sqlalchemy import create_engine, text
from app import create_app, db
from app.models.cadre import CadreBasicInfo, CadreAbilityScore, CadreTrait
from app.models.position import PositionInfo, PositionAbilityWeight
from app.models.system import User
from app.models.department import Department
from app.utils.ability_constants import ABILITY_DIMENSIONS, ABILITY_DIMENSION_LIST
from app.utils.trait_constants import TRAITS_CONFIG
from config import Config


def create_database_if_not_exists():
    """如果数据库不存在则创建"""
    try:
        # 连接到 MySQL 服务器（不指定数据库）
        connection = pymysql.connect(
            host=Config.MYSQL_HOST,
            port=int(Config.MYSQL_PORT),
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            charset='utf8mb4'
        )
        cursor = connection.cursor()

        # 检查数据库是否存在
        cursor.execute(f"SHOW DATABASES LIKE '{Config.MYSQL_DATABASE}'")
        result = cursor.fetchone()

        if not result:
            # 创建数据库
            cursor.execute(f"""
                CREATE DATABASE `{Config.MYSQL_DATABASE}`
                CHARACTER SET utf8mb4
                COLLATE utf8mb4_unicode_ci
            """)
            print(f"Database '{Config.MYSQL_DATABASE}' created successfully!")
        else:
            print(f"Database '{Config.MYSQL_DATABASE}' already exists.")

        cursor.close()
        connection.close()
        return True
    except Exception as e:
        print(f"Error creating database: {e}")
        return False


def init_database(force=False):
    """Initialize database"""
    print("Starting database initialization...")

    # 首先确保数据库存在
    if not create_database_if_not_exists():
        print("Failed to create database. Aborting...")
        return

    app = create_app('development')

    with app.app_context():
        # 检查是否已有数据
        if not force:
            try:
                # 检查用户表是否有数据
                user_count = db.session.query(User).count()
                if user_count > 0:
                    print(f"\nDatabase already contains data (found {user_count} users).")
                    print("Skipping data initialization.")
                    print("Use --force flag to drop all tables and reinitialize.")
                    return
            except Exception as e:
                # 表可能不存在，继续创建
                print(f"Checking existing data... (tables may not exist yet)")
        else:
            print("Force mode enabled - dropping all tables...")

        # Drop all tables
        print("Dropping existing tables...")
        db.drop_all()

        # Create all tables
        print("Creating tables...")
        db.create_all()

        # Create initial data
        print("Creating initial data...")
        create_initial_data(app)

        print("\n" + "=" * 50)
        print("Database initialization completed!")
        print("Database:", Config.MYSQL_DATABASE)
        print("Host:", Config.MYSQL_HOST)
        print("Initial admin account: admin")
        print("Initial admin password: Aa123456")
        print("=" * 50 + "\n")


def create_initial_data(app):
    """Create initial data"""

    # Create admin account
    print("Creating admin account...")
    admin = User()
    admin.username = 'admin'
    admin.set_password('Aa123456')
    admin.real_name = 'admin'
    admin.is_admin = 1
    admin.status = 1
    db.session.add(admin)

    # Create departments
    print("Creating departments...")
    departments = [
        Department(name='技术部', parent_id=None, sort_order=1, status=1, description='负责技术研发工作'),
        Department(name='市场部', parent_id=None, sort_order=2, status=1, description='负责市场推广工作'),
        Department(name='人力资源部', parent_id=None, sort_order=3, status=1, description='负责人力资源管理工作'),
        Department(name='财务部', parent_id=None, sort_order=4, status=1, description='负责财务管理工作'),
        Department(name='综合管理部', parent_id=None, sort_order=5, status=1, description='负责综合管理工作'),
        Department(name='研发中心', parent_id=1, sort_order=6, status=1, description='负责研发工作'),
        Department(name='测试部', parent_id=1, sort_order=7, status=1, description='负责测试工作'),
        Department(name='销售部', parent_id=2, sort_order=8, status=1, description='负责销售工作'),
    ]
    for dept in departments:
        db.session.add(dept)

    # Commit to get department IDs
    db.session.commit()

    # Refresh to get IDs
    db.session.refresh(departments[0])
    db.session.refresh(departments[1])

    # Create positions (some as key positions)
    print("Creating positions...")
    positions = [
        # 技术部岗位
        PositionInfo(position_code='TECH001', position_name='技术总监', responsibility='负责技术战略规划与团队管理', is_key_position=True, status=1),
        PositionInfo(position_code='TECH002', position_name='架构师', responsibility='负责系统架构设计', is_key_position=True, status=1),
        PositionInfo(position_code='TECH003', position_name='后端开发工程师', responsibility='负责后端系统开发', is_key_position=False, status=1),
        PositionInfo(position_code='TECH004', position_name='前端开发工程师', responsibility='负责前端系统开发', is_key_position=False, status=1),
        PositionInfo(position_code='TECH005', position_name='测试工程师', responsibility='负责系统测试', is_key_position=False, status=1),

        # 市场部岗位
        PositionInfo(position_code='MKT001', position_name='市场总监', responsibility='负责市场战略规划', is_key_position=True, status=1),
        PositionInfo(position_code='MKT002', position_name='销售经理', responsibility='负责销售团队管理', is_key_position=False, status=1),
        PositionInfo(position_code='MKT003', position_name='市场专员', responsibility='负责市场推广活动', is_key_position=False, status=1),

        # 人力资源部岗位
        PositionInfo(position_code='HR001', position_name='人力资源总监', responsibility='负责人力资源战略规划', is_key_position=True, status=1),
        PositionInfo(position_code='HR002', position_name='招聘专员', responsibility='负责招聘工作', is_key_position=False, status=1),

        # 财务部岗位
        PositionInfo(position_code='FIN001', position_name='财务总监', responsibility='负责财务管理工作', is_key_position=True, status=1),
        PositionInfo(position_code='FIN002', position_name='会计', responsibility='负责会计核算', is_key_position=False, status=1),

        # 综合管理部岗位
        PositionInfo(position_code='ADM001', position_name='总经理', responsibility='负责公司整体运营管理', is_key_position=True, status=1),
        PositionInfo(position_code='ADM002', position_name='行政专员', responsibility='负责行政工作', is_key_position=False, status=1),
    ]
    for pos in positions:
        db.session.add(pos)

    # Commit all changes
    db.session.commit()
    print("Initial data created successfully!")
    print("Created admin account (username: admin, password: Aa123456)")
    print(f"Created {len(departments)} departments")
    print(f"Created {len(positions)} positions")


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Initialize the database')
    parser.add_argument('--force', action='store_true', help='Force reinitialize by dropping all tables first')
    args = parser.parse_args()

    init_database(force=args.force)
