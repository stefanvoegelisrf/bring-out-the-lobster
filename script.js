import * as signalR from '@microsoft/signalr';

document.addEventListener('DOMContentLoaded', function () {
    // Add stuff that has do be done after the page is loaded
    const connection = new signalR.HubConnectionBuilder()
        // .withUrl("https://localhost:5001/navigationhub", { withCredentials: false, skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets })
        .withUrl("https://trialperiodserver.azurewebsites.net/navigationhub", { withCredentials: false, skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    async function start() {
        try {
            await connection.start();
            console.log("SignalR Connected.");
        } catch (error) {
            console.log(error);
        }
    }

    connection.onclose(async () => {
        await start();
    });
    start();

    connection.on("PlayerMoved", (x, y) => {
        playerPosition.x += x;
        playerPosition.y += y;
        updatePlayerPosition();
    });

    async function movePlayer(movement) {
        try {
            await connection.invoke("MovePlayer", movement.x, movement.y);
        }
        catch (error) {
            console.error(error);
        }
    }

    const upButton = document.querySelector(".up");
    upButton.addEventListener("click", () => {
        movePlayer({ x: 0, y: -1 });
    });
    const downButton = document.querySelector(".down");
    downButton.addEventListener("click", () => {
        movePlayer({ x: 0, y: 1 });
    });
    const leftButton = document.querySelector(".left");
    leftButton.addEventListener("click", () => {
        movePlayer({ x: -1, y: 0 });
    });
    const rightButton = document.querySelector(".right");
    rightButton.addEventListener("click", () => {
        movePlayer({ x: 1, y: 0 });
    });

    updatePlayerPosition();
});

let playerPosition = {
    x: 50,
    y: 50
}

function updatePlayerPosition() {
    const player = document.querySelector(".player");
    player.style.left = `${playerPosition.x}%`;
    player.style.top = `${playerPosition.y}%`;
}