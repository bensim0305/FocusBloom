"""
File for communicated with the Google Calendar API. Functions here should be used for FocusBloom.
Functions to implement:
    - Schedule Task: based on parameters given by user, such as how long each wokr session would take, 
    when it is due, priority, name of task. These can for now be implemented through command line
        - Helper: look through calendar to find open timeslot
    - Reschedule Task: User can reschedule task to add on to next available day before due date
Data Structures: Should have a dictionary with task details so we can update accordingly with dates 
    to work on, length of how long it should take, etc. Should update whenever a task is finished


"""
import sys
import datetime
import google.auth
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar']

def authenticate_google_calendar():
    """Authenticate and return the Google Calendar API service."""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('calendar', 'v3', credentials=creds)

def create_event(service, task_name, start_time, end_time):
    """Create a Google Calendar event."""
    event = {
        'summary': task_name,
        'start': {
            'dateTime': start_time,
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': end_time,
            'timeZone': 'UTC',
        },
    }
    event = service.events().insert(calendarId='primary', body=event).execute()
    print(f"Event created: {event.get('htmlLink')}")

def schedule_homework_sessions(task_name, time_increment, priority, due_date):
    """Schedule homework sessions based on the given parameters."""
    service = authenticate_google_calendar()
    due_date = datetime.datetime.strptime(due_date, '%Y-%m-%d')
    current_time = datetime.datetime.utcnow()

    while current_time < due_date:
        end_time = current_time + datetime.timedelta(minutes=time_increment)
        create_event(service, task_name, current_time.isoformat(), end_time.isoformat())
        current_time = end_time + datetime.timedelta(hours=1)  # Add a break between sessions

if __name__ == '__main__':
    if len(sys.argv) != 5:
        print("Usage: python schedule_homework.py <task_name> <time_increment> <priority> <due_date>")
        sys.exit(1)

    task_name = sys.argv[1]
    time_increment = int(sys.argv[2])
    priority = int(sys.argv[3])
    due_date = sys.argv[4]

    schedule_homework_sessions(task_name, time_increment, priority, due_date)