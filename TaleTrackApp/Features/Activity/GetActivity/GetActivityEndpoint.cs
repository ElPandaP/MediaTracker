using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using TaleTrackApp.Features.Activity;
using TaleTrackApp.Auth;

namespace TaleTrackApp.Features.Activity.GetActivity;

public class GetActivityRequest
{
    [RegularExpression(@"^(mine|friends|all)?$", ErrorMessage = "scope must be 'mine', 'friends', 'all' or empty")]
    public string? Scope { get; set; }

    [Range(1, 500)]
    public int? Limit { get; set; }

    /// <summary>When set, returns just that user's activity (public profile).</summary>
    [Range(1, int.MaxValue)]
    public int? UserId { get; set; }
}

public static class GetActivityEndpoint
{
    public static void Map(RouteGroupBuilder group)
    {
        group.MapGet("/activity", HandleAsync)
            .WithName("GetActivity")
            .WithDescription("Activity feed (yours and your friends'): started / finished / reviewed")
            .AddEndpointFilter<ValidationFilter>()
            .RequireAuthorization(Policies.UserPolicy);
    }

    private static async Task<IResult> HandleAsync(
        [AsParameters] GetActivityRequest request,
        ActivityService activityService,
        ClaimsPrincipal user,
        ILogger<GetActivityRequest> logger)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            return Results.Unauthorized();

        try
        {
            var limit = request.Limit ?? 200;
            var feed = request.UserId is int target
                ? await activityService.GetForUserAsync(userId, target, limit)
                : await activityService.GetFeedAsync(userId, request.Scope ?? "all", limit);

            return Results.Ok(new { success = true, count = feed.Count, data = feed });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error building activity feed");
            return Results.StatusCode(500);
        }
    }
}
