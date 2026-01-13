# -*- coding: utf-8 -*-
import os
from app import create_app

config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config_name)

if __name__ == '__main__':
    print("Starting Flask server...")
    print("Server will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop the server\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
