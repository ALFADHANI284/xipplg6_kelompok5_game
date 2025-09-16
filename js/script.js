// === Elemen DOM ===
const bgm = document.getElementById('bgm');
const mainMenu            = document.getElementById("main-menu");
const nameModal           = document.getElementById("name-modal");
const playerNameInput     = document.getElementById("player-name-input");
const startGameBtn        = document.getElementById("start-game-btn");
const gameContainer       = document.getElementById("game-container");
const startBtn            = document.getElementById("start-btn");
const viewLeaderboardBtn  = document.getElementById("view-leaderboard-btn");
const backBtn             = document.getElementById("back-btn");
const frog                = document.getElementById("frog");
const scoreDisplay        = document.getElementById("score");
const timerDisplay        = document.getElementById("timer");
const livesDisplay        = document.getElementById("lives");
const questionBox         = document.getElementById("question-box");
const questionText        = document.getElementById("question-text");
const optionsDiv          = document.getElementById("options");
const questionTimeDisplay = document.getElementById("question-time");
const gameOverScreen      = document.getElementById("game-over");
const finalScore          = document.getElementById("final-score");
const finalTime           = document.getElementById("final-time");
const restartGameBtn      = document.getElementById("restart-game-btn");
const completionModal     = document.getElementById("completion-modal");
const completionTime      = document.getElementById("completion-time");
const restartBtn          = document.getElementById("restart-btn");
const leaderboardScreen   = document.getElementById("leaderboard");
const leaderboardList     = document.getElementById("leaderboard-list");
const backToMenuBtn       = document.getElementById("back-to-menu");
const toggleThemeBtn      = document.getElementById("toggle-theme-btn");
const settingsBtn         = document.getElementById("settings-btn");
const settingsModal       = document.getElementById("settings-modal");
const saveSettingsBtn     = document.getElementById("save-settings-btn");
const closeSettingsBtn    = document.getElementById("close-settings-btn");
const newUsernameInput    = document.getElementById("new-username");
const resetProgressBtn    = document.getElementById("reset-progress-btn");
const resetLeaderboardBtn = document.getElementById("reset-leaderboard-btn");

const MAX_SPEED = 15;
const POWERUP_CHANCE = 0.20;
// Tombol “Kembali” pada modal nama
const backNameBtn = document.getElementById("Kembali") || document.getElementById("back-to-main-btn");

// 🔊 Suara
const jumpSound   = document.getElementById("jump-sound");
const correctSound= document.getElementById("correct-sound");
const wrongSound  = document.getElementById("wrong-sound");
const scoreSound  = document.getElementById("score-sound");

// KUMPULKAN SFX & FLAG BGM (untuk pause/resume audio)
const SFX_AUDIOS = [jumpSound, correctSound, wrongSound, scoreSound].filter(Boolean);
let wasBgmPlayingBeforePause = false;

// 🟩 TRIGGER KOTAK SOAL
const questionTrigger = document.getElementById("question-trigger");

/* ================== SKIN UTILS ================== */
const SKIN_KEYS = ['frog-0','frog-1','frog-2','frog-3','frog-4','frog-5','frog-6','frog-7','frog-8'];
const SKIN_IMAGE = (key) => `/assets/skins/${key}.png`;

function setFrogSkin(key) {
  if (!frog) return;
  if (!SKIN_KEYS.includes(key)) key = 'frog-0';
  frog.style.backgroundImage = `url('${SKIN_IMAGE(key)}')`;
  frog.className = 'frog';
  frog.classList.add(key);
  try { localStorage.setItem('frog-skin', key); } catch {}
}

function hydrateSkinThumbnails() {
  document.querySelectorAll('#skin-selector .skin-option').forEach(opt => {
    const skinName = [...opt.classList].find(c => c.startsWith('frog-'));
    if (!skinName) return;
    opt.style.backgroundImage = `url('${SKIN_IMAGE(skinName)}')`;
    opt.style.backgroundSize = 'cover';
    opt.style.backgroundPosition = 'center';
  });
}

function markSelectedSkinTile(key) {
  document.querySelectorAll('#skin-selector .skin-option').forEach(opt => opt.classList.remove('selected'));
  const tile = document.querySelector(`#skin-selector .skin-option.${key}`);
  if (tile && !tile.classList.contains('skin-locked')) tile.classList.add('selected');
}

function ensureInlinePickSkinButton() {
  if (!nameModal) return;
  if (document.getElementById('pick-skin-inline')) return;

  const btn = document.createElement('button');
  btn.id = 'pick-skin-inline';
  btn.type = 'button';
  btn.textContent = '🎨 Pilih Skin';
  btn.classList.add('btn-skin-inline'); // ✅ styling lewat CSS

  const backBtnInModal = document.getElementById('back-to-main-btn');
  if (backBtnInModal && backBtnInModal.parentNode === nameModal) {
    nameModal.insertBefore(btn, backBtnInModal);
  } else {
    nameModal.appendChild(btn);
  }

  btn.addEventListener('click', () => {
    const skinModal = document.getElementById('skin-modal');
    if (!skinModal) return;
    hydrateSkinThumbnails();
    updateSkinLocks(currentLevel);
    const saved = localStorage.getItem('frog-skin') || 'frog-0';
    markSelectedSkinTile(saved);
    skinModal.classList.remove('hidden');
  });
}

/* ============================================================= */

// 🌙 Mode Gelap
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  if (toggleThemeBtn) toggleThemeBtn.textContent = "☀️ MODE TERANG";
}
if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    toggleThemeBtn.textContent = isDark ? "☀️ MODE TERANG" : "🌙 MODE GELAP";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

// ================== Game State ==================
let isJumping = false;
let score = 0;
let lives = 5;
let gravity = 0.9;
let position = 80;
let rockInterval;
let gameActive = false;
let startTime;
let gameTimer;
let questionTimer;
let currentPlayerName = "";
let speedIncreaseTimer;
let leafSpeed = 7;

let currentLevel = 1;
let levelTarget = 100;
let levelProgress = 0;
let questionsAnswered = 0;

// Jumlah kotak soal per level
const QUESTIONS_PER_LEVEL = {
  1: 5, 2: 4, 3: 3, 4: 2, 5: 1
};

// Kecepatan multiplier per level
const SPEED_MULTIPLIER = {
  1: 1, 2: 2, 3: 3, 4: 3.5, 5: 4
};

// 📚 Soal
const questions = [
  { q: "Berapa hasil dari 5 × 6?", a: ["30", "25", "35"], correct: 0 },
  { q: "Ibu kota Indonesia?", a: ["Bandung", "Jakarta", "Surabaya"], correct: 1 },
  { q: "Hewan yang hidup di darat & air?", a: ["Ikan", "Katak", "Ular"], correct: 1 },
  { q: "1 jam = ? menit", a: ["30", "60", "90"], correct: 1 },
  { q: "Warna daun?", a: ["Merah", "Hijau", "Kuning"], correct: 1 },
  { q: "Matahari terbit dari arah?", a: ["Barat", "Timur", "Selatan"], correct: 1 },
  { q: "Apa lawan kata 'panas'?", a: ["Dingin", "Hangat", "Lembab"], correct: 0 },
  { q: "10 dikurangi 3 sama dengan?", a: ["6", "7", "8"], correct: 1 },
  { q: "Hewan yang bisa melompat tinggi?", a: ["Katak", "Sapi", "Kura-kura"], correct: 0 },
  { q: "Berapa kaki yang dimiliki katak?", a: ["2", "4", "6"], correct: 1 }
];

// ================== Helpers ==================
const show = (el) => el && el.classList.remove("hidden");
const hide = (el) => el && el.classList.add("hidden");

function openNameModal() {
  show(nameModal);
  hide(mainMenu);
  ensureInlinePickSkinButton();
  hydrateSkinThumbnails();
  updateSkinLocks(currentLevel);
  markSelectedSkinTile(localStorage.getItem('frog-skin') || 'frog-0');
  setTimeout(() => playerNameInput && playerNameInput.focus(), 0);
}
function closeNameModal() {
  hide(nameModal);
  show(mainMenu);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nameModal && !nameModal.classList.contains("hidden")) {
    closeNameModal();
  }
});

// ================== Level & Progress ==================
function updateLevelDisplay() {
  const el = document.getElementById("level");
  if (el) el.textContent = `Lv: ${currentLevel}`;
}

function completeLevel() {
  gameActive = false;
  clearInterval(rockInterval);
  clearInterval(gameTimer);
  clearInterval(speedIncreaseTimer);

  const totalTime = Math.floor((Date.now() - startTime) / 1000);

  // ✅ Simpan ke leaderboard
  saveToLeaderboard(currentPlayerName, totalTime);

  currentLevel++;

  const progressData = {
    name: currentPlayerName,
    currentLevel,
    score,
    completedAt: new Date().toLocaleDateString()
  };
  try {
    localStorage.setItem(`progress_${currentPlayerName}`, JSON.stringify(progressData));
    localStorage.setItem("currentLevel", currentLevel);
  } catch {}

  updateSkinLocks(currentLevel);

  completionTime.innerHTML = `
     <strong>Level ${currentLevel - 1} Selesai!</strong><br>
    Skor: ${score}<br>
    Waktu: ${totalTime} detik<br>
    <img src="/assets/badges/badge${currentLevel - 1}.png" 
         alt="Badge Level ${currentLevel - 1}" class="badge-img">
  `;
  show(completionModal);
  restartGameBtn.textContent = "➡️ Lanjut ke Level Berikutnya";

  frog.classList.add("win");

  if (typeof confetti === "function") {
    confetti({
      particleCount: 150,
      spread: 180,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#4CAF50", "#2196F3", "#F44336"]
    });
  }

  restartGameBtn.onclick = () => {
    hide(completionModal);
    frog.classList.remove("win");
    levelTarget += 100;
    levelProgress = 0;
    initGame();
  };
}

// ✅ tombol kembali ke menu saat selesai level
const completionBackBtn = document.getElementById('completion-back-btn');
if (completionBackBtn) {
  completionBackBtn.addEventListener('click', () => {
    // matikan game sepenuhnya
    gameActive = false;
    clearInterval(rockInterval);
    clearInterval(gameTimer);
    clearInterval(questionTimer);
    clearInterval(speedIncreaseTimer);

    // bereskan UI
    hide(completionModal);
    hide(gameContainer);
    show(mainMenu);
  });
}

// ================== Event Listeners ==================
if (startBtn) startBtn.addEventListener("click", openNameModal);
if (backNameBtn) backNameBtn.addEventListener("click", closeNameModal);

if (viewLeaderboardBtn) {
  viewLeaderboardBtn.addEventListener("click", () => {
    hide(mainMenu);
    showLeaderboard();
    show(leaderboardScreen);
  });
}
if (backToMenuBtn) {
  backToMenuBtn.addEventListener("click", () => {
    hide(leaderboardScreen);
    show(mainMenu);
  });
}
if (backBtn) {
  backBtn.addEventListener("click", () => {
    if (confirm("Yakin ingin kembali ke menu?")) {
      gameActive = false;
      clearInterval(rockInterval);
      clearInterval(gameTimer);
      clearInterval(questionTimer);
      clearInterval(speedIncreaseTimer);
      show(mainMenu);
      hide(gameContainer);
    }
  });
}

if (startGameBtn) {
  startGameBtn.addEventListener("click", () => {
    const name = (playerNameInput?.value || "").trim();
    if (!name) {
      alert("Masukkan nama Anda!");
      playerNameInput?.focus();
      return;
    }
    currentPlayerName = name;
    try { localStorage.setItem("frog_player_name", name); } catch {}

    const chosenSkin = localStorage.getItem('frog-skin') || 'frog-0';
    setFrogSkin(chosenSkin);

    hide(nameModal);
    show(gameContainer);
    initGame();
  });
}

/* ============ Settings (pause + no scroll body saat open) ============ */
function lockBodyScroll(lock) {
  const val = lock ? 'hidden' : '';
  document.documentElement.style.overflow = val;
  document.body.style.overflow = val;
}

if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    pauseGame();
    lockBodyScroll(true);     // 🚫 stop scroll halaman saat settings terbuka
    show(settingsModal);
  });
}
if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener("click", () => {
    hide(settingsModal);
    lockBodyScroll(false);
    resumeGame();             // ✅ lanjutkan game normal
  });
}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", () => {
    const newName = (newUsernameInput?.value || "").trim();
    if (newName) {
      currentPlayerName = newName;
      try { localStorage.setItem("frog_player_name", newName); } catch {}
      alert("Nama berhasil diganti menjadi: " + newName);
      newUsernameInput.value = "";
    }
    hide(settingsModal);
    lockBodyScroll(false);
    resumeGame();             // ✅ lanjut jalan, tidak reset apa-apa
  });
}

// ✅ Reset Progress (pemain aktif)
if (resetProgressBtn) {
  resetProgressBtn.addEventListener('click', () => {
    if (!confirm('Yakin reset progress? Ini akan mengembalikan Level ke 1 dan menghapus progress pemain saat ini.')) return;

    try {
      if (currentPlayerName) localStorage.removeItem(`progress_${currentPlayerName}`);
      localStorage.removeItem('currentLevel');
    } catch {}

    // reset state runtime
    currentLevel = 1;
    levelTarget = 100;
    levelProgress = 0;
    updateSkinLocks(currentLevel);
    updateLevelDisplay();

    alert('Progress sudah direset. Mulai dari Level 1.');
  });
}

// ✅ Bersihkan Leaderboard (semua pemain)
if (resetLeaderboardBtn) {
  resetLeaderboardBtn.addEventListener('click', () => {
    if (!confirm('Yakin bersihkan leaderboard untuk semua pemain?')) return;
    try { localStorage.removeItem('leaderboard'); } catch {}
    if (leaderboardList) {
      leaderboardList.innerHTML = '<li class="empty">Belum ada pemain</li>';
    }
    alert('Leaderboard berhasil dibersihkan.');
  });
}

// ================== Timer ==================
function startTimer(keepOffset = false) {
  if (!keepOffset) startTime = Date.now();
  clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timerDisplay.textContent = `Waktu: ${elapsed}s`;
  }, 1000);
}
function stopTimer() {
  clearInterval(gameTimer);
}

// ================== Lives & Leaderboard ==================
function updateLives() {
  livesDisplay.textContent = "❤️".repeat(lives);
  if (lives <= 0) gameOver();
}
function saveToLeaderboard(name, time) {
  let leaderboard = [];
  try { leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || []; } catch {}
  leaderboard.push({ name, time, date: new Date().toLocaleDateString() });
  leaderboard.sort((a, b) => a.time - b.time);
  try { localStorage.setItem("leaderboard", JSON.stringify(leaderboard.slice(0, 10))); } catch {}
}
function showLeaderboard() {
  let leaderboard = [];
  try { leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || []; } catch {}
  leaderboardList.innerHTML = "";

  if (leaderboard.length === 0) {
    leaderboardList.innerHTML = '<li class="empty">Belum ada pemain</li>';
    return;
  }

  leaderboard.forEach((entry, index) => {
    let playerData = {};
    try { playerData = JSON.parse(localStorage.getItem(`progress_${entry.name}`)) || {}; } catch {}
    const levelAchieved = playerData.currentLevel || 1;

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank">#${index + 1}</span>
      <span class="name">${entry.name}</span>
      <span class="time">${entry.time}s</span>
      <span class="level-badge">🏆 Lv. ${levelAchieved}</span>
    `;
    leaderboardList.appendChild(li);
  });
}

// ================== Kontrol & Fisika ==================
function insetRect(rect, inset = 6) {
  return {
    left: rect.left + inset,
    right: rect.right - inset,
    top: rect.top + inset,
    bottom: rect.bottom - inset
  };
}

function jump() {
  if (isJumping || !gameActive || isPaused) return; // ⬅️ hormati pause
  isJumping = true;
  if (jumpSound) { jumpSound.currentTime = 0; jumpSound.play().catch(()=>{}); }
  frog.style.transform = "rotate(12deg)";
  let vUp = 16;
  const g = gravity;
  position = Math.max(position, 80);

  const jumpInterval = setInterval(() => {
    if (!gameActive || isPaused) { // ⬅️ stop animasi saat pause/gameoff
      clearInterval(jumpInterval);
      isJumping = false;
      return;
    }
    position += vUp;
    vUp -= g;
    if (position < 80) position = 80;
    frog.style.bottom = position + "px";

    if (vUp < -16 && position <= 80) {
      clearInterval(jumpInterval);
      isJumping = false;
      frog.style.transform = "";
      position = 80;
      frog.style.bottom = "80px";
    }
  }, 16);
}

function anyModalOpen() {
  const modals = [nameModal, questionBox, completionModal, gameOverScreen, settingsModal, leaderboardScreen];
  return modals.some(m => m && !m.classList.contains("hidden"));
}
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && gameActive && !isPaused && !anyModalOpen()) {
    e.preventDefault();
    jump();
  }
});
document.addEventListener("click", (e) => {
  if (gameActive && !isPaused && !anyModalOpen() && e.target !== playerNameInput) {
    const isButton = e.target.closest("button");
    const inUI = e.target.closest("#question-box, #settings-modal, #leaderboard, #name-modal");
    if (!isButton && !inUI) jump();
  }
});

// ================== BATU (Rintangan Saja) ==================
function createRock() {
  if (!gameActive) return;

  const rock = document.createElement("div");
  rock.classList.add("rock");

  rock.style.backgroundImage = "url('/assets/batu.png')";
  rock.style.backgroundSize = "cover";
  rock.style.backgroundRepeat = "no-repeat";

  const isPowerUp = (currentLevel >= 2) && (Math.random() < POWERUP_CHANCE);

  if (isPowerUp) {
    const types = ["heart", "time", "shield"];
    const type = types[Math.floor(Math.random() * types.length)];
    rock.classList.add("power-up", type);
    rock.dataset.type = "powerup";
    rock.dataset.power = type;
  } else {
    rock.dataset.type = "normal";
  }

  rock.style.left = "1000px";
  rock.dataset.scored = "false";
  gameContainer.appendChild(rock);

  let rockPosition = 1000;
  const moveRock = setInterval(() => {
    // ⬇️ freeze saat pause ATAU ada modal
    if (!gameActive) { clearInterval(moveRock); if (rock.parentNode) gameContainer.removeChild(rock); return; }
    if (isPaused || anyModalOpen()) return;

    if (questionBox && !questionBox.classList.contains("hidden")) return;

    rockPosition -= leafSpeed;
    rock.style.left = rockPosition + "px";

    const f = insetRect(frog.getBoundingClientRect(), 6);
    const r = insetRect(rock.getBoundingClientRect(), 4);
    const overlapped = !(f.right < r.left || f.left > r.right || f.bottom < r.top || f.top > r.bottom);
    const frogIsAboveRock = f.bottom <= r.top + 6;

    if (overlapped && !frogIsAboveRock) {
      if (rock.dataset.type === "powerup") {
        activatePowerUp(rock.dataset.power);
      } else {
        if (frog.classList.contains("shielded")) {
          frog.classList.remove("shielded");
        } else {
          lives--;
          updateLives();
          if (wrongSound) { wrongSound.currentTime = 0; wrongSound.play().catch(()=>{}); }
        }
      }
      clearInterval(moveRock);
      if (rock.parentNode) gameContainer.removeChild(rock);
      return;
    }

    if (rock.dataset.type === "normal" && rockPosition < 30 && rock.dataset.scored === "false") {
      rock.dataset.scored = "true";
      score += 5;
      levelProgress += 5;
      scoreDisplay.textContent = `Skor: ${score}/100`;
      if (scoreSound) { scoreSound.currentTime = 0; scoreSound.play().catch(()=>{}); }

      const popup = document.createElement("div");
      popup.className = "score-popup";
      popup.textContent = "+5";
      popup.style.left = "80px";
      popup.style.bottom = "120px";
      gameContainer.appendChild(popup);
      setTimeout(() => { if (popup.parentNode) gameContainer.removeChild(popup); }, 1000);

      if (levelProgress >= levelTarget) {
        completeLevel();
      } else {
        updateLevelDisplay();
      }
    }

    if (rockPosition < -100) {
      clearInterval(moveRock);
      if (rock.parentNode) gameContainer.removeChild(rock);
    }
  }, 30);
}

// ================== Power-Up ==================
function activatePowerUp(type) {
  const popup = document.createElement("div");
  Object.assign(popup.style, {
    position: "absolute",
    left: "80px",
    bottom: "120px",
    fontWeight: "bold",
    fontSize: "20px",
    zIndex: "20",
    animation: "float-up 1s ease-out forwards",
    pointerEvents: "none"
  });

  if (type === "heart") {
    if (lives < 5) {
      lives++;
      updateLives();
      popup.textContent = "+1 ❤️";
      gameContainer.appendChild(popup);
    }
  } else if (type === "time") {
    startTime -= 10000;
    popup.textContent = "+10s ⏱️";
    gameContainer.appendChild(popup);
  } else if (type === "shield") {
    frog.classList.add("shielded");
    popup.textContent = "🛡️ Shield Aktif!";
    gameContainer.appendChild(popup);
    setTimeout(() => { frog.classList.remove("shielded"); }, 15000);
  }
}

// ================== TRIGGER KOTAK SOAL (Deteksi Tabrakan) ==================
let spawnedQuestions = 0;

function spawnQuestionTrigger() {
  if (!gameActive) return;

  const maxQuestions = QUESTIONS_PER_LEVEL[currentLevel] || 1;
  if (spawnedQuestions >= maxQuestions) return;

  const trigger = document.getElementById("question-trigger");
  if (!trigger) return;

  trigger.classList.remove("active");
  trigger.style.left = "800px";

  // Muncul acak
  setTimeout(() => {
    if (!gameActive || spawnedQuestions >= maxQuestions) return;

    trigger.classList.add("active");
    spawnedQuestions++;

    let pos = 800;
    const moveInterval = setInterval(() => {
      if (!gameActive) { clearInterval(moveInterval); return; }
      if (isPaused || anyModalOpen()) return; // ⬅️ freeze saat pause/modal
      if (!trigger.classList.contains("active") || questionBox.classList.contains("hidden") === false) {
        clearInterval(moveInterval);
        return;
      }

      pos -= 5;
      trigger.style.left = pos + "px";

      // ✅ DETEKSI TABRAKAN
      const frogRect = frog.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();

      const hit = !(frogRect.right < triggerRect.left ||
                    frogRect.left > triggerRect.right ||
                    frogRect.bottom < triggerRect.top ||
                    frogRect.top > triggerRect.bottom);

      if (hit && pos < 300) {
        clearInterval(moveInterval);
        trigger.classList.remove("active");
        trigger.style.left = "800px";
        showQuestion(); // Muncul soal
        return;
      }

      if (pos < -60) {
        clearInterval(moveInterval);
        trigger.classList.remove("active");
      }
    }, 30);
  }, Math.random() * 3000 + 5000);
}

// ================== Soal ==================
function showQuestion() {
  show(questionBox);
  const q = questions[Math.floor(Math.random() * questions.length)];
  questionText.textContent = q.q;
  optionsDiv.innerHTML = "";

  let timeLeft = 10;
  if (questionTimeDisplay) questionTimeDisplay.textContent = timeLeft;

  clearInterval(questionTimer);
  questionTimer = setInterval(() => {
    if (isPaused) return; // ⬅️ jangan hitung mundur saat pause
    timeLeft--;
    if (questionTimeDisplay) questionTimeDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      if (wrongSound) { wrongSound.currentTime = 0; wrongSound.play().catch(()=>{}); }
      lives--;
      updateLives();
      hide(questionBox);
      setTimeout(spawnQuestionTrigger, 2000);
    }
  }, 1000);

  q.a.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.addEventListener("click", () => {
      clearInterval(questionTimer);
      if (index === q.correct) {
        score += 10;
        levelProgress += 10;
        scoreDisplay.textContent = `Skor: ${score}/100`;
        if (correctSound) { correctSound.currentTime = 0; correctSound.play().catch(()=>{}); }
        if (levelProgress >= levelTarget) {
          completeLevel();
        } else {
          updateLevelDisplay();
        }
      } else {
        lives--;
        updateLives();
        if (wrongSound) { wrongSound.currentTime = 0; wrongSound.play().catch(()=>{}); }
      }
      hide(questionBox);
      setTimeout(spawnQuestionTrigger, 2000);
    });
    optionsDiv.appendChild(btn);
  });
}

// ================== Game Over ==================
function gameOver() {
  gameActive = false;
  isPaused = false; // pastikan tidak dalam mode pause
  clearInterval(rockInterval);
  clearInterval(gameTimer);
  clearInterval(questionTimer);
  clearInterval(speedIncreaseTimer);

  const totalTime = Math.floor((Date.now() - startTime) / 1000);

  finalScore.textContent = score;
  finalTime.textContent = totalTime;

  // ✅ Simpan hasil ke leaderboard
  saveToLeaderboard(currentPlayerName, totalTime);

  show(gameOverScreen);
}

// ✅ Restart dari GAME OVER
if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    // tutup modal
    hide(gameOverScreen);
    // pastikan area game kelihatan
    show(gameContainer);

    // matikan interval tersisa (jaga-jaga)
    clearInterval(rockInterval);
    clearInterval(gameTimer);
    clearInterval(questionTimer);
    clearInterval(speedIncreaseTimer);

    // reset pause flag
    isPaused = false;

    // mulai ulang level yang sama
    initGame();
  });
}

// ================== Init / Restart ==================
function initGame() {
  gameActive = true;
  isPaused = false;
  score = 0;
  lives = 5;
  questionsAnswered = 0;

  // ✅ pastikan timer soal dari level sebelumnya dimatikan
  clearInterval(questionTimer);

  leafSpeed = 7 * (SPEED_MULTIPLIER[currentLevel] || 1);

  scoreDisplay.textContent = `Skor: ${score}/100`;
  updateLives();
  timerDisplay.textContent = "Waktu: 0s";

  document.querySelectorAll(".rock").forEach(el => el.remove());
  frog.style.transform = "";
  frog.style.bottom = "80px";
  position = 80;

  setFrogSkin(localStorage.getItem('frog-skin') || 'frog-0');

  startTimer(); // fresh start

  clearInterval(rockInterval);
  rockInterval = setInterval(createRock, 3000);

  clearInterval(speedIncreaseTimer);
  speedIncreaseTimer = setInterval(() => {
    if (gameActive && !isPaused && leafSpeed < MAX_SPEED) {
      leafSpeed += 0.5;
    }
  }, 20000);

  spawnedQuestions = 0;
  spawnQuestionTrigger();   // soal akan spawn otomatis (delay acak 5–8 detik)

  levelProgress = 0;
  updateLevelDisplay();

  // mulai BGM kalau ada
  try { bgm?.play?.().catch(()=>{}); } catch {}
}

// ================== Skin Locks ==================
const skinUnlockLevels = {
  'frog-0': 0, 'frog-1': 1, 'frog-2': 2, 'frog-3': 2, 'frog-4': 2,
  'frog-5': 3, 'frog-6': 3, 'frog-7': 4, 'frog-8': 5
};

function handleClick() {
  document.querySelectorAll('.skin-option').forEach(opt => opt.classList.remove('selected'));
  this.classList.add('selected');
}

function updateSkinLocks(currLv = 1) {
  document.querySelectorAll('.skin-option').forEach(option => {
    option.removeEventListener('click', handleClick);
    const classes = option.className.split(' ');
    const skinName = classes.find(cls => cls.startsWith('frog-'));
    if (!skinName) return;
    const unlockLevel = skinUnlockLevels[skinName];
    if (currLv < unlockLevel) {
      option.classList.add('skin-locked');
      option.setAttribute('data-unlock', `Lv. ${unlockLevel}`);
    } else {
      option.classList.remove('skin-locked');
      option.removeAttribute('data-unlock');
      option.addEventListener('click', handleClick);
    }
  });
}

// ✅ Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
  const savedLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
  const skinModal = document.getElementById('skin-modal');
  const saveSkinBtn = document.getElementById('save-skin-btn');
  const closeSkinBtn = document.getElementById('close-skin-btn');

  const savedSkin = localStorage.getItem('frog-skin') || 'frog-0';
  if (frog) setFrogSkin(savedSkin);

  updateSkinLocks(savedLevel);
  hydrateSkinThumbnails();
  markSelectedSkinTile(savedSkin);

  closeSkinBtn?.addEventListener('click', () => {
    skinModal?.classList.add('hidden');
  });

  window.addEventListener('click', (e) => {
    if (e.target === skinModal) skinModal?.classList.add('hidden');
  });

  saveSkinBtn?.addEventListener('click', () => {
    const selected = document.querySelector('.skin-option.selected');
    if (!selected) return;
    const classes = selected.className.split(' ');
    const skinName = classes.find(cls => cls.startsWith('frog-'));
    if (!skinName) return;
    setFrogSkin(skinName);
    skinModal?.classList.add('hidden');
  });

  ensureInlinePickSkinButton();

  // sinkron volume awal
  syncAudioSettings();
});

// ====== Pause/Resume state & utils ======
let isPaused = false;
let pauseStartedAt = 0;

function pauseGame() {
  if (!gameActive || isPaused) return;
  isPaused = true;
  pauseStartedAt = Date.now();

  // ===== PAUSE HUD TIMER
  clearInterval(gameTimer);

  // ===== PAUSE AUDIO
  if (bgm) {
    wasBgmPlayingBeforePause = !bgm.paused;
    try { bgm.pause(); } catch {}
  }
  // Hentikan SFX yang sedang bunyi (tidak perlu di-resume)
  SFX_AUDIOS.forEach(a => { try { if (!a.paused) a.pause(); } catch {} });
}

function resumeGame() {
  if (!isPaused) return;
  isPaused = false;

  // Kompensasi waktu jeda supaya HUD tetap akurat
  if (pauseStartedAt) {
    startTime += Date.now() - pauseStartedAt;
    pauseStartedAt = 0;
  }

  // ===== RESUME HUD TIMER (kalau bukan akhir game)
  if (gameOverScreen.classList.contains("hidden") &&
      completionModal.classList.contains("hidden")) {
    startTimer(true); // lanjut tanpa reset startTime
  }

  // ===== RESUME BGM jika sebelumnya memang sedang main & tidak dimute
  if (bgm && wasBgmPlayingBeforePause && !bgm.muted) {
    try { bgm.play().catch(()=>{}); } catch {}
  }
}

// ====== Audio settings ======
function syncAudioSettings() {
  const master = document.getElementById('volume-master');
  const mute   = document.getElementById('mute-switch');
  const vol = Math.max(0, Math.min(1, (parseInt(master?.value || '60', 10))/100));
  const muted = !!mute?.checked;
  [bgm, jumpSound, correctSound, wrongSound, scoreSound]
    .filter(Boolean)
    .forEach(a => { a.volume = muted ? 0 : vol; a.muted = muted; });
}
document.getElementById('volume-master')?.addEventListener('input', syncAudioSettings);
document.getElementById('mute-switch')?.addEventListener('change', syncAudioSettings);

// ====== Hotkey Pause (P) ======
function togglePause() {
  if (!gameActive) return;
  if (isPaused) { resumeGame(); }
  else { pauseGame(); }
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP' && gameActive && !anyModalOpen()) {
    e.preventDefault();
    togglePause();
  }
});
