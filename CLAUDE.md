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

**Deferred analytics** — Google Analytics (`G-QNFHDMSSG6`, stored in a `<meta>` tag) loads only after first user interaction (`click`, `touchstart`, or `keydown`), never on page load.

**Bloom Mode** — The entire page transforms into a "flower garden" at `2026-10-25T15:00:00+03:00`. A FOUC guard in the `<head>` (before any CSS) adds `bloom-init` to `<html>` synchronously if the date has passed. `activateBloomMode()` in `script.js` then adds `bloom-mode` to `<body>`. Also triggered by `?bloom=1` or `#bloom` for preview.

**Intro video skip on mobile** — Desktop shows the sakura wax-seal intro video; mobile skips it and reveals content directly.

**RSVP API** — `RSVP_API_URL` points to a Cloudflare Workers counter. Duplicate submissions are blocked per-device via `localStorage` key `rsvp-confirmed-v1`. Guest count is submitted as individual POST requests (one per guest).

**Service Worker** (`sw.js`, cache name `zeynep-batuhan-v8`) — Caches all static assets. Core assets (HTML, CSS, JS) use network-first strategy. The `/gir/` path is always fetched from network and never cached. Bump `CACHE_NAME` version when deploying asset changes that must invalidate old caches.

### SEO pages

`davetiyeye-ne-yazilir.html`, `dijital-davetiye-fiyatlari.html`, `nisan-davetiyesi-ornekleri.html` are thin Turkish-language SEO landing pages. They share no JS or CSS with the main invite.

## Deployment

Pushed commits to `main` are served directly by GitHub Pages. No CI pipeline. Flush the Service Worker cache for users by bumping `CACHE_NAME` in `sw.js`.
