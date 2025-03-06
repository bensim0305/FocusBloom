# This file serves as the API for my index.html and scripts.js to access gcal_api.py functions:
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from gcal_api import FocusBloomCal
import datetime
import json
import os

app = Flask(__name__, template_folder="../frontend/templates", static_folder="../frontend/static")
CORS(app)  # Allow frontend to communicate with backend


@app.route('/')
def index():
    return render_template('index.html')


fbcInstance = FocusBloomCal()  # Initialize the calendar object


@app.route('/schedule', methods=['POST'])
def schedule_homework():
    data = request.json
    fbcInstance.work_time_start, fbcInstance.work_time_end = fbcInstance.prompt_for_working_hours()
    fbcInstance.schedule_homework_sessions(data['task_name'], data['duration'], data['due_date'])
    return jsonify({"message": "Task scheduled successfully"}), 200


@app.route('/list_events', methods=['GET'])
def list_events():
    events = fbcInstance.list_events(request.args.get('max_results', default=10, type=int))
    
    if not events:
        return jsonify({"message": "No upcoming events found.", "events": []}), 200

    obligations_file = os.path.join(os.getcwd(), "obligations.json")

    try:
        with open(obligations_file, 'w') as file:
            json.dump(events, file, indent=4)
    except Exception as e:
        return jsonify({"error": f"Failed to write to obligations.json: {str(e)}"}), 500

    return jsonify({"message": "Events saved to obligations.json", "events": events}), 200


@app.route('/fetch_events', methods=['GET'])
def fetch_events():
    events = fbcInstance.fetch_events()
    return jsonify(events), 200


@app.route('/check_conflict', methods=['POST'])
def check_conflict():
    data = request.json
    event_times = [
        datetime.datetime.strptime(data['start_time'], '%Y-%m-%d %H:%M:%S'),
        datetime.datetime.strptime(data['end_time'], '%Y-%m-%d %H:%M:%S')
    ]
    conflict = fbcInstance.is_schedule_conflict(fbcInstance.fetch_events(), event_times)
    return jsonify({"conflict": conflict}), 200


@app.route('/reschedule', methods=['POST'])
def reschedule():
    data = request.json
    fbcInstance.reschedule_next_event(data['break_mins'])
    return jsonify({"message": "Break time rescheduled"}), 200


@app.route('/tasks')
def get_tasks():
    json_path = os.path.join(os.path.dirname(__file__), 'tasks.json')

    if not os.path.exists(json_path):
        with open(json_path, 'w') as file:
            json.dump([], file)  # Initialize with an empty list

    try:
        with open(json_path, 'r') as file:
            tasks = json.load(file)
        return jsonify(tasks)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
