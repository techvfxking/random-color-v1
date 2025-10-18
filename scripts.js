// store interval ids so we can clear them later (when stopping or re-creating boxes)
// Why: setInterval returns an id number. We keep those ids so clearInterval(id) can stop the timer.
// Impact: prevents timers from running forever when the user regenerates boxes or navigates away.
// Example: intervalvalue = [13, 14] means two timers are running and we can stop both.
let intervalvalue = [];

// id for a pending render timeout — used to avoid race conditions when user submits fast
// Why: when user clicks Submit multiple times quickly, older slow render operations could
// overwrite newer renders. We store the timeout id so we can cancel it before starting a new one.
// Impact: keeps the displayed grid consistent with the user's last action.
// Example: renderTimeoutId = 42 means a pending call to setTimeout is scheduled and can be cleared.
let renderTimeoutId = null;

// user-friendly error message prefix used for alerts
// Why: we reuse the same message format in multiple places to keep messaging consistent.
// Impact: a single edit to this string updates all validation alerts.
// Example: alert(`${errorMessage} abc`) -> 'Please enter a valid Input... and you have entered: abc'
const errorMessage = "Please enter a valid Input in number which has to be greater than 0 or 0 and you have entered: ";

// grab the main container where box elements will be added
// Why: we need a DOM reference to append/remove box elements later.
// Impact: if the id is wrong, subsequent DOM ops will fail (null reference error).
// Tip: keep the id in HTML synchronized with this string.
const boxContainer = document.getElementById('container-box-elem');

// grab buttons from the page so we can attach behavior
// We store references so we can change button states (enable/disable) and attach listeners.
const submitElem = document.getElementById("btn");
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');

// attach click handlers: when user clicks these buttons, run these functions
// Why: addEventListener is preferred because it allows multiple listeners and is flexible.
// Impact: clicking the Submit button will call onSubmit(); same for Start/Stop.
submitElem.addEventListener('click', onSubmit);
startBtn.addEventListener('click', onStartColor);
stopBtn.addEventListener('click', onStopColor);

// initial UI state: no boxes yet, so disable Start and Stop
// Why: avoid user clicking Start when there are no boxes — it would do nothing or produce errors.
// Impact: improves UX and prevents invalid actions.
startBtn.disabled = true; // Start disabled until boxes exist
stopBtn.disabled = true;  // Stop disabled until a timer is running

// ---- onSubmit: handle when user clicks Submit to create boxes ----
function onSubmit() {
    // get the box count input element and convert its value to a Number
    // Why use Number(): inputElem.value is a string like '6', Number('6') -> 6
    const inputElem = document.getElementById("inp1");
    let currentNumber = Number(inputElem.value);

    // Basic validation: input must be a finite number and not negative
    // Impact: avoids NaN or negative counts which don't make sense
    // Example: user types 'hello' -> Number('hello') -> NaN -> invalid
    if (!Number.isFinite(currentNumber) || currentNumber < 0) {
        // show a simple alert explaining the problem
        alert(`${errorMessage} ${inputElem.value}`);
        return; // stop processing because input is invalid
    }

    // make sure we use an integer number of boxes (drop decimal part)
    // Example: if user types 4.7 -> we create 4 boxes (don't do half a box)
    currentNumber = Math.trunc(currentNumber);

    // Safety cap: creating too many DOM nodes can freeze the browser
    // We limit to MAX_BOXES and ask the user if they really want more.
    const MAX_BOXES = 300; // chosen to be safe for most devices
    if (currentNumber > MAX_BOXES) {
        // Ask the user for confirmation before creating a very large number
        if (!confirm(`You're creating ${currentNumber} boxes. This may be slow. Create ${MAX_BOXES} instead?`)) return;
        currentNumber = MAX_BOXES; // apply the safe limit
    }

    // Clear any running color-change intervals and any pending render timeout
    // Why: prevents a previous animation or pending render from interfering
    clearAllIntervals();
    if (renderTimeoutId) {
        // cancel the pending render so it doesn't overwrite the new one
        clearTimeout(renderTimeoutId);
        renderTimeoutId = null;
    }

    // create the boxes (skeletons shown briefly inside addBoxItem)
    addBoxItem(currentNumber);
}

// ---- addBoxItem: create boxCount tiles in the page ----
function addBoxItem(boxCount = 0) {
    // if boxCount is zero, clear the container and disable Start
    if (boxCount === 0) {
        boxContainer.innerHTML = ''; // remove any existing children
        startBtn.disabled = true;    // nothing to start when no boxes exist
        return; // done
    }

    // Build skeleton placeholders quickly so the user sees feedback immediately.
    // Why skeletons: creating many DOM elements can take time. Skeletons show instant feedback.
    // Impact: user sees a shimmer instead of a blank area while boxes are created.
    const skeletons = [];
    for (let i = 0; i < boxCount; i++) {
        const s = document.createElement('div');
        s.className = 'container-box-item skeleton'; // use CSS shimmer style
        s.setAttribute('aria-hidden', 'true'); // screen readers skip skeletons
        skeletons.push(s);
    }
    boxContainer.innerHTML = '';
    skeletons.forEach(s => boxContainer.appendChild(s)); // add skeletons to DOM

    // Wait a short time so the user can see the skeleton animation.
    // We store the timeout id in renderTimeoutId so we can cancel it if the user submits again.
    renderTimeoutId = setTimeout(() => {
        renderTimeoutId = null;          // clear stored id because we're running now
        boxContainer.innerHTML = '';     // remove skeleton elements

        // Create the real box elements and give each an initial random color
        for (let i = 0; i < boxCount; i++) {
            const div = document.createElement('div');
            div.className = 'container-box-item';
            div.textContent = `Div ${i + 1}`;           // show a label like 'Div 1'
            div.style.background = getRandomColor();    // set starter color
            boxContainer.appendChild(div);
        }

        // Now that boxes exist, allow the user to start the color animation
        startBtn.disabled = false; // Start can now be pressed
        stopBtn.disabled = true;   // Stop remains disabled until an animation runs
    }, 200); // 200ms delay — short but visible
}

// Simple helper that returns true when number is invalid (NaN or negative)
// Why: centralize the check so it's consistent across start/submit validation.
// Impact: easier to change validation rules in one place.
function checkNumber(numberValue) {
    return Number.isNaN(numberValue) || numberValue < 0;
}

// ---- onStartColor: start changing colors for every box at the given interval ----
function onStartColor() {
    // read the time (seconds) from input and convert to Number
    const inputElem = document.getElementById("inp2");
    const currentNumber = Number(inputElem.value); // seconds between color changes

    // if input is not valid, show an error
    if (checkNumber(currentNumber)) {
        alert(`${errorMessage} ${currentNumber}`);
        return;
    }

    // don't start if there are no boxes yet
    if (!boxContainer.children.length) {
        alert('No boxes available. Please create boxes first.');
        return;
    }

    // timer must be positive and finite (we require > 0 seconds)
    // Example: user types 0 or -1 -> we reject because changing every 0 seconds would be invalid
    if (!Number.isFinite(currentNumber) || currentNumber <= 0) {
        alert('Please enter a timer value greater than 0 seconds.');
        return;
    }

    // Clear any old intervals so we don't create duplicates
    // Why: if timers already exist, calling setInterval again will create additional timers and speed up changes.
    clearAllIntervals();

    // For each box element, create an independent interval that changes its background
    // Impact: each box will change color independently at the same interval.
    for (let boxItem of boxContainer.children) {
        const id = setInterval(function () {
            boxItem.style.background = getRandomColor();
        }, Math.max(100, currentNumber * 1000)); // convert seconds to ms, min 100ms
        intervalvalue.push(id); // remember id so we can clear it later
    }

    // Update the button states: disable Start while running, enable Stop
    // This prevents starting twice and provides clear UI state.
    startBtn.disabled = true;
    stopBtn.disabled = false;
}

// ---- onStopColor: stop all running intervals ----
function onStopColor() {
    // Stop timers and reset button states
    clearAllIntervals();       // clear the interval timers
    startBtn.disabled = false; // allow Start again
    stopBtn.disabled = true;   // Stop is disabled when nothing is running
}

// Clear all interval timers and any pending render timeout
// Why: used when user stops the animation or creates a new grid. Ensures no orphan timers remain.
function clearAllIntervals(){
    for (let interval of intervalvalue) {
        clearInterval(interval); // stop each interval
    }
    intervalvalue = []; // reset list

    // if a render timeout is waiting, cancel it too to avoid unexpected overwrites
    if (renderTimeoutId) {
        clearTimeout(renderTimeoutId);
        renderTimeoutId = null;
    }
}

// tiny helper: returns a random hex color like '#A1B2C3'
// Why: small helper keeps color generation separate and easy to test.
// Impact: using the same function everywhere keeps colors consistent and easy to change.
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

