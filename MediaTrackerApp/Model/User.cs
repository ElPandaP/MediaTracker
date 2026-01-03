namespace MediaTrackerApp.Model;

public class User
{
    public int Id {get;set;}
    public required string Email {get; set;}
    public required string Username {get; set;}
    public required string PasswordHash {get; set;}
    public DateTime CreatedAt {get; set;} = DateTime.UtcNow;
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
