# AI Inside: Weekly Roundup

A lightweight static site that publishes a weekly summary of how organizations implement and use AI in internal processes.

## Quick start

1. **Deploy** to GitHub Pages, Netlify, or Vercel — it's just static files.
2. **Auto-update weekly** via GitHub Actions (included). The `scripts/update.js` pulls from curated RSS feeds, filters for enterprise/internal AI topics, and prepends a new post into `data/posts.json`.

### Local dev
- Serve the folder with any static server (e.g., `python3 -m http.server`).

### Customize
- Edit `scripts/update.js` to tune feeds, keywords, and the post template.
- Change the cron in `.github/workflows/weekly.yml` to your preferred time.
- The site reads `data/posts.json` and shows the newest post as *Latest* with the rest in *Archive*.

### First content
A seed post dated **2025-08-18** is included in `data/posts.json`.

---

**Note:** The updater uses public RSS feeds with basic keyword filtering (no API keys). For richer summaries, hook this repo to your own summarization service or add manual posts to `data/posts.json`.
