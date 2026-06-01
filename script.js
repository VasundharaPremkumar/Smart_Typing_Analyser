/* ═══════════════════════════════════════
   TypeAI — script.js [Fully Enhanced Production Engine]
   ═══════════════════════════════════════ */

(function injectSVGDefs() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  svg.innerHTML = `<defs>
    <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f5ff"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>`;
  document.body.prepend(svg);
})();

/* ── Particle Background Background loop ── */
(function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let particles = [];
  const COUNT = 60;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x = Math.random() * canvas.width;
      this.y = init ? Math.random() * canvas.height : canvas.height + 10;
      this.r = Math.random() * 1.5 + 0.3;
      this.speed = Math.random() * 0.5 + 0.15;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.color = Math.random() < 0.6 ? "#00f5ff" : "#a855f7";
      this.dx = (Math.random() - 0.5) * 0.2;
    }
    update() {
      this.y -= this.speed;
      this.x += this.dx;
      if (this.y < -10) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
    }
  }
  for (let i = 0; i < COUNT; i++) particles.push(new Particle());
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ── Continuous Multiline Sentences Pool ── */
const texts = {
  easy: [
    "Typing is a useful skill for students.",
    "Practice daily to improve typing speed.",
    "Technology makes learning easier.",
    "Coding is fun and builds creative logic.",
    "The quick brown fox jumps over the lazy dog.",
    "Simple choices lead to great outcomes over time."
  ],
  medium: [
    "Artificial Intelligence is transforming modern industries rapidly.",
    "Consistent typing practice improves both speed and accuracy.",
    "Machine learning applications are becoming popular worldwide.",
    "Software engineers build highly scalable and robust software products.",
    "Data analysis provides valuable insights for strategic business actions.",
    "Designing custom web components requires care and thorough debugging solutions."
  ],
  hard: [
    "Advanced typing requires speed, precision, punctuation handling, and strong concentration.",
    "Cloud computing, cybersecurity, and artificial intelligence are essential modern technologies.",
    "Professional developers must write optimized, scalable, and maintainable code efficiently.",
    "Non-technical backgrounds are not a barrier to entering the technology workforce successfully.",
    "Optimizing asynchronous architectural queries minimizes load-time latencies comprehensively.",
    "The structural evaluation of complex deep learning neural architectures poses rigorous computational challenges."
  ]
};

/* ── State Metrics ── */
let timer = 60;
let interval = null;
let startTime = null;
let maxCircumference = 326.7;

// Persistent Session Metric Accumulators
let totalMistakesInSession = 0;
let totalBackspacesInSession = 0;
let completedSentencesCount = 0;
let totalCharactersTypedInSession = 0;
let totalCorrectCharactersTyped = 0;

// Current Single Sentence Tracking Context
let currentSentenceMistakes = 0;

/* ── DOM Elements ── */
const inputText  = document.getElementById("inputText");
const startBtn   = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const timerRing  = document.getElementById("timerRing");
const timerVal   = document.getElementById("timer");

function getDifficulty() {
  const checked = document.querySelector('input[name="difficulty"]:checked');
  return checked ? checked.value : "easy";
}

/* ── Load Next Sentence ── */
function loadSentence() {
  const pool = texts[getDifficulty()];
  // Avoid selecting the exact same text sequentially if possible
  let currentText = document.getElementById("sampleText").innerText;
  let nextText = pool[Math.floor(Math.random() * pool.length)];
  while (nextText === currentText) {
    nextText = pool[Math.floor(Math.random() * pool.length)];
  }
  document.getElementById("sampleText").innerText = nextText;
  
  // Clear only input line text field without dropping accumulated metrics
  inputText.value = "";
  currentSentenceMistakes = 0;
  
  const bar = document.getElementById("progressBar");
  if (bar) bar.style.width = "0%";
  document.getElementById("progressLabel").innerText = "Sentence Progression: 0%";
}

function updateRing(secs) {
  if (timerRing) {
    const offset = maxCircumference * (1 - secs / 60);
    timerRing.style.strokeDashoffset = offset;
  }
  timerVal.innerText = secs;
  if (secs > 30) timerVal.style.color = "#00f5ff";
  else if (secs > 15) timerVal.style.color = "#fbbf24";
  else timerVal.style.color = "#ff3b6b";
}

function animateStat(id, from, to, suffix = "") {
  const el = document.getElementById(id);
  if (!el) return;
  let start = null;
  const dur  = 350;
  function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / dur, 1);
    const v = Math.round(from + (to - from) * p);
    el.innerText = v + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function resetUI() {
  document.getElementById("wpm").innerText       = "0";
  document.getElementById("accuracy").innerText  = "100%";
  document.getElementById("mistakes").innerText  = "0";
  document.getElementById("level").innerText     = "Beginner";
  
  document.getElementById("wpmBar").style.width = "0%";
  document.getElementById("accBar").style.width = "0%";
  document.getElementById("errBar").style.width = "0%";
  document.getElementById("speedFill").style.width = "0%";
  document.getElementById("precFill").style.width = "0%";
  document.getElementById("suggestion").innerText = "Type the sentence loaded above to receive analytics...";
  document.getElementById("liveMetaCounters").innerText = "Live Session Totals: 0 Backspaces | 0 Sentence Shifts";
  
  updateLevelDots(0);
  updateRing(60);
}

/* ── Test Handlers ── */
function startTest() {
  clearInterval(interval);
  timer = 60;
  
  // Reset session accumulators
  totalMistakesInSession = 0;
  totalBackspacesInSession = 0;
  completedSentencesCount = 0;
  totalCharactersTypedInSession = 0;
  totalCorrectCharactersTyped = 0;
  
  updateRing(60);
  resetUI();
  
  inputText.disabled = false;
  loadSentence();
  inputText.focus();

  startTime = new Date();
  interval  = setInterval(updateTimer, 1000);

  startBtn.style.opacity = "0.7";
  startBtn.innerText = "Running...";
}

function restartTest() {
  clearInterval(interval);
  timer = 60;
  totalMistakesInSession = 0;
  totalBackspacesInSession = 0;
  completedSentencesCount = 0;
  totalCharactersTypedInSession = 0;
  totalCorrectCharactersTyped = 0;
  
  inputText.disabled = false;
  loadSentence();
  resetUI();

  startBtn.style.opacity = "1";
  startBtn.innerText = "Start Test";
  inputText.focus();
}

function updateTimer() {
  timer--;
  updateRing(timer);

  if (timer <= 0) {
    clearInterval(interval);
    inputText.disabled = true;
    startBtn.style.opacity = "1";
    startBtn.innerText = "Start Test";
    
    saveHistory();
    setTimeout(() => showToast("⏰ Time Out! Your analytics session performance data was tracked."), 200);
  }
}

/* ── Keystroke Event Intercepts (Accurate Global Backspace Counting) ── */
inputText.addEventListener("keydown", (e) => {
  if (timer <= 0) return;
  if (e.key === "Backspace") {
    totalBackspacesInSession++;
    document.getElementById("liveMetaCounters").innerText = `Live Session Totals: ${totalBackspacesInSession} Backspaces | ${completedSentencesCount} Sentence Shifts`;
  }
});

/* ── Typing Metric Matrix Processing ── */
inputText.addEventListener("input", () => {
  if (!startTime || timer <= 0) return;

  const sampleText = document.getElementById("sampleText").innerText;
  const typedText  = inputText.value;

  // Single sentence matching logic
  let correctInSentence = 0;
  let mistakesInSentence = 0;

  for (let i = 0; i < typedText.length; i++) {
    if (i < sampleText.length) {
      if (typedText[i] === sampleText[i]) {
        correctInSentence++;
      } else {
        mistakesInSentence++;
      }
    }
  }

  // Dynamic sentence shifting mechanic
  // Triggers once typed input length accurately matches the validation target length
  if (typedText.length >= sampleText.length) {
    // Commit the current baseline metrics to the global session aggregates
    totalCharactersTypedInSession += typedText.length;
    totalCorrectCharactersTyped += correctInSentence;
    totalMistakesInSession += mistakesInSentence;
    completedSentencesCount++;
    
    document.getElementById("liveMetaCounters").innerText = `Live Session Totals: ${totalBackspacesInSession} Backspaces | ${completedSentencesCount} Sentence Shifts`;
    
    // Load next block instantly before expiration
    loadSentence();
    return;
  }

  /* Calculate Global Session Aggregates dynamically */
  const liveTotalCharacters = totalCharactersTypedInSession + typedText.length;
  const liveTotalCorrect = totalCorrectCharactersTyped + correctInSentence;
  const liveTotalMistakes = totalMistakesInSession + mistakesInSentence;

  // WPM Formula based on standard word length definitions (5 characters = 1 word)
  const elapsedMinutes = Math.max((new Date() - startTime) / 1000 / 60, 0.01);
  let wpm = Math.round((liveTotalCharacters / 5) / elapsedMinutes);
  if (!isFinite(wpm) || wpm < 0) wpm = 0;

  // Overall session accuracy across sentences
  let accuracy = liveTotalCharacters ? Math.round((liveTotalCorrect / liveTotalCharacters) * 100) : 100;
  if (accuracy < 0) accuracy = 0;
  if (accuracy > 100) accuracy = 100;

  /* Real-time Dashboard Cards Updates */
  document.getElementById("wpm").innerText = wpm;
  document.getElementById("accuracy").innerText = accuracy + "%";
  document.getElementById("mistakes").innerText = liveTotalMistakes;

  // Progress UI fills
  document.getElementById("wpmBar").style.width = Math.min(wpm / 1.2, 100) + "%";
  document.getElementById("accBar").style.width = accuracy + "%";
  document.getElementById("errBar").style.width = Math.min(liveTotalMistakes * 4, 100) + "%";

  // Individual sentence sub-bar calculation
  const currentPct = Math.min((typedText.length / sampleText.length) * 100, 100);
  const progressBar = document.getElementById("progressBar");
  if (progressBar) progressBar.style.width = currentPct + "%";
  document.getElementById("progressLabel").innerText = `Sentence Progression: ${Math.round(currentPct)}%`;

  // UI suggestions indexes
  document.getElementById("speedFill").style.width = Math.min(wpm / 1.2, 100) + "%";
  document.getElementById("precFill").style.width = accuracy + "%";

  let msg = "Keep steady rhythm. Practice continuously to construct muscle pattern accuracy.";
  if (accuracy >= 92 && wpm >= 60) msg = "🚀 Professional level execution! Maintain this pacing cadence.";
  else if (accuracy < 85) msg = "🎯 Focus on structural accuracy. Minimize backspacing behavior intentionally.";
  document.getElementById("suggestion").innerText = msg;

  // Trigger Backend Random Forest Predictive API evaluations on key check intervals
  if (liveTotalCharacters > 10 && liveTotalCharacters % 15 === 0) {
    predictLevel(wpm, accuracy, liveTotalMistakes, totalBackspacesInSession);
  }
});

async function predictLevel(wpm, accuracy, mistakes, backspaces) {
  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wpm, accuracy, mistakes, backspaces })
    });
    const data = await res.json();
    if (data.level) {
      document.getElementById("level").innerText = data.level;
      let idx = 0;
      if (data.level === "Intermediate") idx = 1;
      else if (data.level === "Advanced") idx = 2;
      else if (data.level === "Professional") idx = 3;
      updateLevelDots(idx);
    }
  } catch (e) {
    console.error("ML evaluation parse issue:", e);
  }
}

function updateLevelDots(idx) {
  document.querySelectorAll(".ldot").forEach((d, i) => {
    d.classList.toggle("active", i <= idx);
  });
}

/* ── Save Aggregated Stats to Database ── */
async function saveHistory() {
  const wpm = parseInt(document.getElementById("wpm").innerText) || 0;
  const accuracy = parseInt(document.getElementById("accuracy").innerText) || 0;
  const mistakes = parseInt(document.getElementById("mistakes").innerText) || 0;
  const level = document.getElementById("level").innerText;

  try {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wpm: wpm,
        accuracy: accuracy,
        mistakes: mistakes,
        backspaces: totalBackspacesInSession,
        level: level
      })
    });
    const data = await res.json();
    if (data.success) {
      fetchAndRenderHistory();
    }
  } catch (e) {
    console.error("History transaction tracking connection error:", e);
  }
}

async function fetchAndRenderHistory() {
  try {
    const res = await fetch("/api/history");
    const data = await res.json();
    if (data.success && data.history) {
      renderHistoryList(data.history);
      updateChart(data.history);
    }
  } catch (e) {
    console.error("Failed to map dynamic history payload:", e);
  }
}

function renderHistoryList(history) {
  const container = document.getElementById("historyButtons");
  if (!container) return;
  container.innerHTML = "";

  const count = history.length;
  document.getElementById("histCount").innerText = `${count} attempt${count !== 1 ? 's' : ''}`;

  history.forEach((attempt, i) => {
    const btn = document.createElement("button");
    btn.className = "history-btn";
    btn.innerHTML = `<span>Attempt ${i + 1}</span>
      <small style="display:block;font-size:10px;opacity:0.6;margin-top:2px">
        ${attempt.wpm} WPM · ${attempt.accuracy}% Acc · M: ${attempt.mistakes} · B: ${attempt.backspaces}
      </small>`;

    btn.addEventListener("click", () => {
      animateStat("wpm", 0, attempt.wpm);
      animateStat("accuracy", 0, attempt.accuracy, "%");
      animateStat("mistakes", 0, attempt.mistakes);
      document.getElementById("level").innerText = attempt.level;
    });
    container.appendChild(btn);
  });
}

/* ── Enhanced Dynamic Multi-Axis Analytics Charts Definition ── */
const chartCanvas = document.getElementById("typingChart");
let typingChart = null;

if (chartCanvas) {
  const ctx = chartCanvas.getContext("2d");
  typingChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "WPM Speed",
          data: [],
          borderColor: "#00f5ff",
          backgroundColor: "rgba(0, 245, 255, 0.05)",
          tension: 0.3,
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: "Accuracy (%)",
          data: [],
          borderColor: "#a855f7",
          backgroundColor: "rgba(168, 85, 247, 0.05)",
          tension: 0.3,
          borderWidth: 2,
          yAxisID: 'y1'
        },
        {
          label: "Mistakes",
          data: [],
          borderColor: "#ff3b6b",
          borderDash: [5, 5],
          backgroundColor: "transparent",
          tension: 0.2,
          borderWidth: 1.5,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.02)" }, ticks: { color: "#64748b" } },
        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'WPM', color: '#00f5ff' }, ticks: { color: "#64748b" } },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Accuracy %', color: '#a855f7' }, ticks: { color: "#64748b" } },
        y2: { type: 'linear', display: false, position: 'right', grid: { drawOnChartArea: false } }
      },
      plugins: {
        legend: { labels: { color: "#94a3b8" } }
      }
    }
  });
}

function updateChart(history) {
  if (!typingChart) return;
  const labels = history.map((_, i) => `Test ${i + 1}`);
  const wpms = history.map(h => h.wpm);
  const accs = history.map(h => h.accuracy);
  const errs = history.map(h => h.mistakes);

  typingChart.data.labels = labels;
  typingChart.data.datasets[0].data = wpms;
  typingChart.data.datasets[1].data = accs;
  typingChart.data.datasets[2].data = errs;
  typingChart.update();
}

function showToast(msg) {
  const t = document.createElement("div");
  t.style.cssText = `
    position:fixed; bottom:32px; left:50%; transform:translateX(-50%);
    background:rgba(15,23,42,0.95); border:1px solid rgba(0,245,255,0.2);
    color:#f8fafc; padding:12px 24px; border-radius:12px;
    font-family:'Outfit',sans-serif; font-size:14px; z-index:9999;
    box-shadow:0 12px 30px rgba(0,0,0,0.5); backdrop-filter:blur(10px);
  `;
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

if (startBtn) startBtn.addEventListener("click", startTest);
if (restartBtn) restartBtn.addEventListener("click", restartTest);
document.querySelectorAll('input[name="difficulty"]').forEach(r => {
  r.addEventListener("change", () => { if (!interval || timer <= 0) loadSentence(); });
});

document.addEventListener("DOMContentLoaded", () => {
  loadSentence();
  fetchAndRenderHistory();
});