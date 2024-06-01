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
    const challengeDialog = document.getElementById("challenge-dialog");
    const challengeBody = challengeDialog.querySelector(".challenge-body");
    challengeBody.innerHTML = "";

    const submitChallenge = document.getElementById("submit-challenge");
    submitChallenge.addEventListener("click", () => {
        closeChallenge();
    });

    const challengeFooter = challengeDialog.querySelector(".challenge-footer");
    challengeFooter.classList.remove("hidden")

    switch (challenge.type) {
        case "question":
            const challengeAnswerTemplate = document.getElementById("challenge-answer-template");
            challenge.answers.forEach(answer => {
                const challengeAnswer = challengeAnswerTemplate.content.cloneNode(true).querySelector("button");
                challengeAnswer.textContent = answer;
                challengeAnswer.addEventListener("click", () => {
                    challengeAnswer.classList.remove("button-secondary");
                    challengeAnswer.classList.add("button-primary");
                    setTimeout(() => {
                        closeChallenge();
                    }, 500)
                });
                challengeBody.appendChild(challengeAnswer);
            });
            challengeFooter.classList.add("hidden");
            break;
        case "rating":
            const challengeRatingTemplate = document.getElementById("challenge-rating-template");
            const challengeRating = challengeRatingTemplate.content.cloneNode(true).querySelector("input");
            challengeRating.min = challenge.range.min;
            challengeRating.max = challenge.range.max;
            challengeRating.step = challenge.range.step;
            challengeRating.value = challenge.range.min;
            challengeBody.appendChild(challengeRating);
            break;
        case "ranking":
            const challengeRankingTemplate = document.getElementById("challenge-ranking-template");
            const rankingItemsList = document.createElement("ul");
            challenge.answers.forEach(answer => {
                const challengeRanking = challengeRankingTemplate.content.cloneNode(true).querySelector("li");
                challengeRanking.textContent = answer;
                rankingItemsList.appendChild(challengeRanking);
            });
            challengeBody.appendChild(rankingItemsList);
            break;
    }
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