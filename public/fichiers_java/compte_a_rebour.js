
// Temps initial : 5 minutes en secondes
let timeLeft = 300;
let countdown = null; // Variable pour stocker l'intervalle
const countdownElement = document.getElementById("countdown");
const startButton = document.getElementById("startButton");

// URL vers laquelle rediriger après le compte à rebours
const redirectUrl = "quiz.html"; 

// Fonction pour formater le temps (mm:ss)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Fonction pour démarrer le compte à rebours
function startCountdown() {
    // Évite de lancer plusieurs comptes à rebours en même temps
    if (countdown !== null) {
        return;
    }
    
    // Désactive le bouton pour éviter les clics multiples
    startButton.disabled = true;
    startButton.textContent = "Compte à rebours en cours...";
    
    // Lance le compte à rebours
    countdown = setInterval(function() {
        timeLeft--;
        countdownElement.textContent = formatTime(timeLeft);
        
        // Redirection quand le temps est écoulé
        if (timeLeft <= 0) {
            clearInterval(countdown);
            window.location.href = redirectUrl;
        }
    }, 1000);
}

// Ajoute l'écouteur d'événement sur le bouton
startButton.addEventListener("click", startCountdown);