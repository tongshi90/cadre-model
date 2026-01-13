from app import create_app, db
from sqlalchemy import inspect

app = create_app('development')
with app.app_context():
    inspector = inspect(db.engine)
    columns = inspector.get_columns('cadre_dynamic_info')
    print('=== cadre_dynamic_info 表结构 ===')
    for col in columns:
        print(f'{col["name"]}: {col["type"]} - nullable: {col["nullable"]}')
