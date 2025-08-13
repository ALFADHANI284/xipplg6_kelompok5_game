const frog = document.getElementById("frog");
const gameContainer = document.getElementById("game-container");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const modal = document.getElementById("question-modal");
const questionText = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");
const finalTime = document.getElementById("final-time");
const restartBtn = document.getElementById("restart-btn");
const viewLeaderboardBtn = document.getElementById("view-leaderboard");
const leaderboardScreen = document.getElementById("leaderboard");
const leaderboardList = document.getElementById("leaderboard-list");
const playAgainBtn = document.getElementById("play-again");

let isJumping = false;
let score = 0;
let gravity = 0.9;
let position = 0;
let leafInterval;
let gameActive = true;
let currentQuestionLeaf = null;
let startTime;
let gameTimer;

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
function saveToLeaderboard(score, time) {
  const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
  
  leaderboard.push({ 
    score, 
    time, 
    date: new Date().toLocaleDateString()
  });
  
  // Urutkan: Skor tertinggi dulu, jika sama → waktu tercepat
  leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.time - b.time;
  });
  
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
    li.className = "leaderboard-item";
    
    // Highlight peringkat 1-3
    if (index === 0) li.classList.add("gold");
    if (index === 1) li.classList.add("silver");
    if (index === 2) li.classList.add("bronze");
    
    li.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="score">${entry.score} poin</span>
      <span class="time">${entry.time} detik</span>
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
    
    leafPosition -= 7;
    leaf.style.left = leafPosition + "px";

    // 🔥 DETEKSI TABRAKAN FISIK
    const frogLeft = 80;
    const frogWidth = 50;
    const leafWidth = 70;
    
    if (
      leaf.dataset.questionShown === "false" && 
      !isJumping && 
      leafPosition <= frogLeft + frogWidth && 
      leafPosition + leafWidth >= frogLeft
    ) {
      // ⛔ HENTIKAN SEMUA GERAKAN
      gameActive = false;
      clearInterval(leafInterval);
      
      // Simpan referensi daun yang sedang tabrakan
      currentQuestionLeaf = leaf;
      
      // Tambahkan efek visual tabrakan
      leaf.classList.add("hit");
      setTimeout(() => leaf.classList.remove("hit"), 500);
      
      showQuestion();
      leaf.dataset.questionShown = "true";
    }

    // ✅ +1 POIN SAAT MELEWATI BATU (hanya sekali)
    if (leafPosition < frogLeft - 50 && leaf.dataset.passed === "false") {
      score++;
      scoreDisplay.textContent = `Skor: ${score}`;
      leaf.dataset.passed = "true";
    }

    // Hapus daun saat keluar layar
    if (leafPosition < -100) {
      clearInterval(moveLeaf);
      gameContainer.removeChild(leaf);
    }
  }, 30);
}

// ❓ Tampilkan Soal
function showQuestion() {
  modal.classList.remove("hidden");
  const q = questions[Math.floor(Math.random() * questions.length)];
  questionText.textContent = q.q;
  optionsDiv.innerHTML = "";

  q.a.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.onclick = () => {
      if (index === q.correct) {
        // ✅ +5 POIN SAAT JAWABAN BENAR
        score += 5;
        scoreDisplay.textContent = `Skor: ${score}`;
        correctSound.play();
        
        // ✅ LANJUTKAN PERMAINAN
        gameActive = true;
        leafInterval = setInterval(createLeaf, 2500);
      } else {
        wrongSound.play();
        gameOver();
      }
      
      // Bersihkan referensi daun
      if (currentQuestionLeaf) {
        currentQuestionLeaf = null;
      }
      
      modal.classList.add("hidden");
    };
    optionsDiv.appendChild(btn);
  });
}

// 💀 Game Over
function gameOver() {
  gameActive = false;
  clearInterval(leafInterval);
  stopTimer();
  
  // Hitung waktu akhir
  const totalTime = Math.floor((Date.now() - startTime) / 1000);
  
  // Simpan ke leaderboard
  saveToLeaderboard(score, totalTime);
  
  // Tampilkan di layar game over
  finalScore.textContent = score;
  finalTime.textContent = totalTime;
  
  gameOverScreen.classList.remove("hidden");
}

// 🚀 Inisialisasi Game
function initGame() {
  gameActive = true;
  score = 0;
  scoreDisplay.textContent = `Skor: ${score}`;
  timerDisplay.textContent = "Waktu: 0s";
  
  // Hapus semua daun yang tersisa
  document.querySelectorAll(".leaf").forEach(leaf => leaf.remove());
  
  // Mulai timer
  startTimer();
  
  // Mulai buat daun
  leafInterval = setInterval(createLeaf, 2500);
}

// 🏆 Event Listeners
restartBtn.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  initGame();
});

viewLeaderboardBtn.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  showLeaderboard();
  leaderboardScreen.classList.remove("hidden");
});

playAgainBtn.addEventListener("click", () => {
  leaderboardScreen.classList.add("hidden");
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
document.addEventListener("DOMContentLoaded", () => {
  initGame();
  showLeaderboard();
});