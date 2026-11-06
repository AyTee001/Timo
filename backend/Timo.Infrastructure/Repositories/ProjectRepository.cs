using Microsoft.EntityFrameworkCore;
using Timo.Infrastructure.Entities;

namespace Timo.Infrastructure.Repositories;

public sealed class ProjectRepository(TimoDbContext dbContext)
{
    public async Task<IReadOnlyList<ProjectSummary>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Projects
            .AsNoTracking()
            .OrderBy(project => project.Name)
            .Select(project => new ProjectSummary(
                project.Id,
                project.Name,
                project.Description,
                project.CreatedAtUtc,
                project.TimeEntries.Count))
            .ToListAsync(cancellationToken);
    }

    public Task<ProjectSummary?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return dbContext.Projects
            .AsNoTracking()
            .Where(project => project.Id == id)
            .Select(project => new ProjectSummary(
                project.Id,
                project.Name,
                project.Description,
                project.CreatedAtUtc,
                project.TimeEntries.Count))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<Project?> FindForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return dbContext.Projects
            .FirstOrDefaultAsync(project => project.Id == id, cancellationToken);
    }

    public Task<bool> NameExistsAsync(string name, Guid? excludingId, CancellationToken cancellationToken)
    {
        return dbContext.Projects.AnyAsync(
            project => project.Name == name &&
                       (!excludingId.HasValue || project.Id != excludingId.Value),
            cancellationToken);
    }

    public async Task<ProjectSummary> AddAsync(Project project, CancellationToken cancellationToken)
    {
        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ProjectSummary(project.Id, project.Name, project.Description, project.CreatedAtUtc, 0);
    }

    public async Task<ProjectSummary> SaveChangesAsync(Project project, CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(project.Id, cancellationToken)
            ?? throw new InvalidOperationException("The saved project could not be loaded.");
    }

    public async Task<bool> DeleteWithTimeEntriesAsync(Guid id, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var project = await dbContext.Projects
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (project is null)
        {
            return false;
        }

        await dbContext.TimeEntries
            .Where(entry => entry.ProjectId == project.Id)
            .ExecuteDeleteAsync(cancellationToken);

        dbContext.Projects.Remove(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }
}
