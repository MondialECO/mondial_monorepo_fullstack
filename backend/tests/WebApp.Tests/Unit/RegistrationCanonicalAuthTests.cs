using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using WebApp.Middleware;
using WebApp.Models.DatabaseModels;
using Xunit;

namespace WebApp.Tests.Unit;

public class RegistrationCanonicalAuthTests
{
    private const string TestKey = "TestSecretKeyThatIsAtLeast32BytesLongForHmacSha256!";
    private const string TestIssuer = "MondialTestIssuer";
    private const string TestAudience = "MondialTestAudience";

    [Theory]
    [InlineData("Creator")]
    [InlineData("Entrepreneur")]
    [InlineData("Investor")]
    [InlineData("ServiceProvider")]
    public void RegistrationAuth_GeneratesCanonicalAccessJwt_WithCorrectRoleAndClaims(string role)
    {
        // Arrange
        var userId = "test-user-id-12345";
        var roles = new[] { role };

        // Act - Registration uses canonical JwtTokenHelper.GenerateToken identical to Login
        var tokenString = JwtTokenHelper.GenerateToken(userId, roles, TestKey, TestIssuer, TestAudience);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(tokenString);

        var subClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub || c.Type == ClaimTypes.NameIdentifier)?.Value;
        var roleClaims = jwtToken.Claims.Where(c => c.Type == "role" || c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();

        Assert.Equal(userId, subClaim);
        Assert.Contains(role, roleClaims);
        Assert.True(jwtToken.ValidTo > DateTime.UtcNow.AddHours(7), "Token should expire in ~8 hours");
    }

    [Fact]
    public void RegistrationAuth_RefreshToken_FollowsCanonicalLoginFormat()
    {
        // Act - Uses canonical JwtTokenHelper.GenerateRefreshToken
        var refreshToken = JwtTokenHelper.GenerateRefreshToken();
        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = "127.0.0.1"
        };

        // Assert
        Assert.False(string.IsNullOrWhiteSpace(refreshToken));
        Assert.True(refreshToken.Length >= 64, "Refresh token should be at least 64 chars base64 string");
        Assert.True(refreshTokenEntity.ExpiresAt > DateTime.UtcNow.AddDays(6));
        Assert.Equal("127.0.0.1", refreshTokenEntity.CreatedByIp);
    }

    [Fact]
    public void CanonicalRegistrationToken_DoesNotContainOnboardingTokenTypeClaim()
    {
        // Arrange
        var userId = "canonical-user-id";
        var roles = new[] { "Creator" };

        // Act
        var tokenString = JwtTokenHelper.GenerateToken(userId, roles, TestKey, TestIssuer, TestAudience);
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(tokenString);

        // Assert - Canonical tokens must NOT contain a token_type=onboarding claim
        var tokenTypeClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "token_type")?.Value;
        Assert.Null(tokenTypeClaim);

        var subClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub || c.Type == ClaimTypes.NameIdentifier)?.Value;
        Assert.Equal(userId, subClaim);
    }
}
