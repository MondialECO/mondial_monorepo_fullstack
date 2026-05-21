using Amazon.Runtime.Internal.Util;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using WebApp.DbContext;
using WebApp.Middleware;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Services;
//using static Org.BouncyCastle.Math.EC.ECCurve;
namespace WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimiting("auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;
        private readonly ILogger<AuthController> _logger;
        private readonly SaveFile _fileService;
        private readonly IDistributedCache _cache;
        private readonly TwilioService _twilioService;
        private readonly WebApp.Services.Audit.IAuditLogger _audit;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            RoleManager<ApplicationRole> roleManager,
            EmailService emailSender,
            ILogger<AuthController> logger,
            SaveFile saveFile,
            IDistributedCache cache,
            TwilioService twilioService,
            WebApp.Services.Audit.IAuditLogger audit
            )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _roleManager = roleManager;
            _emailService = emailSender;
            _logger = logger;
            _fileService = saveFile;
            _cache = cache;
            _twilioService = twilioService;
            _audit = audit;
        }

        #region Helper Methods

        private IActionResult Success(string message, object? data = null)
        {
            return Ok(new
            {
                success = true,
                message,
                data
            });
        }

        private IActionResult Fail(string message)
        {
            return BadRequest(new
            {
                success = false,
                message
            });
        }

        private IActionResult NotFoundResponse(string message)
        {
            return NotFound(new
            {
                success = false,
                message
            });
        }

        private IActionResult UnauthorizedResponse(string message)
        {
            return Unauthorized(new
            {
                success = false,
                message
            });
        }

        private IActionResult InternalError(string message)
        {
            return StatusCode(500, new
            {
                success = false,
                message
            });
        }

        #endregion



        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                    return Fail("Invalid request data");


                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    _audit.Record("login", model.Email, false, new { reason = "unknown_email" });
                    return UnauthorizedResponse("Invalid email or password");
                }

                if (!user.EmailConfirmed)
                {
                    return UnauthorizedResponse("You need to confirm your email before logging in.");
                }

                if (!await _userManager.CheckPasswordAsync(user, model.Password))
                {
                    _audit.Record("login", model.Email, false, new { reason = "bad_password" });
                    return UnauthorizedResponse("Invalid email or password");
                }

                if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
                    return UnauthorizedResponse("Your account is locked. Please try again later.");

                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.Count > 0 ? roles[0] : "User";

                var token = JwtTokenHelper.GenerateToken(user.Id.ToString(), role, _configuration["JwtSettings:Key"], _configuration["JwtSettings:Issuer"], _configuration["JwtSettings:Audience"]);
                _logger.LogInformation($"User {user.Email} successfully logged in.");

                var refreshToken = JwtTokenHelper.GenerateRefreshToken();

                var refreshTokenEntity = new RefreshToken
                {
                    Token = refreshToken,
                    ExpiresAt = DateTime.UtcNow.AddDays(7),
                    CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? ""
                };

                user.RefreshToken = refreshTokenEntity;
                user.LastLogin = DateTime.UtcNow;
                var updateResult = await _userManager.UpdateAsync(user);

                if (!updateResult.Succeeded)
                {
                    _logger.LogWarning("Failed to update user with refresh token");
                    // still return tokens to user, but log warning
                }

                _audit.Record("login", user.Email ?? model.Email, true, new { role });

                return Success("Logged in successfully", new
                {
                    token,
                    user = new
                    {
                        Id = user.Id,
                        Name = user.Name,
                        Roles = roles
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return InternalError("An unexpected error occurred. Please try again later.");
            }
        }



        // Self-registerable roles. Admin is intentionally excluded — assigned
        // via the admin console. Keep in sync with frontend src/lib/roles.ts.
        private static readonly HashSet<string> AllowedSignupRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "Entrepreneur",
            "Creator",
            "Investor",
            "ServiceProvider"
        };

        // POST: api/auth/refresh-token
        // Frontend axios interceptor calls this on 401 with the (possibly
        // expired) bearer in the Authorization header. Returns a fresh token
        // wrapped in the standard ApiResponse envelope.
        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken()
        {
            try
            {
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    return UnauthorizedResponse("Missing bearer token");

                var expiredToken = authHeader.Substring("Bearer ".Length).Trim();

                ClaimsPrincipal principal;
                try
                {
                    principal = JwtTokenHelper.GetPrincipalFromExpiredToken(
                        expiredToken,
                        _configuration["JwtSettings:Key"],
                        _configuration["JwtSettings:Issuer"],
                        _configuration["JwtSettings:Audience"]);
                }
                catch (SecurityTokenException)
                {
                    return UnauthorizedResponse("Invalid token");
                }

                var userId = principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return UnauthorizedResponse("Invalid token claims");

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return UnauthorizedResponse("User not found");

                if (user.RefreshToken == null ||
                    user.RefreshToken.ExpiresAt < DateTime.UtcNow ||
                    user.RefreshToken.IsRevoked)
                {
                    return UnauthorizedResponse("Refresh token expired or revoked");
                }

                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.Count > 0 ? roles[0] : "User";

                var newToken = JwtTokenHelper.GenerateToken(
                    user.Id.ToString(),
                    role,
                    _configuration["JwtSettings:Key"],
                    _configuration["JwtSettings:Issuer"],
                    _configuration["JwtSettings:Audience"]);

                return Success("Token refreshed", new
                {
                    token = newToken,
                    user = new { user.Id, user.Name, Roles = roles }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing token");
                return InternalError("Failed to refresh token");
            }
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return UnauthorizedResponse("User not authenticated.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFoundResponse("User not found.");

            return Success("User retrieved", new
            {
                user.Id,
                user.Name,
                user.Email,
                user.PhoneNumber,
                user.User,
                user.Bio
            });
        }


        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return Success("Logged out");

            await _userManager.UpdateAsync(user);
            await _signInManager.SignOutAsync();
            return Success("Logged out");
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterModel model)
        {
            if (!ModelState.IsValid)
                return Fail("Invalid request data");

            if (string.IsNullOrWhiteSpace(model.User) || !AllowedSignupRoles.Contains(model.User))
                return Fail("Invalid role");

            // Normalize to the canonical casing the role was seeded with.
            var canonicalRole = AllowedSignupRoles.First(r => r.Equals(model.User, StringComparison.OrdinalIgnoreCase));

            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
            {
                _audit.Record("register", model.Email, false, new { reason = "email_in_use" });
                return Fail("Email already in use");
            }

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                Name = model.Name,
                User = canonicalRole,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return Fail("User registration failed");

            var roleExists = await _roleManager.RoleExistsAsync(canonicalRole);
            if (!roleExists)
            {
                return InternalError("Role not seeded. Check startup role seeding in Program.cs.");
            }

            await _userManager.AddToRoleAsync(user, canonicalRole);

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

            var encodedToken = WebUtility.UrlEncode(token);

            var baseUrl = _configuration["BaseUrl"]?.TrimEnd('/') ?? "https://mondialbusiness.eu";
            var confirmationLink = $"{baseUrl}/confirm-email?userId={Uri.EscapeDataString(user.Id.ToString())}&token={encodedToken}";

            bool emailSent = await _emailService.SendEmailAsync(user.Email, "Confirm your email",
                $"Please confirm your account by clicking this link: <a href='{confirmationLink}'>Confirm Email</a>");

            if (!emailSent)
                return InternalError("User registered, but failed to send confirmation email.");

            _audit.Record("register", user.Email!, true, new { role = canonicalRole });

            return StatusCode(201, new { success = true, message = "User registered successfully! Please check your email for confirmation.", data = new { user.Id, user.Email } });
        }

        // GET: api/auth/confirm-email?userId=&token=
        // Variant for the link in the confirmation email so users can hit it
        // directly from their inbox. The frontend page also calls the POST
        // variant when handling the link client-side.
        [HttpGet("confirm-email")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmEmailGet([FromQuery] string userId, [FromQuery] string token)
        {
            return await ConfirmEmailCore(userId, token);
        }

        [HttpPost("confirm-email")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailModel model)
        {
            return await ConfirmEmailCore(model?.UserId, model?.Token);
        }

        private async Task<IActionResult> ConfirmEmailCore(string userId, string token)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
                return Fail("Invalid confirmation request. User ID and Token are required.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFoundResponse("User not found.");

            if (user.EmailConfirmed)
                return Success("Your email is already confirmed. You can log in now.");

            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (!result.Succeeded)
                return Fail("Email confirmation failed. Invalid or expired token.");

            return Success("Email confirmed successfully! You can now log in.");
        }

        public class ResendConfirmationModel
        {
            [Required]
            [EmailAddress]
            public string Email { get; set; }
        }

        // POST: api/auth/resend-confirmation-email
        // Regenerates and resends the confirmation link. Always returns a
        // generic success response so a caller cannot enumerate which emails
        // are registered.
        [HttpPost("resend-confirmation-email")]
        [AllowAnonymous]
        public async Task<IActionResult> ResendConfirmationEmail([FromBody] ResendConfirmationModel model)
        {
            if (!ModelState.IsValid)
                return Fail("Invalid email");

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user != null && !user.EmailConfirmed)
            {
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var encodedToken = WebUtility.UrlEncode(token);
                var baseUrl = _configuration["BaseUrl"]?.TrimEnd('/') ?? "https://mondialbusiness.eu";
                var confirmationLink = $"{baseUrl}/confirm-email?userId={Uri.EscapeDataString(user.Id.ToString())}&token={encodedToken}";

                await _emailService.SendEmailAsync(user.Email, "Confirm your email",
                    $"Please confirm your account by clicking this link: <a href='{confirmationLink}'>Confirm Email</a>");

                _audit.Record("resend_confirmation", user.Email!, true);
            }
            else
            {
                _audit.Record("resend_confirmation", model.Email, false,
                    new { reason = user == null ? "unknown_email" : "already_confirmed" });
            }

            return Success("If an unconfirmed account exists for that email, a new confirmation link has been sent.");
        }


        public class ForgotPasswordModel
        {
            [Required]
            [EmailAddress]
            public string Email { get; set; }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                return Fail("Invalid email");
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                _audit.Record("forgot_password", model.Email, false, new { reason = "unknown_email" });
                return NotFoundResponse("User not found");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedToken = WebUtility.UrlEncode(token);
            var baseUrl = _configuration["BaseUrl"]?.TrimEnd('/') ?? "https://mondialbusiness.eu";
            var resetUrl = $"{baseUrl}/reset-password?email={Uri.EscapeDataString(model.Email)}&token={encodedToken}";

            _logger.LogInformation($"Generated password reset token for {model.Email}");
            bool emailSent = await _emailService.SendEmailAsync(user.Email, "Password Reset",
                $"Click here to reset your password: <a href='{resetUrl}'>Reset Password</a>");

            if (!emailSent)
                return InternalError("Failed to send reset password email.");

            _audit.Record("forgot_password", user.Email!, true);
            return Success("Password reset link sent to your email.");
        }


        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequestModel model)
        {
            if (!ModelState.IsValid)
                return Fail("Invalid request data");

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return NotFoundResponse("User not found");

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);

            if (!result.Succeeded)
            {
                _audit.Record("reset_password", user.Email!, false, new { reason = "bad_or_expired_token" });
                return Fail("Invalid or expired token.");
            }

            _logger.LogInformation($"Password successfully reset for {model.Email}");
            _audit.Record("reset_password", user.Email!, true);
            return Success("Password reset successfully.");
        }

        public class ChangePasswordModel
        {
            public string currentPassword { get; set; }
            public string newPassword { get; set; }
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return UnauthorizedResponse("User not authenticated.");

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return NotFoundResponse("User not found.");

                var result = await _userManager.ChangePasswordAsync(user, model.currentPassword, model.newPassword);
                if (!result.Succeeded)
                {
                    _audit.Record("change_password", user.Email ?? userId, false, new { reason = "bad_current_password" });
                    return Fail("Password change failed.");
                }

                _logger.LogInformation($"Password successfully changed for user {user.Email}");
                _audit.Record("change_password", user.Email ?? userId, true);

                return Success("Password changed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password");
                return InternalError("Internal server error");
            }
        }

        [HttpGet("account")]
        public async Task<IActionResult> GetAccountDetails()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return UnauthorizedResponse("User not authenticated.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFoundResponse("User not found.");

            return Success("Account details retrieved", new
            {
                user.Id,
                user.Name,
                user.Email,
                user.PhoneNumber,
                user.User,
                user.Bio,
                user.Address,
                user.Roles,
                user.AvailableTime,
                user.Geography,
                user.Experience,
                user.MainExperience,

            });
        }

        [HttpPut("account")]
        public async Task<IActionResult> UpdateAccount(UpdateAccountModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return UnauthorizedResponse("User not authenticated.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFoundResponse("User not found.");

            user.Name = model.Name ?? user.Name;
            user.PhoneNumber = model.Phone ?? user.PhoneNumber;
            user.Address = model.Address ?? user.Address;
            user.Bio = model.Bio ?? user.Bio;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return Fail("Failed to update account.");
            }

            return Success("Account updated successfully.", new { ImagePath = user.ImagePath });
        }


      
    }


}

