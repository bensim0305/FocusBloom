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

$(function () {
    $('a#test').on('click', function (e) {
        e.preventDefault()
        $.getJSON('/background_process_test',
            function (data) {
                //do nothing
            });
        return false;
    });
});