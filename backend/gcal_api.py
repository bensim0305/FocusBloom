import argparse
import datetime
import os.path
import google.auth
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar']

class FocusBloomCal:
    """Class to hold functions to be used alongside FocusBloom app."""
    
    def __init__(self, work_time_start="09:00", work_time_end="17:00"):
        """Initialize with preferred working hours for weekdays."""
        self.work_time_start = datetime.datetime.strptime(work_time_start, "%H:%M").time()
        self.work_time_end = datetime.datetime.strptime(work_time_end, "%H:%M").time()
        self.tasks_scheduled = 0
        self.event_times = {}
        
    def authenticate_google_calendar(self):
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

    def create_event(self, service, task_name, start_time, end_time):
        """Create a Google Calendar event in CST timezone."""
        event = {
            'summary': task_name,
            'start': {
                'dateTime': start_time,
                'timeZone': 'America/Chicago',  # Set timezone to CST
            },
            'end': {
                'dateTime': end_time,
                'timeZone': 'America/Chicago',  # Set timezone to CST
            },
        }
        event = service.events().insert(calendarId='primary', body=event).execute()
        print(f"Event created: {event.get('htmlLink')}")

    def schedule_homework_sessions(self, task_name, time_duration, due_date):
        """
        Schedule homework sessions up to 2 times a day within preferred working hours.
        """
        service = self.authenticate_google_calendar()
        due_date = datetime.datetime.strptime(due_date, '%Y-%m-%d').date()
        current_date = datetime.datetime.now().date()  # Use local time

        while current_date < due_date:
            # Skip weekends (Saturday=5, Sunday=6)
            if current_date.weekday() < 5:  # 0-4 are weekdays
                # Schedule up to 2 sessions per day
                for session in range(2):
                    # Calculate start and end times for the session
                    start_time = datetime.datetime.combine(
                        current_date,
                        self.work_time_start
                    ) + datetime.timedelta(hours=session * (time_duration / 60 + 1))  # Add break between sessions
                    end_time = start_time + datetime.timedelta(minutes=time_duration)

                    # Check if the session fits within working hours
                    if end_time.time() <= self.work_time_end:
                        # Format times in ISO format with CST timezone
                        start_time_iso = start_time.isoformat()
                        end_time_iso = end_time.isoformat()

                        # Create the event
                        self.create_event(service, task_name, start_time_iso, end_time_iso)
                        self.tasks_scheduled += 1
                    else:
                        break  # Stop scheduling for the day if the session doesn't fit

            # Move to the next day
            current_date += datetime.timedelta(days=1)

    def list_events(self, max_results=10):
        """List the next 10 events on the user's calendar."""
        service = self.authenticate_google_calendar()
        now = datetime.datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
        events_result = service.events().list(calendarId='primary', timeMin=now,
                                              maxResults=max_results, singleEvents=True,
                                              orderBy='startTime').execute()
        events = events_result.get('items', [])

        if not events:
            print('No upcoming events found.')
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            print(f"{start} - {event['summary']}")

    def is_schedule_conflict(self):
        """Checks if there are any conflicting events"""
        service = self.authenticate_google_calendar()
        now = datetime.datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time      
        events_result = service.events().list(calendarId='primary', timeMin=now,
                                               singleEvents=True,
                                               orderBy='startTime').execute() 
        events = events_result.get('items', [])

    def prompt_for_working_hours(self):
        """Prompt the user for their preferred working hours."""
        valid_entry = False
        while not valid_entry:
            work_time_start = input("Enter your preferred start time for work (HH:MM, e.g., 09:00): ")
            work_time_end = input("Enter your preferred end time for work (HH:MM, e.g., 17:00): ")
            if (not is_valid_input(work_time_start, work_time_end)):
                print("Error: Input is invalid!")
            else:
                valid_entry = True
        work_time_start = datetime.datetime.strptime(work_time_start, "%H:%M").time()
        work_time_end = datetime.datetime.strptime(work_time_end, "%H:%M").time()
        return work_time_start, work_time_end

def is_valid_input(work_time_start, work_time_end):
    """Checks if time inputs are of valid format"""
    try:
        start = datetime.datetime.strptime(work_time_start, "%H:%M").time()
        end = datetime.datetime.strptime(work_time_end, "%H:%M").time()
    except:
        return False
    if end < start:
        return False
    return True


def main():
    """
    Example usage: python3 gcal_api.py schedule "inclusive project" 90 "2025-03-07"   
    """
    parser = argparse.ArgumentParser(description="FocusBloom Calendar CLI")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Schedule task command
    schedule_parser = subparsers.add_parser('schedule', help='Schedule a new task')
    schedule_parser.add_argument('task_name', type=str, help='Name of the task')
    schedule_parser.add_argument('time_duration', type=int, help='Duration of each work session in minutes')
    schedule_parser.add_argument('due_date', type=str, help='Due date of the task (YYYY-MM-DD)')

    # List events command
    list_parser = subparsers.add_parser('list', help='List upcoming events')
    list_parser.add_argument('--max_results', type=int, default=10, help='Maximum number of events to list')

    args = parser.parse_args()

    # Initalize calendar object
    user_calendar = FocusBloomCal()
    
    # while (session):
    if args.command == 'schedule':
        user_calendar.work_time_start, user_calendar.work_time_end = user_calendar.prompt_for_working_hours()
        user_calendar.schedule_homework_sessions(args.task_name, args.time_duration, args.due_date)
    elif args.command == 'list':
        user_calendar.list_events(args.max_results)
    else:
        parser.print_help()
        # response = input()
        

if __name__ == '__main__':
    main()