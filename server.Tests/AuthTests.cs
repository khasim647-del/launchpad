using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Launchpad.Api.Tests;

public class AuthTests : IDisposable
{
    private readonly ApiFactory _api = new();

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Home_page_says_the_API_is_running()
    {
        var text = await _api.CreateClient().GetStringAsync("/");

        Assert.Equal("Launchpad API is running.", text);
    }

    [Theory]
    [InlineData("GET", "/api/me")]
    [InlineData("GET", "/api/private-links")]
    [InlineData("POST", "/api/private-links")]
    [InlineData("DELETE", "/api/private-links/1")]
    [InlineData("GET", "/api/history")]
    [InlineData("POST", "/api/history")]
    [InlineData("DELETE", "/api/history/1")]
    [InlineData("DELETE", "/api/history")]
    public async Task Private_endpoints_need_sign_in(string method, string path)
    {
        var request = new HttpRequestMessage(new HttpMethod(method), path) { Content = JsonContent.Create(new { }) };

        var response = await _api.CreateClient().SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("not-a-google-token")]
    [InlineData("")]
    [InlineData(null)]
    public async Task Sign_in_rejects_invalid_Google_tokens(string? credential)
    {
        var response = await _api.CreateClient().PostAsJsonAsync("/api/auth/google", new { credential });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Sign_in_creates_the_user_and_returns_a_working_token()
    {
        var client = _api.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/google",
            new { credential = FakeGoogle.Credential("google-a", "Asha Rao") });
        var signIn = await response.Content.ReadFromJsonAsync<SignInResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Asha Rao", signIn!.User.Name);
        Assert.Equal("google-a@example.com", signIn.User.Email);
        Assert.Equal("https://example.com/google-a.png", signIn.User.PictureUrl);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", signIn.Token);
        var me = await client.GetFromJsonAsync<UserResponse>("/api/me");
        Assert.Equal(signIn.User, me);
    }

    [Fact]
    public async Task Signing_in_again_reuses_the_account_and_updates_the_name()
    {
        var first = await _api.SignedInClientAsync("google-a", "Old Name");
        var second = await _api.SignedInClientAsync("google-a", "New Name");

        var before = await first.GetFromJsonAsync<UserResponse>("/api/me");
        var after = await second.GetFromJsonAsync<UserResponse>("/api/me");

        Assert.Equal(before!.Id, after!.Id);
        Assert.Equal("New Name", after.Name);
    }

    [Fact]
    public async Task Tokens_signed_with_another_key_are_rejected()
    {
        var token = MakeToken("some-other-key-that-is-also-long-enough-0987654321", DateTime.UtcNow.AddHours(1));

        var response = await GetMeAsync(token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Expired_tokens_are_rejected()
    {
        await _api.SignedInClientAsync("google-a");
        var token = MakeToken(ApiFactory.TestJwtKey, DateTime.UtcNow.AddHours(-1));

        var response = await GetMeAsync(token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Only_the_website_is_allowed_to_call_the_API_from_a_browser()
    {
        var client = _api.CreateClient();

        var allowed = await client.SendAsync(Preflight("https://launchpad-naruto-447a.vercel.app"));
        var blocked = await client.SendAsync(Preflight("https://evil.example"));

        Assert.Equal(["https://launchpad-naruto-447a.vercel.app"], allowed.Headers.GetValues("Access-Control-Allow-Origin"));
        Assert.False(blocked.Headers.Contains("Access-Control-Allow-Origin"));
    }

    private static HttpRequestMessage Preflight(string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/history");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "authorization,content-type");
        return request;
    }

    private Task<HttpResponseMessage> GetMeAsync(string token)
    {
        var client = _api.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client.GetAsync("/api/me");
    }

    // A token for user 1, signed with the given key.
    private static string MakeToken(string key, DateTime expires) =>
        new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = "launchpad-api",
            Audience = "launchpad-api",
            Subject = new ClaimsIdentity([new Claim("sub", "1")]),
            NotBefore = expires.AddHours(-2),
            IssuedAt = expires.AddHours(-2),
            Expires = expires,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256),
        });
}
