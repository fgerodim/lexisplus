// ===================== QUIZ =====================

const questions = [
    { q: "Αν θέλεις να μάθεις σε ένα σύστημα ΑΙ να ξεχωρίζει τις γάτες από τους σκύλους, ποιο είναι το πρώτο πράγμα που πρέπει να του δώσεις;", a: ["Πολλές φωτογραφίες με σκύλους και γάτες", "Θα της γράψεις ένα κείμενο που εξηγεί πώς μοιάζει μια γάτα", "Τίποτα από τα δύο"], c: 0 },
    { q: "Τι χρησιμοποιούμε για να σχεδιάσουμε τη λογική ενός αλγορίθμου;", a: ["Flowcharts (Διάγραμμα Ροής)", "Κείμενο σε Word", "Variables (Μεταβλητές)"], c: 0 },
    { q: "Όταν ένα Large Language Model (όπως το ChatGPT) δίνει μια απάντηση που ακούγεται σωστή αλλά είναι εντελώς φανταστική, πώς ονομάζεται το φαινόμενο;;", a: ["Boolean Logic", "Data Cleaning", "Hallucination"], c: 2 },
    { q: "Πώς ονομάζεται η ικανότητα της μηχανής να 'βλέπει';", a: ["Computer Vision", "Eye AI", "Glass Tech"], c: 0 },
    { q: "Τι είναι το 'Bias' (Προκατάληψη) σε έναν αλγόριθμο Τεχνητής Νοημοσύνης;", a: ["Σφάλμα όταν ένα προγραμμα δεν ξεκινάει", "Μεροληπτικά δεδομένα κατά την εκπαίδευση", "Ατέρμων βρόχος (ο αλγόριθμος δεν τερματίζει ποτέ)"], c: 1 }
];

let currentQ = 0;
let score = 0;

// ===================== AI STATE =====================

const TM_URL = "https://teachablemachine.withgoogle.com/models/-cqksMnLWR/";

let recognizer = null;
let isModelLoaded = false;
let isListening = false;
let detectedResult = null;

const flagMap = {
    "hello_en":      "🇬🇧",
    "geia_gr":       "🇬🇷",
    "ciao_it":       "🇮🇹",
    "hola_es":       "🇪🇸",
    "bonour_fr":    "🇫🇷",
    "konnichiwa_jp": "🇯🇵"
};

// ===================== QUIZ =====================

function startGame() {
    score = 0;
    currentQ = 0;
    document.getElementById("live-score").innerText = "0000";
    showQuestion();
}

function showQuestion() {
    const q = questions[currentQ];
    document.getElementById("level-label").innerText = `LEVEL ${currentQ + 1}/${questions.length}`;
    document.getElementById("progress-fill").style.width = `${(currentQ / questions.length) * 100}%`;
    document.getElementById("question-text").innerText = q.q;
    document.getElementById("options-grid").innerHTML =
        q.a.map((opt, i) => `<button class="option-btn" onclick="checkAns(${i})">${opt}</button>`).join("");
}

function checkAns(idx) {
    const isCorrect = idx === questions[currentQ].c;
    const sfx = document.getElementById(isCorrect ? "sfx-correct" : "sfx-wrong");
    if (sfx) sfx.play();
    if (isCorrect) score += 200;
    document.getElementById("live-score").innerText = String(score).padStart(4, "0");
    currentQ++;
    if (currentQ < questions.length) showQuestion();
    else finishGame();
}

function finishGame() {
    document.getElementById("quiz-screen").innerHTML = `
        <h2 style="text-align:center;color:#00ff88;">TECH LEVEL COMPLETE</h2>
        <div style="font-size:2rem;text-align:center;margin:20px;">${score} XP</div>
        <button class="action-btn start-quiz"
            onclick="window.location.href='tel:2651030098'"
            style="background:#34c759">ΕΓΓΡΑΦΗ ΤΩΡΑ</button>
    `;
}

// ===================== AI INIT =====================

async function initAI() {
    const btn = document.getElementById("activate-ai-btn");
    const status = document.getElementById("status-label");

    btn.innerText = "LOADING MODEL...";
    btn.disabled = true;
    status.innerText = "LOADING...";

    try {
        if (!recognizer) {
            recognizer = speechCommands.create(
                "BROWSER_FFT",
                undefined,
                TM_URL + "model.json",
                TM_URL + "metadata.json"
            );
            await recognizer.ensureModelLoaded();
        }

        isModelLoaded = true;
        status.innerText = "MODEL READY";
        btn.innerText = "MODEL READY ✓";
        btn.disabled = true;
        btn.style.opacity = "0.5";

        document.getElementById("record-btn").style.display = "flex";
        document.querySelector(".hint").innerText = "Κράτα το κουμπί και πες μια λέξη!";

    } catch (e) {
        console.error(e);
        status.innerText = "OFFLINE";
        btn.innerText = "RETRY SENSOR";
        btn.disabled = false;
    }
}

// ===================== PUSH TO TALK =====================

function setupRecordBtn() {
    const btn = document.getElementById("record-btn");

    // Για υπολογιστή
    btn.addEventListener("mousedown", startListening);
    btn.addEventListener("mouseup", stopListening);
    btn.addEventListener("mouseleave", stopListening);

    // Για κινητά - Εδώ είναι η διόρθωση
    btn.addEventListener("touchstart", (e) => {
        if (e.cancelable) e.preventDefault(); // Σταματάει το scroll/zoom του browser
        startListening();
    }, { passive: false }); // Κρίσιμο: επιτρέπει το preventDefault

    btn.addEventListener("touchend", (e) => {
        if (e.cancelable) e.preventDefault();
        stopListening();
    }, { passive: false });
}
async function startListening() {
    if (!isModelLoaded || isListening) return;

    const status = document.getElementById("status-label");
    const zone = document.querySelector(".ai-lab-zone");
    const flag = document.getElementById("flag-display");
    const btn = document.getElementById("record-btn");

    detectedResult = null;
    flag.innerText = "🎙️";
    status.innerText = "LISTENING...";
    zone.classList.add("active-mic");
    btn.classList.add("recording");

    try {
        await recognizer.listen(
            (result) => {
                const labels = recognizer.wordLabels();
                const scores = result.scores;

                let best = null;
                let bestScore = 0;

                for (let i = 0; i < labels.length; i++) {
                    if (labels[i] === "background_noise") continue;
                    if (scores[i] > bestScore) {
                        bestScore = scores[i];
                        best = labels[i];
                    }
                }

                // Keep best detection while holding button
                if (best && flagMap[best] && bestScore > 0.80) {
                    if (!detectedResult || bestScore > detectedResult.score) {
                        detectedResult = { label: best, score: bestScore };
                    }
                }
            },
            {
                probabilityThreshold: 0.75,
                overlapFactor: 0.5,
                invokeCallbackOnNoiseAndUnknown: false
            }
        );

        isListening = true;

    } catch (e) {
        console.error(e);
        status.innerText = "MIC ERROR";
        zone.classList.remove("active-mic");
        btn.classList.remove("recording");
    }
}

async function stopListening() {
    if (!isListening) return;
    isListening = false;

    const status = document.getElementById("status-label");
    const zone = document.querySelector(".ai-lab-zone");
    const flag = document.getElementById("flag-display");
    const btn = document.getElementById("record-btn");

    btn.classList.remove("recording");
    zone.classList.remove("active-mic");

    try {
        recognizer.stopListening();
    } catch (e) {
        console.error(e);
    }

    // Show result
    if (detectedResult && flagMap[detectedResult.label]) {
        flag.innerText = flagMap[detectedResult.label];
        status.innerText = "DETECTED! ✓";

        setTimeout(() => {
            flag.innerText = "🤖";
            status.innerText = "MODEL READY";
            detectedResult = null;
        }, 2500);

    } else {
        flag.innerText = "❓";
        status.innerText = "NOT RECOGNIZED";

        setTimeout(() => {
            flag.innerText = "🤖";
            status.innerText = "MODEL READY";
        }, 1500);
    }
}

// Init record button on load
window.addEventListener("load", setupRecordBtn);