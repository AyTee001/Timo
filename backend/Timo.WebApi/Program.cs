using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Timo.Infrastructure;
using Timo.Infrastructure.Entities;
using Timo.Infrastructure.Repositories;
using Timo.WebApi.Services;

namespace Timo.WebApi
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            var requireHttps = builder.Configuration.GetValue<bool?>("Authentication:RequireHttps")
                ?? !builder.Environment.IsDevelopment();

            builder.Services.AddDbContext<TimoDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddScoped<ICurrentUser, CurrentUser>();

            builder.Services.AddDataProtection();
            var jwtTokenService = new JwtTokenService(builder.Configuration);
            builder.Services.AddSingleton(jwtTokenService);

            builder.Services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.Stores.MaxLengthForKeys = 128;
                options.Lockout.AllowedForNewUsers = true;
            })
            .AddEntityFrameworkStores<TimoDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

            builder.Services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.MapInboundClaims = true;
                    options.TokenValidationParameters = jwtTokenService.CreateValidationParameters();
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            context.Token = context.Request.Cookies["timo.auth"];
                            return Task.CompletedTask;
                        }
                    };
                });
            builder.Services.AddAuthorization();
            builder.Services.AddAntiforgery(options =>
            {
                options.HeaderName = "X-CSRF-TOKEN";
                options.Cookie.Name = "timo.antiforgery";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Strict;
                options.Cookie.SecurePolicy = requireHttps
                    ? CookieSecurePolicy.Always
                    : CookieSecurePolicy.SameAsRequest;
            });

            builder.Services.AddScoped<ProjectRepository>();
            builder.Services.AddScoped<TimeEntryRepository>();
            builder.Services.AddScoped<RefreshTokenRepository>();
            builder.Services.AddScoped<ProjectService>();
            builder.Services.AddScoped<TimeEntryService>();
            builder.Services.AddControllersWithViews();
            builder.Services.AddOpenApi();
            var app = builder.Build();

            if (builder.Configuration.GetValue<bool>("Database:ApplyMigrations"))
            {
                await using var scope = app.Services.CreateAsyncScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<TimoDbContext>();
                await dbContext.Database.MigrateAsync();
            }

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            if (requireHttps)
            {
                app.UseHttpsRedirection();
            }

            var spaIndexPath = app.Environment.WebRootPath is { } webRootPath
                ? Path.Combine(webRootPath, "index.html")
                : null;
            if (spaIndexPath is not null && File.Exists(spaIndexPath))
            {
                app.UseDefaultFiles();
                app.UseStaticFiles();
            }

            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();
            app.MapFallback(async context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    return;
                }

                if (spaIndexPath is null || !File.Exists(spaIndexPath))
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    await context.Response.WriteAsync(
                        "Frontend assets are not built. Run the Vite development server from the frontend directory.");
                    return;
                }

                context.Response.ContentType = "text/html";
                await context.Response.SendFileAsync(spaIndexPath);
            });

            await app.RunAsync();
        }
    }
}
