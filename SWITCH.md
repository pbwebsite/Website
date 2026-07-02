# SWITCH.md — Page switching for pbperformancecoaching.com

This site serves **one live page at a time** through `index.html`. Source pages live alongside it (`coaching.html`, `championship.html`, etc.) and are not the page visitors hit at the root URL — `index.html` is.

## How to switch

Tell Claude one of:

- **"Switch to coaching page"** → Claude copies `coaching.html` → `index.html`, commits, pushes. Live in ~60 s after Cloudflare redeploys.
- **"Switch to championship page"** → Claude copies `championship.html` → `index.html`, commits, pushes. Same.

That's the whole interface. No other steps for Paddy.

## What Claude does under the hood

```
cp <page>.html index.html
git add index.html
git commit -m "Switch live page to <page>"
git push origin main
```

Cloudflare's GitHub integration auto-redeploys the Worker on push.

## Current state

- `index.html` — **live page** at the root URL. Initially redirects to `/coaching.html`; gets overwritten on first switch.
- `coaching.html` — coaching intake landing page (source of truth for that page).
- `championship.html` — placeholder stub; build out before switching to it.

## Adding a new page

1. Create `<newpage>.html` in the repo root.
2. Tell Claude: "Add a new switch option for `<newpage>`" — Claude updates this file.
3. From then on: "Switch to `<newpage>` page".

## Rules

- Never edit `index.html` directly. Edit the source page (`coaching.html`, etc.) and re-switch.
- Keep each source page self-contained (inline CSS/JS or absolute asset paths). The switch is a straight file copy — no build step.
