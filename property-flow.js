(() => {
  'use strict';

  const STYLE_ID = 'open-book-property-flow-styles';
  const STATE_KEY = 'openBookPropertyTableReturnStateV1';
  const PREVIEW_CACHE = new Map();
  let enhancementQueued = false;
  let restoreState = readRestoreState();
  let restorePreferencesApplied = false;
  let restoreUiApplied = false;

  const css = `
/* Property discovery flow: row -> preview -> full property page */
.sr-only{
  position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;
  overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;
}
.row-toggle{
  appearance:none;border:0;background:transparent;color:var(--text-secondary);padding:4px 2px;margin:-4px 0;
  width:22px;height:28px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;
}
.row-toggle:focus-visible{outline:1px solid #B5A585;outline-offset:2px;}
.row-toggle .chevron{display:inline-block;transition:transform .16s ease,color .16s ease;transform-origin:center;}
tr.data-row.open .row-toggle .chevron{transform:rotate(90deg);color:#B5A585;}
tbody tr.data-row.open{
  background:linear-gradient(90deg,rgba(181,165,133,.075),rgba(181,165,133,.018) 28%,transparent 58%);
}
tbody tr.data-row.open td:first-child{box-shadow:inset 3px 0 0 rgba(181,165,133,.82);}
tbody tr.data-row:focus-within{background-color:rgba(168,166,160,.045);}
.property-page-link,.mp-property-page-link{font-weight:500;text-underline-offset:3px;}

.property-preview{
  display:grid;
  grid-template-columns:minmax(190px,230px) minmax(0,1fr) minmax(185px,220px);
  gap:24px;
  align-items:stretch;
  margin:2px 0 20px;
  padding:18px 0 22px;
  border-top:1px solid rgba(58,61,66,.72);
  border-bottom:1px solid rgba(58,61,66,.72);
  font-family:'Instrument Sans',sans-serif;
}
.property-preview-image-link{
  display:block;min-width:0;text-decoration:none;border:1px solid var(--status-border);background:var(--status-fill);overflow:hidden;
}
.property-preview-image-frame{
  position:relative;width:100%;height:100%;min-height:150px;aspect-ratio:4/3;overflow:hidden;background:var(--status-fill);
}
.property-preview-image-frame img{display:block;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .18s ease;}
.property-preview.loaded .property-preview-image-frame img{opacity:1;}
.property-preview-image-placeholder{
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;text-align:center;
  color:var(--text-secondary);font-family:'IBM Plex Mono',monospace;font-size:9.5px;line-height:1.4;letter-spacing:.03em;
}
.property-preview.loaded .property-preview-image-placeholder{display:none;}
.property-preview.no-image .property-preview-image-link{display:none;}
.property-preview.no-image{grid-template-columns:minmax(0,1fr) minmax(185px,220px);}
.property-preview-copy{min-width:0;align-self:center;}
.property-preview-kicker{
  margin:0 0 7px;color:#B5A585;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;
  letter-spacing:.10em;text-transform:uppercase;
}
.property-preview-title{
  display:inline-block;margin:0 0 7px;color:var(--text-primary);font-family:'Fraunces',serif;font-size:22px;font-weight:500;
  line-height:1.16;text-decoration:none;
}
.property-preview-title:hover{text-decoration:underline;text-decoration-color:#B5A585;text-underline-offset:4px;}
.property-preview-subtitle{margin:0 0 8px;color:var(--text-secondary);font-size:12.5px;line-height:1.45;}
.property-preview-rationale{margin:0;color:var(--text-primary);font-size:13.5px;line-height:1.5;max-width:650px;}
.property-preview-loading{color:var(--text-secondary);}
.property-preview-cta-zone{
  align-self:stretch;display:flex;flex-direction:column;justify-content:center;gap:9px;padding-left:20px;
  border-left:1px solid var(--status-border);min-width:0;
}
.property-preview-cta{
  display:flex;align-items:center;justify-content:center;width:100%;min-height:42px;padding:10px 12px;
  border:1px solid var(--text-secondary);background:transparent;color:var(--text-primary);text-decoration:none;text-align:center;
  font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:500;line-height:1.25;
  transition:background .12s ease,border-color .12s ease,color .12s ease;
}
.property-preview.status-proposed .property-preview-cta{
  border-color:#B5A585;background:rgba(181,165,133,.055);color:#B5A585;
}
.property-preview-cta:hover{border-color:#C8BDA5;background:rgba(181,165,133,.085);color:#C8BDA5;}
.property-preview-cta-note{
  display:block;color:var(--text-secondary);font-family:'IBM Plex Mono',monospace;font-size:9.5px;line-height:1.45;text-align:center;
}
.property-preview-status-note{
  display:block;margin-top:2px;color:var(--text-secondary);font-family:'IBM Plex Mono',monospace;font-size:9px;line-height:1.35;text-align:center;
}

@media (max-width:1120px) and (min-width:761px){
  .property-preview{grid-template-columns:205px minmax(0,1fr);}
  .property-preview-cta-zone{grid-column:2;border-left:0;border-top:1px solid var(--status-border);padding:14px 0 0;display:grid;grid-template-columns:minmax(180px,230px) 1fr;align-items:center;}
  .property-preview-cta-note,.property-preview-status-note{text-align:left;}
  .property-preview.no-image{grid-template-columns:minmax(0,1fr);}
  .property-preview.no-image .property-preview-cta-zone{grid-column:1;}
}

.mp-card{transition:background .14s ease,padding-left .14s ease,padding-right .14s ease;cursor:pointer;}
.mp-card.preview-open{background:rgba(181,165,133,.035);}
.mp-card.preview-open .mp-row1{position:relative;}
.mp-status-toggle{display:flex;align-items:center;gap:8px;flex:0 0 auto;}
.mp-expand-toggle{
  appearance:none;border:0;background:transparent;color:var(--text-secondary);width:24px;height:28px;padding:0;
  display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:13px;
}
.mp-expand-toggle:focus-visible{outline:1px solid #B5A585;outline-offset:2px;}
.mp-expand-toggle .mp-chevron{display:inline-block;transition:transform .16s ease,color .16s ease;}
.mp-card.preview-open .mp-expand-toggle .mp-chevron{transform:rotate(90deg);color:#B5A585;}
.mp-property-preview-panel{display:none;margin-top:16px;}
.mp-card.preview-open .mp-property-preview-panel{display:block;}
.property-preview.property-preview-mobile{
  display:block;margin:0;padding:0 0 16px;border-top:0;border-bottom:1px solid var(--status-border);
}
.property-preview-mobile .property-preview-image-link{margin:0 0 15px;}
.property-preview-mobile .property-preview-image-frame{min-height:0;aspect-ratio:16/10;}
.property-preview-mobile .property-preview-kicker{margin-bottom:6px;}
.property-preview-mobile .property-preview-title{font-size:22px;margin-bottom:7px;}
.property-preview-mobile .property-preview-rationale{font-size:13.5px;}
.property-preview-mobile .property-preview-cta-zone{border-left:0;border-top:1px solid var(--status-border);padding:14px 0 0;margin-top:15px;gap:8px;}
.property-preview-mobile .property-preview-cta{min-height:44px;font-size:11.5px;}
.property-preview-mobile.no-image{display:block;}
.mp-card.preview-open > .mp-property-page-link{color:#C8BDA5;}

@media (max-width:760px){
  .mp-card{cursor:pointer;}
}
`;

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function safeId(value){
    return String(value || '').replace(/[^a-zA-Z0-9_-]+/g, '-');
  }

  function getRecordById(id){
    try{
      if(!Array.isArray(DATA)) return null;
      return DATA.find(d => d.id === id) || null;
    } catch(_err){
      return null;
    }
  }

  function hrefFor(d){
    try{
      if(typeof propertyPageHref === 'function') return propertyPageHref(d);
    } catch(_err){}
    return d && d.pageSlug ? `properties/${encodeURIComponent(d.pageSlug)}/` : '';
  }

  function statusLabelFor(d){
    try{
      if(typeof STATUS_LABEL === 'object' && STATUS_LABEL[d.status]) return STATUS_LABEL[d.status];
    } catch(_err){}
    return d.status === 'proposed' ? 'Recommended + Available' : d.status === 'under_contract' ? 'Under Contract' : 'Closed';
  }

  function concise(text, maxLength = 330){
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if(clean.length <= maxLength) return clean;
    const sentences = clean.match(/[^.!?]+[.!?]+(?:[”"']|$)?/g) || [];
    let out = '';
    for(const sentence of sentences){
      const next = (out + ' ' + sentence.trim()).trim();
      if(next.length > maxLength) break;
      out = next;
    }
    if(out.length >= 100) return out;
    const cut = clean.slice(0, maxLength - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return `${cut.slice(0, Math.max(lastSpace, maxLength - 45)).trim()}…`;
  }

  function createPreviewShell(d, mobile = false){
    const href = hrefFor(d);
    if(!href) return null;

    const wrap = document.createElement('div');
    wrap.className = `property-preview status-${d.status}${mobile ? ' property-preview-mobile' : ''}`;
    wrap.dataset.propertyId = d.id;
    wrap.innerHTML = `
      <a class="property-preview-image-link property-nav-link" href="${href}" aria-label="View full property page for ${d.id}">
        <div class="property-preview-image-frame">
          <span class="property-preview-image-placeholder">Loading property photo…</span>
          <img alt="" loading="lazy" decoding="async">
        </div>
      </a>
      <div class="property-preview-copy">
        <div class="property-preview-kicker">Why this one stands out</div>
        <a class="property-preview-title property-nav-link" href="${href}">${d.id}</a>
        <p class="property-preview-subtitle property-preview-loading">Loading the property-page summary…</p>
        <p class="property-preview-rationale"></p>
      </div>
      <div class="property-preview-cta-zone">
        <a class="property-preview-cta property-nav-link" href="${href}">View Full Property →</a>
        <span class="property-preview-cta-note">Photos, property details &amp; complete analysis</span>
        <span class="property-preview-status-note">${statusLabelFor(d)}</span>
      </div>`;
    return wrap;
  }

  async function fetchPreview(d){
    const href = hrefFor(d);
    if(!href) return null;
    if(PREVIEW_CACHE.has(href)) return PREVIEW_CACHE.get(href);

    const promise = (async () => {
      const response = await fetch(href, {credentials:'same-origin', cache:'force-cache'});
      if(!response.ok) throw new Error(`Property page returned ${response.status}`);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const heroImage = doc.querySelector('.hero-photo img');
      const imageSrc = heroImage ? heroImage.getAttribute('src') : '';
      const imageUrl = imageSrc ? new URL(imageSrc, new URL(href, window.location.href)).href : '';
      const title = (doc.querySelector('h1')?.textContent || d.id).trim();
      const subtitle = (doc.querySelector('.hero-sub')?.textContent || '').replace(/\s+/g, ' ').trim();

      const whySection = Array.from(doc.querySelectorAll('section')).find(section => {
        const label = section.querySelector('.section-label');
        return /why\s+i\s+like|why\s+this/i.test(label?.textContent || '');
      });
      const heroCopy = doc.querySelector('.hero-grid > div:last-child p');
      const rationaleRaw = whySection?.querySelector('p')?.textContent || heroCopy?.textContent || subtitle;

      return {
        title,
        subtitle: concise(subtitle, 185),
        rationale: concise(rationaleRaw, 335),
        imageUrl,
        imageAlt: (heroImage?.getAttribute('alt') || title).trim()
      };
    })().catch(() => ({
      title:d.id,
      subtitle:'Open the full property page for photos, property details and complete analysis.',
      rationale:'',
      imageUrl:'',
      imageAlt:''
    }));

    PREVIEW_CACHE.set(href, promise);
    return promise;
  }

  async function hydratePreview(d, wrap){
    if(!wrap || wrap.dataset.hydrated === 'true' || wrap.dataset.loading === 'true') return;
    wrap.dataset.loading = 'true';
    const data = await fetchPreview(d);
    if(!wrap.isConnected || !data) return;

    const title = wrap.querySelector('.property-preview-title');
    const subtitle = wrap.querySelector('.property-preview-subtitle');
    const rationale = wrap.querySelector('.property-preview-rationale');
    const img = wrap.querySelector('img');

    if(title) title.textContent = data.title || d.id;
    if(subtitle){
      subtitle.textContent = data.subtitle || '';
      subtitle.classList.remove('property-preview-loading');
      if(!subtitle.textContent) subtitle.remove();
    }
    if(rationale){
      rationale.textContent = data.rationale || '';
      if(!rationale.textContent) rationale.remove();
    }

    if(img && data.imageUrl){
      img.alt = data.imageAlt || data.title || d.id;
      img.addEventListener('load', () => wrap.classList.add('loaded'), {once:true});
      img.addEventListener('error', () => wrap.classList.add('no-image'), {once:true});
      img.src = data.imageUrl;
      if(img.complete && img.naturalWidth) wrap.classList.add('loaded');
    } else {
      wrap.classList.add('no-image');
    }

    wrap.dataset.loading = 'false';
    wrap.dataset.hydrated = 'true';
  }

  function analytics(eventName, d, source){
    const payload = {
      event:eventName,
      property_id:d?.id || '',
      property_status:d?.status || '',
      property_slug:d?.pageSlug || '',
      source:source || ''
    };
    if(Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
    window.dispatchEvent(new CustomEvent('openbook:property-interaction', {detail:payload}));
  }

  function readRestoreState(){
    try{
      const parsed = JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null');
      return parsed && parsed.returningFromProperty ? parsed : null;
    } catch(_err){
      return null;
    }
  }

  function snapshotState(d){
    try{
      const desktopOpen = document.querySelector('tr.data-row.open')?.dataset.propertyId || '';
      const mobileOpen = document.querySelector('.mp-card.preview-open')?.dataset.propertyId || '';
      const state = {
        returningFromProperty:true,
        openPropertyId:desktopOpen || mobileOpen || d?.id || '',
        scrollY:window.scrollY,
        sortKey:typeof sortKey !== 'undefined' ? sortKey : null,
        sortDirection:typeof sortDirection !== 'undefined' ? sortDirection : null,
        activeStates:typeof activeStates !== 'undefined' ? Array.from(activeStates) : null,
        activeStatuses:typeof activeStatuses !== 'undefined' ? Array.from(activeStatuses) : null,
        filterRanges:typeof filterRanges !== 'undefined' ? {...filterRanges} : null
      };
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch(_err){}
  }

  function applyRestorePreferences(){
    if(!restoreState || restorePreferencesApplied) return;
    try{
      if(restoreState.sortKey) sortKey = restoreState.sortKey;
      if(restoreState.sortDirection === 'asc' || restoreState.sortDirection === 'desc') sortDirection = restoreState.sortDirection;

      const validStates = new Set(Array.isArray(DATA) ? DATA.map(d => d.state) : []);
      if(Array.isArray(restoreState.activeStates)){
        activeStates = new Set(restoreState.activeStates.filter(s => validStates.has(s)));
      }
      if(Array.isArray(restoreState.activeStatuses)){
        activeStatuses = new Set(restoreState.activeStatuses);
      }
      if(restoreState.filterRanges && typeof restoreState.filterRanges === 'object'){
        filterRanges = {...filterRanges, ...restoreState.filterRanges};
      }
      if(typeof syncFilterPanel === 'function') syncFilterPanel();
      if(typeof updateFilterButtonState === 'function') updateFilterButtonState();
    } catch(_err){}
    restorePreferencesApplied = true;
  }

  function updateDesktopToggleState(tr, expanded){
    const btn = tr.querySelector('.row-toggle');
    if(!btn) return;
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    btn.setAttribute('aria-label', `${expanded ? 'Hide' : 'Show'} property details for ${tr.dataset.propertyId || 'this property'}`);
  }

  function closeAllDesktopRows(except = null){
    document.querySelectorAll('tr.data-row.open').forEach(row => {
      if(row === except) return;
      row.classList.remove('open');
      updateDesktopToggleState(row, false);
    });
    document.querySelectorAll('tr.detail-row.open').forEach(row => row.classList.remove('open','lev-row-open'));
    document.querySelectorAll('.predicted-cell.open').forEach(el => el.classList.remove('open'));
  }

  function toggleDesktopRow(tr, d, detailTr, forceOpen = null, shouldTrack = true){
    const willOpen = forceOpen === null ? !tr.classList.contains('open') : !!forceOpen;
    closeAllDesktopRows(willOpen ? tr : null);

    if(willOpen){
      tr.classList.add('open');
      detailTr.classList.add('open');
      updateDesktopToggleState(tr, true);
      const preview = detailTr.querySelector('.property-preview');
      if(preview) hydratePreview(d, preview);
      if(shouldTrack) analytics('property_row_expanded', d, 'desktop_row');
    } else {
      tr.classList.remove('open');
      detailTr.classList.remove('open');
      updateDesktopToggleState(tr, false);
    }
  }

  function enhanceDesktop(){
    document.querySelectorAll('#tableBody tr.data-row').forEach(tr => {
      if(tr.dataset.propertyFlowEnhanced === 'true') return;
      const id = (tr.querySelector('.id-cell')?.textContent || '').trim();
      const d = getRecordById(id);
      const levTr = tr.nextElementSibling;
      const detailTr = levTr?.nextElementSibling;
      if(!d || !detailTr?.classList.contains('detail-row')) return;

      tr.dataset.propertyId = d.id;
      tr.dataset.propertyFlowEnhanced = 'true';
      detailTr.id = `property-details-${safeId(d.id)}`;
      detailTr.dataset.propertyId = d.id;

      const firstCell = tr.cells[0];
      if(firstCell){
        firstCell.classList.add('chevron-col');
        firstCell.innerHTML = `<button type="button" class="row-toggle" aria-expanded="false" aria-controls="${detailTr.id}" aria-label="Show property details for ${d.id}"><span class="chevron" aria-hidden="true">▶</span><span class="sr-only">Show property details</span></button>`;
      }

      const directLink = tr.querySelector('.property-page-link');
      if(directLink){
        directLink.textContent = 'Full property →';
        directLink.title = 'Open the full property page';
      }

      const receipt = detailTr.querySelector('.receipt');
      if(receipt && hrefFor(d) && !receipt.querySelector('.property-preview')){
        receipt.querySelectorAll('.receipt-property-page-cta-wrap').forEach(el => el.remove());
        const preview = createPreviewShell(d, false);
        const title = receipt.querySelector('.receipt-title');
        if(preview) title ? title.insertAdjacentElement('afterend', preview) : receipt.prepend(preview);
      }

      tr.onclick = event => {
        if(event.target.closest('a, .predicted-cell, .info-dot, .fx-dot, button:not(.row-toggle)')) return;
        toggleDesktopRow(tr, d, detailTr);
      };
    });
  }

  function closeAllMobileCards(except = null){
    document.querySelectorAll('.mp-card.preview-open').forEach(card => {
      if(card === except) return;
      card.classList.remove('preview-open');
      const toggle = card.querySelector('.mp-expand-toggle');
      if(toggle) toggle.setAttribute('aria-expanded','false');
      card.querySelectorAll('.mp-detail.open').forEach(detail => detail.classList.remove('open'));
    });
  }

  function toggleMobileCard(card, d, forceOpen = null, shouldTrack = true){
    const willOpen = forceOpen === null ? !card.classList.contains('preview-open') : !!forceOpen;
    closeAllMobileCards(willOpen ? card : null);
    const toggle = card.querySelector('.mp-expand-toggle');
    if(willOpen){
      card.classList.add('preview-open');
      if(toggle) toggle.setAttribute('aria-expanded','true');
      const preview = card.querySelector('.property-preview');
      if(preview) hydratePreview(d, preview);
      if(shouldTrack) analytics('property_row_expanded', d, 'mobile_card');
    } else {
      card.classList.remove('preview-open');
      if(toggle) toggle.setAttribute('aria-expanded','false');
    }
  }

  function enhanceMobile(){
    document.querySelectorAll('#mobilePropertyList .mp-card').forEach(card => {
      if(card.dataset.propertyFlowEnhanced === 'true') return;
      const id = (card.querySelector('.mp-id')?.textContent || '').trim();
      const d = getRecordById(id);
      if(!d) return;

      card.dataset.propertyId = d.id;
      card.dataset.propertyFlowEnhanced = 'true';
      const panelId = `mobile-property-preview-${safeId(d.id)}`;

      const row1 = card.querySelector('.mp-row1');
      const badge = row1?.querySelector('.status-badge');
      if(row1 && badge){
        const group = document.createElement('span');
        group.className = 'mp-status-toggle';
        badge.replaceWith(group);
        group.appendChild(badge);
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'mp-expand-toggle';
        toggle.setAttribute('aria-expanded','false');
        toggle.setAttribute('aria-controls',panelId);
        toggle.setAttribute('aria-label',`Show property preview for ${d.id}`);
        toggle.innerHTML = '<span class="mp-chevron" aria-hidden="true">▶</span>';
        group.appendChild(toggle);
      }

      const directLink = card.querySelector('.mp-property-page-link');
      if(directLink){
        directLink.textContent = 'Full property →';
        directLink.title = 'Open the full property page';
      }

      if(hrefFor(d)){
        card.querySelectorAll('.mp-property-page-cta-wrap').forEach(el => el.remove());
        const panel = document.createElement('div');
        panel.id = panelId;
        panel.className = 'mp-property-preview-panel';
        const preview = createPreviewShell(d, true);
        if(preview) panel.appendChild(preview);
        const bar = card.querySelector('.mp-bar');
        const actions = card.querySelector('.mp-actions');
        if(bar) bar.insertAdjacentElement('afterend', panel);
        else if(actions) actions.insertAdjacentElement('beforebegin', panel);
        else card.appendChild(panel);
      }

      card.addEventListener('click', event => {
        if(event.target.closest('a, button:not(.mp-expand-toggle), .info-dot, .fx-dot')) return;
        toggleMobileCard(card, d);
      });
    });
  }

  function applyRestoreUi(){
    if(!restoreState || !restorePreferencesApplied || restoreUiApplied) return;
    const id = restoreState.openPropertyId;
    if(id){
      if(window.innerWidth > 760){
        const tr = Array.from(document.querySelectorAll('#tableBody tr.data-row')).find(row => row.dataset.propertyId === id);
        const d = getRecordById(id);
        const detailTr = tr?.nextElementSibling?.nextElementSibling;
        if(tr && d && detailTr) toggleDesktopRow(tr, d, detailTr, true, false);
      } else {
        const card = Array.from(document.querySelectorAll('#mobilePropertyList .mp-card')).find(el => el.dataset.propertyId === id);
        const d = getRecordById(id);
        if(card && d) toggleMobileCard(card, d, true, false);
      }
    }

    const y = Number(restoreState.scrollY);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if(Number.isFinite(y)) window.scrollTo(0, y);
      try{
        sessionStorage.setItem(STATE_KEY, JSON.stringify({...restoreState, returningFromProperty:false}));
      } catch(_err){}
      restoreUiApplied = true;
      restoreState = null;
    }));
  }

  function enhanceAll(){
    enhancementQueued = false;
    enhanceDesktop();
    enhanceMobile();
    applyRestoreUi();
  }

  function queueEnhance(){
    if(enhancementQueued) return;
    enhancementQueued = true;
    requestAnimationFrame(enhanceAll);
  }

  function wrapRenderForRestore(){
    try{
      if(typeof render !== 'function' || render.__propertyFlowWrapped) return;
      const originalRender = render;
      const wrapped = function(...args){
        if(restoreState && !restorePreferencesApplied && Array.isArray(DATA) && DATA.length){
          applyRestorePreferences();
        }
        const result = originalRender.apply(this, args);
        queueEnhance();
        return result;
      };
      wrapped.__propertyFlowWrapped = true;
      render = wrapped;
    } catch(_err){}
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if(!link) return;
    const isPropertyLink = link.classList.contains('property-page-link') ||
      link.classList.contains('mp-property-page-link') ||
      link.classList.contains('property-nav-link') ||
      link.classList.contains('receipt-property-page-cta') ||
      link.classList.contains('mp-property-page-cta');
    if(!isPropertyLink) return;

    const holder = link.closest('[data-property-id]');
    const id = holder?.dataset.propertyId || link.closest('tr.data-row')?.dataset.propertyId || '';
    const d = getRecordById(id);
    if(!d) return;
    snapshotState(d);
    const source = link.classList.contains('property-preview-image-link') ? 'preview_photo' :
      link.classList.contains('property-preview-title') ? 'preview_title' :
      link.classList.contains('property-preview-cta') ? 'preview_cta' :
      link.classList.contains('property-page-link') ? 'desktop_direct_link' :
      link.classList.contains('mp-property-page-link') ? 'mobile_direct_link' : 'property_link';
    analytics('property_page_opened', d, source);
  }, true);

  const observer = new MutationObserver(queueEnhance);
  const tableBody = document.getElementById('tableBody');
  const mobileList = document.getElementById('mobilePropertyList');
  if(tableBody) observer.observe(tableBody, {childList:true});
  if(mobileList) observer.observe(mobileList, {childList:true});

  injectStyles();
  wrapRenderForRestore();
  queueEnhance();
})();
