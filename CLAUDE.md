# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

School "Informatica" project — a static NBA basketball site graded against a fixed list of 10 requirements (see `README.md`). No build system, no package manager, no framework. Pure HTML5 / CSS3 / vanilla JavaScript. The site must run **offline by double-clicking `index.html`**, so:

- Never add a build step, bundler, or `node_modules`.
- Never replace local assets with CDN-hosted ones. The "images on disk, not external URLs" rule is graded.
- Forms (login, register, contact, newsletter) deliberately POST to `https://formsubmit.co/ajax/andreicolodeev28@gmail.com` — that email address is fixed by the assignment and lives in `js/auth.js` (`OWNER_EMAIL`) and `js/newsletter.js`. Don't change it.

## Running locally

Double-clicking `index.html` works, but the YouTube embed, Google Fonts, Google Maps iframe, TheSportsDB API, and FormSubmit all need internet. For a real dev loop use a Node one-liner static server (the harness has Node v24):

```bash
node -e "const http=require('http'),fs=require('fs'),path=require('path');const mt={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.mp4':'video/mp4','.mp3':'audio/mpeg'};http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';const f=path.join(process.cwd(),u);fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end('404');return;}r.writeHead(200,{'Content-Type':mt[path.extname(f).toLowerCase()]||'text/plain'});r.end(d);});}).listen(8765,()=>console.log('http://localhost:8765/'));"
```

Syntax-check all JS in one shot: `for f in js/*.js; do node --check "$f"; done` — there is no test suite.

## Architecture

### Pages and asset paths

`index.html` lives at the repo root; the other eight pages live in `pages/`. **All `pages/*.html` reference assets through `../`** (e.g. `<script src="../js/main.js">`). Any new asset reference or new page must respect that — `sed -i 's|src="js/|src="../js/|'` after copying from `index.html` is the usual move.

### Script load order (matters)

Every page loads scripts in this exact order at the bottom of `<body>`:

```
translations.js  → window.I18N dict (must be first)
main.js          → injects overlay menu, .header-lang, hamburger, reveal observers
magazine.js      → injects masthead bar, marquee ticker, hero corner (must run before effects)
effects.js       → injects theme button + search trigger NEXT TO .header-lang via setTimeout(0)
search.js        → builds the Ctrl+K palette
newsletter.js    → injects the form into .footer-grid
auth.js          → form handlers (login/register/contact) — page-conditional, uses ?. on querySelectors
quiz.js          → only does something if #quiz exists (index.html)
shooter.js       → only does something if #shooter exists (index.html)
players-extra.js → only on pages/jucatori.html (needs #players-dock + #compare)
audio-viz.js     → only on pages/multimedia.html (needs <audio data-audio>)
```

Each file is a self-contained IIFE that early-returns if its anchor element isn't on the page. **Do not refactor into ES modules** — that would require a bundler.

### CSS cascade — two layers

`css/style.css` is one file but conceptually two layers:

1. **Lines ~1–2800**: the original "dark + orange" theme. Don't delete tokens like `--orange`, `--dark`, `--light`, `--gray` — they're referenced from inline `style="..."` attributes in HTML files (player cards, era backgrounds).
2. **Lines ~2800–end ("MAGAZINE LAYER")**: editorial overhaul. Imports Anton + Fraunces + Bricolage Grotesque + JetBrains Mono and **remaps the legacy tokens** (`--orange: #D9531E`, `--dark: #0A0908`, etc.) so old components inherit the new palette automatically. The light theme works the same way — `[data-theme="light"]` redefines the same tokens.

When adding styles, append to the magazine layer. When fixing a legacy bug, edit in place. Tools like the `.section-title` numbered kicker rely on a CSS `counter(sec)` reset on `main` — section titles auto-number 01, 02, 03 down each page.

### State (localStorage keys)

Everything user-visible persists here. Key names use the `bw_` prefix:

| Key | Owner | What |
|---|---|---|
| `bw_users` | `auth.js` (`window.BW.DB`) | Registered users array (the "database") |
| `bw_session` | `auth.js` | Current logged-in user (name + email only) |
| `bw_lang` | `main.js` | `'ro'` or `'en'` |
| `bw_theme` | `effects.js` | `'dark'` or `'light'` |
| `bw_quiz_best` | `quiz.js` | High score 0–10 |
| `bw_shoot_hi` | `shooter.js` | Shooter mini-game high score |
| `bw_favorites` | `players-extra.js` | Array of favorite player keys |
| `bw_newsletter_seen` | `newsletter.js` | `'1'` after successful signup |

Inspect or clear from DevTools console: `BW.DB.getAll()` lists users; `localStorage.clear()` wipes everything.

### Global window APIs

- `window.I18N[lang][key]` — translation dict (RO + EN). New UI strings need keys here plus `data-i18n="key"` (or `data-i18n-attr="placeholder:key"`) in HTML.
- `window.BWtoast(msg, kind)` — top-right notifications. `kind` ∈ `'info' | 'success' | 'error' | 'warn'`. Use this instead of `alert()`.
- `window.BWsearch.open() / .close()` — programmatic command palette.
- `window.BW.DB` — the localStorage user "database" (`getAll`, `findByEmail`, `add`, `setSession`, `getSession`, `clearSession`).

### Magazine chrome (three fixed bars at top)

`magazine.js` injects, in order, a masthead (30px), marquee ticker (44px), and the existing site-header is positioned below them. `main` has `margin-top: 144px` to compensate (mobile collapses to ~132px). If you change those heights, update the matching CSS rules at the bottom of `style.css` — `main { margin-top: calc(74px + var(--header-h)); }` and the `@media (max-width: 700px)` override.

### Hamburger menu — overlay, not collapse

The `<ul class="nav-menu">` in every page header is hidden by CSS on **all** breakpoints (`display: none`). `main.js` injects a full-screen `.nav-overlay` with a duplicated link list driven by an array, so the source-of-truth menu lives in `main.js`'s `injectOverlay()` — adding a page means editing that array, not the `<ul>` in every HTML file.

### The 10 graded requirements

If you change anything significant, re-verify these (the README is the canonical list):

1. All images local to `images/` (no external `src` URLs)
2. `index.html` + 8 pages in `pages/`
3. Folder structure: `css/ js/ images/ videos/ audio/ data/ pages/`
4. Responsive at 880px and 540px breakpoints
5. CSS animations + transitions
6. Hamburger menu that turns into an X
7. Google Maps iframe (`contact.html`) + HTML5 `<video>` + YouTube `<iframe>` + 2× HTML5 `<audio>` (`multimedia.html`)
8. Footer on every page
9. Forms email to `andreicolodeev28@gmail.com` via FormSubmit
10. localStorage "database" + an example user JSON in `data/users.json`

Sanity-check command:

```bash
for f in index.html pages/*.html; do
  echo "$f: footer=$(grep -c site-footer "$f") hamburger=$(grep -c 'class=.hamburger' "$f") main.js=$(grep -c main.js "$f")"
done
```

## Things that have bitten us

- **Web Audio API needs a user gesture** — `audio-viz.js` creates the `MediaElementSource` lazily on the first `play` event for that reason. Don't move setup into init.
- **Tilt vs hover-translate conflict** — `effects.js`'s 3D tilt sets inline `transform`, which clobbers `.card:hover { transform: translateY(-8px) }`. The tilt target list in `effects.js` deliberately excludes `.card`, `.x-block`, `.era-card`, `.team-strip` — keep it that way unless you also rewrite their hover state.
- **NBA blocks YouTube embed** on most of their highlight videos. `multimedia.html` uses one embed-friendly video and keeps direct `youtube.com/results` links as the documented fallback.
- **FormSubmit first send requires manual confirmation** — the very first form submission triggers a confirmation email to `OWNER_EMAIL`. Until that link is clicked, nothing else arrives. The README explains this for the project owner.
