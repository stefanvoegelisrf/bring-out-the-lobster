using TrialPeriodServer;

var customArgs = args.Append("--urls");
customArgs = customArgs.Append("https://localhost:5001");
var builder = WebApplication.CreateBuilder(customArgs.ToArray());

// Add services to the container.
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("https://localhost:5174/"
        , "https://stefanvoegelisrf.github.io/")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors();

app.MapHub<NavigationHub>("/navigationhub");

app.Run();