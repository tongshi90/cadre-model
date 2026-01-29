from flask import Blueprint

cadre_bp = Blueprint('cadre', __name__)
position_bp = Blueprint('position', __name__)
match_bp = Blueprint('match', __name__)
system_bp = Blueprint('system', __name__)
ai_analysis_bp = Blueprint('ai_analysis', __name__)
weekly_report_bp = Blueprint('weekly_report', __name__)
major_bp = Blueprint('major', __name__)
certificate_bp = Blueprint('certificate', __name__)

from app.api import cadre, position, match, system, department, ai_analysis, weekly_report, major, certificate
