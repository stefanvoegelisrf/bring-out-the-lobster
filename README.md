# Trial Period
- [Trial Period](#trial-period)
  - [Contributors](#contributors)
  - [Running the app](#running-the-app)
  - [Running the webserver](#running-the-webserver)
  - [Configuring the https certificates](#configuring-the-https-certificates)


## Contributors
- Ardit Stojkaj
- Sebastian Borter
- Stefan Vögeli

## Running the app
- Navigate to the root folder
- Run `npm run dev`

## Running the webserver
- Navigate to TrialPeriodServer/TrialPeriodServer
- run `dotnet run`

> In order to run this command, install the [C# Dev Kit](https://learn.microsoft.com/en-us/visualstudio/subscriptions/vs-c-sharp-dev-kit)

## Configuring the https certificates
In order to run the server and the client correctly, the developer certificates have to be configured. 


- https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client?view=aspnetcore-7.0&tabs=visual-studio-code
- https://medium.com/@craftingcode/how-can-i-implement-real-time-features-using-signalr-in-asp-net-1a18551e5afc