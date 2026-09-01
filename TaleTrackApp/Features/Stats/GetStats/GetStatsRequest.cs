namespace TaleTrackApp.Features.Stats.GetStats;

using System.ComponentModel.DataAnnotations;

public class GetStatsRequest
{
    [Range(2000, 3000, ErrorMessage = "Year debe estar entre 2000 y 3000")]
    public int? Year { get; set; }
}
