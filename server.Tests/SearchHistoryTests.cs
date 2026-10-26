using System.Net;
using System.Net.Http.Json;

namespace Launchpad.Api.Tests;

public class SearchHistoryTests : IDisposable
{
    private readonly ApiFactory _api = new();

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task A_search_is_saved_with_a_UTC_time()
    {
        var client = await _api.SignedInClientAsync("google-a");
        var before = DateTime.UtcNow;

        var saved = await AddSearchAsync(client, "  react hooks  ", "youtube");
        var history = await GetHistoryAsync(client);

        Assert.Equal(("youtube", "react hooks"), (saved.Engine, saved.Query));
        var entry = Assert.Single(history);
        Assert.Equal(saved.Id, entry.Id);
        Assert.Equal(DateTimeKind.Utc, entry.SearchedAt.Kind);
        Assert.InRange(entry.SearchedAt, before.AddSeconds(-5), DateTime.UtcNow.AddSeconds(5));
    }

    [Fact]
    public async Task Times_are_sent_with_a_Z_so_browsers_read_them_as_UTC()
    {
        var client = await _api.SignedInClientAsync("google-a");
        await AddSearchAsync(client, "cats");

        var json = await client.GetStringAsync("/api/history");

        Assert.Matches("\"searchedAt\":\"[^\"]+Z\"", json);
    }

    [Fact]
    public async Task History_is_listed_newest_first()
    {
        var client = await _api.SignedInClientAsync("google-a");
        await AddSearchAsync(client, "first");
        await AddSearchAsync(client, "second");
        await AddSearchAsync(client, "third");

        var history = await GetHistoryAsync(client);

        Assert.Equal(["third", "second", "first"], history.Select(entry => entry.Query));
    }

    [Fact]
    public async Task Only_the_newest_100_searches_are_kept()
    {
        var client = await _api.SignedInClientAsync("google-a");
        for (var number = 1; number <= 103; number++)
            await AddSearchAsync(client, $"search {number}");

        var history = await GetHistoryAsync(client);

        Assert.Equal(100, history.Count);
        Assert.Equal("search 103", history.First().Query);
        Assert.Equal("search 4", history.Last().Query);
    }

    [Fact]
    public async Task One_search_can_be_deleted()
    {
        var client = await _api.SignedInClientAsync("google-a");
        var keep = await AddSearchAsync(client, "keep");
        var remove = await AddSearchAsync(client, "remove");

        var response = await client.DeleteAsync($"/api/history/{remove.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal([keep.Id], (await GetHistoryAsync(client)).Select(entry => entry.Id));
    }

    [Fact]
    public async Task Clearing_history_only_clears_your_own()
    {
        var asha = await _api.SignedInClientAsync("google-a");
        var ravi = await _api.SignedInClientAsync("google-b");
        await AddSearchAsync(asha, "asha's search");
        await AddSearchAsync(ravi, "ravi's search");

        var response = await asha.DeleteAsync("/api/history");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Empty(await GetHistoryAsync(asha));
        Assert.Equal(["ravi's search"], (await GetHistoryAsync(ravi)).Select(entry => entry.Query));
    }

    [Fact]
    public async Task Users_cannot_see_or_delete_each_others_searches()
    {
        var asha = await _api.SignedInClientAsync("google-a");
        var ravi = await _api.SignedInClientAsync("google-b");
        var ashasSearch = await AddSearchAsync(asha, "private search");

        var deleteAttempt = await ravi.DeleteAsync($"/api/history/{ashasSearch.Id}");

        Assert.Empty(await GetHistoryAsync(ravi));
        Assert.Equal(HttpStatusCode.NotFound, deleteAttempt.StatusCode);
        Assert.Single(await GetHistoryAsync(asha));
    }

    [Theory]
    [InlineData("google", "")]
    [InlineData("google", "   ")]
    [InlineData("google", null)]
    [InlineData("", "cats")]
    [InlineData(null, "cats")]
    [InlineData("an-engine-name-that-is-too-long", "cats")]
    public async Task Invalid_searches_are_rejected(string? engine, string? query)
    {
        var client = await _api.SignedInClientAsync("google-a");

        var response = await client.PostAsJsonAsync("/api/history", new { engine, query });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Very_long_searches_are_rejected()
    {
        var client = await _api.SignedInClientAsync("google-a");

        var response = await client.PostAsJsonAsync("/api/history", new { engine = "google", query = new string('a', 501) });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static async Task<SearchResponse> AddSearchAsync(HttpClient client, string query, string engine = "google")
    {
        var response = await client.PostAsJsonAsync("/api/history", new { engine, query });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SearchResponse>())!;
    }

    private static async Task<List<SearchResponse>> GetHistoryAsync(HttpClient client) =>
        (await client.GetFromJsonAsync<List<SearchResponse>>("/api/history"))!;
}
