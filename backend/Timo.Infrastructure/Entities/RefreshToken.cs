namespace Timo.Infrastructure.Entities;

public class RefreshToken
{
    public Guid Id { get; set; }

    public required string TokenHash { get; set; }

    public Guid UserId { get; set; }

    public ApplicationUser? User { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime? RevokedAtUtc { get; set; }
}
