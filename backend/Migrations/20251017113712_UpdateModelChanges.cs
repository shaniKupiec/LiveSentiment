using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LiveSentiment.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AnalysisCompleted",
                table: "Responses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "AnalysisError",
                table: "Responses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnalysisProvider",
                table: "Responses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<JsonDocument>(
                name: "AnalysisResults",
                table: "Responses",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AnalysisTimestamp",
                table: "Responses",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnalysisCompleted",
                table: "Responses");

            migrationBuilder.DropColumn(
                name: "AnalysisError",
                table: "Responses");

            migrationBuilder.DropColumn(
                name: "AnalysisProvider",
                table: "Responses");

            migrationBuilder.DropColumn(
                name: "AnalysisResults",
                table: "Responses");

            migrationBuilder.DropColumn(
                name: "AnalysisTimestamp",
                table: "Responses");
        }
    }
}
