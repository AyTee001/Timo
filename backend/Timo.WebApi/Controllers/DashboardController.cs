using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Timo.Infrastructure;
using Timo.WebApi.DTO;

namespace Timo.WebApi.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
[Produces("application/json")]
public class DashboardController(TimoDbContext context) : ControllerBase
{
    /// <summary>
    /// Отримати зведену статистику для персонального дашборду
    /// </summary>
    [HttpGet]
    [EndpointSummary("Отримати статистику дашборду")]
    [EndpointDescription("Розраховує загальний відпрацьований час, кількість активних проєктів, кількість записів та формує дані для діаграм за вказаний період.")]
    [ProducesResponseType(typeof(DashboardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardResponse>> GetDashboardData([FromQuery] DashboardFilterRequest filter, CancellationToken ct)
    {
        var userId = GetCurrentUserId();

        // BR-09: Default range - current week (Monday to Sunday)
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var defaultFrom = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
        var defaultTo = defaultFrom.AddDays(6);

        var fromDate = filter.From ?? defaultFrom;
        var toDate = filter.To ?? defaultTo;

        if (toDate < fromDate)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid Date Range",
                Detail = "The 'To' date cannot be earlier than the 'From' date."
            });
        }

        var entries = await context.TimeEntries
            .AsNoTracking()
            .Include(t => t.Project)
            .Where(t => t.UserId == userId && t.Date >= fromDate && t.Date <= toDate)
            .ToListAsync(ct);

        // KPI Calculations
        var totalTicks = entries.Sum(e => e.Duration.Ticks);
        var totalDuration = TimeSpan.FromTicks(totalTicks);
        var activeProjectsCount = entries.Select(e => e.ProjectId).Distinct().Count();
        var totalEntriesCount = entries.Count;

        // Pie Chart: Time by Project
        var projectBreakdown = entries
            .GroupBy(e => new { e.ProjectId, Name = e.Project?.Name ?? "Невідомий" })
            .Select(g =>
            {
                var projectTicks = g.Sum(e => e.Duration.Ticks);
                var percentage = totalTicks > 0 ? Math.Round((double)projectTicks / totalTicks * 100, 1) : 0;
                return new ProjectTimeShareDto
                {
                    ProjectId = g.Key.ProjectId,
                    ProjectName = g.Key.Name,
                    TotalDuration = TimeSpan.FromTicks(projectTicks),
                    Percentage = percentage
                };
            })
            .OrderByDescending(p => p.TotalDuration)
            .ToList();

        // Bar Chart: Time by Days
        var dailyBreakdown = new List<DailyTimeShareDto>();
        for (var date = fromDate; date <= toDate; date = date.AddDays(1))
        {
            var dayEntries = entries.Where(e => e.Date == date);
            var dayTicks = dayEntries.Sum(e => e.Duration.Ticks);
            dailyBreakdown.Add(new DailyTimeShareDto
            {
                Date = date,
                DayOfWeek = date.DayOfWeek.ToString(),
                TotalDuration = TimeSpan.FromTicks(dayTicks)
            });
        }

        return Ok(new DashboardResponse
        {
            TotalDuration = totalDuration,
            ActiveProjectsCount = activeProjectsCount,
            TotalEntriesCount = totalEntriesCount,
            ProjectBreakdown = projectBreakdown,
            DailyBreakdown = dailyBreakdown
        });
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}