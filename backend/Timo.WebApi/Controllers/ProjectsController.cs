using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Timo.Infrastructure.Repositories;
using Timo.WebApi.DTOs;
using Timo.WebApi.Services;

namespace Timo.WebApi.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
[Produces("application/json")]
public sealed class ProjectsController(ProjectService projectService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProjectResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var projects = await projectService.GetAllAsync(cancellationToken);
        return Ok(projects.Select(ToResponse).ToArray());
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await projectService.GetByIdAsync(id, cancellationToken)));
        }
        catch (ProjectNotFoundException)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Project not found"
            });
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProjectResponse>> Create(
        [FromBody] SaveProjectRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var project = await projectService.CreateAsync(GetCurrentUserId(), request, cancellationToken);
            var response = ToResponse(project);
            return CreatedAtAction(nameof(GetById), new { id = project.Id }, response);
        }
        catch (ProjectNameConflictException exception)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Project already exists",
                Detail = exception.Message
            });
        }
        catch (ArgumentException exception)
        {
            ModelState.AddModelError(nameof(request.Name), exception.Message);
            return ValidationProblem(ModelState);
        }
    }

    [HttpPut("{id:guid}")]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProjectResponse>> Update(
        Guid id,
        [FromBody] SaveProjectRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var project = await projectService.UpdateAsync(id, request, cancellationToken);
            return Ok(ToResponse(project));
        }
        catch (ProjectNotFoundException)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Project not found"
            });
        }
        catch (ProjectNameConflictException exception)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Project already exists",
                Detail = exception.Message
            });
        }
        catch (ArgumentException exception)
        {
            ModelState.AddModelError(nameof(request.Name), exception.Message);
            return ValidationProblem(ModelState);
        }
    }

    [HttpDelete("{id:guid}")]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await projectService.DeleteAsync(id, cancellationToken);
            return NoContent();
        }
        catch (ProjectNotFoundException)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Project not found"
            });
        }
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static ProjectResponse ToResponse(ProjectSummary project) =>
        new(project.Id, project.Name, project.Description, project.CreatedAtUtc, project.TimeEntriesCount);
}
