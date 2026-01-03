namespace MediaTrackerApp.Model;

public class TrackingEvent
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int MediaId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public DateTime EventDate { get; set; } = DateTime.UtcNow;

}
