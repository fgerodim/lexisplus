// --- CONFIGURATION ---
const questions = [
    { q: "Στο Advanced τμήμα, ποιο εργαλείο μετατρέπει την Python σε Web App;", a: ["Excel", "Streamlit", "PowerPoint"], c: 1 },
    { q: "Τι χρησιμοποιούμε για να σχεδιάσουμε τη λογική ενός αλγορίθμου;", a: ["Flowcharts", "Word", "Paint"], c: 0 },
    { q: "Στο Junior τμήμα, ποιο εργαλείο μας βοηθάει να φτιάξουμε παιχνίδια;", a: ["Netflix", "Scratch 3.0", "Spotify"], c: 1 },
    { q: "Πώς ονομάζεται η ικανότητα της μηχανής να 'βλέπει';", a: ["Computer Vision", "Eye AI", "Glass Tech"], c: 0 },
    { q: "Πού γράφουμε κώδικα Python στο Cloud;", a: ["Google Colab", "Facebook", "Instagram"], c: 0 }
];

const TM_URL = "https://teachablemachine.withgoogle.com/models/rWcz2aeaS/";

// --- STATE ---
let currentQ = 0;
let score = 0;

let recognizer = null;
let micStream = null;

let isAIActive = false;
let lastDetectionTime = 0;

// label -> emoji
const flagMap = {
    "hello_en": "🇬🇧",
    "geia_gr": "🇬🇷"
};

// ---------------- QUIZ ----------------

function startGame() {
    score = 0;
    currentQ = 0;

    document.getElementById('live-score').innerText = "0000";
    showQuestion();
}

function showQuestion() {
    const q = questions[currentQ];

    document.getElementById('level-label').innerText = `LEVEL ${currentQ + 1}/${questions.length}`;
    document.getElementById('progress-fill').style.width =
        `${(currentQ / questions.length) * 100}%`;

    document.getElementById('question-text').innerText = q.q;

    document.getElementById('options-grid').innerHTML =
        q.a.map((opt, i) =>
            `<button class="option-btn" onclick="checkAns(${i})">${opt}</button>`
        ).join('');
}

function checkAns(idx) {
    const isCorrect = idx === questions[currentQ].c;

    const sfx = document.getElementById(isCorrect ? 'sfx-correct' : 'sfx-wrong');
    if (sfx) sfx.play();

    if (isCorrect) score += 200;

    document.getElementById('live-score').innerText = String(score).padStart(4, '0');

    currentQ++;

    if (currentQ < questions.length) {
        showQuestion();
    } else {
        finishGame();
    }
}

function finishGame() {
    document.getElementById('quiz-screen').innerHTML = `
        <h2 style="color:var(--lexis-accent); text-align:center;">MISSION COMPLETE</h2>
        <div style="font-size: 2.5rem; text-align:center; margin: 15px 0;">${score} XP</div>
        <button class="action-btn start-quiz"
            onclick="window.location.href='tel:2651030098'"
            style="background:#34c759">
            ΕΓΓΡΑΦΗ ΤΩΡΑ
        </button>
    `;
}

// ---------------- AI LOGIC ----------------

let timer; // Μεταβλητή για το χρονόμετρο 5 δευτερολέπτων

async function initAI() {
    const btn = document.getElementById('activate-ai-btn');
    const statusLabel = document.getElementById('status-label');

    // 1. Αν πατηθεί ενώ είναι ανοιχτό, το κλείνουμε χειροκίνητα και καθαρίζουμε το χρονόμετρο
    if (recognizer && recognizer.isListening()) {
        clearTimeout(timer); // Ακύρωση του αυτόματου κλεισίματος
        await stopAI();
        return;
    }

    btn.innerText = "CONNECTING...";
    btn.disabled = true;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        if (!recognizer) {
            recognizer = speechCommands.create("BROWSER_FFT", undefined, TM_URL + "model.json", TM_URL + "metadata.json");
            await recognizer.ensureModelLoaded();
        }

        await recognizer.listen(result => {
            const labels = recognizer.wordLabels();
            const scores = result.scores;
            let maxScore = 0;
            let detectedLabel = null;

            labels.forEach((label, i) => {
                if (label === "background_noise") return;
                if (scores[i] > maxScore) {
                    maxScore = scores[i];
                    detectedLabel = label;
                }
            });

            const now = Date.now();
            if (maxScore > 0.80 && flagMap[detectedLabel]) {
                if (now - lastDetectionTime > 1000) {
                    document.getElementById('flag-display').innerText = flagMap[detectedLabel];
                    lastDetectionTime = now;
                }
            }
        }, {
            probabilityThreshold: 0.75,
            overlapFactor: 0.70
        });

        // 2. UI UPDATE - ΕΝΕΡΓΟ
        document.querySelector('.ai-lab-zone').classList.add('active-mic');
        statusLabel.innerText = "AI LISTENING (5s)";
        btn.innerText = "STOP SENSOR NOW";
        btn.style.background = "#ff3b30";
        btn.disabled = false;

        // 3. ΑΥΤΟΜΑΤΟ ΚΛΕΙΣΙΜΟ ΜΕΤΑ ΑΠΟ 5 ΔΕΥΤΕΡΟΛΕΠΤΑ
        clearTimeout(timer); // Σιγουρευόμαστε ότι δεν τρέχει άλλο timer
        timer = setTimeout(async () => {
            if (recognizer && recognizer.isListening()) {
                await stopAI();
                statusLabel.innerText = "AUTO-OFF (TIME UP)";
            }
        }, 5000); // 5000ms = 5 δευτερόλεπτα

    } catch(e) { 
        console.error("AI Error:", e);
        btn.innerText = "RETRY SENSOR";
        btn.disabled = false;
        statusLabel.innerText = "OFFLINE";
    }
}

async function stopAI() {
    if (recognizer && recognizer.isListening()) {
        await recognizer.stop();
        
        const btn = document.getElementById('activate-ai-btn');
        const statusLabel = document.getElementById('status-label');
        
        document.querySelector('.ai-lab-zone').classList.remove('active-mic');
        statusLabel.innerText = "SENSOR OFF";
        btn.innerText = "ACTIVATE AI SENSOR";
        btn.style.background = ""; // Επιστροφή στο CSS default
        btn.disabled = false;
    }
}