using LiveSentiment;
using LiveSentiment.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configure the application to listen on Render's port
var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add services to the container.
var startup = new Startup(builder.Configuration);
startup.ConfigureServices(builder.Services);

var app = builder.Build();

// Handle database test flag
if (args.Contains("--test-db"))
{
    Console.WriteLine("Testing database connection...");
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            var canConnect = context.Database.CanConnect();
            if (canConnect)
            {
                Console.WriteLine("Database connection successful!");
            }
            else
            {
                Console.WriteLine("Database connection failed!");
                Environment.Exit(1);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database connection test failed: {ex.Message}");
            Environment.Exit(1);
        }
    }
    return; // Exit after test
}

// Handle migration flag for Render deployment
if (args.Contains("--migrate"))
{
    Console.WriteLine("Running database migrations...");
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            // Test connection first
            var canConnect = context.Database.CanConnect();
            if (!canConnect)
            {
                Console.WriteLine("Cannot connect to database. Skipping migrations.");
                return;
            }
            
            context.Database.Migrate();
            Console.WriteLine("Database migrations completed successfully.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Migration failed: {ex.Message}");
            Console.WriteLine("Continuing without migrations...");
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
