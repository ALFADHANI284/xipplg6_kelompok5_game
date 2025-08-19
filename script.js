const frog = document.getElementById("frog");
const gameContainer = document.getElementById("game-container");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const modal = document.getElementById("question-modal");
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

let isJumping = false;
let score = 0;
let questionsAnswered = 0;
let gravity = 0.9;
let position = 0;
let leafInterval;
let gameActive = true;
let startTime;
let gameTimer;
let speedIncreaseTimer;
let questionTimer;
let correctAnswerStreak = 0;
let leafSpeed = 7;
const TOTAL_QUESTIONS = 10;
const POINTS_PER_QUESTION = 10;

// 🔊 Suara
const jumpSound = document.getElementById("jump-sound");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");

// 🐸 Daftar Soal
const questions = [
  { q: "Berapa hasil dari 5 + 7?", a: ["10", "12", "13"], correct: 1 },
  { q: "Apa warna daun?", a: ["Merah", "Hijau", "Biru"], correct: 1 },
  { q: "Hewan yang bisa melompat tinggi?", a: ["Katak", "Sapi", "Kura-kura"], correct: 0 },
  { q: "Berapa kaki yang dimiliki katak?", a: ["2", "4", "6"], correct: 1 },
  { q: "Matahari terbit dari arah?", a: ["Barat", "Timur", "Selatan"], correct: 1 },
  { q: "Apa lawan kata 'panas'?", a: ["Dingin", "Hangat", "Lembab"], correct: 0 },
  { q: "10 dikurangi 3 sama dengan?", a: ["6", "7", "8"], correct: 1 },
  { q: "Hewan yang hidup di dua alam?", a: ["Ikan", "Katak", "Burung"], correct: 1 },
  { q: "Apa hasil dari 4 × 5?", a: ["16", "20", "24"], correct: 1 },
  { q: "Berapa jari tangan manusia?", a: ["8", "10", "12"], correct: 1 }
];

// ⏱️ Fungsi Timer
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

// 🏆 Fungsi Leaderboard
function saveToLeaderboard(name, time) {
  const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
  
  leaderboard.push({ 
    name, 
    time, 
    date: new Date().toLocaleDateString()
  });
  
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
      <span class="rank">${index + 1}.</span>
      <span class="name">${entry.name}</span>
      <span class="time">${entry.time}s</span>
      <span class="date">${entry.date}</span>
    `;
    leaderboardList.appendChild(li);
  });
}

// 🐸 Lompatan
function jump() {
  if (isJumping || !gameActive) return;
  isJumping = true;
  frog.classList.add("jump");
  jumpSound.play();

  let upSpeed = 18;
  let jumpInterval = setInterval(() => {
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

// 🍃 Membuat Daun
function createLeaf() {
  const leaf = document.createElement("div");
  leaf.classList.add("leaf");
  leaf.style.left = "1000px";
  leaf.dataset.passed = "false";
  leaf.dataset.questionShown = "false";
  gameContainer.appendChild(leaf);

  // Tambahkan riak kecil di sungai
  const wave = document.createElement("div");
  wave.classList.add("wave");
  wave.style.left = Math.random() * 100 + "vw";
  gameContainer.appendChild(wave);
  setTimeout(() => gameContainer.removeChild(wave), 2000);

  let leafPosition = 1000;
  let moveLeaf = setInterval(() => {
    // ⛔ HENTIKAN SEMUA GERAKAN SAAT SOAL MUNCUL
    if (!modal.classList.contains("hidden")) {
      return;
    }
    
    leafPosition -= leafSpeed;
    leaf.style.left = leafPosition + "px";

    // 🔥 DETEKSI TABRAKAN FISIK
    const frogLeft = 80;
    const frogWidth = 50;
    const leafWidth = 50;
    
    if (
      leaf.dataset.questionShown === "false" && 
      !isJumping && 
      leafPosition <= frogLeft + frogWidth && 
      leafPosition + leafWidth >= frogLeft
    ) {
      // ⛔ HENTIKAN SEMUA GERAKAN
      gameActive = false;
      clearInterval(leafInterval);
      
      showQuestion();
      leaf.dataset.questionShown = "true";
    }

    // ✅ +1 POIN SAAT MELEWATI BATU (tanpa tabrakan)
    if (leafPosition < frogLeft - 50 && leaf.dataset.passed === "false") {
      score++;
      scoreDisplay.textContent = `Skor: ${score}/100`;
      leaf.dataset.passed = "true";
    }

    // Hapus daun saat keluar layar
    if (leafPosition < -100) {
      clearInterval(moveLeaf);
      gameContainer.removeChild(leaf);
    }
  }, 30);
}

// ❓ Tampilkan Soal dengan Timer 10 detik
function showQuestion() {
  modal.classList.remove("hidden");
  document.getElementById("question-count").textContent = questionsAnswered + 1;
  
  const q = questions[questionsAnswered];
  questionText.textContent = q.q;
  optionsDiv.innerHTML = "";
  
  // Timer soal 10 detik
  let questionTimeLeft = 10;
  questionTimeDisplay.textContent = questionTimeLeft;
  
  questionTimer = setInterval(() => {
    questionTimeLeft--;
    questionTimeDisplay.textContent = questionTimeLeft;
    
    if (questionTimeLeft <= 0) {
      clearInterval(questionTimer);
      wrongSound.play();
      gameOver();
      modal.classList.add("hidden");
    }
  }, 1000);

  q.a.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.onclick = () => {
      // Hentikan timer soal
      clearInterval(questionTimer);
      
      if (index === q.correct) {
        questionsAnswered++;
        score = questionsAnswered * POINTS_PER_QUESTION;
        scoreDisplay.textContent = `Skor: ${score}/100`;
        correctSound.play();
        
        // 🚀 Cek speed increase
        correctAnswerStreak++;
        if (correctAnswerStreak >= 4 || Math.floor((Date.now() - startTime) / 1000) >= 20) {
          increaseSpeed();
          correctAnswerStreak = 0;
        }
        
        // 🎯 Selesai 10 soal
        if (questionsAnswered === TOTAL_QUESTIONS) {
          stopTimer();
          const totalTime = Math.floor((Date.now() - startTime) / 1000);
          completionTime.textContent = `Waktu: ${totalTime} detik`;
          modal.classList.add("hidden");
          completionModal.classList.remove("hidden");
        }
      } else {
        wrongSound.play();
        gameOver();
      }
      
      modal.classList.add("hidden");
    };
    optionsDiv.appendChild(btn);
  });
}

// 🚀 Increase Speed
function increaseSpeed() {
  if (leafSpeed < 12) {
    leafSpeed += 0.5;
  }
}

// 💀 Game Over
function gameOver() {
  gameActive = false;
  clearInterval(leafInterval);
  clearInterval(gameTimer);
  clearInterval(questionTimer);
  finalScore.textContent = score;
  finalTime.textContent = Math.floor((Date.now() - startTime) / 1000);
  gameOverScreen.classList.remove("hidden");
}

// 🚀 Inisialisasi Game
function initGame() {
  gameActive = true;
  score = 0;
  questionsAnswered = 0;
  correctAnswerStreak = 0;
  leafSpeed = 7;
  scoreDisplay.textContent = `Skor: ${score}/100`;
  timerDisplay.textContent = "Waktu: 0s";
  
  // Hapus semua daun yang tersisa
  document.querySelectorAll(".leaf").forEach(leaf => leaf.remove());
  
  // Mulai timer
  startTimer();
  
  // Mulai buat daun
  leafInterval = setInterval(createLeaf, 2500);
}

// 🏆 Event Listeners
submitNameBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Masukkan nama Anda!");
    return;
  }
  
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

// 🎮 Kontrol Game
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && gameActive) {
    e.preventDefault();
    jump();
  }
});

document.addEventListener("click", (e) => {
  if (gameActive && e.target !== playerNameInput) {
    jump();
  }
});

// 🚀 Start Game
initGame();
showLeaderboard();