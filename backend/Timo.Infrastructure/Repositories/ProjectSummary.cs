namespace Timo.Infrastructure.Repositories;

public sealed record ProjectSummary(
    Guid Id,
    string Name,
    string? Description,
    DateTime CreatedAtUtc,
    int TimeEntriesCount);
