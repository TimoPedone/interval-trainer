const intervalOrder = [
    "Octave", "Major Seventh", "Minor Seventh", "Major Sixth", "Minor Sixth", "Perfect Fifth",
    "Tritone", "Perfect Fourth", "Major Third", "Minor Third", "Major Second", "Minor Second"
];

const levelConfig = [
    ["Octave", "Tritone"],
    ["Octave", "Tritone", "Major Third"],
    ["Octave", "Tritone", "Major Third", "Major Second"],
    ["Octave", "Tritone", "Major Third", "Major Second", "Major Sixth"],
    ["Octave", "Tritone", "Major Third", "Major Second", "Major Sixth", "Major Seventh"],
    ["Octave", "Tritone", "Major Third", "Major Second", "Major Sixth", "Major Seventh", "Perfect Fourth"],
    ["Octave", "Tritone", "Major Third", "Major Second", "Major Sixth", "Major Seventh", "Perfect Fourth", "Minor Seventh"],
    ["Octave", "Tritone", "Major Third", "Major Second", "Major Sixth", "Major Seventh", "Perfect Fourth", "Minor Seventh", "Minor Third"],
    ["Octave", "Tritone", "Major Third", "Major Second", "Major Sixth", "Major Seventh", "Perfect Fourth", "Minor Seventh", "Minor Third", "Minor Sixth"],
    ["Octave", "Tritone", "Major Third", "Major Second", "Major Sixth", "Major Seventh", "Perfect Fourth", "Minor Seventh", "Minor Third", "Minor Sixth", "Minor Second"],
    ["Octave", "Tritone", "Major Third", "Major Second", "Major Sixth", "Major Seventh", "Perfect Fourth", "Minor Seventh", "Minor Third", "Minor Sixth", "Minor Second", "Perfect Fifth"]
];

const audioMap = {
    "Octave": "audio/octave.mp3",
    "Tritone": "audio/tritone.mp3",
    "Major Third": "audio/major_third.mp3",
    "Major Second": "audio/major_second.mp3",
    "Major Sixth": "audio/major_sixth.mp3",
    "Major Seventh": "audio/major_seventh.mp3",
    "Perfect Fourth": "audio/perfect_fourth.mp3",
    "Minor Seventh": "audio/minor_seventh.mp3",
    "Minor Third": "audio/minor_third.mp3",
    "Minor Sixth": "audio/minor_sixth.mp3",
    "Minor Second": "audio/minor_second.mp3",
    "Perfect Fifth": "audio/perfect_fifth.mp3"
};

let currentLevel = 1, correctCount = 0, errorCount = 0, currentCorrectInterval = null;
let questionQueue = [], useRandomPitch = false, currentAudio = null, audioUnlocked = false;

const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");
const errorText = document.getElementById("errorText");
const playButton = document.getElementById("playButton");
const randomPitchToggle = document.getElementById("randomPitchToggle");
const endScreen = document.getElementById("endScreen");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const restartButton = document.getElementById("restartButton");

randomPitchToggle.addEventListener("change", e => useRandomPitch = e.target.checked);
restartButton.addEventListener("click", restartGame);

playButton.addEventListener("click", () => {
    if (!audioUnlocked) unlockAudio();
    if (currentCorrectInterval) playIntervalSound(currentCorrectInterval);
});

// Unlock audio
function unlockAudio() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        audioUnlocked = true;
    } catch (e) { console.error("Audio unlock failed:", e); }
}

// Load level
function loadLevel(level) {
    correctCount = 0;
    errorCount = 0;
    updateUI();
    const intervals = levelConfig[level - 1];
    const newInterval = level > 1 ? levelConfig[level - 1].find(i => !levelConfig[level - 2].includes(i)) : null;
    enableUnlockedButtons(intervals);
    questionQueue = generateQuestionQueue(intervals, newInterval);
    nextQuestion();
}

// Enable buttons by level
function enableUnlockedButtons(intervals) {
    intervalOrder.forEach(name => {
        const btn = document.getElementById("btn" + name.replace(/\s/g, ""));
        if (!btn) return;
        if (intervals.includes(name)) {
            btn.classList.remove("disabled");
            btn.disabled = false;
            btn.onclick = () => onAnswer(name, btn);
        } else {
            btn.classList.add("disabled");
            btn.disabled = true;
            btn.onclick = null;
        }
    });
}

// Generate question queue
function generateQuestionQueue(intervals, newInterval) {
    let queue = [];
    if (newInterval) {
        queue.push(newInterval);
        for (let i = 0; i < 2; i++) queue.push(newInterval);
    }
    while (queue.length < 10) {
        queue.push(intervals[Math.floor(Math.random() * intervals.length)]);
    }
    const first = queue[0];
    const rest = queue.slice(1).sort(() => Math.random() - 0.5);
    return [first, ...rest];
}

// Next question
function nextQuestion() {
    if (questionQueue.length === 0) return;
    currentCorrectInterval = questionQueue.shift();
    if (audioUnlocked) playIntervalSound(currentCorrectInterval);
}

// Play sound
function playIntervalSound(name) {
    if (!name || !audioMap[name]) return;
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    const audio = new Audio(audioMap[name]);
    currentAudio = audio;
    if (useRandomPitch) {
        const rate = Math.pow(2, (Math.random() * 6 - 3) / 12);
        audio.playbackRate = rate;
    }
    playButton.disabled = true;
    audio.addEventListener("ended", () => playButton.disabled = false);
    audio.play().catch(err => console.warn("Playback blocked:", err));
}

// On answer
function onAnswer(selected, btn) {
    if (selected === currentCorrectInterval) {
        correctCount++;
        btn.classList.add("correct");
        setTimeout(() => btn.classList.remove("correct"), 400);
    } else {
        errorCount++;
        btn.classList.add("wrong");
        setTimeout(() => btn.classList.remove("wrong"), 400);
    }

    if (correctCount >= 10) {
        currentLevel++;
        if (currentLevel > 11) return showEnd(true);
        loadLevel(currentLevel);
        return;
    }

    if (errorCount >= 3) return showEnd(false);
    updateUI();
    nextQuestion();
}

// Update HUD
function updateUI() {
    levelText.textContent = `Level ${currentLevel}`;
    scoreText.textContent = `Correct: ${correctCount} / 10`;
    errorText.textContent = `Errors: ${errorCount} / 3`;
}

// End screen
function showEnd(completed) {
    endScreen.classList.remove("hidden");
    playButton.disabled = true;
    if (completed) {
        endTitle.textContent = "🎉 Congratulations!";
        endMessage.textContent = "You completed all levels!";
    } else {
        endTitle.textContent = "❌ Game Over!";
        endMessage.textContent = "You made 3 mistakes. Try again!";
    }
}

// Restart
function restartGame() {
    currentLevel = 1;
    endScreen.classList.add("hidden");
    playButton.disabled = false;
    loadLevel(currentLevel);
}

window.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", () => { if (!audioUnlocked) unlockAudio(); }, { once: true });
    loadLevel(currentLevel);
});
