// === Elemen DOM ===
const mainMenu = document.getElementById("main-menu");
const nameModal = document.getElementById("name-modal");
const playerNameInput = document.getElementById("player-name-input");
const startGameBtn = document.getElementById("start-game-btn");
const gameContainer = document.getElementById("game-container");
const startBtn = document.getElementById("start-btn");
const viewLeaderboardBtn = document.getElementById("view-leaderboard-btn");
const backBtn = document.getElementById("back-btn");
const frog = document.getElementById("frog");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const livesDisplay = document.getElementById("lives");
const questionBox = document.getElementById("question-box");
const questionText = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const questionTimeDisplay = document.getElementById("question-time");
const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");
const finalTime = document.getElementById("final-time");
const restartBtn = document.getElementById("restart-btn");
const completionModal = document.getElementById("completion-modal");
const completionTime = document.getElementById("completion-time");
const restartGameBtn = document.getElementById("restart-game-btn");
const leaderboardScreen = document.getElementById("leaderboard");
const leaderboardList = document.getElementById("leaderboard-list");
const backToMenuBtn = document.getElementById("back-to-menu");
const toggleThemeBtn = document.getElementById("toggle-theme-btn");
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const newUsernameInput = document.getElementById("new-username");

// 🔊 Suara
const jumpSound = document.getElementById("jump-sound");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const scoreSound = document.getElementById("score-sound");

// 🌙 Mode Gelap
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  toggleThemeBtn.textContent = "☀️ MODE TERANG";
}

toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    toggleThemeBtn.textContent = "☀️ MODE TERANG";
    localStorage.setItem("theme", "dark");
  } else {
    toggleThemeBtn.textContent = "🌙 MODE GELAP";
    localStorage.setItem("theme", "light");
  }
});

// 🐸 Variabel Game
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
let levelTarget = 100; // Target skor per level
let levelProgress = 0; // Skor dalam level ini
const MAX_QUESTION_POPUPS = 8;
const BASE_SPEED = 7;
const MAX_SPEED = 12;

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

// 🌟 Update Tampilan Level
function updateLevelDisplay() {
  document.getElementById("level").textContent = `Lv: ${currentLevel} | ${levelProgress}/${levelTarget}`;
}

// 🎉 Selesai Level + Animasi
function completeLevel() {
  gameActive = false;
  clearInterval(rockInterval);
  clearInterval(gameTimer);
  clearInterval(speedIncreaseTimer);

  // Simpan progres pemain
  const progressData = {
    name: currentPlayerName,
    currentLevel: currentLevel,
    score: score,
    completedAt: new Date().toLocaleDateString()
  };
  localStorage.setItem(`progress_${currentPlayerName}`, JSON.stringify(progressData));

  // Tampilkan modal
  completionModal.classList.remove("hidden");
  completionTime.innerHTML = `
    🎉 <strong>Level ${currentLevel} Selesai!</strong><br>
    Skor: ${score}<br>
    Waktu: ${Math.floor((Date.now() - startTime) / 1000)} detik<br>
    <img src="badge${currentLevel}.jpg" alt="Badge Level ${currentLevel}" class="badge-img">
  `;
  restartGameBtn.textContent = "➡️ Lanjut ke Level Berikutnya";

  // 🕺 Animasi Katak Menang!
  frog.classList.add("win");

  // Confetti
  confetti({
    particleCount: 150,
    spread: 180,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#4CAF50', '#2196F3', '#F44336']
  });

  // Tombol lanjut
  restartGameBtn.onclick = () => {
    completionModal.classList.add("hidden");
    // Hapus animasi
    frog.classList.remove("win");
    currentLevel++;
    levelTarget += 100;
    levelProgress = 0;
    initGame();
  };
}

// 🚀 Event Listeners
startBtn.addEventListener("click", () => {
  mainMenu.classList.add("hidden");
  nameModal.classList.remove("hidden");
});

// ⚙️ Settings
if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    gameActive = false;
    clearInterval(rockInterval);
    clearInterval(gameTimer);
    clearInterval(speedIncreaseTimer);
    settingsModal.classList.remove("hidden");
  });
}

if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
    if (!gameOverScreen.classList.contains("hidden") || !completionModal.classList.contains("hidden")) return;
    gameActive = true;
    startTimer();
    rockInterval = setInterval(createRock, 3000);
    speedIncreaseTimer = setInterval(() => {
      if (gameActive && leafSpeed < MAX_SPEED) {
        leafSpeed += 0.5;
      }
    }, 20000);
  });
}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", () => {
    const newName = newUsernameInput.value.trim();
    if (newName) {
      currentPlayerName = newName;
      alert("Nama berhasil diganti menjadi: " + newName);
      newUsernameInput.value = "";
    }

    if (!gameOverScreen.classList.contains("hidden") || !completionModal.classList.contains("hidden")) return;
    gameActive = true;
    startTimer();
    rockInterval = setInterval(createRock, 3000);
    speedIncreaseTimer = setInterval(() => {
      if (gameActive && leafSpeed < MAX_SPEED) {
        leafSpeed += 0.5;
      }
    }, 20000);
  });
}

// 📊 Lihat Leaderboard
viewLeaderboardBtn.addEventListener("click", () => {
  mainMenu.classList.add("hidden");
  showLeaderboard();
  leaderboardScreen.classList.remove("hidden");
});

// 🔙 Kembali dari Leaderboard ke Menu
if (backToMenuBtn) {
  backToMenuBtn.addEventListener("click", () => {
    leaderboardScreen.classList.add("hidden");
    mainMenu.classList.remove("hidden");
  });
}

// 🔙 Kembali dari Game ke Menu
if (backBtn) {
  backBtn.addEventListener("click", () => {
    if (confirm("Yakin ingin kembali ke menu?")) {
      gameActive = false;
      clearInterval(rockInterval);
      clearInterval(gameTimer);
      clearInterval(questionTimer);
      clearInterval(speedIncreaseTimer);
      gameContainer.classList.add("hidden");
      mainMenu.classList.remove("hidden");
    }
  });
}

// 🎮 Mulai Game setelah masukkan nama
startGameBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Masukkan nama Anda!");
    return;
  }
  currentPlayerName = name;
  nameModal.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  initGame();
});

// ⏱️ Timer
function startTimer() {
  startTime = Date.now();
  gameTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timerDisplay.textContent = `Waktu: ${elapsed}s`;
    if (elapsed % 20 === 0 && elapsed > 0 && leafSpeed < MAX_SPEED) {
      increaseSpeed();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(gameTimer);
}

// ❤️ Update Nyawa
function updateLives() {
  livesDisplay.textContent = "❤️".repeat(lives);
  if (lives <= 0) gameOver();
}

// 🏆 Leaderboard
function saveToLeaderboard(name, time) {
  let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
  leaderboard.push({ name, time, date: new Date().toLocaleDateString() });
  leaderboard.sort((a, b) => a.time - b.time);
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard.slice(0, 10)));
}

function showLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
  leaderboardList.innerHTML = '';

  if (leaderboard.length === 0) {
    leaderboardList.innerHTML = '<li class="empty">Belum ada pemain</li>';
    return;
  }

  leaderboard.forEach((entry, index) => {
    const playerData = JSON.parse(localStorage.getItem(`progress_${entry.name}`)) || {};
    const levelAchieved = playerData.currentLevel || 1;

    const li = document.createElement('li');
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

// 🐸 Lompat
function jump() {
  if (isJumping || !gameActive) return;
  isJumping = true;
  frog.classList.add("jump");
  jumpSound.play();

  let upSpeed = 14;
  position = 80;
  const jumpInterval = setInterval(() => {
    position += upSpeed;
    upSpeed -= gravity;
    frog.style.bottom = position + "px";
    if (position <= 80) {
      clearInterval(jumpInterval);
      isJumping = false;
      frog.classList.remove("jump");
      frog.style.bottom = "80px";
      position = 80;
    }
  }, 20);
}

// 🪨 Buat Batu + Power-Up
function createRock() {
  if (!gameActive) return;

  const rock = document.createElement("div");
  rock.classList.add("rock");

  // Tentukan jenis batu
  const isQuestionRock = questionsAnswered < MAX_QUESTION_POPUPS && Math.random() < 0.25;
  const isPowerUp = Math.random() < 0.08 && currentLevel >= 2; // 8% chance, mulai Level 2

  if (isPowerUp) {
    const types = ["heart", "time", "shield"];
    const type = types[Math.floor(Math.random() * types.length)];
    
    rock.classList.add("power-up", type);
    rock.dataset.type = "powerup";
    rock.dataset.power = type;
  } 
  else if (isQuestionRock) {
    rock.classList.add("question-rock");
    rock.dataset.type = "question";
  } 
  else {
    rock.dataset.type = "normal";
  }

  rock.style.left = "1000px";
  rock.dataset.scored = "false";
  gameContainer.appendChild(rock);

  let rockPosition = 1000;
  const moveRock = setInterval(() => {
    if (!gameActive || !questionBox.classList.contains("hidden")) return;

    rockPosition -= leafSpeed;
    rock.style.left = rockPosition + "px";

    // Deteksi tabrakan
    const frogRect = frog.getBoundingClientRect();
    const rockRect = rock.getBoundingClientRect();
    if (
      frogRect.left < rockRect.right &&
      frogRect.right > rockRect.left &&
      frogRect.top < rockRect.bottom &&
      frogRect.bottom > rockRect.top
    ) {
      if (rock.dataset.type === "powerup") {
        activatePowerUp(rock.dataset.power);
      } else if (rock.dataset.type === "question") {
        showQuestion();
      } else {
        lives--;
        updateLives();
        wrongSound.play();
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
      scoreSound.currentTime = 0;
      scoreSound.play();

      const popup = document.createElement("div");
      popup.className = "score-popup";
      popup.textContent = "+5";
      popup.style.left = "80px";
      popup.style.bottom = "120px";
      gameContainer.appendChild(popup);

      setTimeout(() => {
        if (popup.parentNode) gameContainer.removeChild(popup);
      }, 1000);

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

// 🎁 Aktifkan Power-Up
function activatePowerUp(type) {
  const popup = document.createElement("div");
  popup.style.position = "absolute";
  popup.style.left = "80px";
  popup.style.bottom = "120px";
  popup.style.fontWeight = "bold";
  popup.style.fontSize = "20px";
  popup.style.zIndex = "20";
  popup.style.animation = "float-up 1s ease-out forwards";
  popup.style.pointerEvents = "none";

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
    // Tahan 1 tabrakan
    frog.classList.add("shielded");
    popup.textContent = "🛡️ Shield Aktif!";
    gameContainer.appendChild(popup);
    setTimeout(() => {
      if (frog.classList.contains("shielded")) {
        frog.classList.remove("shielded");
      }
    }, 15000); // Shield 15 detik
  }
}

// ❓ Tampilkan Soal
function showQuestion() {
  questionBox.classList.remove("hidden");
  const q = questions[Math.floor(Math.random() * questions.length)];
  questionText.textContent = q.q;
  optionsDiv.innerHTML = "";

  let timeLeft = 15;
  questionTimeDisplay.textContent = timeLeft;
  questionTimer = setInterval(() => {
    timeLeft--;
    questionTimeDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      wrongSound.play();
      lives--;
      updateLives();
      questionBox.classList.add("hidden");
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
        correctSound.play();
        if (levelProgress >= levelTarget) {
          completeLevel();
        } else {
          updateLevelDisplay();
        }
      } else {
        lives--;
        updateLives();
        wrongSound.play();
      }
      questionBox.classList.add("hidden");
    });
    optionsDiv.appendChild(btn);
  });
}

// 🚀 Increase Speed
function increaseSpeed() {
  if (leafSpeed < MAX_SPEED) {
    leafSpeed += 0.5;
  }
}

// 🏁 Selesai (Skor 100)
function completeGame() {
  gameActive = false;
  stopTimer();
  clearInterval(rockInterval);
  clearInterval(speedIncreaseTimer);
  const totalTime = Math.floor((Date.now() - startTime) / 1000);
  completionTime.textContent = `Waktu: ${totalTime} detik`;
  completionModal.classList.remove("hidden");
  saveToLeaderboard(currentPlayerName, totalTime);

  // 🕺 Animasi Katak Menang!
  frog.classList.add("win");

  confetti({
    particleCount: 150,
    spread: 180,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#4CAF50', '#2196F3', '#F44336', '#9C27B0']
  });
}

// 💀 Game Over
function gameOver() {
  gameActive = false;
  clearInterval(rockInterval);
  clearInterval(gameTimer);
  clearInterval(questionTimer);
  clearInterval(speedIncreaseTimer);
  finalScore.textContent = score;
  finalTime.textContent = Math.floor((Date.now() - startTime) / 1000);
  gameOverScreen.classList.remove("hidden");
}

// 🚀 Inisialisasi
function initGame() {
  gameActive = true;
  score = 0;
  lives = 5;
  questionsAnswered = 0;
  leafSpeed = BASE_SPEED;
  scoreDisplay.textContent = `Skor: ${score}/100`;
  updateLives();
  timerDisplay.textContent = "Waktu: 0s";

  document.querySelectorAll(".rock").forEach(el => el.remove());
  frog.classList.remove("jump");
  frog.style.bottom = "80px";
  position = 80;

  startTimer();
  rockInterval = setInterval(createRock, 3000);
  speedIncreaseTimer = setInterval(() => {
    if (gameActive && leafSpeed < MAX_SPEED) {
      leafSpeed += 0.5;
    }
  }, 20000);

  // Reset progress level
  levelProgress = 0;
  updateLevelDisplay();
}

// 🎮 Event Listeners
restartGameBtn.addEventListener("click", () => {
  completionModal.classList.add("hidden");
  initGame();
});

restartBtn.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  initGame();
});

// Kontrol
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && gameActive) {
    e.preventDefault();
    jump();
  }
});

document.addEventListener("click", (e) => {
  if (gameActive && e.target !== playerNameInput) jump();
});

document.addEventListener('DOMContentLoaded', () => {
  // === Elemen DOM ===
  const chooseSkinBtn = document.getElementById('choose-skin-btn');
  const skinModal = document.getElementById('skin-modal');
  const saveSkinBtn = document.getElementById('save-skin-btn');
  const closeSkinBtn = document.getElementById('close-skin-btn');
  const startBtn = document.getElementById('start-btn');
  const mainMenu = document.getElementById('main-menu');
  const nameModal = document.getElementById('name-modal');

  // Event: Buka modal
  chooseSkinBtn?.addEventListener('click', () => {
    skinModal?.classList.remove('hidden');
  });

  // Event: Pilih skin
  document.querySelectorAll('.skin-option').forEach(option => {
    option.addEventListener('click', function () {
      document.querySelectorAll('.skin-option').forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  // Event: Simpan skin
  saveSkinBtn?.addEventListener('click', () => {
    const selectedOption = document.querySelector('.skin-option.selected');
    if (!selectedOption) return;

    // Ambil nama skin dari class
    const classes = selectedOption.className.split(' ');
    const skinName = classes.find(cls => cls.startsWith('frog-')); // hasil: "frog-5"

    if (!skinName) {
      console.error("Skin tidak ditemukan!");
      return;
    }

    // Terapkan ke katak
    const frog = document.getElementById('frog');
    if (frog) {
      frog.className = 'frog';
      frog.classList.add(skinName);
    }

    // Simpan ke localStorage
    localStorage.setItem('frog-skin', skinName);

    skinModal?.classList.add('hidden');
  });

  // Event: Tutup modal
  closeSkinBtn?.addEventListener('click', () => {
    skinModal?.classList.add('hidden');
  });

  // Tutup dengan klik luar
  window.addEventListener('click', (e) => {
    if (e.target === skinModal) {
      skinModal?.classList.add('hidden');
    }
  });

  // Saat klik "Mainkan"
  startBtn.addEventListener("click", () => {
    mainMenu.classList.add("hidden");
    nameModal.classList.remove("hidden");

    // Atur skin saat modal nama muncul
    const savedSkin = localStorage.getItem('frog-skin') || 'frog-0';
    const frog = document.getElementById('frog');
    if (frog) {
      frog.className = 'frog';
      frog.classList.add(savedSkin);
    }
  });

  // Atur skin saat halaman dimuat
  const savedSkin = localStorage.getItem('frog-skin') || 'frog-0';
  const frog = document.getElementById('frog');
  if (frog) {
    frog.className = 'frog';
    frog.classList.add(savedSkin);
  }
});