using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Timo.API.DTOs;
using Timo.Infrastructure;
using Timo.Infrastructure.Entities;

namespace Timo.WebApi.Controllers;

[ApiController]
[Route("api/time-entries")]
[Authorize]
[Produces("application/json")]
public class TimeEntriesController(TimoDbContext context) : ControllerBase
{
    /// <summary>
    /// Отримати деталі запису часу за ID
    /// </summary>
    /// <param name="id">Унікальний ідентифікатор запису часу</param>
    /// <returns>Деталі запису часу</returns>
    /// <response code="200">Успішне отримання запису</response>
    /// <response code="401">Користувач не авторизований</response>
    /// <response code="404">Запис часу не знайдено або він належить іншому користувачу</response>
    [HttpGet("{id:guid}")]
    [EndpointSummary("Отримати запис часу за ID")]
    [EndpointDescription("Повертає деталі конкретного запису часу. Забезпечує ізоляцію даних: якщо запис належить іншому користувачу, повертається 404.")]
    [ProducesResponseType(typeof(TimeEntryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeEntryResponse>> GetById(Guid id, CancellationToken ct)
    {
        var currentUserId = GetCurrentUserId();

        // Strict user isolation (NFR-02, FR-06)
        var entry = await context.TimeEntries
            .AsNoTracking()
            .Include(t => t.Project)
            .Where(t => t.Id == id && t.UserId == currentUserId)
            .Select(t => new TimeEntryResponse
            {
                Id = t.Id,
                Date = t.Date,
                Duration = t.Duration,
                Description = t.Description,
                ProjectId = t.ProjectId,
                ProjectName = t.Project != null ? t.Project.Name : string.Empty
            })
            .FirstOrDefaultAsync(ct);

        if (entry is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = $"Time entry with ID '{id}' was not found."
            });
        }

        return Ok(entry);
    }

    /// <summary>
    /// Створити новий запис часу
    /// </summary>
    /// <param name="request">Дані для створення запису часу</param>
    /// <returns>Створений запис часу</returns>
    /// <response code="201">Запис успішно створено</response>
    /// <response code="400">Некоректні вхідні дані або тривалість <= 0</response>
    /// <response code="401">Користувач не авторизований</response>
    /// <response code="404">Вказаний проєкт не існує або належить іншому користувачу</response>
    [HttpPost]
    [EndpointSummary("Створити новий запис часу")]
    [EndpointDescription("Створює новий запис відпрацьованого часу із прив'язкою до проєкту та поточного авторизованого користувача.")]
    [ProducesResponseType(typeof(TimeEntryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeEntryResponse>> Create([FromBody] SaveTimeEntryRequest request, CancellationToken ct)
    {
        var currentUserId = GetCurrentUserId();

        // BR-06: Duration must be > 0
        if (request.Duration <= TimeSpan.Zero)
        {
            ModelState.AddModelError(nameof(request.Duration), "Duration must be greater than zero.");
            return ValidationProblem(ModelState);
        }

        // Check if project exists and belongs to the current user (BR-05, FR-06)
        var project = await context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.UserId == currentUserId, ct);

        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Project Not Found",
                Detail = $"Project with ID '{request.ProjectId}' does not exist or access is forbidden."
            });
        }

        var entity = new TimeEntry
        {
            Id = Guid.NewGuid(),
            Date = request.Date,
            Duration = request.Duration,
            Description = request.Description,
            ProjectId = request.ProjectId,
            UserId = currentUserId
        };

        context.TimeEntries.Add(entity);
        await context.SaveChangesAsync(ct);

        var response = new TimeEntryResponse
        {
            Id = entity.Id,
            Date = entity.Date,
            Duration = entity.Duration,
            Description = entity.Description,
            ProjectId = entity.ProjectId,
            ProjectName = project.Name
        };

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, response);
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
}