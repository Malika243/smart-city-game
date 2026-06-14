const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let gameStarted = false

app.use(express.static("public"));

let players = [];

let activeBuildings = {}; // stocke les ID des bâtiments en cours d'exploration ({2 : true})

let buildings = [
  { id: 1, name: "Bus and railway stations", unlocked: false, enigme: "Which vehicule does the following sound like ?",
    answer: "train", audioFile: "train_sound.mp3"},
  { id: 2, name: "Hospital", unlocked: false, enigme: "Find the hidden disease", 
    answer: "tuberculosis"},
  { id: 3, name: "Town hall", unlocked: false, enigme:"Paris' most famous Anne (surname only)", answer:"hidalgo"},
  { id: 4, name: "Schools", unlocked: false, enigme: "number of buildings * number of houses - number of railway stations", answer: "47"},
  { id: 5, name: "Parks", unlocked: false, enigme: "Who won the Noughts and Crosses (X/O)?", answer: "X"},
  { id: 6, name: "Shops", unlocked: false, enigme: "What is the city's main restaurant ?", answer: "pizzeria"},
  { id: 7, name: "Sharing areas", unlocked: false, enigme: "I am the only fruit here", answer: "tomato"},
  { id: 8, name: "Sports complex", unlocked: false, enigme: "Take a look at our backs", answer: "sustainable"},
  { id: 9, name: "Housing", unlocked: false, enigme: "Can you lift me up ?", answer: "cooperative"}
];

// ---------- État du quiz collaboratif ----------
let quizState = {
  isActive: false,
  currentQuestionIndex: 0,
  teamAnswers: [], // Stocke les réponses de l'équipe pour chaque question
  allAnswers: [], // Tableau des réponses pour toutes les questions
  quizStartTime: null,
  questionStartTime: null,
  timerTimeout: null
};

const quizQuestions = [
  {
    text: "What percentage of passengers experienced delays of more than 30 minutes?",
    options: ["11%", "17%", "21%", "27%"],
    correct: [2],
    maxChoices: 4,
    explanation: "Selon l'étude, 21% des passagers ont subi un retard de plus de 30 minutes."
  },
  {
    text: "What standards should a shop meet ?",
    options: ["work with local producers exclusively", "be close to housings", "be huge in order to better manage large numbers of people", "prioritise seasonal and local products"],
    correct: [0, 2],
    maxChoices: 4,
    explanation: "Les commerces devraient travailler avec des producteurs locaux et privilégier les produits de saison."
  },
  {
    text: "Which company is using the heat produced by its AI to heat homes in Switzerland ?",
    options: ["Riot company", "Microsoft", "Google", "Infomaniak"],
    correct: [3],
    maxChoices: 4,
    explanation: "Infomaniak utilise la chaleur générée par son IA pour chauffer des logements en Suisse."
  }
];

// Calculer le score final
function calculateFinalScore() {
  let score = 0;
  const results = [];
  
  for (let i = 0; i < quizQuestions.length; i++) {
    const userAnswers = quizState.allAnswers[i] || [];
    const correctAnswers = quizQuestions[i].correct;
    const isCorrect = userAnswers.length === correctAnswers.length &&
      correctAnswers.every(idx => userAnswers.includes(idx));
    
    if (isCorrect) score++;
    
    results.push({
      questionIndex: i,
      questionText: quizQuestions[i].text,
      userAnswers: userAnswers,
      correctAnswers: correctAnswers,
      options: quizQuestions[i].options,
      isCorrect: isCorrect,
      explanation: quizQuestions[i].explanation
    });
  } 

  return { score, total: quizQuestions.length, results };
}

// Fonction pour passer à la question suivante
function nextQuestion() {
  quizState.currentQuestionIndex++;
  
  if (quizState.currentQuestionIndex >= quizQuestions.length) {
    // Quiz terminé - on affiche la correction finale
    console.log("🏁 Quiz terminé ! Affichage de la correction finale");
    const finalResults = calculateFinalScore();
    
    io.emit("quizFinished", {
      score: finalResults.score,
      total: finalResults.total,
      results: finalResults.results
    });
    
    // Réinitialiser après 15 secondes (pour laisser le temps de lire)
    setTimeout(() => {
      quizState = {
        isActive: false,
        currentQuestionIndex: 0,
        teamAnswers: [],
        allAnswers: [],
        quizStartTime: null,
        questionStartTime: null,
        timerTimeout: null
      };
    }, 15000);
    return;
  }
  
  // Passer à la question suivante
  quizState.teamAnswers = [];
  quizState.questionStartTime = Date.now();
  
  const currentQuestion = quizQuestions[quizState.currentQuestionIndex];
  
  console.log(`📤 Envoi de la question ${quizState.currentQuestionIndex + 1}`);
  
  io.emit("nextQuestion", {
    index: quizState.currentQuestionIndex,
    question: currentQuestion,
    totalQuestions: quizQuestions.length,
    questionNumber: quizState.currentQuestionIndex + 1,
    teamAnswers: quizState.teamAnswers
  });
  
  // Nettoyer l'ancien timeout s'il existe
  if (quizState.timerTimeout) {
    clearTimeout(quizState.timerTimeout);
  }
  
  // Timer automatique de 30 secondes
  quizState.timerTimeout = setTimeout(() => {
    console.log("⏰ Timer écoulé, auto-sauvegarde de la réponse...");
    if (quizState.isActive && quizState.questionStartTime) {
      const timeElapsed = Date.now() - quizState.questionStartTime;
      if (timeElapsed >= 30000) {
        autoSaveAnswer();
      }
    }
  }, 30000);
}

// Sauvegarde automatique si le temps est écoulé
function autoSaveAnswer() {
  if (quizState.teamAnswers.length > 0 || quizState.allAnswers[quizState.currentQuestionIndex]) {
    saveCurrentAnswerAndContinue();
  } else {
    console.log("Aucune réponse sélectionnée, sauvegarde d'une réponse vide");
    quizState.allAnswers[quizState.currentQuestionIndex] = [];
    saveCurrentAnswerAndContinue();
  }
}

function saveCurrentAnswerAndContinue() {
  if (!quizState.allAnswers[quizState.currentQuestionIndex]) {
    quizState.allAnswers[quizState.currentQuestionIndex] = [...quizState.teamAnswers];
  }
  
  setTimeout(() => {
    if (quizState.isActive) {
      nextQuestion();
    }
  }, 1000);
}

// ==================== GESTION DU SOCKET (CORRIGÉ) ====================
io.on("connection", (socket) => {

  // Quand la page d'un joueur se charge ou se recharge
  socket.on("demanderEtatBatiment", () => {
    io.emit('batimentActuel', activeBuildings);
  });

  // INSTANTANÉ : Dès qu'un joueur clique et entre dans une énigme
  socket.on("playerEntersEnigme", (buildingId) => {
    const currentBuilding = buildings.find(b => b.id === buildingId);
    
    // Si l'énigme est déjà réussie, on s'arrête là pour laisser la LED fixe
    if (currentBuilding && currentBuilding.unlocked) {
      return;
    }

    console.log(`Le joueur commence l'énigme : ${buildingId}`);
    
    // On passe direct l'état à true pour la page /esp-status
    activeBuildings[buildingId] = true; 
    
    // On met à jour l'affichage de tous les navigateurs
    io.emit('batimentActuel', activeBuildings);
  });

  socket.emit("updatePlayers", players);
  console.log("Joueur connecté");

  socket.on("join", (pseudo) => {
    if (gameStarted) return;

    players.push({
      id: socket.id,
      pseudo: pseudo
    });
    io.emit("updatePlayers", players);
  });
  
  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit("updatePlayers", players);

    if (gameStarted && players.length === 0) {
      console.log("🔥 Plus aucun joueur -> reset complet");
      gameStarted = false;
      buildings = buildings.map(b => ({
        ...b,
        unlocked: false
      }));
      activeBuildings = {};
      
      quizState = {
        isActive: false,
        currentQuestionIndex: 0,
        teamAnswers: [],
        allAnswers: [],
        quizStartTime: null,
        questionStartTime: null,
        timerTimeout: null
      };
    }
  });

  socket.on("buildingOpened", (id) => {
    console.log("🏢 BATIMENT OUVERT :", id);
    activeBuildings[id] = true; 
    io.emit("updateBuildings", buildings); 
  });

  socket.on("buildingClosed", (id) => {
    console.log("❌ BATIMENT FERME :", id);
    delete activeBuildings[id]; 
  });

  socket.on("unlockBuilding", (id) => {
    const b = buildings.find(b => b.id === id);
    if (b) {
      b.unlocked = true;
      delete activeBuildings[id]; // Plus en exploration car validé !
      io.emit("updateBuildings", buildings);
    }
  });

  socket.on("startGame", () => {
    if (gameStarted) return;
    if (players.length < 1) return;

    gameStarted = true;
    io.emit("gameStarted");
  });

  socket.emit("initBuildings", buildings);
  
  socket.on("playerReady", () => {
    io.emit("startQuiz");
  });
  
  // ---------- Quiz collaboratif ----------
  socket.on("startQuizGame", () => {
    console.log("🎮 Démarrage du quiz collaboratif");
    quizState.isActive = true;
    quizState.currentQuestionIndex = 0;
    quizState.teamAnswers = [];
    quizState.allAnswers = [];
    quizState.timerTimeout = null;
    
    const firstQuestion = quizQuestions[0];
    io.emit("nextQuestion", {
      index: 0,
      question: firstQuestion,
      totalQuestions: quizQuestions.length,
      questionNumber: 1,
      teamAnswers: []
    });
    
    quizState.timerTimeout = setTimeout(() => {
      if (quizState.isActive) {
        autoSaveAnswer();
      }
    }, 30000);
  });
  
  socket.on("updateTeamAnswer", (data) => {
    if (!quizState.isActive) return;
    
    const { answers } = data;
    quizState.teamAnswers = answers;
    
    io.emit("teamAnswersUpdated", {
      teamAnswers: quizState.teamAnswers,
      questionIndex: quizState.currentQuestionIndex
    });
  });
  
  socket.on("validateTeamAnswer", () => {
    if (!quizState.isActive) return;
    
    quizState.allAnswers[quizState.currentQuestionIndex] = [...quizState.teamAnswers];
    
    if (quizState.timerTimeout) {
      clearTimeout(quizState.timerTimeout);
    }
    
    io.emit("answerValidated", {
      questionIndex: quizState.currentQuestionIndex,
      nextQuestionNumber: quizState.currentQuestionIndex + 2
    });
    
    setTimeout(() => {
      if (quizState.isActive) {
        nextQuestion();
      }
    }, 1500);
  });
  
  socket.on("endGame", () => {
    console.log("🔥 reset game");
    gameStarted = false;
    players = [];
    activeBuildings = {};

    buildings = buildings.map(b => ({
      ...b,
      unlocked: false
    }));
    
    quizState = {
      isActive: false,
      currentQuestionIndex: 0,
      teamAnswers: [],
      allAnswers: [],
      quizStartTime: null,
      questionStartTime: null,
      timerTimeout: null
    };
    
    io.emit("updatePlayers", players);
    io.emit("updateBuildings", buildings);
  });
});

// ---------- URL DE STATUT POUR L'ESP32 ----------
app.get("/esp-status", (req, res) => {
  let statusList = {};

  buildings.forEach(b => {
    if (b.unlocked) {
      statusList[b.id] = 2; // Réussie -> LED Fixe
    } else if (activeBuildings[b.id]) {
      statusList[b.id] = 1; // Ouverte / En cours -> LED Clignote
    } else {
      statusList[b.id] = 0; // Pas commencée -> LED Éteinte
    }
  });

  res.json(statusList);
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});