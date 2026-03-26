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
  var recursive = (e.parameter.recursive || "0") === "1";
  var result = {};

  function scanFolder(fid, depth) {
    if (depth > 3) return [];
    try {
      var folder = DriveApp.getFolderById(fid);
      var items = [];

      var files = folder.getFiles();
      while (files.hasNext()) {
        var f = files.next();
        items.push({
          name: f.getName(),
          id: f.getId(),
          type: f.getMimeType(),
          url: f.getUrl(),
          size: f.getSize(),
          created: f.getDateCreated().toISOString(),
          updated: f.getLastUpdated().toISOString(),
          folder: folder.getName(),
          folderId: fid
        });
      }

      var subs = folder.getFolders();
      while (subs.hasNext()) {
        var sf = subs.next();
        items.push({
          name: sf.getName(),
          id: sf.getId(),
          type: "folder",
          url: sf.getUrl(),
          created: sf.getDateCreated().toISOString(),
          updated: sf.getLastUpdated().toISOString(),
          folder: folder.getName(),
          folderId: fid
        });
        if (recursive) {
          var subItems = scanFolder(sf.getId(), depth + 1);
          items = items.concat(subItems);
        }
      }
      return items;
    } catch (err) {
      return [{ error: err.message, folderId: fid }];
    }
  }

  for (var i = 0; i < folderIds.length; i++) {
    var fid = folderIds[i].trim();
    result[fid] = scanFolder(fid, 0);
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
