namespace MediaTrackerApp.Model;

public class Review
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int MediaId { get; set; }
    public string? Comment { get; set; }
    public int Rating { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
