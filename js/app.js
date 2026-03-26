/* =====================================================================
   AI Engineer Course — מחזור 8 — Application Logic (v2)
   Two content types: RECORDINGS and CONTENT.
   Timeline view shows sessions chronologically.
   Recordings view shows only recordings.
   Content view shows materials grouped by source folder.
   Content is matched to sessions by upload date.

   © 2026 The Hebrew University of Jerusalem
   (האוניברסיטה העברית בירושלים). All rights reserved.
   Protected under Israeli Copyright Law and international treaties.
   Unauthorized use, reproduction, or distribution is prohibited.
   ===================================================================== */

// ---- State ----
let sessions = [];
let currentView = "timeline"; // "timeline" | "recordings" | "content"

// =====================================================================
// CACHE
// =====================================================================
function saveCache(data) {
    try {
        localStorage.setItem(CK, JSON.stringify(data));
        localStorage.setItem(CT, new Date().toISOString());
        const totalRec = data.reduce((s, d) => s + (d.recordings ? d.recordings.length : 0), 0);
        const totalCon = data.reduce((s, d) => s + (d.content ? d.content.length : 0), 0);
        localStorage.setItem("ai8_fc_v2", String(totalRec + totalCon));
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
    if (!dateStr) return "past";
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return "today";
    return d < today ? "past" : "upcoming";
}

function formatDate(dateStr) {
    if (!dateStr) return "";
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

function sectionIcon(section) {
    return section === "python" ? "🐍" : section === "lectures" ? "🧠" : "📎";
}

function guessFileType(name) {
    const n = (name || "").toLowerCase();
    if (n.endsWith(".pdf")) return "pdf";
    if (/\.pptx?$/.test(n)) return "slides";
    if (n.endsWith(".ipynb")) return "notebook";
    if (n.endsWith(".mp4") || n.endsWith(".mkv") || n.endsWith(".webm")) return "video";
    return "link";
}

// Extract human-readable topic names from content filenames.
// "01. Data Science Foundations.pdf" → "Data Science Foundations"
// "lesson3_animal_abstract.py" → skipped (code file, not a topic)
// "📁 Supervised Learning" → "Supervised Learning"
function extractTopics(files) {
    if (!files || !files.length) return [];
    const topics = [];
    const seen = new Set();
    for (const f of files) {
        const raw = f.n || f.name || "";
        // Skip folder links, recordings, generic files
        if (/^📁/.test(raw)) continue;
        if (/recording|zoom/i.test(raw)) continue;
        // Only consider PDFs, slides, notebooks as topic sources
        const type = f.t || f.type || "";
        if (type !== "pdf" && type !== "slides" && type !== "notebook") continue;
        // Clean the filename
        let topic = raw
            .replace(/\.[^.]+$/, "")           // remove extension
            .replace(/^[\d]+[\.\)\-_\s]+/, "")  // remove leading numbers "01. " "1) "
            .replace(/^📓\s*|^📄\s*|^📊\s*/, "") // remove emoji prefixes
            .replace(/_/g, " ")                 // underscores to spaces
            .trim();
        if (topic.length < 3) continue;
        const key = topic.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        topics.push(topic);
    }
    return topics;
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

function renderFileItem(f, sessionDate) {
    const name = f.n || f.name || "File";
    const url = f.u || f.url || "#";
    const type = f.t || f.type || "link";
    const uploadDate = f._uploadDate || "";
    const dateFromName = f._dateFromName || "";
    const folder = f._folder || "";
    const isApprox = f._approx || false;
    const noUrl = url === "#" || !url;

    // Build tooltip — always show debug info
    const tooltipParts = [];
    if (f._created) tooltipParts.push("Created: " + f._created);
    if (f._createdISO) tooltipParts.push("Created→: " + f._createdISO);
    if (uploadDate) tooltipParts.push("Modified: " + uploadDate);
    if (f._modifiedISO) tooltipParts.push("Modified→: " + f._modifiedISO);
    if (dateFromName) tooltipParts.push("Date in name: " + dateFromName);
    if (folder) tooltipParts.push("Source: " + folder);
    tooltipParts.push("Session: " + (sessionDate || "n/a"));
    if (isApprox) tooltipParts.push("⚠ Approximate match — " + (f._gap || "?") + " days from session");
    const tooltip = ` title="${tooltipParts.join('  ·  ')}"`;

    // Visible hint: show modified date if available, then date-from-name, then session
    const hintText = uploadDate || dateFromName || (sessionDate ? "session " + sessionDate : "");
    const gapLabel = isApprox && f._gap ? ` (${f._gap}d)` : "";
    const approxMark = isApprox ? `<span class="approx-mark" title="Approximate match — ${f._gap || "?"} days from session">*</span>` : "";
    const hintHtml = hintText
        ? `${approxMark}<span class="upload-date-hint${isApprox ? " approx" : ""}">${hintText}${gapLabel}</span>`
        : approxMark;

    if (noUrl) {
        return `<li${tooltip}>${fileIcon(type)} <span class="placeholder-link">${name} (coming soon)</span> ${badgeFor("placeholder")}${hintHtml}</li>`;
    }
    return `<li${tooltip}>${fileIcon(type)} <a href="${url}" target="_blank" rel="noopener">${name}</a> ${badgeFor(type)}${hintHtml}</li>`;
}

// Group content files by their source folder for visual display
function groupByFolder(files) {
    const groups = {};
    const ungrouped = [];
    for (const f of files) {
        const folder = f._folder || "";
        if (folder) {
            if (!groups[folder]) groups[folder] = [];
            groups[folder].push(f);
        } else {
            ungrouped.push(f);
        }
    }
    return { groups, ungrouped };
}

function renderFolderGroupedFiles(files, sessionDate) {
    const { groups, ungrouped } = groupByFolder(files);
    let html = "";

    // Render ungrouped files first
    if (ungrouped.length > 0) {
        html += `<ul class="files-list">${ungrouped.map(f => renderFileItem(f, sessionDate)).join("")}</ul>`;
    }

    // Render each folder group
    for (const [folderName, folderFiles] of Object.entries(groups)) {
        html += `<div class="folder-group">
            <div class="folder-group-header">📂 ${folderName}</div>
            <ul class="files-list folder-files">${folderFiles.map(f => renderFileItem(f, sessionDate)).join("")}</ul>
        </div>`;
    }
    return html;
}

// =====================================================================
// RENDER — TIMELINE VIEW (sessions by date, both types shown)
// =====================================================================
function renderTimelineCard(session, idx) {
    const status = getStatus(session.date);
    const icon = sectionIcon(session.section);
    const isNew = session._new ? " new-entry" : "";
    const autoOpen = session._forceOpen ? " card-open" : "";
    const recCount = (session.recordings || []).length;
    const conCount = (session.content || []).length;
    const totalCount = recCount + conCount;

    let recHtml = "";
    if (recCount > 0) {
        const items = session.recordings.map(f => renderFileItem(f, session.date)).join("");
        recHtml = `<div class="file-group">
            <div class="file-group-label">🎬 Recordings <span class="file-group-count">${recCount}</span></div>
            <ul class="files-list">${items}</ul>
        </div>`;
    }

    let conHtml = "";
    if (conCount > 0) {
        conHtml = `<div class="file-group">
            <div class="file-group-label">📁 Content <span class="file-group-count">${conCount}</span></div>
            ${renderFolderGroupedFiles(session.content, session.date)}
        </div>`;
    }

    const noFiles = recCount === 0 && conCount === 0;

    return `<div class="lecture-card ${status}${isNew}${autoOpen}" style="animation-delay:${idx * 0.04}s">
        <div class="card-toggle" onclick="toggleCard(this)">
            <div class="card-toggle-icon">${icon}</div>
            <div class="card-toggle-info">
                <div class="card-toggle-title">${session.title}</div>
                ${session.desc ? `<div class="card-toggle-sub">${session.desc}</div>` : ""}
            </div>
            <div class="card-toggle-right">
                <span class="lecture-date">${formatDate(session.date)}</span>
                ${totalCount > 0 ? `<span class="file-count">${totalCount} file${totalCount > 1 ? "s" : ""}</span>` : ""}
                ${recCount > 0 ? `<span class="type-pill type-recording">🎬 ${recCount}</span>` : ""}
                ${conCount > 0 ? `<span class="type-pill type-content">📁 ${conCount}</span>` : ""}
                <span class="card-chevron">▼</span>
            </div>
        </div>
        <div class="card-body">
            ${session.desc ? `<div class="lecture-description">${session.desc}</div>` : ""}
            ${noFiles ? `<div class="no-files-msg">No files yet</div>` : ""}
            ${recHtml}
            ${conHtml}
        </div>
    </div>`;
}

function renderUnmatchedCard(session) {
    const files = session.content || [];
    if (files.length === 0) return "";

    // Render each file with all date info visible inline
    const rows = files.map(f => {
        const name = f.n || f.name || "File";
        const url = f.u || f.url || "#";
        const type = f.t || f.type || "link";
        const noUrl = url === "#" || !url;
        const link = noUrl
            ? `<span class="placeholder-link">${name}</span>`
            : `<a href="${url}" target="_blank" rel="noopener">${name}</a>`;

        const created = f._created || "—";
        const modified = f._uploadDate || "—";
        const parsed = f._modifiedISO || "—";
        const createdISO = f._createdISO || "—";
        const fromName = f._dateFromName || "—";
        const folder = f._folder || "—";
        const gap = f._gap != null ? f._gap + "d" : "—";

        return `<tr>
            <td>${fileIcon(type)} ${link} ${badgeFor(type)}</td>
            <td class="um-date">${created}</td>
            <td class="um-date">${createdISO}</td>
            <td class="um-date">${modified}</td>
            <td class="um-date">${parsed}</td>
            <td class="um-date">${fromName}</td>
            <td class="um-date">${folder}</td>
            <td class="um-date">${gap}</td>
        </tr>`;
    }).join("");

    return `<div class="lecture-card unmatched card-open">
        <div class="card-toggle" onclick="toggleCard(this)">
            <div class="card-toggle-icon">📦</div>
            <div class="card-toggle-info">
                <div class="card-toggle-title">${session.title}</div>
                <div class="card-toggle-sub">${session.desc || ""}</div>
            </div>
            <div class="card-toggle-right">
                <span class="type-pill type-unmatched">⚠ ${files.length} file${files.length > 1 ? "s" : ""}</span>
                <span class="card-chevron">▼</span>
            </div>
        </div>
        <div class="card-body">
            <div class="unmatched-notice">Files with modified dates more than 7 days from any session. All date info shown for troubleshooting.</div>
            <div class="um-table-wrap">
                <table class="um-table">
                    <thead><tr>
                        <th>File</th>
                        <th>Created (raw)</th>
                        <th>Created (parsed)</th>
                        <th>Modified (raw)</th>
                        <th>Modified (parsed)</th>
                        <th>Date in name</th>
                        <th>Source folder</th>
                        <th>Gap</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function renderTimeline(data) {
    const container = document.getElementById("mainView");
    if (!data || data.length === 0) {
        container.innerHTML = `<div class="no-results">No sessions found.</div>`;
        return;
    }

    const python = data.filter(d => d.section === "python");
    const lectures = data.filter(d => d.section === "lectures");
    let html = "";
    let idx = 0;

    if (python.length) {
        const collapsed = localStorage.getItem("ai8_col_python") === "1";
        html += `<div class="section-header${collapsed ? " collapsed" : ""}" data-section="python" onclick="toggleSection('python')">
            🐍 Python Prep — Ilay <span class="section-chevron">▼</span>
        </div>
        <div class="section-body${collapsed ? " collapsed" : ""}" id="sec-python">`;
        python.forEach(s => { html += renderTimelineCard(s, idx++); });
        html += `</div>`;
    }

    if (lectures.length) {
        const collapsed = localStorage.getItem("ai8_col_lectures") === "1";
        html += `<div class="section-header${collapsed ? " collapsed" : ""}" data-section="lectures" onclick="toggleSection('lectures')">
            🤖 AI Lectures — Zvi <span class="section-chevron">▼</span>
        </div>
        <div class="section-body${collapsed ? " collapsed" : ""}" id="sec-lectures">`;
        lectures.forEach(s => { html += renderTimelineCard(s, idx++); });
        html += `</div>`;
    }

    // Shared resources
    const sharedHtml = renderSharedSection();
    if (sharedHtml) html += sharedHtml;

    // Unmatched content (extreme date misalignment)
    const unmatched = data.filter(d => d.section === "shared" && d._isUnmatched);
    if (unmatched.length) {
        unmatched.forEach(s => { html += renderUnmatchedCard(s); });
    }

    container.innerHTML = html;
}

// =====================================================================
// RENDER — RECORDINGS VIEW (only recordings, timeline order)
// =====================================================================
function renderRecordingsView(data) {
    const container = document.getElementById("mainView");
    const withRec = data.filter(s => s.recordings && s.recordings.length > 0);
    if (withRec.length === 0) {
        container.innerHTML = `<div class="no-results">No recordings found.</div>`;
        return;
    }

    let html = `<div class="view-description">🎬 All session recordings, ordered by date</div>`;
    let idx = 0;

    withRec.forEach(session => {
        const status = getStatus(session.date);
        const icon = sectionIcon(session.section);
        const items = session.recordings.map(f => renderFileItem(f, session.date)).join("");

        html += `<div class="lecture-card ${status} card-open" style="animation-delay:${idx * 0.04}s">
            <div class="card-toggle" onclick="toggleCard(this)">
                <div class="card-toggle-icon">${icon}</div>
                <div class="card-toggle-info">
                    <div class="card-toggle-title">${session.title}</div>
                </div>
                <div class="card-toggle-right">
                    <span class="lecture-date">${formatDate(session.date)}</span>
                    <span class="type-pill type-recording">🎬 ${session.recordings.length}</span>
                    <span class="card-chevron">▼</span>
                </div>
            </div>
            <div class="card-body">
                <ul class="files-list">${items}</ul>
            </div>
        </div>`;
        idx++;
    });

    container.innerHTML = html;
}

// =====================================================================
// RENDER — CONTENT VIEW (only content, grouped by source folder)
// =====================================================================
function renderContentView(data) {
    const container = document.getElementById("mainView");
    const withContent = data.filter(s => s.content && s.content.length > 0);
    if (withContent.length === 0) {
        container.innerHTML = `<div class="no-results">No content found.</div>`;
        return;
    }

    let html = `<div class="view-description">📁 All course materials, matched to sessions by recording date (±1 day)</div>`;
    let idx = 0;

    // Group by section
    const python = withContent.filter(s => s.section === "python");
    const lectures = withContent.filter(s => s.section === "lectures");

    function renderContentCards(items) {
        let out = "";
        items.forEach(session => {
            const status = getStatus(session.date);
            const icon = sectionIcon(session.section);

            out += `<div class="lecture-card ${status} card-open" style="animation-delay:${idx * 0.04}s">
                <div class="card-toggle" onclick="toggleCard(this)">
                    <div class="card-toggle-icon">${icon}</div>
                    <div class="card-toggle-info">
                        <div class="card-toggle-title">${session.title}</div>
                        ${session.desc ? `<div class="card-toggle-sub">${session.desc}</div>` : ""}
                    </div>
                    <div class="card-toggle-right">
                        <span class="lecture-date">${formatDate(session.date)}</span>
                        <span class="type-pill type-content">📁 ${session.content.length}</span>
                        <span class="card-chevron">▼</span>
                    </div>
                </div>
                <div class="card-body">
                    ${renderFolderGroupedFiles(session.content, session.date)}
                </div>
            </div>`;
            idx++;
        });
        return out;
    }

    if (python.length) {
        html += `<div class="section-header" data-section="c-python" onclick="toggleSection('c-python')">
            🐍 Python Content <span class="section-chevron">▼</span>
        </div>
        <div class="section-body" id="sec-c-python">${renderContentCards(python)}</div>`;
    }
    if (lectures.length) {
        html += `<div class="section-header" data-section="c-lectures" onclick="toggleSection('c-lectures')">
            🤖 AI Lectures Content <span class="section-chevron">▼</span>
        </div>
        <div class="section-body" id="sec-c-lectures">${renderContentCards(lectures)}</div>`;
    }

    container.innerHTML = html;
}

// =====================================================================
// SHARED RESOURCES
// =====================================================================
function renderSharedSection() {
    if (!SHARED || !SHARED.length) return "";
    const collapsed = localStorage.getItem("ai8_col_shared") === "1";
    const chips = SHARED.map(s => {
        const type = s.t || "link";
        return `<a class="shared-chip" href="${s.u}" target="_blank" rel="noopener">${fileIcon(type)} ${s.n} ${badgeFor(type)}</a>`;
    }).join("");
    return `<div class="section-header${collapsed ? " collapsed" : ""}" data-section="shared" onclick="toggleSection('shared')">
        📚 Shared Resources <span class="section-chevron">▼</span>
    </div>
    <div class="section-body${collapsed ? " collapsed" : ""}" id="sec-shared"><div class="shared-grid">${chips}</div></div>`;
}

// =====================================================================
// TOGGLE HELPERS
// =====================================================================
function toggleCard(el) {
    el.closest(".lecture-card").classList.toggle("card-open");
}

function toggleSection(id) {
    const header = document.querySelector(`.section-header[data-section="${id}"]`);
    const body = document.getElementById("sec-" + id);
    if (!header || !body) return;
    const isCollapsed = body.classList.toggle("collapsed");
    header.classList.toggle("collapsed", isCollapsed);
    localStorage.setItem("ai8_col_" + id, isCollapsed ? "1" : "0");
}

// =====================================================================
// VIEW SWITCHING
// =====================================================================
function switchView(view) {
    currentView = view;
    document.querySelectorAll(".view-btn").forEach(btn => {
        const isActive = btn.dataset.view === view;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive);
    });
    renderCurrentView();
}

function renderCurrentView(data) {
    const d = data || sessions;
    const query = document.getElementById("searchInput").value;
    const filtered = query ? filterData(d, query) : d;

    switch (currentView) {
        case "recordings": renderRecordingsView(filtered); break;
        case "content":    renderContentView(filtered); break;
        default:           renderTimeline(filtered); break;
    }
}

// =====================================================================
// FILTER
// =====================================================================
function filterData(data, query) {
    if (!query || !query.trim()) return data;
    const q = query.toLowerCase().trim();
    const filtered = [];

    for (const session of data) {
        const cardText = [session.title, session.desc, session.date, session.section].join(" ").toLowerCase();
        const cardMatch = cardText.includes(q);

        const matchedRec = (session.recordings || []).filter(f =>
            (f.n || f.name || "").toLowerCase().includes(q)
        );
        const matchedCon = (session.content || []).filter(f =>
            (f.n || f.name || "").toLowerCase().includes(q)
        );

        if (cardMatch || matchedRec.length > 0 || matchedCon.length > 0) {
            const clone = Object.assign({}, session);
            if (!cardMatch) {
                if (matchedRec.length > 0) clone.recordings = matchedRec;
                if (matchedCon.length > 0) clone.content = matchedCon;
            }
            clone._forceOpen = true;
            filtered.push(clone);
        }
    }
    return filtered;
}

function filterContent(query) {
    renderCurrentView(filterData(sessions, query));
}

// =====================================================================
// SYNC — CORS proxy chain
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
    try { const r = await fetch(url); if (r.ok) return await r.text(); } catch (_) {}
    return null;
}

// =====================================================================
// Drive embed parser
// =====================================================================
function parseEmbedHTML(html) {
    const files = new Map();
    const entryRe = /id="entry-([a-zA-Z0-9_-]+)"([\s\S]*?)(?=id="entry-|<\/div>\s*<\/div>\s*<\/body>|$)/gi;
    let m;
    while ((m = entryRe.exec(html)) !== null) {
        const id = m[1];
        const chunk = m[2];
        const titleMatch = chunk.match(/class="flip-entry-title"[^>]*>([^<]+)/);
        if (!titleMatch) continue;
        const name = titleMatch[1].trim();
        if (!name) continue;
        const isFolder = /folder/i.test(chunk.substring(0, 500));
        // Try to extract last-modified date from the embed HTML
        // The embed view may include "flip-entry-last-modified" or a date string
        let modified = "";
        const dateMatch = chunk.match(/class="flip-entry-last-modified"[^>]*>([^<]+)/);
        if (dateMatch) {
            modified = dateMatch[1].trim();
        } else {
            // Fallback: look for any date-like pattern (e.g. "Mar 17, 2026" or "2026-03-17")
            const datePattern = chunk.match(/(\w{3}\s+\d{1,2},\s*\d{4})/);
            if (datePattern) modified = datePattern[1].trim();
        }
        files.set(id, { id, name, isFolder, modified });
    }
    if (files.size === 0) {
        const simpleRe = /entry-([a-zA-Z0-9_-]+)[\s\S]*?flip-entry-title[^>]*>([^<]+)/gi;
        while ((m = simpleRe.exec(html)) !== null) {
            const id = m[1];
            const name = m[2].trim();
            if (name && !files.has(id)) files.set(id, { id, name, isFolder: false, modified: "" });
        }
    }
    return Array.from(files.values());
}

async function listFolderEmbed(folderId) {
    const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    const html = await proxyFetch(url);
    if (!html || html.length < 100 || html.includes('"error"')) return [];
    return parseEmbedHTML(html);
}

// =====================================================================
// Folder listing: Drive API v3 (if key set) → embed view fallback
// =====================================================================
async function listFolderDriveAPI(folderId) {
    if (!DRIVE_API_KEY) return null;
    const items = [];
    let pageToken = "";
    try {
        do {
            let url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=nextPageToken,files(id,name,mimeType,createdTime,modifiedTime)&pageSize=100&key=${DRIVE_API_KEY}`;
            if (pageToken) url += `&pageToken=${pageToken}`;
            const resp = await fetch(url);
            if (!resp.ok) return null;
            const data = await resp.json();
            if (data.files) items.push(...data.files);
            pageToken = data.nextPageToken || "";
        } while (pageToken);
    } catch (e) { return null; }
    return items.map(f => ({
        id: f.id,
        name: f.name,
        isFolder: f.mimeType === "application/vnd.google-apps.folder",
        created: f.createdTime || "",
        modified: f.modifiedTime || ""
    }));
}

async function listFolder(folderId, statusEl, label) {
    // Drive API (if key configured) — returns real dates
    if (DRIVE_API_KEY) {
        const items = await listFolderDriveAPI(folderId);
        if (items) return items;
    }
    // Apps Script (if URL configured) — returns real dates
    if (APPS_SCRIPT_URL) {
        try {
            const resp = await fetch(`${APPS_SCRIPT_URL}?action=list&recursive=1&folders=${folderId}`);
            if (resp.ok) {
                const data = await resp.json();
                if (data[folderId] && Array.isArray(data[folderId])) {
                    return data[folderId].map(item => ({
                        id: item.id, name: item.name,
                        isFolder: item.type === "folder",
                        created: item.created || "", modified: item.updated || ""
                    }));
                }
            }
        } catch (e) {}
    }
    // Embed view fallback — dates from HTML if available
    return (await listFolderEmbed(folderId)).map(item => ({
        ...item, created: "", modified: item.modified || ""
    }));
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
// Date extraction helpers
// =====================================================================
function extractDate(str) {
    // DD.MM.YY or DD.MM.YYYY or DD-MM-YY etc.
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

// Parse a human-readable date string (e.g. "Mar 17, 2026", "17 Mar 2026",
// "2026-03-17", "3/17/26") into YYYY-MM-DD. Used for Drive's modified date.
function parseModifiedDate(str) {
    if (!str) return null;
    const s = str.trim();

    // Already ISO-ish: 2026-03-17
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;

    // "Mar 17, 2026" or "March 17, 2026"
    const months = {jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
                    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"};
    m = s.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
    if (m) {
        const mon = months[m[1].substring(0,3).toLowerCase()];
        if (mon) return `${m[3]}-${mon}-${m[2].padStart(2,"0")}`;
    }

    // "17 Mar 2026"
    m = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (m) {
        const mon = months[m[2].substring(0,3).toLowerCase()];
        if (mon) return `${m[3]}-${mon}-${m[1].padStart(2,"0")}`;
    }

    // M/D/YY or M/D/YYYY
    m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) {
        let year = m[3]; if (year.length === 2) year = "20" + year;
        return `${year}-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}`;
    }

    // Fallback: try extractDate (DD.MM.YY patterns)
    return extractDate(s);
}

function extractLessonNum(str) {
    const m = str.match(/(?:lesson|class|lecture|tirgul|practice)[_\s-]*(\d+)/i);
    return m ? parseInt(m[1]) : null;
}

// Compute day difference between two YYYY-MM-DD strings
function dayDiff(dateA, dateB) {
    const a = new Date(dateA); a.setHours(0, 0, 0, 0);
    const b = new Date(dateB); b.setHours(0, 0, 0, 0);
    return Math.abs(a - b) / 86400000;
}

// Find a session whose date is closest to the given date.
// Prefers same section, then any section.
// Returns { session, exact, gap } — exact=true if ±1 day, gap=days distance.
function findClosestSession(merged, dateStr, section) {
    if (!dateStr || !merged.length) return { session: null, exact: false, gap: Infinity };

    // Pass 1: exact match (same date, same section)
    let match = merged.find(s => s.date === dateStr && s.section === section);
    if (match) return { session: match, exact: true, gap: 0 };
    match = merged.find(s => s.date === dateStr);
    if (match) return { session: match, exact: true, gap: 0 };

    // Pass 2: ±1 day, prefer same section
    let best = null;
    let bestDiff = Infinity;
    let bestSameSection = false;
    for (const s of merged) {
        const diff = dayDiff(s.date, dateStr);
        if (diff > 1) continue;
        const sameSection = s.section === section;
        const isBetter = !best
            || (sameSection && !bestSameSection)
            || (sameSection === bestSameSection && diff < bestDiff);
        if (isBetter) {
            best = s;
            bestDiff = diff;
            bestSameSection = sameSection;
        }
    }
    if (best) return { session: best, exact: true, gap: bestDiff };

    // Pass 3: closest session by date (any distance), prefer same section
    best = null; bestDiff = Infinity; bestSameSection = false;
    for (const s of merged) {
        if (s.section === "shared") continue;
        const diff = dayDiff(s.date, dateStr);
        const sameSection = s.section === section;
        const isBetter = !best
            || (sameSection && !bestSameSection)
            || (sameSection === bestSameSection && diff < bestDiff);
        if (isBetter) {
            best = s;
            bestDiff = diff;
            bestSameSection = sameSection;
        }
    }
    return { session: best, exact: false, gap: bestDiff };
}

// =====================================================================
// SYNC — main orchestrator
// Two-pass: 1) recordings from spreadsheet + recording folders
//           2) content from content folders, matched by upload date
// =====================================================================
async function syncAndRebuild() {
    const btn = document.getElementById("refreshBtn");
    const statusEl = document.getElementById("syncStatus");
    btn.classList.add("spinning");
    btn.disabled = true;
    statusEl.textContent = "⏳ Starting sync...";
    let newItems = 0;

    try {
        // Deep clone baseline sessions
        const merged = JSON.parse(JSON.stringify(SESSIONS));
        const existingDates = new Set(merged.map(s => s.date + "|" + s.section));

        // Known URLs to avoid duplicates
        const knownUrls = new Set();
        for (const s of merged) {
            for (const f of [...(s.recordings || []), ...(s.content || [])]) {
                if (f.u) knownUrls.add(f.u);
            }
        }

        // ---- PASS 1: Recordings (spreadsheet + recording folders) ----
        statusEl.textContent = "📋 Fetching recordings spreadsheet...";
        const sheetRows = await fetchSheetCSV();
        const sheetRecordings = sheetRows ? parseRecordings(sheetRows) : {};

        // Add spreadsheet recordings to existing sessions
        for (const s of merged) {
            const rec = sheetRecordings[s.date];
            if (!rec) continue;
            for (const url of rec.urls) {
                if (!knownUrls.has(url)) {
                    s.recordings.push({ n: "🎥 Zoom Recording", u: url, t: "video" });
                    knownUrls.add(url);
                    s._new = true;
                    newItems++;
                }
            }
        }

        // Create new sessions for dates in spreadsheet not in baseline
        for (const [dateKey, rec] of Object.entries(sheetRecordings)) {
            const key = dateKey + "|" + (rec.section || "lectures");
            if (existingDates.has(key)) continue;
            const label = rec.label || "Session";
            merged.push({
                date: dateKey,
                title: `${label} — ${dateKey.split("-").reverse().join(".")}`,
                section: rec.section || "lectures",
                desc: "Discovered during sync",
                _new: true,
                recordings: rec.urls.map(u => ({ n: "🎥 Zoom Recording", u, t: "video" })),
                content: []
            });
            existingDates.add(key);
            newItems += rec.urls.length;
        }

        // Crawl recording folders
        let foldersDone = 0;
        for (const folder of RECORDING_FOLDERS) {
            foldersDone++;
            statusEl.textContent = `🎬 Scanning recordings ${foldersDone}/${RECORDING_FOLDERS.length}...`;
            const items = await listFolder(folder.id, statusEl, folder.label);
            for (const item of items) {
                if (item.isFolder) continue;
                const fileUrl = V + item.id + "/view";
                if (knownUrls.has(fileUrl)) continue;
                knownUrls.add(fileUrl);

                const dateFromName = extractDate(item.name);
                const { session } = dateFromName
                    ? findClosestSession(merged, dateFromName, folder.section)
                    : { session: null };

                const recEntry = {
                    n: item.name, u: fileUrl, t: guessFileType(item.name),
                    _uploadDate: item.modified || "", _dateFromName: dateFromName || "",
                    _created: item.created || ""
                };

                if (session) {
                    session.recordings.push(recEntry);
                    session._new = true;
                } else {
                    // Attach to most recent session in section
                    const candidates = merged.filter(s => s.section === folder.section);
                    if (candidates.length > 0) {
                        const last = candidates[candidates.length - 1];
                        last.recordings.push(recEntry);
                        last._new = true;
                    }
                }
                newItems++;
            }
        }

        // ---- PASS 2: Content folders — match to sessions using file modified date ----
        // Primary: file modified date from Drive. Fallback: date in filename.
        // ±1 day = exact match. 2–7 days = approximate (*). >7 days = unmatched.
        foldersDone = 0;
        const unmatchedContent = [];
        const APPROX_MAX_DAYS = 7; // beyond this → unmatched

        for (const folder of CONTENT_FOLDERS) {
            foldersDone++;
            statusEl.textContent = `📁 Scanning content ${foldersDone}/${CONTENT_FOLDERS.length}...`;

            async function crawlContent(folderId, folderPath, section, depth) {
                if (depth > 2) return;
                const items = await listFolder(folderId, statusEl, folderPath);
                for (const item of items) {
                    const fileUrl = item.isFolder ? (D + item.id) : (V + item.id + "/view");
                    if (knownUrls.has(fileUrl)) continue;
                    knownUrls.add(fileUrl);

                    if (item.isFolder) {
                        const subPath = folderPath ? folderPath + " / " + item.name : item.name;
                        await crawlContent(item.id, subPath, section, depth + 1);
                        continue;
                    }

                    const type = guessFileType(item.name);
                    const modifiedDate = parseModifiedDate(item.modified);
                    const createdDate = parseModifiedDate(item.created);
                    const dateFromName = extractDate(item.name) || extractDate(folderPath);

                    // Try matching: created → modified → filename date (best gap wins)
                    let result = { session: null, exact: false, gap: Infinity };

                    if (createdDate) {
                        result = findClosestSession(merged, createdDate, section);
                    }
                    if ((!result.session || !result.exact) && modifiedDate) {
                        const r2 = findClosestSession(merged, modifiedDate, section);
                        if (!result.session || r2.gap < result.gap) result = r2;
                    }
                    if ((!result.session || !result.exact) && dateFromName) {
                        const r3 = findClosestSession(merged, dateFromName, section);
                        if (!result.session || r3.gap < result.gap) result = r3;
                    }

                    // No date at all — attach to last session in section (approx)
                    if (!result.session) {
                        const candidates = merged.filter(s => s.section === section);
                        if (candidates.length > 0) {
                            result = { session: candidates[candidates.length - 1], exact: false, gap: Infinity };
                        }
                    }

                    const isApprox = !result.exact;
                    const isExtreme = isApprox && result.gap > APPROX_MAX_DAYS;

                    const fileEntry = {
                        n: item.name, u: fileUrl, t: type, _folder: folderPath,
                        _uploadDate: item.modified || "", _dateFromName: dateFromName || "",
                        _modifiedISO: modifiedDate || "",
                        _created: item.created || "", _createdISO: createdDate || "",
                        _approx: isApprox && !isExtreme,
                        _gap: Math.round(result.gap)
                    };

                    if (isExtreme || !result.session) {
                        fileEntry._approx = false;
                        unmatchedContent.push(fileEntry);
                        newItems++;
                    } else {
                        result.session.content.push(fileEntry);
                        result.session._new = true;
                        newItems++;
                    }
                }
            }

            await crawlContent(folder.id, folder.label, folder.section, 0);
        }

        // Unmatched bucket for extreme date misalignments (>7 days from any session)
        if (unmatchedContent.length > 0) {
            merged.push({
                date: "",
                title: "📦 Unmatched Content",
                section: "shared",
                desc: `${unmatchedContent.length} file(s) with modified/upload dates more than 7 days from any session`,
                _new: true,
                _isUnmatched: true,
                recordings: [],
                content: unmatchedContent
            });
        }

        // Sort by date (empty dates = unmatched → sort last)
        merged.sort((a, b) => {
            const da = a.date || "9999-12-31";
            const db = b.date || "9999-12-31";
            return da.localeCompare(db);
        });

        // Auto-generate descriptions from content filenames
        for (const s of merged) {
            if (s._isUnmatched) continue;
            const topics = extractTopics(s.content);
            if (topics.length > 0 && (!s.desc || s.desc === "Discovered during sync")) {
                s.desc = topics.join(", ");
            }
        }

        sessions = merged;
        saveCache(sessions);
        renderCurrentView();
        updateTimestamp();

        // Success
        btn.classList.remove("spinning");
        btn.classList.add("success");
        const totalRec = merged.reduce((s, d) => s + d.recordings.length, 0);
        const totalCon = merged.reduce((s, d) => s + d.content.length, 0);
        statusEl.textContent = `✅ ${merged.length} sessions · ${totalRec} recordings · ${totalCon} content files`;
        showToast(`Synced — ${merged.length} sessions, ${newItems} new items`);
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
        const fc = localStorage.getItem("ai8_fc_v2") || "0";
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
// DISCLAIMER MODAL
// =====================================================================
let disclaimerAccepted = false;
let pendingUrl = null;

function initDisclaimer() {
    const modal = document.getElementById("disclaimerModal");
    const acceptBtn = document.getElementById("disclaimerAccept");
    const declineBtn = document.getElementById("disclaimerDecline");

    if (sessionStorage.getItem("ai8_terms") === "1") {
        disclaimerAccepted = true;
    }

    document.addEventListener("click", function (e) {
        const link = e.target.closest('a[target="_blank"]');
        if (!link) return;
        if (disclaimerAccepted) return;
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

    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            pendingUrl = null;
            modal.classList.remove("visible");
        }
    });
}

// =====================================================================
// SETTINGS MODAL
// =====================================================================
function initSettings() {
    const modal = document.getElementById("settingsModal");
    const input = document.getElementById("driveKeyInput");
    const saveBtn = document.getElementById("saveKeyBtn");
    const clearBtn = document.getElementById("clearKeyBtn");
    const closeBtn = document.getElementById("closeSettingsBtn");
    const status = document.getElementById("keyStatus");
    const toggleBtn = document.getElementById("settingsToggle");

    // Show current key (masked)
    function showKeyStatus() {
        const key = localStorage.getItem("ai8_drive_key");
        if (key) {
            input.value = key;
            status.textContent = "✅ Key saved in this browser";
            status.style.color = "var(--green)";
        } else {
            input.value = "";
            status.textContent = "No key set — file dates won't be available during sync";
            status.style.color = "var(--text-muted)";
        }
    }

    toggleBtn.addEventListener("click", () => {
        showKeyStatus();
        modal.classList.add("visible");
    });

    saveBtn.addEventListener("click", async () => {
        const key = input.value.trim();
        if (!key) { status.textContent = "Please enter a key"; status.style.color = "var(--red)"; return; }

        // Quick validation: try a test request
        status.textContent = "⏳ Testing key...";
        status.style.color = "var(--text-muted)";
        try {
            const resp = await fetch(`https://www.googleapis.com/drive/v3/files?q='15xNmQQEWxHzJgmP9RPUac9h1pC8Z9YyF'+in+parents&pageSize=1&fields=files(id)&key=${key}`);
            if (resp.ok) {
                localStorage.setItem("ai8_drive_key", key);
                status.textContent = "✅ Key works! Saved. Sync will now fetch file dates.";
                status.style.color = "var(--green)";
                // Reload DRIVE_API_KEY
                window.location.reload();
            } else {
                const err = await resp.json();
                status.textContent = "❌ " + (err.error?.message || "Invalid key");
                status.style.color = "var(--red)";
            }
        } catch (e) {
            status.textContent = "❌ Network error: " + e.message;
            status.style.color = "var(--red)";
        }
    });

    clearBtn.addEventListener("click", () => {
        localStorage.removeItem("ai8_drive_key");
        input.value = "";
        status.textContent = "Key removed";
        status.style.color = "var(--text-muted)";
    });

    closeBtn.addEventListener("click", () => modal.classList.remove("visible"));
    modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("visible"); });
}

// =====================================================================
// INIT
// =====================================================================
function init() {
    initTheme();
    initDisclaimer();
    initSettings();

    // Load from cache or use baseline
    const cached = loadCache();
    if (cached && cached.length) {
        sessions = cached;
    } else {
        sessions = JSON.parse(JSON.stringify(SESSIONS));
        // Stamp baseline content files with session date as their created date
        for (const s of sessions) {
            for (const f of (s.content || [])) {
                if (!f._created) f._created = s.date;
                if (!f._uploadDate) f._uploadDate = s.date;
            }
            // Auto-generate description from content filenames if missing
            const topics = extractTopics(s.content);
            if (topics.length > 0 && !s.desc) {
                s.desc = topics.join(", ");
            }
        }
    }
    renderCurrentView();
    updateTimestamp();

    // Wire search
    document.getElementById("searchInput").addEventListener("input", e => {
        const q = e.target.value;
        renderCurrentView(q ? filterData(sessions, q) : sessions);
    });

    // Wire view toggle buttons
    document.querySelectorAll(".view-btn").forEach(btn => {
        btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    // Wire sync button
    document.getElementById("refreshBtn").addEventListener("click", syncAndRebuild);
}

document.addEventListener("DOMContentLoaded", init);
