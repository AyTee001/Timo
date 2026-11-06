using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Timo.API.DTOs;
using Timo.Infrastructure.Repositories;
using Timo.WebApi.Services;

namespace Timo.WebApi.Controllers;

[ApiController]
[Route("api/time-entries")]
[Authorize]
[Produces("application/json")]
public sealed class TimeEntriesController(TimeEntryService timeEntryService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TimeEntryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TimeEntryResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var entries = await timeEntryService.GetAllAsync(cancellationToken);
        return Ok(entries.Select(ToResponse).ToArray());
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TimeEntryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeEntryResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await timeEntryService.GetByIdAsync(id, cancellationToken)));
        }
        catch (TimeEntryNotFoundException)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Time entry not found"
            });
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(typeof(TimeEntryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeEntryResponse>> Create(
        [FromBody] SaveTimeEntryRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var entry = await timeEntryService.CreateAsync(GetCurrentUserId(), request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = entry.Id }, ToResponse(entry));
        }
        catch (TimeEntryProjectNotFoundException)
        {
            return ProjectNotFound(request.ProjectId);
        }
    }

    [HttpPut("{id:guid}")]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(typeof(TimeEntryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeEntryResponse>> Update(
        Guid id,
        [FromBody] SaveTimeEntryRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await timeEntryService.UpdateAsync(id, request, cancellationToken)));
        }
        catch (TimeEntryNotFoundException)
        {
            return TimeEntryNotFound(id);
        }
        catch (TimeEntryProjectNotFoundException)
        {
            return ProjectNotFound(request.ProjectId);
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
            await timeEntryService.DeleteAsync(id, cancellationToken);
            return NoContent();
        }
        catch (TimeEntryNotFoundException)
        {
            return TimeEntryNotFound(id);
        }
    }

    private Guid GetCurrentUserId()
    {
        var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(claimValue, out var userId))
        {
            return userId;
        }

        throw new UnauthorizedAccessException("User ID claim is missing or invalid.");
    }

    private static TimeEntryResponse ToResponse(TimeEntrySummary entry) => new()
    {
        Id = entry.Id,
        Date = entry.Date,
        DurationMinutes = (int)entry.Duration.TotalMinutes,
        Description = entry.Description,
        ProjectId = entry.ProjectId,
        ProjectName = entry.ProjectName
    };

    private static NotFoundObjectResult TimeEntryNotFound(Guid id) =>
        new(new ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Time entry not found",
            Detail = $"Time entry with ID '{id}' was not found."
        });

    private static NotFoundObjectResult ProjectNotFound(Guid id) =>
        new(new ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Project not found",
            Detail = $"Project with ID '{id}' does not exist or is inaccessible."
        });
}
