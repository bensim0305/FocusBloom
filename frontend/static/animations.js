// This file is only for gsap animations. See the docs here:
// https://gsap.com/docs/v3/
let tasksModeActivated = false
let focusModeActivated = false

document.getElementById('focusMode').addEventListener('click', () => {
    if (!focusModeActivated) {
        display("focusMode", "focusModeScreen", "tasksMode")
        focusModeActivated = true
        gsap.to("#welcomeTitle", {
            duration: .5,
            opacity: 0,
            ease: 'power2.out'
        })
    } else {
        hide("focusMode", "40%", "FOCUS", "focusModeScreen", "tasksMode")
        focusModeActivated = false
        gsap.to("#workTimePrompt", {
            delay: 1,
            onComplete: () => {
                document.getElementById('workTimePrompt').hidden = false;
                document.getElementById('mainFocusMode').hidden = true;
            }
        })
        timeout = null;
    }
})

document.getElementById('tasksMode').addEventListener('click', () => {
    if (!tasksModeActivated) {
        display("tasksMode", "tasksModeScreen", "focusMode")
        tasksModeActivated = true
        gsap.to("#welcomeTitle", {
            duration: .5,
            opacity: 0,
            ease: 'power2.out'
        })
    }
    else {
        hide("tasksMode", "60%", "TASKS", "tasksModeScreen", "focusMode")
        tasksModeActivated = false
    }
})

// parameters are all strings, to represent the IDs of HTML elements
function display(this_button, this_screen, other_button) {
    gsap.to("#" + other_button, {
        duration: .5,
        opacity: 0,
        ease: 'power2.out',
        onComplete: () => {
            document.getElementById(other_button).hidden = true
            document.getElementById(this_screen).hidden = false
            gsap.to("#" + this_screen, {
                duration: .75,
                opacity: 1,
                ease: 'power2.out',
                delay: .25
            })
        }
    })
    gsap.to("#" + this_button, {
        duration: .75,
        top: '2%',
        left: '2%',
        ease: 'power2.out'
    })
    document.getElementById(this_button).textContent = "EXIT"
}

// parameters are all strings, to represent the IDs of HTML elements
// this_button_pos is a string to represent CSS 'left' position
function hide(this_button, this_button_pos, this_button_text, this_screen, other_button) {
    document.getElementById(other_button).hidden = false
    gsap.to("#" + this_screen, {
        duration: .5,
        opacity: 0,
        ease: 'power2.out',
        onComplete: () => {
            document.getElementById(this_button).textContent = this_button_text
            document.getElementById(this_screen).hidden = true
            gsap.to("#" + other_button, {
                duration: .75,
                opacity: 1,
                ease: 'power2.out'
            })
            gsap.to("#" + this_button, {
                duration: .75,
                top: '50%',
                left: this_button_pos,
                ease: 'power2.out'
            })
        }
    })
}