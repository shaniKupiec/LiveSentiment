using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LiveSentiment.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEnableTextAnalysis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnableTextAnalysis",
                table: "Questions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EnableTextAnalysis",
                table: "Questions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
