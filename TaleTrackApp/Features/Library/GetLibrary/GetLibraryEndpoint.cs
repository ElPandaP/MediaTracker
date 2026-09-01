using System.Security.Claims;
using TaleTrackApp.Auth;

namespace TaleTrackApp.Features.Library.GetLibrary;

public static class GetLibraryEndpoint
{
    public static void Map(RouteGroupBuilder group)
    {
        group.MapGet("/library", HandleAsync)
            .WithName("GetLibrary")
            .WithDescription("Biblioteca del usuario autenticado (una fila por media) con filtros type/status/sort/year/limit")
            .AddEndpointFilter<ValidationFilter>()
            .RequireAuthorization(Policies.UserPolicy);
    }

    private static async Task<IResult> HandleAsync(
        [AsParameters] GetLibraryRequest request,
        LibraryService libraryService,
        ClaimsPrincipal user,
        ILogger<GetLibraryRequest> logger)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            logger.LogWarning("Invalid or missing user ID in JWT token");
            return Results.Unauthorized();
        }

        try
        {
            var items = await libraryService.GetForUserAsync(
                userId, request.Type, request.Status, request.Sort, request.Year, request.Limit);

            return Results.Ok(new { success = true, count = items.Count, data = items });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving library for user");
            return Results.StatusCode(500);
        }
    }
}
