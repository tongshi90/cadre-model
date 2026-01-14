from flask import Blueprint

cadre_bp = Blueprint('cadre', __name__)
position_bp = Blueprint('position', __name__)
match_bp = Blueprint('match', __name__)
system_bp = Blueprint('system', __name__)
ai_analysis_bp = Blueprint('ai_analysis', __name__)

from app.api import cadre, position, match, system, department, ai_analysis
