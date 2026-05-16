// ============================================================
// 3JES Install - Google Apps Script
//
// HOW TO USE:
// 1. Open your Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Replace ALL existing code with this file's contents
// 4. Click Deploy > New Deployment
// 5. Type: Web app
// 6. Execute as: Me
// 7. Who has access: Anyone
// 8. Click Deploy and copy the Web App URL
//
// IMPORTANT: Every time you edit this script, you must create
// a NEW deployment — editing an existing one does NOT update
// the live Web App URL.
// ============================================================

/**
 * Finds the header row by scanning rows for known column names.
 * Returns the index of the header row, or 0 as fallback.
 */
function findHeaderRow(data) {
  var headerKeywords = ['SUBSCRIBER', 'ACCOUNT', 'DATE INSTALLED', 'NO.', 'AGENT', 'USERNAME', 'PASSWORD', 'ROLE', 'DATE CREATED', 'GCASH', 'MODEM SERIES', 'INSTALLER'];
  for (var i = 0; i < Math.min(10, data.length); i++) {
    var row = data[i];
    var rowText = row.join(' ').toUpperCase();
    var matchCount = 0;
    for (var k = 0; k < headerKeywords.length; k++) {
      if (rowText.indexOf(headerKeywords[k]) !== -1) matchCount++;
    }
    if (matchCount >= 2) return i;
  }
  return 0;
}

/**
 * Handles GET requests — reads rows from a sheet.
 * Usage: ?sheet=SHEET_NAME
 * Auto-detects the header row (skips title/merged rows at top).
 */
function doGet(e) {
  try {
    var sheetName = e.parameter.sheet || 'Sheet1';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Sheet not found: ' + sheetName })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Auto-detect header row (skip title rows with merged cells)
    var headerRowIndex = findHeaderRow(data);
    
    // Normalize headers: replace newlines with spaces, collapse multiple spaces, trim
    var headers = data[headerRowIndex].map(function(h) {
      return String(h).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    });
    
    // Filter out empty headers but keep their positions
    var validColumns = [];
    for (var i = 0; i < headers.length; i++) {
      if (headers[i] !== '') {
        validColumns.push({ index: i, name: headers[i] });
      }
    }

    var rows = [];
    for (var r = headerRowIndex + 1; r < data.length; r++) {
      var row = data[r];
      var obj = {};
      var hasData = false;
      for (var c = 0; c < validColumns.length; c++) {
        var col = validColumns[c];
        var value = row[col.index] !== undefined && row[col.index] !== null ? row[col.index] : '';
        obj[col.name] = String(value);
        if (String(value).trim() !== '') hasData = true;
      }
      if (hasData) rows.push(obj);
    }

    return ContentService.createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles POST requests — write operations (append / update / delete).
 *
 * Request body (JSON):
 *   { action: 'append', sheet: 'SHEET_NAME', row: { col1: val1, col2: val2, ... } }
 *   { action: 'update', sheet: 'SHEET_NAME', keyColumn: 'id', keyValue: '123', row: { col1: newVal } }
 *   { action: 'delete', sheet: 'SHEET_NAME', keyColumn: 'id', keyValue: '123' }
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheetName = payload.sheet || e.parameter.sheet || 'Sheet1';
    var action = payload.action || 'append';

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Sheet not found: ' + sheetName })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    var headerRowIndex = findHeaderRow(data);
    var headers = data[headerRowIndex].map(function(h) {
      return String(h).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    });

    // ── APPEND: add a new row ──────────────────────────────────
    if (action === 'append') {
      var row = headers.map(function(h) {
        return payload.row[h] !== undefined ? payload.row[h] : '';
      });
      sheet.appendRow(row);
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, action: 'append' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // ── UPDATE: edit an existing row by matching a key column ──
    if (action === 'update') {
      var keyColumn = payload.keyColumn || 'id';
      var keyValue = payload.keyValue;
      var keyIndex = headers.indexOf(keyColumn);

      if (keyIndex === -1) {
        return ContentService.createTextOutput(
          JSON.stringify({ error: 'Key column not found: ' + keyColumn })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var allData = sheet.getDataRange().getValues();
      for (var i = headerRowIndex + 1; i < allData.length; i++) {
        if (String(allData[i][keyIndex]) === String(keyValue)) {
          headers.forEach(function(h, colIdx) {
            if (payload.row[h] !== undefined) {
              sheet.getRange(i + 1, colIdx + 1).setValue(payload.row[h]);
            }
          });
          return ContentService.createTextOutput(
            JSON.stringify({ success: true, action: 'update', rowIndex: i + 1 })
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }

      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Row not found for key: ' + keyValue })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // ── DELETE: remove a row by matching a key column ──────────
    if (action === 'delete') {
      var keyColumn = payload.keyColumn || 'id';
      var keyValue = payload.keyValue;
      var keyIndex = headers.indexOf(keyColumn);

      if (keyIndex === -1) {
        return ContentService.createTextOutput(
          JSON.stringify({ error: 'Key column not found: ' + keyColumn })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var allData = sheet.getDataRange().getValues();
      for (var i = headerRowIndex + 1; i < allData.length; i++) {
        if (String(allData[i][keyIndex]) === String(keyValue)) {
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput(
            JSON.stringify({ success: true, action: 'delete', rowIndex: i + 1 })
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }

      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Row not found for key: ' + keyValue })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Unknown action: ' + action })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}