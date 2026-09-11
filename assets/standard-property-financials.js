/* Shared standardized financial renderer for every individual property page. */
(() => {
  'use strict';

  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRj8OtOmCYZGVMYb1VSEgCmlVMcZC9b7Ie-Y_pPvcXzc1-D9ba_amLBxLFiDtXRfL0N7WCnVW-nZP45/pub?gid=0&single=true&output=csv';

  const INFO = {
    purchasePrice: 'Sometimes firm, sometimes negotiable.',
    downPayment: 'The amount out of the total purchase price that you pay yourself and do not borrow from the lender.',
    closingCosts: 'The total of all costs to finalize the purchase and the loan, minus what the seller is willing to contribute to these costs as a negotiated incentive.',
    capex: 'Costs of improving the asset that the builder did not already include in the purchase price.',
    loanAmount: 'Purchase price minus down payment: what you are borrowing from the bank to pay for the home.',
    interestRate: 'The interest rate used in the current mortgage underwriting.',
    mortgageType: 'The most common mortgage type we use is a 30-year fixed conventional loan. It typically has the most attractive interest rates and fixes the monthly principal-and-interest payment so it does not change for as long as the loan is held, up to 30 years. DSCR loans are usually also fixed for 30 years; their rates are higher, and we typically use them when the borrower does not qualify for a conventional loan. With an ARM (Adjustable Rate Mortgage), the payment is fixed only for a certain number of years, after which the interest rate adjusts based on market rates and the loan terms.',
    rentExpected: 'When the goal is to have it rented in 30 days, this is the best informed guess I can give. It may turn out to be up to $100 higher or lower. Larger variations can happen but are rare.',
    vacancyLoss: 'When using 3.2%, which is the vacancy rate for this entire portfolio, this is the amount of rent loss when it is spread out as if just a bit is lost every month.',
    management: 'Calculated as 10% of vacancy-adjusted rent. Management companies typically do not charge for months in which the property is vacant.',
    mortgagePI: 'The monthly payment you will make for your mortgage.',
    propertyTaxes: 'Best estimate. The exact amount is determined by the county the home is in, typically only months after you completed your purchase.',
    insurance: 'This is an insurance policy you will purchase from a third-party provider. The mortgage lender requires it. I can recommend the providers who have been giving us the best rates.',
    hoa: 'Most homes belong to an HOA that governs community rules and collects fees from its members to fund its activities, such as lawn care for public areas.',
    cashFlow: 'An estimate of how much you can expect to be left with in the bank every month on average.',
    cashOnCash: 'The amount of cash you gained per year, as a percentage of the total amount you have invested.',
    principalPaydown: 'The part of your monthly mortgage payment that is applied by the lender to actually reduce the amount you owe the bank, rather than to interest.',
    principalPct: 'The principal paid down over a year, shown as a percentage of the total amount invested.',
    appreciation: 'A guess on the percentage of increase in value this property will see on average over the next 5–10 years.',
    leverage: 'Purchase price divided by total invested.',
    modeledReturn: 'A sum of cash-on-cash return, principal paydown per year as a percentage of total invested, and leveraged appreciation.'
  };

  function csvParse(text){
    const rows = [];
    let row = [], field = '', quoted = false;
    for(let i = 0; i < text.length; i++){
      const ch = text[i];
      if(quoted){
        if(ch === '"' && text[i + 1] === '"'){ field += '"'; i++; }
        else if(ch === '"') quoted = false;
        else field += ch;
      } else if(ch === '"') quoted = true;
      else if(ch === ','){ row.push(field); field = ''; }
      else if(ch === '\n'){ row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
    if(field.length || row.length){ row.push(field.replace(/\r$/, '')); rows.push(row); }
    if(!rows.length) return [];
    const headers = rows[0].map(v => String(v || '').trim());
    return rows.slice(1).map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ''])));
  }

  function num(v){
    if(v === undefined || v === null) return NaN;
    const s = String(v).trim();
    if(!s) return NaN;
    const negativeParens = /^\(.*\)$/.test(s);
    const cleaned = s.replace(/[()%,$\sx]/gi, '').replace(/,/g, '');
    const n = Number(cleaned);
    if(!Number.isFinite(n)) return NaN;
    return negativeParens ? -n : n;
  }
  function txt(v){ return String(v ?? '').trim(); }
  function money(n, suffix=''){
    return Number.isFinite(n)
      ? `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', {maximumFractionDigits:0})}${suffix}`
      : '—';
  }
  function pct(n){ return Number.isFinite(n) ? `${n.toFixed(1)}%` : '—'; }
  function multiple(n){ return Number.isFinite(n) ? `x${n.toFixed(1)}` : '—'; }
  function esc(s){
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function infoButton(key){
    const info = INFO[key];
    return info ? `<button type="button" class="info-btn std-info-btn" aria-label="More information" data-info="${esc(info)}">i</button>` : '';
  }
  function noteHtml(note){
    const clean = txt(note);
    return clean ? `<div class="fin-note">${esc(clean)}</div>` : '';
  }
  function rowHtml(label, key, valueKey, noteKey='', extraClass=''){
    return `<div class="fin-item ${extraClass}"><div class="fin-row"><span class="fin-label">${label} ${infoButton(key)}</span><span class="fin-value" data-fin="${valueKey}">—</span></div>${noteKey ? `<div data-note-wrap="${noteKey}"></div>` : ''}</div>`;
  }

  function installStyles(){
    if(document.getElementById('standardFinancialStyles')) return;
    const style = document.createElement('style');
    style.id = 'standardFinancialStyles';
    style.textContent = `
      .std-financials .fin-label{display:flex;align-items:center;gap:6px;}
      .std-financials .purchase-reference .fin-row{justify-content:flex-start;align-items:center;}
      .std-financials .purchase-reference .fin-value{margin-left:12px;padding:4px 9px;border:1px solid var(--border);border-radius:3px;background:var(--surface);font-size:13px;}
      .std-financials .down-payment-formula .fin-value{font-size:13px;}
      .std-financials .std-info-btn{position:relative;background:transparent;padding:0;flex:0 0 auto;line-height:1;}
      .std-financials .std-info-btn::after{content:attr(data-info);display:none;position:absolute;z-index:100;left:22px;top:-8px;width:min(390px,72vw);padding:11px 12px;border:1px solid var(--border);border-radius:4px;background:var(--surface2, var(--surface));color:var(--text);box-shadow:0 10px 28px rgba(0,0,0,.45);font:12px/1.45 Georgia,'Source Serif 4',serif;text-align:left;white-space:normal;text-transform:none;letter-spacing:0;}
      .std-financials .std-info-btn:hover::after,.std-financials .std-info-btn:focus::after,.std-financials .std-info-btn.is-open::after{display:block;}
      .std-financials .fin-note:empty{display:none;}
      @media(max-width:600px){.std-financials .fin-row{align-items:flex-start}.std-financials .fin-value{white-space:normal;text-align:right}.std-financials .std-info-btn::after{position:fixed;left:18px;right:18px;top:auto;bottom:22px;width:auto;}}
    `;
    document.head.appendChild(style);
  }

  function findNumbersSection(){
    return [...document.querySelectorAll('section')].find(section => {
      const label = section.querySelector('.section-label');
      return label && label.textContent.trim().toLowerCase() === 'the numbers';
    });
  }

  function renderFinancialShell(){
    const section = findNumbersSection();
    if(!section) return null;
    section.classList.add('std-financials');
    section.innerHTML = `
      <div class="section-label">The numbers</div>
      <div class="fin-group"><div class="fin-group-title">Acquisition</div>
        ${rowHtml('Purchase price','purchasePrice','purchasePrice','purchasePrice','purchase-reference')}
        ${rowHtml('Down payment','downPayment','downPayment','downPayment','down-payment-formula')}
        ${rowHtml('Closing costs','closingCosts','closingCosts','closingCosts')}
        ${rowHtml('Capital Expenses','capex','capex','capex')}
        <div class="fin-item total"><div class="fin-row"><span class="fin-label">Total invested</span><span class="fin-value" data-fin="totalInvested">—</span></div></div>
      </div>
      <div class="fin-group modeled"><div class="fin-group-title">Financing scenario — modeled</div>
        ${rowHtml('Down payment','downPayment','downPayment','downPayment','down-payment-formula')}
        ${rowHtml('Loan amount','loanAmount','loanAmount','loanAmount')}
        ${rowHtml('Interest rate','interestRate','interestRate','interestRate')}
        ${rowHtml('Mortgage type','mortgageType','mortgageType','mortgageType')}
      </div>
      <div class="fin-group"><div class="fin-group-title">Monthly income</div>
        ${rowHtml('Rent expected','rentExpected','rentExpected','rentExpected')}
      </div>
      <div class="fin-group"><div class="fin-group-title">Monthly expenses</div>
        ${rowHtml('Vacancy loss','vacancyLoss','vacancyLoss','vacancyLoss')}
        ${rowHtml('Property management (10%)','management','management','management')}
        ${rowHtml('Mortgage Principal and Intrest','mortgagePI','mortgagePI','mortgagePI')}
        ${rowHtml('Property taxes','propertyTaxes','propertyTaxes','propertyTaxes')}
        ${rowHtml('Insurance','insurance','insurance','insurance')}
        ${rowHtml('Homeowner Association Dues (HOA)','hoa','hoa','hoa')}
      </div>
      <div class="fin-group returns"><div class="fin-group-title">Returns</div>
        ${rowHtml('Cash flow / month','cashFlow','cashFlow','cashFlow')}
        ${rowHtml('Cash-on-cash return','cashOnCash','cashOnCash','cashOnCash')}
        ${rowHtml('Principal paydown / month','principalPaydown','principalPaydown','principalPaydown')}
        ${rowHtml('Principal paydown/year as % of total invested','principalPct','principalPct','principalPct')}
        ${rowHtml('Modeled appreciation','appreciation','appreciation','appreciation')}
        ${rowHtml('Leverage Multiplying Factor','leverage','leverage','leverage')}
        <div class="fin-item total"><div class="fin-row"><span class="fin-label">Modeled total return ${infoButton('modeledReturn')}</span><span class="fin-value forecast" data-fin="modeledReturn">—</span></div><div class="split-bar"><div class="seg-actual" data-return-segment="operating" style="width:50%"></div><div class="seg-forecast" data-return-segment="forecast" style="width:50%"></div></div><div class="fin-note">green = underwritten operating return (cash flow + principal) · blue = forecast appreciation</div></div>
      </div>
      <div class="pending-flag" id="standardFinancialStatus" style="display:none"></div>`;
    return section;
  }

  function setValue(key, value){
    document.querySelectorAll(`.std-financials [data-fin="${key}"]`).forEach(el => { el.textContent = value; });
  }
  function setNote(key, value){
    document.querySelectorAll(`.std-financials [data-note-wrap="${key}"]`).forEach(el => { el.innerHTML = noteHtml(value); });
  }

  function propertySlug(){
    const explicit = txt(document.body?.dataset?.propertySlug);
    if(explicit) return explicit;
    const parts = location.pathname.split('/').filter(Boolean);
    const i = parts.lastIndexOf('properties');
    return i >= 0 && parts[i + 1] ? parts[i + 1] : '';
  }

  function populate(row){
    const purchasePrice = num(row['Purchase Price']);
    const downPct = num(row['% down']);
    const downPaymentSheet = num(row['Down Payment']);
    const downPayment = Number.isFinite(downPaymentSheet) ? downPaymentSheet : (Number.isFinite(purchasePrice) && Number.isFinite(downPct) ? purchasePrice * downPct / 100 : NaN);
    const closingCosts = num(row['Total Closing Costs']);
    const capex = num(row['Capex']);
    const totalInvested = num(row['Total Invested']);
    const loanAmount = Number.isFinite(purchasePrice) && Number.isFinite(downPayment) ? purchasePrice - downPayment : NaN;
    const rate = num(row['Intrest rate']);
    const mortgageType = txt(row['mortgae type']);
    const rent = num(row['Rent']);
    const vacancyAdjusted = num(row['Avg Rent considering avg vacancy (month)']);
    const vacancyLoss = Number.isFinite(rent) && Number.isFinite(vacancyAdjusted) ? Math.max(0, rent - vacancyAdjusted) : NaN;
    const management = Number.isFinite(vacancyAdjusted) ? vacancyAdjusted * 0.10 : NaN;
    const mortgagePI = num(row['Mortgage P&I (month)']);
    const taxesY = num(row['Taxes/y']);
    const insuranceY = num(row['Insurance/y']);
    const hoaY = num(row['HOA/y']);
    const cashFlow = num(row['Cash remaining after management (month)']);
    const cashOnCash = num(row['Cash on Cash after management']);
    const principalPaydown = num(row['Principal returned (month)']);
    const principalPct = num(row['Principal returned % of invest']);
    const appreciationPct = num(row['appreciation expectations']);
    const leverage = Number.isFinite(purchasePrice) && Number.isFinite(totalInvested) && totalInvested > 0 ? purchasePrice / totalInvested : NaN;
    const leveragedAppreciation = Number.isFinite(appreciationPct) && Number.isFinite(leverage) ? appreciationPct * leverage : NaN;
    const modeledReturn = [cashOnCash, principalPct, leveragedAppreciation].every(Number.isFinite) ? cashOnCash + principalPct + leveragedAppreciation : NaN;

    const downFormula = [downPct, purchasePrice, downPayment].every(Number.isFinite)
      ? `${pct(downPct)} × ${money(purchasePrice)} = ${money(downPayment)}`
      : '—';

    setValue('purchasePrice', money(purchasePrice));
    setValue('downPayment', downFormula);
    setValue('closingCosts', money(closingCosts));
    setValue('capex', money(capex));
    setValue('totalInvested', money(totalInvested));
    setValue('loanAmount', money(loanAmount));
    setValue('interestRate', pct(rate));
    setValue('mortgageType', mortgageType || '—');
    setValue('rentExpected', money(rent, '/mo'));
    setValue('vacancyLoss', money(vacancyLoss, '/mo'));
    setValue('management', money(management, '/mo'));
    setValue('mortgagePI', money(mortgagePI, '/mo'));
    setValue('propertyTaxes', Number.isFinite(taxesY) ? money(taxesY / 12, '/mo') : '—');
    setValue('insurance', Number.isFinite(insuranceY) ? money(insuranceY / 12, '/mo') : '—');
    setValue('hoa', Number.isFinite(hoaY) ? money(hoaY / 12, '/mo') : '—');
    setValue('cashFlow', money(cashFlow, '/mo'));
    setValue('cashOnCash', pct(cashOnCash));
    setValue('principalPaydown', money(principalPaydown, '/mo'));
    setValue('principalPct', pct(principalPct));
    setValue('appreciation', Number.isFinite(appreciationPct) ? `${pct(appreciationPct)}/yr` : '—');
    setValue('leverage', multiple(leverage));
    setValue('modeledReturn', pct(modeledReturn));

    setNote('purchasePrice', row['price notes']);
    setNote('downPayment', row['%down notes']);
    setNote('closingCosts', '');
    setNote('capex', row['capex notes']);
    setNote('loanAmount', '');
    setNote('interestRate', row['intrest rates notes']);
    setNote('mortgageType', '');
    setNote('rentExpected', '');
    setNote('vacancyLoss', '');
    setNote('management', '');
    setNote('mortgagePI', '');
    setNote('propertyTaxes', Number.isFinite(taxesY) ? `${money(taxesY)}/year` : '');
    setNote('insurance', Number.isFinite(insuranceY) ? `${money(insuranceY)}/year` : '');
    setNote('hoa', Number.isFinite(hoaY) ? `${money(hoaY)}/year` : '');
    setNote('cashFlow', '');
    setNote('cashOnCash', '');
    setNote('principalPaydown', '');
    setNote('principalPct', '');
    setNote('appreciation', '');
    setNote('leverage', '');

    const operating = Number.isFinite(cashOnCash) && Number.isFinite(principalPct) ? cashOnCash + principalPct : NaN;
    const total = Number.isFinite(operating) && Number.isFinite(leveragedAppreciation) ? operating + leveragedAppreciation : NaN;
    if(Number.isFinite(total) && total > 0){
      const operatingShare = Math.max(0, Math.min(100, operating / total * 100));
      const op = document.querySelector('.std-financials [data-return-segment="operating"]');
      const fc = document.querySelector('.std-financials [data-return-segment="forecast"]');
      if(op) op.style.width = `${operatingShare}%`;
      if(fc) fc.style.width = `${100 - operatingShare}%`;
    }
  }

  function wireInfoButtons(){
    document.querySelectorAll('.std-financials .std-info-btn').forEach(btn => {
      btn.addEventListener('click', event => {
        event.stopPropagation();
        const opening = !btn.classList.contains('is-open');
        document.querySelectorAll('.std-financials .std-info-btn.is-open').forEach(other => other.classList.remove('is-open'));
        if(opening) btn.classList.add('is-open');
      });
    });
    document.addEventListener('click', () => document.querySelectorAll('.std-financials .std-info-btn.is-open').forEach(btn => btn.classList.remove('is-open')));
  }

  async function init(){
    installStyles();
    if(!renderFinancialShell()) return;
    wireInfoButtons();
    const status = document.getElementById('standardFinancialStatus');
    try{
      const response = await fetch(SHEET_CSV_URL, {cache:'no-store'});
      if(!response.ok) throw new Error(`Spreadsheet request failed (${response.status})`);
      const rows = csvParse(await response.text());
      const slug = propertySlug();
      let row = rows.find(r => txt(r['Property Page Slug']) === slug);
      if(!row && slug === '2253-sam-tillery-drive') row = rows[26]; // spreadsheet row 28 fallback until slug is populated
      if(!row) throw new Error(`No spreadsheet row found for ${slug || 'this property'}`);
      populate(row);
      if(status) status.style.display = 'none';
    } catch(error){
      console.error(error);
      if(status){ status.textContent = 'Could not load the live financial data.'; status.style.display = 'block'; }
    }
  }

  init();
})();
