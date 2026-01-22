import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()


def create_app(config_name='default'):
    """Application factory"""
    app = Flask(__name__)

    # Load configuration
    from config import config
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app)

    # Configure CORS
    # 支持通过环境变量 FRONTEND_URL 配置，多个地址用逗号分隔
    # 默认允许所有源（开发环境），生产环境建议配置具体的前端地址
    cors_origins = os.environ.get('FRONTEND_URL', '*').split(',')

    CORS(app,
         resources={r"/api/*": {"origins": cors_origins}},
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
         expose_headers=['Content-Type', 'Authorization'])

    # Register API blueprints
    from app.api import cadre_bp, position_bp, match_bp, system_bp, ai_analysis_bp, weekly_report_bp
    app.register_blueprint(cadre_bp, url_prefix='/api')
    app.register_blueprint(position_bp, url_prefix='/api')
    app.register_blueprint(match_bp, url_prefix='/api')
    app.register_blueprint(system_bp, url_prefix='/api')
    app.register_blueprint(ai_analysis_bp, url_prefix='/api')
    app.register_blueprint(weekly_report_bp, url_prefix='/api')

    # Register error handlers
    from app.utils.handlers import register_error_handlers
    register_error_handlers(app)

    # Create necessary directories
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app
