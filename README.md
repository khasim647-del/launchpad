# Launchpad

A simple bookmark homepage built with React and Vite.

## Run it

```bash
npm install      # first time only
npm run dev      # start the dev server, then open the URL it prints (usually http://localhost:5173)
npm run build    # make a production build in the dist/ folder
npm run preview  # preview that production build
```

## Google sign-in, private bookmarks and search history

Signing in is optional. Signed-in users get a private bookmarks section and their search history, stored by the .NET API in `server/` so only they can see them. Until the two settings below are filled in, the site works exactly as before without a sign-in button.

### 1. Create a Google client ID
1. Go to https://console.cloud.google.com → create a project.
2. **APIs & Services → OAuth consent screen**: choose *External*, fill in the app name and your email, save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → *Web application*.
4. Under **Authorized JavaScript origins** add `http://localhost:5173` and your live site, e.g. `https://launchpad-naruto-447a.vercel.app`.
5. Copy the **Client ID** (ends in `.apps.googleusercontent.com`).

### 2. Run it locally
```bash
# API (needs the .NET 8 SDK) — runs on http://localhost:5045
cd server
dotnet run --Google:ClientId=YOUR_CLIENT_ID

# Website — in another terminal, from the project folder
cp .env.example .env.local   # then put your client ID in .env.local
npm run dev
```

### 3. Put the API online
Vercel only hosts the website, so the API needs a .NET host (for example Azure App Service). Set these settings there:
- `Google__ClientId` – your client ID
- `Jwt__Key` – a long random secret (at least 32 characters), e.g. from `openssl rand -base64 48`
- `ConnectionStrings__Launchpad` – where the SQLite file lives, e.g. `Data Source=/home/launchpad.db`
- `AllowedOrigins__0` – your website address, if it is not already in `server/appsettings.json`

Then on Vercel → **Settings → Environment Variables** add `VITE_API_URL` (the API's address) and `VITE_GOOGLE_CLIENT_ID`, and redeploy.

## Tests

```bash
npm test                      # website tests (Vitest + React Testing Library)
npm run test:watch            # same, re-running as you edit
dotnet test server.Tests      # API tests (xUnit) — needs the .NET 8 SDK
```

Website tests sit next to the code they test (`*.test.js` / `*.test.jsx`) and use a fake API.
API tests in `server.Tests/` start the real API with an empty temporary database and a fake Google sign-in.

## Where things live

- `src/App.jsx` – the page layout, theme and bookmark state (saved to localStorage)
- `src/data.js` – default bookmarks, top websites and search engines (edit these lists to customize)
- `src/utils.js` – localStorage helpers, URL validation and search links
- `src/useAccount.js` and `src/api.js` – sign-in, private bookmarks and search history (talks to the API)
- `src/components/` – one file per part of the page
- `src/index.css` – all styles; colors are variables at the top
- `server/` – the .NET 8 API: Google sign-in check, private bookmarks and search history (SQLite database)
- `server.Tests/` – tests for the API

## Host it

`npm run build` creates a `dist/` folder. That folder **is** the whole website — plain HTML, CSS and JavaScript, no server needed. Upload it to any static host.

### Easiest: Netlify Drop (no Git needed)
1. Run `npm run build`.
2. Go to https://app.netlify.com/drop and sign in.
3. Drag the `dist` folder onto the page. You get a live link in seconds.

### Vercel or Netlify (auto-deploys from GitHub)
1. Push this project to a GitHub repository.
2. Import the repository on https://vercel.com or https://app.netlify.com.
3. Use these settings (both usually detect them automatically):
   - Build command: `npm run build`
   - Output directory: `dist`

### GitHub Pages
Build, then publish the contents of `dist/` (for example with the `gh-pages` branch or a GitHub Actions "Deploy static content to Pages" workflow). Relative paths are already set in `vite.config.js`, so it works from a sub-folder URL.

## Notes
- Favorite bookmarks and the theme are saved in each visitor's own browser (localStorage). Private bookmarks and search history are saved on the API, per Google account.
- Site icons load from Google's favicon service; without internet the first letter of the site is shown instead.
