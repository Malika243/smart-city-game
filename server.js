const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let gameStarted = false

app.use(express.static("public"));

let players = [];

let buildings = [
  { id: 1, name: "Bus and railway stations", unlocked: false, enigme: "Which vehicule does the following sound like (answer : train) ?",
    answer: "train"},
  { id: 2, name: "Hospital", unlocked: false, enigme: "Find the hidden disease", 
    answer: "tuberculosis"},
  { id: 3, name: "Town hall", unlocked: false, enigme:"Paris' most famous Anne (surname only)", answer:"hidalgo"},
  { id: 4, name: "Schools", unlocked: false, enigme: "number of buildings * number of houses - number of railway stations", answer: "47"},
  { id: 5, name: "Parks", unlocked: false, enigme: "Who won the Noughts and Crosses (X/O)?", answer: "O"},
  { id: 6, name: "Shops", unlocked: false, enigme: "What is the city's main restaurant ?", answer: "pizzeria"},
  { id: 7, name: "Sharing areas", unlocked: false, enigme: "Can you feel it ?", answer: "heart"},
  { id: 8, name: "Sports complex", unlocked: false, enigme: "Take a look at our backs", answer: "sustainable"},
  { id: 9, name: "Housing", unlocked: false, enigme: "Can you lift me up ?", answer: "hidden"}
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

  if (gameStarted && players.length === 0) {

    console.log("🔥 Plus aucun joueur -> reset complet");

    gameStarted = false;

    buildings = buildings.map(b => ({
      ...b,
      unlocked: false
    }));
  }
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