namespace Timo.Infrastructure.Entities;

public class TimeEntry
{
    public Guid Id { get; set; }

    public DateOnly Date { get; set; }

    public TimeSpan Duration { get; set; }

    public string? Description { get; set; }

    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }

    // Redundant but necessary foreign key to ensure strict user isolation (FR-05, FR-06)
    // without requiring complex joins through the Project table for basic security checks.
    public Guid UserId { get; set; }
    public ApplicationUser? User { get; set; }
}