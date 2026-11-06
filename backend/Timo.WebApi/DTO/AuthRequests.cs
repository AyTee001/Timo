using System.ComponentModel.DataAnnotations;

namespace Timo.WebApi.DTOs;

public sealed record AuthRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public string Password { get; init; } = string.Empty;
}

public sealed record AuthenticatedUserResponse(string Email);

public sealed record CsrfTokenResponse(string RequestToken);
