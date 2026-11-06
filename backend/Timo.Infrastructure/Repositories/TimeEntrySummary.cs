namespace Timo.Infrastructure.Repositories;

public sealed record TimeEntrySummary(
    Guid Id,
    DateOnly Date,
    TimeSpan Duration,
    string? Description,
    Guid ProjectId,
    string ProjectName);
