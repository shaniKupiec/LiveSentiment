using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LiveSentiment.Migrations
{
    /// <inheritdoc />
    public partial class EditPresentationTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Date",
                table: "Presentations",
                newName: "LastUpdated");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "Presentations",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "Presentations");

            migrationBuilder.RenameColumn(
                name: "LastUpdated",
                table: "Presentations",
                newName: "Date");
        }
    }
}
