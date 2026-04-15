const questions = [
    { q: "Στο Advanced τμήμα, ποιο εργαλείο μετατρέπει την Python σε Web App;", a: ["Excel", "Streamlit", "PowerPoint"], c: 1 },
    { q: "Τι χρησιμοποιούμε για να σχεδιάσουμε τη λογική ενός αλγορίθμου;", a: ["Flowcharts", "Word", "Paint"], c: 0 },
    { q: "Στο Junior τμήμα, ποιο εργαλείο μας βοηθάει να φτιάξουμε παιχνίδια;", a: ["Netflix", "Scratch 3.0", "Spotify"], c: 1 },
    { q: "Πώς ονομάζεται η ικανότητα της μηχανής να 'βλέπει' (π.χ. Teachable Machine);", a: ["Computer Vision", "Eye AI", "Glass Tech"], c: 0 },
    { q: "Πού γράφουμε κώδικα Python στο Cloud (Advanced);", a: ["Google Colab", "Facebook", "Instagram"], c: 0 }
];

let currentQ = 0; let score = 0;
// ΑΝΤΙΚΑΤΑΣΤΗΣΕ ΤΟ URL ΜΕ ΤΟ ΔΙΚΟ ΣΟΥ ΑΠΟ ΤΟ TEACHABLE MACHINE
const TM_URL = "https://teachablemachine.withgoogle.com/models/6X_8XkR7p/";
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

async function initAI() {
    const btn = document.getElementById('activate-ai-btn');
    const statusLabel = document.getElementById('status-label');
    
    btn.innerText = "CONNECTING...";
    btn.disabled = true;

    // ΕΛΕΓΧΟΣ ΑΝ ΕΧΕΙ ΜΠΕΙ ΜΟΝΤΕΛΟ
    if (TM_URL.includes("YOUR_ID")) {
        console.warn("AI Model missing. Entering Preview Mode...");
        
        // Προσομοίωση ενεργοποίησης για να δεις τα γραφικά σου
        setTimeout(() => {
            document.querySelector('.ai-lab-zone').classList.add('active-mic');
            statusLabel.innerText = "DEMO MODE (No Model)";
            btn.innerText = "MODEL REQUIRED";
            btn.style.background = "#ffcc00"; // Πορτοκαλί αντί για πράσινο
            btn.disabled = false;
            alert("Το AI Section είναι έτοιμο οπτικά! Για να λειτουργήσει η αναγνώριση φωνής, πρέπει να βάλετε το δικό σας URL από το Teachable Machine.");
        }, 1000);
        return;
    }

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        
        // Ζητάμε το stream πριν ξεκινήσουμε το μοντέλο
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        const recognizer = speechCommands.create("BROWSER_FFT", undefined, TM_URL + "model.json", TM_URL + "metadata.json");
        
        // Timeout 5 δευτερολέπτων για τη φόρτωση
        await Promise.race([
            recognizer.ensureModelLoaded(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
        ]);

        document.querySelector('.ai-lab-zone').classList.add('active-mic');
        statusLabel.innerText = "AI LISTENING";
        btn.innerText = "SENSOR ACTIVE";
        btn.style.background = "#34c759";

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
        console.error("Mic/AI Error:", e);
        btn.innerText = "ERROR: CHECK URL";
        btn.disabled = false;
        statusLabel.innerText = "OFFLINE";
    }



}