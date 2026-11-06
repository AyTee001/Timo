FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Timo.slnx ./
COPY Timo.Infrastructure/Timo.Infrastructure.csproj Timo.Infrastructure/
COPY Timo.WebApi/Timo.WebApi.csproj Timo.WebApi/
RUN dotnet restore Timo.slnx

COPY . .
RUN dotnet publish Timo.WebApi/Timo.WebApi.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Timo.WebApi.dll"]
