# amircodess-space — project brief

Personal portfolio site for **Amir** at **amircodess.com**, titled **"Amir Codes Space"**.
It is a full replica of the interactive 3D office dashboard ("Office Board") in a different theme, but
**read-only and socket-free**: visitors can click and interact with the objects, but can't change anything.

> The code in this repo right now is the **unmodified Office Board codebase** (the starting point).
> The first job is to turn it into this portfolio, in this repo, with no server database and no sockets.

## Owner facts (already looked up from GitHub's public API)
- GitHub user: `AMIRAK-code` (display name "MOEEn")
- Bio: `git commit -m "fixed bugs, introduced cooler ones"` / `while (alive) { build(); ship(); refactor(); }`
- Website on the profile: www.amircodess.com
- 23 public repos at the time of writing, e.g. `amircodess-space` (this repo), `OFFICE-3D-HUB`, `REfluenz-app`,
  `EXAMassist`, `vibeassist`, `TEchCERT`, `fundable-mvp-t1`, `NUCLEAR-HMI-TWIN`, `inRebusED-redesign-website`, `walkscape`.
- Hosting: the domain is on **Cloudflare**, so deploy as a **static site on Cloudflare Pages**.

## What to build

Same 3D room (Three.js, procedural props), new theme and meaning. Everything is **view/interact only**.

| Object in the room | Becomes |
| --- | --- |
| Neon sign | **"Amir Codes Space"** (not "Office Board") |
| Top bar / brand | "Amir Codes Space"; no office wording anywhere |
| **Corkboard wall** | Shows Amir's **recent GitHub commits** as cards pinned to the board (repo, message, date; click opens the commit on GitHub). Leave **many empty slots** ("reserved for future use") on the board. Clicking the board zooms it full screen like the other objects. |
| **Birthday board** | Becomes **"Projects"**: highlights Amir's GitHub projects (name, language, stars, description, link; allow featuring/ordering via a data file). Panel lists them all. |
| **Radio** | Connected to Amir's **Spotify**: shows his **liked songs** (cover, title, artist, "Open in Spotify"). See Spotify notes below. |
| **TV (watchlist)** | Keep: Amir's watchlist (read-only list in a data file). |
| **Bookshelf (books)** | Keep: Amir's books (read-only list in a data file). |
| **Arcade + dartboard (games)** | Keep, but every game is **visitor vs CPU**: Tic-Tac-Toe, Connect Four, Rock-Paper-Scissors, Darts. CPU needs a sensible difficulty (e.g. Easy/Hard; Connect Four via minimax with alpha-beta). All logic client-side. |
| **Jukebox (lo-fi)** | Keep as a local player: five generated lo-fi tracks, play/pause/skip for the visitor only, and **muted by default** on entry. |
| Window | Optional "About / Contact" panel (links to GitHub, site, etc.) from a profile data file. |

**Remove entirely:** socket.io, Express server, login, users/avatars/moods, live cursors, stickers + sticker mail, text notes,
trash can, requests box, Too-Good-To-Go basket, birthdays/cake/balloons, comments, places, admin, uploads, the `data/` DB.
Nothing a visitor does may be saved or shared. (Local-only conveniences like jukebox volume in `localStorage` are fine.)

## Data approach (static, no backend)
- Put content in `public/data/*.json`: `profile.json`, `github.json` (repos + recent commits snapshot), `spotify.json`
  (liked songs snapshot), `watchlist.json`, `books.json`.
- **GitHub:** public API needs no auth. Provide `scripts/sync-github.mjs` (repos + recent commits per repo, optional `GITHUB_TOKEN`
  to avoid rate limits) that writes `public/data/github.json`. The site loads the snapshot instantly, then may try a light live
  refresh (cache ~30 min in `localStorage`, silently fall back to the snapshot on error/rate-limit).
  Note: don't rely on the Events API's `PushEvent.payload.commits` (GitHub is removing it); use `GET /repos/{u}/{repo}/commits`.
- **Spotify:** liked songs are private, so a static page can't read them directly. Provide `scripts/spotify-auth.mjs`
  (one-time local OAuth to get a refresh token, scope `user-library-read`) and `scripts/sync-spotify.mjs`
  (env: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`) writing `public/data/spotify.json`.
  **Never commit secrets.** Until Amir connects it, show a friendly empty state (don't invent songs).
- Add a GitHub Actions workflow (`.github/workflows/sync.yml`) that runs both syncs on a schedule and commits the JSON, so
  Cloudflare Pages redeploys automatically. Secrets come from repo secrets.
- Watchlist and books: ship **empty** (friendly empty state + documented JSON format). Amir fills them in; do not invent his tastes.

## Theme
"Coder's space" rather than a friendly office: darker walls (deep navy/indigo), neon cyan/magenta accents, monitor glow with
code-like text, same warm wood floor is fine. Keep the playful polish (animations, hover labels, camera fly-to, side panels,
dock). The project board replaces the birthday board; room layout can stay.

## Tech / hosting constraints
- Pure static site: no Node server in production. A tiny dev static server (`npm start`) is fine for local use.
- Vendor Three.js into `public/vendor/three/...` (copy `three.module.js`, `three.core.js`, and `RoundedBoxGeometry.js`)
  so Cloudflare Pages needs **no build step**. Keep the import map pointing at the vendored files.
- Deploy: Cloudflare Pages, output dir `public`, custom domain `amircodess.com`. Document the exact steps in the README.
- Mobile support must keep working (bottom-sheet panels, swipe to pan the room).
- Accessibility basics: buttons are real `<button>`s, labels, Esc closes panels, respects `prefers-reduced-motion`.

## Reuse notes from the Office Board code (this repo's starting point)
- `public/js/scene/core.js` camera/picking/labels; `room.js` all props; `textures.js` canvas textures; `fx.js` particles.
- `public/js/ui/kit.js` panels/modals/toasts; `public/js/net.js` is socket-based: replace with a tiny event bus + static data store
  (keep the `on/emit` names so `kit.js` keeps working).
- `public/js/jukebox.js` is the lo-fi engine; replace the server-shared state with local state (default muted).
- The wall renderer (`scene/wall.js`) is for stickers; replace with a commit-card board.
- Games UI exists for 2-player online play (`features/games.js`, `darts.js`); the rules in `server/games.js` (esp. `dartScore`)
  are reusable for CPU play. Delete the server afterwards.
- Gotchas learned: the 3D picking uses raycasting on groups registered with `registerProp`; labels are DOM buttons projected from
  fixed world anchors (don't let hover-lift move them); camera framing is computed in `core.js` (`computeHome`).

## Done criteria
- Looks and feels like the office board but themed "Amir Codes Space"; zero office/birthday/colleague wording left.
- No socket.io / server code in the final repo; works when served as plain static files.
- GitHub commits on the board (real data from `AMIRAK-code`), projects panel, Spotify panel (with empty state until connected),
  watchlist and books panels, four CPU games, local jukebox muted by default.
- README with run/sync/deploy instructions; `.gitignore` excludes secrets and `node_modules`.
