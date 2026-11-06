# Timo

## Run with Docker Compose

1. Copy `.env.example` to `.env`, set `MSSQL_SA_PASSWORD` to a strong SQL Server password, and set `JWT_SIGNING_KEY` to a random Base64-encoded key of at least 32 bytes. Generate a key in PowerShell with:

   ```powershell
   $bytes = New-Object byte[] 32
   $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
   $rng.GetBytes($bytes)
   [Convert]::ToBase64String($bytes)
   $rng.Dispose()
   ```

2. Start the services from the repository root:

   ```sh
   docker compose up --build
   ```

The frontend is available at <http://localhost:3000>, the API at <http://localhost:8080>, and SQL Server at `localhost:1433`. SQL Server data is persisted in the `sqlserver_data` named volume.

Create an account or sign in from the frontend. ASP.NET Core Identity validates credentials and creates the user principal; the API issues a 15-minute signed JWT access token and a rotating 14-day refresh token in separate HttpOnly, SameSite=Strict cookies. Refresh tokens are stored hashed in the database, and CSRF validation is required for state-changing requests. The local Compose setup serves HTTP, so its cookies are not marked `Secure`; HTTPS is required by default outside Development. Set `Authentication__RequireHttps=true` when deploying behind an HTTPS-terminating reverse proxy, and keep the signing key secret and stable across API instances. Project and time-entry queries are automatically scoped to the authenticated user through EF Core query filters. The time-entry API supports listing, creating, updating, and deleting entries. Compose applies EF Core migrations when the API starts; for a local API run, apply them from `backend` with `dotnet tool run dotnet-ef database update --project Timo.Infrastructure --startup-project Timo.WebApi`.

To stop the services, run `docker compose down`. The database volume is retained; remove it only when you intend to delete the stored database.

For local API runs outside Docker, configure `ConnectionStrings__DefaultConnection` and `Authentication__Jwt__SigningKey` through environment variables; use the same generated key for every API instance, and do not put secrets in tracked settings files. The frontend dev server proxies `/api` to the backend at `http://localhost:5246`.
