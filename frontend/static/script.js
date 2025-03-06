// import { gsap } from "gsap"

function loadCalendarEvents() {
    fetch('/api/events')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched data:", data);  // Debugging step

            // Iterate over the object instead of expecting an array
            const eventsDiv = document.getElementById('events');
            eventsDiv.innerHTML = '';  // Clear previous events
            Object.entries(data).forEach(([eventTitle, event]) => {
                const eventDiv = document.createElement('div');
                eventDiv.textContent = `Event: ${eventTitle} - Start: ${event.start.dateTime}`;
                eventsDiv.appendChild(eventDiv);
            });
        })
        .catch(error => console.error('Error fetching events:', error));
}


let checkinTime = 30;

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

let timeout = setTimeout(heyListen, checkinTime * 1000);

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

let tasksModeActivated = false;
let focusModeActivated = false;

document.getElementById('focusMode').addEventListener('click', () => {
    if (!focusModeActivated) {
        gsap.to('#tasksMode', {
            duration: .75,
            opacity: 0,
            ease: 'power2.out'
        })
        gsap.to('#focusMode', {
            duration: .75,
            top: '2%',
            left: '2%',
            ease: 'power2.out'
        })
        focusModeActivated = true
        document.getElementById('tasksMode').hidden = true
        document.getElementById('focusMode').textContent = "EXIT"
    }
    else {
        document.getElementById('tasksMode').hidden = false
        document.getElementById('focusMode').textContent = "FOCUS"
        gsap.to('#tasksMode', {
            duration: .75,
            opacity: 1,
            ease: 'power2.out'
        })
        gsap.to('#focusMode', {
            duration: .75,
            top: '40%',
            left: '40%',
            ease: 'power2.out'
        })
        focusModeActivated = false
    }
})

document.getElementById('tasksMode').addEventListener('click', () => {
    if (!tasksModeActivated) {
        gsap.to('#focusMode', {
            duration: .75,
            opacity: 0,
            ease: 'power2.out'
        })
        gsap.to('#tasksMode', {
            duration: .75,
            top: '2%',
            left: '2%',
            ease: 'power2.out'
        })
        tasksModeActivated = true
        document.getElementById('focusMode').hidden = true
        document.getElementById('tasksMode').textContent = "EXIT"
    }
    else {
        document.getElementById('focusMode').hidden = false
        document.getElementById('tasksMode').textContent = "TASKS"
        gsap.to('#focusMode', {
            duration: .75,
            opacity: 1,
            ease: 'power2.out'
        })
        gsap.to('#tasksMode', {
            duration: .75,
            top: '40%',
            left: '60%',
            ease: 'power2.out'
        })
        tasksModeActivated = false
    }
})

// Function to load tasks dynamically from the server
function loadTasks() {
    fetch('/tasks')  // Fetch data from Flask API
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById("taskTableBody");
            tableBody.innerHTML = ''; // Clear the table body

            // Loop through the tasks and create a row for each
            data.forEach(task => {
                const row = document.createElement('tr');

                // Task Name
                const taskCell = document.createElement('td');
                taskCell.textContent = task.task;
                row.appendChild(taskCell);

                // Due Date
                const dueDateCell = document.createElement('td');
                dueDateCell.textContent = task.due_date;
                row.appendChild(dueDateCell);

                // Status
                const statusCell = document.createElement('td');
                statusCell.textContent = task.status;
                row.appendChild(statusCell);

                // Append the row to the table body
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

// Load tasks when the page loads
window.onload = loadTasks;
