using System.Net.Http.Headers;
using System.Net.Http.Json;
using Google.Apis.Auth;
using Launchpad.Api;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;

namespace Launchpad.Api.Tests;

// Starts the real API in memory with its own empty database file and a fake Google.
public class ApiFactory : WebApplicationFactory<Program>
{
    public const string TestJwtKey = "test-only-signing-key-that-is-long-enough-1234567890";

    private readonly string _databasePath = Path.Combine(Path.GetTempPath(), $"launchpad-test-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Launchpad", $"Data Source={_databasePath}");
        builder.UseSetting("Jwt:Key", TestJwtKey);
        builder.UseSetting("Google:ClientId", "test-client-id");
        builder.UseSetting("Logging:LogLevel:Default", "Warning");
        builder.ConfigureTestServices(services =>
            services.AddSingleton<IGoogleTokenValidator, FakeGoogle>());
    }

    // Signs in through the API (with the fake Google) and returns a client that sends the token.
    public async Task<HttpClient> SignedInClientAsync(string googleId, string name = "Test User")
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/google",
            new { credential = FakeGoogle.Credential(googleId, name) });
        response.EnsureSuccessStatusCode();

        var signIn = await response.Content.ReadFromJsonAsync<SignInResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", signIn!.Token);
        return client;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        SqliteConnection.ClearAllPools();
        File.Delete(_databasePath);
    }
}

// Pretends to be Google: accepts credentials made by Credential(), rejects everything else.
public class FakeGoogle : IGoogleTokenValidator
{
    public static string Credential(string googleId, string name) => $"fake-google|{googleId}|{name}";

    public Task<GoogleJsonWebSignature.Payload?> ValidateAsync(string? credential)
    {
        var parts = credential?.Split('|');
        if (parts is not ["fake-google", var googleId, var name])
            return Task.FromResult<GoogleJsonWebSignature.Payload?>(null);

        return Task.FromResult<GoogleJsonWebSignature.Payload?>(new GoogleJsonWebSignature.Payload
        {
            Subject = googleId,
            Email = $"{googleId}@example.com",
            Name = name,
            Picture = $"https://example.com/{googleId}.png",
        });
    }
}

public record UserResponse(int Id, string Email, string Name, string? PictureUrl);
public record SignInResponse(string Token, UserResponse User);
public record LinkResponse(int Id, string Name, string Url);
public record SearchResponse(int Id, string Engine, string Query, DateTime SearchedAt);
