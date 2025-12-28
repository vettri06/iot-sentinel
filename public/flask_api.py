"""
Flask API Wrapper for IoT Security Scanner
==========================================

Add this file to your Python scanner project and run it to provide
the REST API that the React dashboard connects to.

Requirements:
    pip install flask flask-cors

Usage:
    python flask_api.py

The API will be available at http://0.0.0.0:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import json
import os
from datetime import datetime

# Import your existing scanner modules
from iot_scanner import IoTSecurityScanner
from config import Config

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize the scanner
scanner = IoTSecurityScanner()

# Simple password protection (configure in config.py)
API_PASSWORD = getattr(Config, 'API_PASSWORD', 'admin123')

def require_auth(f):
    """Decorator to require password authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        password = request.headers.get('X-Auth-Password')
        if password != API_PASSWORD:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

# ==================== Authentication ====================

@app.route('/api/auth', methods=['POST'])
def authenticate():
    """Validate password"""
    data = request.get_json() or {}
    password = data.get('password', '')
    
    if password == API_PASSWORD:
        return jsonify({'valid': True})
    return jsonify({'valid': False, 'error': 'Invalid password'}), 401

# ==================== Network Interfaces ====================

@app.route('/api/interfaces', methods=['GET'])
@require_auth
def get_interfaces():
    """Get available network interfaces"""
    try:
        interfaces = scanner.get_network_interfaces()
        return jsonify(interfaces)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Scan Operations ====================

@app.route('/api/scan/start', methods=['POST'])
@require_auth
def start_scan():
    """Start a new network scan"""
    try:
        data = request.get_json() or {}
        interface = data.get('interface')
        mode = data.get('mode', 'quick')
        port_range = data.get('port_range')
        target = data.get('target')
        
        scan_id = scanner.start_scan(
            interface=interface,
            mode=mode,
            port_range=port_range,
            target=target
        )
        
        return jsonify({'scan_id': scan_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan/status', methods=['GET'])
@require_auth
def get_scan_status():
    """Get current scan status"""
    try:
        status = scanner.get_scan_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan/results', methods=['GET'])
@require_auth
def get_scan_results():
    """Get latest scan results"""
    try:
        results = scanner.get_scan_results()
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan/stop', methods=['POST'])
@require_auth
def stop_scan():
    """Stop the current scan"""
    try:
        scanner.stop_scan()
        return jsonify({'stopped': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Devices ====================

@app.route('/api/devices', methods=['GET'])
@require_auth
def get_devices():
    """Get all discovered devices"""
    try:
        devices = scanner.get_devices()
        return jsonify(devices)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/devices/<ip>', methods=['GET'])
@require_auth
def get_device(ip):
    """Get detailed info for a specific device"""
    try:
        device = scanner.get_device_details(ip)
        if device:
            return jsonify(device)
        return jsonify({'error': 'Device not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Vulnerabilities ====================

@app.route('/api/vulnerabilities', methods=['GET'])
@require_auth
def get_vulnerabilities():
    """Get all detected vulnerabilities"""
    try:
        vulns = scanner.get_vulnerabilities()
        return jsonify(vulns)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Reports ====================

@app.route('/api/reports', methods=['GET'])
@require_auth
def get_reports():
    """Get list of saved reports"""
    try:
        reports = scanner.get_reports()
        return jsonify(reports)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<report_id>', methods=['GET'])
@require_auth
def get_report(report_id):
    """Get specific report details"""
    try:
        report = scanner.get_report(report_id)
        if report:
            return jsonify(report)
        return jsonify({'error': 'Report not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<report_id>/download', methods=['GET'])
@require_auth
def download_report(report_id):
    """Download report as JSON"""
    try:
        report = scanner.get_report(report_id)
        if report:
            return jsonify(report), 200, {
                'Content-Disposition': f'attachment; filename=report-{report_id}.json'
            }
        return jsonify({'error': 'Report not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Logs ====================

@app.route('/api/logs', methods=['GET'])
@require_auth
def get_logs():
    """Get recent log entries"""
    try:
        level = request.args.get('level')
        logs = scanner.get_logs(level=level)
        return jsonify(logs)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== AI Status ====================

@app.route('/api/ai/status', methods=['GET'])
@require_auth
def get_ai_status():
    """Get AI model status"""
    try:
        status = scanner.get_ai_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Settings ====================

@app.route('/api/settings', methods=['GET'])
@require_auth
def get_settings():
    """Get current settings"""
    try:
        settings = {
            'default_interface': getattr(Config, 'DEFAULT_INTERFACE', None),
            'default_scan_mode': getattr(Config, 'DEFAULT_SCAN_MODE', 'quick'),
            'default_port_range': getattr(Config, 'DEFAULT_PORT_RANGE', '1-1000'),
            'max_threads': getattr(Config, 'MAX_THREADS', 10),
            'log_level': getattr(Config, 'LOG_LEVEL', 'INFO'),
            'save_reports': getattr(Config, 'SAVE_REPORTS', True),
        }
        return jsonify(settings)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['PUT'])
@require_auth
def update_settings():
    """Update settings"""
    try:
        data = request.get_json() or {}
        # Update Config values (you may want to persist these)
        for key, value in data.items():
            setattr(Config, key.upper(), value)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings/password', methods=['POST'])
@require_auth
def update_password():
    """Update API password"""
    global API_PASSWORD
    try:
        data = request.get_json() or {}
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        if old_password != API_PASSWORD:
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        API_PASSWORD = new_password
        return jsonify({'updated': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("IoT Security Scanner API")
    print("=" * 50)
    print(f"Starting server on http://0.0.0.0:5000")
    print(f"Default password: {API_PASSWORD}")
    print("=" * 50)
    
    # Run on 0.0.0.0 to allow network access
    app.run(host='0.0.0.0', port=5000, debug=True)
