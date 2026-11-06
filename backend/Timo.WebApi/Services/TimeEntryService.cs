using Timo.API.DTOs;
using Timo.Infrastructure.Entities;
using Timo.Infrastructure.Repositories;

namespace Timo.WebApi.Services;

public sealed class TimeEntryNotFoundException(Guid id)
    : Exception($"Time entry with ID '{id}' was not found.");

public sealed class TimeEntryProjectNotFoundException(Guid id)
    : Exception($"Project with ID '{id}' was not found.");

public sealed class TimeEntryService(TimeEntryRepository repository)
{
    public Task<IReadOnlyList<TimeEntrySummary>> GetAllAsync(CancellationToken cancellationToken) =>
        repository.GetAllAsync(cancellationToken);

    public async Task<TimeEntrySummary> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        await repository.GetByIdAsync(id, cancellationToken)
        ?? throw new TimeEntryNotFoundException(id);

    public async Task<TimeEntrySummary> CreateAsync(
        Guid userId,
        SaveTimeEntryRequest request,
        CancellationToken cancellationToken)
    {
        await EnsureProjectExistsAsync(request.ProjectId, cancellationToken);

        return await repository.AddAsync(new TimeEntry
        {
            Id = Guid.NewGuid(),
            Date = request.Date,
            Duration = TimeSpan.FromMinutes(request.DurationMinutes),
            Description = NormalizeDescription(request.Description),
            ProjectId = request.ProjectId,
            UserId = userId
        }, cancellationToken);
    }

    public async Task<TimeEntrySummary> UpdateAsync(
        Guid id,
        SaveTimeEntryRequest request,
        CancellationToken cancellationToken)
    {
        var entry = await repository.FindForUpdateAsync(id, cancellationToken)
            ?? throw new TimeEntryNotFoundException(id);
        await EnsureProjectExistsAsync(request.ProjectId, cancellationToken);

        entry.Date = request.Date;
        entry.Duration = TimeSpan.FromMinutes(request.DurationMinutes);
        entry.Description = NormalizeDescription(request.Description);
        entry.ProjectId = request.ProjectId;

        return await repository.SaveChangesAsync(entry, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        if (!await repository.DeleteAsync(id, cancellationToken))
        {
            throw new TimeEntryNotFoundException(id);
        }
    }

    private async Task EnsureProjectExistsAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (!await repository.ProjectExistsAsync(projectId, cancellationToken))
        {
            throw new TimeEntryProjectNotFoundException(projectId);
        }
    }

    private static string? NormalizeDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? null : description.Trim();
}
