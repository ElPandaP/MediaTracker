using TaleTrackApp.Data;
using Microsoft.EntityFrameworkCore;

namespace TaleTrackApp.Features.Library;

/// <summary>One deduplicated media in the user's library, with their progress and rating.</summary>
public record LibraryItem(
    int MediaId,
    string Title,
    string Type,
    string? Author,
    string? PosterUrl,
    int Length,
    string? Isbn,
    int? Progress,
    DateTime LastEventDate,
    int? MyRating,
    int? MyReviewId);

public class LibraryService
{
    private readonly AppDbContext _context;
    private readonly ILogger<LibraryService> _logger;

    public LibraryService(AppDbContext context, ILogger<LibraryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// The user's library: tracking events collapsed to one row per media (most recent event wins),
    /// enriched with the user's own review rating. Supports type / status / year filters and sorting.
    /// </summary>
    public async Task<List<LibraryItem>> GetForUserAsync(
        int userId,
        string? type = null,
        string? status = null,
        string? sort = null,
        int? year = null)
    {
        var events = await _context.TrackingEvents
            .Where(te => te.UserId == userId)
            .Include(te => te.Media)
            .ToListAsync();

        var myReviews = await _context.Reviews
            .Where(r => r.UserId == userId)
            .ToListAsync();

        var reviewByMedia = myReviews
            .GroupBy(r => r.MediaId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.CreatedAt).First());

        var items = events
            .Where(te => te.Media != null)
            .GroupBy(te => te.MediaId)
            .Select(g =>
            {
                var latest = g.OrderByDescending(x => x.EventDate).First();
                var media = latest.Media!;
                reviewByMedia.TryGetValue(g.Key, out var review);
                return new LibraryItem(
                    MediaId: media.Id,
                    Title: media.Title,
                    Type: media.Type,
                    Author: media.Author,
                    PosterUrl: media.PosterUrl,
                    Length: media.Length,
                    Isbn: media.Isbn,
                    Progress: latest.Progress,
                    LastEventDate: latest.EventDate,
                    MyRating: review?.Rating,
                    MyReviewId: review?.Id);
            })
            .AsEnumerable();

        if (!string.IsNullOrWhiteSpace(type))
            items = items.Where(i => i.Type == type);

        if (year is int y)
            items = items.Where(i => i.LastEventDate.Year == y);

        items = status?.ToLowerInvariant() switch
        {
            "finished"    => items.Where(i => i.Progress == 100),
            "in_progress" => items.Where(i => i.Progress != 100),
            _             => items,
        };

        items = sort?.ToLowerInvariant() switch
        {
            "rating" => items.OrderByDescending(i => i.MyRating ?? -1).ThenByDescending(i => i.LastEventDate),
            _        => items.OrderByDescending(i => i.LastEventDate),
        };

        return items.ToList();
    }

    /// <summary>Finished media the user has not reviewed yet.</summary>
    public async Task<List<LibraryItem>> GetPendingReviewsAsync(int userId)
    {
        var finished = await GetForUserAsync(userId, status: "finished", sort: "recent");
        return finished.Where(i => i.MyRating == null).ToList();
    }
}
