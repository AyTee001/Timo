# Timo

Timo is an ASP.NET Core 10 application with a React/Vite frontend. The frontend is built and included in the ASP.NET Core publish output, so Azure App Service only needs to host the .NET application.

## Deploy to Azure App Service

1. Create an App Service using the .NET 10 runtime stack. Use a supported App Service operating system and enable **HTTPS Only**.
2. Create an Azure SQL database and allow the App Service to connect to it. In the App Service's **Environment variables** configuration, add:
   - `ConnectionStrings__DefaultConnection`: the Azure SQL connection string.
   - `Authentication__Jwt__SigningKey`: a randomly generated, Base64-encoded key containing at least 32 bytes. Keep it secret and stable across deployments and instances.
   - `Authentication__RequireHttps`: `true`.
   - `ASPNETCORE_FORWARDEDHEADERS_ENABLED`: `true`, so ASP.NET Core recognizes the HTTPS scheme forwarded by App Service.

   Generate a signing key locally in PowerShell:

   ```powershell
   $bytes = New-Object byte[] 32
   $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
   $rng.GetBytes($bytes)
   [Convert]::ToBase64String($bytes)
   $rng.Dispose()
   ```

3. Apply the EF Core migrations to the Azure SQL database before deploying. From the `backend` directory, with `ConnectionStrings__DefaultConnection` configured in your shell:

   ```powershell
   dotnet tool restore
   dotnet tool run dotnet-ef database update --project Timo.Infrastructure --startup-project Timo.WebApi
   ```

4. From the repository root, publish the application:

   ```powershell
   dotnet publish backend\Timo.WebApi\Timo.WebApi.csproj --configuration Release --output publish
   ```

   Publishing requires the .NET 10 SDK, Node.js 22, and npm. The publish target runs `npm ci` and `npm run build`, then places the React assets in `wwwroot` in the publish output.
5. Deploy the contents of the `publish` directory to the App Service as a .NET application. The application entry point is `Timo.WebApi.dll`.

The app serves the React single-page application and `/api` endpoints from the same origin. Unmatched client-side routes return the React app, while unmatched `/api` routes return 404. OpenAPI is available at `/openapi/v1.json` in Development.

Database migrations are intentionally not run automatically at application startup. Apply them as a deployment step before releasing schema-dependent application changes. For a single-instance setup, `Database__ApplyMigrations=true` can enable startup migrations, but a separate migration step is preferred when scaling out.

## Local development

Run the API from `backend` with `dotnet run --project Timo.WebApi`. Configure `ConnectionStrings__DefaultConnection` and `Authentication__Jwt__SigningKey` through environment variables, and do not put secrets in tracked settings files. In a second terminal, start the frontend development server; open the URL it prints (typically `http://localhost:5173`) to see the app. Vite proxies `/api` requests to the backend at `http://localhost:5246`. In development, the API's root URL is not the frontend; if you open it directly without published assets it returns 404 instead of throwing:

```powershell
cd frontend
npm ci
npm run dev
```

ASP.NET Core Identity validates credentials and creates the user principal; the API issues a 15-minute signed JWT access token and a rotating 14-day refresh token in separate HttpOnly, SameSite=Strict cookies. Refresh tokens are stored hashed in the database, and CSRF validation is required for state-changing requests. HTTPS is required by default outside Development. Project and time-entry queries are automatically scoped to the authenticated user through EF Core query filters.
