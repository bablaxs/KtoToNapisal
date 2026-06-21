const SUPABASE_URL = "https://pjzsxrrzlrtkpfijojlc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqenN4cnJ6bHJ0a3BmaWpvamxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzI5MjAsImV4cCI6MjA5NzYwODkyMH0.OYQxb8Sli3-w2p5cy8aC7ZtM4E26RsmSxa3xrML24QA";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let myPlayerId = null;
let isHost = false;
let isJoining = false;
let isProcessing = false;
let lastStateKey = "";

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
  roomState: "lobby",
  players: [],
  answers: [],
  guesses: [],
  round: 1,
  maxRounds: 5,
  currentQuestion: "",
  currentAnswerIndex: 0
};

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
  updateHostControls();
}

function updateHostControls() {
  const startBtn = document.getElementById("startGameBtn");
  if (startBtn) startBtn.style.display = isHost ? "block" : "none";

  const nextBtn = document.querySelector("#resultsScreen button.primary");
  if (nextBtn && game.roomState !== "final") {
    nextBtn.style.display = isHost ? "block" : "none";
  }
}

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getVisibleStateKey() {
  return [
    game.roomState,
    game.round,
    game.currentAnswerIndex,
    game.players.length,
    game.answers.length,
    game.guesses.length
  ].join("|");
}

async function createRoom() {
  const nick = document.getElementById("nickInput").value.trim();
  if (!nick) return alert("Wpisz nick.");

  const code = randomCode();
  game.roomCode = code;
  isHost = true;

  const { error: roomError } = await db.from("rooms").insert({
    code,
    state: "lobby",
    round: 1,
    current_answer_index: 0
  });

  if (roomError) return alert("Błąd tworzenia pokoju: " + roomError.message);

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

  if (playerError) return alert("Błąd dodawania gracza: " + playerError.message);

  myPlayerId = player.id;
  document.getElementById("roomCode").textContent = code;

  await loadAll();
  showScreen("lobby");
}

async function joinRoom() {
  if (isJoining) return;
  isJoining = true;

  const nick = document.getElementById("nickInput").value.trim();
  const code = document.getElementById("codeInput").value.trim().toUpperCase();

  if (!nick || !code) {
    isJoining = false;
    return alert("Wpisz nick i kod pokoju.");
  }

  const { data: room, error: roomError } = await db
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (roomError || !room) {
    isJoining = false;
    return alert("Nie ma takiego pokoju.");
  }

  const { data: existingPlayer } = await db
    .from("players")
    .select("*")
    .eq("room_code", code)
    .eq("name", nick)
    .maybeSingle();

  if (existingPlayer) {
    isJoining = false;
    return alert("Ten nick już jest w tym pokoju.");
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
    isJoining = false;
    return alert("Błąd dołączania: " + playerError.message);
  }

  myPlayerId = player.id;
  document.getElementById("roomCode").textContent = code;

  await loadAll();
  showScreen("lobby");
  isJoining = false;
}

async function loadAll() {
  await loadPlayers();
  await loadAnswers();
  await loadGuesses();
  await loadRoomOnly();
  renderByState();
}

async function loadRoomOnly() {
  if (!game.roomCode) return;

  const { data: room, error } = await db
    .from("rooms")
    .select("*")
    .eq("code", game.roomCode)
    .maybeSingle();

  if (error || !room) return;

  game.roomState = room.state || "lobby";
  game.round = room.round || 1;
  game.currentQuestion = room.current_question || "";
  game.currentAnswerIndex = room.current_answer_index || 0;
}

async function loadPlayers() {
  if (!game.roomCode) return;

  const { data, error } = await db
    .from("players")
    .select("*")
    .eq("room_code", game.roomCode)
    .order("created_at", { ascending: true });

  if (error) return console.error(error);

  game.players = data || [];
  renderPlayers();
}

async function loadAnswers() {
  if (!game.roomCode) return;

  const { data, error } = await db
    .from("answers")
    .select("*")
    .eq("room_code", game.roomCode)
    .order("created_at", { ascending: true });

  if (error) return console.error(error);

  game.answers = data || [];
}

async function loadGuesses() {
  if (!game.roomCode) return;

  const { data, error } = await db
    .from("guesses")
    .select("*")
    .eq("room_code", game.roomCode)
    .order("created_at", { ascending: true });

  if (error) return console.error(error);

  game.guesses = data || [];
}

function renderByState() {
  const key = getVisibleStateKey();
  lastStateKey = key;

  if (game.roomState === "lobby") {
    showScreen("lobby");
    return;
  }

  if (game.roomState === "answering") {
    renderAnswerScreen();
    return;
  }

  if (game.roomState === "guessing") {
    renderGuessScreen();
    return;
  }

  if (game.roomState === "results") {
    renderResultsScreen();
    return;
  }

  if (game.roomState === "final") {
    renderFinalScreen();
    return;
  }
}

function renderPlayers() {
  const list = document.getElementById("playersList");
  const count = document.getElementById("playersCount");
  if (!list || !count) return;

  list.innerHTML = "";
  count.textContent = `${game.players.length}/8`;

  game.players.forEach(player => {
    const div = document.createElement("div");
    div.className = "player";
    div.innerHTML = `
      <span class="avatar">${player.avatar || "🙂"}</span>
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

async function startGame() {
  if (!isHost) return alert("Tylko host może rozpocząć grę.");

  await loadPlayers();

  if (game.players.length < 2) return alert("Dodaj minimum 2 graczy.");

  await db.from("answers").delete().eq("room_code", game.roomCode);
  await db.from("guesses").delete().eq("room_code", game.roomCode);

  for (const player of game.players) {
    await db.from("players").update({ score: 0 }).eq("id", player.id);
  }

  const question = questions[Math.floor(Math.random() * questions.length)];

  const { error } = await db
    .from("rooms")
    .update({
      state: "answering",
      current_question: question,
      round: 1,
      current_answer_index: 0
    })
    .eq("code", game.roomCode);

  if (error) return alert("Błąd startu gry: " + error.message);

  await loadAll();
}

function renderAnswerScreen() {
  document.getElementById("roundInfo").textContent = `RUNDA ${game.round}/${game.maxRounds}`;
  document.getElementById("questionText").textContent = game.currentQuestion;

  const me = game.players.find(p => p.id === myPlayerId);
  document.getElementById("currentAnswerPlayer").textContent = me ? me.name : "Ty";

  const input = document.getElementById("answerInput");
  const btn = document.querySelector("#answerScreen button.primary");
  const myAnswer = game.answers.find(a => a.player_id === myPlayerId);

  document.getElementById("answeredCount").textContent =
    `${game.answers.length}/${game.players.length} odpowiedziało`;

  if (myAnswer) {
    input.value = myAnswer.answer;
    input.disabled = true;
    btn.disabled = true;
    btn.textContent = "ODPOWIEDŹ WYSŁANA ✅";
  } else {
    input.disabled = false;
    btn.disabled = false;
    btn.textContent = "WYŚLIJ ✈";
  }

  showScreen("answer");
}

document.getElementById("answerInput").addEventListener("input", function () {
  document.getElementById("charCount").textContent = `${this.value.length}/120`;
});

async function submitAnswer() {
  const input = document.getElementById("answerInput");
  const text = input.value.trim();
  if (!text) return alert("Napisz odpowiedź.");

  await loadAnswers();

  const already = game.answers.find(a => a.player_id === myPlayerId);
  if (already) return alert("Już wysłałeś odpowiedź.");

  const me = game.players.find(p => p.id === myPlayerId);

  const { error } = await db.from("answers").insert({
    room_code: game.roomCode,
    player_id: myPlayerId,
    player_name: me ? me.name : "Gracz",
    answer: text
  });

  if (error) return alert("Błąd wysyłania odpowiedzi: " + error.message);

  input.disabled = true;

  await loadAll();
}

async function hostCheckAnswering() {
  if (!isHost || isProcessing) return;
  if (game.roomState !== "answering") return;
  if (game.players.length < 2) return;
  if (game.answers.length < game.players.length) return;

  isProcessing = true;

  const { error } = await db
    .from("rooms")
    .update({
      state: "guessing",
      current_answer_index: 0
    })
    .eq("code", game.roomCode);

  isProcessing = false;

  if (error) console.error(error);
}

function renderGuessScreen() {
  const answer = game.answers[game.currentAnswerIndex];
  if (!answer) return;

  document.getElementById("guessRoundInfo").textContent = `RUNDA ${game.round}/${game.maxRounds}`;
  document.getElementById("guessQuestion").textContent = game.currentQuestion;
  document.getElementById("anonymousAnswer").textContent = `„${answer.answer}”`;

  const me = game.players.find(p => p.id === myPlayerId);
  document.getElementById("currentGuessPlayer").textContent = me ? me.name : "Ty";

  const buttons = document.getElementById("guessButtons");
  buttons.innerHTML = "";

  const alreadyGuessed = game.guesses.find(
    g => g.answer_id === answer.id && g.guesser_id === myPlayerId
  );

  game.players.forEach(player => {
    const btn = document.createElement("button");
    btn.innerHTML = `<span class="avatar">${player.avatar || "🙂"}</span>${player.name}`;

    if (alreadyGuessed) {
      btn.disabled = true;
    } else {
      btn.onclick = () => submitGuess(player.id);
    }

    buttons.appendChild(btn);
  });

  showScreen("guess");
}

async function submitGuess(guessedPlayerId) {
  const answer = game.answers[game.currentAnswerIndex];
  if (!answer) return;

  await loadGuesses();

  const already = game.guesses.find(
    g => g.answer_id === answer.id && g.guesser_id === myPlayerId
  );

  if (already) return alert("Już głosowałeś.");

  const { error } = await db.from("guesses").insert({
    room_code: game.roomCode,
    answer_id: answer.id,
    guesser_id: myPlayerId,
    guessed_player_id: guessedPlayerId
  });

  if (error) return alert("Błąd głosowania: " + error.message);

  await loadAll();
}

async function hostCheckGuessing() {
  if (!isHost || isProcessing) return;
  if (game.roomState !== "guessing") return;

  const answer = game.answers[game.currentAnswerIndex];
  if (!answer) return;

  const guessesForAnswer = game.guesses.filter(g => g.answer_id === answer.id);

  if (guessesForAnswer.length < game.players.length) return;

  isProcessing = true;

  await calculatePoints(answer, guessesForAnswer);

  const { error } = await db
    .from("rooms")
    .update({ state: "results" })
    .eq("code", game.roomCode);

  isProcessing = false;

  if (error) console.error(error);
}

async function calculatePoints(answer, guessesForAnswer) {
  const scores = {};
  game.players.forEach(p => scores[p.id] = p.score || 0);

  let correctCount = 0;

  guessesForAnswer.forEach(g => {
    const guessedPlayer = game.players.find(p => p.id === g.guessed_player_id);

    if (g.guessed_player_id === answer.player_id && g.guesser_id !== answer.player_id) {
      scores[g.guesser_id] += 100;
      correctCount++;
    }

    if (g.guessed_player_id !== answer.player_id && guessedPlayer && guessedPlayer.id !== answer.player_id) {
      scores[guessedPlayer.id] += 30;
    }
  });

  if (correctCount === 0) {
    scores[answer.player_id] += 50;
  }

  for (const playerId of Object.keys(scores)) {
    await db.from("players").update({ score: scores[playerId] }).eq("id", playerId);
  }

  await loadPlayers();
}

function renderResultsScreen() {
  const answer = game.answers[game.currentAnswerIndex];
  if (!answer) return;

  const author = game.players.find(p => p.id === answer.player_id);

  document.getElementById("realAuthor").innerHTML =
    author ? `${author.avatar || "🙂"} ${author.name}` : "Nieznany";

  const correctBox = document.getElementById("correctGuessers");
  correctBox.innerHTML = "";

  const correct = game.guesses.filter(g =>
    g.answer_id === answer.id &&
    g.guessed_player_id === answer.player_id &&
    g.guesser_id !== answer.player_id
  );

  if (correct.length === 0) {
    correctBox.innerHTML = `<p>Nikt nie zgadł 😈</p>`;
  } else {
    correct.forEach(g => {
      const player = game.players.find(p => p.id === g.guesser_id);
      if (player) correctBox.innerHTML += `<p>${player.avatar || "🙂"} ${player.name}</p>`;
    });
  }

  renderScoreboard();

  const nextBtn = document.querySelector("#resultsScreen button.primary");
  if (nextBtn) {
    nextBtn.textContent = "DALEJ ➜";
    nextBtn.style.display = isHost ? "block" : "none";
  }

  showScreen("results");
}

function renderFinalScreen() {
  document.getElementById("realAuthor").innerHTML = "Koniec gry 🏆";

  const correctBox = document.getElementById("correctGuessers");
  correctBox.innerHTML = "<p>Zwycięzca jest na górze tabeli.</p>";

  renderScoreboard();

  const nextBtn = document.querySelector("#resultsScreen button.primary");
  if (nextBtn) nextBtn.style.display = "none";

  showScreen("results");
}

function renderScoreboard() {
  const table = document.getElementById("scoreTable");
  table.innerHTML = "";

  const sorted = [...game.players].sort((a, b) => (b.score || 0) - (a.score || 0));

  sorted.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.innerHTML = `
      <span>${index + 1}. ${player.avatar || "🙂"} <b>${player.name}</b></span>
      <span>${player.score || 0} pkt</span>
    `;
    table.appendChild(row);
  });
}

async function nextGuessOrRound() {
  if (!isHost) return alert("Tylko host może przejść dalej.");

  await loadAll();

  const nextIndex = game.currentAnswerIndex + 1;

  if (nextIndex < game.answers.length) {
    const { error } = await db
      .from("rooms")
      .update({
        state: "guessing",
        current_answer_index: nextIndex
      })
      .eq("code", game.roomCode);

    if (error) console.error(error);
    return;
  }

  if (game.round >= game.maxRounds) {
    const { error } = await db
      .from("rooms")
      .update({ state: "final" })
      .eq("code", game.roomCode);

    if (error) console.error(error);
    return;
  }

  await db.from("answers").delete().eq("room_code", game.roomCode);
  await db.from("guesses").delete().eq("room_code", game.roomCode);

  const question = questions[Math.floor(Math.random() * questions.length)];

  const { error } = await db
    .from("rooms")
    .update({
      state: "answering",
      current_question: question,
      round: game.round + 1,
      current_answer_index: 0
    })
    .eq("code", game.roomCode);

  if (error) console.error(error);
}

setInterval(async () => {
  if (!game.roomCode) return;

  await loadPlayers();
  await loadAnswers();
  await loadGuesses();
  await loadRoomOnly();

  const key = getVisibleStateKey();
  if (key !== lastStateKey) {
    renderByState();
  } else {
    if (game.roomState === "answering") {
      document.getElementById("answeredCount").textContent =
        `${game.answers.length}/${game.players.length} odpowiedziało`;
    }
  }

  await hostCheckAnswering();
  await hostCheckGuessing();
}, 1000);
