const socket = io();
let currentPlayers = [];

function join() {
  const pseudo = document.getElementById("pseudo").value;
  socket.emit("join", pseudo);
}

function startGame() {
  const button = document.getElementById("startBtn");

  if (currentPlayers.length < 1) {

    button.classList.add("shake");

    setTimeout(() => {
      button.classList.remove("shake");
    }, 400);

    return;
  }

  socket.emit("startGame");
}

function openEnigme(building) {

  const modal = document.createElement("div");
  modal.classList.add("modal");

  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-modal">
        <img src="boutonCroix.png" alt="Fermer">
      </button>
      <h2>${building.name}</h2>

      <p style="font-weight: normal;">${building.enigme}</p>

      <input type="text" id="answerInput">

      <button id="validateBtn">Valider</button>

      <p id="result"></p>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close-modal").onclick = () => {
      modal.remove();
  };

  document.getElementById("validateBtn").onclick = () => {

    const value =
      document.getElementById("answerInput").value;

    if (value.toLowerCase() === building.answer.toLowerCase()) {

      socket.emit("unlockBuilding", building.id);

      modal.remove();

      window.location.href=`${building.name}.html`;

    } else {

      document.getElementById("result").textContent = "Mauvaise réponse";

    }
  };
}

function render(buildings) {
  const grid = document.getElementById("grid");
    if (!grid) return;  //évite les erreurs si on est pas sur la page d'accueil
  grid.innerHTML = "";

  buildings.forEach(b => {
    const div = document.createElement("div");
    div.classList.add("building");

    if (b.unlocked) {
      div.classList.add("unlocked");
      div.textContent = b.name + " 🔓";
    } else {
      div.classList.add("locked");
      div.textContent = b.name + " 🔒";
    }

    div.onclick = () => {
      if (!b.unlocked) {
        openEnigme(b); 
      }
      else {
        window.location.href=`${b.name}.html`;   // du coup faut que la page est le meme nom que le bâtiment pour que ca marche
      }
    };

    grid.appendChild(div);
  });
}

socket.on("updatePlayers", (players) => {
  currentPlayers = players;
  const container = document.getElementById("players");
  if (container) {
    container.innerHTML = "";

    players.forEach(player => {
      const div = document.createElement("div");
      div.classList.add("player-card");
      div.textContent = player.pseudo;
      container.appendChild(div);
    });
  }
});

socket.on("gameStarted", () => {
  window.location.href="accueil.html"
});

socket.on("initBuildings", (buildings) => {
  render(buildings);
});

socket.on("updateBuildings", (buildings) => {
  render(buildings);
});


// -------------------------------------------------------Compte à rebours------------------------------------------------

let intervalId = null;
  /*const compteurSpan = document.getElementById('compteur');*/
  let compteurSpan = null;

// Stocker l'heure de fin (timestamp) dans localStorage
function sauvegarderHeureFin(timestamp) {
  localStorage.setItem('compteRebours_fin', timestamp);
}

// Récupérer l'heure de fin stockée (ou null)
function getHeureFinStockee() {
  const ts = localStorage.getItem('compteRebours_fin');
  if (!ts) return null;
  const timestamp = parseInt(ts, 10);
  return isNaN(timestamp) ? null : timestamp;
}

// Effacer le stockage
function effacerStockage() {
  localStorage.removeItem('compteRebours_fin');
}

// Calculer le temps restant (format mm:ss) à partir d'un timestamp de fin
function calculerTempsRestant(timestampFin) {
  const maintenant = Date.now();
  const diffMs = timestampFin - maintenant;
  if (diffMs <= 0) return "00:00";
  const secondesTotales = Math.floor(diffMs / 1000);
  const minutes = Math.floor(secondesTotales / 60);
  const secondes = secondesTotales % 60;
  return `${minutes.toString().padStart(2, '0')}:${secondes.toString().padStart(2, '0')}`;
}

// Mettre à jour l'affichage selon un timestamp de fin
function mettreAJourAffichage(timestampFin) {
  if (!compteurSpan) return;
  const tempsRestant = calculerTempsRestant(timestampFin);
  compteurSpan.innerText = tempsRestant;
  if (tempsRestant === "00:00") {
      if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
      }
      effacerStockage();
      compteurSpan.innerText = "Temps écoulé !";
       ouvrirPopupPret();
  }
}

// Démarrer le compte à rebours (ou le restaurer) à partir d'un timestamp de fin
function demarrerCompteRebours(timestampFin) {
  // Arrêter l'ancien intervalle s'il existe
  if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
  }

  // Mise à jour immédiate
  mettreAJourAffichage(timestampFin);

  // Lancer l'intervalle seulement si le temps n'est pas déjà écoulé
  if (calculerTempsRestant(timestampFin) !== "00:00") {
      intervalId = setInterval(() => {
          mettreAJourAffichage(timestampFin);
      }, 1000);
  } else {
      effacerStockage();
      if (compteurSpan) window.location.href ="quiz.html"; // Redirection quand le temps est écoulé
  }
}

// Nouveau départ : depuis les minutes choisies par l'utilisateur
function nouveauCompteRebours(minutes) {
  const timestampFin = Date.now() + minutes * 60000;
  sauvegarderHeureFin(timestampFin);
  demarrerCompteRebours(timestampFin);
}

// Au chargement de la page : restaurer un éventuel compte à rebours existant
function restaurerCompteRebours() {
  /*if (!compteurSpan) return;
  const timestampFin = getHeureFinStockee();
  if (timestampFin && timestampFin > Date.now()) {
      // Il y a une heure de fin valide dans le futur
      demarrerCompteRebours(timestampFin);
  } else if (timestampFin && timestampFin <= Date.now()) {
      // Stockage obsolète, on nettoie
      effacerStockage();
      compteurSpan.innerText = "Aucun compte à rebours actif";
  } else {
      compteurSpan.innerText = "Aucun compte à rebours actif";
  }*/
 compteurSpan = document.getElementById('compteur');

  if (!compteurSpan) return;

  const timestampFin = getHeureFinStockee();
  console.log(timestampFin);

  if (timestampFin && timestampFin > Date.now()) {

      demarrerCompteRebours(timestampFin);

  } else if (timestampFin && timestampFin <= Date.now()) {

      effacerStockage();

      compteurSpan.innerText = "Temps écoulé !";

  } else {

      compteurSpan.innerText =
        "Aucun compte à rebours actif";
  }
}

// --- Initialisation du compte à rebours avec gestion de l'absence des éléments HTML ---
const startBtn = document.getElementById('startBtn');
const minutesInput = document.getElementById('minutesInput');

if (startBtn && minutesInput) {
  startBtn.addEventListener('click', () => {
    const minutes = parseInt(minutesInput.value, 10);
    if (isNaN(minutes) || minutes <= 0) {
      alert("Entrez un nombre de minutes valide");
      return;
    }
    nouveauCompteRebours(minutes);
  });
}

// Lancer la restauration au chargement (même si les éléments sont absents)
restaurerCompteRebours();

/*SLIDE CAROUSEL POUR MOBILE JCROIS*/
const sliders = document.querySelectorAll(".section-card");

sliders.forEach(slider => {

    const slides = slider.querySelectorAll(".slide");

    const dots = slider.querySelectorAll(".dot");

    const leftBtn = slider.querySelector(".left");
    const rightBtn = slider.querySelector(".right");

    let current = 0;

    function showSlide(index) {

        slides.forEach(slide => {
            slide.classList.remove("active");
        });

        dots.forEach(dot => {
            dot.classList.remove("active");
        });

        slides[index].classList.add("active");
        dots[index].classList.add("active");
    }

    rightBtn.addEventListener("click", () => {

        current++;

        if(current >= slides.length) {
            current = 0;
        }

        showSlide(current);
    });

    leftBtn.addEventListener("click", () => {

        current--;

        if(current < 0) {
            current = slides.length - 1;
        }

        showSlide(current);
    });

    /* SWIPE MOBILE */

    let startX = 0;

    slider.addEventListener("touchstart", e => {
        startX = e.touches[0].clientX;
    });

    slider.addEventListener("touchend", e => {

        let endX = e.changedTouches[0].clientX;

        let diff = startX - endX;

        if(diff > 50) {

            current++;

            if(current >= slides.length) {
                current = 0;
            }

            showSlide(current);
        }

        if(diff < -50) {

            current--;

            if(current < 0) {
                current = slides.length - 1;
            }

            showSlide(current);
        }
    });

});

/* POPUP POUR PASSER AU QUIZ */
function ouvrirPopupPret() {

    // évite plusieurs popups
    if(document.querySelector(".ready-modal")) return;

    const modal = document.createElement("div");

    modal.classList.add("modal", "ready-modal");

    modal.innerHTML = `

        <div class="modal-content">

            <h2>Temps écoulé !</h2>

            <p style="font-weight: normal;">
                Tout le monde doit être prêt avant de commencer le quiz.
            </p>

            <button id="readyBtn">
                Prêt
            </button>

        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("readyBtn").onclick = () => {

        socket.emit("playerReady");
    };
}

socket.on("startQuiz", () => {
    window.location.href = "quiz.html";
});

socket.on("gameReset", () => {
  window.location.href = "index.html";
});

socket.on("showEndGamePopup", () => {
  console.log("🔥 popup reçu");

  if (document.querySelector(".end-modal")) return;

  const modal = document.createElement("div");
  modal.classList.add("modal", "end-modal");

  modal.innerHTML = `
    <div class="modal-content">
      <h2>Fin du jeu</h2>
      <p id="countdownText">
        Redirection dans 10 secondes...
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  let countdown = 5;

  const interval = setInterval(() => {

    countdown--;

    document.getElementById("countdownText").textContent =
      `Redirection dans ${countdown} secondes...`;

    if (countdown <= 0) {

      clearInterval(interval);

      // reset serveur
      socket.emit("endGame");

      // redirect
      window.location.href = "index.html";
    }

  }, 1000);
});