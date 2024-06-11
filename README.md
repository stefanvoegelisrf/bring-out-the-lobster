# Trial Period
- [Trial Period](#trial-period)
  - [Contributors](#contributors)
  - [About](#about)
    - [Technical aspects](#technical-aspects)
  - [Setup instructions](#setup-instructions)
    - [Prerequisites](#prerequisites)
    - [Running the web app](#running-the-web-app)
    - [Running the web server](#running-the-web-server)
    - [Configuring the https certificates for the web server](#configuring-the-https-certificates-for-the-web-server)


## Contributors
- [Ardit Stojkaj](https://github.com/mf-doodoo)
- [Sebastian Borter](https://github.com/SebastianBorter)
- [Stefan Vögeli](https://github.com/stefanvoegelisrf)

## About
This project is a game inspired by the movie "The Lobster". It is an experience where two people play together. First, the players must match up and form a pair. Then the players must choose a characteristic, which is their shared characteristic. After choosing the characteristic, they must navigate on a map, where one player can steer on the x-axis and the other player can steer the y-axis. Placed on the map are various challenges that the players can encounter. The challenges consist of questions, rankings and ratings. The goal of the players is to get similar answers, but the game is designed in a way, that they answer differently. When all challenges have been solved, their results are compared and the players get a result on how much similarity they have achieved. Based on their similarity, they will receive a prediction of their future as a couple.

### Technical aspects
As this game is dependent on two players, it only works, when at least two clients are available. This can be achieved by opening two browser windows.

The connection between players is achievd with a SignalR connection via the web server.

## Setup instructions
In order to run this project, follow the guide below.

### Prerequisites
- Install [Visual Studio Code](https://code.visualstudio.com/)
  - Install the [C# Dev Kit](https://learn.microsoft.com/en-us/visualstudio/subscriptions/vs-c-sharp-dev-kit)
- Install [node.js](https://nodejs.org/en)
- Install [.NET 8](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)

### Running the web app
- Navigate to the root folder
- Run `npm install`
- Run `npm run dev`

> When first running the app, you are prompted to trust the certifactes to enable https

> Make sure to change the url of the SignalR connection depending if you want to connect to the Azure Server or the local server
> The URL of the local server is configured in [appsettings.json](./TrialPeriodServer/TrialPeriodServer/appsettings.json)

### Running the web server
- Navigate to the root folder
- Navigate to TrialPeriodServer/TrialPeriodServer
- run `dotnet run`

### Configuring the https certificates for the web server
In order to run the server and the client correctly, the developer certificates have to be configured. This can be done with the following commands:
```sh
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```