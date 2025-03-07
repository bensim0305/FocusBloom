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
const sampleTasks = [
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

let checkinTime = 10 // time between check-ins in seconds, default is 30 minutes
let timeout = null;
// let timeout = setTimeout(heyListen, checkinTime * 1000);

let tasks = []; // Store tasks globally for sorting

// FOCUS SCREEN FUNCTIONS //////////////////////////////////////////////////////

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

    // Make the current task rescheduled and move it to the end
    let skippedTask = sampleTasks[index];
    skippedTask.status = "Rescheduled";  // Set the task status to "Rescheduled"

    // Move the task to the end of the tasks array
    sampleTasks.push(sampleTasks.splice(index, 1)[0]);

    // Update the index to point to the next task
    index = (index + 1) % sampleTasks.length;
    next = (next + 1) % sampleTasks.length;

    // Update UI elements
    document.getElementById("normalScreen").style.opacity = "1";
    document.getElementById("checkInText").style.visibility = "hidden";
    document.getElementById("greenButton").innerHTML = "Finish Task";
    document.getElementById("greenButton").onclick = finishTask;

    // Load the next task
    loadNextTask();
}

function finishTask() {
    navigator.vibrate([900, 250, 900]);
    var music = new Audio('/static/passed-task.mp3');
    music.play();

    // Send the updated task list to the backend to update tasks.json
    // deleteTask(index);

    // Move to the next task
    index = (index + 1) % sampleTasks.length;
    next = (next + 1) % sampleTasks.length;

    loadNextTask();

    // fetch('/finish_task', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({})
    // })
    // .then(response => response.json())
    // .then(tasks => {
    //     let eventStartTime = null;
    
    //     if (obligations.length > 0) {
    //         eventStartTime = formatDateTime(obligations[0].start.dateTime);
    //         document.getElementById('referenceEndTime').textContent = "For reference, " +
    //             "your next obligation starts at " + eventStartTime;
    //     } else {
    //         document.getElementById('referenceEndTime').textContent =
    //             "For reference, you have no upcoming obligations.";
    //     }
    // })
    // .catch(error => console.error("Error loading obligations:", error));
}

// function deleteTask(index) {
//     fetch(`/delete_task?index=${index}`, {
//         method: 'DELETE',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//     })
//         .then(response => response.json())
//         .then(data => {
//             // Handle response from the server
//             if (data.success) {
//                 console.log('Removed event');
//                 loadNextTask();
//                 tasks.splice(index, 1);
//             } else {
//                 console.error('Failed to remove event');
//             }
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
// }


function workTimePrompt() {
    document.getElementById('endWorkDate').valueAsDate = new Date();

    fetch('/reference_event')
        .then(response => response.json())
        .then(obligations => {
            let eventStartTime = null;

            if (obligations.length > 0) {
                eventStartTime = formatDateTime(obligations[0].start.dateTime);
                document.getElementById('referenceEndTime').textContent = "For reference, " +
                    "your next obligation starts at " + eventStartTime;
            } else {
                document.getElementById('referenceEndTime').textContent =
                    "For reference, you have no upcoming obligations.";
            }
        })
        .catch(error => console.error("Error loading obligations:", error));
}

function beginFocusMode() {
    let endWorkTime = document.getElementById('endWorkTime').value;
    let endWorkDate = document.getElementById('endWorkDate').value;

    if (!endWorkTime) {
        document.getElementById('timePromptWarning').hidden = false;
    }
    else {
        document.getElementById('timePromptWarning').hidden = true;
        document.getElementById('workTimePrompt').hidden = true;
        document.getElementById('mainFocusMode').hidden = false;
        restartTimer();

        // Get current time as the start time
        let startTime = new Date().toISOString(); // ISO string of the current time

        // Combine selected date with end work time
        let endDateTime = new Date(`${endWorkDate}T${endWorkTime}:00`).toISOString(); // Set end time based on form input

        // Call the function to schedule the task
        let taskName = "Focus Session"; // You can dynamically set the task name based on your need
        let duration = calculateDuration(startTime, endDateTime); // Calculate the duration between start and end times

        // Schedule the task (API call to backend)
        // await scheduleTask(taskName, duration, endDateTime);
    }

    loadNextTask();
}

async function scheduleTask(taskName, duration, dueDate) {
    const response = await fetch(`${API_URL}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_name: taskName, duration: duration, due_date: dueDate })
    });

    const data = await response.json(); // Wait for the JSON response
    console.log(data.message);
}

function calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / 1000 / 60; // Convert to minutes
    return duration;
}

// Call the create_event function in Python backend to create the calendar event
function createEvent(service, taskName, startTime, endTime) {
    fetch('/create_event', {  // Assuming the backend is listening to this endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            task_name: taskName,
            start_time: startTime,
            end_time: endTime
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log("Event created:", data);
        })
        .catch(error => {
            console.error("Error creating event:", error);
        });
}

function loadNextTask() {
    try {
        // Sort tasks by priority (lowest number = highest priority) and then by earliest deadline
        tasks.sort((taskA, taskB) => {
            // First, compare by priority
            if (taskA.priority !== taskB.priority) {
                return taskA.priority - taskB.priority; // Lower priority is more urgent
            }
            // If priorities are the same, compare by deadline
            return new Date(taskA.deadline) - new Date(taskB.deadline); // Earliest deadline first
        });

        // Now tasks[0] should be the most urgent task
        const currentTask = tasks[index];
        const nextTask = tasks[index + 1];

        // Update the HTML with the task details
        document.getElementById('nextTaskText').innerText = nextTask.title; // Task name
        document.getElementById('currentTaskText').innerText = currentTask.title; // You can also set this as the current task
        document.getElementById('nextCheckInText').innerText = `Next Check-In: ${currentTask.checkin} minutes`; // Assuming 'checkin' is in minutes
        document.body.style.backgroundColor = currentTask.color;

        // Decrement the time every minute
        let checkInTime = currentTask.checkin;
        const checkInInterval = setInterval(() => {
            checkInTime--; // Decrement the check-in time by 1 minute
            document.getElementById('nextCheckInText').innerText = `Next Check-In: ${checkInTime} minutes`;

            // If the time reaches 0, stop the countdown
            if (checkInTime <= 0) {
                clearInterval(checkInInterval);
            }
        }, 60000); // 60000 ms = 1 minute

    } catch (error) {
        console.error("Error loading tasks:", error);
    }
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

let sortDirections = { priority: true, title: true, deadline: true }; // Ascending by default
let currentSort = "priority"; // Default column to sort by

// Function to load tasks dynamically from the server
function loadTasks() {
    fetch('/tasks')  // Fetch data from Flask API
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById("taskTableBody");
            tableBody.innerHTML = ''; // Clear the table body

            // Ensure the response contains events
            if (!data || data.length === 0) {
                tasks = [];  // Make sure tasks is empty
                renderTaskTable();
                return;
            }

            // Loop through the tasks and create a row for each
            data.forEach(task => {
                let row = document.createElement('tr');
                row.style.backgroundColor = task.color;

                // Priority
                let priorityCell = document.createElement('td');
                priorityCell.textContent = task.priority;
                row.appendChild(priorityCell);

                // Task Name
                let taskCell = document.createElement('td');
                taskCell.textContent = task.title;
                row.appendChild(taskCell);

                // Due Date
                let dueDateCell = document.createElement('td');
                dueDateCell.textContent = formatDateTime(task.deadline);
                row.appendChild(dueDateCell);

                // Status
                let statusCell = document.createElement('td');
                statusCell.textContent = task.status;
                row.appendChild(statusCell);

                // Append the row to the table body
                tableBody.appendChild(row);
            });
            tasks = data;
            sortTable(currentSort);
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

// Function to render the tasks table
function renderTaskTable() {
    let tableBody = document.getElementById("taskTableBody");
    tableBody.innerHTML = ""; // Clear existing rows

    // If tasks array is empty, show a no tasks message
    if (tasks.length === 0) {
        let row = document.createElement('tr');
        row.textContent = "No upcoming tasks found.";
        tableBody.appendChild(row);
        return;
    }

    // Loop through the tasks and create a row for each
    tasks.forEach(task => {
        let row = document.createElement('tr');
        row.style.backgroundColor = task.color;

        row.innerHTML = `
            <td>${task.priority}</td>
            <td>${task.title}</td>
            <td>${formatDateTime(task.deadline)}</td>
            <td>${task.status}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Function to sort table by the selected column
function sortTable(column) {
    if (column === "priority") {
        tasks.sort((a, b) => sortDirections[column] ? a.priority - b.priority : b.priority - a.priority);
    } else if (column === "title") {
        tasks.sort((a, b) => sortDirections[column] ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
    } else if (column === "deadline") {
        tasks.sort((a, b) => {
            let dateA = new Date(a.deadline);
            let dateB = new Date(b.deadline);
            return sortDirections[column] ? dateA - dateB : dateB - dateA;
        });
    }

    sortDirections[column] = !sortDirections[column]; // Toggle sorting direction
    currentSort = column; // Update the current sort column
    renderTaskTable();
    updateSortingArrow();
}

// Function to update sorting arrows based on the current sort
function updateSortingArrow() {
    // Reset all arrows
    document.getElementById("priority-arrow").innerHTML = "";
    document.getElementById("title-arrow").innerHTML = "";
    document.getElementById("deadline-arrow").innerHTML = "";

    // Set arrow for current sorting column
    if (currentSort === "priority") {
        document.getElementById("priority-arrow").innerHTML = sortDirections.priority ? "&#8593;" : "&#8595;";
    } else if (currentSort === "title") {
        document.getElementById("title-arrow").innerHTML = sortDirections.title ? "&#8593;" : "&#8595;";
    } else if (currentSort === "deadline") {
        document.getElementById("deadline-arrow").innerHTML = sortDirections.deadline ? "&#8593;" : "&#8595;";
    }
}

// Helper function to make tasks/obligations times prettier to look at
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
                row.style.backgroundColor = obligation.color?.background || "#0000000";

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

function updatePriority() {
    const slider = document.getElementById('priority');
    let value = slider.value;
    let priorityValueLabel = document.getElementById('priorityValue');
    priorityValueLabel.textContent = "Current Value: " + value;
}

function createNewTask() {
    // Collect form data
    let title = document.getElementById("title").value;
    let deadline = document.getElementById("deadline").value;
    let time = document.getElementById("time").value;
    let dateTimeString = deadline + "T" + time + "-06:00";
    let priority = document.getElementById("priority").value;
    let block = document.getElementById("block").value;
    let checkin = document.getElementById("checkin").value;
    let color = document.getElementById("taskColor").value;

    if (!title || !deadline || !time || !checkin) {
        document.getElementById("createTaskWarning").hidden = false;
        return;
    } else {
        document.getElementById("createTaskWarning").hidden = true;
    }

    // Combine data into a task object
    let task = {
        title: title,
        deadline: dateTimeString,
        priority: priority,
        block: block,
        checkin: checkin,
        color: color,
        status: "To-do"
    };

    // Send the data to the backend
    fetch('/create_task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
    })
        .then(response => response.json())
        .then(data => {
            // Handle response from the server
            if (data.success) {
                // alert('Task created successfully!');
                // Clear the form
                document.querySelector('form').reset();
            } else {
                //alert('Error creating task: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error sending task to the server.');
        });

    loadTasks();
}

let editingTasks = false;
let selectedTaskIndex = null; // Track which task is being edited

// Function to edit the already created tasks
function editTasks() {
    editingTasks = !editingTasks; // Toggle editing mode
    const createTaskHeader = document.getElementById("createTaskHeader");
    const taskForm = document.getElementById("taskForm");
    const saveButton = document.getElementById("saveExistingTaskBtn");
    const submitButton = document.getElementById("submitNewTaskBtn");
    const editButton = document.getElementById("editTasks");

    if (editingTasks) {
        editButton.textContent = "Exit Editing Mode";
        createTaskHeader.textContent = "Click a task to edit";
        // Hide the form until a task is selected
        taskForm.hidden = true;
        saveButton.hidden = true;
        submitButton.hidden = true;
        makeTasksClickable(true);
    } else {
        editButton.textContent = "Edit Tasks";
        createTaskHeader.textContent = "Create new task";
        taskForm.hidden = false;
        saveButton.hidden = true;
        submitButton.hidden = false;
        selectedTaskIndex = null;
        taskForm.reset();
        makeTasksClickable(false);
    }
}

// Function to make task rows clickable in edit mode, enable is a bool
function makeTasksClickable(enable) {
    const taskRows = document.querySelectorAll("#taskTableBody tr");
    taskRows.forEach((row, index) => {
        if (enable) {
            row.style.cursor = "pointer";
            row.onclick = () => loadTaskIntoForm(index);
        } else {
            row.style.cursor = "default";
            row.onclick = null;
        }
    });
}

// Load the selected task into the form
function loadTaskIntoForm(index) {
    fetch("/tasks") // Fetch current tasks from backend
        .then(response => response.json())
        .then(tasks => {
            let task = tasks[index]; // Get selected task
            selectedTaskIndex = index; // Store the index for editing

            document.getElementById("title").value = task.title;
            // deadline value is in this form: 2025-03-06T14:00:00-06:00
            let deadline = task.deadline
            document.getElementById("deadline").value = deadline.substring(0, 10);
            document.getElementById("time").value = deadline.substring(11, 16);
            document.getElementById("priority").value = task.priority;
            document.getElementById("block").value = task.block;
            document.getElementById("checkin").value = task.checkin;
            document.getElementById("taskColor").value = task.color;

            document.getElementById("taskForm").hidden = false; // Show form for editing
        })
        .catch(error => console.error("Error loading task:", error));
    document.getElementById("createTaskHeader").textContent = "Currently editing:";
    document.getElementById("saveExistingTaskBtn").hidden = false;
}

// Function to save the edited task
function saveTask() {
    if (selectedTaskIndex === null) return;
    let deadline = document.getElementById("deadline").value
    let time = document.getElementById("time").value
    dateTimeString = deadline + "T" + time + "-06:00"

    fetch("/tasks")
        .then(response => response.json())
        .then(tasks => {
            // Update selected task with new values
            tasks[selectedTaskIndex] = {
                title: document.getElementById("title").value,
                deadline: dateTimeString,
                priority: document.getElementById("priority").value,
                block: document.getElementById("block").value,
                checkin: document.getElementById("checkin").value,
                color: document.getElementById("taskColor").value,
                status: "To-do"
            };

            // Save updated tasks back to backend
            fetch("/save_task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tasks)
            })
                .then(() => {
                    loadTasks();
                    document.getElementById("createTaskHeader").textContent = "Click a task to edit";
                    document.getElementById("taskForm").hidden = true;
                    document.getElementById("saveExistingTaskBtn").hidden = true;
                    document.getElementById("submitNewTaskBtn").hidden = true;
                })
                .catch(error => console.error("Error saving task:", error));
        });
    loadTasks();
    makeTasksClickable(true);
}

function clearTasks() {
    fetch('/delete_all_tasks', {  // You need to create an endpoint for deleting all tasks
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("All tasks cleared!");
                // Optionally, re-render the task table if needed
                renderTaskTable();
            } else {
                alert("Failed to clear tasks.");
            }
        })
        .catch(error => {
            console.error("Error clearing tasks:", error);
            alert("An error occurred while clearing tasks.");
        });

    loadTasks();
}
