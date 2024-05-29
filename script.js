import * as signalR from '@microsoft/signalr';

document.addEventListener('DOMContentLoaded', function () {
    // Add stuff that has do be done after the page is loaded
    const connection = new signalR.HubConnectionBuilder()
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

    connection.on("ReceiveMessage", (message) => {
        const messageList = document.getElementById("messages");
        const li = document.createElement("li");
        li.textContent = message;
        messageList.appendChild(li);
    });
    async function sendMessage() {
        const messageInput = document.getElementById("message");
        try {
            await connection.invoke("SendMessage", messageInput.value);
        }
        catch (error) {
            console.error(error);
        }
    }

    const sendMessageButton = document.getElementById("sendMessage");
    sendMessageButton.addEventListener("click", sendMessage);
});
