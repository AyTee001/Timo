using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Timo.Infrastructure.Entities;

namespace Timo.Infrastructure;

public class TimoDbContext(
    DbContextOptions<TimoDbContext> options,
    ICurrentUser currentUser) : IdentityUserContext<ApplicationUser, Guid>(options)
{
    public Guid CurrentUserId => currentUser.UserId;

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("Users");

            entity.HasIndex(u => u.NormalizedEmail)
                  .IsUnique()
                  .HasDatabaseName("EmailIndex");
        });

        builder.Entity<Project>(entity =>
        {
            entity.ToTable("Projects");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasIndex(e => new { e.UserId, e.Name })
                  .IsUnique();

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Projects)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.UserId == CurrentUserId);
        });

        builder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TokenHash).IsRequired().HasMaxLength(64);
            entity.HasIndex(e => e.TokenHash).IsUnique();

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<TimeEntry>(entity =>
        {
            entity.ToTable("TimeEntries", t =>
            {
                t.HasCheckConstraint("CK_TimeEntries_Duration", "[Duration] > '00:00:00'");
            });

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => new { e.UserId, e.Date, e.ProjectId });

            entity.HasOne(e => e.Project)
                  .WithMany(p => p.TimeEntries)
                  .HasForeignKey(e => e.ProjectId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.User)
                  .WithMany(u => u.TimeEntries)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.NoAction);

            entity.HasQueryFilter(e => e.UserId == CurrentUserId);
        });
    }
}