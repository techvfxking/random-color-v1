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

// Instruction shown to the user on page load (and once per session)
let instructionsShown = false;
const START_INSTRUCTIONS = 'How to use Diwali Lights - Step by step:\n\n'
    + '1) Enter the number of boxes you want in the "Boxes" field.\n'
    + '2) Click Submit to create the boxes.\n'
    + '3) Use the slider to choose the timer interval (seconds) between color changes.\n'
    + '4) Click Start to begin the color animation. Click Stop to pause.\n\n'
    + 'This message will appear on page load. Press OK to continue.';

// --- Virtual scroll state ---
let virtualBoxCount = 0;
let virtualScrollTop = 0;
let virtualBoxHeight = 120; // px, matches .container-box-item
let virtualGridCols = 1;
let virtualVisibleRows = 1;
let virtualOverscan = 2; // render extra rows for smoothness

function getGridCols() {
    // Prefer reading the CSS grid definition so JS matches the visual columns.
    // Use computed style's gridTemplateColumns to count explicit columns.
    try {
        const computed = window.getComputedStyle(boxContainer).gridTemplateColumns;
        if (computed) {
            // computed is like "64px 64px 64px ..." — count tokens
            const cols = computed.split(' ').filter(Boolean).length;
            if (cols && Number.isFinite(cols)) return Math.max(1, cols);
        }
    } catch (e) {
        // fall through to fallback
    }
    // Fallback: estimate columns based on container width and a reasonable min width
    const width = boxContainer.offsetWidth || 1100;
    return Math.max(1, Math.floor(width / 160));
}

function getBoxHeight() {
    // Responsive: get height from CSS or fallback
    const test = boxContainer.querySelector('.container-box-item');
    if (test) return test.offsetHeight;
    return 120;
}

function renderVirtualGrid(boxCount) {
    virtualBoxCount = boxCount;
    virtualGridCols = getGridCols();
    virtualBoxHeight = getBoxHeight();
    const containerHeight = boxContainer.clientHeight || 400;
    virtualVisibleRows = Math.ceil(containerHeight / virtualBoxHeight) + virtualOverscan;
    const scrollTop = boxContainer.scrollTop;
    const firstRow = Math.max(0, Math.floor(scrollTop / virtualBoxHeight) - virtualOverscan);
    const lastRow = Math.min(Math.ceil(boxCount / virtualGridCols), firstRow + virtualVisibleRows);
    const startIdx = firstRow * virtualGridCols;
    const endIdx = Math.min(boxCount, lastRow * virtualGridCols);

    // Render only visible boxes
    boxContainer.innerHTML = '';
    for (let i = startIdx; i < endIdx; i++) {
        const div = document.createElement('div');
        div.className = 'container-box-item';
        div.textContent = `Div ${i + 1}`;
        div.style.background = getRandomColor();
        boxContainer.appendChild(div);
    }
    // Set grid template rows to keep scroll height correct
    const totalRows = Math.ceil(boxCount / virtualGridCols);
    boxContainer.style.gridTemplateRows = `repeat(${totalRows}, ${virtualBoxHeight}px)`;
}

function onVirtualScroll() {
    renderVirtualGrid(virtualBoxCount);
}

boxContainer.addEventListener('scroll', onVirtualScroll);
window.addEventListener('resize', () => renderVirtualGrid(virtualBoxCount));

// Show usage instructions on page load (only once per session)
// Show the instruction accordion on first load (persist choice in sessionStorage)
window.addEventListener('load', () => {
    // Always show the accordion expanded by default. It is collapsible via header click
    const acc = document.getElementById('instructions-accordion');
    if (acc) {
        acc.setAttribute('aria-open', 'true');
        const hdr = acc.querySelector('.accordion-header');
        if (hdr) hdr.setAttribute('aria-expanded', 'true');
    }

    // accordion header toggle (collapsible behavior)
    const header = document.querySelector('#instructions-accordion .accordion-header');
    if (header) {
        header.addEventListener('click', function () {
            const accEl = document.getElementById('instructions-accordion');
            const open = accEl.getAttribute('aria-open') === 'true';
            accEl.setAttribute('aria-open', open ? 'false' : 'true');
            header.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
    }

    // highlight controls when hovering or clicking steps
    const steps = document.querySelectorAll('#instructions-accordion .acc-steps li');
    steps.forEach(step => {
        const targetSel = step.getAttribute('data-target');
        const target = targetSel ? document.querySelector(targetSel) : null;
        step.addEventListener('mouseenter', () => {
            if (target) target.classList.add('highlight-target');
        });
        step.addEventListener('mouseleave', () => {
            if (target) target.classList.remove('highlight-target');
        });
        step.addEventListener('click', () => {
            if (target) {
                target.focus({preventScroll:false});
                // briefly pulse the control
                target.classList.add('highlight-target');
                setTimeout(() => target.classList.remove('highlight-target'), 900);
            }
        });
    });
});

// grab buttons from the page so we can attach behavior
// We store references so we can change button states (enable/disable) and attach listeners.

const submitElem = document.getElementById("btn");
const playPauseBtn = document.getElementById('play-pause');
const playPauseIcon = document.getElementById('play-pause-icon');
const timerSlider = document.getElementById('inp2');
const timerValueDisplay = document.getElementById('timer-value');
// create or reference a styled loader element next to the timer value
let sliderLoader = document.getElementById('timer-loader');
if (!sliderLoader && timerValueDisplay && timerValueDisplay.parentNode) {
    sliderLoader = document.createElement('span');
    sliderLoader.id = 'timer-loader';
    sliderLoader.className = 'timer-loader';
    sliderLoader.setAttribute('aria-hidden', 'true');
    sliderLoader.style.display = 'none';
    sliderLoader.style.marginLeft = '10px';
    timerValueDisplay.parentNode.appendChild(sliderLoader);
}

// Show initial slider value
if (timerSlider && timerValueDisplay) {
    timerValueDisplay.textContent = `${Number(timerSlider.value).toFixed(1)}s`;
    timerSlider.addEventListener('input', function() {
        const newVal = Number(timerSlider.value);
        timerValueDisplay.textContent = `${newVal.toFixed(1)}s`;

        // if the animation is currently running, restart intervals at the new speed
        const isPlaying = (playPauseBtn && playPauseBtn.getAttribute('data-playing') === 'true');
        if (isPlaying) {
            // show loader
            if (sliderLoader) sliderLoader.style.display = 'inline-block';
            // restart intervals after a very short debounce so rapid changes don't thrash
            if (window._restartTimeout) clearTimeout(window._restartTimeout);
            window._restartTimeout = setTimeout(() => {
                // convert seconds to ms
                restartIntervals(Math.max(100, newVal * 1000));
                if (sliderLoader) sliderLoader.style.display = 'none';
            }, 120);
        }
    });
}

// helper to restart intervals at new ms for all boxes when already playing
function restartIntervals(intervalMs) {
    // clear existing intervals but keep the boxes
    clearAllIntervals();

    // create new intervals for each current box element
    for (let boxItem of boxContainer.children) {
        const id = setInterval(function () {
            boxItem.style.background = getRandomColor();
        }, Math.max(100, intervalMs));
        intervalvalue.push(id);
    }
}

// attach click handlers: when user clicks these buttons, run these functions
// Why: addEventListener is preferred because it allows multiple listeners and is flexible.
// Impact: clicking the Submit button will call onSubmit(); same for Start/Stop.
submitElem.addEventListener('click', onSubmit);
// wire the play/pause toggle
if (playPauseBtn) {
    playPauseBtn.addEventListener('click', function () {
        const isPlaying = playPauseBtn.getAttribute('data-playing') === 'true';

        // If there are no boxes, prompt user to enter a value and submit
        if (!boxContainer.children.length && !isPlaying) {
            alert('No boxes available. Enter a number of boxes and click Submit first.');
            return;
        }

        if (!isPlaying) {
            // start
            playPauseBtn.setAttribute('data-playing', 'true');
            playPauseBtn.setAttribute('aria-pressed', 'true');
            // swap icons: hide play, show pause
            const p = document.getElementById('icon-play');
            const q = document.getElementById('icon-pause');
            if (p) p.style.display = 'none';
            if (q) q.style.display = 'block';
            onStartColor();
        } else {
            // pause/stop
            playPauseBtn.setAttribute('data-playing', 'false');
            playPauseBtn.setAttribute('aria-pressed', 'false');
            const p = document.getElementById('icon-play');
            const q = document.getElementById('icon-pause');
            if (p) p.style.display = 'block';
            if (q) q.style.display = 'none';
            onStopColor();
        }
    });
}

// initial UI state: nothing playing
if (playPauseBtn) {
    playPauseBtn.setAttribute('data-playing', 'false');
    playPauseBtn.setAttribute('aria-pressed', 'false');
}

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
        boxContainer.innerHTML = '';
        startBtn.disabled = true;
        return;
    }

    // Skeleton shimmer for virtual grid
    const skeletons = [];
    virtualGridCols = getGridCols();
    virtualBoxHeight = getBoxHeight();
    const containerHeight = boxContainer.clientHeight || 400;
    virtualVisibleRows = Math.ceil(containerHeight / virtualBoxHeight) + virtualOverscan;
    const totalRows = Math.ceil(boxCount / virtualGridCols);
    const visibleSkeletons = Math.min(boxCount, virtualVisibleRows * virtualGridCols);
    for (let i = 0; i < visibleSkeletons; i++) {
        const s = document.createElement('div');
        s.className = 'container-box-item skeleton';
        s.setAttribute('aria-hidden', 'true');
        skeletons.push(s);
    }
    boxContainer.innerHTML = '';
    skeletons.forEach(s => boxContainer.appendChild(s));

    renderTimeoutId = setTimeout(() => {
        renderTimeoutId = null;
        renderVirtualGrid(boxCount);
        // ensure play/pause button is in stopped state after rendering
        if (playPauseBtn) {
            playPauseBtn.setAttribute('data-playing', 'false');
            playPauseBtn.setAttribute('aria-pressed', 'false');
            const p = document.getElementById('icon-play');
            const q = document.getElementById('icon-pause');
            if (p) p.style.display = 'block';
            if (q) q.style.display = 'none';
        }
    }, 200);
}

// Simple helper that returns true when number is invalid (NaN or negative)
// Why: centralize the check so it's consistent across start/submit validation.
// Impact: easier to change validation rules in one place.
function checkNumber(numberValue) {
    return Number.isNaN(numberValue) || numberValue < 0;
}

// ---- onStartColor: start changing colors for every box at the given interval ----
function onStartColor() {
    // Use the slider value for timer (seconds between color changes)
    const timerElem = document.getElementById("inp2");
    const currentNumber = Number(timerElem.value); // seconds between color changes

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
    if (!Number.isFinite(currentNumber) || currentNumber <= 0) {
        alert('Please enter a timer value greater than 0 seconds.');
        return;
    }

    // Clear any old intervals so we don't create duplicates
    clearAllIntervals();

    // For each box element, create an independent interval that changes its background
    for (let boxItem of boxContainer.children) {
        const id = setInterval(function () {
            boxItem.style.background = getRandomColor();
        }, Math.max(100, currentNumber * 1000)); // convert seconds to ms, min 100ms
        intervalvalue.push(id); // remember id so we can clear it later
    }

    // Update the button states: disable Start while running, enable Stop
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

// --------------------
// Small sharing helpers for the footer buttons
// --------------------
// share URL for this site (update when you change hosting)
const SHARE_URL = 'https://techvfxking.github.io/random-color-v1/';

// safe DOM queries — these buttons may not exist in other contexts
const btnTwitter = document.getElementById('share-twitter');
const btnFacebook = document.getElementById('share-facebook');
const btnLinkedIn = document.getElementById('share-linkedin');
const btnCopy = document.getElementById('share-copy');

if (btnTwitter) {
    btnTwitter.addEventListener('click', function () {
        const text = encodeURIComponent('🪔 Celebrate Diwali with Diwali Lights! Brighten your screen and spirit — a tiny treat for developers. ✨\n\nBy Biplab Sharma (Tech VFX King)');
        const url = encodeURIComponent(SHARE_URL);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener');
    });
}

if (btnFacebook) {
    btnFacebook.addEventListener('click', function () {
        const url = encodeURIComponent(SHARE_URL);
        const quote = encodeURIComponent('🪔 Celebrate Diwali with Diwali Lights! Brighten your screen and spirit — a tiny treat for developers. ✨\n\nBy Biplab Sharma (Tech VFX King)');
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank', 'noopener');
    });
}

if (btnLinkedIn) {
    btnLinkedIn.addEventListener('click', function () {
        const url = encodeURIComponent(SHARE_URL);
        const title = encodeURIComponent('🪔 Celebrate Diwali with Diwali Lights!');
        const summary = encodeURIComponent('Brighten your screen and spirit — a tiny treat for developers. ✨ By Biplab Sharma (Tech VFX King)');
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${summary}`, '_blank', 'noopener');
    });
}

if (btnCopy) {
    btnCopy.addEventListener('click', function () {
        const shareText = `🪔 Celebrate Diwali with Diwali Lights! Brighten your screen and spirit — a tiny treat for developers. ✨\n\n${SHARE_URL}\nBy Biplab Sharma (Tech VFX King)`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText).then(() => alert('Share text copied to clipboard!'))
                .catch(() => alert('Unable to copy.'));
        } else {
            // fallback: create a temporary textarea
            const ta = document.createElement('textarea');
            ta.value = shareText;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); alert('Share text copied to clipboard!'); } catch (e) { alert('Unable to copy.'); }
            document.body.removeChild(ta);
        }
    });
}

