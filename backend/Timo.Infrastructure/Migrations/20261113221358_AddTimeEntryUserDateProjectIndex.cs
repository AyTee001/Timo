using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Timo.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeEntryUserDateProjectIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_UserId",
                table: "TimeEntries");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_UserId_Date_ProjectId",
                table: "TimeEntries",
                columns: new[] { "UserId", "Date", "ProjectId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_UserId_Date_ProjectId",
                table: "TimeEntries");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_UserId",
                table: "TimeEntries",
                column: "UserId");
        }
    }
}
