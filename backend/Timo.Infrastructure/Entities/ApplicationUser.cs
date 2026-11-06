using Microsoft.AspNetCore.Identity;

namespace Timo.Infrastructure.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    // Navigation properties for isolated user data access
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}