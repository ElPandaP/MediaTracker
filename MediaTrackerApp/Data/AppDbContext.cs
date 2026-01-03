using Microsoft.EntityFrameworkCore;
using MediaTrackerApp.Model;
namespace MediaTrackerApp.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Media> Medias { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<TrackingEvent> TrackingEvents { get; set; }

    // TODO: OnModelCreating function for relationships and unique values (or in each model, there are two ways)
}
