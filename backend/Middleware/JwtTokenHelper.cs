using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace WebApp.Middleware
{
    public static class JwtTokenHelper
    {
        public static string GenerateToken(
            string userId,
            IEnumerable<string> roles,
            string secretKey,
            string issuer,
            string audience,
            int expiryHours = 8)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var roleList = roles?.ToList() ?? new List<string>();
            if (roleList.Count == 0)
            {
                claims.Add(new Claim(ClaimTypes.Role, "User"));
            }
            else
            {
                foreach (var role in roleList)
                {
                    if (!string.IsNullOrWhiteSpace(role))
                    {
                        claims.Add(new Claim(ClaimTypes.Role, role));
                    }
                }
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expiryHours),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public static string GenerateToken(
            string userId,
            string role,
            string secretKey,
            string issuer,
            string audience,
            int expiryHours = 8)
        {
            var roles = string.IsNullOrWhiteSpace(role) ? Array.Empty<string>() : new[] { role };
            return GenerateToken(userId, roles, secretKey, issuer, audience, expiryHours);
        }

        public static string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }

        public static ClaimsPrincipal GetPrincipalFromExpiredToken(
            string token,
            string secretKey,
            string issuer,
            string audience)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidateIssuer = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(secretKey)
                ),
                ValidateLifetime = false,
                ValidIssuer = issuer,
                ValidAudience = audience
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(
                token,
                tokenValidationParameters,
                out SecurityToken securityToken
            );

            return principal;
        }


    }
}
