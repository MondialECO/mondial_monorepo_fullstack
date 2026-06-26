using Microsoft.AspNetCore.SignalR;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

public class CustomUserIdProvider : IUserIdProvider
{
    // ASP.NET Core 8 JwtBearer remaps inbound "sub" → ClaimTypes.NameIdentifier
    // by default; returning the short-name claim would always be null.
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?
            .FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
