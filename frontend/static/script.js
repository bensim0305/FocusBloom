// CONSTANT VARIABLES //////////////////////////////////////////////////////////

// default colors assigned to tasks
const bgColors = [
    "seashell",
    "peachpuff",
    "lavender",
    "lemonchiffon",
    "lightcyan",
    "lightgrey",
    "lightpink",
    "thistle",
    "aquamarine",
    "palegreen",
    "paleturquoise"
];

// hardcoded sample tasks
const tasks = [
    "Peer edit Fred's SOSC essay",
    "Review key concepts for biology midterm",
    "Work on Algorithms problem set",
    "Write reading report for Inclusive",
    "Email Matt from Google HR back",
    "Send LinkedIn connection request to Matt from Google HR",
    "Revise capstone webpage on portfolio",
    "Start brainstorming ideas for Grace commission",
    "Edit Nexus Whiplash video",
    "Complete Lab 3 for Comp. Architecture",
    "Resubmit Algorithms problem set"
];

let index = 0;
let next = 1;

let checkinTime = 1800; // time between check-ins in seconds, default is 30 minutes
let timeout = null;
// let timeout = setTimeout(heyListen, checkinTime * 1000);

function heyListen() {
    clearTimeout(timeout); // Clear the timeout to stop it
    timeout = null;

    navigator.vibrate([900, 250, 900]);
    let music = new Audio('/static/check-in.mp3');
    music.play();

    document.getElementById("normalScreen").style.opacity = "0.25";
    document.getElementById("checkInText").style.visibility = "visible";

    document.getElementById("greenButton").innerHTML = "Continue Task";
    document.getElementById("greenButton").onclick = continueTask;

    let color = bgColors[Math.floor(Math.random() * bgColors.length)];
    document.body.style.backgroundColor = color;
}

function restartTimer() {
    if (timeout === null) {
        timeout = setTimeout(heyListen, checkinTime * 1000); // Restart the full timer
    }
}

function continueTask() {
    document.getElementById("normalScreen").style.opacity = "1";
    document.getElementById("checkInText").style.visibility = "hidden";

    document.getElementById("greenButton").innerHTML = "Finished Task";
    document.getElementById("greenButton").onclick = finishTask;

    restartTimer();
}

function skipTask() {
    navigator.vibrate([900, 250, 900]);
    var music = new Audio('/static/skipped-task.mp3');
    music.play();

    document.getElementById("normalScreen").style.opacity = "1";
    document.getElementById("checkInText").style.visibility = "hidden";

    document.getElementById("greenButton").innerHTML = "Finished Task";
    document.getElementById("greenButton").onclick = finishTask;

    index = (index + 1) % tasks.length;
    next = (next + 1) % tasks.length;

    document.getElementById("currentTaskText").innerText = tasks[index];
    document.getElementById("nextTaskText").innerText = tasks[next];

    document.body.style.backgroundColor = bgColors[Math.floor(Math.random() * bgColors.length)];

    restartTimer();
}

function finishTask() {
    navigator.vibrate([900, 250, 900]);
    var music = new Audio('/static/passed-task.mp3');
    music.play();

    index = (index + 1) % tasks.length;
    next = (next + 1) % tasks.length;

    document.getElementById("currentTaskText").innerText = tasks[index];
    document.getElementById("nextTaskText").innerText = tasks[next];

    document.body.style.backgroundColor = bgColors[Math.floor(Math.random() * bgColors.length)];

    restartTimer();
}

// TASKS SCREEN FUNCTIONS //////////////////////////////////////////////////////

// function that enables tabs to switch between tables
function showTable(tableType) {
    if (tableType === 'tasks') {
        document.getElementById('tasksTable').style.display = 'block';
        document.getElementById('obligationsTable').style.display = 'none';
        document.getElementById('tasksTab').classList.add('active');
        document.getElementById('obligationsTab').classList.remove('active');
    } else if (tableType === 'obligations') {
        document.getElementById('tasksTable').style.display = 'none';
        document.getElementById('obligationsTable').style.display = 'block';
        document.getElementById('obligationsTab').classList.add('active');
        document.getElementById('tasksTab').classList.remove('active');
    }
}

// Function to load tasks dynamically from the server
function loadTasks() {
    fetch('/tasks')  // Fetch data from Flask API
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById("taskTableBody");
            tableBody.innerHTML = ''; // Clear the table body

            // Ensure the response contains events
            if (!data || data.length === 0) {
                let row = document.createElement('tr');
                row.textContent = "No upcoming tasks found.";
                tableBody.appendChild(row);
                return;
            }

            // Loop through the tasks and create a row for each
            data.forEach(task => {
                let row = document.createElement('tr');

                // Task Name
                let taskCell = document.createElement('td');
                taskCell.textContent = task.task;
                row.appendChild(taskCell);

                // Due Date
                let dueDateCell = document.createElement('td');
                dueDateCell.textContent = task.due_date;
                row.appendChild(dueDateCell);

                // Status
                let statusCell = document.createElement('td');
                statusCell.textContent = task.status;
                row.appendChild(statusCell);

                // Append the row to the table body
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

// Helper function to make obligations times prettier to look at
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
        month: 'short',    // 'Mar'
        day: 'numeric',    // '6'
        hour: 'numeric',   // '8'
        minute: 'numeric', // '00'
        hour12: true       // 'AM/PM'
    });
}

// Function to load obligations dynamically from the server
function loadObligations() {
    fetch('/list_events')  // Fetch data from Flask API
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById("obligationTableBody");
            tableBody.innerHTML = ''; // Clear the table body

            // Ensure the response contains events
            if (!data.events || data.events.length === 0) {
                let row = document.createElement('tr');
                row.textContent = "No upcoming events found.";
                tableBody.appendChild(row);
                return;
            }

            // Loop through the list of events
            for (let obligation of data.events) {
                let row = document.createElement('tr');
                row.style.backgroundColor = obligation.color.background || "#0000000";

                // Obligation Name
                let obligationCell = document.createElement('td');
                obligationCell.textContent = obligation.summary || "No title";
                row.appendChild(obligationCell);

                // Start Time
                let startTimeCell = document.createElement('td');
                startTimeCell.textContent = formatDateTime(obligation.start?.dateTime) || formatDateTime(obligation.start?.date) || "No start time";
                row.appendChild(startTimeCell);

                // End Time
                let endTimeCell = document.createElement('td');
                endTimeCell.textContent = formatDateTime(obligation.end?.dateTime) || formatDateTime(obligation.end?.date) || "No end time";
                row.appendChild(endTimeCell);

                // Append the row to the table body
                tableBody.appendChild(row);
            }
        })
        .catch(error => console.error('Error fetching tasks:', error));
}