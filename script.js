import * as signalR from "@microsoft/signalr";
import * as challenges from "./challenges.json";
import * as outroTexts from "./outro.json";

let connection;
let verticalInterval;
let horizontalInterval;
let challengesCompleted = 0;
let userId = self.crypto.randomUUID();
let matchingUserId;
let userMatchFindingInterval;
let selectedDefiningCharacteristic;
let definingCharacteristicSelectedTimestamp;
let challengeResults = [];
let matchingUserResults = [];
let startTime;
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


    document.getElementById("show-challenge").addEventListener("click", showChallenge);

    setInitialMapPosition();
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
    });

    const completeAllChallengesButton = document.getElementById("complete-all-challenges");
    completeAllChallengesButton.addEventListener("click", completeAllChallenges);
});

function hideIntroScreen() {
    const introScreenContainer = document.querySelector('.intro-screen-container');
    const introTextTop = introScreenContainer.querySelector(".intro-text-top");
    const introTextBottom = introScreenContainer.querySelector(".intro-text-bottom");
    const rightRing = introScreenContainer.querySelector(".intro-screen-right-ring");
    const leftRing = introScreenContainer.querySelector(".intro-screen-left-ring");
    const ringContainer = introScreenContainer.querySelector(".intro-screen-ring-container");
    introScreenContainer.style.animation = "1s 1s linear 1 forwards animate-opacity-reversed";
    introTextTop.style.animation = ".2s linear 1 forwards animate-opacity-reversed";
    introTextBottom.style.animation = ".2s linear 1 forwards animate-opacity-reversed";
    rightRing.style.animation = ".3s linear 1 forwards right-ring-animate-out";
    leftRing.style.animation = ".3s linear 1 forwards left-ring-animate-out";
    ringContainer.style.animation = "2s linear 1 .8s forwards scale-out";
    setTimeout(() => {
        findMatch();
    }, 1500);
    setTimeout(() => { introScreenContainer.remove(); }, 3000);
}

/* Matching */

function findMatch() {
    const pairUpDialog = document.getElementById("pair-up-dialog");
    const pairUpHeader = pairUpDialog.querySelector(".dialog-header");
    pairUpHeader.textContent = "Choosing your partner";
    const searchingForMatch = document.getElementById("searching-for-match");
    searchingForMatch.classList.remove("hidden");
    searchingForMatch.textContent = "Your partner is being chosen, await further instructions."
    pairUpDialog.showModal();
    userMatchFindingInterval = setInterval(() => {
        connection.invoke("FindMatch", userId);
        if (matchingUserId) {
            clearInterval(userMatchFindingInterval);
            pairUpHeader.textContent = "Choose characteristic";
            searchingForMatch.classList.add("hidden");
            showPairUpOptions();
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
        hidePairUpOptions();
        setTimeout(findMatch, 1000);
    }
    const pairUpDialog = document.getElementById("pair-up-dialog");
    pairUpDialog.close();
}

function showPairUpOptions() {
    const pairUpOptions = document.getElementById("pair-up-options");
    pairUpOptions.classList.remove("hidden");
    pairUpOptions.querySelectorAll("button").forEach(button => {
        button.classList.remove("selected");
        button.addEventListener("click", (event) => {
            button.classList.add("selected");
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

function checkIfPlayerIsIntersectingWithChallenge() {
    const playerPosition = document.getElementById("player").getBoundingClientRect();
    const challenges = document.querySelectorAll(".challenge");
    for (let challenge of challenges) {
        const challengePosition = challenge.getBoundingClientRect();
        if (challenge.classList.contains("challenge-completed")) continue;
        if (playerPosition.left < challengePosition.right &&
            playerPosition.right > challengePosition.left &&
            playerPosition.top < challengePosition.bottom &&
            playerPosition.bottom > challengePosition.top) {
            challenge.classList.add("challenge-completed");
            challenge.textContent = "𐄂";
            resetSlider();
            showChallenge();
        }
    }
}

let intersectionCheckInterval;

function startNavigationOnMap() {
    const instructionDialog = document.getElementById("instruction-dialog");
    instructionDialog.showModal();
    setTimeout(() => {
        instructionDialog.close();
        intersectionCheckInterval = setInterval(checkIfPlayerIsIntersectingWithChallenge, 100);
        startTime = new Date();
    }, 5000);
}


function updateChallengeCounter() {
    const challengeCounter = document.getElementById("challenge-counter");
    challengeCounter.classList.add("show");
    setTimeout(() => {
        const challengeCounterItem = document.getElementById(`challenge-counter-${challengesCompleted}`);
        challengeCounterItem.classList.add("completed");
    }, 200);
    setTimeout(() => {
        challengeCounter.classList.remove("show");
    }, 2000);

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

let challengeTimerInterval;
let isChallengeOpen = false;

function showChallenge() {
    const challenge = challenges.challenges[challengesCompleted];
    if (isChallengeOpen) return;
    isChallengeOpen = true;
    secondsLeft = challengeSolveTimeInSeconds;
    updateChallengeTimer();

    // challengeTimerInterval = setInterval(updateChallengeTimer, 1000);

    const challengeInstruction = document.getElementById("challenge-instruction");
    challengeInstruction.textContent = challenge.instruction;
    const challengeDialog = document.getElementById("challenge-dialog");
    const challengeBody = challengeDialog.querySelector(".dialog-body");
    challengeBody.innerHTML = "";

    const oldSubmitChallenge = document.getElementById("submit-challenge");
    const submitChallenge = oldSubmitChallenge.cloneNode(true);
    oldSubmitChallenge.replaceWith(submitChallenge);

    const challengeFooter = challengeDialog.querySelector(".dialog-footer");
    challengeFooter.classList.remove("hidden")
    const reorderedAnswers = challenge.answers?.sort(() => Math.random() - 0.5);

    switch (challenge.type) {
        case "question":
            const challengeAnswerTemplate = document.getElementById("challenge-answer-template");
            reorderedAnswers.forEach(answer => {
                const challengeAnswer = challengeAnswerTemplate.content.cloneNode(true).querySelector("button");
                challengeAnswer.textContent = answer;
                challengeAnswer.addEventListener("click", () => {
                    challengeAnswer.classList.add("selected");
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
            challengeRatingImage.src = `/images/discomfort/${randomImageIndex}.png`;
            challengeBody.appendChild(challengeRatingImage);
            const challengeRating = challengeRatingClone.querySelector("input");
            challengeRating.min = challenge.range.min;
            challengeRating.max = challenge.range.max;
            challengeRating.step = challenge.range.step;
            challengeRating.value = Math.floor(Math.random() * challenge.range.max);
            const challengeRatingContainer = document.createElement("div");
            challengeRatingContainer.classList.add("challenge-rating-container");
            const min = document.createElement("p");
            min.textContent = challenge.range.min;
            const max = document.createElement("p");
            max.textContent = challenge.range.max;
            challengeRatingContainer.appendChild(min);
            challengeRatingContainer.appendChild(challengeRating);
            challengeRatingContainer.appendChild(max);
            challengeBody.appendChild(challengeRatingContainer);
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
            rankingList.addEventListener("touchstart", rankingDragStart);
            rankingList.addEventListener("touchend", rankingDragEnd);
            rankingList.addEventListener("touchmove", rankingDragOver);
            reorderedAnswers.forEach(answer => {
                const challengeRanking = challengeRankingTemplate.content.cloneNode(true).querySelector("li");
                const dragIcon = document.createElement("span");
                dragIcon.classList.add("drag-ranking-item-icon");
                const rankingText = document.createElement("span");
                rankingText.textContent = answer;
                challengeRanking.appendChild(dragIcon);
                challengeRanking.appendChild(rankingText);
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
    isChallengeOpen = false;
    checkIfAllChallengesCompleted();
}

function checkIfAllChallengesCompleted() {
    const challenge = challenges.challenges[challengesCompleted];
    if (challenge) return;
    if (!challenge && challengesCompleted >= challenges.challenges.length && challengeResults.length == matchingUserResults.length) {
        showResult();
        clearInterval(intersectionCheckInterval);
    }
    else {
        setTimeout(checkIfAllChallengesCompleted, 500);
    }

}

let outroTypewriterIndex = 0;
let outroTextContent = "";
let targetPercentage;
let currentPercentage = 0;

function outroTypewriter() {
    if (outroTypewriterIndex < outroTextContent.length) {
        document.getElementById("outro-text").innerHTML += outroTextContent.charAt(outroTypewriterIndex);
        outroTypewriterIndex++;
        setTimeout(outroTypewriter, 50);
    }
}

function countUpPercentage() {
    if (currentPercentage < targetPercentage) {
        currentPercentage++;
        document.getElementById("similarity-percentage").textContent = `${currentPercentage}%`;
        setTimeout(countUpPercentage, 100);
    }
    else {
        outroTypewriter();
    }
}

function hideChallenges() {
    const challenges = document.querySelectorAll(".challenge");
    challenges.forEach(challenge => {
        challenge.classList.add("hidden");
    });
}

function showResult() {
    const timePassedSinceStartInMs = new Date() - startTime;
    const tenMinutesInMs = 600000;
    const player = document.getElementById("player");
    player.classList.add("scale-player-out");
    const trialPeriodConcluded = document.getElementById("trial-period-concluded");
    trialPeriodConcluded.classList.remove("animation-paused", "hidden");
    setTimeout(() => {
        trialPeriodConcluded.classList.add("hidden");
    }, 3000);
    const outroScreen = document.getElementById("outro-screen");
    setTimeout(() => {
        outroScreen.classList.remove("hidden");
    }, 1000);
    hideSliders();
    hideChallenges();
    let matchPercentage = 0;
    for (let result of challengeResults) {
        if (result.answer == matchingUserResults.find(r => r.id == result.id)?.answer) {
            matchPercentage += 10;
        }
    }
    const timePercentage = map(timePassedSinceStartInMs, 0, tenMinutesInMs, 0, 10);
    matchPercentage += (10 - timePercentage)
    matchPercentage = Math.floor(matchPercentage);
    targetPercentage = matchPercentage;
    const outroTitle = document.getElementById("outro-title");
    const outroText = document.getElementById("outro-text");
    if (matchPercentage > 30 && matchPercentage <= 60) {
        outroTitle.textContent = outroTexts.medium.title;
        outroTextContent = outroTexts.medium.text;
    }
    else if (matchPercentage > 60) {
        outroTitle.textContent = outroTexts.good.title;
        outroTextContent = outroTexts.good.text;
    }
    else {
        outroTitle.textContent = outroTexts.bad.title;
        outroTextContent = outroTexts.bad.text;
    }
    setTimeout(countUpPercentage, 5000);
}

function map(value, sourceMin, sourceMax, targetMin, targetMax) {
    return (value - sourceMin) / (sourceMax - sourceMin) * (targetMax - targetMin) + targetMin;
}

let draggedItem = null;

function rankingDragStart(e) {
    draggedItem = e.touches ? e.touches[0].target.closest("li") : e.target;
    e.target.classList.add('dragging');
}

function rankingDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedItem = null;
}

function rankingDragOver(e) {
    e.preventDefault();
    const rankingList = document.querySelector(".challenge-ranking");
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const afterElement = getDragAfterElement(rankingList, clientY);
    if (afterElement == null) {
        rankingList.appendChild(draggedItem);
    } else {
        rankingList.insertBefore(draggedItem, afterElement);
    }
}

function getDragAfterElement(container, y) {
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
    const mapBoundingClientRect = map.getBoundingClientRect();
    updateMapPosition((viewportWidth * 0.5) + (-mapBoundingClientRect.width * 0.5), (viewportHeight * 0.5) + (-mapBoundingClientRect.height * 0.5));
}

function resetSlider() {
    const verticalSlider = document.getElementById("vertical-slider");
    const horizontalSlider = document.getElementById("horizontal-slider");
    const position = 1;
    verticalSlider.value = position;
    horizontalSlider.value = position;
    verticalSliderChanged(position);
    horizonalSliderChanged(position);
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

function onAnswerSent(answer, answerId, userId) {
    if (userId != matchingUserId) return;
    matchingUserResults.push({ id: answerId, answer: answer });
}

function showVerticalSlider() {
    document.getElementById("horizontal-slider").classList.remove("hidden");
}

function hideSliders() {
    document.getElementById("horizontal-slider").classList.add("hidden");
    document.getElementById("vertical-slider").classList.add("hidden");
}

function showHorizontalSlider() {
    document.getElementById("vertical-slider").classList.remove("hidden");
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
            // x = x * 2;
            // y = y * 2;
            updateMapPosition(x, y);
        }
    });

    connection.on("MatchSent", onMatchSent)

    connection.on("DefiningCharacteristicSent", onDefiningCharacteristicSent)

    connection.on("AnswerSent", onAnswerSent);

    startSignalRConnection();
}

function completeAllChallenges() {
    challengesCompleted = 9;
    for (let challenge of challenges.challenges) {
        challengeResults.push({ id: challenge.id, answer: `${Math.floor(Math.random() * 50)}` })
        matchingUserResults.push({ id: challenge.id, answer: `${Math.floor(Math.random() * 50)}` })
    }
    checkIfAllChallengesCompleted();
}