using Timo.Infrastructure.Entities;
using Timo.Infrastructure.Repositories;
using Timo.WebApi.DTOs;

namespace Timo.WebApi.Services;

public sealed class ProjectNameConflictException(string name)
    : Exception($"A project named '{name}' already exists.");

public sealed class ProjectNotFoundException(Guid id)
    : Exception($"Project with ID '{id}' was not found.");

public sealed class ProjectService(ProjectRepository repository)
{
    public Task<IReadOnlyList<ProjectSummary>> GetAllAsync(CancellationToken cancellationToken) =>
        repository.GetAllAsync(cancellationToken);

    public async Task<ProjectSummary> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        await repository.GetByIdAsync(id, cancellationToken)
        ?? throw new ProjectNotFoundException(id);

    public async Task<ProjectSummary> CreateAsync(
        Guid userId,
        SaveProjectRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        if (name.Length == 0)
        {
            throw new ArgumentException("Project name is required.");
        }

        if (await repository.NameExistsAsync(name, null, cancellationToken))
        {
            throw new ProjectNameConflictException(name);
        }

        return await repository.AddAsync(new Project
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = NormalizeDescription(request.Description),
            CreatedAtUtc = DateTime.UtcNow,
            UserId = userId
        }, cancellationToken);
    }

    public async Task<ProjectSummary> UpdateAsync(
        Guid id,
        SaveProjectRequest request,
        CancellationToken cancellationToken)
    {
        var project = await repository.FindForUpdateAsync(id, cancellationToken)
            ?? throw new ProjectNotFoundException(id);
        var name = request.Name.Trim();

        if (name.Length == 0)
        {
            throw new ArgumentException("Project name is required.");
        }

        if (await repository.NameExistsAsync(name, id, cancellationToken))
        {
            throw new ProjectNameConflictException(name);
        }

        project.Name = name;
        project.Description = NormalizeDescription(request.Description);
        return await repository.SaveChangesAsync(project, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        if (!await repository.DeleteWithTimeEntriesAsync(id, cancellationToken))
        {
            throw new ProjectNotFoundException(id);
        }
    }

    private static string? NormalizeDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? null : description.Trim();
}
