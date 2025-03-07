# FocusBloom: Task Manager Google Calendar Extension for College Students with ADHD

This application is a simple task manager that allows users to create, view, and delete tasks while integrating with Google Calendar to easily manage their events. The backend is built using Python and Flask, while the frontend is developed with JavaScript and fetch API requests.

## Features
- Add, view, and delete tasks.
- Store tasks in a `tasks.json` file.
- Connect to Google Calendar API to retrieve, schedule, reschedule, and manage events.
- Store events in a `obligations.json` file, synced with user's Google Calendar account.
- Simple frontend with JavaScript for handling user interactions.

## Installation

### Prerequisites
- Python 3.X
- Flask
- Google API Client (for Google Calendar integration)

### Setup
1. Clone the repository (alternatively unzip the zip file):
```sh
git clone https://github.com/bensim0305/FocusBloom
cd FocusBloom
```

2. Install dependencies in requirement.txt
```sh 
pip install -r requirements.txt
```

3. Set up Google API credentials:
    -   Create a project on the Google Cloud Console.
    -   Enable the Google Calendar API.
    -   Download the `credentials.json` file and place it in the root directory.

4. Run the Flask application:
```sh
cd backend
python3 app.py
```

5. Once the backend server is running, click on the local URL that the webapp runs on (hypothetically, http://127.0.0.1:5000, but may be different for different machines)

## Backend Functions
Backend functions in `backend/gcal_api.py`can be run on command line using the following commands:

- **schedule_homework_sessions:** Prompts the user to enter working hours and uses them to schedules work sessions for the given task
`python3 gcal_api.py schedule "task_name" duration "due_date"`
    -   `task_name` (string): Name of the task.
    -   `duration` (int): Duration of each work session in minutes.
    -   `due_date` (string): Due date of the task (YYYY-MM-DD).

- **list_events:** Lists the upcoming 10 events/obligations from Google Calendar
`python3 gcal_api.py list --max_results=n`
    -   `max_results` (int, optional): Maximum number of events to list (default: 10).

- **reschedule_next_event:** Reschedules the next event by adjusting break time
`python3 gcal_api.py reschedule break_mins`
    -   `break_mins` (int): Duration of break time in minutes.

- **fetch_events:** Fetches events from Google Calendar and optionally prints to command line.
`python3 gcal_api.py fetch`

- **is_schedule_conflict:** Checks if there are scheduling conflicts between existing events and a predefined time range.
`python3 gcal_api.py conflict`      

- **finish_task:** Marks the current task as finished
`python3 gcal_api.py finish`

## Frontend Functions
Frontend functions in `frontend/static/script.js` are run in `frontend/templates/index.html` when the page is loaded up in browser. These functions either access json files (`tasks.json`, `obligations.json`) in the backend or run Python functions in `backend/gcal_api.py` through the Flask app routes in `backend/app.py`.

### Focus Mode
-   `heyListen();`: Triggers a check-in alert with vibration and audio, dims the screen, and updates the UI.
-  `restartTimer();`: Restarts the check-in timer if it was stopped.
-   `continueTask();`: Resets the UI after a check-in and resumes the task.
-   `skipTask();`: Skips the current task, marks it as "Rescheduled," moves it to the end of the task list, and loads the next task.
-   `finishTask();`: Marks the current task as finished, plays a confirmation sound, and moves to the next task.
-   `workTimePrompt();`: Sets the work session end date and fetches reference event details.
-   `beginFocusMode();`: Starts a focus session by setting the end time and scheduling the task.
-   `scheduleTask(taskName, duration, dueDate);`: Sends a request to the backend to schedule a task with the given parameters.
-   `calculateDuration(startTime, endTime);`: Computes the duration in minutes between the start and end time.
-   `createEvent(service, taskName, startTime, endTime)`: Sends a request to the backend to create a calendar event.
-   `loadNextTask();`: Sorts tasks by priority and deadline, updates the UI, and starts a countdown timer.

### Tasks Mode

- `showTable(tableType);`: Displays either the task table or obligations table based on the `tableType` parameter (`tasks` or `obligations`). 
- `loadTasks();`: Fetches tasks data from the server and dynamically populates the task table.
- `renderTaskTable();`: Renders the task table, displaying all tasks or a "No upcoming tasks found" message if no tasks exist.
- `sortTable(column);`: Sorts the task table by the specified column (priority, title, or deadline) and updates the sorting arrow.
- `updateSortingArrow();`: Updates the sorting arrows based on the current sort column.
- `formatDateTime(dateTimeString);`: Formats a date-time string into a human-readable format.
- `loadObligations();`: Fetches obligations data from the server and populates the obligations table.
- `updatePriority();`: Updates the priority slider value and displays it in the UI.
- `createNewTask();`: Collects data from the task creation form, sends it to the backend to create a new task, and refreshes the task list.
- `editTasks();`: Toggles between editing tasks and creating new ones, allowing for task editing in the UI.
- `makeTasksClickable(enable);`: Makes task rows clickable in edit mode, allowing for task selection.
- `loadTaskIntoForm(index);`: Loads the selected task into the form for editing.
- `saveTask();`: Saves the edited task data back to the backend.
- `clearTasks();`: Clears all tasks by sending a request to delete them from the backend.

## Known Issues
-   The app does not automatically refresh the frontend after a task is deleted.
-   Users must manually refresh sometimes to see updated task lists.

## Future Enhancements
-   Improve UI to dynamically update task lists without page refresh.
-   Add authentication to manage user-specific tasks.