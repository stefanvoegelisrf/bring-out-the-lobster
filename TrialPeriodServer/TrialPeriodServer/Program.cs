﻿using TrialPeriodServer;

var customArgs = args.Append("--urls");
customArgs = customArgs.Append("https://localhost:5001");
var builder = WebApplication.CreateBuilder(customArgs.ToArray());

// Add services to the container.
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(corsPolicyBuilder =>
    {
        corsPolicyBuilder.AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors();

app.MapHub<NavigationHub>("/navigationhub");

app.Run();