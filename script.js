import * as signalR from '@microsoft/signalr';
import * as challenges from './challenges.json';

let connection;
let verticalInterval;
let horizontalInterval;
let challengesCompleted = 0;

document.addEventListener('DOMContentLoaded', function () {
    initializeServerConnection();

    connection.on("PlayerMoved", (x, y) => {
        updateMapPosition(x, y);
    });

    const verticalSlider = document.getElementById("vertical-slider");
    const horizontalSlider = document.getElementById("horizontal-slider");
    verticalSlider.addEventListener("input", (event) => verticalSliderChanged(event.target.value));
    horizontalSlider.addEventListener("input", (event) => horizonalSliderChanged(event.target.value));

    verticalSliderChanged(verticalSlider.value);
    horizonalSliderChanged(horizontalSlider.value);

    document.getElementById("navigation-select").addEventListener("change", navigationChanged);
    navigationChanged();

    document.getElementById("show-challenge").addEventListener("click", showChallenge);

    // TODO: add logic to sync position between players, so that they are always at the same position and receive the challenges at the same time
    // TODO: add introduction screen
    // TODO: add matching screen
    // TODO: add result screen
    updateMapPosition(0, 0);
    updateChallengeCounter();
});

function updateChallengeCounter() {
    const challengeCounter = document.getElementById("challenge-counter");
    challengeCounter.textContent = `${challengesCompleted} / ${challenges.challenges.length}`;

}

function showChallenge() {
    const challenge = challenges.challenges[challengesCompleted];
    if (!challenge) {
        alert("All challenges completed!");
        return;
    }

    const challengeInstruction = document.getElementById("challenge-instruction");
    challengeInstruction.textContent = challenge.instruction;
    const challengeRating = document.getElementById("challenge-rating");

    switch (challenge.type) {
        case "question":
            const challengeQuestions = document.getElementById("challenge-answers");
            challengeQuestions.innerHTML = "";
            challenge.answers.forEach(answers => {
                const answerButton = document.createElement("button");
                answerButton.textContent = answers;
                answerButton.classList.add("challenge-answer", "button-secondary");
                answerButton.addEventListener("click", () => {
                    answerButton.classList.remove("button-secondary");
                    answerButton.classList.add("button-primary");
                    setTimeout(() => {
                        closeChallenge();
                    }, 500)
                });
                challengeQuestions.appendChild(answerButton);
            });
            challengeRating.style.display = "none";
            break;
        case "rating":
            challengeRating.innerHTML = "";
            challengeRating.style.display = "block";
            const challengeRatingSlider = document.createElement("input");
            challengeRatingSlider.type = "range";
            challengeRatingSlider.min = challenge.range.min;
            challengeRatingSlider.max = challenge.range.max;
            challengeRatingSlider.step = challenge.range.step;
            challengeRatingSlider.value = challenge.range.min;
            challengeRatingSlider.addEventListener("focusout", (event) => {
                closeChallenge();
            });
            challengeRating.appendChild(challengeRatingSlider);
            break;
        case "ranking":
            // TODO: Implement ranking logic
            break;
    }

    const challengeDialog = document.getElementById("challenge-dialog");
    challengeDialog.showModal();
}

function closeChallenge() {
    const challengeDialog = document.getElementById("challenge-dialog");
    challengeDialog.close();
    challengesCompleted++;
    updateChallengeCounter();
}

function updateMapPosition(x, y,) {
    const map = document.getElementById("map");
    const currentTop = parseInt(map.style.top || 0);
    map.style.top = (currentTop + y) + 'px';
    const currentLeft = parseInt(map.style.left || 0);
    map.style.left = (currentLeft + x) + 'px';
}

function verticalSliderChanged(value) {
    clearInterval(verticalInterval);
    if (value == 1) return;
    verticalInterval = setInterval(() => moveMap({ x: 0, y: 1 - value }), 10);
}

function horizonalSliderChanged(value) {
    clearInterval(horizontalInterval);
    if (value == 1) return;
    horizontalInterval = setInterval(() => moveMap({ x: 1 - value, y: 0 }), 10);
}

async function moveMap(movement) {
    try {
        await connection.invoke("MovePlayer", movement.x, movement.y);
    }
    catch (error) {
        console.error(error);
    }
}

function navigationChanged() {
    const navigationSelect = document.getElementById("navigation-select");
    if (navigationSelect.value === "horizontal") {
        document.getElementById("horizontal-slider").style.display = "block";
        document.getElementById("vertical-slider").style.display = "none";
    } else {
        document.getElementById("horizontal-slider").style.display = "none";
        document.getElementById("vertical-slider").style.display = "block";
    }
}

function initializeServerConnection() {
    connection = new signalR.HubConnectionBuilder()
        // .withUrl("https://localhost:5001/navigationhub", { withCredentials: false, skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets })
        .withUrl("https://trialperiodserver.azurewebsites.net/navigationhub", { withCredentials: false, skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    async function startSignalRConnection() {
        try {
            await connection.start();
            console.log("SignalR Connected.");
        } catch (error) {
            console.log(error);
        }
    }

    connection.onclose(async () => {
        await startSignalRConnection();
    });
    startSignalRConnection();
}