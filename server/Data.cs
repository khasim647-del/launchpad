using Microsoft.EntityFrameworkCore;

namespace Launchpad.Api;

// A person who signed in with Google.
public class User
{
    public int Id { get; set; }
    public required string GoogleId { get; set; }
    public required string Email { get; set; }
    public string Name { get; set; } = "";
    public string? PictureUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// A link in a user's private section. Only its owner can see it.
public class PrivateLink
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string Name { get; set; }
    public required string Url { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// One search a user made from the Launchpad search box.
public class SearchEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string Engine { get; set; }
    public required string Query { get; set; }
    public DateTime SearchedAt { get; set; } = DateTime.UtcNow;
}

public class LaunchpadDb(DbContextOptions<LaunchpadDb> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<PrivateLink> PrivateLinks => Set<PrivateLink>();
    public DbSet<SearchEntry> SearchHistory => Set<SearchEntry>();

    // SQLite forgets that stored times are UTC, so mark them as UTC when read back.
    protected override void ConfigureConventions(ModelConfigurationBuilder conventions)
    {
        conventions.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<User>().HasIndex(u => u.GoogleId).IsUnique();
        model.Entity<PrivateLink>().HasIndex(l => l.UserId);
        model.Entity<SearchEntry>().HasIndex(s => new { s.UserId, s.SearchedAt });

        // Deleting a user deletes everything they own.
        model.Entity<PrivateLink>().HasOne<User>().WithMany().HasForeignKey(l => l.UserId).OnDelete(DeleteBehavior.Cascade);
        model.Entity<SearchEntry>().HasOne<User>().WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class UtcDateTimeConverter() : Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
    value => value.ToUniversalTime(),
    value => DateTime.SpecifyKind(value, DateTimeKind.Utc));
