const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let gameStarted = false

app.use(express.static("public"));

let players = [];

let buildings = [
  { id: 1, name: "Gare routière", unlocked: false, enigme: "Quel est l'animal qui a le plus de dents ?",
    answer: "escargot"},
  { id: 2, name: "Hopital", unlocked: false, enigme: "Je suis jaune et je vole, qui suis-je ?", 
    answer: "Azir"},
  { id: 3, name: "Mairie", unlocked: false, enigme:"enigme", answer:"réponse"},
  { id: 4, name: "Ecole", unlocked: false, enigme: "enigme", answer: "réponse"},
  { id: 5, name: "Parc", unlocked: false, enigme: "enigme", answer: "réponse"},
  { id: 6, name: "Commerces", unlocked: false, enigme: "enigme", answer: "réponse"},
  { id: 7, name: "Zone de partage", unlocked: false, enigme: "enigme", answer: "réponse"},
  { id: 8, name: "Complexe sportif", unlocked: false, enigme: "enigme", answer: "réponse"},
  { id: 9, name: "Logements", unlocked: false, enigme: "enigme", answer: "réponse"}
];

io.on("connection", (socket) => {
  socket.emit("updatePlayers", players);
  console.log("Un joueur connecté");

  socket.on("join", (pseudo) => {
    if (gameStarted) return;

    players.push({
      id: socket.id,
      pseudo: pseudo
    });
    io.emit("updatePlayers", players);
  });
  socket.on("disconnect", () => {
  players = players.filter(
    p => p.id !== socket.id
  );
  io.emit("updatePlayers", players);
  });

  socket.on("startGame", () => {
  if (gameStarted) return;
  if (players.length < 1) return;

  gameStarted = true;
  io.emit("gameStarted");
});

  socket.emit("initBuildings", buildings);

  socket.on("unlockBuilding", (id) => {
  const b = buildings.find(b => b.id === id);

  if (b) {
    b.unlocked = true;

    io.emit("updateBuildings", buildings);
  }
  });
  socket.on("playerReady", () => {
        io.emit("startQuiz");
  });

  socket.on("quizFinished", () => {
    console.log("🔥 quizFinished reçu");
    io.emit("showEndGamePopup");
  });
  socket.on("endGame", () => {

    console.log("🔥 reset game");

    gameStarted = false;

    players = [];

    buildings = buildings.map(b => ({
      ...b,
      unlocked: false
    }));

    io.emit("updatePlayers", players);
    io.emit("updateBuildings", buildings);
  });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Serveur lancé");
});