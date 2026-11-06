using System.ComponentModel.DataAnnotations;

namespace Timo.API.DTOs;

public record SaveTimeEntryRequest
{
    [Required]
    public DateOnly Date { get; init; }

    [Required]
    public TimeSpan Duration { get; init; }

    [MaxLength(500)]
    public string? Description { get; init; }

    [Required]
    public Guid ProjectId { get; init; }
}

public record TimeEntryResponse
{
    public Guid Id { get; init; }

    public DateOnly Date { get; init; }

    public TimeSpan Duration { get; init; }

    public string? Description { get; init; }

    public Guid ProjectId { get; init; }

    public string ProjectName { get; init; } = string.Empty;
}