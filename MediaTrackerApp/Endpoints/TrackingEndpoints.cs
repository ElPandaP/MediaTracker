using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediaTrackerApp.Data;
using MediaTrackerApp.Model;

namespace MediaTrackerApp.Endpoints;

public static class TrackingEndpoints
{
    public static void MapTrackingEndpoints(this WebApplication app)
    {
        app.MapPost("/api/tracking", CreateTrackingEvent)
            .WithTags("Tracking")
            .WithSummary("Create a tracking event")
            .WithDescription("Creates a tracking event for a user and media. If the media doesn't exist, it is created.")
            .Accepts<TrackingEventRequest>("application/json")
            .Produces<TrackingEventResponse>(StatusCodes.Status200OK)
            .Produces<ErrorResponse>(StatusCodes.Status400BadRequest);
    }

    private static async Task<IResult> CreateTrackingEvent(
        [FromBody] TrackingEventRequest request,
        AppDbContext db)
    {
        // Validate user exists
        var user = await db.Users.FindAsync(request.UserId);
        if (user == null)
        {
            return Results.BadRequest(new ErrorResponse { Error = "User not found" });
        }

        // Find or create media
        var media = await db.Medias.FirstOrDefaultAsync(m => 
            m.Title == request.Title && m.Type == request.Type);

        if (media == null)
        {
            media = new Media
            {
                Title = request.Title,
                Type = request.Type,
                length = request.Length ?? 0,
                FirstTrackedAt = DateTime.UtcNow
            };
            db.Medias.Add(media);
            await db.SaveChangesAsync();
        }

        // Create tracking event
        var trackingEvent = new TrackingEvent
        {
            UserId = user.Id,
            MediaId = media.Id,
            EventType = request.EventType,
            EventDate = DateTime.UtcNow
        };

        db.TrackingEvents.Add(trackingEvent);
        await db.SaveChangesAsync();

        return Results.Ok(new TrackingEventResponse
        {
            Success = true,
            TrackingEventId = trackingEvent.Id,
            MediaId = media.Id,
            Message = "Tracking event created successfully"
        });
    }
}

public record TrackingEventRequest(
    int UserId,
    string Title,
    string Type,
    string EventType,
    int? Length
);

public class TrackingEventResponse
{
    public bool Success { get; set; }
    public int TrackingEventId { get; set; }
    public int MediaId { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ErrorResponse
{
    public string Error { get; set; } = string.Empty;
}
