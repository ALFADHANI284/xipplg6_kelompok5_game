const frog = document.getElementById("frog");
const gameContainer = document.getElementById("game-container");
const scoreDisplay = document.getElementById("score");
const modal = document.getElementById("question-modal");
const questionText = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

let isJumping = false;
let score = 0;
let gravity = 0.9;
let position = 0;
let leafInterval;
let gameActive = true;

// 🔊 Suara
const jumpSound = document.getElementById("jump-sound");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");

// 🐸 Daftar Soal (20+ soal dari berbagai kategori)
const questions = [
  { q: "Berapa hasil dari 5 + 7?", a: ["10", "12", "13"], correct: 1 },
  { q: "Apa warna daun?", a: ["Merah", "Hijau", "Biru"], correct: 1 },
  { q: "Hewan yang bisa melompat tinggi?", a: ["Katak", "Sapi", "Kura-kura"], correct: 0 },
  { q: "Berapa kaki yang dimiliki katak?", a: ["2", "4", "6"], correct: 1 },
  { q: "Matahari terbit dari arah?", a: ["Barat", "Timur", "Selatan"], correct: 1 },
  { q: "Apa lawan kata 'panas'?", a: ["Dingin", "Hangat", "Lembab"], correct: 0 },
  { q: "10 dikurangi 3 sama dengan?", a: ["6", "7", "8"], correct: 1 },
  { q: "Apa nama bunga terbesar di dunia?", a: ["Rafflesia", "Melati", "Mawar"], correct: 0 },
  { q: "Hewan yang hidup di dua alam?", a: ["Ikan", "Katak", "Burung"], correct: 1 },
  { q: "Apa hasil dari 4 × 5?", a: ["16", "20", "24"], correct: 1 },
  { q: "Apa warna langit saat siang?", a: ["Hijau", "Biru", "Hitam"], correct: 1 },
  { q: "Siapa presiden pertama Indonesia?", a: ["Soeharto", "BJ Habibie", "Soekarno"], correct: 2 },
  { q: "Apa bentuk bulan purnama?", a: ["Persegi", "Bulat", "Segitiga"], correct: 1 },
  { q: "Apa nama planet kita?", a: ["Mars", "Bumi", "Venus"], correct: 1 },
  { q: "Berapa jari tangan manusia?", a: ["8", "10", "12"], correct: 1 },
  { q: "Apa bahasa Inggris dari 'kucing'?", a: ["Dog", "Cat", "Bird"], correct: 1 },
  { q: "Apa yang diminum tumbuhan dari tanah?", a: ["Udara", "Air", "Cahaya"], correct: 1 },
  { q: "Apa hasil dari 15 ÷ 3?", a: ["5", "3", "4"], correct: 0 },
  { q: "Apa alat musik dengan tali?", a: ["Drum", "Gitar", "Terompet"], correct: 1 },
  { q: "Apa yang membuat tumbuhan hijau?", a: ["Klorofil", "Akar", "Bunga"], correct: 0 },
  { q: "Apa nama hewan yang bisa terbang dan menyedot darah?", a: ["Nyamuk", "Lebah", "Kupu-kupu"], correct: 0 },
  { q: "Apa hasil dari 9 × 3?", a: ["27", "24", "30"], correct: 0 },
  { q: "Apa yang dikeluarkan tumbuhan saat siang hari?", a: ["Oksigen", "Karbondioksida", "Asap"], correct: 0 },
  { q: "Apa nama alat untuk menggambar lingkaran?", a: ["Penggaris", "Jangka", "Busur"], correct: 1 },
  { q: "Apa nama proses tumbuhan membuat makanan?", a: ["Respirasi", "Fotosintesis", "Transpirasi"], correct: 1 }
];

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

function createLeaf() {
  const leaf = document.createElement("div");
  leaf.classList.add("leaf");
  leaf.style.left = "1000px";
  gameContainer.appendChild(leaf);

  // Tambahkan riak kecil di sungai
  const wave = document.createElement("div");
  wave.classList.add("wave");
  wave.style.left = Math.random() * 100 + "vw";
  gameContainer.appendChild(wave);
  setTimeout(() => gameContainer.removeChild(wave), 2000);

  let leafPosition = 1000;
  let shown = false;

  let moveLeaf = setInterval(() => {
    leafPosition -= 7;
    leaf.style.left = leafPosition + "px";

    // Saat katak mendekat & belum muncul soal
    if (leafPosition < 150 && leafPosition > 100 && !shown) {
      showQuestion();
      shown = true;
    }

    // Jika daun lewat dan belum dijawab → game over
    if (leafPosition < 0 && !shown) {
      gameOver();
    }

    if (leafPosition < -70) {
      clearInterval(moveLeaf);
      gameContainer.removeChild(leaf);
    }
  }, 30);
}

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
        score++;
        scoreDisplay.textContent = `Skor: ${score}`;
        correctSound.play();
      } else {
        wrongSound.play();
        gameOver();
      }
      modal.classList.add("hidden");
    };
    optionsDiv.appendChild(btn);
  });
}

function gameOver() {
  gameActive = false;
  clearInterval(leafInterval);
  finalScore.textContent = `Skor: ${score}`;
  gameOverScreen.classList.remove("hidden");
}

restartBtn.addEventListener("click", () => {
  location.reload();
});

// Mulai game
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
});
document.addEventListener("click", jump);

// Buat awan dan riak
setInterval(() => {
  const cloud = document.createElement("div");
  cloud.classList.add("cloud");
  cloud.style.width = Math.random() * 80 + 80 + "px";
  cloud.style.height = Math.random() * 30 + 30 + "px";
  cloud.style.top = Math.random() * 100 + 40 + "px";
  cloud.style.left = "1000px";
  cloud.style.opacity = "0.8";
  cloud.style.animation = `float ${Math.random() * 20 + 30}s linear infinite`;
  gameContainer.appendChild(cloud);
  setTimeout(() => {
    if (cloud.parentNode) gameContainer.removeChild(cloud);
  }, 40000);
}, 8000);

// Start game
leafInterval = setInterval(createLeaf, 2500);