import argparse
import datetime
import os.path
import google.auth
from zoneinfo import ZoneInfo
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import json

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar']


class FocusBloomCal:
    """Class to hold functions to be used alongside FocusBloom app."""
    
    # initialize the object with what time we are starting work, and what time we are ending
    # work. 
    def __init__(self, work_time_start="09:00", work_time_end="17:00"):
        """Initialize with preferred working hours for weekdays."""
        self.work_time_start = datetime.datetime.strptime(work_time_start, "%H:%M").time()
        self.work_time_end = datetime.datetime.strptime(work_time_end, "%H:%M").time()
        self.service = self.authenticate_google_calendar()
        page_token = None
        self.events = self.fetch_events() # list of existing events.

    # make sure the web app is connected to google calendar
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

    # fetch the events already in google calendar-- call these OBLIGATIONS
    def fetch_events(self):
        events = {}
        unique_event_titles = {}  # to handle entries with identical names
        page_token = None
        while True:
            try:
                events_result = self.service.events().list(
                    calendarId='primary', pageToken=page_token).execute()
                for event in events_result.get('items', []):
                    event_title = event.get('summary')
                    if event_title not in unique_event_titles:
                        unique_event_titles[event_title] = 1
                        events[event_title + f' ({unique_event_titles[event_title]})'] = event  # Store the entire event as the value
                    else:
                        unique_event_titles[event_title] += 1
                        events[event_title + f' ({unique_event_titles[event_title]})'] = event
                    page_token = events_result.get('nextPageToken')
                if not page_token:
                    break
            except Exception as e:
                print(f"An error occurred: {e}")
                break

        # Overwrite obligations.json with the fetched events
        events_path = os.path.join(os.path.dirname(__file__), 'obligations.json')

        try:
            with open(events_path, 'w') as file:
                json.dump(events, file, indent=4)  # Writing events dictionary to the file with proper indentation
            print(f"obligations.json has been updated with {len(events)} events.")
        except Exception as e:
            print(f"Error writing to obligations.json: {e}")
            
        return events

    def is_schedule_conflict(self, current_events, scheduled_event):
        """Checks for schedule conflict before scheduling task"""
        print("Debug is_schedule_conflict")
        events_start_end_times = {}
        scheduled_event_start = scheduled_event[0]
        scheduled_event_end = scheduled_event[1]

        for key in current_events.keys():
            events_start_end_times[key] = [current_events[key]['start'], current_events[key]['end']]

        print(f"-----------------------------------\nProposed Start: {scheduled_event_start}\nProposed End: {scheduled_event_end}\n-----------------------------------")
        ctr = 0
        for vals in events_start_end_times.values():
            ctr += 1
            start = datetime.datetime.strptime(vals[0]['dateTime'].split('T')[0] + vals[0]['dateTime'].split('T')[1].split('-')[0], '%Y-%m-%d%H:%M:%S')
            end = datetime.datetime.strptime(vals[1]['dateTime'].split('T')[0] + vals[1]['dateTime'].split('T')[1].split('-')[0], '%Y-%m-%d%H:%M:%S')
            print(f"Event {ctr}:\n   Start: {start}\n   End: {end}")
            if (scheduled_event_start >= start and scheduled_event_start < end) or (scheduled_event_end >= start and scheduled_event_end <= end):
                return True
        return False
        
    def create_event(self, service, task_name, start_time, end_time):
        """Create a Google Calendar event in CST timezone."""
            # Ensure start and end are in RFC3339 format
        if isinstance(start_time, datetime.datetime):
            start_time = start_time.isoformat()
        if isinstance(end_time, datetime.datetime):
            end_time = end_time.isoformat()
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

    def schedule_homework_sessions(self, task_name, duration, due_date):
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
                    if session == 0:
                        start_time = datetime.datetime.combine(
                            current_date,
                            self.work_time_start
                        ) + datetime.timedelta(hours=session * (duration / 60 + 1))  # Add break between sessions
                    else:
                        start_time = end_time + datetime.timedelta(hours=1)  # Add break between sessions
                    end_time = start_time + datetime.timedelta(minutes=duration)
                    scheduled_event = (start_time, end_time)
                    is_conflict = self.is_schedule_conflict(self.events, scheduled_event)
                    while (is_conflict and end_time.time() <= self.work_time_end):
                        print("Conflict found! Scheduling next available slot.")
                        start_time = start_time + datetime.timedelta(hours=1)  # Add break between sessions
                        end_time = start_time + datetime.timedelta(minutes=duration)
                        print(f"New start time: {start_time}")
                        print(f"New end time: {end_time}")
                        scheduled_event = (start_time, end_time)
                        is_conflict = self.is_schedule_conflict(self.events, scheduled_event)
                    else:
                        print("No schedule conflicts!")
                        # Check if the session fits within working hours
                        if end_time.time() <= self.work_time_end:
                            # Format times in ISO format with CST timezone
                            start_time_iso = start_time.isoformat()
                            end_time_iso = end_time.isoformat()

                            # Create the event
                            self.create_event(service, task_name, start_time_iso, end_time_iso)
                        else:
                            break  # Stop scheduling for the day if the session doesn't fit

            # Move to the next day
            current_date += datetime.timedelta(days=1)
    
    def finish_task(self):
        """
        Finished the current task and clears it from the calendar 
        """
        service = self.service
        current_date = datetime.datetime.now(tz=ZoneInfo("America/Chicago"))
        time_min = current_date.isoformat()

        events = self.service.events().list(
                calendarId='primary',
                timeMin=time_min,
                maxResults=1,
                singleEvents=True,
                orderBy='startTime'
            ).execute().get('items', [])

        if not events:
            print("No current task to finish.")
            return

        # Delete the event
        event = events[0]
        event_id = event['id']
        self.service.events().delete(calendarId='primary', eventId=event_id).execute()
        print(f"Task '{event['summary']}' marked as finished and removed from the calendar.")

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
        return datetime.datetime.strptime(work_time_start, "%H:%M").time(), datetime.datetime.strptime(work_time_end, "%H:%M").time()

    def list_events(self, max_results=10):
        """List the next 10 events on the user's calendar and save to obligations.json."""
        service = self.authenticate_google_calendar()
        now = datetime.datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])

        if not events:
            print('No upcoming events found.')

        # Fetch available colors from Google Calendar API
        colors = service.colors().get().execute()
        event_colors = colors.get('event', {})  # Extract event colors

        # Add colorId to each event if it exists
        for event in events:
            color_id = event.get('colorId', None)  # Get colorId if available
            if color_id and color_id in event_colors:
                event['color'] = event_colors[color_id]  # Add the actual color name (if it exists)
            else:
                event['color'] = None  # If no colorId or color information, set to None

        # Overwrite obligations.json with the fetched events
        events_path = os.path.join(os.path.dirname(__file__), 'obligations.json')

        try:
            with open(events_path, 'w') as file:
                json.dump(events, file, indent=4)  # Save events to JSON file
            print(f"obligations.json has been updated with {len(events)} events.")
        except Exception as e:
            print(f"Error writing to obligations.json: {e}")

        return events  # <------ Make sure to return the events!

    def free_between(self, start, end):
        """
        Check if the time slot between `start` and `end` is completely free.
        """
        service = self.service

        # Convert start and end to datetime objects if they are strings
        if isinstance(start, str):
            start = datetime.datetime.fromisoformat(start)
        if isinstance(end, str):
            end = datetime.datetime.fromisoformat(end)

        # Ensure start is earlier than end
        if start >= end:
            raise ValueError(f"Invalid time range: start ({start}) must be earlier than end ({end})")

        # Convert start and end to RFC3339 format
        time_min = start.isoformat()
        time_max = end.isoformat()

        # Fetch events in the time range
        events = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute().get('items', [])

        # If no events, the slot is free
        if not events:
            return True

        # Check for overlapping events
        for event in events:
            event_start = event['start'].get('dateTime', event['start'].get('date'))
            event_end = event['end'].get('dateTime', event['end'].get('date'))

            # Convert event start and end to datetime objects
            event_start = datetime.datetime.fromisoformat(event_start)
            event_end = datetime.datetime.fromisoformat(event_end)

            # Check for overlap
            if not (event_end <= start or event_start >= end):
                # There is an overlap, so the slot is not free
                return False

        # No overlapping events found
        return True

    def reschedule_next_event(self, break_mins=0): 
        service = self.authenticate_google_calendar()

        now = datetime.datetime.now(tz=ZoneInfo("America/Chicago"))

        # EOD to be rescheduled within 2 days
        EOD_tmrw = datetime.datetime.combine(now.date() + datetime.timedelta(days=1), datetime.time.max)
        EOD_tmrw = EOD_tmrw.replace(tzinfo=ZoneInfo("America/Chicago"))

        events_2days = service.events().list(
            calendarId='primary', timeMin=now.isoformat(), timeMax=EOD_tmrw.isoformat(),
            singleEvents=True,
            orderBy='startTime').execute().get('items', [])
        if not events_2days:
            print("No upcoming event to reschedule.")
            return False
        
        # event to reschedule
        enext = events_2days[0]
        next_start = datetime.datetime.fromisoformat(enext['start'].get('dateTime', enext['start'].get('date')))
        next_end = datetime.datetime.fromisoformat(enext['end'].get('dateTime', enext['end'].get('date')))
        next_dur = next_end - next_start  # Should be a timedelta 
        next_name = enext['summary']
        next_id = enext['id']
        
        event_count = len(events_2days)
        for i in range (1, event_count):
            # future event and end time
            e = events_2days[i] 
            end = datetime.datetime.fromisoformat(e['end'].get('dateTime', e['end'].get('date')))
            # tentative new start and end times to reschedule

            resched_start = end + datetime.timedelta(minutes=break_mins)
            if resched_start.time() < self.work_time_start:
                resched_start = datetime.combine(resched_start.date(), self.work_time_start, tzinfo=ZoneInfo("America/Chicago"))

            resched_end = resched_start + next_dur

            # move to next available workday if busy
            if resched_end.time() > self.work_time_end:
                next_day = resched_start.date() + datetime.timedelta(days=1)
                resched_start = datetime.datetime.combine(next_day, self.work_time_start, tzinfo=ZoneInfo("America/Chicago"))
                resched_end = resched_start + next_dur

            # checking if free during new time
            if (self.free_between(resched_start.isoformat(), resched_end.isoformat()) 
                and resched_end <= datetime.datetime.combine(resched_end.date(), self.work_time_end).replace(tzinfo=ZoneInfo("America/Chicago"))):
                ''' Reschedule, and cancel original ''' 
                self.create_event(service, next_name,
                                resched_start, resched_end)
                service.events().delete(
                    calendarId='primary',
                    eventId=next_id).execute()
                print(f"Event {next_name} rescheduled to {resched_start}") 
                return True
        
        print("No free time slot in 2 days")
        return False


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
    schedule_parser.add_argument('duration', type=int, help='Duration of each work session in minutes')
    schedule_parser.add_argument('due_date', type=str, help='Due date of the task (YYYY-MM-DD)')

    # List events command
    list_parser = subparsers.add_parser('list', help='List upcoming events')
    list_parser.add_argument('--max_results', type=int, default=10, help='Maximum number of events to list')

    # Reschedule breaktime
    breaktime_parser = subparsers.add_parser('reschedule', help="Reschedule task")
    breaktime_parser.add_argument('break_mins', type=int, help="Breaktime duration")

    subparsers.add_parser('fetch', help='fetch events testing')
    subparsers.add_parser('conflict', help='schedule conflict testing')

    #finish task
    finish_parser = subparsers.add_parser("finish", help="Finish current task")

    args = parser.parse_args()

    # Initalize object
    user_calendar = FocusBloomCal()

    # while (session):
    if args.command == 'schedule':
        user_calendar.work_time_start, user_calendar.work_time_end = user_calendar.prompt_for_working_hours()
        user_calendar.schedule_homework_sessions(args.task_name, args.duration, args.due_date)
    elif args.command == 'list':
        user_calendar.list_events(args.max_results)
    elif args.command == 'fetch':
        print(user_calendar.fetch_events())
    elif args.command == "conflict":
        is_conflict = user_calendar.is_schedule_conflict(user_calendar.fetch_events(), [datetime.datetime.strptime('2025-03-0510:30:00', '%Y-%m-%d%H:%M:%S'), datetime.datetime.strptime('2025-03-0515:30:00', '%Y-%m-%d%H:%M:%S')])
        if (is_conflict):
            print("Conflict found!")
        else:
            print("No schedule conflicts!")
    elif args.command == "reschedule":
        user_calendar.reschedule_next_event(args.break_mins)
    elif args.command == "finish":
        user_calendar.finish_task()
    else:
        parser.print_help()
        # response = input()
        

if __name__ == '__main__':
    main()
