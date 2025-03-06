const API_URL = "http://127.0.0.1:5000";

async function scheduleTask(taskName, duration, dueDate) {
    const response = await fetch(`${API_URL}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_name: taskName, duration: duration, due_date: dueDate })
    });
    const data = await response.json();
    console.log(data.message);
}

async function listEvents() {
    const response = await fetch(`${API_URL}/list_events`);
    const data = await response.json();
    console.log(data);
}

async function fetchEvents() {
    const response = await fetch(`${API_URL}/fetch_events`);
    const data = await response.json();
    console.log(data);
}

async function checkScheduleConflict(startTime, endTime) {
    const response = await fetch(`${API_URL}/check_conflict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_time: startTime, end_time: endTime })
    });
    const data = await response.json();
    console.log(data.conflict ? "Conflict found!" : "No schedule conflicts!");
}

async function rescheduleBreak(breakMins) {
    const response = await fetch(`${API_URL}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ break_mins: breakMins })
    });
    const data = await response.json();
    console.log(data.message);
}
