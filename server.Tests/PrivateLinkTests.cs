using System.Net;
using System.Net.Http.Json;

namespace Launchpad.Api.Tests;

public class PrivateLinkTests : IDisposable
{
    private readonly ApiFactory _api = new();

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task A_new_user_has_no_private_links()
    {
        var client = await _api.SignedInClientAsync("google-a");

        var links = await client.GetFromJsonAsync<List<LinkResponse>>("/api/private-links");

        Assert.Empty(links!);
    }

    [Fact]
    public async Task Added_links_are_listed_in_the_order_they_were_added()
    {
        var client = await _api.SignedInClientAsync("google-a");

        await client.PostAsJsonAsync("/api/private-links", new { name = "  Bank  ", url = "https://bank.example" });
        await client.PostAsJsonAsync("/api/private-links", new { name = "Notes", url = "http://notes.example/page" });
        var links = await client.GetFromJsonAsync<List<LinkResponse>>("/api/private-links");

        Assert.Collection(links!,
            link => Assert.Equal(("Bank", "https://bank.example/"), (link.Name, link.Url)),
            link => Assert.Equal(("Notes", "http://notes.example/page"), (link.Name, link.Url)));
    }

    [Fact]
    public async Task A_link_can_be_deleted()
    {
        var client = await _api.SignedInClientAsync("google-a");
        var added = await AddLinkAsync(client, "Bank");

        var response = await client.DeleteAsync($"/api/private-links/{added.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<LinkResponse>>("/api/private-links"))!);
    }

    [Fact]
    public async Task Deleting_a_missing_link_returns_not_found()
    {
        var client = await _api.SignedInClientAsync("google-a");

        var response = await client.DeleteAsync("/api/private-links/999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Users_cannot_see_or_delete_each_others_links()
    {
        var asha = await _api.SignedInClientAsync("google-a");
        var ravi = await _api.SignedInClientAsync("google-b");
        var ashasLink = await AddLinkAsync(asha, "Asha's bank");

        var ravisLinks = await ravi.GetFromJsonAsync<List<LinkResponse>>("/api/private-links");
        var deleteAttempt = await ravi.DeleteAsync($"/api/private-links/{ashasLink.Id}");

        Assert.Empty(ravisLinks!);
        Assert.Equal(HttpStatusCode.NotFound, deleteAttempt.StatusCode);
        Assert.Single((await asha.GetFromJsonAsync<List<LinkResponse>>("/api/private-links"))!);
    }

    [Theory]
    [InlineData("", "https://bank.example")]
    [InlineData("   ", "https://bank.example")]
    [InlineData(null, "https://bank.example")]
    [InlineData("This name is far too long to fit on a card", "https://bank.example")]
    [InlineData("Bank", null)]
    [InlineData("Bank", "bank.example")]
    [InlineData("Bank", "javascript:alert(1)")]
    [InlineData("Bank", "ftp://bank.example")]
    public async Task Invalid_links_are_rejected(string? name, string? url)
    {
        var client = await _api.SignedInClientAsync("google-a");

        var response = await client.PostAsJsonAsync("/api/private-links", new { name, url });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<LinkResponse>>("/api/private-links"))!);
    }

    private static async Task<LinkResponse> AddLinkAsync(HttpClient client, string name)
    {
        var response = await client.PostAsJsonAsync("/api/private-links", new { name, url = "https://bank.example" });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<LinkResponse>())!;
    }
}
