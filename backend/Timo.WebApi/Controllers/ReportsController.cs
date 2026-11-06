//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using System.Security.Claims;
//using System.Text;
//using Timo.API.DTOs;
//using Timo.Infrastructure;
//using Timo.WebApi.DTO;

//namespace Timo.API.Controllers;

//[ApiController]
//[Route("api/reports")]
//[Authorize]
//public class ReportsController(TimoDbContext context) : ControllerBase
//{
//    /// <summary>
//    /// Експортувати статистику за період у форматі CSV (FR-09, UC-08)
//    /// </summary>
//    [HttpGet("export")]
//    [EndpointSummary("Експорт записів часу в CSV")]
//    [EndpointDescription("Генерує та завантажує файл CSV із записами часу за обраний період.")]
//    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK, "text/csv")]
//    public async Task<IActionResult> ExportCsv([FromQuery] DashboardFilterRequest filter, CancellationToken ct)
//    {
//        var userId = GetCurrentUserId();

//        var today = DateOnly.FromDateTime(DateTime.UtcNow);
//        var fromDate = filter.From ?? today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
//        var toDate = filter.To ?? fromDate.AddDays(6);

//        var entries = await context.TimeEntries
//            .AsNoTracking()
//            .Include(t => t.Project)
//            .Where(t => t.UserId == userId && t.Date >= fromDate && t.Date <= toDate)
//            .OrderBy(t => t.Date)
//            .ToListAsync(ct);

//        var builder = new StringBuilder();
//        builder.AppendLine("Date,Project,Duration,Description");

//        foreach (var entry in entries)
//        {
//            var projectName = entry.Project?.Name.Replace("\"", "\"\"") ?? "";
//            var description = entry.Description?.Replace("\"", "\"\"") ?? "";

//            builder.AppendLine($"\"{entry.Date:yyyy-MM-dd}\",\"{projectName}\",\"{entry.Duration}\",\"{description}\"");
//        }

//        var csvBytes = Encoding.UTF8.GetBytes(builder.ToString());
//        var fileName = $"timo_report_{fromDate:yyyyMMdd}_{toDate:yyyyMMdd}.csv";

//        return File(csvBytes, "text/csv", fileName);
//    }

//    private Guid GetCurrentUserId() =>
//        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
//}