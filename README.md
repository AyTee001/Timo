# Timo

## Run with Docker Compose

1. Copy `.env.example` to `.env` and set `MSSQL_SA_PASSWORD` to a strong SQL Server password.
2. Start the services from the repository root:

   ```sh
   docker compose up --build
   ```

The frontend is available at <http://localhost:3000>, the API at <http://localhost:8080>, and SQL Server at `localhost:1433`. SQL Server data is persisted in the `sqlserver_data` named volume.

Create an account or sign in from the frontend. The API uses HTTP-only cookies, CSRF validation, and rotating 14-day refresh tokens. The local Compose setup serves HTTP, so its cookies are not marked `Secure`; HTTPS is required by default outside Development. Set `Authentication__RequireHttps=true` when deploying behind an HTTPS-terminating reverse proxy. Project data is scoped to the signed-in user. Compose applies EF Core migrations when the API starts; for a local API run, apply them from `backend` with `dotnet tool run dotnet-ef database update --project Timo.Infrastructure --startup-project Timo.WebApi`.

To stop the services, run `docker compose down`. The database volume is retained; remove it only when you intend to delete the stored database.

For local API runs outside Docker, configure `ConnectionStrings__DefaultConnection` through an environment variable or .NET user secrets; do not put database passwords in tracked settings files. The frontend dev server proxies `/api` to the backend at `http://localhost:5246`.
