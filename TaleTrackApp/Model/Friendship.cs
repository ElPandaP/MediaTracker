namespace TaleTrackApp.Model;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// A directed friend request that becomes a (still directed on disk, but
/// symmetric in meaning) friendship once accepted.
/// Status: "Pending" | "Accepted". A decline just deletes the row.
/// </summary>
public class Friendship
{
    [Key]
    public int Id { get; set; }

    [Required]
    [ForeignKey(nameof(Requester))]
    public int RequesterId { get; set; }

    [Required]
    [ForeignKey(nameof(Addressee))]
    public int AddresseeId { get; set; }

    [Required]
    [StringLength(20)]
    [RegularExpression(@"^(Pending|Accepted)$")]
    public string Status { get; set; } = "Pending";

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RespondedAt { get; set; }

    public User? Requester { get; set; }
    public User? Addressee { get; set; }
}
