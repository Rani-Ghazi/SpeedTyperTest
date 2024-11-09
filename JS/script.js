// Centralized state management
const testState = {
    isTestRunning: false,
    isTestPaused: false,
    hasCompleted: false,
    errors: 0,
    correctChars: 0,
    totalChars: 0,
    elapsedTime: 0,
    startTime: null,
    timerInterval: null,
    randomIndex: 0
};

// DOM Elements
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
const typingInput = document.getElementById('typing-input');
const textToType = document.getElementById('text-to-type');
const timerDisplay = document.getElementById('timer');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const errorsDisplay = document.getElementById('errors');
const progressBar = document.getElementById('progress');
const modal = document.getElementById('modal');
const modalWpm = document.getElementById('modal-wpm');
const modalAccuracy = document.getElementById('modal-accuracy');
const modalErrors = document.getElementById('modal-errors');
const themeToggle = document.getElementById('theme-toggle');
const modalCloseButton = document.querySelector('.close-btn');
const modalRestartButton = document.getElementById('modal-restart');

// Sentences to type
const sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "A journey of a thousand miles begins with a single step.",
    "To be or not to be, that is the question.",
    "All that glitters is not gold.",
    "The early bird catches the worm.",
    "A picture is worth a thousand words.",
    "Actions speak louder than words.",
    "Better late than never.",
    "Every cloud has a silver lining.",
    "When in Rome, do as the Romans do."
];

// Audio Feedback
const errorSound = new Audio('./sounds/error.mp3');
const completeSound = new Audio('./sounds/complete.mp3');
let playedErrors = [];

// Helper Functions
function padTime(time) {
    return time < 10 ? '0' + time : time;
}

function updateTimer() {
    if (!testState.isTestRunning || testState.isTestPaused) return;

    testState.elapsedTime = Math.floor((Date.now() - testState.startTime) / 1000);
    let minutes = Math.floor(testState.elapsedTime / 60);
    let seconds = testState.elapsedTime % 60;
    timerDisplay.textContent = `${padTime(minutes)}:${padTime(seconds)}`;

    calculateWPM();
    calculateAccuracy();
    updateProgressBar();
}

function calculateWPM() {
    let typedText = typingInput.value;
    let wordCount = typedText.split(' ').length;
    let minutes = testState.elapsedTime / 60 || 1;
    let wpm = Math.round(wordCount / minutes);
    wpmDisplay.textContent = wpm;
    modalWpm.textContent = wpm;
}

function calculateAccuracy() {
    if (testState.isTestPaused) return;

    let typedText = typingInput.value;
    let correctCount = 0;
    let minLength = Math.min(typedText.length, testState.totalChars);

    let spanElements = textToType.querySelectorAll('span');
    spanElements.forEach(span => span.classList.remove('error', 'correct'));

    for (let i = 0; i < minLength; i++) {
        let span = textToType.childNodes[i];
        if (typedText[i] === sentences[testState.randomIndex][i]) {
            correctCount++;
            span?.classList.add('correct');
        } else {
            testState.errors++;
            if (!playedErrors[i]) {
                errorSound.play();
                playedErrors[i] = true;
            }
            span?.classList.add('error');
        }
    }

    let accuracy = Math.round((correctCount / testState.totalChars) * 100);
    accuracyDisplay.textContent = `${accuracy}%`;
    modalAccuracy.textContent = `${accuracy}%`;
    errorsDisplay.textContent = testState.errors;
    updateProgressBar();
}

function updateProgressBar() {
    let typedText = typingInput.value;
    let progress = Math.min((typedText.length / testState.totalChars) * 100, 100);
    progressBar.style.width = `${progress}%`;
    progressBar.style.backgroundColor = progress >= 100 ? '#4CAF50' : '#2196F3';

    if (progress >= 100 && !testState.hasCompleted && !testState.isTestPaused) {
        completeSound.play();
        openModal();
        clearInterval(testState.timerInterval);
        testState.hasCompleted = true;
    }
}

function openModal() {
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

function restartTestFromModal() {
    resetTest();
    startTest();
}

function resetTest() {
    clearInterval(testState.timerInterval);
    testState.timerInterval = null;

    timerDisplay.textContent = '00:00';
    typingInput.disabled = true;
    typingInput.value = '';
    textToType.innerHTML = '';  

    testState.errors = 0;
    accuracyDisplay.textContent = '100%';
    wpmDisplay.textContent = '0';
    errorsDisplay.textContent = '0';
    progressBar.style.width = '0';

    playedErrors = [];
    testState.hasCompleted = false;
    testState.isTestRunning = false;
    testState.isTestPaused = false;
    
    modal.style.display = 'none';

    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = true;

    pauseButton.textContent = "Pause";  

    typingInput.focus();
}

// Debounce function for input event
function debounce(func, delay) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(func, delay);
    };
}

const updateProgressBarDebounced = debounce(updateProgressBar, 200);

// Button Click Events
startButton.addEventListener('click', () => {
    if (testState.isTestPaused) {
        testState.isTestPaused = false;
        testState.startTime = Date.now() - testState.elapsedTime * 1000;
        testState.timerInterval = setInterval(updateTimer, 1000);
        pauseButton.disabled = false;
        startButton.disabled = true;
    } else {
        startTest();
    }
});

pauseButton.addEventListener('click', pauseTest);
resetButton.addEventListener('click', resetTest);
modalCloseButton.addEventListener('click', closeModal);
modalRestartButton.addEventListener('click', restartTestFromModal);
typingInput.addEventListener('input', updateProgressBarDebounced);

function pauseTest() {
    if (testState.isTestRunning && !testState.isTestPaused) {
        clearInterval(testState.timerInterval);
        testState.isTestPaused = true;
        pauseButton.textContent = "Resume";  
    } else if (testState.isTestRunning && testState.isTestPaused) {
        testState.isTestPaused = false;
        testState.startTime = Date.now() - testState.elapsedTime * 1000;
        testState.timerInterval = setInterval(updateTimer, 1000);
        pauseButton.textContent = "Pause";  
    }
}

function startTest() {
    let randomIndex = Math.floor(Math.random() * sentences.length);
    testState.randomIndex = randomIndex;
    let testText = sentences[randomIndex];
    textToType.innerHTML = '';  

    testText.split('').forEach(char => {
        let span = document.createElement('span');
        span.textContent = char;
        textToType.appendChild(span);
    });

    typingInput.value = '';
    typingInput.disabled = false;
    startButton.disabled = true;
    pauseButton.disabled = false;
    pauseButton.textContent = "Pause";  
    resetButton.disabled = false;
    typingInput.focus();
    testState.totalChars = testText.length;

    if (!testState.isTestPaused) {
        testState.startTime = Date.now();
        testState.timerInterval = setInterval(updateTimer, 1000);
    }

    testState.isTestRunning = true;
    testState.isTestPaused = false;
    testState.hasCompleted = false;
}

// Theme Toggle Functionality
themeToggle.addEventListener('click', () => {
    // Toggle dark mode class on body element
    document.body.classList.toggle('dark-theme');

    // Change button icon based on the active theme
    if (document.body.classList.contains('dark-theme')) {
        themeToggle.textContent = '🌞';  // Sun icon for light mode
    } else {
        themeToggle.textContent = '🌙';  // Moon icon for dark mode
    }
});

