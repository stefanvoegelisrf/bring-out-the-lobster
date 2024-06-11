# Trial Period
- [Trial Period](#trial-period)
  - [Contributors](#contributors)
  - [About](#about)
  - [Running the app](#running-the-app)
  - [Running the webserver](#running-the-webserver)
  - [Configuring the https certificates](#configuring-the-https-certificates)


## Contributors
- Ardit Stojkaj
- Sebastian Borter
- Stefan Vögeli

## About
This project is a game inspired by the movie "The Lobster". It is an experience where two people play together. First, the players must match up and form a pair. Then the players must choose a characteristic, which is their shared characteristic. After choosing the characteristic, they must navigate on a map, where one player can steer on the x-axis and the other player can steer the y-axis. Placed on the map are various challenges that the players can encounter. The challenges consist of questions, rankings and ratings. The goal of the players is to get similar answers, but the game is designed in a way, that they answer differently. When all challenges have been solved, their results are compared and the players get a result on how much similarity they have achieved. Based on their similarity, they will receive a prediction of their future as a couple.

## Running the app
> Make sure to install node first and install the npm packages with `npm i`

- Navigate to the root folder
- Run `npm run dev`

> When first running the app, you are prompted to trust the certifactes to enable https

> Make sure to change the url of the SignalR connection depending if you want to connect to the Azure Server or the local server

## Running the webserver
- Navigate to TrialPeriodServer/TrialPeriodServer
- run `dotnet run`

> In order to run this command, install the [C# Dev Kit](https://learn.microsoft.com/en-us/visualstudio/subscriptions/vs-c-sharp-dev-kit)
> You also need to install .NET 8

## Configuring the https certificates
In order to run the server and the client correctly, the developer certificates have to be configured. This can be done with the following commands:
```sh
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```