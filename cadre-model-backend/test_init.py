# -*- coding: utf-8 -*-
import sys
import os

print("=" * 50)
print("Test script started")
print("Python version:", sys.version)
print("Current directory:", os.getcwd())
print("=" * 50)

# 测试导入
try:
    print("Importing Flask modules...")
    from flask import Flask
    print("Flask imported successfully")
except Exception as e:
    print("Error importing Flask:", e)
    sys.exit(1)

try:
    print("Importing app modules...")
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from app import create_app, db
    print("App modules imported successfully")
except Exception as e:
    print("Error importing app:", e)
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 创建应用
try:
    print("Creating Flask app...")
    app = create_app('development')
    print("Flask app created successfully")
except Exception as e:
    print("Error creating app:", e)
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 初始化数据库
try:
    print("Initializing database...")
    with app.app_context():
        print("Creating tables...")
        db.create_all()
        print("Tables created successfully!")

        # 检查数据库文件
        db_path = app.config['SQLALCHEMY_DATABASE_URI']
        print("Database path:", db_path)

        if db_path.startswith('sqlite:///'):
            db_file = db_path.replace('sqlite:///', '')
            if os.path.exists(db_file):
                print("Database file exists:", db_file)
                print("Database file size:", os.path.getsize(db_file), "bytes")
            else:
                print("WARNING: Database file not found at:", db_file)

except Exception as e:
    print("Error initializing database:", e)
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("=" * 50)
print("Test completed successfully!")
print("=" * 50)
