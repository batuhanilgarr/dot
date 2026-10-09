# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A fully static Turkish engagement/wedding invitation site for Zeynep & Batuhan, hosted at `zeynepbatuhan.com` (GitHub Pages via CNAME). No build step, no bundler, no dependencies — raw HTML/CSS/JS.

## Local development

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Test bloom mode (post-ceremony flower garden) before the event date:
```
http://localhost:8000/?bloom=1
```

## Architecture

### Two distinct pages

**`index.html`** — Public digital invitation. References shared assets under `assets/`:
- `assets/css/styles.css` — all styles
- `assets/js/script.js` — all client behaviour
- `assets/audio/music.mp3`, `assets/videos/`, `assets/images/`

**`gir/index.html`** — Private couple's corner ("Bizim Köşemiz"). Intentionally excluded from search engines (`robots.txt` `Disallow: /gir`, `noindex` meta tags) and from the Service Worker cache. Contains **inline styles and inline script** (no external JS file). All data is stored in `localStorage` — device-local only, no backend.

### Key patterns in `script.js`

**Lazy media loading** — `<video>` and `<audio>` carry their URLs in `data-src`, not `src`. Sources are injected at runtime to avoid unnecessary network requests on page load.

**Consent-gated analytics** — Google Analytics (`G-QNFHDMSSG6`, stored in a `<meta>` tag) is loaded by `assets/js/privacy.js` only after the visitor opts in via the cookie dialog (choice stored in `localStorage` key `zb-consent-v1`). "Seçmeden kapat" is remembered per session (`sessionStorage` `zb-consent-dismissed`), and the dialog never auto-opens while the event-day screen is shown.

**Event-day screen** — From `2026-10-09T00:00+03:00` (moved forward from 23 Oct) a full-screen card (`#eventQuickCard`) replaces the whole site: couple-name banner plus Kına and Nikah venues with Android (Google Maps) / iPhone (Apple Maps) buttons. An inline FOUC guard in `<head>` adds `event-day` to `<html>`; `updateEventDayCard()` in `script.js` keeps it in sync and sets `inert` on the rest of the page. The window start is duplicated in the inline guard and in `script.js` (`EVENT_WINDOW_START_MS`) — change both. Preview venues any time with `?konum=1`.

**Guest photo mode** — From `2026-10-25T14:00+03:00` (`PHOTO_START_MS` in `script.js` and the inline guard) the card gets `html.photo-mode`: venues are hidden and an upload form plus guest gallery (`.event-photos`) is shown instead; `script.js` then lazy-loads `assets/js/photos.min.js`. There is no automatic bloom handover any more (bloom only via `?bloom=1` / `#bloom`). Preview with `?foto=1`; `?konum=1` still shows the venues. Photos go to the Cloudflare Worker in `workers/photos/` (R2 bucket `zeynepbatuhan-photos`, see its README for deploy and moderation); the client downscales to JPEG (2560 px + 480 px thumb, EXIF stripped). Upload is gated server-side by `UPLOAD_OPENS_AT` in `workers/photos/wrangler.toml`. Local testing: `photosApi=http://localhost:8787` query param (localhost only).

**Bloom Mode** — Only reachable by preview (`?bloom=1` or `#bloom`): `activateBloomMode()` in `script.js` adds `bloom-mode` to `<body>`; the FOUC guard adds `bloom-init`.

**Weather cards** — Open-Meteo forecast is used within 15 days of the kına; before that the cards show the 5-year historical average for the same dates (Open-Meteo archive API).

**Intro video skip on mobile** — Desktop shows the sakura wax-seal intro video; mobile skips it and reveals content directly.

**RSVP API** — `RSVP_API_URL` points to a Cloudflare Workers counter. Duplicate submissions are blocked per-device via `localStorage` key `rsvp-confirmed-v1`. Guest count is submitted as individual POST requests (one per guest).

**Service Worker** (`sw.js`, cache name `zeynep-batuhan-v58`) — Caches static assets. Core assets (HTML, CSS, JS) use network-first with `cache: 'no-cache'` revalidation so GitHub Pages' HTTP cache can't serve stale files; `script.js` reloads the page once when a new worker takes over. The `/gir/` path is always fetched from network and never cached. Bump `CACHE_NAME` version when deploying asset changes that must invalidate old caches.

### SEO pages

`davetiyeye-ne-yazilir.html`, `dijital-davetiye-fiyatlari.html`, `nisan-davetiyesi-ornekleri.html` are thin Turkish-language SEO landing pages. They share no JS or CSS with the main invite.

## Minified assets

The site loads `assets/css/styles.min.css` and `assets/js/script.min.js`, **not** the source files. After editing `styles.css` / `script.js`, regenerate them and bump the `?v=` on the script tag in `index.html`:

```bash
npx --yes csso-cli assets/css/styles.css -o assets/css/styles.min.css
npx --yes terser assets/js/script.js -c -m -o assets/js/script.min.js
```

## Deployment

Pushed commits to `main` are served directly by GitHub Pages. No CI pipeline. Flush the Service Worker cache for users by bumping `CACHE_NAME` in `sw.js`.
