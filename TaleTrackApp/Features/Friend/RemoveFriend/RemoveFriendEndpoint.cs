using System.Security.Claims;
using TaleTrackApp.Features.Friend;
using TaleTrackApp.Auth;

namespace TaleTrackApp.Features.Friend.RemoveFriend;

public static class RemoveFriendEndpoint
{
    public static void Map(RouteGroupBuilder group)
    {
        group.MapDelete("/friends/{userId:int}", HandleAsync)
            .WithName("RemoveFriend")
            .WithDescription("Remove a friendship (or cancel a pending request) with another user")
            .RequireAuthorization(Policies.UserPolicy);
    }

    private static async Task<IResult> HandleAsync(
        int userId,
        FriendService friendService,
        ClaimsPrincipal user,
        ILoggerFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(nameof(RemoveFriendEndpoint));
        var meClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(meClaim) || !int.TryParse(meClaim, out int me))
            return Results.Unauthorized();

        var removed = await friendService.RemoveAsync(me, userId);
        return removed
            ? Results.Ok(new { success = true })
            : Results.NotFound(new { success = false, message = "No such friendship." });
    }
}
