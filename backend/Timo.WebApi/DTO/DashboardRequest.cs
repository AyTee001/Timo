using Microsoft.AspNetCore.Mvc;

namespace Timo.WebApi.DTO;

public record DashboardFilterRequest
{
    /// <summary>
    /// Початкова дата періоду (за замовчуванням: початок поточного тижня).
    /// </summary>
    /// <example>2026-10-19</example>
    [FromQuery]
    public DateOnly? From { get; init; }

    /// <summary>
    /// Кінцева дата періоду (за замовчуванням: кінець поточного тижня).
    /// </summary>
    /// <example>2026-10-25</example>
    [FromQuery]
    public DateOnly? To { get; init; }
}

public record DashboardResponse
{
    /// <summary>
    /// Сумарний відпрацьований час за обраний період.
    /// </summary>
    /// <example>24:30:00</example>
    public TimeSpan TotalDuration { get; init; }

    /// <summary>
    /// Кількість активних проєктів (які мають хоча б один запис у період).
    /// </summary>
    /// <example>3</example>
    public int ActiveProjectsCount { get; init; }

    /// <summary>
    /// Загальна кількість записів часу за обраний період.
    /// </summary>
    /// <example>8</example>
    public int TotalEntriesCount { get; init; }

    /// <summary>
    /// Розподіл часу за проєктами (для кругової діаграми / Pie Chart).
    /// </summary>
    public List<ProjectTimeShareDto> ProjectBreakdown { get; init; } = [];

    /// <summary>
    /// Розподіл часу за днями (для стовпчикової діаграми / Bar Chart).
    /// </summary>
    public List<DailyTimeShareDto> DailyBreakdown { get; init; } = [];
}

public record ProjectTimeShareDto
{
    public Guid ProjectId { get; init; }
    public string ProjectName { get; init; } = string.Empty;
    public TimeSpan TotalDuration { get; init; }

    /// <summary>
    /// Частка від загального часу у відсотках.
    /// </summary>
    /// <example>45.5</example>
    public double Percentage { get; init; }
}

public record DailyTimeShareDto
{
    public DateOnly Date { get; init; }
    public string DayOfWeek { get; init; } = string.Empty;
    public TimeSpan TotalDuration { get; init; }
}
