class PomodoroTimer {
    constructor(duration = 25) {
        this.duration = duration * 60; // duration in seconds
        this.currentTime = this.duration;
        this.isRunning = false;
        this.timerInterval = null;

        // DOM Elements
        this.timeDisplay = document.getElementById('time-display');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.progressRing = document.querySelector('.progress-ring__circle');

        // Circle properties for animation
        this.radius = this.progressRing.r.baseVal.value;
        this.circumference = this.radius * 2 * Math.PI;

        this.init();
    }

    init() {
        this.progressRing.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.progressRing.style.strokeDashoffset = this.circumference;

        this.updateDisplay(this.currentTime);

        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.currentTime === 0) return; // Don't start if already finished

        this.isRunning = true;
        this.startBtn.textContent = 'Pause';
        this.startBtn.classList.add('active'); // Optional styling hook

        // Initialize AudioContext on user interaction if needed (Best practice for permissions)
        this.ensureAudioContext();

        this.timerInterval = setInterval(() => {
            this.currentTime--;
            this.updateDisplay(this.currentTime);
            this.setProgress(this.currentTime);

            if (this.currentTime <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.startBtn.textContent = 'Start';
        clearInterval(this.timerInterval);
    }

    resetTimer() {
        this.pauseTimer();
        this.currentTime = this.duration;
        this.updateDisplay(this.currentTime);
        this.setProgress(this.duration); // Reset progress ring to full (or empty depending on design)
        // Resetting to 'empty' state visually usually looks like full ring or no ring.
        // Let's reset to full circle visually hidden or max offset? 
        // Initial state: offset = circumference (empty).
        this.progressRing.style.strokeDashoffset = this.circumference;
    }

    completeTimer() {
        this.pauseTimer();
        this.currentTime = 0;
        this.updateDisplay(0);
        this.setProgress(0);
        this.startBtn.textContent = "Start";
        this.playNotification();
    }

    updateDisplay(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const displayTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        this.timeDisplay.textContent = displayTime;
        document.title = `(${displayTime}) Focus Timer`;
    }

    setProgress(timeRemaining) {
        // Calculate how much time has passed
        const timeElapsed = this.duration - timeRemaining;
        // Calculate offset: Start full (offset 0) or Start empty (offset circumference)?
        // Design choice: Fill up or drain? "Countdown" usually implies draining if it starts full.
        // But my CSS initial state was offset = circumference (empty).
        // Let's make it fill up as time passes, or drain if we start full.

        // Let's try: Start Empty -> Fill up to completion? Or Start Full -> Drain.
        // Standard is Drain.
        // To Start Full: Initial offset should be 0.
        // Let's fix init() to set offset to 0 if we want it full.
        // Wait, the user prompt asked for a countdown. Draining ring is intuitive.

        // Let's change this:
        // Fraction of time remaining
        const offset = this.circumference - (timeRemaining / this.duration) * this.circumference;
        this.progressRing.style.strokeDashoffset = offset;
    }

    ensureAudioContext() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playNotification() {
        this.ensureAudioContext();
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5

        // Simple "ding" envelope
        gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.5);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 1.5);
    }
}

// Start with full ring for countdown effect?
// Actually, let's fix the logic in constructor to default to full ring if we want countdown.
// If strokeDashoffset = circumference, it's empty.
// If strokeDashoffset = 0, it's full.

// Let's update the logic in a small patch after instantiation or inside init.
// I'll update the init method in the code above to set it to 0 (Full) initially.

document.addEventListener('DOMContentLoaded', () => {
    window.appTimer = new PomodoroTimer(25);
    // Initialize visually as full ring for countdown
    window.appTimer.progressRing.style.strokeDashoffset = 0;
});
