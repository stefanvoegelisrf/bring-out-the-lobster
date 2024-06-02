import * as signalR from '@microsoft/signalr';
import * as challenges from './challenges.json';

let connection;
let verticalInterval;
let horizontalInterval;
let challengesCompleted = 0;
let userId = self.crypto.randomUUID();
let matchingUserId;
let userMatchFindingInterval;
let healthCheckInterval;
let lastHealthCheckReceived;
let selectedDefiningCharacteristic;
let definingCharacteristicSelectedTimestamp;
let challengeResults = [];
let matchingUserResults = [];
// TODO: add logic to check if the matching player is connected, otherwise pause and wait for the player to connect
// TODO: add logic to pause navigation when challenge is open
document.addEventListener('DOMContentLoaded', function () {

    initializeServerConnection();

    const userIdInput = document.getElementById("user-id");
    userIdInput.value = userId;

    const verticalSlider = document.getElementById("vertical-slider");
    const horizontalSlider = document.getElementById("horizontal-slider");
    verticalSlider.addEventListener("input", (event) => verticalSliderChanged(event.target.value));
    horizontalSlider.addEventListener("input", (event) => horizonalSliderChanged(event.target.value));

    verticalSliderChanged(verticalSlider.value);
    horizonalSliderChanged(horizontalSlider.value);

    document.getElementById("navigation-select").addEventListener("change", navigationChanged);

    document.getElementById("show-challenge").addEventListener("click", showChallenge);

    // TODO: add result screen
    setInitialMapPosition();
    updateMapPosition(0, 0);
    initializeChallengeCounter();
    document.getElementById("intro-screen").addEventListener('click', hideIntroScreen);
    document.addEventListener("keypress", (event) => {
        // Show/hide settings when pressing 's'
        if (event.key === "s") {
            const settings = document.getElementById("settings");
            if (settings.classList.contains("hidden")) {
                settings.classList.remove("hidden");
            } else {
                settings.classList.add("hidden");
            }
        }
    })
});

function hideIntroScreen() {
    document.getElementById('intro-screen').style.display = 'none';
    findMatch();
}

/* Matching */

function createLoadingSpinner() {
    const loadingSpinner = document.createElement("span");
    loadingSpinner.classList.add("loading-spinner");
    return loadingSpinner;
}

function findMatch() {
    const pairUpMessage = document.getElementById("pair-up-message");
    const message = document.createElement("span");
    message.textContent = "Choosing your partner";
    pairUpMessage.appendChild(message);
    pairUpMessage.appendChild(createLoadingSpinner());
    const pairUpDialog = document.getElementById("pair-up-dialog");
    pairUpDialog.showModal();
    userMatchFindingInterval = setInterval(() => {
        connection.invoke("FindMatch", userId);
        if (matchingUserId) {
            clearInterval(userMatchFindingInterval);
            pairUpMessage.textContent = "Partner assigned! Choose your defining characteristic:";
            showPairUpOptions();
            healthCheckInterval = setInterval(() => {
                connection.invoke("SendHealth", userId);
            }, 1000);
        }
    }, 1000);
}

function sendDefiningCharacteristic(event) {
    const definingCharacteristicId = event.target.dataset.value;
    selectedDefiningCharacteristic = definingCharacteristicId;
    definingCharacteristicSelectedTimestamp = new Date();
    console.log("Sending defining characteristic", definingCharacteristicId);
    connection.invoke("SendDefiningCharacteristic", definingCharacteristicId, userId, definingCharacteristicSelectedTimestamp.toString());
}

function onDefiningCharacteristicSent(characteristic, initiatingUserId, timestamp) {
    if (initiatingUserId != matchingUserId) return;
    if (selectedDefiningCharacteristic) {
        verifyDefiningCharacteristic(characteristic, timestamp);
    }
    else {
        let verifyCharacteristicInterval = setInterval(() => {
            if (selectedDefiningCharacteristic) {
                clearInterval(verifyCharacteristicInterval);
                verifyDefiningCharacteristic(characteristic, timestamp);
            }
        }, 200)
    }

}

function verifyDefiningCharacteristic(characteristic, timestamp) {
    if (characteristic == selectedDefiningCharacteristic) {
        let timestampAsDate = new Date(timestamp);
        if (timestampAsDate > definingCharacteristicSelectedTimestamp) {
            showVerticalSlider();
        }
        else {
            showHorizontalSlider();
        }
        startNavigationOnMap();
    }
    else {
        updateMatchingUserId(null);
        selectedDefiningCharacteristic = null;
        clearInterval(healthCheckInterval);
        hidePairUpOptions();
        findMatch();
    }
    const pairUpDialog = document.getElementById("pair-up-dialog");
    pairUpDialog.close();
}

function showPairUpOptions() {
    const pairUpOptions = document.getElementById("pair-up-options");
    pairUpOptions.classList.remove("hidden");
    pairUpOptions.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", (event) => {
            button.classList.remove("button-secondary");
            button.classList.add("button-primary");
            sendDefiningCharacteristic(event);
        });
    });
}

function hidePairUpOptions() {
    const pairUpOptions = document.getElementById("pair-up-options");
    pairUpOptions.classList.add("hidden");
}

function onMatchSent(receivedUserId) {
    if (matchingUserId == null && receivedUserId != userId) {
        updateMatchingUserId(receivedUserId);
    }
}

function updateMatchingUserId(receivedUserId) {
    matchingUserId = receivedUserId;
    const matchingUserIdInput = document.getElementById("match-id");
    matchingUserIdInput.value = matchingUserId;

}

/* Map Navigation */

function startNavigationOnMap() {
    const instructionDialog = document.getElementById("instruction-dialog");
    instructionDialog.showModal();
    setTimeout(() => {
        instructionDialog.close();
    }, 5000);
}

function initializeChallengeCounter() {
    const challengeCounter = document.getElementById("challenge-counter");
    challengeCounter.textContent = `${challengesCompleted} / ${challenges.challenges.length}`;
}

function updateChallengeCounter() {
    const challengeCounter = document.getElementById("challenge-counter");
    challengeCounter.classList.add("show");
    setTimeout(() => {
        challengeCounter.textContent = `${challengesCompleted} / ${challenges.challenges.length}`;
        setTimeout(() => {
            challengeCounter.classList.remove("show");
        }, 1500);
    }, 200);
}

const challengeSolveTimeInSeconds = 10;
let secondsLeft = challengeSolveTimeInSeconds;

function updateChallengeTimer() {
    if (secondsLeft < 0) {
        closeChallenge();
        return;
    }
    const challengeTimer = document.getElementById("challenge-timer");
    challengeTimer.textContent = secondsLeft.toString().padStart(2, "0");
    secondsLeft--;
}

function createResults() {
    const resultsContainer = document.createElement("div");
    resultsContainer.classList.add("results-container");
    for (let result of challengeResults) {
        const resultElement = document.createElement("img");
        resultElement.classList.add("result-image");
        if (result.answer == matchingUserResults.find(r => r.id == result.id)?.answer) {
            resultElement.src = "./images/heart.svg";
        }
        else {
            resultElement.src = "./images/cut-heart.svg";
        }
        resultsContainer.appendChild(resultElement);
    }
    return resultsContainer;
}

let challengeTimerInterval;

function showChallenge() {
    const challenge = challenges.challenges[challengesCompleted];
    if (!challenge) {
        let isMatch = true;
        for (let result of challengeResults) {
            if (result.answer != matchingUserResults.find(r => r.id == result.id)?.answer) {
                isMatch = false;
            }
        }

        if (isMatch) {
            const matchedDialog = document.getElementById("matched-dialog");
            const matchedDialogBody = matchedDialog.querySelector(".dialog-body");
            matchedDialogBody.appendChild(createResults());
            matchedDialog.showModal();
        }
        else {
            const unmatchedDialog = document.getElementById("unmatched-dialog");
            const matchedDialogBody = unmatchedDialog.querySelector(".dialog-body");
            matchedDialogBody.appendChild(createResults());
            unmatchedDialog.showModal();
        }
        return;
    }

    secondsLeft = challengeSolveTimeInSeconds;
    updateChallengeTimer();
    challengeTimerInterval = setInterval(updateChallengeTimer, 1000);

    const challengeInstruction = document.getElementById("challenge-instruction");
    challengeInstruction.textContent = challenge.instruction;
    const challengeDialog = document.getElementById("challenge-dialog");
    const challengeBody = challengeDialog.querySelector(".dialog-body");
    challengeBody.innerHTML = "";

    const oldSubmitChallenge = document.getElementById("submit-challenge");
    const submitChallenge = oldSubmitChallenge.cloneNode(true);
    oldSubmitChallenge.replaceWith(submitChallenge);

    const challengeFooter = challengeDialog.querySelector(".challenge-footer");
    challengeFooter.classList.remove("hidden")
    const reorderedAnswers = challenge.answers?.sort(() => Math.random() - 0.5);

    switch (challenge.type) {
        case "question":
            const challengeAnswerTemplate = document.getElementById("challenge-answer-template");
            reorderedAnswers.forEach(answer => {
                const challengeAnswer = challengeAnswerTemplate.content.cloneNode(true).querySelector("button");
                challengeAnswer.textContent = answer;
                challengeAnswer.addEventListener("click", () => {
                    challengeAnswer.classList.remove("button-secondary");
                    challengeAnswer.classList.add("button-primary");
                    setTimeout(() => {
                        challengeResults.push({
                            id: challenge.id,
                            answer: answer,
                        });
                        connection.invoke("SendAnswer", answer, challenge.id, userId);
                        closeChallenge();
                    }, 500)
                });
                challengeBody.appendChild(challengeAnswer);
            });
            challengeFooter.classList.add("hidden");
            break;
        case "rating":
            const challengeRatingTemplate = document.getElementById("challenge-rating-template");
            const challengeRatingClone = challengeRatingTemplate.content.cloneNode(true);
            const challengeRatingImage = challengeRatingClone.querySelector("img");
            const randomImageIndex = Math.floor(Math.random() * 8) + 1;
            challengeRatingImage.src = `./images/discomfort/${randomImageIndex}.png`;
            challengeBody.appendChild(challengeRatingImage);
            const challengeRating = challengeRatingClone.querySelector("input");
            challengeRating.min = challenge.range.min;
            challengeRating.max = challenge.range.max;
            challengeRating.step = challenge.range.step;
            challengeRating.value = Math.floor(Math.random() * challenge.range.max);
            challengeBody.appendChild(challengeRating);
            submitChallenge.addEventListener("click", () => {
                challengeResults.push({
                    id: challenge.id,
                    answer: challengeRating.value,
                });
                connection.invoke("SendAnswer", challengeRating.value, challenge.id, userId);
                closeChallenge();
            });
            break;
        case "ranking":
            const challengeRankingTemplate = document.getElementById("challenge-ranking-template");
            const rankingList = document.createElement("ul");
            rankingList.classList.add("challenge-ranking");
            rankingList.addEventListener("dragover", rankingDragOver);
            rankingList.addEventListener("dragstart", rankingDragStart);
            rankingList.addEventListener("dragend", rankingDragEnd);
            reorderedAnswers.forEach(answer => {
                const challengeRanking = challengeRankingTemplate.content.cloneNode(true).querySelector("li");
                challengeRanking.textContent = answer;
                rankingList.appendChild(challengeRanking);
            });
            challengeBody.appendChild(rankingList);
            submitChallenge.addEventListener("click", () => {
                const result = [];
                rankingList.childNodes.forEach((ranking, index) => {
                    result.push(ranking.textContent);
                });
                challengeResults.push({
                    id: challenge.id,
                    answer: result.join(",")
                });
                connection.invoke("SendAnswer", result.join(","), challenge.id, userId);
                closeChallenge();
            });
            break;
    }
    challengeDialog.showModal();
}

function closeChallenge() {
    console.log(challengeResults);
    clearInterval(challengeTimerInterval);
    const challengeDialog = document.getElementById("challenge-dialog");
    challengeDialog.close();
    challengesCompleted++;
    updateChallengeCounter();
}

let draggedItem = null;

function rankingDragStart(e) {
    draggedItem = e.target;
    e.target.classList.add('dragging');
}

function rankingDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedItem = null;
}

function rankingDragOver(e) {
    e.preventDefault();
    const rankingList = document.querySelector(".challenge-ranking");
    const afterElement = getDragAfterElement(rankingList, e.clientY);
    if (afterElement == null) {
        rankingList.appendChild(draggedItem);
    } else {
        rankingList.insertBefore(draggedItem, afterElement);
    }
}

function getDragAfterElement(container, y) {
    const rankingList = document.querySelector(".challenge-ranking");
    const draggableElements = [...container.querySelectorAll('.challenge-ranking-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateMapPosition(x, y,) {
    const map = document.getElementById("map");
    const currentTop = parseInt(map.style.top || 0);
    map.style.top = (currentTop + y) + 'px';
    const currentLeft = parseInt(map.style.left || 0);
    map.style.left = (currentLeft + x) + 'px';
}

function setInitialMapPosition() {
    // Get viewport size
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const map = document.getElementById("map");
    map.style.top = (viewportHeight / 2) + 'px';
    map.style.left = (viewportWidth / 2) + 'px';
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
        await connection.invoke("MovePlayer", movement.x, movement.y, userId);
    }
    catch (error) {
        console.error(error);
    }
}

function onHealthSent(initiatingUserId) {
    if (initiatingUserId != matchingUserId) return;
    lastHealthCheckReceived = new Date();
}

function onAnswerSent(answer, answerId, userId) {
    if (userId != matchingUserId) return;
    matchingUserResults.push({ id: answerId, answer: answer });
}

function showVerticalSlider() {
    document.getElementById("horizontal-slider").classList.remove("hidden");
}

function showHorizontalSlider() {
    document.getElementById("vertical-slider").classList.remove("hidden");
}

function navigationChanged() {
    const navigationSelect = document.getElementById("navigation-select");
    if (navigationSelect.value === "horizontal") {
        showHorizontalSlider();
    } else {
        showVerticalSlider()
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

    connection.on("PlayerMoved", (x, y, initiatingUserId) => {
        if (initiatingUserId == matchingUserId || initiatingUserId == userId) {
            updateMapPosition(x, y);
        }
    });

    connection.on("HealthSent", onHealthSent);

    connection.on("MatchSent", onMatchSent)

    connection.on("DefiningCharacteristicSent", onDefiningCharacteristicSent)

    connection.on("AnswerSent", onAnswerSent);

    startSignalRConnection();
}