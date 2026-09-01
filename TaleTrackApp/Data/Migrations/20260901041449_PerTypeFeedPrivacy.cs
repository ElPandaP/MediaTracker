using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaleTrackApp.Data.Migrations
{
    /// <inheritdoc />
    public partial class PerTypeFeedPrivacy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ShareReviewsWithFriends",
                table: "Users",
                newName: "ShareSeriesReviews");

            migrationBuilder.RenameColumn(
                name: "ShareProgressWithFriends",
                table: "Users",
                newName: "ShareSeriesProgress");

            migrationBuilder.AddColumn<bool>(
                name: "ShareBookProgress",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShareBookReviews",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShareMovieProgress",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShareMovieReviews",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShareBookProgress",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShareBookReviews",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShareMovieProgress",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShareMovieReviews",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "ShareSeriesReviews",
                table: "Users",
                newName: "ShareReviewsWithFriends");

            migrationBuilder.RenameColumn(
                name: "ShareSeriesProgress",
                table: "Users",
                newName: "ShareProgressWithFriends");
        }
    }
}
