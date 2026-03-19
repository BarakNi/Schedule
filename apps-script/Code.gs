/**
 * Google Apps Script — Drive Folder Lister for AI Engineer Course
 * 
 * DEPLOY INSTRUCTIONS:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file into Code.gs
 * 3. Click Deploy → New deployment
 * 4. Type: Web app
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Click Deploy → copy the URL
 * 8. Paste the URL into Schedule/js/data.js as APPS_SCRIPT_URL
 *
 * © 2026 The Hebrew University of Jerusalem. All rights reserved.
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "list";

  if (action === "list") {
    return listFolders(e);
  }
  if (action === "sheet") {
    return listSheet(e);
  }

  return jsonResponse({ error: "Unknown action" });
}

/**
 * List files in one or more Drive folders.
 * Usage: ?action=list&folders=FOLDER_ID_1,FOLDER_ID_2
 */
function listFolders(e) {
  var folderIds = (e.parameter.folders || "").split(",").filter(Boolean);
  var result = {};

  for (var i = 0; i < folderIds.length; i++) {
    var fid = folderIds[i].trim();
    try {
      var folder = DriveApp.getFolderById(fid);
      var files = folder.getFiles();
      var items = [];
      while (files.hasNext()) {
        var f = files.next();
        items.push({
          name: f.getName(),
          id: f.getId(),
          type: f.getMimeType(),
          url: f.getUrl(),
          size: f.getSize(),
          updated: f.getLastUpdated().toISOString()
        });
      }
      // Also list subfolders
      var subs = folder.getFolders();
      while (subs.hasNext()) {
        var sf = subs.next();
        items.push({
          name: sf.getName(),
          id: sf.getId(),
          type: "folder",
          url: sf.getUrl(),
          updated: sf.getLastUpdated().toISOString()
        });
      }
      result[fid] = items;
    } catch (err) {
      result[fid] = { error: err.message };
    }
  }

  return jsonResponse(result);
}

/**
 * Read the recordings spreadsheet.
 * Usage: ?action=sheet&id=SPREADSHEET_ID
 */
function listSheet(e) {
  var sheetId = e.parameter.id;
  if (!sheetId) return jsonResponse({ error: "Missing sheet id" });

  try {
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();
    return jsonResponse({ rows: data });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
