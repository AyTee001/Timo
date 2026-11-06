using System.Security.Claims;
using Timo.Infrastructure;

namespace Timo.WebApi;

public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public Guid UserId
    {
        get
        {
            var principal = httpContextAccessor.HttpContext?.User;
            if (principal?.Identity?.IsAuthenticated != true)
            {
                return Guid.Empty;
            }

            var value = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var userId) ? userId : Guid.Empty;
        }
    }
}
