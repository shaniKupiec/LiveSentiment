using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LiveSentiment.Data;
using LiveSentiment.Models;
using LiveSentiment.Services;

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
                return BadRequest(ModelState);
            }

            var presenter = await _context.Presenters
                .FirstOrDefaultAsync(p => p.Email == request.Email);

            if (presenter == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, presenter.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var token = _jwtService.GenerateToken(presenter);

            return Ok(new AuthResponse
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
                return BadRequest(ModelState);
            }

            // Check if email already exists
            var existingPresenter = await _context.Presenters
                .FirstOrDefaultAsync(p => p.Email == request.Email);

            if (existingPresenter != null)
            {
                return BadRequest(new { message = "Email already registered" });
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
            await _context.SaveChangesAsync();

            var token = _jwtService.GenerateToken(presenter);

            return Ok(new AuthResponse
            {
                Token = token,
                Name = presenter.Name,
                Email = presenter.Email,
                Id = presenter.Id
            });
        }
    }
} 