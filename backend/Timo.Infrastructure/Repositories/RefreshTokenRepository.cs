using Microsoft.EntityFrameworkCore;
using Timo.Infrastructure.Entities;

namespace Timo.Infrastructure.Repositories;

public sealed class RefreshTokenRepository(TimoDbContext dbContext)
{
    public async Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken)
    {
        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Guid?> RotateAsync(
        string tokenHash,
        string replacementHash,
        DateTime nowUtc,
        DateTime replacementExpiresAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var token = await dbContext.RefreshTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.TokenHash == tokenHash &&
                        item.RevokedAtUtc == null &&
                        item.ExpiresAtUtc > nowUtc,
                cancellationToken);

        if (token is null)
        {
            return null;
        }

        var revoked = await dbContext.RefreshTokens
            .Where(item => item.Id == token.Id && item.RevokedAtUtc == null && item.ExpiresAtUtc > nowUtc)
            .ExecuteUpdateAsync(
                updates => updates.SetProperty(item => item.RevokedAtUtc, nowUtc),
                cancellationToken);

        if (revoked != 1)
        {
            return null;
        }

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            TokenHash = replacementHash,
            UserId = token.UserId,
            CreatedAtUtc = nowUtc,
            ExpiresAtUtc = replacementExpiresAtUtc
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return token.UserId;
    }

    public Task RevokeAsync(string tokenHash, DateTime nowUtc, CancellationToken cancellationToken)
    {
        return dbContext.RefreshTokens
            .Where(item => item.TokenHash == tokenHash && item.RevokedAtUtc == null)
            .ExecuteUpdateAsync(
                updates => updates.SetProperty(item => item.RevokedAtUtc, nowUtc),
                cancellationToken);
    }
}
