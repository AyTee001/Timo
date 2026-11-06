using System.ComponentModel.DataAnnotations;

namespace Timo.WebApi.DTOs;

public record SaveProjectRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; init; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; init; }
}

public record ProjectResponse(
    Guid Id,
    string Name,
    string? Description,
    DateTime CreatedAt,
    int TimeEntriesCount);
