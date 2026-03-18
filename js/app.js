/* =====================================================================
   AI Engineer Course — מחזור 8 — Application Logic
   Cache, render, sync, filter, theme, init.
   Depends on: js/data.js (loaded first)

   © 2026 The Hebrew University of Jerusalem
   (האוניברסיטה העברית בירושלים). All rights reserved.
   Protected under Israeli Copyright Law and international treaties.
   Unauthorized use, reproduction, or distribution is prohibited.
   ===================================================================== */

// ---- State ----
let currentLectures = [];

// =====================================================================
// CACHE (localStorage)
// =====================================================================
function saveCache(data) {
    try {
        localStorage.setItem(CK, JSON.stringify(data));
        localStorage.setItem(CT, new Date().toISOString());
    } catch (e) { console.warn("Cache save failed", e); }
}

function loadCache() {
    try {
        const d = localStorage.getItem(CK);
        return d ? JSON.parse(d) : null;
    } catch (e) { return null; }
}

function getCacheTimestamp() {
    const t = localStorage.getItem(CT);
    return t ? new Date(t) : null;
}

// =====================================================================
// TOAST
// =====================================================================
function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

// =====================================================================
// HELPERS
// =====================================================================
function getStatus(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return "today";
    return d < today ? "past" : "upcoming";
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IL", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function badgeFor(type) {
    const m = { pdf: "badge-pdf", notebook: "badge-notebook", slides: "badge-slides", video: "badge-video", link: "badge-link" };
    return `<span class="badge ${m[type] || "badge-link"}">${type}</span>`;
}

function fileIcon(type) {
    const m = { pdf: "📄", notebook: "📓", slides: "📊", video: "🎬", link: "🔗" };
    return m[type] || "📎";
}

// =====================================================================
// RENDER
// =====================================================================

function sectionIcon(section) {
    return section === "python" ? "🐍" : section === "lectures" ? "🧠" : "📎";
}

function fileCountLabel(files) {
    if (!files || !files.length) return "";
    const n = files.length;
    return `<span class="file-count">${n} file${n > 1 ? "s" : ""}</span>`;
}

function renderCard(item) {
    const status = getStatus(item.date);
    const files = (item.files || []).map(f => {
        const name = f.n || f.name || "File";
        const url = f.u || f.url || "#";
        const type = f.t || f.type || "link";
        const isPlaceholder = url === "#" || !url;
        if (isPlaceholder) {
            return `<li>${fileIcon(type)} <span class="placeholder-link">${name} (coming soon)</span> ${badgeFor("placeholder")}</li>`;
        }
        return `<li>${fileIcon(type)} <a href="${url}" target="_blank" rel="noopener">${name}</a> ${badgeFor(type)}</li>`;
    }).join("");
    const isNew = item._new ? " new-entry" : "";
    const icon = sectionIcon(item.section);
    const sub = item.desc ? item.desc.substring(0, 60) : "";
    return `<div class="lecture-card ${status}${isNew}" style="animation-delay:${item._i * 0.04}s">
        <div class="card-toggle" onclick="toggleCard(this)">
            <div class="card-toggle-icon">${icon}</div>
            <div class="card-toggle-info">
                <div class="card-toggle-title">${item.title}</div>
                ${sub ? `<div class="card-toggle-sub">${sub}</div>` : ""}
            </div>
            <div class="card-toggle-right">
                <span class="lecture-date">${formatDate(item.date)}</span>
                ${fileCountLabel(item.files)}
                <span class="card-chevron">▼</span>
            </div>
        </div>
        <div class="card-body">
            ${item.desc ? `<div class="lecture-description">${item.desc}</div>` : ""}
            ${files ? `<ul class="files-list">${files}</ul>` : ""}
        </div>
    </div>`;
}

// Toggle individual card open/closed
function toggleCard(el) {
    el.closest(".lecture-card").classList.toggle("card-open");
}

function renderSection(id, label, items, idx) {
    const saved = localStorage.getItem("ai8_col_" + id);
    const collapsed = saved === "1";
    let cards = "";
    items.forEach(l => { l._i = idx.v++; cards += renderCard(l); });
    return `<div class="section-header${collapsed ? " collapsed" : ""}" data-section="${id}" onclick="toggleSection('${id}')">
        ${label} <span class="section-chevron">▼</span>
    </div>
    <div class="section-body${collapsed ? " collapsed" : ""}" id="sec-${id}">${cards}</div>`;
}

function renderSharedSection(items, idx) {
    const saved = localStorage.getItem("ai8_col_shared");
    const collapsed = saved === "1";
    const chips = items.map(item => {
        const f = (item.files && item.files[0]) || {};
        const name = f.n || f.name || item.title;
        const url = f.u || f.url || "#";
        const type = f.t || f.type || "link";
        idx.v++;
        return `<a class="shared-chip" href="${url}" target="_blank" rel="noopener">${fileIcon(type)} ${name} ${badgeFor(type)}</a>`;
    }).join("");
    return `<div class="section-header${collapsed ? " collapsed" : ""}" data-section="shared" onclick="toggleSection('shared')">
        📚 Shared Resources <span class="section-chevron">▼</span>
    </div>
    <div class="section-body${collapsed ? " collapsed" : ""}" id="sec-shared"><div class="shared-grid">${chips}</div></div>`;
}

// Global — called from onclick in rendered HTML
function toggleSection(id) {
    const header = document.querySelector(`.section-header[data-section="${id}"]`);
    const body = document.getElementById("sec-" + id);
    const isCollapsed = body.classList.toggle("collapsed");
    header.classList.toggle("collapsed", isCollapsed);
    localStorage.setItem("ai8_col_" + id, isCollapsed ? "1" : "0");
}

function render(data) {
    const list = document.getElementById("lectureList");
    if (!data || data.length === 0) {
        list.innerHTML = `<div class="no-results">No lectures found.</div>`;
        return;
    }
    const python   = data.filter(d => d.section === "python");
    const lectures = data.filter(d => d.section === "lectures");
    const shared   = data.filter(d => d.section === "shared");
    let html = "";
    const idx = { v: 0 };
    if (python.length)   html += renderSection("python", "🐍 Python Prep — Ilay", python, idx);
    if (lectures.length) html += renderSection("lectures", "🤖 AI Lectures — Zvi", lectures, idx);
    if (shared.length)   html += renderSharedSection(shared, idx);
    list.innerHTML = html;
}

// =====================================================================
// FILTER (instant, local only — no network)
// =====================================================================
function filterContent(query) {
    if (!query || !query.trim()) { render(currentLectures); return; }
    const q = query.toLowerCase().trim();
    const filtered = currentLectures.filter(item => {
        const haystack = [item.title, item.desc, item.date, item.section,
            ...(item.files || []).map(f => f.n || f.name || "")].join(" ").toLowerCase();
        return haystack.includes(q);
    });
    render(filtered);
}

// =====================================================================
// BUILD SHARED ITEMS helper
// =====================================================================
function buildSharedItems() {
    return SHARED.map(s => ({
        date: "2026-01-01", title: s.n, section: "shared",
        files: [{ n: s.n, u: s.u, t: s.t }]
    }));
}

// =====================================================================
// SYNC — fetches Drive folders + Sheets, rebuilds everything
// =====================================================================
async function syncAndRebuild() {
    const btn = document.getElementById("refreshBtn");
    const status = document.getElementById("syncStatus");
    btn.classList.add("spinning");
    btn.disabled = true;
    status.textContent = "⏳ Starting sync...";
    let newFiles = [];

    try {
        // --- Step 1: Fetch recordings from Google Sheets ---
        status.textContent = "📋 Fetching recording links from spreadsheet...";
        const recordings = {};
        try {
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET}/gviz/tq?tqx=out:csv`;
            const resp = await fetch(sheetUrl);
            if (resp.ok) {
                const csv = await resp.text();
                const rows = csv.split("\n");
                for (const row of rows) {
                    const dateMatch = row.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
                    const urlMatch = row.match(/(https?:\/\/[^\s",]+)/g);
                    if (dateMatch && urlMatch) {
                        const day = dateMatch[1].padStart(2, "0");
                        const month = dateMatch[2].padStart(2, "0");
                        let year = dateMatch[3];
                        if (year.length === 2) year = "20" + year;
                        const key = `${year}-${month}-${day}`;
                        recordings[key] = urlMatch.filter(u =>
                            u.includes("zoom") || u.includes("drive.google") || u.includes("docs.google"));
                    }
                }
            }
        } catch (e) { console.warn("Sheet fetch failed (CORS expected):", e); }

        // --- Step 2: Crawl Drive folders for file names ---
        status.textContent = "📁 Crawling Drive folders for files...";
        const driveFiles = {};
        for (const folderId of CRAWL) {
            try {
                const url = `https://drive.google.com/drive/folders/${folderId}`;
                const resp = await fetch(url);
                if (resp.ok) {
                    const html = await resp.text();
                    const filePattern = /data-id="([^"]+)"[^>]*>([^<]*\.(pdf|pptx?|ipynb|py|mp4|zip|txt))/gi;
                    let m;
                    while ((m = filePattern.exec(html)) !== null) {
                        if (!driveFiles[folderId]) driveFiles[folderId] = [];
                        driveFiles[folderId].push({
                            name: m[2],
                            url: `https://drive.google.com/file/d/${m[1]}/view`,
                            type: m[2].match(/\.pdf$/i) ? "pdf"
                                : m[2].match(/\.pptx?$/i) ? "slides"
                                : m[2].match(/\.ipynb$/i) ? "notebook"
                                : m[2].match(/\.mp4$/i) ? "video"
                                : "link"
                        });
                    }
                }
            } catch (e) { console.warn("Drive crawl failed for", folderId, e); }
        }

        // --- Step 3: Merge recordings into base lectures ---
        status.textContent = "🔄 Merging data...";
        const merged = JSON.parse(JSON.stringify(BASE));
        for (const lec of merged) {
            if (recordings[lec.date]) {
                for (const url of recordings[lec.date]) {
                    const already = lec.files.some(f => (f.u || f.url) === url);
                    if (!already) {
                        lec.files.push({ n: "📹 Recording", u: url, t: "video" });
                        lec._new = true;
                    }
                }
            }
        }

        // Collect newly discovered files
        for (const [, files] of Object.entries(driveFiles)) {
            for (const file of files) {
                const exists = merged.some(l => l.files.some(f => (f.n || f.name) === file.name));
                if (!exists) newFiles.push(file);
            }
        }

        // Build shared resources
        const sharedItems = buildSharedItems();
        if (newFiles.length > 0) {
            sharedItems.push({
                date: new Date().toISOString().slice(0, 10),
                title: "🆕 Discovered Files (from Sync)",
                section: "shared",
                desc: `${newFiles.length} file(s) found during sync`,
                _new: true,
                files: newFiles.map(f => ({ n: f.name, u: f.url, t: f.type }))
            });
        }

        currentLectures = [...merged, ...sharedItems];
        saveCache(currentLectures);
        render(currentLectures);
        updateTimestamp();

        btn.classList.remove("spinning");
        btn.classList.add("success");
        status.textContent = "✅ Sync complete.";
        showToast(`Synced — ${merged.length} lectures, ${newFiles.length} new file(s)`);
        setTimeout(() => { btn.classList.remove("success"); status.textContent = ""; }, 3000);

    } catch (err) {
        console.error("Sync error:", err);
        btn.classList.remove("spinning");
        btn.classList.add("error");
        status.textContent = "❌ Sync failed — using cached data.";
        showToast("Sync failed. Using cached data.");
        setTimeout(() => { btn.classList.remove("error"); status.textContent = ""; }, 3000);
    } finally {
        btn.disabled = false;
    }
}

// =====================================================================
// TIMESTAMP
// =====================================================================
function updateTimestamp() {
    const el = document.getElementById("lastUpdated");
    const ts = getCacheTimestamp();
    if (ts) {
        el.textContent = `Last synced: ${ts.toLocaleDateString("en-IL")} ${ts.toLocaleTimeString("en-IL", { hour: "2-digit", minute: "2-digit" })}`;
    }
}

// =====================================================================
// DARK MODE
// =====================================================================
function initTheme() {
    const saved = localStorage.getItem("ai8_theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    const btn = document.getElementById("themeToggle");
    const update = () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        btn.textContent = isDark ? "☀️" : "🌙";
    };
    update();
    btn.addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const next = isDark ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("ai8_theme", next);
        update();
    });
}

// =====================================================================
// INIT
// =====================================================================
function init() {
    initTheme();

    // Load from cache or use baseline
    const cached = loadCache();
    if (cached && cached.length) {
        currentLectures = cached;
    } else {
        currentLectures = [...BASE, ...buildSharedItems()];
    }
    render(currentLectures);
    updateTimestamp();

    // Wire search
    document.getElementById("searchInput").addEventListener("input", e => filterContent(e.target.value));

    // Wire sync button
    document.getElementById("refreshBtn").addEventListener("click", syncAndRebuild);
}

document.addEventListener("DOMContentLoaded", init);
