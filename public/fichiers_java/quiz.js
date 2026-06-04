// ---------- BASE DE DONNÉES DU QUIZ ----------
const questions = [
    {
        text: "What percentage of passengers experienced delays of more than 30 minutes?",
        options: ["11%", "17%", "21%", "27%"],
        correct: [2],
        maxChoices: 4
    },
    {
        text: "What standards should a shop meet ?",
        options: ["work with local producers exclusively", "be close to housings", "be huge in order to better manage large numbers of people", "prioritise seasonal and local products"],
        correct: [0, 2],
        maxChoices: 4
    },
    {
        text: "Which company is using the heat produced by it's AI to heat homes in switzerland ?",
        options: ["Riot company", "Microsoft", "Google", "Infomaniak"],
        correct: [3],
        maxChoices: 4
    }/*,
    {
        text: "Question 4 ?",
        options: ["answer1", "answer2", "answer3", "answer4"],
        correct: [3],
        maxChoices: 1
    },
    {
        text: "Question 5 ?",
        options: ["answer1", "answer2", "answer3", "answer4"],
        correct: [3],
        maxChoices: 1
    },
    {
        text: "Question 6 ?",
        options: ["answer1", "answer2", "answer3", "answer4"],
        correct: [3],
        maxChoices: 1
    },
    {
        text: "Question 7 ?",
        options: ["answer1", "answer2", "answer3", "answer4"],
        correct: [3],
        maxChoices: 1
    },
    {
        text: "Question 8 ?",
        options: ["answer1", "answer2", "answer3", "answer4"],
        correct: [3],
        maxChoices: 1
    },
    {
        text: "Question 9 ?",
        options: ["answer1", "answer2", "answer3", "answer4"],
        correct: [3],
        maxChoices: 1
    },
    {
        text: "Question 10 ?",
        options: ["answer1", "answer2", "answer3", "answer4"],
        correct: [3],
        maxChoices: 1
    }*/
];

let currentIndex = 0;
let userAnswers = new Array(questions.length).fill(null).map(() => []);

const questionCounterElem = document.getElementById("questionCounter");
const questionTextElem = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const validateBtn = document.getElementById("validateBtn");
const resultMessageDiv = document.getElementById("resultMessage");

// ----- Fonctions utilitaires -----
function getSelectedIndices() {
    const checkboxes = document.querySelectorAll('#optionsContainer input[type="checkbox"]');
    const selected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) selected.push(parseInt(cb.value));
    });
    return selected;
}

function saveCurrentAnswers() {
    userAnswers[currentIndex] = getSelectedIndices();
}

function setLimitMessage(limit) {
    if (limit) {
        resultMessageDiv.innerHTML = `⚠️ Tu ne peux sélectionner que ${limit} réponse(s) maximum.`;
    } else {
        resultMessageDiv.innerHTML = "";
    }
}

// Animation sur le bouton
function animateButton() {
    validateBtn.classList.add('shake');
    setTimeout(() => {
        validateBtn.classList.remove('shake');
    }, 500);
}

// Gestion de la limitation du nombre de cases
function attachLimitHandlers() {
    const q = questions[currentIndex];
    const maxChoices = q.maxChoices;
    if (!maxChoices || maxChoices <= 0) return;

    const checkboxes = document.querySelectorAll('#optionsContainer input[type="checkbox"]');
    const handler = function(event) {
        const cb = event.target;
        const currentlyChecked = getSelectedIndices().length;
        if (!cb.checked && currentlyChecked >= maxChoices) {
            event.preventDefault();
            setLimitMessage(maxChoices);
            animateButton(); // Animation aussi quand on tente de dépasser la limite
        } else {
            setLimitMessage(null);
            setTimeout(() => saveCurrentAnswers(), 0);
        }
    };
    checkboxes.forEach(cb => {
        cb.removeEventListener('click', handler);
        cb.addEventListener('click', handler);
    });
}

function displayCurrentQuestion() {
    const q = questions[currentIndex];
    if (!q) return;

    questionCounterElem.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
    questionTextElem.innerHTML = `<p>${q.text}</p>`;

    let optionsHtml = "";
    const savedChecks = userAnswers[currentIndex] || [];
    q.options.forEach((opt, idx) => {
        const optionId = `opt_${currentIndex}_${idx}`;
        const isChecked = savedChecks.includes(idx);
        optionsHtml += `
            <input type="checkbox" id="${optionId}" name="questionOption" value="${idx}" ${isChecked ? 'checked' : ''}>
            <label for="${optionId}" class="quiz-card">${opt}</label>
        `;
    });
    optionsContainer.innerHTML = optionsHtml;
    resultMessageDiv.innerHTML = "";

    attachLimitHandlers();

    if (!questions[currentIndex].maxChoices) {
        const checkboxes = document.querySelectorAll('#optionsContainer input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => saveCurrentAnswers());
        });
    }
}

function computeScore() {
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
        const userSelected = userAnswers[i];
        const correctIndices = questions[i].correct;
        const isExactlyCorrect = 
            userSelected.length === correctIndices.length &&
            correctIndices.every(idx => userSelected.includes(idx));
        if (isExactlyCorrect) score++;
    }
    return score;
}

function onValidate() {
    // Vérifier qu'au moins une case est cochée
    const selected = getSelectedIndices();
    if (selected.length === 0) {
        // Afficher un message et lancer l'animation
        validateBtn.classList.add("shake");
        animateButton();
        return;
    }

    // Sauvegarde
    saveCurrentAnswers();

    // Dernière question ?
    if (currentIndex + 1 === questions.length) {
        /*const score = computeScore();
        questionTextElem.innerHTML = "<p>Quiz terminé !</p>";
        optionsContainer.innerHTML = "";
        validateBtn.style.display = "none";
        resultMessageDiv.innerHTML = `🎉 Ton score : ${score} / ${questions.length} 🎉`;
        questionCounterElem.textContent = "Résultat";
        return;*/
        window.location.href = "quizz.html";
        return;
    }

    // Passer à la question suivante
    currentIndex++;
    displayCurrentQuestion();
}

// Initialisation
displayCurrentQuestion();
validateBtn.addEventListener("click", onValidate);