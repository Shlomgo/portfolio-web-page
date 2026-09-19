/**
 * Open Book spreadsheet -> GitHub sync
 *
 * Behavior:
 * - Watches edits on the "Worksheet" tab.
 * - Every edit resets a four-minute inactivity timer.
 * - Four minutes after the last edit, dispatches the GitHub workflow once.
 *
 * One-time setup:
 * 1. Create a fine-grained GitHub token restricted to Shlomgo/portfolio-web-page
 *    with Actions: Read and write.
 * 2. Open Portfolio stats -> Extensions -> Apps Script.
 * 3. Paste this file into Code.gs.
 * 4. Run installOpenBookSync() once and paste the token when prompted.
 */

const OPEN_BOOK_SYNC = Object.freeze({
  sheetName: 'Worksheet',
  debounceMs: 4 * 60 * 1000,
  owner: 'Shlomgo',
  repo: 'portfolio-web-page',
  workflow: 'sync-property-data.yml',
  ref: 'main',
  tokenProperty: 'OPEN_BOOK_GITHUB_TOKEN',
  lastEditProperty: 'OPEN_BOOK_LAST_EDIT_MS',
  editHandler: 'scheduleOpenBookSync',
  syncHandler: 'runOpenBookSync',
});

function installOpenBookSync() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Open Book GitHub token',
    'Paste a fine-grained GitHub token restricted to Shlomgo/portfolio-web-page with Actions: Read and write. The token will be stored in Apps Script Properties, not in the spreadsheet.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const token = response.getResponseText().trim();
  if (!token) {
    ui.alert('No token was entered. Nothing was installed.');
    return;
  }

  PropertiesService.getScriptProperties().setProperty(
    OPEN_BOOK_SYNC.tokenProperty,
    token
  );

  removeTriggersByHandler_(OPEN_BOOK_SYNC.editHandler);
  removeTriggersByHandler_(OPEN_BOOK_SYNC.syncHandler);

  ScriptApp.newTrigger(OPEN_BOOK_SYNC.editHandler)
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  ui.alert(
    'Open Book sync installed. Edits on the Worksheet tab will trigger one GitHub refresh four minutes after your last edit.'
  );
}

function scheduleOpenBookSync(e) {
  if (!e || !e.range) return;
  if (e.range.getSheet().getName() !== OPEN_BOOK_SYNC.sheetName) return;

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    PropertiesService.getScriptProperties().setProperty(
      OPEN_BOOK_SYNC.lastEditProperty,
      String(Date.now())
    );

    removeTriggersByHandler_(OPEN_BOOK_SYNC.syncHandler);

    ScriptApp.newTrigger(OPEN_BOOK_SYNC.syncHandler)
      .timeBased()
      .after(OPEN_BOOK_SYNC.debounceMs)
      .create();
  } finally {
    lock.releaseLock();
  }
}

function runOpenBookSync() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    removeTriggersByHandler_(OPEN_BOOK_SYNC.syncHandler);

    const props = PropertiesService.getScriptProperties();
    const lastEditMs = Number(props.getProperty(OPEN_BOOK_SYNC.lastEditProperty) || 0);
    const elapsed = Date.now() - lastEditMs;
    const remaining = OPEN_BOOK_SYNC.debounceMs - elapsed;

    // Race-safety: if another edit happened while this trigger was waking up,
    // reschedule for the remainder rather than syncing too early.
    if (lastEditMs && remaining > 5000) {
      ScriptApp.newTrigger(OPEN_BOOK_SYNC.syncHandler)
        .timeBased()
        .after(remaining)
        .create();
      return;
    }

    const token = props.getProperty(OPEN_BOOK_SYNC.tokenProperty);
    if (!token) {
      throw new Error(
        'Missing GitHub token. Run installOpenBookSync() again.'
      );
    }

    const url =
      'https://api.github.com/repos/' +
      encodeURIComponent(OPEN_BOOK_SYNC.owner) + '/' +
      encodeURIComponent(OPEN_BOOK_SYNC.repo) +
      '/actions/workflows/' +
      encodeURIComponent(OPEN_BOOK_SYNC.workflow) +
      '/dispatches';

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      payload: JSON.stringify({ ref: OPEN_BOOK_SYNC.ref }),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    if (code !== 204) {
      throw new Error(
        'GitHub workflow dispatch failed (' +
        code +
        '): ' +
        response.getContentText()
      );
    }

    props.deleteProperty(OPEN_BOOK_SYNC.lastEditProperty);
  } finally {
    lock.releaseLock();
  }
}

function removeOpenBookSync() {
  removeTriggersByHandler_(OPEN_BOOK_SYNC.editHandler);
  removeTriggersByHandler_(OPEN_BOOK_SYNC.syncHandler);
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty(OPEN_BOOK_SYNC.lastEditProperty);
}

function removeTriggersByHandler_(handlerName) {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === handlerName)
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
}
