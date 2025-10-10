using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LiveSentiment.Migrations
{
    /// <inheritdoc />
    public partial class RemovePollsAndAddLiveTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Responses_Polls_PollId",
                table: "Responses");

            migrationBuilder.DropTable(
                name: "Polls");

            migrationBuilder.DropIndex(
                name: "IX_Responses_PollId",
                table: "Responses");

            migrationBuilder.DropColumn(
                name: "PollId",
                table: "Responses");

            migrationBuilder.DropColumn(
                name: "LoginMethod",
                table: "Presenters");

            migrationBuilder.AddColumn<string>(
                name: "SessionId",
                table: "Responses",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsLive",
                table: "Questions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LiveEndedAt",
                table: "Questions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LiveStartedAt",
                table: "Questions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsLive",
                table: "Presentations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LiveEndedAt",
                table: "Presentations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LiveStartedAt",
                table: "Presentations",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "Responses");

            migrationBuilder.DropColumn(
                name: "IsLive",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "LiveEndedAt",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "LiveStartedAt",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "IsLive",
                table: "Presentations");

            migrationBuilder.DropColumn(
                name: "LiveEndedAt",
                table: "Presentations");

            migrationBuilder.DropColumn(
                name: "LiveStartedAt",
                table: "Presentations");

            migrationBuilder.AddColumn<Guid>(
                name: "PollId",
                table: "Responses",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LoginMethod",
                table: "Presenters",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Polls",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PresentationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    Options = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    Question = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Polls", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Polls_Presentations_PresentationId",
                        column: x => x.PresentationId,
                        principalTable: "Presentations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Responses_PollId",
                table: "Responses",
                column: "PollId");

            migrationBuilder.CreateIndex(
                name: "IX_Polls_PresentationId",
                table: "Polls",
                column: "PresentationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Responses_Polls_PollId",
                table: "Responses",
                column: "PollId",
                principalTable: "Polls",
                principalColumn: "Id");
        }
    }
}
