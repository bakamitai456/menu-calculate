// apps-script.gs — paste this into Google Apps Script (Extensions > Apps Script)
// Deploy as: Web App  |  Execute as: Me  |  Who has access: Anyone

function doGet() {
  const sheet = _getSheet();
  const val = sheet.getRange('A1').getValue();
  return ContentService
    .createTextOutput(val || '{}')
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = _getSheet();
  const body = e.postData.contents;
  try { JSON.parse(body); } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  sheet.getRange('A1').setValue(body);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
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
