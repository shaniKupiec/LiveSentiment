using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LiveSentiment.Data;
using Microsoft.Extensions.Configuration;
using LiveSentiment.Services;
using LiveSentiment.Models;

namespace LiveSentiment.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public HealthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                // Check database connectivity
                var canConnect = await _context.Database.CanConnectAsync();
                
                return Ok(new
                {
                    status = "healthy",
                    timestamp = DateTime.UtcNow,
                    database = canConnect ? "connected" : "disconnected",
                    environment = _configuration["ASPNETCORE_ENVIRONMENT"] ?? "Unknown",
                    port = Environment.GetEnvironmentVariable("PORT") ?? "10000",
                    urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "Not set"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = "unhealthy",
                    timestamp = DateTime.UtcNow,
                    database = "disconnected",
                    error = ex.Message,
                    environment = _configuration["ASPNETCORE_ENVIRONMENT"] ?? "Unknown",
                    port = Environment.GetEnvironmentVariable("PORT") ?? "10000",
                    urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "Not set"
                });
            }
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { status = "ok", timestamp = DateTime.UtcNow });
        }

        [HttpGet("debug")]
        public IActionResult Debug()
        {
            var dbHost = _configuration["DB_HOST"] ?? "Not set";
            var dbPort = _configuration["DB_PORT"] ?? "Not set";
            var dbName = _configuration["DB_NAME"] ?? "Not set";
            var dbUser = _configuration["DB_USER"] ?? "Not set";
            var dbPassword = string.IsNullOrEmpty(_configuration["DB_PASSWORD"]) ? "Not set" : "***SET***";
            var dbSslMode = _configuration["DB_SSL_MODE"] ?? "Not set";
            
            var jwtKey = string.IsNullOrEmpty(_configuration["Jwt:Key"]) ? "Not set" : "***SET***";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "Not set";
            var jwtAudience = _configuration["Jwt:Audience"] ?? "Not set";

            return Ok(new
            {
                timestamp = DateTime.UtcNow,
                environment = _configuration["ASPNETCORE_ENVIRONMENT"] ?? "Unknown",
                port = Environment.GetEnvironmentVariable("PORT") ?? "10000",
                urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "Not set",
                database = new
                {
                    host = dbHost,
                    port = dbPort,
                    name = dbName,
                    user = dbUser,
                    password = dbPassword,
                    sslMode = dbSslMode
                },
                jwt = new
                {
                    key = jwtKey,
                    issuer = jwtIssuer,
                    audience = jwtAudience
                },
                cors = new
                {
                    origins = "http://localhost:3000, http://localhost:5173, https://livesentiment-frontend.onrender.com"
                }
            });
        }

        /// <summary>
        /// Test NLP analysis directly
        /// </summary>
        [HttpPost("test-nlp")]
        public async Task<IActionResult> TestNLP([FromBody] TestNLPRequest request)
        {
            try
            {
                var hybridService = HttpContext.RequestServices.GetRequiredService<HybridNLPService>();
                
                var options = new AnalysisOptions
                {
                    EnableSentimentAnalysis = true,
                    EnableEmotionAnalysis = true,
                    EnableKeywordExtraction = true
                };

                var result = await hybridService.AnalyzeResponseAsync(request.Text, options);
                
                return Ok(new
                {
                    success = true,
                    text = request.Text,
                    result = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }

    public class TestNLPRequest
    {
        public string Text { get; set; } = string.Empty;
    }
}
