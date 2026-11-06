using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Timo.Infrastructure.Entities;
using Timo.Infrastructure.Repositories;
using Timo.WebApi.DTOs;

namespace Timo.WebApi.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    RefreshTokenRepository refreshTokenRepository,
    IAntiforgery antiforgery) : ControllerBase
{
    private const string RefreshCookieName = "timo.refresh";
    private static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(14);

    [HttpGet("csrf")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CsrfTokenResponse), StatusCodes.Status200OK)]
    public ActionResult<CsrfTokenResponse> GetCsrfToken()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new CsrfTokenResponse(tokens.RequestToken!));
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(typeof(AuthenticatedUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthenticatedUserResponse>> Register(
        [FromBody] AuthRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = email,
            UserName = email
        };
        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return IdentityValidationProblem(result.Errors);
        }

        await StartSessionAsync(user, cancellationToken);
        return Ok(new AuthenticatedUserResponse(email));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(typeof(AuthenticatedUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthenticatedUserResponse>> Login(
        [FromBody] AuthRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        var user = await userManager.FindByEmailAsync(email);
        if (user is null ||
            !(await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true)).Succeeded)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Invalid email or password"
            });
        }

        await StartSessionAsync(user, cancellationToken);
        return Ok(new AuthenticatedUserResponse(email));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(typeof(AuthenticatedUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthenticatedUserResponse>> Refresh(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) ||
            string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized();
        }

        var now = DateTime.UtcNow;
        var replacementToken = CreateRefreshToken();
        var userId = await refreshTokenRepository.RotateAsync(
            HashToken(refreshToken),
            HashToken(replacementToken),
            now,
            now.Add(RefreshTokenLifetime),
            cancellationToken);

        if (userId is null)
        {
            Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions());
            return Unauthorized();
        }

        var user = await userManager.FindByIdAsync(userId.Value.ToString());
        if (user is null)
        {
            Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions());
            return Unauthorized();
        }

        await IssueSessionCookiesAsync(user, replacementToken, now);
        return Ok(new AuthenticatedUserResponse(user.Email ?? user.UserName ?? string.Empty));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        if (Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) &&
            !string.IsNullOrEmpty(refreshToken))
        {
            await refreshTokenRepository.RevokeAsync(HashToken(refreshToken), DateTime.UtcNow, cancellationToken);
        }

        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions());
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(AuthenticatedUserResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthenticatedUserResponse>> Me()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(new AuthenticatedUserResponse(user.Email ?? user.UserName ?? string.Empty));
    }

    private async Task StartSessionAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        if (Request.Cookies.TryGetValue(RefreshCookieName, out var existingToken) &&
            !string.IsNullOrEmpty(existingToken))
        {
            await refreshTokenRepository.RevokeAsync(HashToken(existingToken), now, cancellationToken);
        }

        var refreshToken = CreateRefreshToken();
        await refreshTokenRepository.AddAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            TokenHash = HashToken(refreshToken),
            UserId = user.Id,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(RefreshTokenLifetime)
        }, cancellationToken);

        await IssueSessionCookiesAsync(user, refreshToken, now);
    }

    private async Task IssueSessionCookiesAsync(ApplicationUser user, string refreshToken, DateTime now)
    {
        var principal = await signInManager.CreateUserPrincipalAsync(user);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                ExpiresUtc = now.Add(AccessTokenLifetime),
                IsPersistent = true,
                AllowRefresh = false
            });

        Response.Cookies.Append(
            RefreshCookieName,
            refreshToken,
            RefreshCookieOptions(now.Add(RefreshTokenLifetime)));
    }

    private CookieOptions RefreshCookieOptions(DateTime? expiresUtc = null) => new()
    {
        HttpOnly = true,
        Secure = Request.IsHttps,
        SameSite = SameSiteMode.Strict,
        Path = "/api/auth",
        Expires = expiresUtc
    };

    private static string CreateRefreshToken() =>
        WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(64));

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private ActionResult<AuthenticatedUserResponse> IdentityValidationProblem(
        IEnumerable<IdentityError> errors)
    {
        foreach (var error in errors)
        {
            ModelState.AddModelError(error.Code, error.Description);
        }

        return ValidationProblem(ModelState);
    }
}
