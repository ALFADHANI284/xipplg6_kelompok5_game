// === Elemen DOM ===
const mainMenu = document.getElementById("main-menu");
const gameContainer = document.getElementById("game-container");
const startBtn = document.getElementById("start-btn");
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
const playerNameInput = document.getElementById("player-name");
const submitNameBtn = document.getElementById("submit-name");
const leaderboardScreen = document.getElementById("leaderboard");
const leaderboardList = document.getElementById("leaderboard-list");
const playAgainBtn = document.getElementById("play-again");

// 🔊 Suara
const jumpSound = document.getElementById("jump-sound");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const scoreSound = document.getElementById("score-sound"); // 🔊 Suara skor

// 🐸 Variabel Game
let isJumping = false;
let score = 0;
let lives = 5;
let gravity = 0.9;
let position = 0;
let rockInterval;
let gameActive = false;
let startTime;
let gameTimer;
let questionTimer;

let questionsAnswered = 0;
const MAX_QUESTION_POPUPS = 8;

// 📚 Soal
const questions = [
  { q: "Berapa hasil dari 5 × 6?", a: ["30", "25", "35"], correct: 0 },
  { q: "Ibu kota Indonesia?", a: ["Bandung", "Jakarta", "Surabaya"], correct: 1 },
  { q: "Hewan yang hidup di darat & air?", a: ["Ikan", "Katak", "Ular"], correct: 1 },
  { q: "1 jam = ? menit", a: ["30", "60", "90"], correct: 1 },
  { q: "Warna daun?", a: ["Merah", "Hijau", "Kuning"], correct: 1 }
];

// 🚀 Start Game
startBtn.addEventListener("click", () => {
  mainMenu.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  initGame();
});

// ⏱️ Timer
function startTimer() {
  startTime = Date.now();
  gameTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timerDisplay.textContent = `Waktu: ${elapsed}s`;
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
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rank">#${index + 1}</span>
      <span class="name">${entry.name}</span>
      <span class="time">${entry.time}s</span>
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

  let upSpeed = 18;
  const jumpInterval = setInterval(() => {
    position += upSpeed;
    upSpeed -= gravity;
    frog.style.bottom = position + "px";

    if (upSpeed < -15) {
      clearInterval(jumpInterval);
      isJumping = false;
      frog.classList.remove("jump");
      position = 0;
      frog.style.bottom = "80px";
    }
  }, 20);
}

// 🪨 Buat Batu
function createRock() {
  if (!gameActive) return;

  const rock = document.createElement("div");
  rock.classList.add("rock");

  const isQuestionRock = questionsAnswered < MAX_QUESTION_POPUPS && Math.random() < 0.25;
  if (isQuestionRock) {
    rock.classList.add("question-rock");
    rock.dataset.type = "question";
  } else {
    rock.dataset.type = "normal";
  }

  rock.style.left = "1000px";
  rock.dataset.scored = "false"; // Cegah double skor
  gameContainer.appendChild(rock);

  let rockPosition = 1000;
  const moveRock = setInterval(() => {
    if (!gameActive || !questionBox.classList.contains("hidden")) return;

    rockPosition -= 7;
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
      if (isQuestionRock) {
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

    // ✅ Skor +5 saat lewati batu biasa
    if (rock.dataset.type === "normal" && rockPosition < 30 && rock.dataset.scored === "false") {
      rock.dataset.scored = "true";
      score += 5;
      scoreDisplay.textContent = `Skor: ${score}/100`;
      scoreSound.currentTime = 0;
      scoreSound.play();

      // ✅ Tampilkan efek +5
      const popup = document.createElement("div");
      popup.className = "score-popup";
      popup.textContent = "+5";
      popup.style.left = "80px";
      popup.style.bottom = "120px";
      gameContainer.appendChild(popup);

      setTimeout(() => {
        if (popup.parentNode) gameContainer.removeChild(popup);
      }, 1000);

      if (score >= 100) completeGame();
    }

    // Hapus batu
    if (rockPosition < -100) {
      clearInterval(moveRock);
      if (rock.parentNode) gameContainer.removeChild(rock);
    }
  }, 30);
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
        scoreDisplay.textContent = `Skor: ${score}/100`;
        correctSound.play();
        if (score >= 100) completeGame();
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

// 🏁 Selesai
function completeGame() {
  gameActive = false;
  stopTimer();
  clearInterval(rockInterval);
  const totalTime = Math.floor((Date.now() - startTime) / 1000);
  completionTime.textContent = `Waktu: ${totalTime} detik`;
  completionModal.classList.remove("hidden");

  // ✅ Confetti saat skor 100
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
  scoreDisplay.textContent = `Skor: ${score}/100`;
  updateLives();
  timerDisplay.textContent = "Waktu: 0s";

  document.querySelectorAll(".rock").forEach(el => el.remove());
  frog.classList.remove("jump");
  frog.style.bottom = "80px";

  startTimer();
  rockInterval = setInterval(createRock, 2000);
}

// 🎮 Event Listeners
submitNameBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim() || "Anonim";
  const time = Math.floor((Date.now() - startTime) / 1000);
  saveToLeaderboard(name, time);
  completionModal.classList.add("hidden");
  showLeaderboard();
  leaderboardScreen.classList.remove("hidden");
});

playAgainBtn.addEventListener("click", () => {
  leaderboardScreen.classList.add("hidden");
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

document.addEventListener("click", () => {
  if (gameActive) jump();
});