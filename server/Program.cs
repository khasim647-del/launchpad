using System.Security.Claims;
using System.Text;

using Launchpad.Api;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// ---------- Settings (see appsettings.json and README) ----------

var googleClientId = config["Google:ClientId"];
if (string.IsNullOrWhiteSpace(googleClientId))
    throw new InvalidOperationException("Set Google:ClientId (your Google OAuth client ID).");

var jwtKeyText = config["Jwt:Key"] ?? "";
if (Encoding.UTF8.GetByteCount(jwtKeyText) < 32)
    throw new InvalidOperationException("Set Jwt:Key to a random secret of at least 32 characters.");
var jwtKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKeyText));
const string Issuer = "launchpad-api";

var allowedOrigins = config.GetSection("AllowedOrigins").Get<string[]>() ?? [];

// ---------- Services ----------

builder.Services.AddSingleton<IGoogleTokenValidator>(new GoogleTokenValidator(googleClientId));

builder.Services.AddDbContext<LaunchpadDb>(options =>
    options.UseSqlite(config.GetConnectionString("Launchpad") ?? "Data Source=launchpad.db"));

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // keep "sub" as "sub"
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = Issuer,
            ValidAudience = Issuer,
            IssuerSigningKey = jwtKey,
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// Create the database file and tables on first run.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<LaunchpadDb>().Database.EnsureCreated();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Launchpad API is running.");

// ---------- Sign in ----------

// The website sends the ID token Google gave it. We check it really came from
// Google for our app, then hand back our own token for later requests.
app.MapPost("/api/auth/google", async (GoogleSignInRequest request, IGoogleTokenValidator validator, LaunchpadDb db) =>
{
    var google = await validator.ValidateAsync(request.Credential);
    if (google is null) return Results.Unauthorized();

    var user = await db.Users.SingleOrDefaultAsync(u => u.GoogleId == google.Subject);
    if (user is null)
    {
        user = new User { GoogleId = google.Subject, Email = google.Email };
        db.Users.Add(user);
    }
    user.Email = google.Email;
    user.Name = google.Name ?? google.Email;
    user.PictureUrl = google.Picture;
    await db.SaveChangesAsync();

    var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
    {
        Issuer = Issuer,
        Audience = Issuer,
        Subject = new ClaimsIdentity([new Claim("sub", user.Id.ToString())]),
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = new SigningCredentials(jwtKey, SecurityAlgorithms.HmacSha256),
    });

    return Results.Ok(new { token, user = ToDto(user) });
});

// Everything below needs a signed-in user, and only ever touches that user's rows.
var api = app.MapGroup("/api").RequireAuthorization();

api.MapGet("/me", async (ClaimsPrincipal principal, LaunchpadDb db) =>
{
    var user = await db.Users.FindAsync(UserId(principal));
    return user is null ? Results.Unauthorized() : Results.Ok(ToDto(user));
});

// ---------- Private section ----------

api.MapGet("/private-links", async (ClaimsPrincipal principal, LaunchpadDb db) =>
{
    var userId = UserId(principal);
    var links = await db.PrivateLinks
        .Where(l => l.UserId == userId)
        .OrderBy(l => l.CreatedAt)
        .Select(l => new { l.Id, l.Name, l.Url })
        .ToListAsync();
    return Results.Ok(links);
});

api.MapPost("/private-links", async (NewLinkRequest request, ClaimsPrincipal principal, LaunchpadDb db) =>
{
    var name = request.Name?.Trim() ?? "";
    if (name.Length is 0 or > 40)
        return Results.BadRequest("Name must be 1–40 characters.");
    if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uri)
        || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        || request.Url!.Length > 2000)
        return Results.BadRequest("Url must be a full http(s) address.");

    var link = new PrivateLink { UserId = UserId(principal), Name = name, Url = uri.AbsoluteUri };
    db.PrivateLinks.Add(link);
    await db.SaveChangesAsync();
    return Results.Ok(new { link.Id, link.Name, link.Url });
});

api.MapDelete("/private-links/{id:int}", async (int id, ClaimsPrincipal principal, LaunchpadDb db) =>
{
    var userId = UserId(principal);
    var deleted = await db.PrivateLinks.Where(l => l.Id == id && l.UserId == userId).ExecuteDeleteAsync();
    return deleted == 0 ? Results.NotFound() : Results.NoContent();
});

// ---------- Search history ----------

const int HistoryLimit = 100; // older searches are dropped

api.MapGet("/history", async (ClaimsPrincipal principal, LaunchpadDb db) =>
{
    var userId = UserId(principal);
    var history = await db.SearchHistory
        .Where(s => s.UserId == userId)
        .OrderByDescending(s => s.SearchedAt)
        .Take(HistoryLimit)
        .Select(s => new { s.Id, s.Engine, s.Query, s.SearchedAt })
        .ToListAsync();
    return Results.Ok(history);
});

api.MapPost("/history", async (NewSearchRequest request, ClaimsPrincipal principal, LaunchpadDb db) =>
{
    var query = request.Query?.Trim() ?? "";
    var engine = request.Engine?.Trim() ?? "";
    if (query.Length is 0 or > 500 || engine.Length is 0 or > 20)
        return Results.BadRequest("Query must be 1–500 characters and engine 1–20.");

    var userId = UserId(principal);
    var entry = new SearchEntry { UserId = userId, Engine = engine, Query = query };
    db.SearchHistory.Add(entry);
    await db.SaveChangesAsync();

    // Keep only the newest searches.
    var oldIds = await db.SearchHistory
        .Where(s => s.UserId == userId)
        .OrderByDescending(s => s.SearchedAt)
        .Skip(HistoryLimit)
        .Select(s => s.Id)
        .ToListAsync();
    if (oldIds.Count > 0)
        await db.SearchHistory.Where(s => oldIds.Contains(s.Id)).ExecuteDeleteAsync();

    return Results.Ok(new { entry.Id, entry.Engine, entry.Query, entry.SearchedAt });
});

api.MapDelete("/history/{id:int}", async (int id, ClaimsPrincipal principal, LaunchpadDb db) =>
{
    var userId = UserId(principal);
    var deleted = await db.SearchHistory.Where(s => s.Id == id && s.UserId == userId).ExecuteDeleteAsync();
    return deleted == 0 ? Results.NotFound() : Results.NoContent();
});

api.MapDelete("/history", async (ClaimsPrincipal principal, LaunchpadDb db) =>
{
    var userId = UserId(principal);
    await db.SearchHistory.Where(s => s.UserId == userId).ExecuteDeleteAsync();
    return Results.NoContent();
});

app.Run();

static int UserId(ClaimsPrincipal principal) => int.Parse(principal.FindFirstValue("sub")!);

static object ToDto(User user) => new { user.Id, user.Email, user.Name, user.PictureUrl };

record GoogleSignInRequest(string? Credential);
record NewLinkRequest(string? Name, string? Url);
record NewSearchRequest(string? Engine, string? Query);

// Lets the test project start this API.
public partial class Program;
