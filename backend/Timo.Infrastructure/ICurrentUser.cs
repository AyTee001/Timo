namespace Timo.Infrastructure;

public interface ICurrentUser
{
    Guid UserId { get; }
}
