"""Local-only Squishy-Kuma web server. Run: python app.py"""
import argparse
from pathlib import Path
from flask import Flask, render_template

ROOT = Path(__file__).resolve().parent
app = Flask(__name__, template_folder=str(ROOT / 'templates'), static_folder=str(ROOT / 'static'))

@app.get('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Squishy-Kuma local game')
    parser.add_argument('--port', type=int, default=5000, help='Local port (default: 5000)')
    args = parser.parse_args()
    app.run(host='127.0.0.1', port=args.port, debug=False)
