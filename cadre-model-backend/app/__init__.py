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
    migrate.init_app(app, db)

    # Handle OPTIONS requests before authentication
    @app.before_request
    def handle_options():
        from flask import request
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
            response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response

    # Register API blueprints
    from app.api import cadre_bp, position_bp, match_bp, system_bp
    app.register_blueprint(cadre_bp, url_prefix='/api')
    app.register_blueprint(position_bp, url_prefix='/api')
    app.register_blueprint(match_bp, url_prefix='/api')
    app.register_blueprint(system_bp, url_prefix='/api')

    # Configure CORS using after_request
    @app.after_request
    def after_request(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    # Register error handlers
    from app.utils.handlers import register_error_handlers
    register_error_handlers(app)

    # Create necessary directories
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app
