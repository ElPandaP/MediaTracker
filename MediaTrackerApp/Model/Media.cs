namespace MediaTrackerApp.Model;

public class Media
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Type { get; set; }  // "Movie", "Series", "Book"
    public int length { get; set; } // Length in minutes/pages/episodes
    public DateTime FirstTrackedAt { get; set; } = DateTime.UtcNow;
}