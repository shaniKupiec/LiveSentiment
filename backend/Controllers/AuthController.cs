using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LiveSentiment.Data;
using LiveSentiment.Models;
using LiveSentiment.Services;
using LiveSentiment.Extensions;

namespace LiveSentiment.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IJwtService _jwtService;

        public AuthController(AppDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Model validation failed", "Please check your input and try again.");
            }

            var presenter = await _context.Presenters
                .FirstOrDefaultAsync(p => p.Email == request.Email);

            if (presenter == null)
            {
                return this.Unauthorized(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password", "Invalid email or password. Please try again.");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, presenter.PasswordHash))
            {
                return this.Unauthorized(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password", "Invalid email or password. Please try again.");
            }

            var token = _jwtService.GenerateToken(presenter);

            return this.Success(new AuthResponse
            {
                Token = token,
                Name = presenter.Name,
                Email = presenter.Email,
                Id = presenter.Id
            });
        }

        // POST: api/auth/signup
        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupRequest request)
        {
            if (!ModelState.IsValid)
            {
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Model validation failed", "Please check your input and try again.");
            }

            // Check if email already exists
            var existingPresenter = await _context.Presenters
                .FirstOrDefaultAsync(p => p.Email == request.Email);

            if (existingPresenter != null)
            {
                return this.Conflict(ErrorCodes.EMAIL_ALREADY_EXISTS, "Email already registered", "This email is already registered. Please use a different email or try logging in.");
            }

            // Create new presenter
            var presenter = new Presenter
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                LoginMethod = "email"
            };

            _context.Presenters.Add(presenter);
            
            // Create default labels for the new user
            var defaultLabels = new List<Label>
            {
                new Label
                {
                    Id = Guid.NewGuid(),
                    PresenterId = presenter.Id,
                    Name = "Positive",
                    Color = "#4CAF50",
                    CreatedDate = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow,
                    IsActive = true
                },
                new Label
                {
                    Id = Guid.NewGuid(),
                    PresenterId = presenter.Id,
                    Name = "Negative",
                    Color = "#F44336",
                    CreatedDate = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow,
                    IsActive = true
                },
                new Label
                {
                    Id = Guid.NewGuid(),
                    PresenterId = presenter.Id,
                    Name = "Neutral",
                    Color = "#9E9E9E",
                    CreatedDate = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow,
                    IsActive = true
                }
            };
            
            _context.Labels.AddRange(defaultLabels);
            await _context.SaveChangesAsync();

            var token = _jwtService.GenerateToken(presenter);

            return this.Success(new AuthResponse
            {
                Token = token,
                Name = presenter.Name,
                Email = presenter.Email,
                Id = presenter.Id
            });
        }
    }
} 