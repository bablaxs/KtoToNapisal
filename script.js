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
  "Jaki byłby najgorszy tekst na podryw?",
  "Co powiedziałby ziemniak, gdyby umiał mówić?",
  "Jaka byłaby najgłupsza wymówka do szkoły?",
  "Jaką nazwę miałaby najgorsza restauracja świata?",
  "Co zrobiłby kot, gdyby został prezydentem?",
  "Jaka byłaby najdziwniejsza supermoc?",
  "Co powiedziałby nauczyciel, gdyby był robotem?",
  "Jaki byłby najgorszy prezent na urodziny?",
  "Jak brzmiałaby reklama najgorszego produktu świata?",
  "Co zrobiłby pies, gdyby dostał milion złotych?",
  "Jaka byłaby najgłupsza nazwa zespołu muzycznego?",
  "Co powiedziałby kosmita po wylądowaniu w Polsce?",
  "Jaką zasadę wprowadziłbyś w szkole dla beki?",
  "Jaka byłaby najgorsza nazwa dla dziecka?",
  "Co byś zrobił, gdybyś obudził się jako gołąb?",
  "Jaka byłaby najgorsza aplikacja na telefon?",
  "Co powiedziałby kebab, gdyby miał uczucia?",
  "Jaka byłaby najdziwniejsza kara w szkole?",
  "Jak wyglądałby świat, gdyby ludzie chodzili tyłem?",
  "Jaki byłby najgorszy sposób na zostanie sławnym?",
  "Co byś zrobił, gdyby twój plecak zaczął gadać?",
  "Jaka byłaby najgłupsza nazwa sklepu?",
  "Co powiedziałby twój telefon, gdyby mógł cię ocenić?",
  "Jaki byłby najgorszy pomysł na film?",
  "Co byś zrobił, gdyby nauczyciel zamienił się w kurczaka?",
  "Jaką wymówkę podałbyś, gdybyś spóźnił się 3 godziny?",
  "Jaka byłaby najgłupsza rzecz do sprzedania w internecie?",
  "Co powiedziałby banan przed zjedzeniem?",
  "Jak wyglądałby najgorszy superbohater?",
  "Jaki byłby najdziwniejszy sport świata?",
  "Co zrobiłbyś, gdybyś przez jeden dzień był niewidzialny?",
  "Jaka byłaby najgorsza nazwa hotelu?",
  "Co powiedziałaby lodówka o twoim stylu życia?",
  "Jaki byłby najdziwniejszy zakaz w domu?",
  "Co byś zrobił, gdyby twój pies zaczął chodzić do szkoły?",
  "Jaka byłaby najgorsza nazwa dla gry?",
  "Jaką głupią ustawę wprowadziłbyś jako prezydent?",
  "Co powiedziałby krzesło, gdyby miało dość ludzi?",
  "Jaki byłby najgorszy talent w talent show?",
  "Co zrobiłbyś, gdybyś znalazł gadającego ogórka?",
  "Jaka byłaby najdziwniejsza rzecz do powiedzenia na randce?",
  "Co powiedziałby autobus, gdyby miał osobowość?",
  "Jaki byłby najgorszy tekst reklamowy dla szkoły?",
  "Co byś zrobił, gdyby twoje buty uciekły?",
  "Jaka byłaby najgorsza nazwa restauracji z kebabem?",
  "Co powiedziałaby mucha przed atakiem?",
  "Jaki byłby najgłupszy powód do kłótni?",
  "Co zrobiłbyś, gdyby internet zniknął na tydzień?",
  "Jaka byłaby najgorsza nazwa kanału na YouTube?",
  "Co powiedziałby twój komputer, gdyby miał emocje?",
  " Jaki jest najgorszy sposób, w jaki masturbowałeś się w życiu? (szczegóły mile widziane) ",
" Gdybyś miał przelecieć kogoś z rodziny, ale nikt by się nigdy nie dowiedział – kogo wybierasz i dlaczego? ",
" Opisz swoją najbrudniejszą fantazję, w której przynajmniej jedna osoba kończy martwa. ",
" Co byś zrobił ze zwłokami swojego największego wroga, gdybyś mógł zrobić absolutnie wszystko? ",
" Jaka jest najdziwniejsza rzecz, którą miałeś w dupie (dosłownie lub w przenośni)? ",
" Gdybyś mógł zamienić się w kobiece ciało na jeden dzień, co byś sobie najpierw zrobił? ",
" Co byś wolał: codziennie srać na środku rynku w swoim mieście czy codziennie robić loda swojemu szefowi? ",
" Jaki fetysz masz taki, że sam się czasem brzydzisz, że Cię to jara? ",
" Gdyby Twoja mama przeczytała Twoją historię przeglądarki z ostatnich 30 dni – co by ją najbardziej zabiło? ",
" Gdybyś miał zgwałcić czyjś umysł słowami, jakie pytanie byś zadał na pierwszej randce? ",
" Co jest Twoim guilty pleasure, które jest tak chore, że nigdy nikomu nie przyznałeś? ",
" Którą osobę z tej gry najchętniej byś związał i robił jej rzeczy, za które poszedłbyś siedzieć? ",
" Opisz swój idealny wieczór, w którym kończysz w kajdankach i z workiem na głowie. ",
" Jaka jest najpodlejsza rzecz, jaką zrobiłeś komuś tylko po to, żeby się podniecić? ",
" Gdybyś mógł mieć seks z dowolną postacią z bajki dla dzieci – którą wybierasz i jak dokładnie to wygląda? ",
" Co byś zrobił, gdybyś obudził się jako kobieta w ciele najbrzydszej osoby w tym czacie? ",
" Najgorsza rzecz, którą powiedziałeś komuś w łóżku i naprawdę to miałeś na myśli. ",
" Jaki jest najobrzydliwszy sposób, w jaki kiedykolwiek się wysrałeś? ",
" Opisz najgorszą rzecz, jaką kiedykolwiek zjadłeś prosto z podłogi albo ze śmietnika ",
" Gdybyś mógł ukraść jedną rzecz od każdej osoby w tym czacie i nikt by się nie dowiedział – co byś zabrał? ",
" Najbardziej obrzydliwa rzecz, jaką kiedykolwiek miałeś w ustach? ",
" Co byś zrobił, gdybyś obudził się w ciele najgrubszego / najbrzydszego człowieka w tym czacie? ",
" Opisz najgorszy smród, jaki kiedykolwiek wypuściłeś i jak to się skończyło ",
" Gdyby Twoi rodzice przeczytali wszystkie Twoje wiadomości z ostatnich 2 lat – co by ich najbardziej zajebało? ",
" Najpodlejsza rzecz, jaką zrobiłeś komuś tylko po to, żeby się zemścić? ",
" Jaki masz najgorszy nawyk, którego się wstydzisz i nigdy nikomu nie powiedziałeś? ",
" Gdybyś miał spędzić resztę życia w jednym pomieszczeniu z jedną osobą z tego czatu – kogo byś wybrał i dlaczego? ",
" Opisz najobrzydliwszy jedzenie, jakie kiedykolwiek zwymiotowałeś i potem zjadłeś znowu ",
" Co byś zrobił ze zwłokami kogoś, kogo naprawdę nienawidzisz, gdyby nikt nigdy nie mógł Cię znaleźć? ",
" Najgorsza rzecz, jaką zrobiłeś w publicznym miejscu i prawie Cię złapali ",
" Gdybyś mógł zamienić się z kimkolwiek na jeden tydzień – z kim i co byś narozrabiał w jego życiu? ",
" Jaki jest Twój największy guilty pleasure, który jest totalnie chore i obrzydliwe? ",
" Opisz najgorszą ranę albo chorobę, jaką miałeś i jak to wyglądało z bliska ",
" Co byś zrobił, gdybyś wiedział, że masz tylko 24h życia i nikt nie mógłby Cię powstrzymać? ",
" Najbardziej żenująca rzecz, jaką powiedziałeś komuś bliskiemu i potem żałowałeś przez lata ",
" Gdybyś miał codziennie jeść jedno danie zrobione z części ciała kogoś z tego czatu – co byś wybrał? ",
" Jaka jest najdziwniejsza rzecz, którą kolekcjonujesz albo ukrywasz w swoim pokoju? ",
" Wolałbyś codziennie srać w spodnie i chodzić tak cały dzień, czy codziennie wymiotować na siebie po śniadaniu? ",
" Wolałbyś jeść własne sranie przez miesiąc, czy pić własny mocz przez rok? ",
" Wolałbyś obudzić się w ciele najgrubszego i najśmierdzącego człowieka w tym czacie na zawsze, czy w ciele swojej mamy na rok? ",
" Wolałbyś lizać podłogę w publicznej toalecie, czy zjeść kanapkę ze śmietnika z robakami? ",
" Wolałbyś żeby wszyscy w tym czacie przeczytali Twoje najgorsze wiadomości z telefonu, czy żeby Twoi rodzice obejrzeli całą historię przeglądarki? ",
" Wolałbyś codziennie wąchać czyjeś brudne skarpetki przez godzinę, czy spać w łóżku pełnym czyichś włosów i paznokci? ",
" Wolałbyś mieć zawsze śmierdzący oddech jak zgniłe jaja, czy zawsze śmierdzące pachy jak stara kapusta? ",
" Wolałbyś przez rok jeść tylko jedzenie, które ktoś inny wypluł, czy nosić te same brudne gacie przez cały rok bez prania? ",
" Wolałbyś obudzić się z twarzą swojej babci, czy z tyłkiem swojego taty? ",
" Wolałbyś codziennie wymiotować zaraz po jedzeniu, czy srać się za każdym razem jak się zaśmiejesz? ",
" Wolałbyś mieszkać w pokoju pełnym karaluchów, czy w łazience pełnej ludzkich włosów z odpływu? ",
" Wolałbyś zjeść surowe mięso z zepsutego mięsa, czy wypić szklankę wody z kibla po imprezie? ",
" Wolałbyś żeby wszyscy wiedzieli o Twoim najgorszym wstydliwym sekrecie, czy żebyś musiał codziennie głośno opowiadać o tym przy stole? ",
" Wolałbyś mieć język pokryty pleśnią na zawsze, czy zęby, które kruszą się przy każdym gryzieniu? ",
" Wolałbyś spędzić miesiąc w kontenerze na śmieci, czy miesiąc w piwnicy pełnej szczurów i myszy? ",
" Wolałbyś zawsze śmierdzieć zgniłym serem, czy zawsze mieć twarz pokrytą ropnymi pryszczami? ",
" Wolałbyś jeść własne strupy i gluty, czy wąchać buty wszystkich osób z tego czatu codziennie? ",
" Wolałbyś mieć ręce zawsze lepkie od czyjegoś smarku, czy stopy zawsze mokre od czyjegoś potu? ",
" Wolałbyś codziennie pić sok z kiszonych ogórków zmieszany z czyimś potem, czy jeść chleb obtoczony w czyichś włosach? ",
" Wolałbyś zamienić się miejscami z najbrudniejszą i najśmierdząjącą osobą w tym czacie na rok, czy zjeść talerz robaków na żywca? ",
" Wolałbyś codziennie srać sobie do butów i chodzić w tym cały dzień, czy codziennie wycierać sobie twarz używaną toaletą? ",
" Wolałbyś jeść własne gluty i strupy przez miesiąc, czy pić wodę z muszli klozetowej po imprezie przez tydzień? ",
" Wolałbyś obudzić się w ciele swojej babci na miesiąc, czy w ciele najśmierdzącego typa z tego czatu na rok? ",
" Wolałbyś mieć zawsze usta pełne czyichś włosów z brody, czy nosić majtki pełne czyjegoś srania przez tydzień? ",
" Wolałbyś codziennie wąchać czyjąś dupę po sraniu przez 10 minut, czy lizać podłogę w publicznej toalecie? ",
" Wolałbyś wymiotować za każdym razem jak zjesz coś ciepłego, czy srać się w gacie za każdym razem jak się zdenerwujesz? ",
" Wolałbyś mieszkać w kontenerze na śmieci przez rok, czy spać w łóżku pełnym żywych karaluchów i robaków? ",
" Wolałbyś mieć twarz zawsze pokrytą ropą z pryszczy, czy stopy zawsze mokre i śmierdzące jak stary ser? ",
" Wolałbyś jeść kanapki zrobione z jedzenia wygrzebanego ze śmietnika, czy pić mleko zmieszane z czyimś potem? ",
" Wolałbyś żeby wszyscy w tym czacie przeczytali Twoje najgorsze sekrety z telefonu, czy żeby Twoja mama oglądała Cię nagiego przez kamerę codziennie? ",
" Wolałbyś mieć język zawsze oblepiony pleśnią, czy zęby które się kruszą i śmierdzą zgniłym mięsem? ",
" Wolałbyś spędzić tydzień w piwnicy pełnej szczurów, czy miesiąc w łazience z zatkany odpływem pełnym włosów i smarków? ",
" Wolałbyś zawsze śmierdzieć jak zgniłe jajka, czy mieć ręce zawsze lepkie od czyjegoś smarku i ropy? ",
" Wolałbyś zjeść talerz surowych robaków i glist, czy wypić szklankę wody z basenu po imprezie? ",
" Wolałbyś obudzić się z tyłkiem na twarzy, czy z twarzą swojej babci na tyłku? ",
" Wolałbyś codziennie jeść jedzenie, które ktoś inny przeżuł i wypluł, czy nosić te same skarpetki przez rok bez ściągania? ",
" Wolałbyś mieć włosy pełne wszy i gnid, czy paznokcie pełne brudu i grzyba na zawsze? ",
" Wolałbyś wąchać buty wszystkich osób z tego czatu codziennie przez godzinę, czy spać w worku pełnym czyichś obciętych paznokci? ",
" Wolałbyś mieć zawsze mokre i śmierdzące pachy jak stara kapusta, czy zawsze śmierdzący oddech jak zgnilizna? ",
" Wolałbyś zamienić się na miesiąc z najbrudniejszą osobą w grupie i żyć jej życiem, czy zjeść surowe mięso z zepsutego lodówki? "
];
let usedQuestions = [];
const avatars = ["😈", "👻", "🥸", "🤡", "💩", "👽", "👹", "🐶"];

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
function getRandomQuestion() {
  if (usedQuestions.length >= questions.length) {
    usedQuestions = [];
  }

  let question;

  do {
    question = questions[Math.floor(Math.random() * questions.length)];
  } while (usedQuestions.includes(question));

  usedQuestions.push(question);
  return question;
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
async function leaveRoom() {
  if (!myPlayerId) {
    showScreen("start");
    return;
  }

  await db
    .from("players")
    .delete()
    .eq("id", myPlayerId);

  myPlayerId = null;
  isHost = false;
  isJoining = false;
  isProcessing = false;
  lastStateKey = "";

  game = {
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

  document.getElementById("codeInput").value = "";
  showScreen("start");
}
async function kickPlayer(playerId) {
  if (!isHost) return;

  const player = game.players.find(p => p.id === playerId);

  if (!player) return;

  if (!confirm(`Wyrzucić ${player.name}?`)) return;

  await db
    .from("players")
    .delete()
    .eq("id", playerId);

  await loadPlayers();
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

  ${
    isHost && player.id !== myPlayerId
      ? `<button class="kick-btn" onclick="kickPlayer('${player.id}')">✖</button>`
      : ""
  }
`;
    list.appendChild(div);
  });
}

function copyCode() {
  const link = window.location.href.split("?")[0];

  const text = `Zagraj ze mną w "Kto to napisał?" 🎮

Link: ${link}
Kod pokoju: ${game.roomCode}`;

  navigator.clipboard.writeText(text);

  alert("Skopiowano zaproszenie z linkiem i kodem pokoju ✅");
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

  const question = getRandomQuestion();

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
const voteStatus = document.getElementById("voteStatus");
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

  if (voteStatus) {
    voteStatus.textContent = "Zagłosowano ✅ Czekamy na resztę...";
    voteStatus.classList.add("voted");
  }
} else {
  if (voteStatus) {
    voteStatus.textContent = "Wybierz autora odpowiedzi";
    voteStatus.classList.remove("voted");
  }

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

  const voteStatus = document.getElementById("voteStatus");
  if (voteStatus) {
    voteStatus.textContent = "Zagłosowano ✅ Czekamy na resztę...";
    voteStatus.classList.add("voted");
  }

  document.querySelectorAll("#guessButtons button").forEach(btn => {
    btn.disabled = true;
  });

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

  const scoreTable = document.getElementById("scoreTable");
scoreTable.innerHTML = "<p>Ranking pojawi się na końcu gry 🏁</p>";

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

 const question = getRandomQuestion();

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
