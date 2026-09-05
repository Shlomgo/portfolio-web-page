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
  // Display policy shared with the portfolio page:
  // money = whole dollars; rates/returns = one decimal.
  function money(n, suffix=''){
    return Number.isFinite(n)
      ? `$${n.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0})}${suffix}`
      : '—';
  }
  function pct(n, suffix='%'){
    if(!Number.isFinite(n)) return '—';
    return `${n.toFixed(1)}${suffix}`;
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
    const status = String(row['Status'] || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
    document.querySelectorAll('.status-pill').forEach(el => {
      el.classList.remove('status-proposed','status-under-contract','status-closed');
      if(status === 'proposed') el.classList.add('status-proposed');
      else if(status === 'under-contract') el.classList.add('status-under-contract');
      else if(status === 'closed') el.classList.add('status-closed');
    });

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

  function applyRamblingBrookEnhancements(){
    if(slug !== '1649-rambling-brook-drive') return;

    if(!document.getElementById('ramblingBrookEnhancementStyles')){
      const style = document.createElement('style');
      style.id = 'ramblingBrookEnhancementStyles';
      style.textContent = `
        .walkthrough-figure{grid-column:2;}
        .video-shell{position:relative;background:#000;min-height:240px;display:flex;align-items:center;justify-content:center;}
        .video-shell video{width:100%;display:block;aspect-ratio:16/9;object-fit:contain;background:#000;}
        .video-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:1px solid rgba(255,255,255,.55);background:rgba(11,12,16,.86);color:var(--text);padding:12px 18px;border-radius:999px;font:12px 'IBM Plex Mono',monospace;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.35);}
        .video-play:hover{border-color:var(--green);color:var(--green);}
        .video-direct{color:var(--green);text-decoration:none;border-bottom:1px solid var(--green-dim);}
        .school-source{font:11px 'IBM Plex Mono',monospace;color:var(--muted);margin:-2px 0 14px;}
        .school-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;}
        .school-card{border:1px solid var(--border);border-radius:4px;background:var(--surface);padding:18px;min-height:210px;}
        .school-top{display:flex;gap:14px;align-items:center;margin-bottom:16px;}
        .school-rating{width:58px;height:58px;border-radius:50%;background:#0d5d52;display:flex;align-items:center;justify-content:center;flex:0 0 58px;font:700 17px 'IBM Plex Mono',monospace;color:#fff;}
        .school-rating span{font-size:11px;font-weight:500;margin-left:1px;}
        .school-name{font-size:16px;line-height:1.25;margin:0 0 4px;}
        .school-meta{font:11px 'IBM Plex Mono',monospace;color:var(--muted);}
        .school-metric{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-top:1px solid var(--border);font-size:13px;}
        .school-metric b{font-family:'IBM Plex Mono',monospace;font-size:12px;white-space:nowrap;}
        .school-note{font-size:12px;color:var(--muted);margin-top:12px;max-width:900px;}
        @media(max-width:860px){.school-grid{grid-template-columns:1fr;}.walkthrough-figure{grid-column:1;}.video-shell{min-height:0;}}
      `;
      document.head.appendChild(style);
    }

    const mediaSection = [...document.querySelectorAll('section')].find(section => {
      const label = section.querySelector('.section-label');
      return label && label.textContent.trim() === 'See it for yourself';
    });

    if(mediaSection){
      const grid = mediaSection.querySelector('.media-grid');
      if(grid){
        const duplicateMapFigure = [...grid.querySelectorAll('figure')].find(figure => {
          const img = figure.querySelector('img');
          return img && String(img.getAttribute('src') || '').endsWith('1649-rambling-brook-lot.jpg');
        });
        if(duplicateMapFigure) duplicateMapFigure.remove();

        const video = grid.querySelector('video');
        const videoFigure = video?.closest('figure');
        if(video && videoFigure){
          videoFigure.classList.add('walkthrough-figure');
          video.setAttribute('controls', '');
          video.setAttribute('playsinline', '');
          video.setAttribute('preload', 'metadata');

          if(!video.closest('.video-shell')){
            const shell = document.createElement('div');
            shell.className = 'video-shell';
            video.parentNode.insertBefore(shell, video);
            shell.appendChild(video);

            const playButton = document.createElement('button');
            playButton.type = 'button';
            playButton.className = 'video-play';
            playButton.textContent = '▶ Play lot walkthrough';
            playButton.setAttribute('aria-label', 'Play lot walkthrough');
            shell.appendChild(playButton);

            playButton.addEventListener('click', () => {
              const promise = video.play();
              if(promise && typeof promise.catch === 'function') promise.catch(() => {});
            });
            video.addEventListener('play', () => { playButton.hidden = true; });
            video.addEventListener('pause', () => { if(!video.ended) playButton.hidden = false; });
            video.addEventListener('ended', () => { playButton.hidden = false; });
          }

          const caption = videoFigure.querySelector('figcaption');
          if(caption && !caption.querySelector('.video-direct')){
            const source = video.querySelector('source')?.getAttribute('src') || 'video/1649-rambling-brook-lot-walkthrough.mp4';
            caption.textContent = 'Lot 388 walkthrough — pre-construction · ';
            const link = document.createElement('a');
            link.className = 'video-direct';
            link.href = source;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = 'open video directly ↗';
            caption.appendChild(link);
          }
        }
      }

      if(!document.getElementById('nearbySchools')){
        const schools = document.createElement('section');
        schools.id = 'nearbySchools';
        schools.innerHTML = `
          <div class="section-label">Nearby schools</div>
          <div class="school-source">Source: GreatSchools®</div>
          <div class="school-grid">
            <article class="school-card">
              <div class="school-top"><div class="school-rating">8<span>/10</span></div><div><h3 class="school-name">Hurricane Creek Elementary School</h3><div class="school-meta">Grades K–5 · 1 mile</div></div></div>
              <div class="school-metric"><span>Test Score Rating</span><b>7/10</b></div>
              <div class="school-metric"><span>Student Progress Rating</span><b>8/10</b></div>
            </article>
            <article class="school-card">
              <div class="school-top"><div class="school-rating">7<span>/10</span></div><div><h3 class="school-name">Bryant Junior High School</h3><div class="school-meta">Grades 8–9 · 3.2 miles</div></div></div>
              <div class="school-metric"><span>Test Score Rating</span><b>9/10</b></div>
              <div class="school-metric"><span>Student Progress Rating</span><b>4/10</b></div>
            </article>
            <article class="school-card">
              <div class="school-top"><div class="school-rating">5<span>/10</span></div><div><h3 class="school-name">Bryant High School</h3><div class="school-meta">Grades 9–12 · 3.5 miles</div></div></div>
              <div class="school-metric"><span>Test Score Rating</span><b>3/10</b></div>
              <div class="school-metric"><span>College Readiness Rating</span><b>10/10</b></div>
              <div class="school-metric"><span>Student Progress Rating</span><b>3/10</b></div>
            </article>
          </div>
          <p class="school-note">Ratings and distances reproduced from the GreatSchools information in the supplied listing screenshot. Ratings and attendance assignments can change; verify current zoning directly with the school district.</p>
        `;
        mediaSection.parentNode.insertBefore(schools, mediaSection);
      }
    }
  }

  applyRamblingBrookEnhancements();

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