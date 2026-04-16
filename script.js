// --- CONFIGURATION ---
const questions = [
    { q: "Στο Advanced τμήμα, ποιο εργαλείο μετατρέπει την Python σε Web App;", a: ["Excel", "Streamlit", "PowerPoint"], c: 1 },
    { q: "Τι χρησιμοποιούμε για να σχεδιάσουμε τη λογική ενός αλγορίθμου;", a: ["Flowcharts", "Word", "Paint"], c: 0 },
    { q: "Στο Junior τμήμα, ποιο εργαλείο μας βοηθάει να φτιάξουμε παιχνίδια;", a: ["Netflix", "Scratch 3.0", "Spotify"], c: 1 },
    { q: "Πώς ονομάζεται η ικανότητα της μηχανής να 'βλέπει' (π.χ. Teachable Machine);", a: ["Computer Vision", "Eye AI", "Glass Tech"], c: 0 },
    { q: "Πού γράφουμε κώδικα Python στο Cloud (Advanced);", a: ["Google Colab", "Facebook", "Instagram"], c: 0 }
];

const TM_URL = "https://teachablemachine.withgoogle.com/models/rWcz2aeaS/"; 
const flagMap = {
    "hello_en": "🇬🇧",
    "geia_gr": "🇬🇷"
};

// --- GLOBAL VARIABLES ---
let currentQ = 0; 
let score = 0; 
let lastDetectionTime = 0;
let recognizer; // Παγκόσμια μεταβλητή για το AI

// --- QUIZ LOGIC ---
function startGame() {
    score = 0; 
    currentQ = 0;
    document.getElementById('live-score').innerText = "0000";
    showQuestion();
}

function showQuestion() {
    let q = questions[currentQ];
    document.getElementById('level-label').innerText = `LEVEL ${currentQ + 1}/5`;
    document.getElementById('progress-fill').style.width = `${((currentQ) / questions.length) * 100}%`;
    document.getElementById('question-text').innerText = q.q;
    document.getElementById('options-grid').innerHTML = q.a.map((opt, i) => 
        `<button class="option-btn" onclick="checkAns(${i})">${opt}</button>`
    ).join('');
}

function checkAns(idx) {
    const isCorrect = idx === questions[currentQ].c;
    const sfxId = isCorrect ? 'sfx-correct' : 'sfx-wrong';
    
    const sfx = document.getElementById(sfxId);
    if(sfx) sfx.play();

    if(isCorrect) score += 200;
    
    document.getElementById('live-score').innerText = score.toString().padStart(4, '0');
    currentQ++;

    if(currentQ < questions.length) {
        showQuestion();
    } else {
        finishGame();
    }
}

function finishGame() {
    document.getElementById('quiz-screen').innerHTML = `
        <h2 style="color:var(--lexis-accent); text-align:center;">MISSION COMPLETE</h2>
        <div style="font-size: 2.5rem; font-family:Orbitron; text-align:center; margin: 15px 0;">${score} XP</div>
        <button class="action-btn start-quiz" onclick="window.location.href='tel:2651030098'" style="background:#34c759">ΕΓΓΡΑΦΗ ΤΩΡΑ</button>
    `;
}

// --- AI LOGIC (TOGGLE ON/OFF) ---
async function initAI() {
    const btn = document.getElementById('activate-ai-btn');
    const statusLabel = document.getElementById('status-label');

    // 1. ΛΕΙΤΟΥΡΓΙΑ TOGGLE: Αν ακούει ήδη, σταμάτα το
    if (recognizer && recognizer.isListening()) {
        await stopAI();
        return;
    }

    btn.innerText = "CONNECTING...";
    btn.disabled = true;

    // ΕΛΕΓΧΟΣ URL
    if (TM_URL.includes("YOUR_ID")) {
        alert("Please set your Teachable Machine URL first!");
        btn.innerText = "URL MISSING";
        btn.disabled = false;
        return;
    }

    try {
        // 2. Ξεκλείδωμα Audio για Mobile
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        // 3. Δημιουργία/Φόρτωση Μοντέλου (αν δεν έχει ήδη δημιουργηθεί)
        if (!recognizer) {
            recognizer = speechCommands.create("BROWSER_FFT", undefined, TM_URL + "model.json", TM_URL + "metadata.json");
            await recognizer.ensureModelLoaded();
        }

        // 4. Έναρξη Ακρόασης
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
            // Debounce 1 δευτερόλεπτο και threshold 0.75
            if (maxScore > 0.75 && flagMap[detectedLabel]) {
                if (now - lastDetectionTime > 1000) {
                    document.getElementById('flag-display').innerText = flagMap[detectedLabel];
                    lastDetectionTime = now;
                    console.log("AI Detected:", detectedLabel);
                }
            }
        }, {
            probabilityThreshold: 0.70,
            overlapFactor: 0.5
        });

        // 5. UI Update - "ON" State
        document.querySelector('.ai-lab-zone').classList.add('active-mic');
        statusLabel.innerText = "AI LISTENING";
        btn.innerText = "TURN OFF SENSOR";
        btn.style.background = "#ff3b30"; // Κόκκινο όταν είναι ενεργό
        btn.disabled = false;

    } catch(e) { 
        console.error("Mic/AI Error:", e);
        btn.innerText = "RETRY SENSOR";
        btn.disabled = false;
        statusLabel.innerText = "OFFLINE";
        alert("Σφάλμα πρόσβασης στο μικρόφωνο. Παρακαλώ επιτρέψτε την πρόσβαση.");
    }
}

async function stopAI() {
    if (recognizer && recognizer.isListening()) {
        await recognizer.stop();
        
        const btn = document.getElementById('activate-ai-btn');
        const statusLabel = document.getElementById('status-label');
        
        // UI Update - "OFF" State
        document.querySelector('.ai-lab-zone').classList.remove('active-mic');
        statusLabel.innerText = "SENSOR OFF";
        btn.innerText = "ACTIVATE AI SENSOR";
        btn.style.background = "var(--lexis-accent)"; // Επιστροφή στο αρχικό χρώμα
        btn.disabled = false;
        
        console.log("AI Sensor Stopped.");
    }
}