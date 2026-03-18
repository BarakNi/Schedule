# מחזור 8 — AI Engineer Course Schedule

Course content hub for Cohort 8. Aggregates lectures, recordings, exercises, and materials from Google Drive into a single searchable page.

## Features

- Offline-first — works from localStorage cache, sync weekly for updates
- Dark mode toggle
- Instant search/filter across all content
- Collapsible sections (Python Prep / AI Lectures / Shared Resources)
- Sync button crawls Google Drive folders + Sheets for new recordings and files

## Structure

```
Schedule/
├── index.html          # Page markup
├── css/
│   └── style.css       # All styles, light/dark themes
├── js/
│   ├── data.js         # Drive URLs, baseline lectures, shared resources
│   └── app.js          # Cache, render, sync, filter, theme, init
├── .gitignore
└── README.md
```

## Usage

Open `index.html` in a browser — no build step, no server needed. Works on GitHub Pages.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo
2. Go to Settings → Pages → Source: Deploy from branch → `main` / root
3. Site will be live at `https://<user>.github.io/<repo>/`

## Contact

Course admin: Michal Fischbein — מיכל פישביין — +972 54-459-9661
