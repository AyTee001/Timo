using Microsoft.EntityFrameworkCore;
using Timo.Infrastructure.Entities;

namespace Timo.Infrastructure.Repositories;

public sealed class TimeEntryRepository(TimoDbContext dbContext)
{
    public async Task<IReadOnlyList<TimeEntrySummary>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.TimeEntries
            .AsNoTracking()
            .OrderByDescending(entry => entry.Date)
            .ThenByDescending(entry => entry.Id)
            .Select(entry => new TimeEntrySummary(
                entry.Id,
                entry.Date,
                entry.Duration,
                entry.Description,
                entry.ProjectId,
                entry.Project!.Name))
            .ToListAsync(cancellationToken);
    }

    public Task<TimeEntrySummary?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return dbContext.TimeEntries
            .AsNoTracking()
            .Where(entry => entry.Id == id)
            .Select(entry => new TimeEntrySummary(
                entry.Id,
                entry.Date,
                entry.Duration,
                entry.Description,
                entry.ProjectId,
                entry.Project!.Name))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<TimeEntry?> FindForUpdateAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.TimeEntries.FirstOrDefaultAsync(entry => entry.Id == id, cancellationToken);

    public Task<bool> ProjectExistsAsync(Guid projectId, CancellationToken cancellationToken) =>
        dbContext.Projects.AnyAsync(project => project.Id == projectId, cancellationToken);

    public async Task<TimeEntrySummary> AddAsync(TimeEntry entry, CancellationToken cancellationToken)
    {
        dbContext.TimeEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(entry.Id, cancellationToken)
            ?? throw new InvalidOperationException("The saved time entry could not be loaded.");
    }

    public async Task<TimeEntrySummary> SaveChangesAsync(TimeEntry entry, CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(entry.Id, cancellationToken)
            ?? throw new InvalidOperationException("The saved time entry could not be loaded.");
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var entry = await FindForUpdateAsync(id, cancellationToken);
        if (entry is null)
        {
            return false;
        }

        dbContext.TimeEntries.Remove(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
