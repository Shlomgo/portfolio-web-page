/* Approved financing scenarios for property pages that opt in.
   Property assumptions and the default scenario continue to come from Worksheet.
   Additional scenarios come from the published Financing Scenarios tab, with
   a same-origin snapshot for when the published Google Sheet is unavailable. */
(() => {
  'use strict';
  if (document.body?.dataset?.financingScenarios !== 'true') return;

  const slug = String(document.body.dataset.propertySlug || '').trim();
  const section = document.querySelector('.std-financials');
  if (!slug || !section) return;

  const LIVE_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRj8OtOmCYZGVMYb1VSEgCmlVMcZC9b7Ie-Y_pPvcXzc1-D9ba_amLBxLFiDtXRfL0N7WCnVW-nZP45/pub?gid=2067891785&single=true&output=csv';
  const SNAPSHOT_CSV = '../../financing-scenarios.csv';
  const SCENARIOS = [
    { id: 'conventional-25', name: 'Conventional — 25% down' },
    { id: 'dscr-credit', name: 'DSCR — with credit score' },
    { id: 'dscr-foreign', name: 'DSCR — foreign national' }
  ];
  const FINANCIAL_FIELDS = ['downPayment', 'closingCosts', 'totalInvested', 'loanAmount', 'interestRate', 'mortgageType', 'mortgagePI', 'cashFlow', 'cashOnCash', 'principalPaydown', 'principalPct', 'leverage', 'modeledReturn'];
  const control = document.createElement('div');
  control.className = 'finance-scenario-choice';
  control.innerHTML = '<label for="financingScenarioSelect">Financing scenario</label>' +
    '<select id="financingScenarioSelect" aria-describedby="financingScenarioDisclaimer"></select>' +
    '<p class="finance-scenario-disclaimer" id="financingScenarioDisclaimer">Property assumptions come from the main Worksheet. Financing terms are modeled, not locked lender quotes.</p>' +
    '<p class="finance-scenario-feedback" id="financingScenarioFeedback" role="status" aria-live="polite"></p>';
  const label = section.querySelector('.section-label');
  if (!label) return;
  label.insertAdjacentElement('afterend', control);

  const style = document.createElement('style');
  style.textContent = '.finance-scenario-choice{border:1px solid var(--border);background:var(--surface);border-radius:3px;padding:16px 18px;margin:0 0 18px}' +
    '.finance-scenario-choice label{display:block;font:11px "IBM Plex Mono",monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:9px}' +
    '.finance-scenario-choice select{display:block;width:100%;max-width:520px;background:var(--surface2);border:1px solid var(--green-dim);border-radius:3px;padding:12px 13px;color:var(--text);font:14px "IBM Plex Mono",monospace;cursor:pointer}' +
    '.finance-scenario-choice select:focus-visible{outline:2px solid var(--green);outline-offset:3px}' +
    '.finance-scenario-choice select option{background:#191c22;color:#e9e6de}' +
    '.finance-scenario-disclaimer,.finance-scenario-feedback{font:12px/1.55 "IBM Plex Mono",monospace;color:var(--muted);margin:10px 0 0;max-width:760px}' +
    '.finance-scenario-feedback{color:var(--orange);margin-top:6px}.finance-scenario-feedback:empty{display:none}' +
    '@media(max-width:600px){.finance-scenario-choice{padding:13px}.finance-scenario-choice select{font-size:13px}}';
  document.head.appendChild(style);

  const select = control.querySelector('select');
  const disclaimer = control.querySelector('.finance-scenario-disclaimer');
  const feedback = control.querySelector('.finance-scenario-feedback');
  const rateItem = section.querySelector('[data-std-fin="interestRate"]')?.closest('.fin-item');
  const pointItem = document.createElement('div');
  pointItem.className = 'fin-item';
  pointItem.innerHTML = '<div class="fin-row"><span class="fin-label">Points <button type="button" class="info-btn" aria-label="More information about points" title="One point is 1% of the loan amount. Points are already included in closing costs, not added twice.">i</button></span><span class="fin-value" data-financing-points>—</span></div><div class="fin-note">Included in closing costs</div>';
  if (rateItem) rateItem.insertAdjacentElement('afterend', pointItem);
  const pointValue = pointItem.querySelector('[data-financing-points]');
  const noteClosing = section.querySelector('[data-std-note-wrap="closingCosts"]');
  const noteRate = section.querySelector('[data-std-note-wrap="interestRate"]');
  const operatingBar = section.querySelector('[data-std-return-segment="operating"]');
  const forecastBar = section.querySelector('[data-std-return-segment="forecast"]');

  let baselineRow = null;
  let baselineView = null;
  let snapshotScenarios = new Map();
  let selectedId = 'worksheet';
  let sourcePriority = 0;
  let sheetLive = false;

  const permitted = new Set(SCENARIOS.map(s => s.id));
  const incomingSelection = new URLSearchParams(location.search).get('financing');
  if (permitted.has(incomingSelection)) selectedId = incomingSelection;

  function number(value) {
    if (value === undefined || value === null || String(value).trim() === '') return NaN;
    const text = String(value).trim();
    const negative = /^\(.*\)$/.test(text);
    const n = Number(text.replace(/[()%,$\sx]/gi, '').replace(/,/g, ''));
    return Number.isFinite(n) ? (negative ? -n : n) : NaN;
  }
  function money(n, suffix) {
    return Number.isFinite(n) ? (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', {maximumFractionDigits:0}) + (suffix || '') : '—';
  }
  function pct(n, digits) {
    return Number.isFinite(n) ? n.toFixed(digits) + '%' : '—';
  }
  function csvParse(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') quoted = false;
        else field += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
    if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
    if (!rows.length) return [];
    const headers = rows[0].map(v => String(v).trim());
    if (!headers.includes('Property Page Slug') || !headers.includes('Validation / website eligibility')) throw new Error('Unexpected financing data format');
    return rows.slice(1).map(values => Object.fromEntries(headers.map((head, i) => [head, values[i] || ''])));
  }
  function scenarioIsValid(row) {
    if (!row || row['Property Page Slug'] !== slug || row.Status !== 'Approved' || row['Validation / website eligibility'] !== 'READY') return false;
    const numericFields = ['Down payment %', 'Interest rate %', 'Points %', 'Purchase price · Worksheet', 'Market rent · Worksheet', 'Vacancy-adjusted rent · Worksheet', 'Taxes/year · Worksheet', 'Insurance/year · Worksheet', 'HOA/year · Worksheet', 'Capex · Worksheet', 'Down payment $', 'Loan amount', 'Points cost $', 'Total closing costs', 'Total cash invested', 'Mortgage P&I/month', 'Net cash flow/month', 'Cash-on-cash return/year', 'Principal paid/month — year 1', 'Principal return/year', 'Modeled total return/year'];
    return numericFields.every(key => Number.isFinite(number(row[key]))) && number(row['Total cash invested']) > 0 && number(row['Down payment %']) > 0 && number(row['Down payment %']) < 100;
  }
  function matchesCurrentProperty(scenario) {
    if (!baselineRow) return true;
    const pairs = [
      ['Purchase Price', 'Purchase price · Worksheet'],
      ['Rent', 'Market rent · Worksheet'],
      ['Avg Rent considering avg vacancy (month)', 'Vacancy-adjusted rent · Worksheet'],
      ['Taxes/y', 'Taxes/year · Worksheet'],
      ['Insurance/y', 'Insurance/year · Worksheet'],
      ['HOA/y', 'HOA/year · Worksheet'],
      ['Capex', 'Capex · Worksheet']
    ];
    return pairs.every(([key, alt]) => Math.abs(number(baselineRow[key]) - number(scenario[alt])) < .02);
  }
  function findApprovedScenarios(rows) {
    const options = new Map();
    for (const config of SCENARIOS) {
      const matching = rows.filter(row => row['Scenario label']?.trim() === config.name && row['Property Page Slug']?.trim() === slug);
      if (matching.length === 1 && scenarioIsValid(matching[0])) options.set(config.id, matching[0]);
    }
    return options;
  }
  function updateChoices() {
    const current = selectedId;
    select.replaceChildren();
    const choices = [{id:'worksheet', name: 'Conventional — 20% down (primary Worksheet)'}, ...SCENARIOS];
    for (const item of choices) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      option.disabled = item.id !== 'worksheet' && (!snapshotScenarios.has(item.id) || !matchesCurrentProperty(snapshotScenarios.get(item.id)));
      select.appendChild(option);
    }
    if (current !== 'worksheet' && snapshotScenarios.has(current) && matchesCurrentProperty(snapshotScenarios.get(current))) selectedId = current;
    else if (current !== 'worksheet' && baselineRow && sourcePriority > 0) selectedId = 'worksheet';
    select.value = selectedId;
    select.disabled = sourcePriority === 0;
  }
  function cacheBaselineDisplay() {
    const values = {};
    for (const field of FINANCIAL_FIELDS) values[field] = section.querySelector('[data-std-fin="' + field + '"]')?.textContent ?? '';
    baselineView = {
      values,
      closing: noteClosing?.innerHTML || '',
      rate: noteRate?.innerHTML || '',
      operating: operatingBar?.style.width || '',
      forecast: forecastBar?.style.width || ''
    };
  }
  function setFinancialField(key, value) {
    section.querySelectorAll('[data-std-fin="' + key + '"]').forEach(el => { el.textContent = value; });
  }
  function paintBaseline() {
    if (!baselineRow || !baselineView) return;
    for (const [field, value] of Object.entries(baselineView.values)) setFinancialField(field, value);
    if (noteClosing) noteClosing.innerHTML = baselineView.closing;
    if (noteRate) noteRate.innerHTML = baselineView.rate;
    if (operatingBar) operatingBar.style.width = baselineView.operating;
    if (forecastBar) forecastBar.style.width = baselineView.forecast;
    const loan = number(baselineRow['Purchase Price']) - number(baselineRow['Down Payment']);
    const points = number(baselineRow.Points);
    pointValue.textContent = pct(points, 2) + ' (' + money(loan * points / 100) + ')';
    disclaimer.textContent = 'Primary financing from the main Worksheet. These are underwriting assumptions, not locked lender terms.';
    feedback.textContent = '';
  }
  function paintAlternative(row) {
    if (!baselineRow || !baselineView) return;
    if (!row || !matchesCurrentProperty(row)) {
      selectedId = 'worksheet';
      updateChoices();
      paintBaseline();
      feedback.textContent = 'Alternate scenario unavailable while spreadsheet data synchronizes. Showing the primary financing.';
      return;
    }
    const cost = number(row['Total closing costs']);
    const down = number(row['Down payment $']);
    const price = number(baselineRow['Purchase Price']);
    const invested = number(row['Total cash invested']);
    const cashOnCash = number(row['Cash-on-cash return/year']);
    const principalPct = number(row['Principal return/year']);
    const totalReturn = number(row['Modeled total return/year']);
    const fields = {
      downPayment: pct(number(row['Down payment %']), 0) + ' × ' + money(price) + ' = ' + money(down),
      closingCosts: money(cost),
      totalInvested: money(invested),
      loanAmount: money(number(row['Loan amount'])),
      interestRate: pct(number(row['Interest rate %']), 2),
      mortgageType: row['Mortgage type'] || '—',
      mortgagePI: money(number(row['Mortgage P&I/month']), '/mo'),
      cashFlow: money(number(row['Net cash flow/month']), '/mo'),
      cashOnCash: pct(cashOnCash, 1),
      principalPaydown: money(number(row['Principal paid/month — year 1']), '/mo'),
      principalPct: pct(principalPct, 1),
      leverage: 'x' + (price / invested).toFixed(1),
      modeledReturn: pct(totalReturn, 1)
    };
    for (const [field, value] of Object.entries(fields)) setFinancialField(field, value);
    const points = number(row['Points %']);
    pointValue.textContent = pct(points, 2) + ' (' + money(number(row['Points cost $'])) + ')';
    if (noteClosing) noteClosing.innerHTML = '<div class="fin-note">Includes ' + pointValue.textContent + ' in points (not an additional charge).</div>';
    if (noteRate) noteRate.innerHTML = '<div class="fin-note">Modeled underwriting rate; not a locked rate.</div>';
    const operatingReturn = cashOnCash + principalPct;
    const split = totalReturn > 0 ? Math.max(0, Math.min(100, operatingReturn / totalReturn * 100)) : 50;
    if (operatingBar) operatingBar.style.width = split.toFixed(2) + '%';
    if (forecastBar) forecastBar.style.width = (100 - split).toFixed(2) + '%';
    disclaimer.textContent = 'Modeled financing, not a lender quote. Property assumptions come from the main Worksheet; other lender-specific fees may differ. Modeled total return retains the Worksheet’s appreciation/leverage convention (not an IRR).';
    feedback.textContent = sheetLive ? '' : 'Showing the last synchronized financing scenario from Google Sheets.';
  }
  function renderSelected() {
    if (selectedId === 'worksheet') paintBaseline();
    else paintAlternative(snapshotScenarios.get(selectedId));
  }
  function updateAddress() {
    const url = new URL(location.href);
    if (selectedId === 'worksheet') url.searchParams.delete('financing');
    else url.searchParams.set('financing', selectedId);
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }
  select.addEventListener('change', () => {
    selectedId = select.value;
    renderSelected();
    updateAddress();
  });
  document.addEventListener('openbook:financial-baseline-updated', event => {
    if (event.detail?.slug !== slug) return;
    baselineRow = event.detail.row;
    cacheBaselineDisplay();
    updateChoices();
    renderSelected();
  });
  updateChoices();
  feedback.textContent = 'Loading approved financing scenarios…';

  async function fetchScenarios(url) {
    const response = await fetch(url + (url.includes('?') ? '&' : '?') + '_fresh=' + Date.now(), {cache:'no-store', credentials:'omit'});
    if (!response.ok) throw new Error('Financing feed returned ' + response.status);
    const parsed = csvParse(await response.text());
    if (!parsed.some(row => row['Property Page Slug'] === slug)) throw new Error('Financing feed does not contain this property');
    return findApprovedScenarios(parsed);
  }
  function acceptScenarios(options, priority, live) {
    if (!options.size || priority < sourcePriority) return;
    snapshotScenarios = options;
    sourcePriority = priority;
    sheetLive = live;
    updateChoices();
    renderSelected();
    if (!baselineRow) feedback.textContent = 'Loading current property underwriting…';
  }
  const snapshot = fetchScenarios(SNAPSHOT_CSV)
    .then(options => acceptScenarios(options, 1, false))
    .catch(err => console.warn('Financing scenario snapshot unavailable:', err));
  const live = fetchScenarios(LIVE_CSV)
    .then(options => acceptScenarios(options, 2, true))
    .catch(err => console.warn('Published financing scenario tab unavailable or not yet synchronized:', err));
  Promise.allSettled([snapshot, live]).then(() => {
    if (!sourcePriority) {
      feedback.textContent = 'Alternative financing data is temporarily unavailable. The primary Worksheet figures are unchanged.';
    }
  });
})();