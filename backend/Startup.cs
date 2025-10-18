using LiveSentiment.Data;
using LiveSentiment.Services;
using LiveSentiment.Middleware;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Microsoft.Extensions.Logging;
using System.IO;

namespace LiveSentiment
{
    public class Startup
    {
        public IConfiguration Configuration { get; }
        public Startup(IConfiguration configuration) 
        {
            Configuration = configuration;
            LoadEnvironmentVariables();
        }

        private void LoadEnvironmentVariables()
        {
            // Load .env file for development if it exists
            var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
            if (File.Exists(envPath))
            {
                var lines = File.ReadAllLines(envPath);
                foreach (var line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                        continue;

                    var parts = line.Split('=', 2);
                    if (parts.Length == 2)
                    {
                        var key = parts[0].Trim();
                        var value = parts[1].Trim();
                        Environment.SetEnvironmentVariable(key, value);
                    }
                }
            }
        }

        private string BuildConnectionString()
        {
            // Check if we're in production (Render) or development
            var isProduction = Configuration["ASPNETCORE_ENVIRONMENT"] == "Production";
            
            if (isProduction)
            {
                // Build connection string from environment variables for production
                var host = Configuration["DB_HOST"] ?? "localhost";
                var port = Configuration["DB_PORT"] ?? "5432";
                var database = Configuration["DB_NAME"] ?? "livesentiment";
                var username = Configuration["DB_USER"] ?? "postgres";
                var password = Configuration["DB_PASSWORD"] ?? "postgres";
                var sslMode = Configuration["DB_SSL_MODE"] ?? "Require";

                return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode={sslMode};";
            }
            else
            {
                // Use the connection string from appsettings for development
                return Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("DefaultConnection string not found in configuration");
            }
        }

        // Configures services and middleware
        public void ConfigureServices(IServiceCollection services)
        {
            // Add controllers for API endpoints
            services.AddControllers();

            // Add Swagger services
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "LiveSentiment API", Version = "v1" });
                
                // Add JWT authentication support to Swagger
                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                {
                    {
                        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                        {
                            Reference = new Microsoft.OpenApi.Models.OpenApiReference
                            {
                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            // Add SignalR for real-time communication
            services.AddSignalR();

            // Configure EF Core with PostgreSQL
            services.AddDbContext<AppDbContext>(options =>
            {
                var connectionString = BuildConnectionString();
                options.UseNpgsql(connectionString);
            });

            // Add CORS policy for frontend communication
            services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend",
                    builder => builder
                        .WithOrigins("http://localhost:3000", "http://localhost:5173", "https://livesentiment-frontend.onrender.com")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials());
            });

            // Register JWT service
            services.AddScoped<IJwtService, JwtService>();
            
            // Register Label service
            services.AddScoped<ILabelService, LabelService>();
            
            // Register Question service
            services.AddScoped<IQuestionService, QuestionService>();

            // Register HTTP clients for NLP services
            services.AddHttpClient<GroqNLPService>();
            services.AddHttpClient<HuggingFaceNLPService>();

            // Register NLP services
            services.AddScoped<GroqNLPService>();
            services.AddScoped<HuggingFaceNLPService>();
            services.AddScoped<HybridNLPService>();
            services.AddScoped<ResponseAnalysisService>();

            // Configure JWT Authentication
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["Jwt:Key"] ?? "your-super-secret-key-with-at-least-32-characters")),
                        ValidateIssuer = true,
                        ValidIssuer = Configuration["Jwt:Issuer"] ?? "LiveSentiment",
                        ValidateAudience = true,
                        ValidAudience = Configuration["Jwt:Audience"] ?? "LiveSentiment",
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero
                    };

                    // Configure JWT for SignalR
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;
                            
                            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                            {
                                context.Token = accessToken;
                            }
                            
                            return Task.CompletedTask;
                        }
                    };
                });
        }

        // Configures the HTTP request pipeline
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // Apply database migrations
            using (var scope = app.ApplicationServices.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                context.Database.Migrate();
                
                // Initialize NLP services to check configuration
                try
                {
                    var groqService = scope.ServiceProvider.GetRequiredService<GroqNLPService>();
                    var hybridService = scope.ServiceProvider.GetRequiredService<HybridNLPService>();
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Startup>>();
                    logger.LogInformation("NLP services initialized successfully");
                }
                catch (Exception ex)
                {
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Startup>>();
                    logger.LogError(ex, "Failed to initialize NLP services");
                }
            }

            if (env.IsDevelopment()) app.UseDeveloperExceptionPage();

            // Add global exception handler
            app.UseMiddleware<GlobalExceptionHandler>();

            app.UseRouting();

            app.UseCors("AllowFrontend");

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHub<Hubs.PollHub>("/hubs/poll");
            });
        }
    }
} 