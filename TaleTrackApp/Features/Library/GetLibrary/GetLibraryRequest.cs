namespace TaleTrackApp.Features.Library.GetLibrary;

using System.ComponentModel.DataAnnotations;

public class GetLibraryRequest
{
    [RegularExpression(@"^(Movie|Series|Book)?$", ErrorMessage = "Type debe ser 'Movie', 'Series', 'Book' o vacío")]
    public string? Type { get; set; }

    [RegularExpression(@"^(in_progress|finished)?$", ErrorMessage = "Status debe ser 'in_progress', 'finished' o vacío")]
    public string? Status { get; set; }

    [RegularExpression(@"^(recent|rating)?$", ErrorMessage = "Sort debe ser 'recent', 'rating' o vacío")]
    public string? Sort { get; set; }

    [Range(2000, 3000, ErrorMessage = "Year debe estar entre 2000 y 3000")]
    public int? Year { get; set; }

    [Range(1, 200, ErrorMessage = "Limit debe estar entre 1 y 200")]
    public int? Limit { get; set; }
}
