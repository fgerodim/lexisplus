const questions = [
    { q: "Ποια γλώσσα είναι ο 'βασιλιάς' του AI στο LEXIS Plus;", a: ["Java", "Python", "Scratch"], c: 1 },
    { q: "Τι είναι ο 'Αλγόριθμος' με απλά λόγια;", a: ["Συνταγή με βήματα", "Μνήμη RAM"], c: 0 },
    { q: "Το Streamlit μας επιτρέπει να φτιάχνουμε...", a: ["Web Apps", "Καλώδια"], c: 0 },
    { q: "Στο Junior τμήμα, το AI μαθαίνει από...", a: ["Βιβλία", "Δεδομένα (Data)"], c: 1 },
    { q: "Πού αποθηκεύουμε κώδικα στο Cloud;", a: ["Google Colab", "Excel"], c: 0 }
];

let currentQ = 0; let score = 0;
// ΑΝΤΙΚΑΤΑΣΤΗΣΕ ΤΟ URL ΜΕ ΤΟ ΔΙΚΟ ΣΟΥ ΑΠΟ ΤΟ TEACHABLE MACHINE
const URL = "https://teachablemachine.withgoogle.com/models/YOUR_ID/"; 
const flagMap = { "Greek": "🇬🇷", "English": "🇬🇧", "Spanish": "🇪🇸", "French": "🇫🇷" };

async function startGame() {
    score = 0; currentQ = 0;
    document.getElementById('live-score').innerText = "0000";
    await initAI(); 
    showQuestion();
}

function showQuestion() {
    let q = questions[currentQ];
    document.getElementById('level-label').innerText = `LEVEL ${currentQ + 1}/5`;
    document.getElementById('progress-fill').style.width = `${(currentQ / questions.length) * 100}%`;
    document.getElementById('question-text').innerText = q.q;
    document.getElementById('options-grid').innerHTML = q.a.map((opt, i) => 
        `<button class="option-btn" onclick="checkAns(${i})">${opt}</button>`
    ).join('');
}

function checkAns(idx) {
    if(idx === questions[currentQ].c) {
        score += 200;
        document.getElementById('sfx-correct').play();
    } else {
        document.getElementById('sfx-wrong').play();
    }
    document.getElementById('live-score').innerText = score.toString().padStart(4, '0');
    currentQ++;
    if(currentQ < questions.length) {
        showQuestion();
    } else {
        finishGame();
    }
}

function finishGame() {
    let rank = score >= 800 ? "AI OVERLORD" : "FUTURE CODER";
    document.getElementById('quiz-screen').innerHTML = `
        <h2 style="color:var(--lexis-accent); text-align:center;">MISSION COMPLETE</h2>
        <div style="font-size: 3rem; font-family:Orbitron; text-align:center; margin: 20px 0;">${score}</div>
        <p style="text-align:center; margin-bottom:20px;">RANK: <strong>${rank}</strong></p>
        <button class="start-btn" onclick="window.location.href='tel:2651030098'" style="background:#34c759">ΚΑΛΕΣΕ ΓΙΑ ΕΓΓΡΑΦΗ</button>
    `;
}

async function initAI() {
    try {
        const recognizer = speechCommands.create("BROWSER_FFT", undefined, URL + "model.json", URL + "metadata.json");
        await recognizer.ensureModelLoaded();
        document.getElementById('ai-module').classList.add('active-mic');
        document.getElementById('status-label').innerText = "AI ACTIVE";

        recognizer.listen(result => {
            const labels = recognizer.wordLabels();
            let max = Math.max(...result.scores);
            let idx = result.scores.indexOf(max);
            if (max > 0.85 && flagMap[labels[idx]]) {
                let f = document.getElementById('flag-display');
                f.innerText = flagMap[labels[idx]];
                f.style.transform = "scale(1.3)";
                setTimeout(() => f.style.transform = "scale(1)", 300);
            }
        }, { probabilityThreshold: 0.85 });
    } catch(e) { console.error("Mic error"); }
}