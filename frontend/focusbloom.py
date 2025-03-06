from flask import Flask, render_template, request
import sys
sys.path.insert(0, '../backend')
import gcal_api  # Assuming your Google Calendar API code is in gcal_api.py

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')  # You'll need to create an index.html file in a 'templates' folder


@app.route('/create_event', methods=['POST'])
def create_event():
    # Assuming you have a form in your HTML to post these data
    task_name = request.form['task_name']
    start_time = request.form['start_time']
    end_time = request.form['end_time']
    # You might need to adjust the function call depending on how you've structured your API code
    gcal_api.create_event(task_name, start_time, end_time)
    return 'Event created!'


@app.route('/background_process_test', methods=['POST'])
def background_process_test():
    print ("Hello")
    # return ("nothing")


if __name__ == '__main__':
    app.run(debug=True)  # Runs the server in debug mode on the local machine
