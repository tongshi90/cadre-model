import os
from datetime import timedelta


class Config:
    """基础配置"""
    # 密钥配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # 数据库配置
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    # MySQL 数据库配置
    MYSQL_HOST = os.environ.get('MYSQL_HOST', '192.168.18.77')
    MYSQL_PORT = os.environ.get('MYSQL_PORT', '13306')
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'ADSqGN24Qi2pS_BAxpf')
    MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'cadre_model')

    # 数据库连接字符串
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 当需要连接 MySQL 服务器但不指定数据库时（用于创建数据库）
    SQLALCHEMY_DATABASE_URI_NO_DB = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}?charset=utf8mb4"

    # CORS配置
    CORS_ORIGINS = os.environ.get('FRONTEND_URL', 'http://localhost:5173').split(',')

    # 文件上传配置
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'data', 'uploads')
    ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}

    # 分页配置
    ITEMS_PER_PAGE = 20

    # 匹配度计算配置
    MATCH_LEVEL_EXCELLENT = 80  # 优质匹配阈值
    MATCH_LEVEL_QUALIFIED = 60  # 合格匹配阈值


class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    # 测试环境使用内存数据库或 SQLite
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
