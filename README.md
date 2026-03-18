# מחזור 8 — AI Engineer Course Schedule

> **⚠️ CONFIDENTIAL — PROPRIETARY MATERIAL**
>
> © 2026 **The Hebrew University of Jerusalem** (האוניברסיטה העברית בירושלים). All rights reserved.
>
> All content, materials, recordings, slides, code, and documentation in this repository are the exclusive intellectual property of The Hebrew University of Jerusalem and its authorized instructors. Unauthorized copying, redistribution, reproduction, public display, or any form of use — in whole or in part — without prior written consent is strictly prohibited and may result in disciplinary action, civil liability, and criminal prosecution under Israeli Copyright Law (חוק זכות יוצרים, התשס״ח-2007) and applicable international treaties.
>
> Access is granted exclusively to enrolled students of Cohort 8 for personal educational use only.

---

Course content hub for Cohort 8. Aggregates lectures, recordings, exercises, and materials from Google Drive into a single searchable page.

## Features

- Offline-first — works from localStorage cache, sync weekly for updates
- Dark mode toggle
- Instant search/filter across all content
- Collapsible sections and cards
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
├── LICENSE             # Proprietary license — all rights reserved
├── .gitignore
└── README.md
```

## Usage

Open `index.html` in a browser — no build step, no server needed. Works on GitHub Pages.

## Contact

Course admin: Michal Fischbein — מיכל פישביין — +972 54-459-9661

---

*See [LICENSE](LICENSE) for full legal terms.*
