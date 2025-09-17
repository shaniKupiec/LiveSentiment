using LiveSentiment;

var builder = WebApplication.CreateBuilder(args);

// Configure the application to listen on all interfaces for Docker
builder.WebHost.UseUrls("http://0.0.0.0:80");

// Add services to the container.
var startup = new Startup(builder.Configuration);
startup.ConfigureServices(builder.Services);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

startup.Configure(app, app.Environment);

// Configure graceful shutdown
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    Console.WriteLine("Application is stopping...");
});

lifetime.ApplicationStopped.Register(() =>
{
    Console.WriteLine("Application has stopped.");
});

app.Run();
