using System.ComponentModel.DataAnnotations;

namespace Timo.API.DTOs;

public record SaveTimeEntryRequest
{
    [Required]
    public DateOnly Date { get; init; }

    [Range(1, 1439)]
    public int DurationMinutes { get; init; }

    [MaxLength(500)]
    public string? Description { get; init; }

    [Required]
    public Guid ProjectId { get; init; }
}

public record TimeEntryResponse
{
    public Guid Id { get; init; }

    public DateOnly Date { get; init; }

    public int DurationMinutes { get; init; }

    public string? Description { get; init; }

    public Guid ProjectId { get; init; }

    public string ProjectName { get; init; } = string.Empty;
}