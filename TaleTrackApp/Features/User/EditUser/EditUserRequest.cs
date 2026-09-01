namespace TaleTrackApp.Features.User.EditUser;

using System.ComponentModel.DataAnnotations;

public class FeedPrivacyRequest
{
    public bool? BookProgress { get; set; }
    public bool? BookReviews { get; set; }
    public bool? MovieProgress { get; set; }
    public bool? MovieReviews { get; set; }
    public bool? SeriesProgress { get; set; }
    public bool? SeriesReviews { get; set; }
}

public class EditUserRequest
{
    [StringLength(50, MinimumLength = 3, ErrorMessage = "username must be between 3 and 50 characters")]
    public string? Username { get; set; }

    [EmailAddress(ErrorMessage = "invalid email")]
    [StringLength(256, ErrorMessage = "email cannot exceed 256 characters")]
    public string? Email { get; set; }

    [StringLength(100, MinimumLength = 6, ErrorMessage = "password must be between 6 and 100 characters")]
    public string? Password { get; set; }

    [StringLength(2048, ErrorMessage = "avatarUrl cannot exceed 2048 characters")]
    [Url(ErrorMessage = "avatarUrl must be a valid URL")]
    public string? AvatarUrl { get; set; }

    public FeedPrivacyRequest? Privacy { get; set; }
}
