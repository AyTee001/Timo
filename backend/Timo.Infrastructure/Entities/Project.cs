namespace Timo.Infrastructure.Entities;

public class Project
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    // Explicit foreign key to enforce FR-06 (Data Isolation)
    public Guid UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}
