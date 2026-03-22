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
        // Count total files across all lectures
        const total = data.reduce((sum, l) => sum + (l.files ? l.files.length : 0), 0);
        localStorage.setItem("ai8_fc", String(total));
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
    const autoOpen = item._forceOpen ? " card-open" : "";
    const icon = sectionIcon(item.section);
    const sub = item.desc ? item.desc.substring(0, 60) : "";
    return `<div class="lecture-card ${status}${isNew}${autoOpen}" style="animation-delay:${item._i * 0.04}s">
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
    const filtered = [];
    for (const item of currentLectures) {
        // Check if card-level fields match
        const cardText = [item.title, item.desc, item.date, item.section].join(" ").toLowerCase();
        const cardMatch = cardText.includes(q);

        // Filter files that match
        const matchedFiles = (item.files || []).filter(f =>
            (f.n || f.name || "").toLowerCase().includes(q)
        );

        if (cardMatch || matchedFiles.length > 0) {
            // Clone and replace files with only matching ones (unless the card itself matched — then keep all)
            const clone = Object.assign({}, item);
            if (!cardMatch && matchedFiles.length > 0) {
                clone.files = matchedFiles;
            }
            clone._forceOpen = true; // auto-expand when searching
            filtered.push(clone);
        }
    }
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
// SYNC — fetches new content from Drive + Sheets, rebuilds view
// =====================================================================
// No API key needed. Uses:
//   1. Google Drive "embeddedfolderview" — server-rendered HTML, parseable
//   2. Google Sheets CSV export
//   Both go through a CORS proxy chain.
// =====================================================================

const PROXIES = [
    url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function proxyFetch(url) {
    for (const mkProxy of PROXIES) {
        try {
            const resp = await fetch(mkProxy(url));
            if (resp.ok) return await resp.text();
        } catch (e) { console.warn("Proxy failed:", e.message); }
    }
    // Direct as last resort
    try { const r = await fetch(url); if (r.ok) return await r.text(); } catch (_) {}
    return null;
}

function parseSheetDate(raw) {
    const m = String(raw).match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (!m) return null;
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    let year = m[3];
    if (year.length === 2) year = "20" + year;
    return `${year}-${month}-${day}`;
}

function guessFileType(name) {
    const n = (name || "").toLowerCase();
    if (n.endsWith(".pdf")) return "pdf";
    if (/\.pptx?$/.test(n)) return "slides";
    if (n.endsWith(".ipynb")) return "notebook";
    if (n.endsWith(".mp4") || n.endsWith(".mkv") || n.endsWith(".webm")) return "video";
    if (n.endsWith(".py") || n.endsWith(".txt") || n.endsWith(".json") || n.endsWith(".csv")) return "link";
    return "link";
}

// =====================================================================
// Drive folder listing via embeddedfolderview (no auth, server-rendered)
// =====================================================================
function parseEmbedHTML(html) {
    // The embed view (embeddedfolderview) returns server-rendered HTML with
    // "flip-entry" divs. Confirmed structure:
    //
    //   <div class="flip-entry" id="entry-FILE_ID" ...>
    //     ...
    //     <div class="flip-entry-title">filename.ext</div>
    //     ...
    //   </div>
    //
    // We also detect folders vs files by checking for "folder" in the class/aria.

    const files = new Map(); // id → {name, id, isFolder}

    // Primary pattern: flip-entry with id + title
    // Use a two-pass approach for reliability:

    // Pass 1: Extract all entry IDs and their surrounding HTML chunks
    const entryRe = /id="entry-([a-zA-Z0-9_-]+)"([\s\S]*?)(?=id="entry-|<\/div>\s*<\/div>\s*<\/body>|$)/gi;
    let m;
    while ((m = entryRe.exec(html)) !== null) {
        const id = m[1];
        const chunk = m[2];

        // Extract title from the chunk
        const titleMatch = chunk.match(/class="flip-entry-title"[^>]*>([^<]+)/);
        if (!titleMatch) continue;
        const name = titleMatch[1].trim();
        if (!name) continue;

        // Detect if it's a folder
        const isFolder = /folder/i.test(chunk.substring(0, 500));

        files.set(id, { id, name, isFolder });
    }

    // Fallback: if the above found nothing, try a simpler regex
    if (files.size === 0) {
        const simpleRe = /entry-([a-zA-Z0-9_-]+)[\s\S]*?flip-entry-title[^>]*>([^<]+)/gi;
        while ((m = simpleRe.exec(html)) !== null) {
            const id = m[1];
            const name = m[2].trim();
            if (name && !files.has(id)) {
                files.set(id, { id, name, isFolder: false });
            }
        }
    }

    return Array.from(files.values());
}

async function listFolderEmbed(folderId) {
    const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    const html = await proxyFetch(url);
    if (!html) {
        console.warn(`[sync] No HTML returned for folder ${folderId}`);
        return [];
    }
    if (html.length < 100 || html.includes('"error"')) {
        console.warn(`[sync] Bad response for folder ${folderId}:`, html.substring(0, 200));
        return [];
    }
    const files = parseEmbedHTML(html);
    console.log(`[sync] Folder ${folderId}: parsed ${files.length} items from ${html.length} bytes`);
    return files;
}

// =====================================================================
// Spreadsheet CSV fetch
// =====================================================================
async function fetchSheetCSV() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET}/gviz/tq?tqx=out:csv`;
    const csv = await proxyFetch(url);
    if (!csv) return null;
    return csv.split("\n").map(row =>
        row.split(",").map(cell => cell.replace(/^"|"$/g, "").trim())
    );
}

// =====================================================================
// Parse helpers
// =====================================================================
function parseRecordings(rows) {
    const recordings = {};
    let currentSection = "python";

    for (const row of rows) {
        const firstCell = String(row[0] || "").trim();
        if (/^Lectures/i.test(firstCell)) { currentSection = "lectures"; continue; }
        if (/^Python/i.test(firstCell)) { currentSection = "python"; continue; }

        const dateKey = parseSheetDate(firstCell);
        if (!dateKey) continue;

        const urls = [];
        let label = "";
        for (let i = 0; i < row.length; i++) {
            const cell = String(row[i] || "");
            const found = cell.match(/(https?:\/\/[^\s",]+)/g);
            if (found) urls.push(...found);
            if (i === 1 || i === 2) {
                const txt = cell.replace(/(https?:\/\/[^\s",]+)/g, "").trim();
                if (txt && !label) label = txt;
            }
        }

        if (!recordings[dateKey]) recordings[dateKey] = { urls: [], label, section: currentSection };
        recordings[dateKey].urls.push(...urls);
        if (label && !recordings[dateKey].label) recordings[dateKey].label = label;
        recordings[dateKey].section = currentSection;
    }
    return recordings;
}

// =====================================================================
// Main sync orchestrator
// =====================================================================
async function syncAndRebuild() {
    const btn = document.getElementById("refreshBtn");
    const statusEl = document.getElementById("syncStatus");
    btn.classList.add("spinning");
    btn.disabled = true;
    statusEl.textContent = "⏳ Starting sync...";
    let newFilesCount = 0;
    let foldersScanned = 0;
    let totalDriveFiles = 0;

    try {
        // ---- Step 1: Crawl Drive folders via embed view (recursive) ----
        const driveFiles = {}; // folderId → { files[], label, section }
        let done = 0;

        // Recursive crawl: scan a folder, and if subfolders are found, scan those too
        async function crawlFolder(id, label, section, depth) {
            if (depth > 2) return; // max 3 levels deep
            if (driveFiles[id]) return; // already scanned
            done++;
            statusEl.textContent = `📁 Scanning ${label}... (${done} folders)`;
            try {
                const items = await listFolderEmbed(id);
                const files = [];
                const subfolders = [];
                for (const item of items) {
                    if (item.isFolder) {
                        subfolders.push(item);
                    }
                    files.push(item);
                }
                driveFiles[id] = { files, label, section };
                totalDriveFiles += files.length;
                if (files.length > 0) foldersScanned++;
                console.log(`[sync] ${label}: ${files.length} items (${subfolders.length} subfolders)`, files.map(f => f.name));

                // Recursively crawl discovered subfolders
                for (const sub of subfolders) {
                    // Inherit section from parent, use subfolder name as label
                    await crawlFolder(sub.id, sub.name, section, depth + 1);
                }
            } catch (e) {
                console.warn(`[sync] Failed for ${label}:`, e);
                driveFiles[id] = { files: [], label, section };
            }
        }

        // Start with all configured CRAWL folders
        for (const folder of CRAWL) {
            await crawlFolder(folder.id, folder.label, folder.section, 0);
        }

        // ---- Step 2: Fetch spreadsheet CSV ----
        statusEl.textContent = "📋 Fetching recordings spreadsheet...";
        const sheetRows = await fetchSheetCSV();
        const recordings = sheetRows ? parseRecordings(sheetRows) : {};

        // ---- Step 3: Merge everything ----
        statusEl.textContent = "🔄 Merging data...";
        const merged = JSON.parse(JSON.stringify(BASE));
        const existingDates = new Set(merged.map(l => l.date));

        // Build set of known file URLs and names from BASE
        const knownUrls = new Set();
        const knownNames = new Set();
        for (const lec of merged) {
            for (const f of lec.files) {
                if (f.u) knownUrls.add(f.u);
                // Strip emoji prefix for comparison
                if (f.n) knownNames.add(f.n.replace(/^[📁🎬📄📓📊🎥🔗📎]\s*/, "").trim().toLowerCase());
            }
        }

        // Add Zoom links from spreadsheet to existing lectures
        for (const lec of merged) {
            const rec = recordings[lec.date];
            if (!rec) continue;
            for (const url of rec.urls) {
                if (!lec.files.some(f => (f.u || "") === url)) {
                    lec.files.push({ n: "🎥 Zoom Recording", u: url, t: "video" });
                    lec._new = true;
                    newFilesCount++;
                }
            }
        }

        // Create new lecture entries for dates in spreadsheet but not in BASE
        for (const [dateKey, rec] of Object.entries(recordings)) {
            if (existingDates.has(dateKey)) continue;
            const label = rec.label || "Session";
            merged.push({
                date: dateKey,
                title: `${label} — ${dateKey.split("-").reverse().join(".")}`,
                section: rec.section || "lectures",
                desc: "Discovered during sync",
                _new: true,
                files: rec.urls.map(u => ({ n: "🎥 Zoom Recording", u, t: "video" }))
            });
            newFilesCount += rec.urls.length;
        }

        merged.sort((a, b) => a.date.localeCompare(b.date));

        // ---- Step 4: Smart-match discovered Drive files to lectures ----
        const unmatchedFiles = [];

        // Build lookup: folder ID → lectures that reference it
        const folderToLectures = {};
        for (const lec of merged) {
            for (const f of lec.files) {
                const u = f.u || "";
                const folderMatch = u.match(/\/folders\/([a-zA-Z0-9_-]+)/);
                if (folderMatch) {
                    const fid = folderMatch[1];
                    if (!folderToLectures[fid]) folderToLectures[fid] = [];
                    if (!folderToLectures[fid].includes(lec)) folderToLectures[fid].push(lec);
                }
            }
        }

        // Helper: extract a date from a string (supports "24.2.26", "2026-02-24", "24-02-26", "24_2_26")
        function extractDate(str) {
            // DD.MM.YY or DD.MM.YYYY
            let m = str.match(/(\d{1,2})[.\-_](\d{1,2})[.\-_](\d{2,4})/);
            if (m) {
                const day = m[1].padStart(2, "0");
                const month = m[2].padStart(2, "0");
                let year = m[3];
                if (year.length === 2) year = "20" + year;
                return `${year}-${month}-${day}`;
            }
            return null;
        }

        // Helper: extract lecture number from string ("lesson3" → 3, "class2" → 2, "lecture 4" → 4)
        function extractLessonNum(str) {
            const m = str.match(/(?:lesson|class|lecture|tirgul|practice)[_\s-]*(\d+)/i);
            return m ? parseInt(m[1]) : null;
        }

        for (const [folderId, data] of Object.entries(driveFiles)) {
            if (!data.files || !data.files.length) continue;
            for (const file of data.files) {
                const fileUrl = file.isFolder ? (D + file.id) : (V + file.id + "/view");
                const nameLower = file.name.trim().toLowerCase();

                // Skip if already known
                if (knownUrls.has(fileUrl) || knownNames.has(nameLower)) continue;

                const type = file.isFolder ? "link" : guessFileType(file.name);
                const displayName = file.isFolder ? ("📁 " + file.name) : file.name;
                let matched = false;

                // Strategy 1: Date in filename or parent folder name → match to lecture on that date
                if (!matched) {
                    const dateFromFile = extractDate(file.name) || extractDate(data.label);
                    if (dateFromFile) {
                        // Try same section first, then any section
                        const lec = merged.find(l => l.date === dateFromFile && l.section === data.section)
                                 || merged.find(l => l.date === dateFromFile);
                        if (lec && !lec.files.some(f => f.u === fileUrl)) {
                            lec.files.push({ n: displayName, u: fileUrl, t: type });
                            lec._new = true;
                            matched = true;
                            newFilesCount++;
                        }
                    }
                }

                // Strategy 2: Folder is directly referenced by a lecture card
                if (!matched) {
                    const linkedLecs = folderToLectures[folderId];
                    if (linkedLecs && linkedLecs.length > 0) {
                        const lec = linkedLecs[0];
                        if (!lec.files.some(f => f.u === fileUrl)) {
                            lec.files.push({ n: displayName, u: fileUrl, t: type });
                            lec._new = true;
                            matched = true;
                            newFilesCount++;
                        }
                    }
                }

                // Strategy 3: Lesson/class number in filename → match to Nth lecture in section
                if (!matched) {
                    const num = extractLessonNum(file.name) || extractLessonNum(data.label);
                    if (num) {
                        const sectionLecs = merged.filter(l => l.section === data.section);
                        // Nth lecture (1-indexed)
                        if (num >= 1 && num <= sectionLecs.length) {
                            const lec = sectionLecs[num - 1];
                            if (!lec.files.some(f => f.u === fileUrl)) {
                                lec.files.push({ n: displayName, u: fileUrl, t: type });
                                lec._new = true;
                                matched = true;
                                newFilesCount++;
                            }
                        }
                    }
                }

                // Strategy 4: Keyword match — filename words vs lecture title/desc
                if (!matched) {
                    const words = nameLower.replace(/\.[^.]+$/, "").split(/[^a-z0-9]+/).filter(w => w.length > 2);
                    if (words.length > 0) {
                        let bestLec = null;
                        let bestScore = 0;
                        for (const lec of merged.filter(l => l.section === data.section)) {
                            const lecText = (lec.title + " " + (lec.desc || "")).toLowerCase();
                            let score = 0;
                            for (const w of words) {
                                if (lecText.includes(w)) score++;
                            }
                            if (score > bestScore) { bestScore = score; bestLec = lec; }
                        }
                        if (bestLec && bestScore >= 1 && !bestLec.files.some(f => f.u === fileUrl)) {
                            bestLec.files.push({ n: displayName, u: fileUrl, t: type });
                            bestLec._new = true;
                            matched = true;
                            newFilesCount++;
                        }
                    }
                }

                // Strategy 5: Recording files → most recent lecture in same section
                if (!matched && (type === "video" || /recording/i.test(data.label) || /recording/i.test(file.name))) {
                    const candidates = merged.filter(l => l.section === data.section);
                    for (let i = candidates.length - 1; i >= 0; i--) {
                        const lec = candidates[i];
                        if (!lec.files.some(f => f.u === fileUrl)) {
                            lec.files.push({ n: displayName, u: fileUrl, t: type });
                            lec._new = true;
                            matched = true;
                            newFilesCount++;
                            break;
                        }
                    }
                }

                if (!matched) {
                    unmatchedFiles.push({ name: displayName, url: fileUrl, type, folderLabel: data.label, section: data.section });
                    newFilesCount++;
                }
            }
        }

        // ---- Step 5: Build shared resources + unmatched ----
        const sharedItems = buildSharedItems();
        if (unmatchedFiles.length > 0) {
            const byFolder = {};
            for (const f of unmatchedFiles) {
                const key = f.folderLabel || "Other";
                if (!byFolder[key]) byFolder[key] = [];
                byFolder[key].push(f);
            }
            for (const [label, files] of Object.entries(byFolder)) {
                sharedItems.push({
                    date: new Date().toISOString().slice(0, 10),
                    title: `🆕 ${label} — New Files`,
                    section: "shared",
                    desc: `${files.length} file(s) discovered during sync`,
                    _new: true,
                    files: files.map(f => ({ n: f.name, u: f.url, t: f.type }))
                });
            }
        }

        currentLectures = [...merged, ...sharedItems];
        saveCache(currentLectures);
        render(currentLectures);
        updateTimestamp();

        // ---- Success ----
        btn.classList.remove("spinning");
        btn.classList.add("success");
        const driveMsg = totalDriveFiles > 0
            ? `${totalDriveFiles} Drive files from ${foldersScanned} folders`
            : "⚠️ No Drive files found (folders may require sign-in)";
        statusEl.textContent = `✅ ${driveMsg}`;
        showToast(`Synced — ${merged.length} sessions, ${newFilesCount} new items`);
        setTimeout(() => { btn.classList.remove("success"); statusEl.textContent = ""; }, 5000);

    } catch (err) {
        console.error("Sync error:", err);
        btn.classList.remove("spinning");
        btn.classList.add("error");
        statusEl.textContent = "❌ Sync failed — using cached data.";
        showToast("Sync failed. Check console for details.");
        setTimeout(() => { btn.classList.remove("error"); statusEl.textContent = ""; }, 4000);
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
        const fc = localStorage.getItem("ai8_fc") || "0";
        el.textContent = `Last synced: ${ts.toLocaleDateString("en-IL")} ${ts.toLocaleTimeString("en-IL", { hour: "2-digit", minute: "2-digit" })} · ${fc} files`;
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
// DISCLAIMER MODAL — intercepts all outbound link clicks
// =====================================================================
let disclaimerAccepted = false;
let pendingUrl = null;

function initDisclaimer() {
    const modal = document.getElementById("disclaimerModal");
    const acceptBtn = document.getElementById("disclaimerAccept");
    const declineBtn = document.getElementById("disclaimerDecline");

    // Check if already accepted this session
    if (sessionStorage.getItem("ai8_terms") === "1") {
        disclaimerAccepted = true;
    }

    // Intercept all clicks on links with target="_blank" (outbound)
    document.addEventListener("click", function (e) {
        const link = e.target.closest('a[target="_blank"]');
        if (!link) return;
        if (disclaimerAccepted) return; // already accepted this session

        e.preventDefault();
        e.stopPropagation();
        pendingUrl = link.href;
        modal.classList.add("visible");
    }, true);

    acceptBtn.addEventListener("click", function () {
        disclaimerAccepted = true;
        sessionStorage.setItem("ai8_terms", "1");
        modal.classList.remove("visible");
        if (pendingUrl) {
            window.open(pendingUrl, "_blank", "noopener");
            pendingUrl = null;
        }
    });

    declineBtn.addEventListener("click", function () {
        pendingUrl = null;
        modal.classList.remove("visible");
        showToast("Access declined. You must accept the terms to view materials.");
    });

    // Close on overlay click (outside modal)
    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            pendingUrl = null;
            modal.classList.remove("visible");
        }
    });
}

// =====================================================================
// INIT
// =====================================================================
function init() {
    initTheme();
    initDisclaimer();

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
