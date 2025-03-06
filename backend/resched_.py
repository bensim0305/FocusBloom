
''' TODO: put into class FocusBloomCal '''

    ''' Helper '''
    def free_between(self, start, end):
        service = self.service
        events = service.events().list(
            calendarId='primary', 
            timeMin=start, timeMax = end, 
            orderBy='startTime').execute().get('items', [])
        if not events: 
            return True
        else: 
            return False

    ''' BREAK_MINS: how long the user wants to break after an existing event ends '''
    def reschedule_next_event(self, now, break_mins=0): 
        service = self.service

       ''' End of tomorrow (now only reschedule within 2 days) '''
        EOD_tmrw = datetime.datetime.combine(now + datetime.timedelta(days=1), time.max)
        events_2days = service.events().list(
            calendarId='primary', timeMin=now, timeMax=EOD_tmrw,
            singleEvents=True,
            orderBy='startTime').execute().get('items', [])
        if not events_2days:
            Print("No upcoming event to reschedule.")
            return False
        
        ''' The event to reschedule and its key info '''
        enext = event_2days[0]
        next_start = enext['start'].get('dateTime', enext['start'].get('date'))
        next_end = enext['end'].get('dateTime', enext['end'].get('date'))
        next_dur = next_start - next_end ''' Should be a timedelta '''
        next_name = enext['summary']
        next_id = enext['id']
        
        event_count = len(events_2days)
        for i in range (1, event_count):
            ''' A future event and its end time '''
            e = events_2days[i] 
            end = event['end'].get('dateTime', event['end'].get('date'))
            ''' The tentative new start and end times of the 
                event being rescheduled '''
            resched_start = end + datetime.timedelta(minutes=break_mins)
            resched_end = resched_start + next_dur
            ''' Test if we are free during new time '''
            if (free_between(start, end) 
                and resched_end <= self.work_time_end):
                ''' Reschedule, and cancel original ''' 
                create_event(service, next_name, 
                              resched_start, resched_end)
                service.events().delete(
                    calendarId='primary', 
                    eventId=next_id).execute()
                print(f"Event {next_name} rescheduled to {resched_start}") 
                return True
        
        print("No free time slot in 2 days")
        return False


