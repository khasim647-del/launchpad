# Launchpad

A simple bookmark homepage built with React and Vite.

## Run it

```bash
npm install      # first time only
npm run dev      # start the dev server, then open the URL it prints (usually http://localhost:5173)
npm run build    # make a production build in the dist/ folder
npm run preview  # preview that production build
```

## Where things live

- `src/App.jsx` – the page layout, theme and bookmark state (saved to localStorage)
- `src/data.js` – default bookmarks, top websites and search engines (edit these lists to customize)
- `src/utils.js` – localStorage helpers and URL validation
- `src/components/` – one file per part of the page
- `src/index.css` – all styles; colors are variables at the top

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
- Bookmarks and the theme are saved in each visitor's own browser (localStorage). Nothing is stored on the server, and each person gets their own list.
- Site icons load from Google's favicon service; without internet the first letter of the site is shown instead.
