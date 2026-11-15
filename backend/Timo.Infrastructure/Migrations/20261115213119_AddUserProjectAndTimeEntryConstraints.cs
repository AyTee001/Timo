using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Timo.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProjectAndTimeEntryConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "EmailIndex",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Projects_UserId",
                table: "Projects");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "Users",
                column: "NormalizedEmail",
                unique: true,
                filter: "[NormalizedEmail] IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_TimeEntries_Duration",
                table: "TimeEntries",
                sql: "[Duration] > '00:00:00'");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_UserId_Name",
                table: "Projects",
                columns: new[] { "UserId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "EmailIndex",
                table: "Users");

            migrationBuilder.DropCheckConstraint(
                name: "CK_TimeEntries_Duration",
                table: "TimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_Projects_UserId_Name",
                table: "Projects");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "Users",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_UserId",
                table: "Projects",
                column: "UserId");
        }
    }
}
