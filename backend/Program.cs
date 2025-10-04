using LiveSentiment;
using LiveSentiment.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configure the application to listen on the appropriate port based on environment
if (builder.Environment.IsProduction())
{
    // In production (Render), use the PORT environment variable
    var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}
else
{
    // In development, check if running in Docker or locally
    var isDocker = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";
    if (isDocker)
    {
        // In Docker development, bind to 0.0.0.0 to be accessible from outside container
        builder.WebHost.UseUrls("http://0.0.0.0:5000");
    }
    else
    {
        // In local development, use localhost
        builder.WebHost.UseUrls("http://localhost:5000");
    }
}

// Add services to the container.
var startup = new Startup(builder.Configuration);
startup.ConfigureServices(builder.Services);

var app = builder.Build();

// Handle migration flag for Render deployment
if (args.Contains("--migrate"))
{
    Console.WriteLine("Running database migrations...");
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            context.Database.Migrate();
            Console.WriteLine("Database migrations completed successfully.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Migration failed: {ex.Message}");
            // Don't exit, let the app start anyway
        }
    }
    return; // Exit after migration
}

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
