const questions = [
    { q: "Στο Advanced τμήμα, ποιο εργαλείο μετατρέπει την Python σε Web App;", a: ["Excel", "Streamlit", "PowerPoint"], c: 1 },
    { q: "Τι χρησιμοποιούμε για να σχεδιάσουμε τη λογική ενός αλγορίθμου;", a: ["Flowcharts", "Word", "Paint"], c: 0 },
    { q: "Στο Junior τμήμα, ποιο εργαλείο μας βοηθάει να φτιάξουμε παιχνίδια;", a: ["Netflix", "Scratch 3.0", "Spotify"], c: 1 },
    { q: "Πώς ονομάζεται η ικανότητα της μηχανής να 'βλέπει' (π.χ. Teachable Machine);", a: ["Computer Vision", "Eye AI", "Glass Tech"], c: 0 },
    { q: "Πού γράφουμε κώδικα Python στο Cloud (Advanced);", a: ["Google Colab", "Facebook", "Instagram"], c: 0 }
];

let currentQ = 0; let score = 0;
// ΑΝΤΙΚΑΤΑΣΤΗΣΕ ΤΟ URL ΜΕ ΤΟ ΔΙΚΟ ΣΟΥ ΑΠΟ ΤΟ TEACHABLE MACHINE
const TM_URL = "https://teachablemachine.withgoogle.com/models/YOUR_ID/"; 
const flagMap = { "Greek": "🇬🇷", "English": "🇬🇧", "Spanish": "🇪🇸", "French": "🇫🇷" };

// --- QUIZ LOGIC ---
function startGame() {
    score = 0; currentQ = 0;
    document.getElementById('live-score').innerText = "0000";
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
    const sfx = idx === questions[currentQ].c ? 'sfx-correct' : 'sfx-wrong';
    document.getElementById(sfx).play();
    if(idx === questions[currentQ].c) score += 200;
    
    document.getElementById('live-score').innerText = score.toString().padStart(4, '0');
    currentQ++;
    if(currentQ < questions.length) showQuestion();
    else finishGame();
}

function finishGame() {
    document.getElementById('quiz-screen').innerHTML = `
        <h2 style="color:var(--lexis-accent); text-align:center;">MISSION COMPLETE</h2>
        <div style="font-size: 2.5rem; font-family:Orbitron; text-align:center; margin: 15px 0;">${score} XP</div>
        <button class="action-btn start-quiz" onclick="window.location.href='tel:2651030098'" style="background:#34c759">ΕΓΓΡΑΦΗ ΤΩΡΑ</button>
    `;
}

// --- AI LOGIC ---
async function initAI() {
    const btn = document.getElementById('activate-ai-btn');
    btn.innerText = "LOADING AI...";
    btn.disabled = true;

    try {
        const recognizer = speechCommands.create("BROWSER_FFT", undefined, TM_URL + "model.json", TM_URL + "metadata.json");
        await recognizer.ensureModelLoaded();
        
        document.querySelector('.ai-lab-zone').classList.add('active-mic');
        document.getElementById('status-label').innerText = "AI LISTENING";
        btn.innerText = "SENSOR ACTIVE";

        recognizer.listen(result => {
            const labels = recognizer.wordLabels();
            let max = Math.max(...result.scores);
            let idx = result.scores.indexOf(max);
            if (max > 0.85 && flagMap[labels[idx]]) {
                let f = document.getElementById('flag-display');
                f.innerText = flagMap[labels[idx]];
            }
        }, { probabilityThreshold: 0.85 });
    } catch(e) { 
        btn.innerText = "ERROR: MIC DENIED";
        console.error(e); 
    }
}