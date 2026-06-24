// apps-script.gs — paste this into Google Apps Script (Extensions > Apps Script)
// Deploy as: Web App  |  Execute as: Me  |  Who has access: Anyone
//
// NOTE: Apps Script always redirects incoming requests (302), which causes
// browsers to convert POST to GET. So we use GET for both reads and writes,
// distinguished by the ?action=write parameter.

function doGet(e) {
  const sheet = _getSheet();

  // Write mode: ?action=write&data=<url-encoded-json>
  if (e.parameter && e.parameter.action === 'write') {
    const raw = e.parameter.data;
    try { JSON.parse(raw); } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Invalid JSON' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    sheet.getRange('A1').setValue(raw);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Read mode: no params → return current data
  const val = sheet.getRange('A1').getValue();
  return ContentService
    .createTextOutput(val || '{}')
    .setMimeType(ContentService.MimeType.JSON);
}

function _getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('SyncData') || ss.insertSheet('SyncData');
}

// Run this once from the script editor to initialise the sheet
function initSheet() {
  const sheet = _getSheet();
  if (!sheet.getRange('A1').getValue()) sheet.getRange('A1').setValue('{}');
  Logger.log('SyncData sheet ready.');
}
