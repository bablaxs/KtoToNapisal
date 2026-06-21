let isJoining = false;
const SUPABASE_URL = "https://pjzsxrrzlrtkpfijojlc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqenN4cnJ6bHJ0a3BmaWpvamxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzI5MjAsImV4cCI6MjA5NzYwODkyMH0.OYQxb8Sli3-w2p5cy8aC7ZtM4E26RsmSxa3xrML24QA";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let myPlayerId = null;
let isHost = false;
const screens = {
  start: document.getElementById("startScreen"),
  lobby: document.getElementById("lobbyScreen"),
  answer: document.getElementById("answerScreen"),
  guess: document.getElementById("guessScreen"),
  results: document.getElementById("resultsScreen")
};

const questions = [
  "Jaka jest najgłupsza wymówka do szkoły?",
  "Gdybyś mógł mieć jedną supermoc, to jaką?",
  "Co powiedziałby pies, gdyby umiał mówić?",
  "Najgorszy pomysł na biznes?",
  "Co zrobiłbyś mając 100 milionów zł?",
  "Najgorszy tekst na podryw?",
  "Jaką nazwę miałaby najgorsza restauracja świata?",
  "Co zrobiłby kot jako prezydent?",
  "Najdziwniejsza rzecz, jaką można powiedzieć nauczycielowi?",
  "Co byś zrobił, gdybyś przez jeden dzień był niewidzialny?"
];

const avatars = ["😈", "🟢", "🔵", "🟠", "🔴", "🟣", "🟡", "🧠"];

let game = {
  roomCode: "",
  players: [],
  round: 1,
  maxRounds: 5,
  currentQuestion: "",
  answers: [],
  currentAnswerIndex: 0,
  currentPlayerAnswering: 0,
  currentPlayerGuessing: 0,
  guesses: []
};

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
  updateHostControls();
}

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function createRoom() {
  const nick = document.getElementById("nickInput").value.trim();

  if (!nick) {
    alert("Wpisz nick.");
    return;
  }

  const code = randomCode();
  game.roomCode = code;
  isHost = true;

  const { error: roomError } = await db.from("rooms").insert({
    code: code,
    state: "lobby",
    round: 1
  });

  if (roomError) {
    alert("Błąd tworzenia pokoju: " + roomError.message);
    return;
  }

  const { data: player, error: playerError } = await db
    .from("players")
    .insert({
      room_code: code,
      name: nick,
      score: 0,
      avatar: avatars[0],
      is_host: true
    })
    .select()
    .single();

  if (playerError) {
    alert("Błąd dodawania gracza: " + playerError.message);
    return;
  }

  myPlayerId = player.id;

  document.getElementById("roomCode").textContent = code;

await loadPlayers();
listenPlayers();
await loadPlayers();

showScreen("lobby");
}

async function joinRoom() {
if (isJoining) return;
isJoining = true;
  const nick = document.getElementById("nickInput").value.trim();
  const code = document.getElementById("codeInput").value.trim().toUpperCase();

  if (!nick || !code) {
    alert("Wpisz nick i kod pokoju.");
    isJoining = false;
    return;
  }

  const { data: room, error: roomError } = await db
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (roomError || !room) {
    alert("Nie ma takiego pokoju.");
    isJoining = false;

    return;
  }
  const { data: existingPlayer } = await db
  .from("players")
  .select("*")
  .eq("room_code", code)
  .eq("name", nick)
  .maybeSingle();

if (existingPlayer) {
  alert("Ten nick już jest w tym pokoju.");
  isJoining = false;
  return;
}
  game.roomCode = code;
  isHost = false;

  const { data: player, error: playerError } = await db
    .from("players")
    .insert({
      room_code: code,
      name: nick,
      score: 0,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      is_host: false
    })
    .select()
    .single();

  if (playerError) {
    alert("Błąd dołączania: " + playerError.message);
    isJoining = false;
    return;
  }

  myPlayerId = player.id;

  document.getElementById("roomCode").textContent = code;

await loadPlayers();
listenPlayers();
await loadPlayers();

showScreen("lobby");
isJoining = false;
}

async function loadPlayers() {
  const { data, error } = await db
    .from("players")
    .select("*")
    .eq("room_code", game.roomCode)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    isJoining = false;
    return;
  }

  game.players = data || [];
  renderPlayers();
}

function listenPlayers() {
  db.removeAllChannels();

  const channel = db.channel("players-" + game.roomCode);

  channel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "players"
      },
      async (payload) => {
        if (payload.new?.room_code === game.roomCode || payload.old?.room_code === game.roomCode) {
          await loadPlayers();
        }
      }
    )
    .subscribe((status) => {
      console.log("Realtime players:", status);
    });
}
setInterval(async () => {
  if (game.roomCode && screens.lobby.classList.contains("active")) {
    await loadPlayers();
  }
}, 2000);
function updateHostControls() {
  const btn = document.getElementById("startGameBtn");
  if (!btn) return;

  btn.style.display = isHost ? "block" : "none";
}
function renderPlayers() {
  const list = document.getElementById("playersList");
  list.innerHTML = "";

  document.getElementById("playersCount").textContent = `${game.players.length}/8`;

  game.players.forEach(player => {
    const div = document.createElement("div");
    div.className = "player";

    div.innerHTML = `
      <span class="avatar">${player.avatar}</span>
      <b>${player.name}</b>
      ${player.is_host ? `<span class="host-badge">Host</span>` : ""}
    `;

    list.appendChild(div);
  });
}

function copyCode() {
  navigator.clipboard.writeText(game.roomCode);
  alert("Skopiowano kod pokoju: " + game.roomCode);
}

function startGame() {
    if (!isHost) {
  alert("Tylko host może rozpocząć grę.");
  return;
}
  if (game.players.length < 2) {
    alert("Dodaj minimum 2 graczy.");
    isJoining = false;
    return;
  }

  game.round = 1;
  game.players.forEach(p => p.score = 0);
  startRound();
}

function startRound() {
  game.currentQuestion = questions[Math.floor(Math.random() * questions.length)];
  game.answers = [];
  game.guesses = [];
  game.currentPlayerAnswering = 0;
  game.currentAnswerIndex = 0;
  game.currentPlayerGuessing = 0;

  document.getElementById("roundInfo").textContent = `RUNDA ${game.round}/${game.maxRounds}`;
  document.getElementById("questionText").textContent = game.currentQuestion;

  updateAnswerScreen();
  showScreen("answer");
}

function updateAnswerScreen() {
  const player = game.players[game.currentPlayerAnswering];

  document.getElementById("currentAnswerPlayer").textContent = player.name;
  document.getElementById("answerInput").value = "";
  document.getElementById("charCount").textContent = "0/120";
  document.getElementById("answeredCount").textContent =
    `${game.answers.length}/${game.players.length} odpowiedziało`;
}

document.getElementById("answerInput").addEventListener("input", function () {
  document.getElementById("charCount").textContent = `${this.value.length}/120`;
});

function submitAnswer() {
  const input = document.getElementById("answerInput");
  const text = input.value.trim();

  if (!text) {
    alert("Napisz odpowiedź.");
    isJoining = false;
    return;
  }

  const player = game.players[game.currentPlayerAnswering];

  game.answers.push({
    id: Date.now() + Math.random(),
    playerId: player.id,
    playerName: player.name,
    playerAvatar: player.avatar,
    answer: text
  });

  game.currentPlayerAnswering++;

  if (game.currentPlayerAnswering >= game.players.length) {
    shuffleAnswers();
    startGuessing();
  } else {
    updateAnswerScreen();
  }
}

function shuffleAnswers() {
  game.answers.sort(() => Math.random() - 0.5);
}

function startGuessing() {
  game.currentAnswerIndex = 0;
  game.currentPlayerGuessing = 0;
  game.guesses = [];
  updateGuessScreen();
  showScreen("guess");
}

function updateGuessScreen() {
  const answer = game.answers[game.currentAnswerIndex];
  const guesser = game.players[game.currentPlayerGuessing];

  document.getElementById("guessRoundInfo").textContent = `RUNDA ${game.round}/${game.maxRounds}`;
  document.getElementById("guessQuestion").textContent = game.currentQuestion;
  document.getElementById("anonymousAnswer").textContent = `„${answer.answer}”`;
  document.getElementById("currentGuessPlayer").textContent = guesser.name;

  const buttons = document.getElementById("guessButtons");
  buttons.innerHTML = "";

  game.players.forEach(player => {
    const btn = document.createElement("button");

    btn.innerHTML = `
      <span class="avatar">${player.avatar}</span>
      ${player.name}
    `;

    btn.onclick = () => submitGuess(player.id);
    buttons.appendChild(btn);
  });
}

function submitGuess(guessedPlayerId) {
  const answer = game.answers[game.currentAnswerIndex];
  const guesser = game.players[game.currentPlayerGuessing];

  game.guesses.push({
    answerId: answer.id,
    realPlayerId: answer.playerId,
    guesserId: guesser.id,
    guessedPlayerId
  });

  game.currentPlayerGuessing++;

  if (game.currentPlayerGuessing >= game.players.length) {
    calculatePointsForAnswer();
    showResults();
  } else {
    updateGuessScreen();
  }
}

function calculatePointsForAnswer() {
  const answer = game.answers[game.currentAnswerIndex];

  game.guesses
    .filter(g => g.answerId === answer.id)
    .forEach(g => {
      const guesser = game.players.find(p => p.id === g.guesserId);
      const guessedPlayer = game.players.find(p => p.id === g.guessedPlayerId);

      if (g.guessedPlayerId === answer.playerId && g.guesserId !== answer.playerId) {
        guesser.score += 100;
      }

      if (g.guessedPlayerId !== answer.playerId && guessedPlayer.id !== answer.playerId) {
        guessedPlayer.score += 30;
      }
    });
}

function showResults() {
  const answer = game.answers[game.currentAnswerIndex];
  const author = game.players.find(p => p.id === answer.playerId);

  document.getElementById("realAuthor").innerHTML =
    `${author.avatar} ${author.name}`;

  const correctBox = document.getElementById("correctGuessers");
  correctBox.innerHTML = "";

  const correct = game.guesses.filter(g =>
    g.answerId === answer.id &&
    g.guessedPlayerId === answer.playerId &&
    g.guesserId !== answer.playerId
  );

  if (correct.length === 0) {
    correctBox.innerHTML = `<p>Nikt nie zgadł 😈</p>`;
    author.score += 50;
  } else {
    correct.forEach(g => {
      const player = game.players.find(p => p.id === g.guesserId);
      correctBox.innerHTML += `<p>${player.avatar} ${player.name}</p>`;
    });
  }

  renderScoreboard();
  showScreen("results");
}

function renderScoreboard() {
  const table = document.getElementById("scoreTable");
  table.innerHTML = "";

  const sorted = [...game.players].sort((a, b) => b.score - a.score);

  sorted.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "score-row";

    row.innerHTML = `
      <span>${index + 1}. ${player.avatar} <b>${player.name}</b></span>
      <span>${player.score} pkt</span>
    `;

    table.appendChild(row);
  });
}

function nextGuessOrRound() {
  game.currentAnswerIndex++;

  if (game.currentAnswerIndex < game.answers.length) {
    game.currentPlayerGuessing = 0;
    game.guesses = [];
    updateGuessScreen();
    showScreen("guess");
    return;
  }

  game.round++;

  if (game.round > game.maxRounds) {
    alert("Koniec gry! Zwycięzca jest na górze tabeli.");
    showScreen("lobby");
    return;
  }

  startRound();
}
