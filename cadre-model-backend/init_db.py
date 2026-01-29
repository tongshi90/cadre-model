# -*- coding: utf-8 -*-
"""
Database initialization script for MySQL
"""
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pymysql
from app import create_app, db
from app.models.system import User
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

        # Create admin account
        print("Creating admin account...")
        admin = User()
        admin.username = 'admin'
        admin.set_password('Aa123456')
        admin.real_name = 'admin'
        admin.is_admin = 1
        admin.status = 1
        db.session.add(admin)
        db.session.commit()

        print("\n" + "=" * 50)
        print("Database initialization completed!")
        print("Database:", Config.MYSQL_DATABASE)
        print("Host:", Config.MYSQL_HOST)
        print("Initial admin account: admin")
        print("Initial admin password: Aa123456")
        print("=" * 50 + "\n")


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Initialize the database')
    parser.add_argument('--force', action='store_true', help='Force reinitialize by dropping all tables first')
    args = parser.parse_args()

    init_database(force=args.force)
