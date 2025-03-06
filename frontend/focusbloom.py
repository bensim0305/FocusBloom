from flask import Flask, render_template, request, jsonify
import sys
import os
import json
sys.path.insert(0, '../backend')
import gcal_api  # Assuming your Google Calendar API code is in gcal_api.py

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/create_event', methods=['POST'])
def create_event():
    # Assuming you have a form in your HTML to post these data
    task_name = request.form['task_name']
    start_time = request.form['start_time']
    end_time = request.form['end_time']
    # You might need to adjust the function call depending on how you've structured your API code
    gcal_api.create_event(task_name, start_time, end_time)
    return 'Event created!'


@app.route('/api/events', methods=['GET'])
def get_events():
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'events.json'))
    
    try:
        with open(json_path, 'r') as file:
            events = json.load(file)  # Load JSON data from file
        return jsonify(events)  # Send JSON response
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/tasks')
def get_tasks():
    # Define the path to the tasks.json file
    json_path = os.path.join(os.path.dirname(__file__), 'tasks.json')

    try:
        with open(json_path, 'r') as file:
            tasks = json.load(file)
        return jsonify(tasks)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)  # Runs the server in debug mode on the local machine
