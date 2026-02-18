// ===================================
// POMODORO TIMER - APPLICATION LOGIC
// ===================================

// Timer Configuration (in seconds)
const TIMER_CONFIG = {
    pomodoro: 25 * 60,      // 25 minutes
    shortBreak: 5 * 60,     // 5 minutes
    longBreak: 15 * 60      // 15 minutes
};

// Application State
let state = {
    currentSession: 'pomodoro',
    timeRemaining: TIMER_CONFIG.pomodoro,
    isRunning: false,
    isPaused: false,
    timerInterval: null,
    completedSessions: 0,
    totalSessions: 4
};

// DOM Elements
const elements = {
    timerTime: document.getElementById('timer-time'),
    timerLabel: document.getElementById('timer-label'),
    sessionCount: document.getElementById('session-count'),
    timerDisplay: document.getElementById('timer-display'),
    progressCircle: document.getElementById('progress-circle'),
    btnStart: document.getElementById('btn-start'),
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset'),
    btnPomodoro: document.getElementById('btn-pomodoro'),
    btnShortBreak: document.getElementById('btn-short-break'),
    btnLongBreak: document.getElementById('btn-long-break'),
    notificationSound: document.getElementById('notification-sound'),
    sessionButtons: document.querySelectorAll('.session-btn')
};

// Initialize circular progress
const radius = 150;
const circumference = 2 * Math.PI * radius;
elements.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
elements.progressCircle.style.strokeDashoffset = circumference;

// ===================================
// CORE FUNCTIONS
// ===================================

/**
 * Format time in MM:SS format
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Update the timer display
 */
function updateDisplay() {
    elements.timerTime.textContent = formatTime(state.timeRemaining);
    updateProgressCircle();
    updateSessionCount();
}

/**
 * Update circular progress indicator
 */
function updateProgressCircle() {
    const totalTime = TIMER_CONFIG[state.currentSession];
    const progress = state.timeRemaining / totalTime;
    const offset = circumference - (progress * circumference);
    elements.progressCircle.style.strokeDashoffset = offset;
}

/**
 * Update session counter
 */
function updateSessionCount() {
    elements.sessionCount.textContent = `Session ${state.completedSessions} of ${state.totalSessions}`;
}

/**
 * Update timer label based on state
 */
function updateLabel(text) {
    elements.timerLabel.textContent = text;
}

/**
 * Start the timer
 */
function startTimer() {
    if (state.isRunning) return;

    state.isRunning = true;
    state.isPaused = false;

    // Update UI
    elements.timerDisplay.classList.add('running');
    elements.btnStart.disabled = true;
    elements.btnPause.disabled = false;
    updateLabel('Stay focused...');

    // Disable session switching while running
    elements.sessionButtons.forEach(btn => btn.disabled = true);

    // Start countdown
    state.timerInterval = setInterval(() => {
        if (state.timeRemaining > 0) {
            state.timeRemaining--;
            updateDisplay();
        } else {
            completeSession();
        }
    }, 1000);
}

/**
 * Pause the timer
 */
function pauseTimer() {
    if (!state.isRunning) return;

    state.isRunning = false;
    state.isPaused = true;

    // Clear interval
    clearInterval(state.timerInterval);

    // Update UI
    elements.timerDisplay.classList.remove('running');
    elements.btnStart.disabled = false;
    elements.btnPause.disabled = true;
    updateLabel('Paused');
}

/**
 * Reset the timer
 */
function resetTimer() {
    // Clear interval
    clearInterval(state.timerInterval);

    // Reset state
    state.isRunning = false;
    state.isPaused = false;
    state.timeRemaining = TIMER_CONFIG[state.currentSession];

    // Update UI
    elements.timerDisplay.classList.remove('running');
    elements.btnStart.disabled = false;
    elements.btnPause.disabled = true;
    elements.sessionButtons.forEach(btn => btn.disabled = false);

    updateDisplay();
    updateLabel('Ready to focus');
}

/**
 * Switch session type
 */
function switchSession(sessionType) {
    // Don't allow switching while timer is running
    if (state.isRunning) return;

    // Update state
    state.currentSession = sessionType;
    state.timeRemaining = TIMER_CONFIG[sessionType];

    // Update active button
    elements.sessionButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.session === sessionType) {
            btn.classList.add('active');
        }
    });

    // Update display
    updateDisplay();

    // Update label based on session type
    if (sessionType === 'pomodoro') {
        updateLabel('Ready to focus');
    } else {
        updateLabel('Time for a break');
    }
}

/**
 * Handle session completion
 */
function completeSession() {
    // Clear interval
    clearInterval(state.timerInterval);
    state.isRunning = false;

    // Play notification sound
    playNotification();

    // Update completed sessions if it was a Pomodoro
    if (state.currentSession === 'pomodoro') {
        state.completedSessions++;
        updateSessionCount();
    }

    // Update UI
    elements.timerDisplay.classList.remove('running');
    elements.btnStart.disabled = false;
    elements.btnPause.disabled = true;
    elements.sessionButtons.forEach(btn => btn.disabled = false);

    // Show completion message
    if (state.currentSession === 'pomodoro') {
        updateLabel('Great work! Take a break');

        // Auto-switch to appropriate break
        if (state.completedSessions % 4 === 0) {
            setTimeout(() => switchSession('longBreak'), 1000);
        } else {
            setTimeout(() => switchSession('shortBreak'), 1000);
        }
    } else {
        updateLabel('Break complete! Ready to focus');
        setTimeout(() => switchSession('pomodoro'), 1000);
    }

    // Request browser notification permission and show notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
            body: state.currentSession === 'pomodoro'
                ? 'Session complete! Time for a break.'
                : 'Break is over! Ready to focus?',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23C85C5C"/></svg>'
        });
    }
}

/**
 * Play notification sound
 */
function playNotification() {
    // Create a simple beep sound using Web Audio API if audio file doesn't exist
    try {
        elements.notificationSound.play().catch(() => {
            // Fallback to Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        });
    } catch (error) {
        console.log('Audio notification not available');
    }
}

/**
 * Request notification permission
 */
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

elements.btnStart.addEventListener('click', startTimer);
elements.btnPause.addEventListener('click', pauseTimer);
elements.btnReset.addEventListener('click', resetTimer);

elements.btnPomodoro.addEventListener('click', () => switchSession('pomodoro'));
elements.btnShortBreak.addEventListener('click', () => switchSession('shortBreak'));
elements.btnLongBreak.addEventListener('click', () => switchSession('longBreak'));

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar to start/pause
    if (e.code === 'Space' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        if (state.isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }

    // R key to reset
    if (e.code === 'KeyR' && !state.isRunning) {
        resetTimer();
    }
});

// ===================================
// INITIALIZATION
// ===================================

// Initialize display
updateDisplay();
updateLabel('Ready to focus');

// Request notification permission after user interaction
document.addEventListener('click', requestNotificationPermission, { once: true });

console.log('🍅 Pomodoro Timer initialized!');
console.log('Keyboard shortcuts: Space = Start/Pause, R = Reset');
