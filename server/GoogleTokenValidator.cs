using Google.Apis.Auth;

namespace Launchpad.Api;

// Checks the ID token the Google button gives the website.
// It is a separate service so tests can swap in a fake Google.
public interface IGoogleTokenValidator
{
    // Returns who signed in, or null if the token is not a valid Google token for this app.
    Task<GoogleJsonWebSignature.Payload?> ValidateAsync(string? credential);
}

public class GoogleTokenValidator(string clientId) : IGoogleTokenValidator
{
    public async Task<GoogleJsonWebSignature.Payload?> ValidateAsync(string? credential)
    {
        if (string.IsNullOrWhiteSpace(credential)) return null;
        try
        {
            return await GoogleJsonWebSignature.ValidateAsync(credential,
                new GoogleJsonWebSignature.ValidationSettings { Audience = [clientId] });
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
