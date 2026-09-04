/* Shared financial-data binder for individual property pages.
   Each page identifies its spreadsheet row with <body data-property-slug="...">.
   The source is the same published Google Sheet used by the main portfolio page. */
(() => {
  'use strict';

  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRj8OtOmCYZGVMYb1VSEgCmlVMcZC9b7Ie-Y_pPvcXzc1-D9ba_amLBxLFiDtXRfL0N7WCnVW-nZP45/pub?gid=0&single=true&output=csv';
  const slug = String(document.body?.dataset?.propertySlug || '').trim();
  const statusBox = document.getElementById('sheetDataStatus');

  function num(v){
    if(v === undefined || v === null) return NaN;
    const cleaned = String(v).replace(/[%,$\sx]/gi, '');
    return cleaned === '' ? NaN : Number(cleaned);
  }
  function money(n, suffix=''){
    return Number.isFinite(n) ? `$${Math.round(n).toLocaleString('en-US')}${suffix}` : '—';
  }
  function pct(n, suffix='%'){
    if(!Number.isFinite(n)) return '—';
    return `${n.toFixed(2).replace(/\.?0+$/, '')}${suffix}`;
  }
  function text(v){
    const s = String(v ?? '').trim();
    return s || '—';
  }
  function setValue(key, value){
    document.querySelectorAll(`[data-fin="${key}"]`).forEach(el => { el.textContent = value; });
  }
  function setNote(key, value){
    document.querySelectorAll(`[data-note="${key}"]`).forEach(el => { el.textContent = value; });
  }
  function firstValue(row, names){
    for(const name of names){
      if(row[name] !== undefined && String(row[name]).trim() !== '') return row[name];
    }
    return '';
  }

  function populate(row){
    const purchasePrice = num(row['Purchase Price']);
    const downPayment = num(row['Down Payment']);
    const closingCosts = num(row['Total Closing Costs']);
    const capex = num(row['Capex']);
    const totalInvested = num(row['Total Invested']);
    const loanFromSheet = num(firstValue(row, ['Loan Amount', 'Loan amount']));
    const loanAmount = Number.isFinite(loanFromSheet)
      ? loanFromSheet
      : (Number.isFinite(purchasePrice) && Number.isFinite(downPayment) ? purchasePrice - downPayment : NaN);
    const rate = num(row['Intrest rate']);
    const mortgageType = firstValue(row, ['Mortgage Type', 'Mortgage type', 'Loan Type', 'Loan type']);

    const baseRent = num(row['Rent']);
    const vacancyAdjustedRent = num(row['Avg Rent considering avg vacancy (month)']);
    const vacancyLoss = Number.isFinite(baseRent) && Number.isFinite(vacancyAdjustedRent)
      ? Math.max(0, baseRent - vacancyAdjustedRent)
      : NaN;
    const management = Number.isFinite(vacancyAdjustedRent) ? vacancyAdjustedRent * 0.10 : NaN;
    const mortgagePI = num(row['Mortgage P&I (month)']);
    const taxesY = num(row['Taxes/y']);
    const insuranceY = num(row['Insurance/y']);
    const hoaY = num(row['HOA/y']);

    const cashFlow = num(row['Cash remaining after management (month)']);
    const cashOnCash = num(row['Cash on Cash after management']);
    const principalPaydown = num(row['Principal returned (month)']);
    const principalPct = num(row['Principal returned % of invest']);
    const appreciationPct = num(row['appreciation expectations']);
    const leverage = Number.isFinite(purchasePrice) && Number.isFinite(totalInvested) && totalInvested > 0
      ? purchasePrice / totalInvested : NaN;
    const appreciationContribution = Number.isFinite(appreciationPct) && Number.isFinite(leverage)
      ? appreciationPct * leverage : NaN;
    const modeledReturn = [cashOnCash, principalPct, appreciationContribution].every(Number.isFinite)
      ? cashOnCash + principalPct + appreciationContribution : NaN;

    setValue('purchasePrice', money(purchasePrice));
    setValue('closingCosts', money(closingCosts));
    setValue('capex', Number.isFinite(capex) && capex === 0 ? 'None' : money(capex));
    setValue('totalInvested', money(totalInvested));
    setValue('downPayment', money(downPayment));
    setValue('loanAmount', money(loanAmount));
    setValue('interestRate', pct(rate));
    setValue('mortgageType', text(mortgageType));
    setValue('rentExpected', money(baseRent, '/mo'));
    setValue('vacancyLoss', money(vacancyLoss, '/mo'));
    setValue('management', money(management, '/mo'));
    setValue('mortgagePI', money(mortgagePI, '/mo'));
    setValue('propertyTaxes', Number.isFinite(taxesY) ? money(taxesY / 12, '/mo') : '—');
    setValue('insurance', Number.isFinite(insuranceY) ? money(insuranceY / 12, '/mo') : '—');
    setValue('hoa', Number.isFinite(hoaY) ? money(hoaY / 12, '/mo') : '—');
    setValue('cashFlow', money(cashFlow, '/mo'));
    setValue('cashOnCash', pct(cashOnCash));
    setValue('principalPaydown', money(principalPaydown, '/mo'));
    setValue('appreciation', Number.isFinite(appreciationPct) ? `${pct(appreciationPct)}/yr` : '—');
    setValue('modeledReturn', pct(modeledReturn));

    if(Number.isFinite(appreciationContribution)){
      document.querySelectorAll('[data-fin="appreciation"]').forEach(el => {
        el.title = `${pct(appreciationPct)} property-value assumption; approximately ${pct(appreciationContribution)} modeled return on total cash invested after effective leverage.`;
      });
    }

    const operating = Number.isFinite(cashOnCash) && Number.isFinite(principalPct) ? cashOnCash + principalPct : NaN;
    const total = Number.isFinite(operating) && Number.isFinite(appreciationContribution) ? operating + appreciationContribution : NaN;
    if(Number.isFinite(total) && total > 0){
      const operatingShare = Math.max(0, Math.min(100, operating / total * 100));
      const opSeg = document.querySelector('[data-return-segment="operating"]');
      const fcSeg = document.querySelector('[data-return-segment="forecast"]');
      if(opSeg) opSeg.style.width = `${operatingShare}%`;
      if(fcSeg) fcSeg.style.width = `${100 - operatingShare}%`;
    }

    setNote('purchasePrice', 'Current proposal price from the portfolio spreadsheet.');
    setNote('closingCosts', Number.isFinite(closingCosts) ? 'Current modeled closing costs.' : 'Not supplied in the spreadsheet yet.');
    setNote('capex', Number.isFinite(capex) ? (capex === 0 ? 'No initial capex currently modeled.' : 'Current initial capex assumption.') : 'Not supplied in the spreadsheet yet.');
    setNote('downPayment', Number.isFinite(downPayment) ? 'Current modeled cash down payment.' : 'Not supplied in the spreadsheet yet.');

    if(statusBox){
      statusBox.textContent = 'Underwriting synchronized with the portfolio spreadsheet.';
      statusBox.style.display = 'none';
    }
  }

  function showError(message){
    console.error(message);
    if(statusBox){
      statusBox.textContent = message;
      statusBox.style.display = 'block';
    }
  }

  if(!slug){ showError('This property page is missing its Property Page Slug.'); return; }
  if(!window.Papa){ showError('Could not load the spreadsheet parser. Refresh the page and try again.'); return; }

  Papa.parse(SHEET_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete(results){
      const row = results.data.find(r => String(r['Property Page Slug'] || '').trim() === slug);
      if(!row){
        showError(`No portfolio spreadsheet row was found for property slug “${slug}”.`);
        return;
      }
      populate(row);
    },
    error(err){
      console.error(err);
      showError('Could not load the current underwriting from the portfolio spreadsheet.');
    }
  });
})();
