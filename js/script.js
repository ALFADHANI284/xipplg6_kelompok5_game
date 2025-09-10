/* =========================================
   Frogy Jump — Main Script (cleaned + fixed)
   ========================================= */

// === Elemen DOM ===
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
const restartBtn          = document.getElementById("restart-btn");
const completionModal     = document.getElementById("completion-modal");
const completionTime      = document.getElementById("completion-time");
const restartGameBtn      = document.getElementById("restart-game-btn");
const leaderboardScreen   = document.getElementById("leaderboard");
const leaderboardList     = document.getElementById("leaderboard-list");
const backToMenuBtn       = document.getElementById("back-to-menu");
const toggleThemeBtn      = document.getElementById("toggle-theme-btn");
const settingsBtn         = document.getElementById("settings-btn");
const settingsModal       = document.getElementById("settings-modal");
const saveSettingsBtn     = document.getElementById("save-settings-btn");
const closeSettingsBtn    = document.getElementById("close-settings-btn");
const newUsernameInput    = document.getElementById("new-username");

// Tombol “Kembali” pada modal nama (support 2 kemungkinan id)
const backNameBtn = document.getElementById("Kembali") || document.getElementById("back-to-main-btn");

// 🔊 Suara
const jumpSound   = document.getElementById("jump-sound");
const correctSound= document.getElementById("correct-sound");
const wrongSound  = document.getElementById("wrong-sound");
const scoreSound  = document.getElementById("score-sound");

/* ================== SKIN UTILS (DITAMBAHKAN) ================== */
// Kunci level untuk skin (sudah ada di bawah juga untuk UI locking — biarkan duplikat data ini agar util terisolasi)
const SKIN_KEYS = ['frog-0','frog-1','frog-2','frog-3','frog-4','frog-5','frog-6','frog-7','frog-8'];
const SKIN_UNLOCK_LEVELS = {
  'frog-0': 0,'frog-1': 1,'frog-2': 2,'frog-3': 2,'frog-4': 2,'frog-5': 3,'frog-6': 3,'frog-7': 4,'frog-8': 5
};
// Path gambar skin (ubah jika pakai penamaan tanpa minus)
const SKIN_IMAGE = (key) => `assets/skins/${key}.png`;

// Set tampilan skin pada katak + persist
function setFrogSkin(key) {
  if (!frog) return;
  if (!SKIN_KEYS.includes(key)) key = 'frog-0';
  // pakai inline background agar tidak bergantung CSS eksternal
  frog.style.backgroundImage = `url('${SKIN_IMAGE(key)}')`;
  // tetap pasang class agar kompatibel dengan CSS kamu kalau ada
  frog.className = 'frog';
  frog.classList.add(key);
  try { localStorage.setItem('frog-skin', key); } catch {}
}

// Warnai thumbnail skin di modal
function hydrateSkinThumbnails() {
  document.querySelectorAll('#skin-selector .skin-option').forEach(opt => {
    const skinName = [...opt.classList].find(c => c.startsWith('frog-'));
    if (!skinName) return;
    opt.style.backgroundImage = `url('${SKIN_IMAGE(skinName)}')`;
    opt.style.backgroundSize = 'cover';
    opt.style.backgroundPosition = 'center';
  });
}

// Tandai selected di grid skin
function markSelectedSkinTile(key) {
  document.querySelectorAll('#skin-selector .skin-option').forEach(opt => opt.classList.remove('selected'));
  const tile = document.querySelector(`#skin-selector .skin-option.${key}`);
  if (tile && !tile.classList.contains('skin-locked')) tile.classList.add('selected');
}

// Suntik tombol "Pilih Skin" ke Name Modal (sekali saja)
function ensureInlinePickSkinButton() {
  if (!nameModal) return;
  if (document.getElementById('pick-skin-inline')) return; // sudah ada
  const btn = document.createElement('button');
  btn.id = 'pick-skin-inline';
  btn.type = 'button';
  btn.textContent = '🎨 Pilih Skin';
  btn.style.marginTop = '10px';
  // styling ringan agar konsisten
  btn.style.padding = '12px 25px';
  btn.style.borderRadius = '8px';
  btn.style.border = 'none';
  btn.style.cursor = 'pointer';
  btn.style.fontWeight = 'bold';
  btn.style.background = '#2B3942';
  btn.style.color = '#fff';

  // letakkan sebelum tombol "Kembali" jika ada, kalau tidak letakkan di akhir
  const backBtnInModal = document.getElementById('back-to-main-btn') || document.getElementById('Kembali');
  if (backBtnInModal && backBtnInModal.parentNode === nameModal) {
    nameModal.insertBefore(btn, backBtnInModal);
  } else {
    nameModal.appendChild(btn);
  }

  btn.addEventListener('click', () => {
    const skinModal = document.getElementById('skin-modal');
    if (!skinModal) return;
    hydrateSkinThumbnails();
    updateSkinLocks(currentLevel);          // kunci sesuai level berjalan
    // preselect pakai saved skin
    const saved = localStorage.getItem('frog-skin') || 'frog-0';
    markSelectedSkinTile(saved);
    skinModal.classList.remove('hidden');
  });
}

/* ============================================================= */

// 🌙 Mode Gelap (inisialisasi aman)
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

// Konstanta & probabilitas
const MAX_QUESTION_POPUPS = 8;
const BASE_SPEED  = 7;
const MAX_SPEED   = 12;
const QUESTION_CHANCE = 0.25;
const POWERUP_CHANCE   = 0.08;

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

// ================== Helpers (UI) ==================
const show = (el) => el && el.classList.remove("hidden");
const hide = (el) => el && el.classList.add("hidden");

function openNameModal() {
  show(nameModal);
  hide(mainMenu);
  ensureInlinePickSkinButton();     // << tambahkan tombol pilih skin di modal
  hydrateSkinThumbnails();          // << render thumbnail
  updateSkinLocks(currentLevel);    // << kunci skin sesuai level sekarang
  // preselect skin tersimpan
  markSelectedSkinTile(localStorage.getItem('frog-skin') || 'frog-0');
  setTimeout(() => playerNameInput && playerNameInput.focus(), 0);
}
function closeNameModal() {
  hide(nameModal);
  show(mainMenu);
}

// Tutup modal nama via ESC & klik di luar
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nameModal && !nameModal.classList.contains("hidden")) {
    closeNameModal();
  }
});
document.addEventListener("click", (e) => {
  if (!nameModal || nameModal.classList.contains("hidden")) return;

  const skinModal = document.getElementById("skin-modal");
  const clickInsideName = nameModal.contains(e.target);
  const skinOpen = skinModal && !skinModal.classList.contains("hidden");
  const clickInsideSkin = skinOpen && skinModal.contains(e.target);

  // HANYA tutup kalau klik benar-benar di area luar SEMUA modal
  if (!clickInsideName && !clickInsideSkin) {
    closeNameModal();
  }
});

// ================== Level & Progress ==================
function updateLevelDisplay() {
  const el = document.getElementById("level");
  if (el) el.textContent = `Lv: ${currentLevel} | ${levelProgress}/${levelTarget}`;
}

function completeLevel() {
  gameActive = false;
  clearInterval(rockInterval);
  clearInterval(gameTimer);
  clearInterval(speedIncreaseTimer);

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
    🎉 <strong>Level ${currentLevel - 1} Selesai!</strong><br>
    Skor: ${score}<br>
    Waktu: ${Math.floor((Date.now() - startTime) / 1000)} detik<br>
    <img src="badge${currentLevel - 1}.jpg" alt="Badge Level ${currentLevel - 1}" class="badge-img">
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

// ================== Event Listeners (Menu/Modal) ==================
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

    // Terapkan skin tersimpan sebelum masuk game
    const chosenSkin = localStorage.getItem('frog-skin') || 'frog-0';
    setFrogSkin(chosenSkin);

    hide(nameModal);
    show(gameContainer);
    initGame();
  });
}

// ================== Settings ==================
if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    gameActive = false;
    clearInterval(rockInterval);
    clearInterval(gameTimer);
    clearInterval(speedIncreaseTimer);
    show(settingsModal);
  });
}
if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", () => hide(settingsModal));
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
  });
}

// ================== Timer ==================
function startTimer() {
  startTime = Date.now();
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
      <div class="player-info">
        <span class="name">${entry.name}</span>
        <span class="time">${entry.time}s</span>
        <span class="level-badge">🏆 Lv. ${levelAchieved}</span>
      </div>
    `;
    leaderboardList.appendChild(li);
  });
}

// ================== Kontrol & Fisika ==================
// 👉 Helper: kecilkan hitbox agar tidak “terserempet”
function insetRect(rect, inset = 6) {
  return {
    left: rect.left + inset,
    right: rect.right - inset,
    top: rect.top + inset,
    bottom: rect.bottom - inset
  };
}

function jump() {
  if (isJumping || !gameActive) return;
  isJumping = true;

  // Sound
  if (jumpSound) { jumpSound.currentTime = 0; jumpSound.play().catch(()=>{}); }

  // Visual: miring sedikit (tanpa translateY agar collider stabil)
  frog.style.transform = "rotate(12deg)";

  // Fisika lompat (Y murni dari bottom)
  let vUp = 16;              // sedikit lebih tinggi dari sebelumnya
  const g = gravity;         // 0.9
  position = Math.max(position, 80);

  const jumpInterval = setInterval(() => {
    position += vUp;
    vUp -= g;
    if (position < 80) position = 80;
    frog.style.bottom = position + "px";

    // Mendarat
    if (vUp < -16 && position <= 80) {
      clearInterval(jumpInterval);
      isJumping = false;
      frog.style.transform = ""; // reset tilt
      position = 80;
      frog.style.bottom = "80px";
    }
  }, 16); // lebih halus
}

// Hanya lompat jika tidak ada modal apa pun yang sedang terbuka
function anyModalOpen() {
  const modals = [nameModal, questionBox, completionModal, gameOverScreen, settingsModal, leaderboardScreen];
  return modals.some(m => m && !m.classList.contains("hidden"));
}
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && gameActive && !anyModalOpen()) {
    e.preventDefault();
    jump();
  }
});
document.addEventListener("click", (e) => {
  if (gameActive && !anyModalOpen() && e.target !== playerNameInput) {
    const isButton = e.target.closest("button");
    const inUI = e.target.closest("#question-box, #settings-modal, #leaderboard, #name-modal");
    if (!isButton && !inUI) jump();
  }
});

// ================== Object Spawner (Rock / Power-up / Soal) ==================
function createRock() {
  if (!gameActive) return;

  const rock = document.createElement("div");
  rock.classList.add("rock");

  const isQuestionRock = (questionsAnswered < MAX_QUESTION_POPUPS) && (Math.random() < QUESTION_CHANCE);
  const isPowerUp      = (currentLevel >= 2) && (Math.random() < POWERUP_CHANCE);

  if (isPowerUp) {
    const types = ["heart", "time", "shield"];
    const type = types[Math.floor(Math.random() * types.length)];
    rock.classList.add("power-up", type);
    rock.dataset.type = "powerup";
    rock.dataset.power = type;
  } else if (isQuestionRock) {
    rock.classList.add("question-rock");
    rock.dataset.type = "question";
  } else {
    rock.dataset.type = "normal";
  }

  rock.style.left = "1000px";
  rock.dataset.scored = "false";
  gameContainer.appendChild(rock);

  let rockPosition = 1000;
  const moveRock = setInterval(() => {
    // pause gerak saat soal tampil
    if (!gameActive || (questionBox && !questionBox.classList.contains("hidden"))) return;

    rockPosition -= leafSpeed;
    rock.style.left = rockPosition + "px";

    // Deteksi tabrakan (pakai hitbox yang di-inset + toleransi vertikal)
    const f = insetRect(frog.getBoundingClientRect(), 6);
    const r = insetRect(rock.getBoundingClientRect(), 4);

    const overlapped = !(f.right < r.left || f.left > r.right || f.bottom < r.top || f.top > r.bottom);
    const frogIsAboveRock = f.bottom <= r.top + 6; // kalau sudah jelas di atas, jangan hitung tabrakan

    if (overlapped && !frogIsAboveRock) {
      if (rock.dataset.type === "powerup") {
        activatePowerUp(rock.dataset.power);
      } else if (rock.dataset.type === "question") {
        showQuestion();
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

    // Skor +5 saat lewati batu normal
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
    startTime -= 10000; // +10 detik
    popup.textContent = "+10s ⏱️";
    gameContainer.appendChild(popup);
  } else if (type === "shield") {
    frog.classList.add("shielded"); // tahan 1 tabrakan
    popup.textContent = "🛡️ Shield Aktif!";
    gameContainer.appendChild(popup);
    setTimeout(() => { frog.classList.remove("shielded"); }, 15000); // 15 detik
  }
}

// ================== Soal ==================
function showQuestion() {
  show(questionBox);
  const q = questions[Math.floor(Math.random() * questions.length)];
  questionText.textContent = q.q;
  optionsDiv.innerHTML = "";

  let timeLeft = 15;
  if (questionTimeDisplay) questionTimeDisplay.textContent = timeLeft;

  clearInterval(questionTimer);
  questionTimer = setInterval(() => {
    timeLeft--;
    if (questionTimeDisplay) questionTimeDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      if (wrongSound) { wrongSound.currentTime = 0; wrongSound.play().catch(()=>{}); }
      lives--;
      updateLives();
      hide(questionBox);
    }
  }, 1000);

  q.a.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.addEventListener("click", () => {
      clearInterval(questionTimer);
      questionsAnswered++;
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
    });
    optionsDiv.appendChild(btn);
  });
}

// ================== Game Over ==================
function gameOver() {
  gameActive = false;
  clearInterval(rockInterval);
  clearInterval(gameTimer);
  clearInterval(questionTimer);
  clearInterval(speedIncreaseTimer);
  finalScore.textContent = score;
  finalTime.textContent = Math.floor((Date.now() - startTime) / 1000);
  show(gameOverScreen);
}

// ================== Init / Restart ==================
function initGame() {
  gameActive = true;
  score = 0;
  lives = 5;
  questionsAnswered = 0;
  leafSpeed = BASE_SPEED;

  scoreDisplay.textContent = `Skor: ${score}/100`;
  updateLives();
  timerDisplay.textContent = "Waktu: 0s";

  // bersihkan obstacle
  document.querySelectorAll(".rock").forEach(el => el.remove());
  frog.style.transform = "";
  frog.style.bottom = "80px";
  position = 80;

  // pastikan skin tetap terpasang saat restart level
  setFrogSkin(localStorage.getItem('frog-skin') || 'frog-0');

  startTimer();

  clearInterval(rockInterval);
  rockInterval = setInterval(createRock, 3000);

  clearInterval(speedIncreaseTimer);
  speedIncreaseTimer = setInterval(() => {
    if (gameActive && leafSpeed < MAX_SPEED) {
      leafSpeed += 0.5;
    }
  }, 20000);

  levelProgress = 0;
  updateLevelDisplay();
}

if (restartGameBtn) {
  restartGameBtn.addEventListener("click", () => {
    hide(completionModal);
    initGame();
  });
}
if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    hide(gameOverScreen);
    initGame();
  });
}

// ================== Skin Locks & Modal Skin ==================
const skinUnlockLevels = {
  'frog-0': 0,
  'frog-1': 1,
  'frog-2': 2,
  'frog-3': 2,
  'frog-4': 2,
  'frog-5': 3,
  'frog-6': 3,
  'frog-7': 4,
  'frog-8': 5
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

document.addEventListener('DOMContentLoaded', () => {
  const savedLevel   = parseInt(localStorage.getItem('currentLevel')) || 1;
  const chooseSkinBtn= document.getElementById('choose-skin-btn');
  const skinModal    = document.getElementById('skin-modal');
  const saveSkinBtn  = document.getElementById('save-skin-btn');
  const closeSkinBtn = document.getElementById('close-skin-btn');

  // Apply skin tersimpan
  const savedSkin = localStorage.getItem('frog-skin') || 'frog-0';
  if (frog) {
    setFrogSkin(savedSkin); // pakai util agar inline bg terpasang
  }

  // Kunci skin sesuai level tersimpan
  updateSkinLocks(savedLevel);
  hydrateSkinThumbnails();
  markSelectedSkinTile(savedSkin);

  // Modal Skin
  chooseSkinBtn?.addEventListener('click', () => {
    hydrateSkinThumbnails();
    updateSkinLocks(currentLevel);
    markSelectedSkinTile(localStorage.getItem('frog-skin') || 'frog-0');
    skinModal?.classList.remove('hidden');
  });
  closeSkinBtn?.addEventListener('click', () => skinModal?.classList.add('hidden'));
  window.addEventListener('click', (e) => {
    if (e.target === skinModal) skinModal?.classList.add('hidden');
  });

  // Simpan skin
  saveSkinBtn?.addEventListener('click', () => {
    const selected = document.querySelector('.skin-option.selected');
    if (!selected) return;

    const classes = selected.className.split(' ');
    const skinName = classes.find(cls => cls.startsWith('frog-'));
    if (!skinName) return;

    setFrogSkin(skinName);
    skinModal?.classList.add('hidden');
  });

  // ✅ Fallback pemasangan listener Start jika script dimuat sebelum tombol ada
  if (!startBtn) {
    const sb = document.getElementById('start-btn');
    sb?.addEventListener('click', openNameModal);
  }

  // Pastikan tombol pilih skin muncul di Name Modal juga
  ensureInlinePickSkinButton();
});

// ✅ Delegasi klik global sebagai lapisan terakhir (jaga-jaga)
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'start-btn') {
    openNameModal();
  }
});
