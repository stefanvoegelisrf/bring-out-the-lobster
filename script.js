import * as signalR from '@microsoft/signalr';

let connection;
let verticalInterval;
let horizontalInterval;

document.addEventListener('DOMContentLoaded', function () {
    initializeServerConnection();

    connection.on("PlayerMoved", (x, y) => {
        updateMapPosition(x, y);
    });

    const verticalSlider = document.getElementById("vertical-slider");
    const horizontalSlider = document.getElementById("horizontal-slider");
    const controlVariant = document.getElementById("control-variant");

    controlVariant.addEventListener("change", controlVariantChanged);

    controlVariantChanged();

    verticalSlider.addEventListener("input", (event) => verticalSliderChanged(event.target.value));
    horizontalSlider.addEventListener("input", (event) => horizonalSliderChanged(event.target.value));

    verticalSliderChanged(verticalSlider.value);
    horizonalSliderChanged(horizontalSlider.value);

    updateMapPosition(0, 0);
});

function updateMapPosition(x, y,) {
    const map = document.getElementById("map");
    const currentTop = parseInt(map.style.top || 0);
    map.style.top = (currentTop + y) + 'px';
    const currentLeft = parseInt(map.style.left || 0);
    map.style.left = (currentLeft + x) + 'px';
}

function verticalSliderChanged(value) {
    clearInterval(verticalInterval);

    if (value == 2) {
        verticalInterval = setInterval(() => moveMap({ x: 0, y: -1 }), 10);
    } else if (value == 0) {
        verticalInterval = setInterval(() => moveMap({ x: 0, y: 1 }), 10);
    }
}

function horizonalSliderChanged(value) {
    clearInterval(horizontalInterval);

    if (value == 0) {
        horizontalInterval = setInterval(() => moveMap({ x: 1, y: 0 }), 10);
    } else if (value == 2) {
        horizontalInterval = setInterval(() => moveMap({ x: -1, y: 0 }), 10);
    }
}

async function moveMap(movement) {
    try {
        await connection.invoke("MovePlayer", movement.x, movement.y);
    }
    catch (error) {
        console.error(error);
    }
}

function controlVariantChanged() {
    const controlVariant = document.getElementById("control-variant");
    if (controlVariant.value === "horizontal") {
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