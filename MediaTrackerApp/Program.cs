using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
// Load environment variables from .env
loadEnvironment();

var builder = WebApplication.CreateBuilder(args);

// Configure services
configureDatabase();
configureApi();

var app = builder.Build();

configurePipeline();

app.Run();


// CONFIGURATION METHODS
// Charge .env
void loadEnvironment()
{
    string envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
    if(File.Exists(envPath))
    {
        DotNetEnv.Env.Load(envPath);
    }
}

void configureDatabase()
{
    var dbHost = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
    var dbPort = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
    var dbName = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "mediatracker_dev";
    var dbUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
    var dbPassword = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "postgres";

    var connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";
    builder.Services.AddDbContext<MediaTrackerApp.Data.AppDbContext>(options =>
        options.UseNpgsql(connectionString)
    );
}

void configureApi()
{
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

void configurePipeline()
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseHttpsRedirection();
    // TODO: Add JWT authentication middleware here
    // endpoint mapping
    app.MapControllers();
}
