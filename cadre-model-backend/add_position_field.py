"""
数据库迁移脚本：为 cadre_basic_info 表添加 position_id 字段
执行方式：python add_position_field.py
"""
import sqlite3
import os

def migrate():
    # 数据库文件路径
    db_path = os.path.join(os.path.dirname(__file__), 'data', 'cadre_model.db')

    if not os.path.exists(db_path):
        print(f"数据库文件不存在: {db_path}")
        return

    # 连接数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(cadre_basic_info)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'position_id' in columns:
            print("position_id 字段已存在，无需迁移")
            return

        # 添加 position_id 字段
        print("Adding position_id field...")
        cursor.execute("""
            ALTER TABLE cadre_basic_info
            ADD COLUMN position_id INTEGER
            REFERENCES position_info(id)
        """)
        print("OK - position_id field added successfully")

        # 提交更改
        conn.commit()
        print("\nDatabase migration completed!")

    except sqlite3.Error as e:
        print(f"迁移失败: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
