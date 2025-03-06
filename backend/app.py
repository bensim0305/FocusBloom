# This file serves as the API for my index.html and scripts.js to access gcal_api.py functions:
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from gcal_api import FocusBloomCal
import datetime
import json
import os

app = Flask(__name__, template_folder="../frontend/templates", static_folder="../frontend/static")
CORS(app)  # Allow frontend to communicate with backend


# this route displays the index.html page from the frontend folder
@app.route('/')
def index():
    return render_template('index.html')


# Initialize the calendar object to be used in all the functions in this class
fbcInstance = FocusBloomCal()


@app.route('/schedule', methods=['POST'])
def schedule_homework():
    data = request.json
    fbcInstance.work_time_start, fbcInstance.work_time_end = fbcInstance.prompt_for_working_hours()
    fbcInstance.schedule_homework_sessions(data['task_name'], data['duration'], data['due_date'])
    return jsonify({"message": "Task scheduled successfully"}), 200


# this route runs list_events() (get next 10 events) and puts the output in obligations.json
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


# this route runs fetch_events()
@app.route('/fetch_events', methods=['GET'])
def fetch_events():
    events = fbcInstance.fetch_events()
    return jsonify(events), 200


# this route gets the earliest event in obligations.json
@app.route('/reference_event')
def get_obligations():
    json_path = os.path.join(os.path.dirname(__file__), 'obligations.json')

    if not os.path.exists(json_path):
        with open(json_path, 'w') as file:
            json.dump([], file)  # Initialize with an empty list

    try:
        with open(json_path, 'r') as file:
            obligations = json.load(file)
        return jsonify(obligations)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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


# this route loads all the tasks in tasks.json when the page is opened/when a
# new task is added
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


# this route creates a new task to append to tasks.json
@app.route('/create_task', methods=['POST'])
def create_task():
    try:
        # Get the task data from the request
        task_data = request.get_json()

        # Define the path to the tasks.json file
        tasks_path = os.path.join(os.path.dirname(__file__), 'tasks.json')

        # Read existing tasks from tasks.json, if it exists
        if os.path.exists(tasks_path):
            with open(tasks_path, 'r') as file:
                tasks = json.load(file)
        else:
            tasks = []

        # Append the new task to the list
        tasks.append(task_data)

        # Write the updated tasks back to tasks.json
        with open(tasks_path, 'w') as file:
            json.dump(tasks, file, indent=4)

        return jsonify({"success": True, "message": "Task created successfully!"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# Route to update an existing task by index
@app.route("/save_task", methods=["POST"])
def save_tasks():
    tasks = request.json
    tasks_path = os.path.join(os.path.dirname(__file__), 'tasks.json')
    with open(tasks_path, "w") as file:
        json.dump(tasks, file, indent=4)
    return jsonify({"message": "Tasks updated successfully!"}), 200


# Route to clear all tasks from the task list
@app.route('/delete_all_tasks', methods=['DELETE'])
def delete_all_tasks():
    json_path = os.path.join(os.path.dirname(__file__), 'tasks.json')

    # Set tasks.json to an empty array
    try:
        with open(json_path, 'w') as file:
            json.dump([], file)  # Write an empty list to the file
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Route to finish a task
@app.route("/finish_task", methods=["POST"])
def finish_task():
    tasks = request.json
    fbcInstance.finish_task()

    tasks_path = os.path.join(os.path.dirname(__file__), 'tasks.json')
    with open(tasks_path, "w") as file:
        json.dump(tasks, file, indent=4)
    return jsonify({"message": "Tasks updated successfully!"}), 200
    

# Route to delete a specific task by index
# @app.route('/delete_task', methods=['DELETE'])
# def delete_task():
#     try:
#         # Get the index from the request parameters
#         index = int(request.args.get('index'))

#         # Path to the tasks.json file
#         json_path = os.path.join(os.path.dirname(__file__), 'tasks.json')

#         # Read the current tasks from tasks.json
#         with open(json_path, 'r') as file:
#             tasks = json.load(file)

#         # Check if the index is valid
#         if index < 0 or index >= len(tasks):
#             return jsonify({"error": "Invalid index"}), 400

#         # Remove the task at the given index
#         removed_task = tasks.pop(index)

#         # Save the updated task list back to tasks.json
#         with open(json_path, 'w') as file:
#             json.dump(tasks, file, indent=2)

#         # Return a success response with the removed task data
#         return jsonify({"success": True, "removed_task": removed_task})

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
