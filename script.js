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
let isAIActive = false;
let isBusy = false;
let lastDetectionTime = 0;

const flagMap = {
    "hello_en": "🇬🇧",   // Αγγλικά
    "geia_gr": "🇬🇷",    // Ελληνικά
    "ciao_it": "🇮🇹",    // Ιταλικά
    "hola_es": "🇪🇸",    // Ισπανικά
    "bonjour_fr": "🇫🇷", // Γαλλικά
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

    document.getElementById("level-label").innerText =
        `LEVEL ${currentQ + 1}/${questions.length}`;

    document.getElementById("progress-fill").style.width =
        `${(currentQ / questions.length) * 100}%`;

    document.getElementById("question-text").innerText = q.q;

    document.getElementById("options-grid").innerHTML =
        q.a.map((opt, i) =>
            `<button class="option-btn" onclick="checkAns(${i})">${opt}</button>`
        ).join("");
}

function checkAns(idx) {
    const isCorrect = idx === questions[currentQ].c;

    const sfx = document.getElementById(isCorrect ? "sfx-correct" : "sfx-wrong");
    if (sfx) sfx.play();

    if (isCorrect) score += 200;

    document.getElementById("live-score").innerText =
        String(score).padStart(4, "0");

    currentQ++;

    if (currentQ < questions.length) {
        showQuestion();
    } else {
        finishGame();
    }
}

function finishGame() {
    document.getElementById("quiz-screen").innerHTML = `
        <h2 style="text-align:center;color:#00ff88;">TECH LEVEL COMPLETE</h2>
        <div style="font-size:2rem;text-align:center;margin:20px;">
            ${score} XP
        </div>
        <button class="action-btn start-quiz"
            onclick="window.location.href='tel:2651030098'"
            style="background:#34c759">
            ΕΓΓΡΑΦΗ ΤΩΡΑ
        </button>
    `;
}

// ===================== AI (STABLE ONE-SHOT) =====================

async function initAI() {
    if (isBusy) return;
    isBusy = true;

    const btn = document.getElementById("activate-ai-btn");
    const status = document.getElementById("status-label");
    const zone = document.querySelector(".ai-lab-zone");

    try {
        if (isAIActive) {
            await stopAI();
            isBusy = false;
            return;
        }

        btn.innerText = "CONNECTING...";
        btn.disabled = true;

        if (!recognizer) {
            recognizer = speechCommands.create(
                "BROWSER_FFT",
                undefined,
                TM_URL + "model.json",
                TM_URL + "metadata.json"
            );
            await recognizer.ensureModelLoaded();
        }

        await recognizer.listen(handleResult, {
            probabilityThreshold: 0.8,
            overlapFactor: 0.3
        });

        isAIActive = true;

        zone.classList.add("active-mic");
        status.innerText = "AI LISTENING";

        btn.innerText = "TURN OFF SENSOR";
        btn.style.background = "#ff3b30";
        btn.disabled = false;

    } catch (e) {
        console.error(e);
        status.innerText = "OFFLINE";
        btn.innerText = "RETRY SENSOR";
        btn.disabled = false;
    }

    isBusy = false;
}

// ===================== AI CALLBACK =====================

function handleResult(result) {
    if (!isAIActive || !recognizer) return;

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

    const now = Date.now();

    if (
        bestScore > 0.8 &&
        flagMap[best] &&
        now - lastDetectionTime > 1000
    ) {
        const flag = document.getElementById("flag-display");

        // show result instantly
        flag.innerText = flagMap[best];

        lastDetectionTime = now;

        // freeze AI first
        isAIActive = false;

        // stop safely after render
        setTimeout(() => {
            stopAI();
        }, 500);
    }
}

// ===================== STOP AI =====================

async function stopAI() {
    const btn = document.getElementById("activate-ai-btn");
    const status = document.getElementById("status-label");
    const zone = document.querySelector(".ai-lab-zone");
    const flag = document.getElementById("flag-display");

    try {
        isAIActive = false;

        if (recognizer) {
            recognizer.stopListening();
        }

        zone.classList.remove("active-mic");
        status.innerText = "SENSOR OFF";

        btn.innerText = "ACTIVATE AI SENSOR";
        btn.style.background = "";
        btn.disabled = false;

        setTimeout(() => {
            flag.innerText = "🤖";
        }, 400);

    } catch (e) {
        console.error(e);
    }
}