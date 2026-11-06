using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace Timo.WebApi.Services;

public sealed class JwtTokenService
{
    private readonly string issuer;
    private readonly string audience;
    private readonly SigningCredentials signingCredentials;
    private readonly SymmetricSecurityKey signingKey;

    public JwtTokenService(IConfiguration configuration)
    {
        issuer = configuration["Authentication:Jwt:Issuer"]
            ?? throw new InvalidOperationException("Authentication:Jwt:Issuer must be configured.");
        audience = configuration["Authentication:Jwt:Audience"]
            ?? throw new InvalidOperationException("Authentication:Jwt:Audience must be configured.");

        var encodedSigningKey = configuration["Authentication:Jwt:SigningKey"]
            ?? throw new InvalidOperationException("Authentication:Jwt:SigningKey must be configured.");

        byte[] keyBytes;
        try
        {
            keyBytes = Convert.FromBase64String(encodedSigningKey);
        }
        catch (FormatException exception)
        {
            throw new InvalidOperationException(
                "Authentication:Jwt:SigningKey must be a Base64-encoded key of at least 32 bytes.",
                exception);
        }

        if (keyBytes.Length < 32)
        {
            throw new InvalidOperationException(
                "Authentication:Jwt:SigningKey must be a Base64-encoded key of at least 32 bytes.");
        }

        signingKey = new SymmetricSecurityKey(keyBytes);
        signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
    }

    public string CreateAccessToken(ClaimsPrincipal principal, DateTime issuedAtUtc, TimeSpan lifetime)
    {
        var claims = principal.Claims.Append(
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")));
        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            issuedAtUtc,
            issuedAtUtc.Add(lifetime),
            signingCredentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public TokenValidationParameters CreateValidationParameters() => new()
    {
        RequireSignedTokens = true,
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = signingKey,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30),
        ValidAlgorithms = [SecurityAlgorithms.HmacSha256]
    };
}
