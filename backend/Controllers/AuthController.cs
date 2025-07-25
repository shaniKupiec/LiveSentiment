using Microsoft.AspNetCore.Mvc;

namespace LiveSentiment.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        // POST: api/auth/login
        [HttpPost("login")]
        public IActionResult Login()
        {
            // TODO: Implement login logic
            return Ok();
        }

        // POST: api/auth/signup
        [HttpPost("signup")]
        public IActionResult Signup()
        {
            // TODO: Implement signup logic
            return Ok();
        }
    }
} 