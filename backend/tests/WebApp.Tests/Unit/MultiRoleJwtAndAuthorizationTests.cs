using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using WebApp.Middleware;
using Xunit;

namespace WebApp.Tests.Unit;

public class MultiRoleJwtAndAuthorizationTests
{
    private const string TestKey = "TestSecretKeyThatIsAtLeast32BytesLongForHmacSha256!";
    private const string TestIssuer = "MondialTestIssuer";
    private const string TestAudience = "MondialTestAudience";

    [Fact]
    public void GenerateToken_WithMultipleRoles_EmitsAllRoleClaimsInJwt()
    {
        // Arrange
        var userId = "user-12345";
        var roles = new[] { "Entrepreneur", "ServiceProvider" };

        // Act
        var tokenString = JwtTokenHelper.GenerateToken(userId, roles, TestKey, TestIssuer, TestAudience);

        // Assert: Read raw JWT
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(tokenString);

        var roleClaims = jwtToken.Claims.Where(c => c.Type == "role" || c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();

        Assert.Contains("Entrepreneur", roleClaims);
        Assert.Contains("ServiceProvider", roleClaims);
        Assert.Equal(2, roleClaims.Count);
    }

    [Fact]
    public void ValidateToken_WithMultiRoleUser_ClaimsPrincipalRecognizesAllRoles()
    {
        // Arrange
        var userId = "user-multi-role";
        var roles = new[] { "Creator", "ServiceProvider" };
        var tokenString = JwtTokenHelper.GenerateToken(userId, roles, TestKey, TestIssuer, TestAudience);

        // Act: Validate token into ClaimsPrincipal
        var handler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = TestIssuer,
            ValidateAudience = true,
            ValidAudience = TestAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestKey)),
            ValidateLifetime = true,
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier
        };

        var principal = handler.ValidateToken(tokenString, validationParameters, out _);

        // Assert: IsInRole checks used by ASP.NET [Authorize(Roles = "...")]
        Assert.True(principal.IsInRole("Creator"), "Principal should possess Creator role");
        Assert.True(principal.IsInRole("ServiceProvider"), "Principal should possess ServiceProvider role even when it is not first");
        Assert.False(principal.IsInRole("Admin"), "Principal must not possess Admin role");
        Assert.False(principal.IsInRole("Investor"), "Principal must not possess Investor role");
    }

    [Fact]
    public void GenerateToken_WithSingleRole_EmitsSingleRoleClaim()
    {
        // Arrange
        var userId = "user-single";
        var tokenString = JwtTokenHelper.GenerateToken(userId, "ServiceProvider", TestKey, TestIssuer, TestAudience);

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(tokenString);
        var roleClaims = jwtToken.Claims.Where(c => c.Type == "role" || c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();

        Assert.Single(roleClaims);
        Assert.Equal("ServiceProvider", roleClaims[0]);
    }

    [Fact]
    public void GenerateToken_WithEmptyRoles_EmitsDefaultUserRoleClaim()
    {
        // Arrange
        var userId = "user-empty";
        var tokenString = JwtTokenHelper.GenerateToken(userId, Array.Empty<string>(), TestKey, TestIssuer, TestAudience);

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(tokenString);
        var roleClaims = jwtToken.Claims.Where(c => c.Type == "role" || c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();

        Assert.Single(roleClaims);
        Assert.Equal("User", roleClaims[0]);
    }

    [Fact]
    public void GenerateToken_ThreeRoles_AllowsEveryPossessedRole()
    {
        // Arrange
        var userId = "user-tri-role";
        var roles = new[] { "Entrepreneur", "Investor", "ServiceProvider" };
        var tokenString = JwtTokenHelper.GenerateToken(userId, roles, TestKey, TestIssuer, TestAudience);

        var handler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = TestIssuer,
            ValidateAudience = true,
            ValidAudience = TestAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestKey)),
            ValidateLifetime = true,
            RoleClaimType = ClaimTypes.Role
        };

        var principal = handler.ValidateToken(tokenString, validationParameters, out _);

        Assert.True(principal.IsInRole("Entrepreneur"));
        Assert.True(principal.IsInRole("Investor"));
        Assert.True(principal.IsInRole("ServiceProvider"));
        Assert.False(principal.IsInRole("Admin"));
    }
}
