function loadCalendarEvents() {
    fetch('/api/events')  // Assuming you have set up an endpoint to fetch calendar events
        .then(response => response.json())
        .then(data => {
            const eventsDiv = document.getElementById('events');
            eventsDiv.innerHTML = '';  // Clear previous events
            data.forEach(event => {
                const eventDiv = document.createElement('div');
                eventDiv.textContent = `Event: ${event.summary} - Start: ${event.start.dateTime}`;
                eventsDiv.appendChild(eventDiv);
            });
        })
        .catch(error => console.error('Error fetching events:', error));
}